/**
 * fal.ai 图生视频 后端适配器（默认 MiniMax Hailuo-02 标准档）
 * fal 是多模型中转：一个 FAL_KEY 通吃可灵/海螺/Runway/Wan 等；换 FAL_VIDEO_MODEL 即可切模型。
 * 关键优势：image_url 直接传公网 URL，由 fal(海外) 自己取图 —— Railway 不再跨境上传大图，根除超时。
 * 鉴权：Authorization: Key <FAL_KEY>（id:secret 格式整串）。密钥只从 env 读，绝不入库/入码。
 */
const FAL_KEY = process.env.FAL_KEY || '';
const MODEL = process.env.FAL_VIDEO_MODEL || 'bytedance/seedance-2.0/fast/image-to-video'; // Seedance 2.0 Fast 档(720p)：同画质、比 Standard 省~20%、更快；真人脸不封，对标 creatok
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

export const isConfigured = () => !!FAL_KEY;
export { MODEL };
