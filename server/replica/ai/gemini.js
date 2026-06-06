/**
 * Gemini 后端适配器（经 ezmodel 中转）
 * 复用前端同款 @google/genai SDK 与调用格式；服务端从 env 读 key。
 * 能力：文本(文案/分析) / 图文理解(视频帧分析) / 图片生成。
 * 注意：当前 Gemini 账户未充值，调用会失败——流水线会优雅降级，充值后自动生效。
 */
import { GoogleGenAI } from '@google/genai';

const API_KEY = process.env.GEMINI_API_KEY || '';
const BASE_URL = process.env.GEMINI_BASE_URL || 'https://www.ezmodel.cloud';
const ANALYSIS_MODEL = process.env.GEMINI_ANALYSIS_MODEL || 'gemini-3.1-flash-image-preview';
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image-preview';

let _client;
function client() {
  if (!API_KEY) throw new Error('缺少 GEMINI_API_KEY');
  if (!_client) _client = new GoogleGenAI({ apiKey: API_KEY, httpOptions: { baseUrl: BASE_URL, timeout: 600000 } });
  return _client;
}

/** url | dataURL | Buffer → Gemini inlineData part */
async function toImagePart(src) {
  let data, mimeType = 'image/jpeg';
  if (Buffer.isBuffer(src)) {
    data = src.toString('base64');
  } else if (typeof src === 'string' && src.startsWith('data:')) {
    const [meta, b64] = src.split(',');
    data = b64 || '';
    mimeType = meta.slice(5, meta.indexOf(';')) || mimeType;
  } else {
    const r = await fetch(src, { signal: AbortSignal.timeout(60000) });
    mimeType = r.headers.get('content-type') || mimeType;
    data = Buffer.from(await r.arrayBuffer()).toString('base64');
  }
  return { inlineData: { data, mimeType } };
}

function extractText(resp) {
  const parts = resp?.candidates?.[0]?.content?.parts || [];
  for (const p of parts) if (p.text) return p.text;
  return '';
}
function extractImage(resp) {
  const parts = resp?.candidates?.[0]?.content?.parts || [];
  for (const p of parts) if (p.inlineData?.data) return { buffer: Buffer.from(p.inlineData.data, 'base64'), mimeType: p.inlineData.mimeType || 'image/png' };
  return null;
}

/** 纯文本（文案改写等） */
export async function generateText(prompt, { model, temperature = 0.7 } = {}) {
  const resp = await client().models.generateContent({
    model: model || ANALYSIS_MODEL,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { temperature, maxOutputTokens: 8192 },
  });
  return extractText(resp);
}

/** 图文理解（视频帧/素材分析） */
export async function analyzeImages(prompt, images = [], { model, temperature = 0.4 } = {}) {
  const parts = [{ text: prompt }, ...(await Promise.all(images.map(toImagePart)))];
  const resp = await client().models.generateContent({
    model: model || ANALYSIS_MODEL,
    contents: [{ role: 'user', parts }],
    config: { temperature, maxOutputTokens: 8192 },
  });
  return extractText(resp);
}

/** 图片生成（换装/商品场景等），返回 { buffer, mimeType } */
export async function generateImage(prompt, refs = [], { model, aspectRatio = '9:16', imageSize = '2K', temperature = 0.7 } = {}) {
  const parts = [{ text: prompt }, ...(await Promise.all(refs.map(toImagePart)))];
  const resp = await client().models.generateContent({
    model: model || IMAGE_MODEL,
    contents: [{ role: 'user', parts }],
    config: { temperature, maxOutputTokens: 8192, responseModalities: ['TEXT', 'IMAGE'], imageConfig: { aspectRatio, imageSize } },
  });
  const img = extractImage(resp);
  if (!img) throw new Error('Gemini 未返回图片: ' + (extractText(resp) || '空响应'));
  return img;
}

/** 容错解析 LLM 返回的 JSON（去除 ```json 包裹） */
export function parseJson(text) {
  let s = String(text || '').trim();
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) s = fenced[1].trim();
  else s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim(); // 只有开头围栏(被截断)
  try { return JSON.parse(s); } catch { /* 继续兜底 */ }
  const m = s.match(/[[{][\s\S]*[\]}]/);
  if (m) { try { return JSON.parse(m[0]); } catch { /* fallthrough */ } }
  // 截断的对象/数组 → 截到最后一个完整的 } 再补齐括号
  if (s.startsWith('{') || s.startsWith('[')) {
    const last = s.lastIndexOf('}');
    if (last > 0) { try { return JSON.parse(s.slice(0, last + 1) + (s.startsWith('[') ? ']' : '')); } catch { /* fallthrough */ } }
  }
  throw new Error('Gemini JSON 解析失败: ' + s.slice(0, 80));
}

export const isConfigured = () => !!API_KEY;
