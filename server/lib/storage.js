/**
 * Supabase Storage 封装：上传素材/成片到公开桶 moly-media，返回公开 URL。
 * 替代原本写本地磁盘的方式（Railway 容器重启即丢）。
 */

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
const BUCKET = process.env.SUPABASE_BUCKET || 'moly-media';

/** 网络层重试：应对瞬时网络抖动 */
async function fetchRetry(url, opts, retries = 3) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try { return await fetch(url, opts); }
    catch (e) { lastErr = e; await new Promise((r) => setTimeout(r, 500 * (i + 1))); }
  }
  throw lastErr;
}

/** 上传 Buffer，返回公开访问 URL。path 形如 'assets/user/xxx.jpg' */
export async function uploadBuffer(path, buffer, contentType = 'application/octet-stream') {
  const res = await fetchRetry(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURI(path)}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: buffer,
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Storage 上传失败 ${res.status}: ${t}`);
  }
  return publicUrl(path);
}

/** 从远端 URL 拉取并转存到我们的存储桶（用于固化第三方临时直链，如 Kling 视频） */
export async function uploadFromUrl(path, sourceUrl) {
  const r = await fetch(sourceUrl, { signal: AbortSignal.timeout(120000) });
  if (!r.ok) throw new Error(`拉取源文件失败 ${r.status}: ${sourceUrl}`);
  const contentType = r.headers.get('content-type') || 'application/octet-stream';
  const buf = Buffer.from(await r.arrayBuffer());
  return uploadBuffer(path, buf, contentType);
}

export function publicUrl(path) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodeURI(path)}`;
}

/** 生成规范化的存储路径：kind/用户/时间戳_随机.ext */
export function makePath(userEmail, kind, filename) {
  const safeUser = (userEmail || 'anon').replace(/[^a-z0-9]/gi, '_').slice(0, 40);
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const ext = (String(filename || '').split('.').pop() || 'bin').replace(/[^a-z0-9]/gi, '').slice(0, 5) || 'bin';
  return `${kind}/${safeUser}/${ts}_${rand}.${ext}`;
}

export { BUCKET };
