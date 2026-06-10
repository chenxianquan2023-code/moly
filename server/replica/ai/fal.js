/**
 * fal.ai 图生视频 后端适配器（默认 MiniMax Hailuo-02 标准档）
 * fal 是多模型中转：一个 FAL_KEY 通吃可灵/海螺/Runway/Wan 等；换 FAL_VIDEO_MODEL 即可切模型。
 * 关键优势：image_url 直接传公网 URL，由 fal(海外) 自己取图 —— Railway 不再跨境上传大图，根除超时。
 * 鉴权：Authorization: Key <FAL_KEY>（id:secret 格式整串）。密钥只从 env 读，绝不入库/入码。
 */
const FAL_KEY = process.env.FAL_KEY || '';
const MODEL = process.env.FAL_VIDEO_MODEL || 'bytedance/seedance-2.0/fast/image-to-video'; // Seedance 2.0 Fast 档(720p)：同画质、比 Standard 省~20%、更快；真人脸不封，对标 creatok
// 可灵也走 fal（同一个 FAL_KEY/余额）→ 弃用没钱的可灵北京账户。2.1 标准档 ~$0.056/秒，比 Seedance 还便宜，适合主力或兜底。
const KLING_MODEL = process.env.FAL_KLING_MODEL || 'fal-ai/kling-video/v2.1/standard/image-to-video';
const BASE = process.env.FAL_BASE_URL || 'https://queue.fal.run';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchRetry(url, opts, retries = 3) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try { return await fetch(url, opts); }
    catch (e) { lastErr = e; await sleep(600 * (i + 1)); }
  }
  throw lastErr;
}

/** 把入参统一成 fal 的 image_url：公网 URL/dataURI 直接用；Buffer→dataURI */
function toImageUrl(image) {
  if (Buffer.isBuffer(image)) return `data:image/jpeg;base64,${image.toString('base64')}`;
  const s = String(image || '');
  if (/^https?:\/\//i.test(s) || s.startsWith('data:')) return s;
  return s;
}

/**
 * 图生视频，返回视频直链 URL（fal 临时链，调用方应转存到自己的存储）。
 * @param {string|Buffer} image 主图（公网 URL 最佳：fal 海外自取，不跨境上传）
 * @param {string} prompt 运动/画面描述
 */
export async function imageToVideo(image, prompt = '', {
  model = MODEL, duration = '5', resolution = '768P',
  maxPollingMs = 600000, pollIntervalMs = 5000,
} = {}) {
  if (!FAL_KEY) throw new Error('缺少 FAL_KEY');
  const image_url = toImageUrl(image);
  // 按模型构造入参：Seedance 2.0(国际版/fal) vs 海螺 Hailuo-02，参数不同
  let input;
  if (/seedance/i.test(model)) {
    // Seedance 2.0：duration 4–15 秒(数字)、resolution 480p/720p/1080p、aspect_ratio；
    // 关掉自带音频(成片由我们后期统一配音/背景乐，否则两路声音打架)
    const sec = Math.min(15, Math.max(4, Math.round(Number(duration) || 5)));
    input = { prompt: prompt || '画面自然真实地动起来', image_url, duration: sec, resolution: process.env.FAL_RESOLUTION || '720p', aspect_ratio: '9:16', generate_audio: false };
  } else if (/kling/i.test(model)) {
    // 可灵(走 fal)：duration 枚举 "5"/"10"(就近向上取整)、aspect_ratio、cfg_scale 默认0.5(越高越贴输入图、少乱动)、negative_prompt 压漂浮/畸形
    const kdur = Number(duration) > 5 ? '10' : '5';
    input = { prompt: prompt || '画面自然真实地动起来', image_url, duration: kdur, aspect_ratio: '9:16', cfg_scale: 0.5, negative_prompt: '漂浮, 悬浮, 起飞, 失重, 变形, 扭曲, 抖动, 畸变, 物体无故移动或飞行, 凭空出现多余物体, 多手, 六指, 畸形手, 飞舞的小虫或碎屑' };
  } else {
    // 海螺 Hailuo-02：duration "6"/"10"、resolution 768P、prompt_optimizer
    const dur = Number(duration) > 6 ? '10' : '6';
    input = { prompt: prompt || '画面自然真实地动起来', image_url, duration: dur, resolution, prompt_optimizer: true };
  }
  const auth = { Authorization: `Key ${FAL_KEY}` };

  // 1) 提交到队列
  const subRes = await fetchRetry(`${BASE}/${model}`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(120000),
  });
  const sub = await subRes.json().catch(() => ({}));
  if (!subRes.ok || !sub.request_id) {
    throw new Error('Fal 提交失败: ' + JSON.stringify(sub.detail || sub.message || sub).slice(0, 220));
  }
  const statusUrl = sub.status_url || `${BASE}/${model}/requests/${sub.request_id}/status`;
  const responseUrl = sub.response_url || `${BASE}/${model}/requests/${sub.request_id}`;

  // 2) 轮询直到 COMPLETED
  const start = Date.now();
  while (true) {
    if (Date.now() - start > maxPollingMs) throw new Error(`Fal 生成超时 (${maxPollingMs / 1000}s)`);
    await sleep(pollIntervalMs);
    let st;
    try { st = await (await fetchRetry(statusUrl, { headers: auth })).json(); }
    catch { continue; }
    const status = st?.status;
    if (status === 'COMPLETED') {
      const out = await (await fetchRetry(responseUrl, { headers: auth })).json();
      const url = out?.video?.url || out?.video_url || out?.output?.video?.url;
      if (!url) throw new Error('Fal 成功但未返回视频 URL: ' + JSON.stringify(out).slice(0, 200));
      return url;
    }
    if (status === 'FAILED' || status === 'ERROR') {
      throw new Error('Fal 生成失败: ' + JSON.stringify(st?.error || st).slice(0, 200));
    }
  }
}

// 动作复刻：Seedance 2.0 reference-to-video——参考视频(≤15s)整段动作/运镜迁移 + 商品图换装。
// 实测要点：①带视频输入 $0.145/s(比 i2v 便宜) ②真人暧昧内容(性感舞等)会被 partner 审核拒,
// 拒绝时请求状态仍是 COMPLETED、结果体里是 detail[].type=content_policy_violation ③取状态/结果
// 必须用根应用路径(bytedance/seedance-2.0)，带完整子路径会 405。
const REF_MODEL = process.env.FAL_REF_MODEL || 'bytedance/seedance-2.0/fast/reference-to-video';
export async function referenceToVideo({ prompt, videoUrls = [], imageUrls = [], duration = 12, resolution, maxPollingMs = 720000, pollIntervalMs = 8000 } = {}) {
  if (!FAL_KEY) throw new Error('缺少 FAL_KEY');
  const auth = { Authorization: `Key ${FAL_KEY}` };
  const input = {
    prompt: prompt || '按参考视频的动作与节奏自然表演',
    video_urls: videoUrls.filter(Boolean).slice(0, 3),
    image_urls: imageUrls.filter(Boolean).slice(0, 9),
    resolution: resolution || process.env.FAL_RESOLUTION || '720p',
    duration: Math.max(4, Math.min(15, Math.round(Number(duration) || 12))),
    aspect_ratio: '9:16',
    generate_audio: false,
  };
  const subRes = await fetchRetry(`${BASE}/${REF_MODEL}`, {
    method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify(input), signal: AbortSignal.timeout(120000),
  });
  const sub = await subRes.json().catch(() => ({}));
  if (!subRes.ok || !sub.request_id) throw new Error('Fal 提交失败: ' + JSON.stringify(sub.detail || sub.message || sub).slice(0, 220));
  const root = REF_MODEL.split('/').slice(0, 2).join('/'); // 取结果用根应用路径(子路径会405)
  const statusUrl = `${BASE}/${root}/requests/${sub.request_id}/status`;
  const responseUrl = `${BASE}/${root}/requests/${sub.request_id}`;
  const start = Date.now();
  while (true) {
    if (Date.now() - start > maxPollingMs) throw new Error(`Fal 动作迁移超时 (${maxPollingMs / 1000}s)`);
    await sleep(pollIntervalMs);
    let st;
    try { st = await (await fetchRetry(statusUrl, { headers: auth })).json(); }
    catch { continue; }
    if (st?.status === 'COMPLETED') {
      const out = await (await fetchRetry(responseUrl, { headers: auth })).json();
      const url = out?.video?.url || out?.output?.video?.url;
      if (url) return url;
      // COMPLETED 但无 url：多半是内容审核拒绝(detail.type=content_policy_violation)
      const det = JSON.stringify(out?.detail || out).slice(0, 260);
      if (/content_policy/i.test(det)) throw new Error('CONTENT_POLICY: ' + det);
      throw new Error('Fal 动作迁移无结果: ' + det);
    }
    if (st?.status === 'FAILED' || st?.status === 'ERROR') throw new Error('Fal 动作迁移失败: ' + JSON.stringify(st?.error || st).slice(0, 200));
  }
}

// 复探：fal 是否在接受请求(有余额)。给"视频引擎熔断器"自愈用——充值后立即解封，不傻等。
// 提交一个最小请求看是否被接受(返回 request_id)；接受=有钱，并尽量取消这次探测(省费用)。60s 缓存避免狂探。
let _probe = { at: 0, ok: null };
export async function probeBalance() {
  if (!FAL_KEY) return false;
  const now = Date.now();
  if (now - _probe.at < 60000) return _probe.ok; // 60s 缓存
  try {
    const r = await fetch(`${BASE}/${MODEL}`, {
      method: 'POST', headers: { Authorization: `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'x', image_url: 'https://storage.googleapis.com/falserverless/model_tests/video_models/robot.png', duration: 5, resolution: '720p', aspect_ratio: '9:16', generate_audio: false }),
      signal: AbortSignal.timeout(20000),
    });
    const j = await r.json().catch(() => ({}));
    const ok = !!(r.ok && j.request_id);
    _probe = { at: now, ok };
    if (ok && j.request_id) { // 取消探测请求，避免白扣费(尽力而为)
      try { fetch(`${BASE}/${MODEL}/requests/${j.request_id}/cancel`, { method: 'PUT', headers: { Authorization: `Key ${FAL_KEY}` } }).catch(() => {}); } catch { /* ignore */ }
    }
    return ok;
  } catch { return null; } // 网络异常→未知，不阻断
}

export const isConfigured = () => !!FAL_KEY;
export { MODEL, KLING_MODEL };
