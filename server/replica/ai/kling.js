/**
 * Kling 可灵 图生视频 后端适配器
 * 鉴权(JWT HS256)在服务端完成，根除前端密钥暴露；key 从 env 读。
 * 注意：当前 Kling 账户未充值，调用会失败——流水线会优雅降级，充值后自动生效。
 */
import crypto from 'node:crypto';

const ACCESS_KEY = process.env.KLING_ACCESS_KEY || '';
const SECRET_KEY = process.env.KLING_SECRET_KEY || '';
const BASE_URL = process.env.KLING_BASE_URL || 'https://api-beijing.klingai.com';

async function fetchRetry(url, opts, retries = 3) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try { return await fetch(url, opts); }
    catch (e) { lastErr = e; await new Promise((r) => setTimeout(r, 600 * (i + 1))); }
  }
  throw lastErr;
}

function jwt() {
  if (!ACCESS_KEY || !SECRET_KEY) throw new Error('缺少 KLING_ACCESS_KEY / KLING_SECRET_KEY');
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: 'HS256', typ: 'JWT' });
  const body = b64({ iss: ACCESS_KEY, exp: now + 1800, nbf: now - 5 });
  const sig = crypto.createHmac('sha256', SECRET_KEY).update(`${head}.${body}`).digest('base64url');
  return `${head}.${body}.${sig}`;
}

async function toBase64(src) {
  if (Buffer.isBuffer(src)) return src.toString('base64');
  if (typeof src === 'string' && src.startsWith('data:')) return src.split(',')[1] || '';
  const r = await fetch(src, { signal: AbortSignal.timeout(120000) });
  return Buffer.from(await r.arrayBuffer()).toString('base64');
}

/**
 * 图生视频，返回视频直链 URL（第三方临时链，调用方应转存到自己的存储）。
 * @param {string|Buffer} image 主图（URL/dataURL/Buffer）
 * @param {string} prompt 运动/画面描述
 */
export async function imageToVideo(image, prompt = '', {
  model = 'kling-v1-6', duration = '5', mode = 'std', cfgScale = 0.7,
  negativePrompt = '漂浮, 悬浮, 起飞, 失重, 变形, 扭曲, 抖动, 畸变, 物体无故移动或飞行, 凭空出现多余物体, 小虫飞舞',
  maxPollingMs = 480000, pollIntervalMs = 5000,
} = {}) {
  const img = await toBase64(image);
  // cfg_scale 越高=自由度越低、越贴合输入图(更少乱动)；配合 negative_prompt 压制漂浮/起飞/变形
  const body = { model_name: model, image: img, duration, mode, cfg_scale: cfgScale };
  if (prompt) body.prompt = prompt;
  if (negativePrompt) body.negative_prompt = negativePrompt;

  const createRes = await fetchRetry(`${BASE_URL}/v1/videos/image2video`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000),
  });
  const createData = await createRes.json();
  if (createData.code !== 0) throw new Error(`Kling 创建任务失败: ${createData.message || JSON.stringify(createData)}`);
  const taskId = createData.data?.task_id;
  if (!taskId) throw new Error('Kling 未返回 task_id');

  const start = Date.now();
  while (true) {
    if (Date.now() - start > maxPollingMs) throw new Error(`Kling 生成超时 (${maxPollingMs / 1000}s)`);
    await new Promise((r) => setTimeout(r, pollIntervalMs));
    let sRes;
    try { sRes = await fetchRetry(`${BASE_URL}/v1/videos/image2video/${taskId}`, { headers: { Authorization: `Bearer ${jwt()}` } }); }
    catch { continue; }
    if (!sRes.ok) continue;
    const sData = await sRes.json();
    const st = sData.data?.task_status;
    if (st === 'succeed') {
      const url = sData.data?.task_result?.videos?.[0]?.url;
      if (!url) throw new Error('Kling 成功但未返回视频 URL');
      return url;
    }
    if (st === 'failed') throw new Error(`Kling 生成失败: ${sData.data?.task_status_msg || '未知原因'}`);
  }
}

export const isConfigured = () => !!(ACCESS_KEY && SECRET_KEY);
