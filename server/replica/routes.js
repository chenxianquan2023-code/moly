/**
 * 爆款视频复刻 MVP —— 后端 API 路由
 * 挂载于 /api（见 server/index.js）。
 * 用户标识沿用现有模式：前端传 userEmail（body / query / x-user-email 头）。
 */
import { Router } from 'express';
import multer from 'multer';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { insertRow, getById, selectOne, selectRows, updateById } from '../lib/supabase.js';
import { uploadBuffer, makePath } from '../lib/storage.js';
import { createTask, getTask, runTask } from './tasks.js';
import { runReplicaPipeline, preflightAIHealth } from './pipeline.js';
import { estimateCost, estimateRegenCost, pricingTable, RECHARGE_PACKAGES } from './pricing.js';
import { listVoices, DEFAULT_VOICE, resolveVoice } from './voices.js';
import { synthesize as ttsSynthesize } from './ai/tts.js';
import * as gemini from './ai/gemini.js';
import * as ff from './ai/ffmpeg.js';
import { getPoints, addPoints, deductPoints } from '../lib/points.js';
import { isTester, isAllowed } from '../lib/access.js';

const BETA_DENY = '内测阶段仅向受邀账号开放，如需试用请联系管理员开通。';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } }); // PRD: ≤200MB

const ASSET_TYPES = ['product_image', 'outfit_image', 'model_image', 'face_image', 'pose_reference', 'source_video'];
const MIN_CREATIVE_PROMPT_LENGTH = 6;

export const replicaRouter = Router();

async function downloadToFile(url, dest) {
  const r = await fetch(url, { signal: AbortSignal.timeout(90000) });
  if (!r.ok) throw new Error(`下载失败 ${r.status}`);
  writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
  return dest;
}

function getEmail(req, res) {
  const email = String(req.body?.userEmail || req.query?.userEmail || req.headers['x-user-email'] || '')
    .trim().toLowerCase();
  if (!email) { res.status(401).json({ success: false, message: '缺少用户标识 userEmail' }); return null; }
  // 内测白名单：非受邀账号一律拒绝（覆盖所有走 getEmail 的接口：上传/生成/换单镜/积分/找爆款等）
  if (!isAllowed(email)) { res.status(403).json({ success: false, code: 'NOT_ALLOWED', message: BETA_DENY }); return null; }
  return email;
}

export function validateRequiredCreativePrompt(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length < MIN_CREATIVE_PROMPT_LENGTH) {
    return {
      ok: false,
      value: text,
      message: `请先填写生成提示词（至少 ${MIN_CREATIVE_PROMPT_LENGTH} 个字），也可以点「AI 填写建议」后再修改。`,
    };
  }
  return { ok: true, value: text, message: '' };
}

function compactGuideText(value, max = 180) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function normalizeGuideScenario(raw = {}, index = 0) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const fallbackTitles = ['真实试用场景', '高能种草场景', '生活方式场景'];
  const fallbackTags = [
    ['Raw UGC', 'Authentic', 'Cozy'],
    ['High-energy', 'Demo', 'Lifestyle'],
    ['Opinionated', 'Daily Routine', 'Natural'],
  ];
  const actions = Array.isArray(source.actions)
    ? source.actions.map((x) => compactGuideText(x, 120)).filter(Boolean)
    : String(source.actions || '').split(/[;；\n]/).map((x) => compactGuideText(x, 120)).filter(Boolean);
  while (actions.length < 3) actions.push(['展示商品核心使用方式', '保留参考视频的构图与节奏', '突出商品材质、卖点和真实使用关系'][actions.length]);
  const tags = Array.isArray(source.tags)
    ? source.tags.map((x) => compactGuideText(x, 28)).filter(Boolean).slice(0, 4)
    : fallbackTags[index % fallbackTags.length];
  const prompt = compactGuideText(
    source.prompt || source.creativePrompt || `${source.subject || '模特自然使用商品'}，${source.lighting || '真实自然光'}，${source.camera || '手机手持拍摄'}，${actions.join('；')}。`,
    800,
  );
  return {
    title: compactGuideText(source.title, 80) || fallbackTitles[index % fallbackTitles.length],
    subject: compactGuideText(source.subject, 180) || '一位符合目标受众的成人模特，在真实生活场景中自然使用商品。',
    lighting: compactGuideText(source.lighting, 160) || '自然光或柔和室内光，保持真实、干净、有生活感。',
    camera: compactGuideText(source.camera, 160) || '手机手持 POV，轻微晃动，贴近真实 UGC 记录感。',
    actions: actions.slice(0, 5),
    tags,
    prompt,
  };
}

export function normalizePromptGuide(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const sellingPoints = Array.isArray(source.sellingPoints)
    ? source.sellingPoints.map((x) => compactGuideText(x, 80)).filter(Boolean).slice(0, 5)
    : [];
  const scenarios = Array.isArray(source.scenarios) ? source.scenarios.map(normalizeGuideScenario) : [];
  while (scenarios.length < 3) scenarios.push(normalizeGuideScenario({}, scenarios.length));
  const primary = scenarios[0] || normalizeGuideScenario({}, 0);
  return {
    productName: compactGuideText(source.productName, 120),
    category: compactGuideText(source.category, 80),
    sellingPoints,
    audience: compactGuideText(source.audience || source.targetAudience, 160),
    videoType: compactGuideText(source.videoType || source.contentType, 80) || 'UGC 种草',
    scenarios: scenarios.slice(0, 3),
    creativePrompt: compactGuideText(source.creativePrompt || primary.prompt, 800),
    negativePrompt: compactGuideText(source.negativePrompt || '不要裸露、不要换商品、不要多手/畸形、不要生成与商品无关元素。', 500),
  };
}

// ── 素材 ──────────────────────────────────────────────────────
// POST /api/assets/upload  multipart: file, assetType, userEmail, [consent]
replicaRouter.post('/assets/upload', upload.single('file'), async (req, res) => {
  try {
    const email = getEmail(req, res); if (!email) return;
    const assetType = String(req.body?.assetType || '').trim();
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: '缺少文件' });
    if (!ASSET_TYPES.includes(assetType)) return res.status(400).json({ success: false, message: `非法 assetType（应为 ${ASSET_TYPES.join('/')}）` });

    const isVideo = (file.mimetype || '').startsWith('video/');
    const path = makePath(email, isVideo ? 'videos' : 'images', file.originalname || (isVideo ? 'v.mp4' : 'img.jpg'));
    const fileUrl = await uploadBuffer(path, file.buffer, file.mimetype || 'application/octet-stream');

    const asset = await insertRow('assets', {
      user_email: email,
      asset_type: assetType,
      file_url: fileUrl,
      status: 'ready',
      metadata_json: { size: file.size, mime: file.mimetype, name: file.originalname },
    });

    // 人脸素材：强制记录授权确认（PRD P0-2 合规）
    if (assetType === 'face_image') {
      const consent = String(req.body?.consent || '') === 'true';
      await insertRow('face_consents', {
        user_email: email, asset_id: asset.id,
        consent_checked: consent, consent_time: consent ? new Date().toISOString() : null,
        ip: (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString().split(',')[0],
      });
    }
    res.json({ success: true, asset });
  } catch (e) { console.error('[assets/upload]', e); res.status(500).json({ success: false, message: e.message, cause: String(e?.cause?.message || e?.cause || '') }); }
});

// GET /api/assets/:id
replicaRouter.get('/assets/:id', async (req, res) => {
  try {
    const a = await getById('assets', req.params.id);
    if (!a) return res.status(404).json({ success: false, message: '素材不存在' });
    res.json({ success: true, asset: a });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── 爆款视频 ──────────────────────────────────────────────────
// POST /api/source-videos  body: { userEmail, assetId }
replicaRouter.post('/source-videos', async (req, res) => {
  try {
    const email = getEmail(req, res); if (!email) return;
    const asset = req.body?.assetId ? await getById('assets', req.body.assetId) : null;
    if (!asset) return res.status(400).json({ success: false, message: 'assetId 无效' });
    const sv = await insertRow('source_videos', {
      user_email: email, asset_id: asset.id,
      duration: asset.duration || null, width: asset.width || null, height: asset.height || null,
      cover_url: asset.thumbnail_url || null, analysis_status: 'pending',
    });
    res.json({ success: true, sourceVideo: sv });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/source-videos/:id/analyze  —— 占位：标记完成并写空解析（真实解析见任务5）
replicaRouter.post('/source-videos/:id/analyze', async (req, res) => {
  try {
    const sv = await getById('source_videos', req.params.id);
    if (!sv) return res.status(404).json({ success: false, message: '爆款视频不存在' });
    await updateById('source_videos', sv.id, { analysis_status: 'succeeded' });
    const analysis = await insertRow('video_analysis', {
      source_video_id: sv.id,
      analysis_json: { placeholder: true, note: '真实解析将在后续实现' },
    });
    res.json({ success: true, analysis });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/source-videos/:id/analysis
replicaRouter.get('/source-videos/:id/analysis', async (req, res) => {
  try {
    const row = await selectOne('video_analysis', `source_video_id=eq.${req.params.id}&order=created_at.desc&limit=1&select=*`);
    if (!row) return res.status(404).json({ success: false, message: '尚无解析结果' });
    res.json({ success: true, analysis: row });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/replica/prompt-guide
// 用商品图 + 参考视频关键帧生成可编辑提示词建议；失败不影响主生成流程。
replicaRouter.post('/replica/prompt-guide', async (req, res) => {
  let work = '';
  try {
    const email = getEmail(req, res); if (!email) return;
    if (!gemini.isConfigured()) return res.status(503).json({ success: false, message: 'AI 分析服务暂时不可用' });
    const { productImageId = null, sourceVideoAssetId = null, product = {}, language = 'zh-CN' } = req.body || {};
    const productAsset = productImageId ? await getById('assets', productImageId) : null;
    const sourceAsset = sourceVideoAssetId ? await getById('assets', sourceVideoAssetId) : null;
    if (!productAsset?.file_url && !sourceAsset?.file_url) {
      return res.status(400).json({ success: false, message: '请先上传商品图或参考视频' });
    }

    const images = [];
    if (productAsset?.file_url) images.push(productAsset.file_url);
    if (sourceAsset?.file_url) {
      work = mkdtempSync(join(tmpdir(), 'moly-prompt-guide-'));
      const vpath = await downloadToFile(sourceAsset.file_url, join(work, 'src.mp4'));
      const meta = await ff.probe(vpath);
      const dur = Math.min(20, Math.max(4, meta.duration || 12));
      const fps = Math.min(1, Math.max(0.25, 6 / dur));
      await ff.extractFrames(vpath, join(work, 'f_%03d.jpg'), fps, dur);
      const frames = readdirSync(work).filter((f) => f.startsWith('f_')).sort().slice(0, 6);
      for (const f of frames) images.push(readFileSync(join(work, f)));
    }

    const prompt = `你是电商短视频导演。请根据商品图和参考视频帧，为图生视频写一份 Creatok 风格的提示词向导。必须只输出 JSON，不要 markdown。语言：${language}。商品信息：${product?.name || ''}；卖点：${Array.isArray(product?.sellingPoints) ? product.sellingPoints.join('、') : ''}。
输出 schema：{"productName":"更准确的商品名","category":"商品类目","sellingPoints":["卖点1","卖点2","卖点3"],"audience":"目标受众","videoType":"UGC 种草/测评/教程/带货等","scenarios":[{"title":"方案标题","subject":"主体：谁在什么场景使用/展示商品","lighting":"光线：自然光/棚光/夜景等","camera":"镜头：POV/自拍/桌面俯拍/手持跟拍等","actions":["动作1","动作2","动作3","动作4","动作5"],"tags":["Raw UGC","Authentic","Lifestyle"],"prompt":"按该方案生成视频的一段完整提示词，100-220字，说明要保留参考视频哪些场景、构图、动作，并说明商品如何自然出现"}],"creativePrompt":"默认推荐方案的完整提示词","negativePrompt":"一段禁止事项，40-120字，包含不要裸露、不要换商品、不要多手/畸形、不要生成与商品无关元素；若商品是包/首饰/墨镜等配饰，要强调保留参考视频穿搭，只替换/展示配饰"}。scenarios 必须给 3 个，风格要明显不同。`;
    const txt = await gemini.analyzeImages(prompt, images, { temperature: 0.3 });
    const guide = normalizePromptGuide(gemini.parseJson(txt));
    res.json({
      success: true,
      guide,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message || '提示词建议生成失败' });
  } finally {
    if (work) { try { rmSync(work, { recursive: true, force: true }); } catch { /* ignore */ } }
  }
});

// ── 一键复刻 ──────────────────────────────────────────────────
// POST /api/replica/generate
replicaRouter.post('/replica/generate', async (req, res) => {
  try {
    const email = getEmail(req, res); if (!email) return; // getEmail 已含白名单校验
    const { sourceVideoId = null, options = {}, assets = {}, language = 'en-US', aspectRatio = '9:16', previewUrl = '', product = {}, scriptText = '', models = {} } = req.body || {};
    const promptCheck = validateRequiredCreativePrompt(options.creativePrompt || options.userPrompt || options.prompt || '');
    if (!promptCheck.ok) return res.status(400).json({ success: false, code: 'PROMPT_REQUIRED', message: promptCheck.message });
    const mergedOptions = { ...options, creativePrompt: promptCheck.value, language, aspectRatio, models };

    // 成片秒数：用户选了固定时长用它；否则(跟源)用源视频时长(前端读取上传视频得到)，封顶 45s
    const outputSec = Number(mergedOptions.targetDurationSec) > 0
      ? Number(mergedOptions.targetDurationSec)
      : Math.min(45, Number(mergedOptions.sourceDurationSec) || 12);
    // 按成片秒数 + 所选模型估价
    const { cost, breakdown } = estimateCost(mergedOptions, outputSec);

    // 余额预检（用户不存在/积分不足直接拦截，不建任务）
    const balance = await getPoints(email);
    if (balance === null) return res.status(404).json({ success: false, message: '用户不存在，请先登录' });
    if (balance < cost) return res.status(402).json({ success: false, code: 'INSUFFICIENT', message: `积分不足：本次需 ${cost}，当前 ${balance}`, need: cost, points: balance });

    // 生成前服务自检：AI 模型欠费/未配置 → 不建任务、不扣费，直接提示联系管理员（生出来的视频也不对，别浪费积分）
    const health = await preflightAIHealth();
    if (!health.ok) {
      return res.status(503).json({ success: false, code: 'SERVICE_UNAVAILABLE', message: `生成服务暂时不可用（${health.reason}）。请联系管理员处理，本次未扣除积分。` });
    }

    const task = await createTask({
      userEmail: email,
      sourceVideoId,
      options: mergedOptions,
      input: { assets, previewUrl, product, scriptText },
      creditsEstimated: cost,
      creditsCharged: cost,
    });

    // 扣费（权威操作；极端并发下可能恰好不足→标记任务失败并退回）
    let remaining;
    try { remaining = await deductPoints(email, cost, `复刻生成#${String(task.id).slice(0, 8)}`); }
    catch (e) {
      await updateById('generation_tasks', task.id, { status: 'failed', error_message: '积分不足', credits_charged: 0 });
      if (e.code === 'INSUFFICIENT') return res.status(402).json({ success: false, code: 'INSUFFICIENT', message: '积分不足，请充值', need: cost, points: e.points });
      throw e;
    }

    runTask(task.id, runReplicaPipeline);
    res.json({ success: true, taskId: task.id, status: 'queued', cost, breakdown, points: remaining });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/replica/regenerate-scene  body: { taskId, sceneIndex } —— 换单镜：只重生某一镜，复用其余镜的缓存
replicaRouter.post('/replica/regenerate-scene', async (req, res) => {
  try {
    const email = getEmail(req, res); if (!email) return; // getEmail 已含白名单校验
    const { taskId, sceneIndex } = req.body || {};
    if (!taskId || !Number.isInteger(sceneIndex)) return res.status(400).json({ success: false, message: '缺少 taskId 或 sceneIndex' });

    // 取原任务 + 校验归属 + 校验分镜缓存完整（换单镜依赖 output_json 里的 shots/sceneClips）
    const orig = await getTask(taskId);
    if (!orig || orig.user_email !== email) return res.status(404).json({ success: false, message: '原任务不存在或无权访问' });
    const o = orig.output_json || {};
    if (!Array.isArray(o.shots) || !o.shots.length || !Array.isArray(o.sceneClips) || o.sceneClips.length !== o.shots.length) {
      return res.status(400).json({ success: false, message: '该视频没有可复用的分镜缓存，无法换单镜，请整条重新生成一次' });
    }
    if (sceneIndex < 0 || sceneIndex >= o.shots.length) return res.status(400).json({ success: false, message: '镜头序号越界' });

    const { cost } = estimateRegenCost();
    const balance = await getPoints(email);
    if (balance === null) return res.status(404).json({ success: false, message: '用户不存在，请先登录' });
    if (balance < cost) return res.status(402).json({ success: false, code: 'INSUFFICIENT', message: `积分不足：本次需 ${cost}，当前 ${balance}`, need: cost, points: balance });

    const health = await preflightAIHealth();
    if (!health.ok) return res.status(503).json({ success: false, code: 'SERVICE_UNAVAILABLE', message: `生成服务暂时不可用（${health.reason}）。本次未扣除积分。` });

    // 新建 regen 任务：复用原任务的素材(input)与选项(options)，加 regen 标记，让流水线只重生这一镜
    const task = await createTask({
      userEmail: email,
      sourceVideoId: orig.source_video_id || null,
      taskType: 'regen_scene',
      options: orig.options_json || {},
      input: { ...(orig.input_json || {}), regen: { origTaskId: taskId, sceneIndex } },
      creditsEstimated: cost,
      creditsCharged: cost,
    });

    let remaining;
    try { remaining = await deductPoints(email, cost, `换单镜#${String(task.id).slice(0, 8)}`); }
    catch (e) {
      await updateById('generation_tasks', task.id, { status: 'failed', error_message: '积分不足', credits_charged: 0 });
      if (e.code === 'INSUFFICIENT') return res.status(402).json({ success: false, code: 'INSUFFICIENT', message: '积分不足，请充值', need: cost, points: e.points });
      throw e;
    }

    runTask(task.id, runReplicaPipeline);
    res.json({ success: true, taskId: task.id, status: 'queued', cost, points: remaining });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/replica/pricing —— 定价表 + 充值套餐（前端渲染选项/价格）
replicaRouter.get('/replica/pricing', (req, res) => {
  res.json({ success: true, pricing: pricingTable(), packages: RECHARGE_PACKAGES });
});

// GET /api/replica/voices —— 配音音色列表 + 试听样本
replicaRouter.get('/replica/voices', (req, res) => {
  res.json({ success: true, voices: listVoices(), defaultVoice: DEFAULT_VOICE });
});

// GET /api/replica/voice-sample?id=&lang= —— 按所选语言现合成试听样本
// （多语种音色的静态样本只录了主语言，选其它语言试听会语言不符，这里按语言实时合成，进程内缓存）
const SAMPLE_TEXTS = {
  'zh-CN': '你好呀，这款好物我真心推荐，一起来看看吧！',
  'en-US': 'Hey there! I really love this product — let me show you why.',
  'ja-JP': 'こんにちは！この商品、本当におすすめなんです。',
  'es-ES': '¡Hola! Me encanta este producto, te lo enseño ahora mismo.',
};
const _sampleCache = new Map(); // key: `${id}|${lang}` → Buffer
replicaRouter.get('/replica/voice-sample', async (req, res) => {
  try {
    const id = String(req.query?.id || '').trim();
    const lang = String(req.query?.lang || 'zh-CN').trim();
    if (!id) return res.status(400).json({ success: false, message: '缺少音色 id' });
    const key = `${id}|${lang}`;
    let buf = _sampleCache.get(key);
    if (!buf) {
      const text = SAMPLE_TEXTS[lang] || SAMPLE_TEXTS['zh-CN'];
      buf = await ttsSynthesize(text, resolveVoice(id));
      if (buf && buf.length) _sampleCache.set(key, buf);
    }
    res.set('Content-Type', 'audio/mpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(buf);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/replica/estimate  body: { models, targetDurationSec, sourceDurationSec } —— 预估价（不扣费）
replicaRouter.post('/replica/estimate', (req, res) => {
  const b = req.body || {};
  const outputSec = Number(b.targetDurationSec) > 0 ? Number(b.targetDurationSec) : Math.min(45, Number(b.sourceDurationSec) || 12);
  const { cost, breakdown } = estimateCost({ models: b.models || {} }, outputSec);
  res.json({ success: true, cost, breakdown });
});

// GET /api/replica/credits?userEmail= —— 查余额
replicaRouter.get('/replica/credits', async (req, res) => {
  try {
    const email = getEmail(req, res); if (!email) return;
    const points = await getPoints(email);
    if (points === null) return res.status(404).json({ success: false, message: '用户不存在' });
    res.json({ success: true, points });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/replica/recharge  body: { userEmail, packageId } —— 充值（MVP：体验直充，支付网关待接入）
replicaRouter.post('/replica/recharge', async (req, res) => {
  try {
    const email = getEmail(req, res); if (!email) return;
    // 内测期：仅测试账号可充值；普通用户固定 320 体验额度
    if (!isTester(email)) {
      return res.json({ success: false, code: 'RECHARGE_DISABLED', message: '内测期间每位用户 320 积分体验额度，暂不支持充值' });
    }
    const pkg = RECHARGE_PACKAGES.find((p) => p.id === String(req.body?.packageId || ''));
    if (!pkg) return res.status(400).json({ success: false, message: '充值套餐无效' });
    const total = pkg.credits + (pkg.bonus || 0);
    const points = await addPoints(email, total, `充值:${pkg.label}`);
    res.json({ success: true, points, added: total, package: pkg, note: '体验充值已到账（真实支付网关待接入）' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/generation-tasks?userEmail=...  —— 当前用户的复刻历史（倒序、精简字段）
replicaRouter.get('/generation-tasks', async (req, res) => {
  try {
    const email = String(req.query?.userEmail || req.headers['x-user-email'] || '').trim().toLowerCase();
    if (!email) return res.status(401).json({ success: false, message: '缺少用户标识 userEmail' });
    const rows = await selectRows('generation_tasks',
      `user_email=eq.${encodeURIComponent(email)}&order=created_at.desc&limit=60` +
      `&select=id,status,progress,output_json,input_json,options_json,error_message,created_at`);
    res.json({ success: true, tasks: Array.isArray(rows) ? rows : [] });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/generation-tasks/:id
replicaRouter.get('/generation-tasks/:id', async (req, res) => {
  try {
    const t = await getTask(req.params.id);
    if (!t) return res.status(404).json({ success: false, message: '任务不存在' });
    res.json({ success: true, task: t });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── 生成结果 ──────────────────────────────────────────────────
// GET /api/generated-videos/:id
replicaRouter.get('/generated-videos/:id', async (req, res) => {
  try {
    const g = await getById('generated_videos', req.params.id);
    if (!g) return res.status(404).json({ success: false, message: '成品不存在' });
    res.json({ success: true, generatedVideo: g });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/generated-videos/:id/download  —— 重定向到成品直链
replicaRouter.get('/generated-videos/:id/download', async (req, res) => {
  try {
    const g = await getById('generated_videos', req.params.id);
    if (!g || !g.video_url) return res.status(404).json({ success: false, message: '成品不存在' });
    res.redirect(g.video_url);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
