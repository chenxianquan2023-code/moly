/**
 * Seedance 图生视频 后端适配器（火山引擎 火山方舟 Ark）
 * 与 kling.js 同接口：imageToVideo(imageUrl, prompt, opts) → 视频直链 URL。
 * 注意：Seedance 需要「公开可访问的图片 URL」（不收 base64），调用方传素材的公开 URL。
 */
const KEY = process.env.SEEDANCE_API_KEY || '';
const BASE = process.env.SEEDANCE_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
const MODEL = process.env.SEEDANCE_MODEL || 'doubao-seedance-2-0-260128';

async function fetchRetry(url, opts, retries = 3) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try { return await fetch(url, opts); }
    catch (e) { lastErr = e; await new Promise((r) => setTimeout(r, 600 * (i + 1))); }
  }
  throw lastErr;
}

/**
 * @param {string} imageUrl 公开可访问的主图 URL
 * @param {string} prompt 运动/画面描述
 */
export async function imageToVideo(imageUrl, prompt = '', {
  model, resolution = '720p', duration = 5, ratio = '9:16',
  maxPollingMs = 600000, pollIntervalMs = 8000,
} = {}) {
  if (!KEY) throw new Error('缺少 SEEDANCE_API_KEY');
  if (typeof imageUrl !== 'string' || !/^https?:\/\//.test(imageUrl)) {
    throw new Error('Seedance 需要公开图片 URL（不支持 base64/Buffer）');
  }
  const text = `${prompt || '商品展示'} --resolution ${resolution} --duration ${duration} --ratio ${ratio}`.trim();

  // 创建任务
  const cRes = await fetchRetry(`${BASE}/contents/generations/tasks`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: model || MODEL, content: [{ type: 'text', text }, { type: 'image_url', image_url: { url: imageUrl } }] }),
    signal: AbortSignal.timeout(60000),
  });
  const cJson = await cRes.json();
  if (!cJson.id) throw new Error('Seedance 创建任务失败: ' + JSON.stringify(cJson.error || cJson).slice(0, 200));
  const id = cJson.id;

  // 轮询
  const start = Date.now();
  while (true) {
    if (Date.now() - start > maxPollingMs) throw new Error(`Seedance 生成超时 (${maxPollingMs / 1000}s)`);
    await new Promise((r) => setTimeout(r, pollIntervalMs));
    let sRes;
    try { sRes = await fetchRetry(`${BASE}/contents/generations/tasks/${id}`, { headers: { Authorization: `Bearer ${KEY}` } }); }
    catch { continue; }
    if (!sRes.ok) continue;
    const s = await sRes.json();
    if (s.status === 'succeeded') {
      const url = s.content?.video_url || s.video_url || s.content?.[0]?.video_url || s.result?.video_url;
      if (!url) throw new Error('Seedance 成功但未找到视频 URL: ' + JSON.stringify(s).slice(0, 300));
      return url;
    }
    if (s.status === 'failed') throw new Error('Seedance 生成失败: ' + JSON.stringify(s.error || s).slice(0, 200));
  }
}

export const isConfigured = () => !!KEY;
