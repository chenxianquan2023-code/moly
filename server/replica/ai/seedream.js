/**
 * Seedream 4.5 图像生成（ByteDance，经 fal 国际版）
 * - 有参考图 → edit 端点(image_urls，最多10张)：用真实商品/模特图做参考，保一致性(根治串品类/掉logo)
 * - 无参考图 → text-to-image
 * 走 fal 国际通道：真人脸不封；与 Seedance 2.0 同门，凑齐"字节全家桶"。
 * 统一返回 { buffer, mimeType }，与 gemini/openai provider 对齐。
 */
const FAL_KEY = process.env.FAL_KEY || '';
const BASE = process.env.FAL_BASE_URL || 'https://queue.fal.run';
const EDIT_MODEL = process.env.SEEDREAM_EDIT_MODEL || 'fal-ai/bytedance/seedream/v4.5/edit';
const T2I_MODEL = process.env.SEEDREAM_T2I_MODEL || 'fal-ai/bytedance/seedream/v4.5/text-to-image';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 参考图统一成 fal 可接受的字符串：公网 URL/dataURI 直接用；Buffer→dataURI */
function toUrl(src) {
  if (Buffer.isBuffer(src)) return `data:image/jpeg;base64,${src.toString('base64')}`;
  return String(src || '');
}

/** 竖版 9:16 高清；其余按比例兜底 */
function sizeFor(aspectRatio = '9:16') {
  if (aspectRatio === '16:9') return { width: 1920, height: 1080 };
  if (aspectRatio === '1:1') return { width: 1280, height: 1280 };
  return { width: 1080, height: 1920 }; // 9:16 默认
}

export async function generateImage(prompt, refs = [], { aspectRatio = '9:16', maxPollingMs = 180000, pollIntervalMs = 3000 } = {}) {
  if (!FAL_KEY) throw new Error('缺少 FAL_KEY');
  const image_urls = (refs || []).filter(Boolean).slice(0, 10).map(toUrl).filter(Boolean);
  const useEdit = image_urls.length > 0;
  const model = useEdit ? EDIT_MODEL : T2I_MODEL;
  const image_size = sizeFor(aspectRatio);
  const input = useEdit
    ? { prompt, image_urls, image_size, num_images: 1 }
    : { prompt, image_size, num_images: 1 };
  const auth = { Authorization: `Key ${FAL_KEY}` };

  // 1) 提交到队列
  const subRes = await fetch(`${BASE}/${model}`, {
    method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify(input), signal: AbortSignal.timeout(60000),
  });
  const sub = await subRes.json().catch(() => ({}));
  if (!subRes.ok || !sub.request_id) throw new Error('Seedream 提交失败: ' + JSON.stringify(sub.detail || sub.message || sub).slice(0, 200));
  const statusUrl = sub.status_url || `${BASE}/${model}/requests/${sub.request_id}/status`;
  const responseUrl = sub.response_url || `${BASE}/${model}/requests/${sub.request_id}`;

  // 2) 轮询直到 COMPLETED
  const start = Date.now();
  while (true) {
    if (Date.now() - start > maxPollingMs) throw new Error(`Seedream 生成超时 (${maxPollingMs / 1000}s)`);
    await sleep(pollIntervalMs);
    let st;
    try { st = await (await fetch(statusUrl, { headers: auth })).json(); } catch { continue; }
    if (st?.status === 'COMPLETED') {
      const out = await (await fetch(responseUrl, { headers: auth })).json();
      const url = out?.images?.[0]?.url || out?.image?.url;
      if (!url) throw new Error('Seedream 成功但未返回图片: ' + JSON.stringify(out).slice(0, 150));
      const img = await fetch(url, { signal: AbortSignal.timeout(60000) });
      const mimeType = img.headers.get('content-type') || 'image/png';
      const buffer = Buffer.from(await img.arrayBuffer());
      return { buffer, mimeType };
    }
    if (st?.status === 'FAILED' || st?.status === 'ERROR') throw new Error('Seedream 生成失败: ' + JSON.stringify(st?.error || st).slice(0, 150));
  }
}

export const isConfigured = () => !!FAL_KEY;
