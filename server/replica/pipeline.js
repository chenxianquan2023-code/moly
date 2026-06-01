/**
 * 一键复刻流水线 v2 —— 「带货导演」式分镜生成
 * 思路：LLM 当导演 → 按商品品类出分镜脚本(口播+画面+运动+是否出模特) →
 *       逐镜生成"演示该商品"的画面(image) → animate(video) → 配音 + ASS字幕 + 合成。
 * 卖货逻辑：水杯/数码/家居→介绍产品本身(特写/内部/倒水/开合)；服装鞋包→模特展示版型适配。
 *
 * 优雅降级：任何 AI 步失败都不崩，尽量出片；外部调用均带重试。
 */
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { insertRow, getById } from '../lib/supabase.js';
import { uploadBuffer, makePath } from '../lib/storage.js';
import * as ff from './ai/ffmpeg.js';
import * as gemini from './ai/gemini.js';
import * as llm from './ai/llm.js';
import * as kling from './ai/kling.js';
import * as seedance from './ai/seedance.js';
import * as image from './ai/image.js';
import { synthesize as ttsSynthesize } from './ai/tts.js';
import { resolveVoice } from './voices.js';

async function download(url, dest, retries = 4) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(120000) });
      if (!r.ok) throw new Error(`下载失败 ${r.status}`);
      writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
      return dest;
    } catch (e) { lastErr = e; await new Promise((rr) => setTimeout(rr, 500 * (i + 1))); }
  }
  throw lastErr;
}

function assTime(sec) {
  const cs = Math.floor((sec % 1) * 100);
  const s = Math.floor(sec) % 60, m = Math.floor(sec / 60) % 60, h = Math.floor(sec / 3600);
  const p = (n) => String(n).padStart(2, '0');
  return `${h}:${p(m)}:${p(s)}.${p(cs)}`;
}

/** 生成带样式的 ASS 字幕（大字号、描边、底部居中、长句自动换行） */
function buildAss(scenes, durations) {
  const head = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, Outline, Shadow, Alignment, MarginL, MarginR, MarginV
Style: D,PingFang SC,44,&H00FFFFFF,&H00000000,&H90000000,1,3,1,2,80,80,150

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  let cur = 0;
  const lines = scenes.map((s, i) => {
    const start = assTime(cur); cur += durations[i]; const end = assTime(cur);
    const text = String(s.text || '').replace(/\r?\n/g, ' ').trim();
    return `Dialogue: 0,${start},${end},D,,0,0,0,,${text}`;
  });
  return head + lines.join('\n') + '\n';
}

const TEMPLATE = (name) => ([
  { type: 'hook', text: `Stop scrolling — you need to see ${name}!`, visual: '商品吸睛特写，突出外观质感', motion: '镜头缓慢推近商品', withModel: false },
  { type: 'demo', text: `Here's why everyone's obsessed with it.`, visual: '展示商品核心使用场景与卖点细节', motion: '演示商品功能、细节特写', withModel: false },
  { type: 'cta', text: `Tap the link and grab yours today!`, visual: '模特手持商品微笑推荐', motion: '模特竖起大拇指', withModel: true },
]);

export async function runReplicaPipeline(task, ctx) {
  const work = mkdtempSync(join(tmpdir(), 'moly-gen-'));
  const steps = [
    { capability: 'analyze', label: '解析爆款视频', status: 'pending' },
    { capability: 'script', label: '导演分镜脚本', status: 'pending' },
    { capability: 'tts', label: '生成配音字幕', status: 'pending' },
    { capability: 'replica', label: '逐镜生成画面', status: 'pending' },
    { capability: 'compose', label: '合成最终视频', status: 'pending' },
  ];
  const notes = [];
  const setStep = async (i, patch) => {
    steps[i] = { ...steps[i], ...patch };
    await ctx.setSteps([...steps]);
    const done = steps.filter((s) => ['succeeded', 'skipped', 'failed'].includes(s.status)).length;
    await ctx.setProgress((done / steps.length) * 100);
  };

  try {
    const input = task.input_json || {};
    const opts = task.options_json || {};
    const assets = input.assets || {};
    const product = input.product || {};
    const lang = opts.language || 'zh-CN';
    const LANG_NAMES = { 'zh-CN': '简体中文', 'en-US': 'English（英文）', 'ja-JP': '日本語（日文）', 'es-ES': 'Español（西班牙语）' };
    const langName = LANG_NAMES[lang] || lang;
    const langRule = `【语言硬性要求·最高优先级】所有镜头的口播 text 必须用「${langName}」书写：${lang === 'en-US' ? '纯英文，不得出现任何汉字' : lang === 'ja-JP' ? '纯日文，不得夹简体中文' : lang === 'es-ES' ? '纯西班牙语，不得夹中文/汉字' : '简体中文'}。visual/motion 字段仍用中文（仅供生成画面，不影响口播语言）。`;

    const urlOf = async (id) => (id ? (await getById('assets', id))?.file_url || null : null);
    const productUrl = await urlOf(assets.product_image_id);
    const modelUrl = await urlOf(assets.model_image_id);
    const baseImageUrl = modelUrl || productUrl || input.previewUrl || null;

    // 识别商品（即使用户没填，也让导演/文案知道这是什么货 + 品类）
    let productDesc = '';
    try {
      if (productUrl && gemini.isConfigured()) {
        productDesc = (await gemini.analyzeImages('用一句话描述这个电商商品：品类 + 外观 + 核心卖点，简洁中文', [productUrl])).trim().slice(0, 240);
      }
    } catch (e) { notes.push('商品识别降级: ' + String(e.message || e).split('\n')[0]); }

    // ── 1. 解析爆款视频（有源视频时分析其分镜结构，供导演参考）──
    await setStep(0, { status: 'running' });
    let analysis = null;
    try {
      if (task.source_video_id && gemini.isConfigured()) {
        const sv = await getById('source_videos', task.source_video_id);
        const svAsset = sv?.asset_id ? await getById('assets', sv.asset_id) : null;
        if (svAsset?.file_url) {
          const vpath = await download(svAsset.file_url, join(work, 'src.mp4'));
          const svMeta = await ff.probe(vpath);
          const sdur = svMeta.duration || 30;
          const fps = Math.min(1, Math.max(0.05, 14 / sdur)); // 自适应：跨整段均匀抽~14帧，覆盖全片而非只看开头
          await ff.extractFrames(vpath, join(work, 'f_%03d.jpg'), fps);
          const frames = readdirSync(work).filter((f) => f.startsWith('f_')).sort().slice(0, 16).map((f) => readFileSync(join(work, f)));
          const txt = await gemini.analyzeImages(
            `这是一条电商带货短视频按时间顺序均匀抽取的帧(覆盖全片，约${Math.round(sdur)}秒)。请按真实分镜逐镜拆解，输出 JSON：` +
            `{"durationSec":总时长,"shots":[{"shotType":"特写/近景/中景/全景/文字图形","camera":"推近/拉远/摇/移/手持晃/固定","subject":"主体","hasPerson":"none/hand/full","action":"具体动作","role":"hook/demo/proof/cta","purpose":"带货目的"}],"style":"整体风格与节奏一句话"}。只输出 JSON。`, frames);
          analysis = gemini.parseJson(txt);
        }
      }
    } catch (e) { notes.push('解析降级: ' + String(e.message || e).split('\n')[0]); }
    await setStep(0, { status: (task.source_video_id && analysis?.shots?.length) ? 'succeeded' : 'skipped', note: analysis?.shots?.length ? `复刻源视频 ${analysis.shots.length} 个分镜` : '无源视频/默认结构' });

    // ── 2. 导演分镜脚本（口播 + 画面 + 运动 + 是否出模特）──
    await setStep(1, { status: 'running' });
    let scenes = null;
    try {
      if (llm.isConfigured()) {
        const hasSrc = Array.isArray(analysis?.shots) && analysis.shots.length;
        const tone = (hasSrc && analysis.tone) ? String(analysis.tone) : '活泼种草';
        const formal = /正式|专业/.test(tone);
        const common = `${langRule}\n商品：${product.name ? product.name + '；' : ''}${productDesc || '(见参考图)'}。${product.sellingPoints?.length ? '卖点：' + product.sellingPoints.join('、') + '。' : ''}`;
        // 关键约束：每镜是"静态图+轻运镜"短片，演不出复杂动作 → 文案只说画面能展示的状态/卖点，避免文案与画面对不上
        const realityRule = `【非常重要】每个分镜是由一张静态图生成的约3-5秒短片，只能做缓慢推近/轻移/轻微旋转等"轻运镜"，演不出"拧开盖子/倒水/翻转/手部操作"等复杂动作。所以：(a) visual 要拍"一个有说服力的状态/瞬间"(例：盖子已拧开摆在旁、露出内胆与厚密封圈；产品细节微距；模特手持商品微笑)，不要写动作过程；(b) 文案只描述画面看得到的状态/卖点，绝不承诺画面演不出的动作——例如别写"拧开超顺滑"(演不出拧)，改成"密封圈厚实、倒提都不漏"这种描述状态/结果的说法。`;
        const lenHint = lang === 'en-US' ? '英文≤12词' : lang === 'ja-JP' ? '日文≤18字' : lang === 'es-ES' ? '西语≤14词' : '中文≤16字';
        const copyRule = `文案语气严格匹配${hasSrc ? `源视频基调【${tone}】` : '【活泼种草】'}：${formal ? '专业可信、干净利落、有说服力' : '口语化、有网感、像真人博主安利'}。每句口播极简短(${lenHint}，约3-5秒念完)，且必须与该镜 visual 强相关(说画面里看得到的东西)，绝不答非所问、绝不生硬广告腔。`;
        // 融入 ai-creative-ad-engine 的爆款文案规律（用所选语言的地道表达，不堆砌、不失真）
        const punchRule = `【爆款文案张力】(a) hook(第1句)必须强钩子——用好奇/反差/痛点共鸣抓住前3秒，让人停止划走，绝不平铺直叙介绍商品；(b) 适度用「${langName}」里地道的情绪/网感词(如英文 obsessed/game-changer/trust me，中文 绝了/真香/谁懂啊)，激发"想分享"，但每句最多1个、不堆砌、不浮夸失真；(c) proof 句给一个可信的"为什么"(数字/对比/真实使用感)；(d) cta 句给明确行动指令+轻微紧迫感(别太硬)；(e) 始终遵守上面的"只说画面演得出的状态"铁律。`;
        const fmt = `输出 JSON 数组，每项：{"type":"hook|demo|proof|cta","text":"口播文案(必须用${langName}！极简短一句，与visual强相关)","visual":"这一镜要拍的有说服力的状态/画面(具体中文，主角是本商品)","motion":"轻运镜描述(如缓慢推近/轻移/轻微旋转)","withModel":true或false}。只输出 JSON。`;
        let prompt;
        if (hasSrc) {
          prompt = `你是电商带货短视频导演。任务：【复刻】下面这条爆款视频的拍法与节奏，把主角换成用户的商品，做一条"同款风格"的带货片。\n${common}\n` +
            `源爆款分镜(按时间顺序)：${JSON.stringify(analysis.shots).slice(0, 1400)}\n源视频基调：${tone}；节奏：${analysis.pacing || '中'}。\n` +
            `复刻规则：\n1. 【按源视频分镜顺序与节奏逐镜复刻】沿用每镜的镜头类型、运镜、角色(role)与大致时长占比，分镜数贴合源视频(最多6镜)。\n` +
            `2. 主体换成【用户的商品】：源镜纯产品/特写→拍本商品对应特写或细节；源镜"手+产品"的操作演示→改拍该操作的"结果状态"(如盖子已打开露出内胆)，withModel=false；源镜完整真人→模特出镜手持/使用本商品，withModel=true。\n` +
            `3. 源视频纯文字/图形镜→复刻为"本商品英雄特写 + 醒目大字口播"。\n` +
            `4. ${realityRule}\n5. ${copyRule}\n6. ${punchRule}\n7. ${fmt}`;
        } else {
          prompt = `你是电商带货短视频导演。${common}` +
            `\n按"卖货逻辑"设计一条 ${lang} 带货短视频的3-4个分镜(hook/demo/proof/cta)。规则：` +
            `\n1. 结合品类：水杯/数码/家居→展示产品本身(英雄特写、细节微距、内部结构、卖点状态)；服装鞋包→模特展示版型。各镜画面不同、层层递进。` +
            `\n2. ${realityRule}\n3. ${copyRule}` +
            `\n4. withModel：重产品品类演示镜用纯商品(false)并安排1个模特镜(true)；重模特品类多数 true。\n5. ${punchRule}\n6. ${fmt}`;
        }
        const txt = await llm.generateText(prompt);
        scenes = llm.parseJson(txt);
      }
    } catch (e) { notes.push('导演降级: ' + String(e.message || e).split('\n')[0]); }
    if (!Array.isArray(scenes) || !scenes.length) {
      scenes = TEMPLATE(product.name || productDesc || 'this product');
      await setStep(1, { status: llm.isConfigured() ? 'failed' : 'skipped', note: '降级:模板分镜' });
    } else {
      scenes = scenes.slice(0, 6).map((s) => ({ type: s.type || 'demo', text: String(s.text || ''), visual: String(s.visual || s.text || ''), motion: String(s.motion || ''), withModel: !!s.withModel }));
      // 上传了模特却一个模特镜都没有 → 强制末镜(cta)出模特，保证模特出镜
      if (modelUrl && !scenes.some((s) => s.withModel)) {
        const last = scenes[scenes.length - 1];
        last.withModel = true;
        if (!/模特/.test(last.visual)) last.visual = '模特手持商品、微笑看镜头推荐，' + last.visual;
      }
      await setStep(1, { status: 'succeeded' });
    }

    // ── 3. 配音(逐镜 TTS) + 时长 ──（用户可选"不配 AI 音，自己后期配"）
    await setStep(2, { status: 'running' });
    const sceneAudios = [];
    let ttsOk = false;
    const wantVoice = opts.generate_voice !== false;
    if (!wantVoice) {
      // 不配 AI 音：每镜给足时长(便于自己念旁白)，只出画面 + 字幕脚本
      scenes.forEach(() => sceneAudios.push({ path: null, duration: 4 }));
      await setStep(2, { status: 'skipped', note: '未配 AI 音（输出脚本供你自己配）' });
    } else {
      const voiceCfg = resolveVoice(opts.ttsVoice || process.env.TTS_VOICE || 'presenter_female');
      try {
        for (let i = 0; i < scenes.length; i++) {
          const buf = await ttsSynthesize(scenes[i].text, voiceCfg);
          const ap = join(work, `a_${i}.mp3`);
          writeFileSync(ap, buf);
          sceneAudios.push({ path: ap, duration: (await ff.probe(ap)).duration || 3 });
        }
        ttsOk = true;
        await setStep(2, { status: 'succeeded' });
      } catch (e) {
        notes.push('配音降级(无声): ' + String(e.message || e).split('\n')[0]);
        sceneAudios.length = 0;
        scenes.forEach(() => sceneAudios.push({ path: null, duration: 4 }));
        await setStep(2, { status: 'failed', note: '降级:无配音' });
      }
    }

    // ── 4. 逐镜生成画面：每镜生成"演示该商品"的图 → animate ──
    await setStep(3, { status: 'running' });
    const provDefs = {
      seedance: seedance.isConfigured() ? { name: 'Seedance', run: (img, p, d) => seedance.imageToVideo(img, p, { duration: d }) } : null,
      kling: kling.isConfigured() ? { name: 'Kling', run: (img, p, d) => kling.imageToVideo(img, p, { duration: String(d) }) } : null,
    };
    // 用户选「高级·可灵」→ 真人/全部镜优先可灵；否则标准档 Seedance 优先(产品镜快)、可灵兜底
    const vorder = (opts.models?.video === 'kling') ? ['kling', 'seedance'] : ['seedance', 'kling'];
    const videoProviders = vorder.map((k) => provDefs[k]).filter(Boolean);
    let usedAI = false, usedProvider = '';

    const makeScene = async (i) => {
      const s = scenes[i];
      const dur = Math.max(2, Math.ceil(sceneAudios[i].duration));
      const d = dur > 5 ? 10 : 5;
      const vp = join(work, `v_${i}.mp4`);

      // 4.1 这一镜的演示画面（按 visual + 是否出模特，保持商品/模特一致）
      let animBase = null;
      if ((productUrl || modelUrl) && image) {
        try {
          const refs = (s.withModel && modelUrl) ? [modelUrl, productUrl].filter(Boolean) : [productUrl || modelUrl].filter(Boolean);
          const isZh = lang === 'zh-CN';
          const styleCue = isZh ? '电商带货竖版图(9:16)' : '电商带货竖版海报图(9:16)';
          // 融入 ai-creative-ad-engine 的「品质 / 反AI感 / 氛围」关键词：提升高级感、降低 AI 廉价图痕迹
          const qualityCue = '商业广告摄影质感、专业布光、浅景深、细节丰富；真实材质纹理、自然光线散射、真实的阴影层次、轻微胶片颗粒感、不完美但真实（避免蜡像感/塑料感/六指畸形）；构图高级克制、不廉价';
          const textRule = isZh ? '' : `画面可叠加少量、简短的「${langName}」海报文字点缀（卖点关键词/型号/NEW/折扣数字等），营造带货海报感；但硬性要求：①只用极简短的词或短语、拼写准确，绝不写长句或段落；②复杂介绍交给字幕；③画面里绝对不出现中文/汉字。`;
          const prompt = `${styleCue}：${s.visual}。商品外观必须与参考图保持一致、清晰可见${s.withModel && modelUrl ? '；模特外貌保持一致' : '；以商品为主角'}。光线明亮、背景干净、电商质感。${qualityCue}。${textRule}`;
          const c = await image.generate(prompt, refs, { aspectRatio: '9:16', provider: opts.models?.image });
          animBase = await uploadBuffer(makePath(task.user_email, 'scene', `s${i}.png`), c.buffer, c.mimeType);
        } catch (e) { notes.push(`场景${i + 1}画面合成降级: ` + String(e.message || e).split('\n')[0].slice(0, 80)); }
      }
      if (!animBase) animBase = (s.withModel ? (modelUrl || productUrl) : (productUrl || modelUrl)) || baseImageUrl;

      // 4.2 animate（运动按 motion；级联 Seedance→Kling）
      if (animBase) {
        const motionPrompt = `${s.motion || s.visual}`.slice(0, 180);
        for (const prov of videoProviders) {
          try {
            const url = await prov.run(animBase, motionPrompt, d);
            await download(url, vp);
            usedAI = true; usedProvider = prov.name;
            return vp;
          } catch (e) { notes.push(`场景${i + 1} ${prov.name}失败: ` + String(e.message || e).split('\n')[0].slice(0, 80)); }
        }
        // 视频失败 → Ken Burns 缓慢推近运镜（静态图也"动"起来，不依赖 AI 视频、100%可靠）
        try {
          const ip = join(work, `img_${i}.jpg`);
          await download(animBase, ip);
          const frames = Math.max(30, dur * 30);
          await ff.ffmpeg(['-y', '-loop', '1', '-i', ip, '-t', String(dur), '-r', '30', '-pix_fmt', 'yuv420p',
            '-vf', `scale=2160:3840:force_original_aspect_ratio=increase,crop=2160:3840,zoompan=z='min(zoom+0.0012,1.2)':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30,setsar=1`, vp]);
          return vp;
        } catch (e) {
          notes.push(`场景${i + 1}运镜降级失败,回退静态: ` + String(e.message || e).split('\n')[0]);
          try {
            const ip2 = join(work, `imgf_${i}.jpg`);
            await download(animBase, ip2);
            await ff.ffmpeg(['-y', '-loop', '1', '-i', ip2, '-t', String(dur), '-r', '30', '-pix_fmt', 'yuv420p',
              '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black,setsar=1', vp]);
            return vp;
          } catch (e2) { notes.push(`场景${i + 1}静态降级: ` + String(e2.message || e2).split('\n')[0]); }
        }
      }
      await ff.ffmpeg(['-y', '-f', 'lavfi', '-i', `color=c=0x111827:s=1080x1920:d=${dur}:r=30`, '-pix_fmt', 'yuv420p', vp]);
      return vp;
    };

    const sceneVideos = await Promise.all(scenes.map((_, i) => makeScene(i)));
    await setStep(3, { status: usedAI ? 'succeeded' : 'skipped', note: usedAI ? `视频源: ${usedProvider}` : '降级:静态画面' });

    // ── 5. 合成：拼接 + 配音 + ASS字幕 + 封面 ──
    await setStep(4, { status: 'running' });
    // 把每镜视频裁到它自己配音的时长，避免拼接后总视频远长于音频、被 -shortest 截掉后面的镜（模特镜消失的根因）
    const trimmed = [];
    for (let i = 0; i < sceneVideos.length; i++) {
      const t = join(work, `vt_${i}.mp4`);
      try {
        await ff.ffmpeg(['-y', '-i', sceneVideos[i], '-t', String(Math.max(1.2, sceneAudios[i].duration)), '-an', '-r', '30', '-pix_fmt', 'yuv420p', t]);
        trimmed.push(t);
      } catch { trimmed.push(sceneVideos[i]); }
    }
    const concatPath = join(work, 'concat.mp4');
    if (trimmed.length === 1) await ff.toVertical(trimmed[0], concatPath);
    else await ff.concatVideo(trimmed, concatPath);

    // ASS 字幕（大字号、描边、底部居中、自动换行）
    const ass = buildAss(scenes, sceneAudios.map((a) => a.duration));
    writeFileSync(join(work, 'subs.ass'), ass);
    // 同时存一份 srt 供下载
    let cur = 0;
    const srt = scenes.map((s, i) => {
      const t = (x) => { const p = (n, l = 2) => String(n).padStart(l, '0'); const ms = Math.floor((x % 1) * 1000); return `${p(Math.floor(x / 3600))}:${p(Math.floor(x / 60) % 60)}:${p(Math.floor(x) % 60)},${p(ms, 3)}`; };
      const seg = `${i + 1}\n${t(cur)} --> ${t(cur + sceneAudios[i].duration)}\n${s.text}\n`;
      cur += sceneAudios[i].duration; return seg;
    }).join('\n');
    writeFileSync(join(work, 'subs.srt'), srt);

    let staged = concatPath;
    if (ttsOk) {
      const alist = join(work, 'alist.txt');
      writeFileSync(alist, sceneAudios.map((a) => `file '${a.path}'`).join('\n'));
      const voice = join(work, 'voice.mp3');
      await ff.ffmpeg(['-y', '-f', 'concat', '-safe', '0', '-i', alist, '-c', 'copy', voice]);
      const av = join(work, 'av.mp4');
      await ff.addAudio(concatPath, voice, av);
      staged = av;
    }

    const finalPath = join(work, 'final.mp4');
    let burned = false;
    if (opts.generate_subtitle !== false) {
      try { await ff.burnSubtitles(staged, 'subs.ass', finalPath, { cwd: work }); burned = true; }
      catch (e) { notes.push('字幕烧录降级: ' + String(e.message || e).split('\n')[0]); }
    }
    if (!burned) await ff.ffmpeg(['-y', '-i', staged, '-c', 'copy', finalPath]);

    const coverPath = join(work, 'cover.jpg');
    await ff.thumbnail(finalPath, coverPath, 0);
    const meta = await ff.probe(finalPath);

    const videoUrl = await uploadBuffer(makePath(task.user_email, 'generated', 'video.mp4'), readFileSync(finalPath), 'video/mp4');
    const coverUrl = await uploadBuffer(makePath(task.user_email, 'generated', 'cover.jpg'), readFileSync(coverPath), 'image/jpeg');
    const subtitleUrl = await uploadBuffer(makePath(task.user_email, 'generated', 'subs.srt'), readFileSync(join(work, 'subs.srt')), 'text/plain');

    const gv = await insertRow('generated_videos', {
      user_email: task.user_email, task_id: task.id, source_video_id: task.source_video_id || null,
      video_url: videoUrl, cover_url: coverUrl, subtitle_url: subtitleUrl, duration: meta.duration,
    });
    await setStep(4, { status: 'succeeded' });

    return { generatedVideoId: gv.id, videoUrl, coverUrl, subtitleUrl, duration: meta.duration, usedAI, ttsOk, shots: scenes, sourceShots: analysis?.shots || null, replicated: !!(analysis?.shots?.length), notes };
  } finally {
    try { rmSync(work, { recursive: true, force: true }); } catch {}
  }
}
