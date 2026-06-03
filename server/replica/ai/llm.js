/**
 * LLM 文案/对话 适配器（OpenAI 兼容格式，经 ezmodel 中转）
 * 支持 Claude / GPT-5 / Gemini 等所有 ezmodel 模型；通过 LLM_MODEL 或入参切换。
 * 为「用户选模型、不同定价」预留：换 model 即可，配合积分定价表配单价。
 */
const KEY = process.env.EZMODEL_API_KEY || process.env.GEMINI_API_KEY || '';
const BASE = process.env.EZMODEL_BASE_URL || process.env.GEMINI_BASE_URL || 'https://www.ezmodel.cloud';
const DEFAULT_MODEL = process.env.LLM_MODEL || 'claude-sonnet-4-5-20250929';

async function fetchRetry(url, opts, retries = 3) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try { return await fetch(url, opts); }
    catch (e) { lastErr = e; await new Promise((r) => setTimeout(r, 800 * (i + 1))); }
  }
  throw lastErr;
}

/** OpenAI 风格 chat 补全，返回文本内容 */
export async function chat(messages, { model, temperature = 0.7, maxTokens = 1024 } = {}) {
  if (!KEY) throw new Error('缺少 EZMODEL_API_KEY / GEMINI_API_KEY');
  const r = await fetchRetry(`${BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: model || DEFAULT_MODEL, messages, temperature, max_tokens: maxTokens }),
    signal: AbortSignal.timeout(120000),
  });
  const j = await r.json();
  const content = j?.choices?.[0]?.message?.content;
  if (!content) throw new Error('LLM 无返回: ' + JSON.stringify(j?.error || j).slice(0, 200));
  return content;
}

export async function generateText(prompt, opts = {}) {
  return chat([{ role: 'user', content: prompt }], opts);
}

/** 容错解析 LLM 返回的 JSON（去 ```json 围栏，兼容未闭合/截断/前后多余文字） */
export function parseJson(text) {
  let s = String(text || '').trim();
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) s = fenced[1].trim();
  else s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim(); // 只有开头围栏（被截断）
  try { return JSON.parse(s); } catch { /* 继续兜底 */ }
  // 兜底：抓第一个完整的 JSON 数组/对象
  const m = s.match(/[\[{][\s\S]*[\]}]/);
  if (m) { try { return JSON.parse(m[0]); } catch { /* fallthrough */ } }
  throw new Error('LLM JSON 解析失败: ' + s.slice(0, 80));
}

export const isConfigured = () => !!KEY;
export { DEFAULT_MODEL };
