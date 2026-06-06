/**
 * 爆款视频复刻 MVP —— 后端 API 路由
 * 挂载于 /api（见 server/index.js）。
 * 用户标识沿用现有模式：前端传 userEmail（body / query / x-user-email 头）。
 */
import { Router } from 'express';
import multer from 'multer';
import { insertRow, getById, selectOne, selectRows, updateById } from '../lib/supabase.js';
import { uploadBuffer, makePath } from '../lib/storage.js';
import { createTask, getTask, runTask } from './tasks.js';
import { runReplicaPipeline, preflightAIHealth } from './pipeline.js';
import { estimateCost, estimateRegenCost, pricingTable, RECHARGE_PACKAGES } from './pricing.js';
import { listVoices, DEFAULT_VOICE, resolveVoice } from './voices.js';
import { synthesize as ttsSynthesize } from './ai/tts.js';
import { getPoints, addPoints, deductPoints } from '../lib/points.js';
import { isTester } from '../lib/access.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } }); // PRD: ≤200MB

const ASSET_TYPES = ['product_image', 'outfit_image', 'model_image', 'face_image', 'pose_reference', 'source_video'];

export const replicaRouter = Router();

function getEmail(req, res) {
  const email = String(req.body?.userEmail || req.query?.userEmail || req.headers['x-user-email'] || '')
    .trim().toLowerCase();
  if (!email) { res.status(401).json({ success: false, message: '缺少用户标识 userEmail' }); return null; }
  return email;
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

// ── 一键复刻 ──────────────────────────────────────────────────
// POST /api/replica/generate
replicaRouter.post('/replica/generate', async (req, res) => {
  try {
    const email = getEmail(req, res); if (!email) return;
    const { sourceVideoId = null, options = {}, assets = {}, language = 'en-US', aspectRatio = '9:16', previewUrl = '', product = {}, scriptText = '', models = {} } = req.body || {};
    const mergedOptions = { ...options, language, aspectRatio, models };

    // 按所选模型估价
    const { cost, breakdown } = estimateCost(mergedOptions);

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
    const email = getEmail(req, res); if (!email) return;
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

// POST /api/replica/estimate  body: { models } —— 预估价（不扣费）
replicaRouter.post('/replica/estimate', (req, res) => {
  const { cost, breakdown } = estimateCost({ models: req.body?.models || {} });
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
