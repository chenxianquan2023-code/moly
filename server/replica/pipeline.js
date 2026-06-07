/**
 * 一键复刻流水线 v2 —— 「带货导演」式分镜生成
 * 思路：LLM 当导演 → 按商品品类出分镜脚本(口播+画面+运动+是否出模特) →
 *       逐镜生成"演示该商品"的画面(image) → animate(video) → 配音 + ASS字幕 + 合成。
 * 卖货逻辑：水杯/数码/家居→介绍产品本身(特写/内部/倒水/开合)；服装鞋包→模特展示版型适配。
 *
 * 优雅降级：任何 AI 步失败都不崩，尽量出片；外部调用均带重试。
 */
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { insertRow, getById } from '../lib/supabase.js';
import { uploadBuffer, makePath } from '../lib/storage.js';
import * as ff from './ai/ffmpeg.js';
import * as gemini from './ai/gemini.js';
import * as llm from './ai/llm.js';
import * as kling from './ai/kling.js';
import * as seedance from './ai/seedance.js';
import * as fal from './ai/fal.js';
import * as image from './ai/image.js';
import { synthesize as ttsSynthesize } from './ai/tts.js';
import { resolveVoice } from './voices.js';
import { notifyAdmin } from '../lib/alert.js';

const SOURCE_VIDEO_REFERENCE_MAX_SEC = 60;
const OUTPUT_VIDEO_MAX_SEC = 45;

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

function clampNumber(value, min, max, fallback = min) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function compactText(value, max = 180) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function pickSpread(items, count) {
  if (!Array.isArray(items) || items.length <= count) return items || [];
  if (count <= 1) return [items[0]];
  const last = items.length - 1;
  return Array.from({ length: count }, (_, i) => items[Math.round((last * i) / (count - 1))]);
}

function normalizeAnalysis(raw, durationSec = 0) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const total = clampNumber(source.durationSec ?? source.duration ?? durationSec, 0, 3600, durationSec || 0);
  const rawShots = Array.isArray(source.shots) ? source.shots : [];
  const shots = rawShots.map((shot, index) => {
    const start = clampNumber(shot.startSec ?? shot.start, 0, total || 9999, 0);
    const end = clampNumber(shot.endSec ?? shot.end, start, total || 9999, 0);
    const duration = clampNumber(shot.durationSec ?? shot.duration ?? (end > start ? end - start : 0), 0, total || 9999, 0);
    const durationRatio = clampNumber(shot.durationRatio ?? (total && duration ? duration / total : 0), 0, 1, 0);
    return {
      ...shot,
      index: Number.isFinite(Number(shot.index)) ? Number(shot.index) : index + 1,
      durationSec: duration,
      durationRatio,
      shotType: compactText(shot.shotType, 80),
      camera: compactText(shot.camera, 120),
      framing: compactText(shot.framing || shot.shotType, 120),
      composition: compactText(shot.composition, 160),
      lighting: compactText(shot.lighting, 120),
      color: compactText(shot.color || shot.colorPalette, 120),
      visualStyle: compactText(shot.visualStyle || shot.style, 180),
      captionStyle: compactText(shot.captionStyle || shot.caption, 160),
      transition: compactText(shot.transition, 120),
      role: compactText(shot.role, 60),
      purpose: compactText(shot.purpose, 120),
    };
  });
  const ratioSum = shots.reduce((sum, shot) => sum + (Number(shot.durationRatio) || 0), 0);
  if (shots.length) {
    shots.forEach((shot) => {
      shot.durationRatio = ratioSum > 0 ? shot.durationRatio / ratioSum : 1 / shots.length;
    });
  }
  return {
    ...source,
    durationSec: total,
    shots,
    tone: compactText(source.tone || source.style || source.styleBrief || '活泼种草', 180),
    pacing: compactText(source.pacing || source.editingRhythm || '中等节奏', 120),
    styleBrief: compactText(source.styleBrief || source.style || '', 260),
    colorPalette: compactText(source.colorPalette || source.color || '', 160),
    lighting: compactText(source.lighting, 160),
    cameraLanguage: compactText(source.cameraLanguage, 180),
    editingRhythm: compactText(source.editingRhythm || source.pacing, 180),
    captionStyle: compactText(source.captionStyle, 180),
    transitionStyle: compactText(source.transitionStyle, 160),
    hookPattern: compactText(source.hookPattern, 160),
  };
}

function sourceShotFor(analysis, index) {
  const shots = Array.isArray(analysis?.shots) ? analysis.shots : [];
  if (!shots.length) return null;
  return shots[Math.min(shots.length - 1, Math.max(0, index))] || null;
}

function normalizeSourceIndex(value, fallback, analysis) {
  const shots = Array.isArray(analysis?.shots) ? analysis.shots : [];
  if (!shots.length) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return Math.min(shots.length - 1, fallback);
  // LLM 输出用 1-based；兼容偶尔输出 0-based 的情况。
  const zeroBased = n >= 1 ? n - 1 : n;
  return Math.min(shots.length - 1, Math.max(0, Math.round(zeroBased)));
}

function styleFingerprint(analysis, shot) {
  if (!analysis) return '';
  return [
    analysis.styleBrief && `整体风格：${analysis.styleBrief}`,
    analysis.tone && `语气/情绪：${analysis.tone}`,
    analysis.pacing && `节奏：${analysis.pacing}`,
    analysis.colorPalette && `色调：${analysis.colorPalette}`,
    analysis.lighting && `光线：${analysis.lighting}`,
    analysis.cameraLanguage && `镜头语言：${analysis.cameraLanguage}`,
    analysis.editingRhythm && `剪辑节奏：${analysis.editingRhythm}`,
    analysis.transitionStyle && `转场：${analysis.transitionStyle}`,
    analysis.captionStyle && `字幕/贴纸：${analysis.captionStyle}`,
    shot?.shotType && `本镜景别：${shot.shotType}`,
    shot?.camera && `本镜运镜：${shot.camera}`,
    shot?.framing && `本镜画幅/景别：${shot.framing}`,
    shot?.composition && `本镜构图：${shot.composition}`,
    shot?.lighting && `本镜光线：${shot.lighting}`,
    shot?.color && `本镜色彩：${shot.color}`,
    shot?.visualStyle && `本镜视觉：${shot.visualStyle}`,
    shot?.captionStyle && `本镜字幕：${shot.captionStyle}`,
  ].filter(Boolean).join('；');
}

function assText(text) {
  return String(text || '').replace(/[{}]/g, '').replace(/\r?\n/g, ' ').trim();
}

function assCaptionConfig(analysis = {}) {
  const src = analysis || {};
  const caption = String(src.captionStyle || '').toLowerCase();
  const top = /顶部|上方|top/.test(caption);
  const center = /居中|中间|center/.test(caption);
  const small = /小字|small/.test(caption);
  const large = /大字|粗体|large|bold/.test(caption);
  return {
    fontSize: large ? 54 : small ? 38 : 44,
    align: top ? 8 : center ? 5 : 2,
    marginV: top ? 130 : center ? 0 : 150,
  };
}

const FACE_COVER_USE_RE = /面膜|facial\s*mask|sheet\s*mask|skincare|护肤|墨镜|太阳镜|眼镜|护目镜|眼罩|sunglasses|eyewear|goggles|口罩|medical\s*mask|respirator|防晒面罩|防晒口罩|护脸|遮脸|遮面|面罩|面具|头盔|帽盔|骑行盔|滑雪面罩|防风面罩|防尘面罩|face\s*mask|face\s*cover|face\s*shield|sun\s*mask|ski\s*mask|balaclava|neck\s*gaiter|visor|helmet/i;
const ANONYMOUS_USE_RE = new RegExp(`${FACE_COVER_USE_RE.source}|乳贴|nipple|pasties|bra|抹胸|tube\\s*top|服饰|穿搭|试穿|wear|try\\s*on`, 'i');
const PERSON_RE = /模特|女生|女性|人物|真人|手|肩颈|身体|背影|侧身|佩戴|试用|敷|戴|穿|woman|girl|model|hand|body|wear|try/i;

function sourceHasPerson(shot) {
  const value = String(shot?.hasPerson || '').toLowerCase();
  if (['hand', 'full', 'body', 'person', 'face'].includes(value)) return true;
  return PERSON_RE.test(`${shot?.subject || ''} ${shot?.action || ''} ${shot?.composition || ''}`);
}

function shouldKeepAnonymousUsage(scene, sourceShot, productText) {
  const text = `${productText || ''} ${scene?.visual || ''} ${scene?.text || ''} ${sourceShot?.action || ''} ${sourceShot?.subject || ''} ${sourceShot?.role || ''}`;
  return ANONYMOUS_USE_RE.test(text) && (scene?.withModel || sourceHasPerson(sourceShot) || PERSON_RE.test(text));
}

function faceCoverKind(text) {
  const t = String(text || '');
  if (/面膜|facial\s*mask|sheet\s*mask|skincare|护肤/i.test(t)) return 'sheetMask';
  if (/墨镜|太阳镜|sunglasses|eyewear|goggles/i.test(t)) return 'eyewear';
  if (/防晒面罩|防晒口罩|face\s*cover|sun\s*mask|balaclava|neck\s*gaiter/i.test(t)) return 'sunCover';
  if (/口罩|medical\s*mask|respirator/i.test(t)) return 'mouthMask';
  if (FACE_COVER_USE_RE.test(t)) return 'faceCover';
  return '';
}

function anonymousUsageVisual(scene, sourceShot, productText) {
  const text = `${productText || ''} ${scene?.visual || ''} ${sourceShot?.action || ''}`;
  const sourceCue = [
    sourceShot?.shotType && `景别贴近源镜头${sourceShot.shotType}`,
    sourceShot?.composition && `构图参考：${sourceShot.composition}`,
    sourceShot?.lighting && `光线参考：${sourceShot.lighting}`,
  ].filter(Boolean).join('；');
  const coverKind = faceCoverKind(text);
  if (coverKind === 'sheetMask') {
    return `匿名女性模特正在真实试用该片状面膜：面膜贴合脸部但保留自然头部和面部结构，必须有眼部/鼻部/嘴部开孔或半透明材质，能看到闭眼轮廓、鼻梁和嘴部位置，手轻按面膜贴合脸颊，商品包装在手边或画面前景清晰可见；${sourceCue || '生活化浴室/卧室自然光，真实护肤使用场景'}；不能变成单纯包装盒陈列，不能生成空白脸、白板脸、无脸人或恐怖面具`;
  }
  if (coverKind === 'eyewear') {
    return `匿名模特正在佩戴该墨镜/太阳镜：镜片遮住眼睛或有自然反光，鼻梁、嘴部、下颌线和自然脸部轮廓清楚，采用侧脸/半侧脸/裁切构图避免可识别正脸，商品佩戴效果清楚；${sourceCue || '生活化穿搭或户外自然光场景'}；不能变成单纯包装盒陈列，不能生成空白脸、白板脸、无脸人或假人头`;
  }
  if (coverKind === 'mouthMask') {
    return `匿名模特正在佩戴该口罩：口罩覆盖鼻口并贴合脸部，耳带、鼻梁条和材质细节真实，眉眼、额头、发际线和自然脸部轮廓可见但不可识别，手可轻调耳带或鼻梁条；${sourceCue || '生活化通勤/户外/室内自然光场景'}；不能变成单纯包装盒陈列，不能生成空白脸、白板脸、无脸人或假人头`;
  }
  if (coverKind === 'sunCover') {
    return `匿名模特正在佩戴该防晒面罩：防晒面罩覆盖下半脸、脸颊或颈部，眼周、额头、发际线和自然头部轮廓可见，可搭配墨镜但人体结构必须真实，商品防晒覆盖效果清楚；${sourceCue || '户外阳光/骑行/海边防晒场景'}；不能变成单纯包装盒陈列，不能生成空白脸、白板脸、无脸人或假人头`;
  }
  if (coverKind === 'faceCover') {
    return `匿名模特正在佩戴/试用该面部遮挡类商品：商品覆盖眼部、鼻口、脸颊或全脸的对应区域，头部、发际线、耳朵/肩颈、眼鼻口位置或商品开孔/镜片/透气孔/边缘结构必须真实合理，采用侧脸/半侧脸/裁切构图避免可识别正脸，商品佩戴效果清楚；${sourceCue || '生活化真实试用场景'}；不能变成单纯包装盒陈列，不能生成空白脸、白板脸、无脸人、假人头或恐怖面具`;
  }
  if (/乳贴|nipple|pasties|bra|抹胸|tube\s*top/i.test(text)) {
    return `匿名女性模特展示该贴身商品的穿搭效果：只拍肩颈以下、背影、侧身或手部整理衣物，绝不出现可识别正脸，商品使用状态清楚自然；${sourceCue || '生活化穿搭场景'}；不能变成单纯商品包装陈列`;
  }
  return `匿名模特正在使用该商品：只出现手部、身体局部、背影、侧身或被商品/道具遮挡的脸，绝不出现可识别正脸，商品与人体接触关系真实；${sourceCue || '生活化真实试用场景'}；不能变成单纯商品包装陈列`;
}

export function anonymousSubjectRule(scene = {}, productText = '', sourceShot = {}) {
  const text = `${productText || ''} ${scene?.visual || ''} ${scene?.text || ''} ${sourceShot?.action || ''} ${sourceShot?.subject || ''}`;
  const base = '人物呈现必须匿名：不要还原上传模特或源视频人物的可识别身份；可以用侧脸、半侧脸、裁切、商品遮挡、墨镜反光、低头/闭眼等方式隐藏身份。人体必须真实自然，不能生成空白脸、白板脸、无脸人、假人脸或恐怖面具。画面核心是"正在试用商品"，不是单纯商品包装陈列。';
  const coverKind = faceCoverKind(text);
  if (coverKind === 'sheetMask') {
    return `${base}片状面膜规则：面膜可以覆盖皮肤，但必须有真实眼部/鼻部/嘴部开孔或半透明凝胶材质；眼睛可闭上或在开孔后自然可见，鼻梁和嘴部位置必须存在，脸部轮廓和头发/耳朵/肩颈比例正常。`;
  }
  if (coverKind === 'eyewear') {
    return `${base}墨镜/太阳镜规则：镜片可以遮住眼睛或反光，但鼻梁、嘴部、下颌线、发际线和自然脸部轮廓必须存在；避免正脸身份证式角度，使用侧脸/半侧脸/裁切构图。`;
  }
  if (coverKind === 'mouthMask') {
    return `${base}口罩规则：口罩覆盖鼻口，耳带、鼻梁条、脸颊贴合关系真实；眉眼、额头、发际线和自然脸部轮廓可见但不可识别。`;
  }
  if (coverKind === 'sunCover') {
    return `${base}防晒面罩规则：防晒面罩覆盖下半脸、脸颊或颈部，眼周、额头、发际线和自然头部轮廓可见，可搭配墨镜遮眼，但不能把整张脸抹成空洞面具。`;
  }
  if (coverKind === 'faceCover') {
    return `${base}通用面部遮挡商品规则：商品可以覆盖眼部、鼻口、脸颊或全脸，但必须保留真实头部结构、发际线、耳朵/肩颈比例，以及眼鼻口所在位置或对应的开孔/镜片/透气孔/边缘结构；不能把脸抹平成空洞白板。`;
  }
  return `${base}只出现手部、身体局部、肩颈、背影、侧身，或让商品/道具遮挡可识别部分；未遮挡的人体部位必须保持自然结构。`;
}

export function applySeedancePersonPolicy(scenes, {
  videoModel = '',
  hasModel = false,
  productText = '',
  sourceShots = [],
  notes = [],
} = {}) {
  if (!Array.isArray(scenes)) return [];
  // 现役视频引擎(fal Seedance 2.0 / 可灵)都支持真人脸，不再做旧版"匿名禁脸"处理；仅按 withModel 归一 personMode
  return scenes.map((scene) => {
    const s = { ...scene };
    s.personMode = s.withModel ? (s.personMode || 'identifiable') : 'none';
    return s;
  });
}

export function sourceStyleRefsForScene(sourceStyleFrames = [], analysis = {}) {
  const frames = Array.isArray(sourceStyleFrames) ? sourceStyleFrames : [];
  const shots = Array.isArray(analysis?.shots) ? analysis.shots : [];
  if (shots.some(sourceHasPerson)) return [];
  return frames.slice(0, 3);
}

/** 生成带样式的 ASS 字幕（大字号、描边、底部居中、长句自动换行） */
function buildAss(scenes, durations, analysis) {
  const caption = assCaptionConfig(analysis);
  const head = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, Outline, Shadow, Alignment, MarginL, MarginR, MarginV
Style: D,PingFang SC,${caption.fontSize},&H00FFFFFF,&H00000000,&H90000000,1,3,1,${caption.align},80,80,${caption.marginV}

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  let cur = 0;
  const lines = scenes.map((s, i) => {
    const start = assTime(cur); cur += durations[i]; const end = assTime(cur);
    const text = assText(s.text);
    return `Dialogue: 0,${start},${end},D,,0,0,0,,${text}`;
  });
  return head + lines.join('\n') + '\n';
}

function fallbackText(type, name, lang) {
  if (lang === 'zh-CN') {
    if (type === 'hook') return '熬夜脸也能急救';
    if (type === 'demo') return `敷上${name}试试`;
    if (type === 'proof') return '揭下来水润感在线';
    return '这片补水感真香';
  }
  if (type === 'hook') return `Stop scrolling for ${name}`;
  if (type === 'demo') return `Trying ${name} now`;
  if (type === 'proof') return 'Look at that glow';
  return 'Tap to try it today';
}

const TEMPLATE = (name, lang = 'en-US') => ([
  { type: 'hook', text: fallbackText('hook', name, lang), visual: '商品吸睛特写，突出外观质感', motion: '镜头缓慢推近商品', withModel: false },
  { type: 'demo', text: fallbackText('demo', name, lang), visual: '展示商品核心使用场景与卖点细节', motion: '演示商品功能、细节特写', withModel: false },
  { type: 'cta', text: fallbackText('cta', name, lang), visual: '模特手持商品微笑推荐', motion: '模特轻微展示商品', withModel: true },
]);

export function fallbackScenesForSource(name, lang = 'zh-CN', analysis = {}) {
  const shots = Array.isArray(analysis?.shots) ? analysis.shots : [];
  if (!shots.length) return TEMPLATE(name, lang);
  return shots.slice(0, 6).map((shot, i) => {
    const type = shot.role || (i === 0 ? 'hook' : i === shots.length - 1 ? 'cta' : 'demo');
    const hasPerson = sourceHasPerson(shot);
    return {
      sourceShotIndex: shot.index || i + 1,
      durationRatio: shot.durationRatio,
      type,
      text: fallbackText(type, name, lang),
      visual: hasPerson
        ? `模特在源视频同款生活化场景中使用/试用${name}，动作参考：${shot.action || '自然展示商品'}`
        : `${name}商品特写或包装细节，风格参考源镜头：${shot.action || shot.visualStyle || '商品展示'}`,
      motion: shot.camera || '轻微手持感',
      withModel: hasPerson,
      framing: shot.framing,
      composition: shot.composition,
      lighting: shot.lighting,
      color: shot.color,
      captionStyle: shot.captionStyle,
      transition: shot.transition,
    };
  });
}

/** 是否「额度不足/欠费」类错误（中转账户没钱了） */
export function isQuotaError(e) {
  return /额度不足|余额|欠费|insufficient_user_quota|insufficient.?quota|quota.?exceeded|payment.?required|billing/i.test(String(e?.message || e || ''));
}

// "余额/额度耗尽"信号（fal: Exhausted balance / User is locked；可灵: balance not enough）
function looksLikeNoBalance(s) {
  return /Exhausted balance|balance not enough|User is locked|insufficient|payment.?required|额度不足|余额|欠费/i.test(String(s || ''));
}
// 视频引擎熔断器：当 fal+可灵 都因"余额耗尽"导致整片视频失败时熔断一段时间。
// 之后的生成请求在 preflight 处被秒拒（不建任务/不扣费/不让用户白等十几分钟），提示充值。
// 下次成功出片或熔断到期后自动恢复（充值后≤10分钟自愈）。
let _videoExhaustedUntil = 0;
const VIDEO_BREAKER_MS = 10 * 60 * 1000;
export const isVideoEngineExhausted = () => Date.now() < _videoExhaustedUntil;
export const tripVideoBreaker = () => { _videoExhaustedUntil = Date.now() + VIDEO_BREAKER_MS; };
export const clearVideoBreaker = () => { _videoExhaustedUntil = 0; };

/**
 * 生成前服务自检：任一关键付费模型欠费/未配置 → {ok:false, reason}。
 * 让前端在「不扣费、不建任务」前提下直接拦下，提示联系管理员。
 */
export async function preflightAIHealth() {
  if (!fal.isConfigured() && !kling.isConfigured()) return { ok: false, reason: '视频引擎(fal/可灵)未配置' };
  if (isVideoEngineExhausted()) return { ok: false, reason: '视频模型没额度了，请联系管理员充值' };
  if (!llm.isConfigured() && !gemini.isConfigured()) return { ok: false, reason: 'AI 文案/出图服务未配置' };
  // 轻量探一次 ezmodel 额度（导演/识别/出图共用同一中转账户）
  try {
    await llm.generateText('ok', { maxTokens: 1, timeoutMs: 15000 });
  } catch (e) {
    if (isQuotaError(e)) {
      notifyAdmin('出图/文案模型没额度了', 'ezmodel(导演/识别/出图共用账户)额度不足，生成已无法进行。请尽快充值。');
      return { ok: false, reason: '出图/文案模型没额度了，请联系管理员充值' };
    }
    // 其它异常(网络抖动等)不拦截，让正式流程去跑/降级
  }
  return { ok: true };
}

/**
 * 纯函数：计算每镜时长（不依赖 AI/ffmpeg/IO，可单独单测各种场景）。
 * 关键不变量：没配音时总时长应贴合源视频时长(不超太多)，否则合成时会被背景乐 -shortest 砍掉结尾。
 * @returns {{durations:number[], note:string|null}}
 */
export function computeSceneDurations(scenes, sceneAudios, sourceDurationSec = 0, targetDurationSec = 0) {
  const sourceTotal = clampNumber(sourceDurationSec, 0, SOURCE_VIDEO_REFERENCE_MAX_SEC, 0);
  const ratioSum = scenes.reduce((sum, s) => sum + (Number(s.durationRatio) || 0), 0);
  // 用户指定目标总时长(短/标准/长) → 用它(钳到合理范围)；否则跟源视频/配音
  const userTotal = targetDurationSec ? clampNumber(targetDurationSec, Math.max(4, scenes.length * 2), OUTPUT_VIDEO_MAX_SEC, 0) : 0;
  const targetTotal = userTotal
    || (sourceTotal
      ? Math.min(OUTPUT_VIDEO_MAX_SEC, Math.max(scenes.length * 2.2, sourceTotal))
      : sceneAudios.reduce((sum, a) => sum + Math.max(1.2, a?.duration || 0), 0));
  const useRhythm = userTotal || sourceTotal; // 有目标总时长(用户或源)就按比例分配各幕，否则跟配音
  const maxScene = userTotal ? 10 : 9;          // 放宽单幕上限：别把源的长镜头压短(Seedance 单片≤10s)，慢节奏才不碎
  const evenRatio = 1 / Math.max(1, scenes.length);
  let durations = scenes.map((s, i) => {
    const hasVoice = !!sceneAudios[i]?.path;
    // 没配音时不要用 4 秒默认值兜底——否则每镜被撑到 4 秒、总时长远超目标、被 -shortest 砍掉结尾
    const audioDur = hasVoice ? Math.max(1.2, sceneAudios[i].duration || 3) : 0;
    const srcRatio = ratioSum > 0 ? (Number(s.durationRatio) || 0) / ratioSum : evenRatio;
    // 没配音时偏均匀(0.4源+0.6均)，各幕接近、总时长贴合目标；某幕不过长、结尾不被砍
    const ratio = hasVoice ? (0.5 * srcRatio + 0.5 * evenRatio) : (0.4 * srcRatio + 0.6 * evenRatio);
    const rhythmDur = useRhythm ? clampNumber(targetTotal * ratio, 2.0, maxScene, audioDur || 2.8) : (audioDur || 3);
    return Math.max(audioDur, rhythmDur);
  });
  let note = null;
  const plannedTotal = durations.reduce((sum, d) => sum + d, 0);
  if (plannedTotal > OUTPUT_VIDEO_MAX_SEC) {
    const minSceneDur = 1.8;
    const fixedTotal = minSceneDur * scenes.length;
    const flexTotal = durations.reduce((sum, d) => sum + Math.max(0, d - minSceneDur), 0);
    const flexBudget = Math.max(0, OUTPUT_VIDEO_MAX_SEC - fixedTotal);
    durations = durations.map((d) => minSceneDur + (flexTotal ? Math.max(0, d - minSceneDur) * (flexBudget / flexTotal) : 0));
    note = `成片时长已压缩到约 ${OUTPUT_VIDEO_MAX_SEC} 秒以内`;
  }
  return { durations, note };
}

/**
 * 卡点：把分镜切点吸附到最近的音乐拍点（纯函数、可单测）。
 * 保持总时长不变；每幕 ≥ minScene、≥ 各自配音时长；tolerance 内有拍点才吸附，否则保留原切点(不硬卡)。
 * @param {number[]} durations 每镜时长  @param {number[]} beats 拍点(秒)  @returns {number[]} 吸附后的每镜时长
 */
export function snapToBeats(durations, beats, { minScene = 1.8, tolerance = 0.5, audioDurs = [] } = {}) {
  const n = durations.length;
  if (n < 2 || !Array.isArray(beats) || beats.length < 2) return durations.slice();
  const total = durations.reduce((a, b) => a + b, 0);
  const sorted = beats.filter((b) => b > 0.3 && b < total - 0.3).sort((a, b) => a - b);
  if (!sorted.length) return durations.slice();
  const cuts = []; let acc = 0;
  for (let i = 0; i < n - 1; i++) { acc += durations[i]; cuts.push(acc); }
  let prev = 0;
  const snapped = cuts.map((c, i) => {
    let best = c, bd = Infinity;
    for (const b of sorted) { const d = Math.abs(b - c); if (d < bd) { bd = d; best = b; } }
    let nc = bd <= tolerance + 1e-6 ? best : c; // +epsilon 容浮点误差
    const minThis = Math.max(minScene, audioDurs[i] || 0);
    nc = Math.max(nc, prev + minThis);                  // 该幕不短于下限/配音
    nc = Math.min(nc, total - minScene * (n - 1 - i));   // 给后面每幕留够 minScene
    prev = nc;
    return nc;
  });
  const out = []; let lastCut = 0;
  for (const c of snapped) { out.push(+(c - lastCut).toFixed(3)); lastCut = c; }
  out.push(+(total - lastCut).toFixed(3));
  return out;
}

/**
 * 合成成片：纯 ffmpeg（裁剪+拼接+字幕+背景乐+配音+淡出+封面），不含 AI、不上传。
 * 返回本地路径，便于离线测试 + 复用于"换单镜/重做"的重新合成。
 * @returns {{finalPath:string, coverPath:string, srtPath:string, duration:number}}
 */
export async function composeVideo({ work, scenes, sceneDurations, sceneClips, sceneAudios = [], ttsOk = false, analysis = null, opts = {}, notes = [] }) {
  // 把每镜裁到其时长（防拼接后总长超音频被 -shortest 砍尾）
  const trimmed = [];
  for (let i = 0; i < sceneClips.length; i++) {
    const t = join(work, `vt_${i}.mp4`);
    try {
      await ff.ffmpeg(['-y', '-i', sceneClips[i], '-t', String(Math.max(1.2, sceneDurations[i])), '-an', '-r', '30', '-pix_fmt', 'yuv420p', t]);
      trimmed.push(t);
    } catch { trimmed.push(sceneClips[i]); }
  }
  const concatPath = join(work, 'concat.mp4');
  if (trimmed.length === 1) await ff.toVertical(trimmed[0], concatPath);
  else await ff.concatVideo(trimmed, concatPath);

  const ass = buildAss(scenes, sceneDurations, analysis);
  writeFileSync(join(work, 'subs.ass'), ass);
  let cur = 0;
  const srt = scenes.map((s, i) => {
    const t = (x) => { const p = (n, l = 2) => String(n).padStart(l, '0'); const ms = Math.floor((x % 1) * 1000); return `${p(Math.floor(x / 3600))}:${p(Math.floor(x / 60) % 60)}:${p(Math.floor(x) % 60)},${p(ms, 3)}`; };
    const seg = `${i + 1}\n${t(cur)} --> ${t(cur + sceneDurations[i])}\n${s.text}\n`;
    cur += sceneDurations[i]; return seg;
  }).join('\n');
  writeFileSync(join(work, 'subs.srt'), srt);

  let bgmPath = null;
  if (opts.generate_music !== false && !ttsOk && existsSync(join(work, 'src.mp4'))) {
    try {
      const total = (await ff.probe(concatPath)).duration || sceneDurations.reduce((a, b) => a + (b || 0), 0) || 8;
      bgmPath = join(work, 'bgm.mp3');
      const fadeSt = Math.max(0, total - 1).toFixed(2);
      // -stream_loop -1：源音乐若比成片短就循环铺满，保证覆盖全片，不被 -shortest 砍尾
      await ff.ffmpeg(['-y', '-stream_loop', '-1', '-i', join(work, 'src.mp4'), '-vn', '-t', String(total), '-af', `volume=${ttsOk ? 0.22 : 0.9},afade=t=out:st=${fadeSt}:d=1`, '-c:a', 'mp3', bgmPath]);
    } catch (e) { bgmPath = null; notes.push('背景乐降级: ' + String(e.message || e).split('\n')[0].slice(0, 50)); }
  }

  let staged = concatPath;
  if (ttsOk) {
    const alist = join(work, 'alist.txt');
    const paddedAudios = [];
    for (let i = 0; i < sceneAudios.length; i++) {
      const padded = join(work, `ap_${i}.mp3`);
      await ff.ffmpeg(['-y', '-i', sceneAudios[i].path, '-af', `apad,atrim=0:${Math.max(1.2, sceneDurations[i])}`, '-c:a', 'mp3', padded]);
      paddedAudios.push(padded);
    }
    writeFileSync(alist, paddedAudios.map((p) => `file '${p}'`).join('\n'));
    const voice = join(work, 'voice.mp3');
    await ff.ffmpeg(['-y', '-f', 'concat', '-safe', '0', '-i', alist, '-c', 'copy', voice]);
    const av = join(work, 'av.mp4');
    if (bgmPath) {
      const mixed = join(work, 'mixed.mp3');
      try {
        await ff.ffmpeg(['-y', '-i', voice, '-i', bgmPath, '-filter_complex', '[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[a]', '-map', '[a]', '-c:a', 'mp3', mixed]);
        await ff.addAudio(concatPath, mixed, av);
        notes.push('配音 + 源视频背景乐');
      } catch { await ff.addAudio(concatPath, voice, av); }
    } else {
      await ff.addAudio(concatPath, voice, av);
    }
    staged = av;
  } else if (bgmPath) {
    const av = join(work, 'av_bgm.mp4');
    await ff.addAudio(concatPath, bgmPath, av);
    staged = av;
    notes.push('已用源视频音乐作背景乐');
  }

  const finalPath = join(work, 'final.mp4');
  // 结尾淡出（与字幕烧录合并成一道滤镜）
  let fadeVf = '';
  try {
    const sd = (await ff.probe(staged))?.duration || 0;
    if (sd > 1.2) fadeVf = `fade=t=out:st=${Math.max(0, sd - 0.6).toFixed(2)}:d=0.6`;
  } catch { /* 探测失败就不加淡出 */ }
  let burned = false;
  if (opts.generate_subtitle !== false) {
    const vf = fadeVf ? `subtitles=subs.ass,${fadeVf}` : 'subtitles=subs.ass';
    try { await ff.ffmpeg(['-y', '-i', staged, '-vf', vf, finalPath], { cwd: work }); burned = true; }
    catch (e) { notes.push('字幕烧录降级: ' + String(e.message || e).split('\n')[0]); }
  }
  if (!burned) {
    if (fadeVf) {
      try { await ff.ffmpeg(['-y', '-i', staged, '-vf', fadeVf, finalPath]); }
      catch { await ff.ffmpeg(['-y', '-i', staged, '-c', 'copy', finalPath]); }
    } else {
      await ff.ffmpeg(['-y', '-i', staged, '-c', 'copy', finalPath]);
    }
  }

  const coverPath = join(work, 'cover.jpg');
  await ff.thumbnail(finalPath, coverPath, 0);
  const meta = await ff.probe(finalPath);
  return { finalPath, coverPath, srtPath: join(work, 'subs.srt'), duration: meta.duration };
}

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
    // 换单镜：input.regen = { origTaskId, sceneIndex }。从原任务 output_json 取回每镜底图/动画片缓存，
    // 只重生 sceneIndex 那一镜，其余镜直接复用缓存（不重跑解析/导演/出图/视频引擎），再整体重新合成。
    let regen = null;
    if (input.regen && Number.isInteger(input.regen.sceneIndex)) {
      try {
        const orig = await getById('generation_tasks', input.regen.origTaskId);
        const o = orig?.output_json || {};
        if (Array.isArray(o.shots) && o.shots.length && Array.isArray(o.sceneClips) && o.sceneClips.length === o.shots.length) {
          regen = {
            sceneIndex: input.regen.sceneIndex,
            scenes: o.shots,
            sceneImages: o.sceneImages || [],
            sceneClips: o.sceneClips || [],
            sceneDurations: o.sceneDurations || [],
            usedProvider: o.usedProvider || '',
            // 用持久化的风格指纹 + 源分镜重建一个精简 analysis（够 makeSceneImage/buildAss/computeSceneDurations 用），跳过昂贵的 Gemini 解析
            analysis: { ...(o.styleFingerprint || {}), shots: o.sourceShots || [], durationSec: o.duration || 0 },
          };
        }
      } catch (e) { notes.push('换单镜缓存加载失败，回退整条生成: ' + String(e.message || e).split('\n')[0].slice(0, 60)); }
    }
    const lang = opts.language || 'zh-CN';
    const LANG_NAMES = { 'zh-CN': '简体中文', 'en-US': 'English（英文）', 'ja-JP': '日本語（日文）', 'es-ES': 'Español（西班牙语）' };
    const langName = LANG_NAMES[lang] || lang;
    const langRule = `【语言硬性要求·最高优先级】所有镜头的口播 text 必须用「${langName}」书写：${lang === 'en-US' ? '纯英文，不得出现任何汉字' : lang === 'ja-JP' ? '纯日文，不得夹简体中文' : lang === 'es-ES' ? '纯西班牙语，不得夹中文/汉字' : '简体中文'}。visual/motion 字段仍用中文（仅供生成画面，不影响口播语言）。`;

    const urlOf = async (id) => (id ? (await getById('assets', id))?.file_url || null : null);
    const productUrl = await urlOf(assets.product_image_id);
    let modelUrl = await urlOf(assets.model_image_id); // 可被"自动虚拟模特"重赋值
    let baseImageUrl = modelUrl || productUrl || input.previewUrl || null;

    // 前置硬校验：没有可用视频引擎(可灵)就别白跑——直接失败并触发自动退款
    if (!fal.isConfigured() && !kling.isConfigured()) {
      throw new Error('视频生成服务暂时不可用（视频引擎未配置）。请联系管理员处理，本次积分已自动退还。');
    }

    // 识别商品（即使用户没填，也让导演/文案知道这是什么货 + 品类）
    let productDesc = '';
    try {
      if (productUrl && gemini.isConfigured()) {
        productDesc = (await gemini.analyzeImages('用一句话描述这个电商商品：品类 + 外观 + 核心卖点，简洁中文', [productUrl])).trim().slice(0, 240);
      }
    } catch (e) { notes.push('商品识别降级: ' + String(e.message || e).split('\n')[0]); }
    // 商品文字线索（名称+识别描述+卖点）——匿名镜的出图规则会用到，必须在 makeScene 作用域可见
    const productText = [product.name, productDesc, ...(product.sellingPoints || [])].filter(Boolean).join(' ');
    // 商品是否"穿在身上"的(服装/鞋包/配饰)——决定是否做"服装锁"+ 出图时不喂源风格帧(防把源里别款穿搭画进来)
    const productIsWearable = /衣|裙|裤|鞋|靴|包|帽|袜|内衣|文胸|外套|上衣|连衣|睡衣|吊带|服[装饰]|穿戴|饰品|项链|手表|手链|戒指|耳[环钉]|眼镜|墨镜|围巾|腰带|配饰|fashion|dress|shirt|skirt|wear/i.test(productText);

    // ── 1. 解析爆款视频（有源视频时分析其分镜结构，供导演参考）──
    await setStep(0, { status: 'running' });
    let analysis = regen ? regen.analysis : null; // 换单镜：复用缓存的精简 analysis → 下面 `&& !analysis` 的 Gemini 解析循环天然跳过（但仍会下载源视频+抽帧供出图/背景乐用）
    let sourceStyleFrames = [];
    try {
      if (task.source_video_id && gemini.isConfigured()) {
        const sv = await getById('source_videos', task.source_video_id);
        const svAsset = sv?.asset_id ? await getById('assets', sv.asset_id) : null;
        if (svAsset?.file_url) {
          const vpath = await download(svAsset.file_url, join(work, 'src.mp4'));
          const svMeta = await ff.probe(vpath);
          const originalDuration = svMeta.duration || 30;
          const sdur = Math.min(SOURCE_VIDEO_REFERENCE_MAX_SEC, originalDuration);
          const fps = Math.min(1, Math.max(0.05, 14 / sdur)); // 自适应：跨整段均匀抽~14帧，覆盖全片而非只看开头
          await ff.extractFrames(vpath, join(work, 'f_%03d.jpg'), fps, sdur);
          const frameFiles = readdirSync(work).filter((f) => f.startsWith('f_')).sort().slice(0, 10);
          const frames = frameFiles.map((f) => readFileSync(join(work, f)));
          sourceStyleFrames = pickSpread(frameFiles, 4).map((f) => readFileSync(join(work, f)));
          // 精简 schema(每镜只留关键字段)→ 输出更短、更不易被截断成空；2 次重试兜瞬时空响应
          const analyzePrompt =
            `这是一条电商带货短视频按时间顺序均匀抽取的帧(只参考前${Math.round(sdur)}秒${originalDuration > SOURCE_VIDEO_REFERENCE_MAX_SEC ? `，原视频约${Math.round(originalDuration)}秒，后半段忽略` : ''})。请像短视频导演一样做"风格指纹"拆解，必须只输出 JSON、不要任何解释或 markdown。schema：` +
            `{"durationSec":总秒数,"tone":"口播/情绪基调","pacing":"快/中/慢+节奏","colorPalette":"主色调/饱和度","lighting":"光线氛围","cameraLanguage":"常用景别与运镜","editingRhythm":"剪辑/卡点/转场规律","captionStyle":"字幕/贴纸样式","hookPattern":"前3秒钩子","shots":[{"index":1,"durationRatio":0.2,"shotType":"特写/近景/中景/全景/文字","framing":"景别画幅","camera":"推近/拉远/摇/移/手持/固定","action":"具体动作或状态","role":"hook/demo/proof/cta","hasPerson":"none/hand/full"}]}` +
            `。重点估算每镜时长占比 durationRatio(各镜相加≈1)与动作 action，别泛泛而谈。`;
          for (let attempt = 0; attempt < 2 && !analysis; attempt++) {
            try {
              const txt = await gemini.analyzeImages(analyzePrompt, frames);
              analysis = normalizeAnalysis(gemini.parseJson(txt), sdur);
            } catch (e) {
              if (attempt === 1) throw e;
              notes.push('解析重试: ' + String(e.message || e).split('\n')[0].slice(0, 50));
            }
          }
        }
      }
    } catch (e) { notes.push('解析降级: ' + String(e.message || e).split('\n')[0]); }
    await setStep(0, { status: (task.source_video_id && analysis?.shots?.length) ? 'succeeded' : 'skipped', note: analysis?.shots?.length ? `复刻源视频 ${analysis.shots.length} 个分镜` : (task.source_video_id ? '源视频解析失败→默认结构(背景乐仍取源视频)' : '无源视频→默认结构') });

    // ── 1.5 自动虚拟模特 ──
    // 没上传模特图、但"源视频真人出镜"或"商品是穿戴类" → 自动造一个全新虚拟模特(参考源人物气质、长相必须不同)，
    // 设为 modelUrl 走正常模特链路(各镜引用同一张→一致)。否则服装类会变成"没人穿的衣服平铺/腾空"。纯商品源不触发。
    if (!regen && !modelUrl) {
      const srcHasPerson = Array.isArray(analysis?.shots) && analysis.shots.some((s) => s.hasPerson && String(s.hasPerson) !== 'none');
      const wearable = /衣|裙|裤|鞋|靴|包|帽|袜|内衣|文胸|外套|上衣|连衣|服[装饰]|穿戴|饰品|项链|手表|手链|戒指|耳[环钉]|眼镜|墨镜|围巾|腰带|配饰|fashion|dress|shirt|wear/i.test([product.name, productDesc].filter(Boolean).join(' '));
      if (srcHasPerson || wearable) {
        try {
          const vmRefs = [productUrl, ...sourceStyleFrames.slice(0, 1)].filter(Boolean);
          const vmPrompt = '电商时装/带货竖版大片(9:16)：生成一位真实自然的模特，正在自然穿着或展示参考的这件商品，全身或3/4身、构图高级、专业布光、真实肌肤与材质质感、生活化不僵硬。【硬性】这是一个全新虚构的模特：五官长相必须与任何参考图里的真实人物明显不同、绝不雷同，只借鉴气质/身形/穿搭风格，绝不复制脸；画面干净、无任何文字水印。';
          const vm = await image.generate(vmPrompt, vmRefs, { aspectRatio: '9:16', provider: opts.models?.image });
          modelUrl = await uploadBuffer(makePath(task.user_email, 'virtual-model', 'vm.png'), vm.buffer, vm.mimeType);
          baseImageUrl = modelUrl || baseImageUrl;
          notes.push('未上传模特：已自动生成虚拟模特(全新人物)');
        } catch (e) { notes.push('虚拟模特生成失败，降级纯商品: ' + String(e.message || e).split('\n')[0].slice(0, 60)); }
      }
    }

    // ── 2. 导演分镜脚本（口播 + 画面 + 运动 + 是否出模特）──
    await setStep(1, { status: 'running' });
    let scenes = regen ? regen.scenes.slice() : null; // 换单镜：复用缓存分镜，跳过导演 LLM（下面归一化是幂等的，重跑无害）
    try {
      if (!regen && llm.isConfigured()) {
        const hasSrc = Array.isArray(analysis?.shots) && analysis.shots.length;
        const tone = (hasSrc && analysis.tone) ? String(analysis.tone) : '活泼种草';
        const formal = /正式|专业/.test(tone);
        const common = `${langRule}\n商品：${product.name ? product.name + '；' : ''}${productDesc || '(见参考图)'}。${product.sellingPoints?.length ? '卖点：' + product.sellingPoints.join('、') + '。' : ''}${modelUrl ? '\n用户已上传模特图：可安排模特出镜镜头(withModel=true)，模特长相只以模特图为准。' : '\n用户未上传模特图：所有镜头都用纯商品(withModel=false、personMode=none)，绝不安排真人/模特/手部出镜的镜头。'}`;
        const sourceStyle = hasSrc ? styleFingerprint(analysis, null) : '';
        // 只给导演最关键的结构字段（构图/光线/色调/字幕等细节出图时再从源分镜取）——prompt 太大会让 LLM 只吐一个"["
        const sourceShots = hasSrc
          ? JSON.stringify(analysis.shots.map((shot) => ({
            i: shot.index,
            dr: shot.durationRatio,
            role: shot.role,
            framing: shot.framing,
            camera: shot.camera,
            action: shot.action,
            person: shot.hasPerson,
          }))).slice(0, 1500)
          : '';
        // 关键约束：每镜是"静态图+轻运镜"短片，演不出复杂动作 → 文案只说画面能展示的状态/卖点，避免文案与画面对不上
        const realityRule = `【非常重要】每个分镜是由一张静态图生成的约4-10秒短片，只能做缓慢推近/轻移/轻微旋转等"轻运镜"，演不出"拧开盖子/倒水/翻转/手部操作"等复杂动作。【节奏铁律】镜头时长要贴合内容气质：优雅/慢节奏/大片感的内容用更长的镜头(单镜7-10秒)、让画面多停留，绝不快切碎切；只有快节奏带货才短而密。宁慢勿碎。所以：(a) visual 要拍"一个有说服力的状态/瞬间"(例：盖子已拧开摆在旁、露出内胆与厚密封圈；产品细节微距；模特手持商品微笑)，不要写动作过程；(b) 文案只描述画面看得到的状态/卖点，绝不承诺画面演不出的动作——例如别写"拧开超顺滑"(演不出拧)，改成"密封圈厚实、倒提都不漏"这种描述状态/结果的说法。(c)【禁止凭空叠加产品图】绝不要写"画面上方/角落叠加产品图、产品图悬浮在画面、产品缩略图浮现"这类——AI 出图无法像后期那样干净叠一张图，只会把产品画成漂浮、变形的怪物悬在头顶；产品只能自然存在于场景中(被佩戴/手持/置于真实台面)。(d)【手是 AI 最大的弱点】visual 里少安排复杂或多个手部动作(双手比划/多个手势同时/手指点物)，否则容易画出多余的手、手臂或畸形手指；让人物以表情和轻微头部动作为主，手部尽量少露、最多一个简单自然的手势。(e)【只用咱这一款商品·别复刻源里的别款】复刻源镜头时只保留我们参考图里这一个商品，绝不把源视频里出现的别款或别类同类产品写进 visual——例：源里模特脖子上挂着头戴式大耳机、而咱的商品是耳挂式，就别写"耳机挂脖子"，按咱产品真实的佩戴方式写"戴在耳朵上"；商品的佩戴/使用方式必须符合它真实的品类。`;
        const lenHint = lang === 'en-US' ? '英文≤12词' : lang === 'ja-JP' ? '日文≤18字' : lang === 'es-ES' ? '西语≤14词' : '中文≤16字';
        const copyRule = `文案语气严格匹配${hasSrc ? `源视频基调【${tone}】` : '【活泼种草】'}：${formal ? '专业可信、干净利落、有说服力' : '口语化、有网感、像真人博主安利'}。每句口播极简短(${lenHint}，约3-5秒念完)，且必须与该镜 visual 强相关(说画面里看得到的东西)，绝不答非所问、绝不生硬广告腔。`;
        // 融入 ai-creative-ad-engine 的爆款文案规律（用所选语言的地道表达，不堆砌、不失真）
        const punchRule = `【爆款文案张力】(a) hook(第1句)必须强钩子——用好奇/反差/痛点共鸣抓住前3秒，让人停止划走，绝不平铺直叙介绍商品；(b) 适度用「${langName}」里地道的情绪/网感词(如英文 obsessed/game-changer/trust me，中文 绝了/真香/谁懂啊)，激发"想分享"，但每句最多1个、不堆砌、不浮夸失真；(c) proof 句给一个可信的"为什么"(数字/对比/真实使用感)；(d) cta 句给明确行动指令+轻微紧迫感(别太硬)；(e) 始终遵守上面的"只说画面演得出的状态"铁律。`;
        // 现役引擎(fal Seedance 2.0 / 可灵)都支持真人脸，不再限制；统一正常人物模式
        const seedanceFaceRule = `\n【人物模式】若模特完整出镜且可识别，personMode 用 "identifiable"；纯商品用 "none"；只拍手部/身体局部/背影/遮脸试用用 "anonymous"。`;
        // 只让导演输出必填字段（景别/构图/光线/色调/字幕/转场出图时自动取源分镜，不必导演重复写）——输出越短越不容易被截断
        const fmt = `输出 JSON 数组，每项只含这些字段：{"sourceShotIndex":源分镜i数字(从1开始,无源可省略),"durationRatio":沿用源镜头时长占比0-1,"type":"hook|demo|proof|cta","text":"口播文案(必须用${langName}！极简短一句,与visual强相关)","visual":"这一镜要拍的有说服力的状态/画面(具体中文,主角是本商品)","motion":"轻运镜描述","withModel":true或false,"personMode":"none|anonymous|identifiable"}。直接只输出 JSON 数组，不要任何解释或 markdown 说明。`;
        let prompt;
        if (hasSrc) {
          prompt = `你是电商带货短视频导演。任务：【复刻】下面这条爆款视频的拍法与节奏，把主角换成用户的商品，做一条"同款风格"的带货片。\n${common}\n` +
            `源视频风格指纹：${sourceStyle}\n源爆款分镜(按时间顺序)：${sourceShots}\n` +
            `复刻规则：\n1. 【按源视频分镜顺序与节奏逐镜复刻】沿用每镜的镜头类型、运镜、角色(role)与时长占比，分镜数贴合源视频(最多6镜)。【剪辑节奏必须和源视频一致——源是慢节奏/优雅大片感(镜头少而长、画面停留久)就做更少、更长的镜头(如3-4个、每个7-10秒)，绝不为凑数硬切成6个快镜；只有源本身快节奏密集切换才用多而短的分镜。durationRatio 要忠实反映源镜的长短(长镜给大占比)。宁少勿多、宁长勿碎，让成片的快慢观感和源视频一模一样】【必须完整复刻整条"转变弧"：尤其保留源视频的"成果展示镜"(如护肤后皮肤透亮/前后对比)和"收尾镜"(如打扮好/换装准备出门)，绝不能只做前半段就结束；最后一镜要落在一个完整有力的成果或行动状态(打扮好、微笑看镜头推荐)，不要停在动作中途】\n` +
            `2. 主体换成【用户的商品】：源镜纯产品→拍本商品对应特写；源镜"手+产品"操作演示→改拍其"结果状态"，withModel=false；源镜完整真人→模特出镜，withModel=true。【忠实复刻源镜人物"实际在做的事"：源镜是自然生活状态(素颜静坐/洗漱/起床)就照拍那个状态，严禁擅自改成"举着产品包装怼镜头"的硬广镜，除非源镜本身就在展示包装】【模特长相只以用户上传模特图为准：只写动作/姿态/表情/景别/场景，绝不写发色/发型/五官，也不照抄源视频人物长相】\n` +
            `3. 源视频纯文字/图形镜→复刻为"本商品英雄特写 + 同款节奏"，不改成普通棚拍海报。\n` +
            `4. 若某镜涉及"喝水/拿杯子/细长道具"，visual 改用不透明杯或直接手持商品，避免吸管、透明玻璃杯这类 AI 视频里极易变形/消失的细长或透明物。\n` +
            `5. ${realityRule}\n6. ${seedanceFaceRule}\n7. ${copyRule}\n8. ${punchRule}\n9. ${fmt}`;
        } else {
          prompt = `你是电商带货短视频导演。${common}` +
            `\n按"卖货逻辑"设计一条 ${lang} 带货短视频的3-4个分镜(hook/demo/proof/cta)。规则：` +
            `\n1. 结合品类：水杯/数码/家居→展示产品本身(英雄特写、细节微距、内部结构、卖点状态)；服装鞋包→模特展示版型。各镜画面不同、层层递进。` +
            `\n2. ${realityRule}\n3. ${copyRule}` +
            `\n4. withModel：重产品品类演示镜用纯商品(false)并安排1个模特镜(true)；重模特品类多数 true。\n5. ${seedanceFaceRule}\n6. ${punchRule}\n7. ${fmt}`;
        }
        // 导演这步最关键：拉长超时(180s) + 失败重试一次，避免瞬时抖动直接降级成模板分镜
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const txt = await llm.generateText(prompt, { maxTokens: 8000, timeoutMs: 180000 });
            scenes = llm.parseJson(txt);
            break;
          } catch (e) {
            if (attempt === 1) throw e;
            notes.push('导演重试: ' + String(e.message || e).split('\n')[0].slice(0, 60));
          }
        }
      }
    } catch (e) { notes.push('导演降级: ' + String(e.message || e).split('\n')[0]); }
    let usedTemplateScenes = false;
    if (!Array.isArray(scenes) || !scenes.length) {
      scenes = fallbackScenesForSource(product.name || productDesc || 'this product', lang, analysis);
      usedTemplateScenes = true;
      await setStep(1, { status: llm.isConfigured() ? 'failed' : 'skipped', note: '降级:模板分镜' });
    }
    scenes = scenes.slice(0, 6).map((s, i) => {
      const sourceShotIndex = normalizeSourceIndex(s.sourceShotIndex ?? s.sourceIndex, i, analysis);
      const sourceShot = sourceShotFor(analysis, sourceShotIndex ?? i);
      return {
        type: s.type || sourceShot?.role || 'demo',
        text: String(s.text || ''),
        visual: String(s.visual || s.text || sourceShot?.action || ''),
        motion: String(s.motion || sourceShot?.camera || ''),
        withModel: !!s.withModel,
        personMode: compactText(s.personMode, 40),
        sourceShotIndex,
        durationRatio: clampNumber(s.durationRatio ?? sourceShot?.durationRatio, 0, 1, sourceShot?.durationRatio || 0),
        framing: compactText(s.framing || sourceShot?.framing || sourceShot?.shotType, 120),
        composition: compactText(s.composition || sourceShot?.composition, 160),
        lighting: compactText(s.lighting || sourceShot?.lighting, 120),
        color: compactText(s.color || sourceShot?.color, 120),
        captionStyle: compactText(s.captionStyle || sourceShot?.captionStyle || analysis?.captionStyle, 160),
        transition: compactText(s.transition || sourceShot?.transition || analysis?.transitionStyle, 120),
        sourceStyle: styleFingerprint(analysis, sourceShot),
      };
    });
    scenes = applySeedancePersonPolicy(scenes, {
      videoModel: opts.models?.video,
      hasModel: !!modelUrl,
      productText: [product.name, productDesc, ...(product.sellingPoints || [])].filter(Boolean).join(' '),
      sourceShots: analysis?.shots || [],
      notes,
    });
    if (modelUrl) {
      // 上传了模特却一个模特镜都没有 → 强制末镜(cta)出模特
      if (!scenes.some((s) => s.withModel)) {
        const last = scenes[scenes.length - 1];
        last.withModel = true;
        last.personMode = 'identifiable';
        if (!/模特/.test(last.visual)) last.visual = '模特手持商品、微笑看镜头推荐，' + last.visual;
      }
    } else {
      // 没上传模特图 → 全程纯商品演示，绝不凭空生成"每镜长相都不一样"的随机 AI 人物
      scenes.forEach((s) => {
        if (s.withModel || s.personMode === 'identifiable' || s.personMode === 'anonymous') {
          s.withModel = false;
          s.personMode = 'none';
          if (/模特|真人|博主|女主|男主|出镜|人物|手持|手部/.test(String(s.visual || ''))) {
            s.visual = `${product.name || '商品'}的有说服力特写或真实使用场景（${s.text || '突出外观质感与核心卖点'}），画面不出现任何人物`;
          }
        }
      });
      notes.push('未上传模特：全程纯商品演示');
    }
    if (!usedTemplateScenes) {
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

    const { durations: computedDurations, note: durNote } = computeSceneDurations(scenes, sceneAudios, analysis?.durationSec, Number(opts.targetDurationSec) || 0);
    // 换单镜：复用原片每镜时长，确保新生成的目标镜与其余缓存镜在拼接/字幕时间轴上严格对齐
    let sceneDurations = (regen && Array.isArray(regen.sceneDurations) && regen.sceneDurations.length === scenes.length)
      ? regen.sceneDurations : computedDurations;
    if (durNote && !regen) notes.push(durNote);
    // 卡点：用源视频音乐做背景乐时，检测拍点，把分镜切换吸附到音乐节拍上(节奏跟拍、更像人手剪)
    if (!regen && opts.generate_music !== false && existsSync(join(work, 'src.mp4'))) {
      try {
        const beats = await ff.detectBeats(join(work, 'src.mp4'), { maxSec: SOURCE_VIDEO_REFERENCE_MAX_SEC });
        if (beats.length >= 3) {
          const audioDurs = sceneAudios.map((a) => (a?.path ? Math.max(1.2, a.duration || 0) : 0));
          const snapped = snapToBeats(sceneDurations, beats, { audioDurs });
          const t0 = sceneDurations.reduce((a, b) => a + b, 0), t1 = snapped.reduce((a, b) => a + b, 0);
          if (snapped.every((d) => d >= 1.4) && Math.abs(t1 - t0) < 0.6) {
            sceneDurations = snapped;
            notes.push(`卡点：切换对齐音乐拍点(${beats.length}拍)`);
          }
        }
      } catch (e) { notes.push('卡点降级: ' + String(e.message || e).split('\n')[0].slice(0, 50)); }
    }

    // ── 4. 逐镜生成画面：每镜生成"演示该商品"的图 → animate ──
    await setStep(3, { status: 'running' });
    const provDefs = {
      fal: fal.isConfigured() ? { name: 'Fal', run: (img, p, d) => fal.imageToVideo(img, p, { duration: String(d) }) } : null,
      seedance: seedance.isConfigured() ? { name: 'Seedance', run: (img, p, d) => seedance.imageToVideo(img, p, { duration: d }) } : null,
      kling: kling.isConfigured() ? { name: 'Kling', run: (img, p, d) => kling.imageToVideo(img, p, { duration: String(d) }) } : null,
    };
    // 默认走 fal(海螺等海外多模型，喂 URL 不跨境上传)；可灵退居兜底(仍可用)。都失败再走 Ken Burns。
    // 用户选的引擎做主、另一个兜底。'kling'→可灵优先；否则(seedance 默认)→fal(国际版 Seedance 2.0)优先
    const videoProviders = (opts.models?.video === 'kling'
      ? [provDefs.kling, provDefs.fal]
      : [provDefs.fal, provDefs.kling]).filter(Boolean);
    let usedAI = false, usedProvider = '', aiImagesOk = 0;
    const animatedScenes = new Set(); // 哪些镜头真用可灵动起来了——用于"部分失败逐个重试"

    const makeSceneImage = async (i) => {
      // 换单镜：非目标镜直接复用缓存底图（不重新出图）；计入成功数，避免后面把"只生成1镜"误判成"出图全失败"
      if (regen && i !== regen.sceneIndex) { if (regen.sceneImages[i]) aiImagesOk++; return regen.sceneImages[i] || null; }
      const s = scenes[i];

      // 4.1 这一镜的演示画面（按 visual + 是否出模特，保持商品/模特一致）
      let animBase = null;
      if ((productUrl || modelUrl) && image) {
        try {
          const personMode = s.personMode || (s.withModel ? 'identifiable' : 'none');
          const isAnonymous = personMode === 'anonymous';
          const isIdentifiable = personMode === 'identifiable';
          const assetRefs = isAnonymous
            ? [productUrl, modelUrl].filter(Boolean)
            : (s.withModel && modelUrl) ? [modelUrl, productUrl].filter(Boolean) : [productUrl || modelUrl].filter(Boolean);
          // 穿戴类(服装等)：不喂源视频风格帧——源帧里若是别款穿搭，Seedance/Seedream 会跟着画、把商品裙顶掉(串款)。
          // 源视频的氛围/构图仍由下面的文字 styleRule(风格指纹)继承，不靠这几张帧。
          const styleRefs = (analysis?.shots?.length && !productIsWearable) ? sourceStyleRefsForScene(sourceStyleFrames, analysis) : [];
          const refs = [...assetRefs, ...styleRefs];
          const sourceShot = sourceShotFor(analysis, s.sourceShotIndex ?? i);
          const sceneStyle = s.sourceStyle || styleFingerprint(analysis, sourceShot);
          const isZh = lang === 'zh-CN';
          const styleCue = sceneStyle
            ? `源爆款同款竖版短视频关键帧(9:16)，复刻第${(s.sourceShotIndex ?? i) + 1}镜的镜头语言`
            : (isZh ? '电商带货竖版图(9:16)' : '电商带货竖版海报图(9:16)');
          // 融入 ai-creative-ad-engine 的「品质 / 反AI感 / 氛围」关键词：提升高级感、降低 AI 廉价图痕迹
          const qualityCue = sceneStyle
            ? '在不改变源视频风格的前提下提升真实质感：真实材质纹理、自然阴影层次、轻微真实颗粒感；避免蜡像感/塑料感/六指/多手等手部畸形（双手须解剖正确、五指自然、绝不出现多余的手或手臂）'
            : '商业广告摄影质感、专业布光、浅景深、细节丰富；真实材质纹理、自然光线散射、真实的阴影层次、轻微胶片颗粒感、不完美但真实（避免蜡像感/塑料感/六指/多手等手部畸形（双手须解剖正确、五指自然、绝不出现多余的手或手臂））；构图高级克制、不廉价';
          const styleRule = sceneStyle
            ? `【源视频风格硬性继承】${sceneStyle}。这一镜必须继承源镜头的景别、构图、光线、色调、字幕/贴纸位置和短视频质感；不要自动改成通用明亮棚拍、白底商品图或普通电商海报，除非源视频本身就是这种风格。`
            : '光线明亮、背景干净有层次、电商质感。';
          const assetRule = isAnonymous
            ? '参考图说明：用户商品必须保持一致；用户模特图只能作为肤色、发型、身形、气质和穿搭氛围的弱参考，绝对不要还原或暴露可识别脸。'
            : `参考图说明：前${assetRefs.length}张是必须保持一致的用户商品/模特；`;
          const referenceRule = styleRefs.length
            ? `${assetRule}后${styleRefs.length}张来自源爆款视频，只能参考构图、灯光、色调、字幕位置、运镜氛围，不得复制源视频人物、原商品、品牌标识或具体文字。`
            : assetRule;
          // 物理可信：商品必须落地或被握持，杜绝"悬浮在纯色背景"——这是图生视频"凭空起飞/漂浮"的根因
          const groundRule = (s.withModel && modelUrl)
            ? '模特自然手持或使用该商品，商品与手部接触真实、比例协调'
            : '商品稳稳放在真实台面上（木桌/大理石台/桌面），带真实接触投影，或被手自然握持；绝不悬浮于纯色背景或半空中；商品尺寸与场景比例真实';
          const subjectRule = isAnonymous
            ? anonymousSubjectRule(s, productText, sourceShot)
            : isIdentifiable && modelUrl
              ? '模特的发色/发型/五官/长相严格以参考模特图为准（忽略文字里任何发色/外貌描述词），全程保持同一个人，正在自然展示或使用该商品'
              : '以商品为主角：商品的外形、轮廓、颜色、材质，以及上面的 logo/标志/文字/按钮/接口等细节，必须与参考商品图严格一致——不得改变形状、不得丢失或改动标志；商品清晰可见、占画面主体';
          const textRule = isZh ? '' : `画面可叠加少量、简短的「${langName}」海报文字点缀（卖点关键词/型号/NEW/折扣数字等），营造带货海报感；但硬性要求：①只用极简短的词或短语、拼写准确，绝不写长句或段落；②复杂介绍交给字幕；③画面里绝对不出现中文/汉字。`;
          // 禁止把源视频的原字幕(face mask/just woke up 等)抄进画面；中文档画面彻底无字(字幕后期统一加)
          const noSrcTextRule = isZh
            ? '【极重要·硬性】整张图必须完全干净、不含任何文字/字母/英文单词/字幕/水印——参考图角落里若有英文小字(如 face mask、just woke up、skincare done)，那是源视频残留，必须当它不存在、绝不重现；本片字幕后期统一添加。'
            : '严禁照搬/重现源爆款视频里的原英文字幕(如 face mask、just woke up 等)，那是源视频的文字、不属于本片。';
          // 避开吸管/透明玻璃杯这类后续视频里极易变形或消失的道具
          const propRule = '若画面涉及喝水/杯子等场景：用不透明杯具、不要吸管和透明玻璃杯。若是片状/贴片面膜：要像真实面膜那样在眼睛和嘴巴处留有开口、露出眼睛和嘴唇，不要糊成一整张盖住整脸的纸（否则嘴被糊住很假）。绝不要在画面上方/角落画悬浮的产品图或放大的产品缩略图——商品只能以实物形态自然出现在场景里（被佩戴/手持/置于台面），不得漂浮在人物头顶或半空。';
          // 商品唯一性·硬性：根治"串品类"（耳挂式被额外画成头戴式大耳机挂脖、源视频里别款同类产品被复刻进来）
          const productLockRule = '【商品唯一性·硬性】全片只能出现参考商品图里的这一个商品本体，严格保持它的品类与佩戴/使用方式（参考图是耳挂式就始终耳挂式、入耳式就始终入耳式、头戴式才头戴式）；绝不额外生成第二个、也绝不换成不同款式或不同品类的同类商品——例如不得把耳挂/入耳耳机画成头戴式大耳机，不得在脖子上/头上/画面角落另加一个耳机或同类产品；即便源视频镜头里出现别的款式同类产品，也只画我们参考图这一款、不复刻源视频里的别款产品。';
          // 服装锁：穿戴类商品全片必须是参考商品图里的这一件，绝不被源里的别款穿搭带偏(根治"好几个镜不是同一条裙子")
          const garmentRule = productIsWearable
            ? '【服装锁·硬性】人物身上穿/戴的必须是参考商品图里的这一件(同款式、同颜色、同印花、同面料、同领型、同长短、同细节)，全片每一镜都是这一件，绝不画成别的衣服/别的款式/别的颜色；源参考图里若出现别的穿搭，一律忽略其服装，只借鉴背景、光线、构图。'
            : '';
          const prompt = `${styleCue}：${s.visual}。${noSrcTextRule}${referenceRule}${subjectRule}。${styleRule}${groundRule}。${productLockRule}${garmentRule}${propRule}画面不要出现飞舞的蚊虫/灰尘/碎屑等微小动态主体（会糊成漂浮斑点）。${qualityCue}。${textRule}`;
          let c;
          try {
            c = await image.generate(prompt, refs, { aspectRatio: '9:16', provider: opts.models?.image });
          } catch (e1) {
            const m1 = String(e1.message || e1);
            // 安全系统拦截（贴身/敏感品常见）→ 换中性措辞、仅用商品图重试一次
            if (/safety|rejected|敏感|sensitive|policy|blocked/i.test(m1)) {
              const safePrompt = isAnonymous
                ? `电商带货竖版匿名试用图(9:16)：${s.visual}。${anonymousSubjectRule(s, productText, sourceShot)}不含裸露或敏感内容；商品与参考图一致、清晰，真实生活化试用场景。${qualityCue}。`
                : `电商带货竖版产品静物图(9:16)：${s.visual}。仅展示商品本身，构图干净、背景明亮整洁、得体专业，不含任何人物裸露或敏感内容。商品与参考图一致、清晰、光线明亮、电商质感。${qualityCue}。`;
              c = await image.generate(safePrompt, [productUrl].filter(Boolean), { aspectRatio: '9:16', provider: opts.models?.image });
              notes.push(`场景${i + 1}安全重试成功`);
            } else { throw e1; }
          }
          animBase = await uploadBuffer(makePath(task.user_email, 'scene', `s${i}.png`), c.buffer, c.mimeType);
          aiImagesOk++;
        } catch (e) { notes.push(`场景${i + 1}画面合成降级: ` + String(e.message || e).split('\n')[0].slice(0, 80)); }
      }
      if (!animBase) animBase = (s.personMode === 'anonymous' ? (productUrl || modelUrl) : (s.withModel ? (modelUrl || productUrl) : (productUrl || modelUrl))) || baseImageUrl;
      return animBase;
    };

    // 4.2 动画：底图全部出好后再单独跑可灵（此时没有出图在抢资源，干净环境——实测此条件下单条/双条并发都正常）
    const makeSceneVideo = async (i, animBase) => {
      const s = scenes[i];
      const dur = Math.max(2, Math.ceil(sceneDurations[i] || sceneAudios[i].duration));
      const d = dur > 5 ? 10 : 5;
      const vp = join(work, `v_${i}.mp4`);
      // 换单镜：非目标镜下载原片缓存动画片复用（不重跑可灵/海螺）；下载失败再落到下面重新生成
      if (regen && i !== regen.sceneIndex && regen.sceneClips[i]) {
        try { await download(regen.sceneClips[i], vp); usedAI = true; usedProvider = usedProvider || regen.usedProvider; animatedScenes.add(i); return vp; }
        catch (e) { notes.push(`场景${i + 1}缓存片下载失败，改重新生成`); }
      }
      // 4.2 animate（运动按 motion；可灵 → 失败兜底 Ken Burns）
      if (animBase) {
        // 只动镜头、不动主体：根除"商品自己起飞/漂浮/变形"的图生视频幻觉
        const sourceShot = sourceShotFor(analysis, s.sourceShotIndex ?? i);
        const sceneStyle = s.sourceStyle || styleFingerprint(analysis, sourceShot);
        const rhythmCue = sceneStyle
          ? `按源爆款第${(s.sourceShotIndex ?? i) + 1}镜的节奏做轻运镜：${s.motion || sourceShot?.camera || '保持源镜头运动感'}；剪辑节奏：${analysis?.editingRhythm || analysis?.pacing || '贴近源视频'}；转场倾向：${s.transition || analysis?.transitionStyle || '贴近源视频'}。`
          : `镜头运动：${String(s.motion || '缓慢推近').slice(0, 80)}。`;
        const anonymityMotionRule = s.personMode === 'anonymous'
          ? '全程保持匿名，不出现清晰可识别正脸；若是面膜/墨镜/口罩/防晒面罩等面部遮挡商品，保留真实头部、眼鼻口位置或自然脸部轮廓，不能变成空白脸、无脸人或假人面具；'
          : '';
        // 有人物的镜头：让模特/人物自然灵动地动起来（像源爆款那样）；纯产品镜才保持静止防漂浮
        const hasPerson = s.withModel || s.personMode === 'anonymous';
        const subjectMotionRule = hasPerson
          ? '画面里的人物要自然地动起来——以微笑、眨眼、说话口型、点头、转头、身体轻微律动等表情和头部动作为主，像真实带货博主出镜般生动鲜活；手部动作要少而小、五指始终保持正常、绝不多出一只手或手臂，不要快速或复杂的手部动作（手是最容易画崩的部位）；同时商品保持清晰、不变形；镜头可轻微跟随。切忌人物僵硬不动、像一张静止照片。'
          : '主体商品保持静止稳定、贴合台面或被手持，不漂浮、不起飞、不变形、不扭曲、不无故移动；商品的形状、logo/标志、按钮等细节全程保持一致、不变样不丢失；只移动镜头、主体不自行运动；重力与接触关系真实自然。';
        // 衣服不乱动不穿模 + 道具保持完整（治"模特弄衣服/穿模"和"吸管消失/杯子缺口"）
        const propStableRule = '模特的衣服自然贴身、不要去整理/拉扯/掀动衣物，衣物始终贴合身体、不穿模不穿帮；画面中的杯子、餐具、吸管等道具全程保持完整稳定，不变形、不增减、不消失、不无故出现。';
        const motionPrompt = `${rhythmCue}${anonymityMotionRule}${subjectMotionRule}${propStableRule}`.slice(0, 620);
        // Railway(海外) → 可灵(北京) 上传 2.5MB 大图极易超时：把底图重压成小 JPEG(同分辨率)再喂可灵，
        // 上传体积砍到 ~1/6，远不易超时（成片清晰度由可灵自身渲染决定，输入压一点几乎无感）。
        // fal 直接喂公网 URL（海外自取、不跨境上传）；可灵兜底才需要压缩图，懒压一次缓存
        let klingInput = null;
        const getKlingInput = async () => {
          if (klingInput) return klingInput;
          try {
            const kdl = join(work, `kdl_${i}.jpg`);
            await download(animBase, kdl);
            const ksm = join(work, `ksm_${i}.jpg`);
            await ff.ffmpeg(['-y', '-i', kdl, '-q:v', '7', ksm]);
            klingInput = readFileSync(ksm);
          } catch { klingInput = animBase; }
          return klingInput;
        };
        // fal 优先 → 可灵兜底；都失败再走 Ken Burns
        for (const prov of videoProviders) {
          try {
            const img = prov.name === 'Kling' ? await getKlingInput() : animBase;
            const url = await prov.run(img, motionPrompt, d);
            await download(url, vp);
            usedAI = true; usedProvider = prov.name; animatedScenes.add(i);
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

    // 阶段一：先并行出全部底图（Gemini 出图，互不干扰、快）
    const animBases = await Promise.all(scenes.map((_, i) => makeSceneImage(i)));
    // 阶段二：底图都好了再跑视频动画。fal 喂 URL、不跨境上传、实测并行(2条总耗时≈单条)，
    // 所以把所有镜头一次性丢给 fal 并行跑 → 视频阶段从"N批×2分钟"压到"≈1条2分钟"，整片提速一半。
    // (旧值 2 是可灵时代防上传挤爆用的，fal 无此问题。可灵兜底虽串行但已退居其次。)
    const VIDEO_CONCURRENCY = 6;
    const sceneVideos = new Array(scenes.length);
    let nextScene = 0;
    let videosDone = 0;
    await Promise.all(Array.from({ length: Math.min(VIDEO_CONCURRENCY, scenes.length) }, async () => {
      while (nextScene < scenes.length) {
        const i = nextScene++;
        sceneVideos[i] = await makeSceneVideo(i, animBases[i]);
        videosDone++;
        // 视频步占进度 60%→80%：按已完成镜数实时上涨 + 更新步注，避免整段卡 60%（这步最慢、最像卡死）。
        // 直接改 steps + setProgress，不走 setStep（setStep 会按"已完成步数"把进度重算回 60%）。
        try {
          steps[3] = { ...steps[3], status: 'running', note: `生成画面 ${videosDone}/${scenes.length} 镜` };
          await ctx.setSteps([...steps]);
          await ctx.setProgress(60 + Math.round((videosDone / scenes.length) * 20));
        } catch { /* 进度更新失败不影响生成 */ }
      }
    }));
    // 部分镜头可灵失败（常见于可灵临时变慢）→ 串行逐个补打一次，给第二次机会、且不增并发负载。
    // 全失败=可灵挂了，不补打（白耗时间），直接走下面的退款逻辑。
    const failedScenes = scenes.map((_, i) => i).filter((i) => !animatedScenes.has(i));
    if (failedScenes.length > 0 && failedScenes.length < scenes.length) {
      notes.push(`部分镜头可灵失败(${failedScenes.length}/${scenes.length})，逐个补打`);
      for (const i of failedScenes) sceneVideos[i] = await makeSceneVideo(i, animBases[i]);
    }
    // 出图全失败(额度不足) 或 视频引擎全程没成功(fal/可灵欠费、超时) → 成片必然不对 → 中止、退款、提示联系管理员
    if (aiImagesOk === 0 || !usedAI) {
      const noBalance = notes.some((n) => looksLikeNoBalance(n));
      const what = aiImagesOk === 0 ? '出图模型' : '视频模型';
      // 视频引擎因余额耗尽全军覆没 → 熔断，让后续请求在 preflight 处秒拒，别再让人白等十几分钟
      if (!usedAI && noBalance) tripVideoBreaker();
      if (noBalance) {
        notifyAdmin(`${what}没额度了`, `${what === '视频模型' ? '视频引擎(fal 主 / 可灵兜底)' : '出图/文案(ezmodel)'}余额耗尽，已有用户生成被中止并退款。请尽快充值。`);
        throw new Error(`${what}没额度了，请联系管理员充值。本次积分已自动退还。`);
      }
      throw new Error(`${what}暂时不可用，已中止生成。请稍后重试或联系管理员处理，本次积分已自动退还。`);
    }
    clearVideoBreaker(); // 走到这=本次视频引擎正常出片 → 解除熔断（充值后自愈）
    await setStep(3, { status: usedAI ? 'succeeded' : 'skipped', note: usedAI ? `视频源: ${usedProvider}` : '降级:静态画面' });

    // P1 地基：把每镜"底图URL + 动画片"持久化，供"换一版/换单镜/出多版"复用上游缓存（不重跑导演/出图）
    const sceneImages = animBases.slice();
    const sceneClips = [];
    for (let i = 0; i < sceneVideos.length; i++) {
      // 换单镜：非目标镜直接沿用原片缓存 URL，不重新上传（省存储/带宽）
      if (regen && i !== regen.sceneIndex && regen.sceneClips[i]) { sceneClips.push(regen.sceneClips[i]); continue; }
      try { sceneClips.push(await uploadBuffer(makePath(task.user_email, 'scene-clip', `c${i}.mp4`), readFileSync(sceneVideos[i]), 'video/mp4')); }
      catch { sceneClips.push(null); }
    }

    // ── 5. 合成：拼接 + 配音 + ASS字幕 + 封面 ──
    await setStep(4, { status: 'running' });
    // 把每镜视频裁到它自己配音的时长，避免拼接后总视频远长于音频、被 -shortest 截掉后面的镜（模特镜消失的根因）
    const trimmed = [];
    for (let i = 0; i < sceneVideos.length; i++) {
      const t = join(work, `vt_${i}.mp4`);
      try {
        await ff.ffmpeg(['-y', '-i', sceneVideos[i], '-t', String(Math.max(1.2, sceneDurations[i])), '-an', '-r', '30', '-pix_fmt', 'yuv420p', t]);
        trimmed.push(t);
      } catch { trimmed.push(sceneVideos[i]); }
    }
    const concatPath = join(work, 'concat.mp4');
    if (trimmed.length === 1) await ff.toVertical(trimmed[0], concatPath);
    else await ff.concatVideo(trimmed, concatPath);

    // ASS 字幕（大字号、描边、底部居中、自动换行）
    const ass = buildAss(scenes, sceneDurations, analysis);
    writeFileSync(join(work, 'subs.ass'), ass);
    // 同时存一份 srt 供下载
    let cur = 0;
    const srt = scenes.map((s, i) => {
      const t = (x) => { const p = (n, l = 2) => String(n).padStart(l, '0'); const ms = Math.floor((x % 1) * 1000); return `${p(Math.floor(x / 3600))}:${p(Math.floor(x / 60) % 60)}:${p(Math.floor(x) % 60)},${p(ms, 3)}`; };
      const seg = `${i + 1}\n${t(cur)} --> ${t(cur + sceneDurations[i])}\n${s.text}\n`;
      cur += sceneDurations[i]; return seg;
    }).join('\n');
    writeFileSync(join(work, 'subs.srt'), srt);

    // 背景乐：开了「背景音乐」且有参考源视频时，取源视频音轨（有配音则压低做轻背景乐、淡出）
    let bgmPath = null;
    if (opts.generate_music !== false && !ttsOk && existsSync(join(work, 'src.mp4'))) {
      try {
        const total = (await ff.probe(concatPath)).duration || sceneDurations.reduce((a, b) => a + (b || 0), 0) || 8;
        bgmPath = join(work, 'bgm.mp3');
        const fadeSt = Math.max(0, total - 1).toFixed(2);
        // -stream_loop -1：源音乐若比成片短就循环铺满，保证背景乐覆盖全片，视频不会被 -shortest 砍尾
        await ff.ffmpeg(['-y', '-stream_loop', '-1', '-i', join(work, 'src.mp4'), '-vn', '-t', String(total), '-af', `volume=${ttsOk ? 0.22 : 0.9},afade=t=out:st=${fadeSt}:d=1`, '-c:a', 'mp3', bgmPath]);
      } catch (e) { bgmPath = null; notes.push('背景乐降级: ' + String(e.message || e).split('\n')[0].slice(0, 50)); }
    }

    let staged = concatPath;
    if (ttsOk) {
      const alist = join(work, 'alist.txt');
      const paddedAudios = [];
      for (let i = 0; i < sceneAudios.length; i++) {
        const padded = join(work, `ap_${i}.mp3`);
        await ff.ffmpeg(['-y', '-i', sceneAudios[i].path, '-af', `apad,atrim=0:${Math.max(1.2, sceneDurations[i])}`, '-c:a', 'mp3', padded]);
        paddedAudios.push(padded);
      }
      writeFileSync(alist, paddedAudios.map((p) => `file '${p}'`).join('\n'));
      const voice = join(work, 'voice.mp3');
      await ff.ffmpeg(['-y', '-f', 'concat', '-safe', '0', '-i', alist, '-c', 'copy', voice]);
      const av = join(work, 'av.mp4');
      if (bgmPath) {
        // 配音 + 背景乐混音（配音为主，背景乐已压低；normalize=0 不自动衰减人声）
        const mixed = join(work, 'mixed.mp3');
        try {
          await ff.ffmpeg(['-y', '-i', voice, '-i', bgmPath, '-filter_complex', '[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[a]', '-map', '[a]', '-c:a', 'mp3', mixed]);
          await ff.addAudio(concatPath, mixed, av);
          notes.push('配音 + 源视频背景乐');
        } catch { await ff.addAudio(concatPath, voice, av); }
      } else {
        await ff.addAudio(concatPath, voice, av);
      }
      staged = av;
    } else if (bgmPath) {
      const av = join(work, 'av_bgm.mp4');
      await ff.addAudio(concatPath, bgmPath, av);
      staged = av;
      notes.push('已用源视频音乐作背景乐');
    }

    const finalPath = join(work, 'final.mp4');
    // 结尾淡出，避免戛然而止（与字幕烧录合并成一道滤镜，不额外多压一遍）
    let fadeVf = '';
    try {
      const sd = (await ff.probe(staged))?.duration || 0;
      if (sd > 1.2) fadeVf = `fade=t=out:st=${Math.max(0, sd - 0.6).toFixed(2)}:d=0.6`;
    } catch { /* 探测失败就不加淡出 */ }
    let burned = false;
    if (opts.generate_subtitle !== false) {
      const vf = fadeVf ? `subtitles=subs.ass,${fadeVf}` : 'subtitles=subs.ass';
      try { await ff.ffmpeg(['-y', '-i', staged, '-vf', vf, finalPath], { cwd: work }); burned = true; }
      catch (e) { notes.push('字幕烧录降级: ' + String(e.message || e).split('\n')[0]); }
    }
    if (!burned) {
      if (fadeVf) {
        try { await ff.ffmpeg(['-y', '-i', staged, '-vf', fadeVf, finalPath]); }
        catch { await ff.ffmpeg(['-y', '-i', staged, '-c', 'copy', finalPath]); }
      } else {
        await ff.ffmpeg(['-y', '-i', staged, '-c', 'copy', finalPath]);
      }
    }

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

    return {
      generatedVideoId: gv.id,
      videoUrl,
      coverUrl,
      subtitleUrl,
      duration: meta.duration,
      usedAI,
      ttsOk,
      shots: scenes,
      sceneImages,                 // P1：每镜底图 URL（"换一版/换单镜"复用，不重新出图）
      sceneClips,                  // P1：每镜动画片 URL（"换单镜/重合成"复用，不重跑可灵）
      sceneDurations,              // P1：每镜时长（重合成用）
      usedProvider,                // 本次用的视频引擎（"换一版"时换另一个）
      sourceShots: analysis?.shots || null,
      styleFingerprint: analysis ? {
        tone: analysis.tone,
        pacing: analysis.pacing,
        styleBrief: analysis.styleBrief,
        colorPalette: analysis.colorPalette,
        lighting: analysis.lighting,
        cameraLanguage: analysis.cameraLanguage,
        captionStyle: analysis.captionStyle,
        transitionStyle: analysis.transitionStyle,
      } : null,
      replicated: !!(analysis?.shots?.length),
      notes,
    };
  } catch (e) {
    // 失败时把诊断 notes 挂到错误上，让任务运行器存进 DB——否则一抛错 notes 就丢了，失败成黑盒
    try { if (e && Array.isArray(notes)) e.notes = notes.slice(-15); } catch { /* ignore */ }
    throw e;
  } finally {
    try { rmSync(work, { recursive: true, force: true }); } catch {}
  }
}
