/**
 * Supabase 数据访问封装（PostgREST）
 * 仅服务端使用 service_role 密钥；前端永远不应直接持有此密钥。
 */

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

function headers(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

/** 网络层重试：应对 ECONNRESET / fetch failed 等瞬时网络抖动 */
async function fetchRetry(url, opts, retries = 3) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try { return await fetch(url, opts); }
    catch (e) { lastErr = e; await new Promise((r) => setTimeout(r, 300 * (i + 1))); }
  }
  throw lastErr;
}

/** 基础请求；非 2xx 抛错，204 返回 null */
export async function sbRequest(method, path, { body, prefer } = {}) {
  const res = await fetchRetry(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: headers(prefer ? { Prefer: prefer } : {}),
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  if (res.status === 204) return null;
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = typeof data === 'string' ? data : JSON.stringify(data);
    throw new Error(`Supabase ${method} ${path} -> ${res.status}: ${msg}`);
  }
  return data;
}

/** 插入一行，返回插入后的记录 */
export async function insertRow(table, row) {
  const rows = await sbRequest('POST', `/${table}`, { body: row, prefer: 'return=representation' });
  return Array.isArray(rows) ? rows[0] : rows;
}

/** 查询多行；query 为 PostgREST 查询串（不含前导 ?） */
export async function selectRows(table, query = '') {
  return sbRequest('GET', `/${table}${query ? `?${query}` : ''}`);
}

/** 查询单行（无则 null） */
export async function selectOne(table, query = '') {
  const rows = await selectRows(table, query);
  return Array.isArray(rows) ? (rows[0] || null) : null;
}

/** 按主键查 */
export async function getById(table, id) {
  return selectOne(table, `id=eq.${encodeURIComponent(id)}&select=*`);
}

/** 更新；filter 为 PostgREST 过滤串（如 id=eq.xxx），返回更新后的记录 */
export async function updateRows(table, filter, patch) {
  const rows = await sbRequest('PATCH', `/${table}?${filter}`, { body: patch, prefer: 'return=representation' });
  return Array.isArray(rows) ? rows : [rows];
}

/** 按主键更新单行 */
export async function updateById(table, id, patch) {
  const rows = await updateRows(table, `id=eq.${encodeURIComponent(id)}`, patch);
  return rows[0] || null;
}

export const isConfigured = () => !!(SUPABASE_URL && SUPABASE_KEY);
