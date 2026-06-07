/**
 * 图像生成 可插拔多 provider 适配层
 * - gemini（默认，快 ~30s，nano-banana 级）：经 @google/genai，原生支持参考图
 * - openai gpt-image-2（慢 ~90s，高质量档）：OpenAI 图像格式，文生图 + 参考图编辑
 * 统一返回 { buffer, mimeType }。为「用户选模型、不同定价」预留：换 provider 即可。
 */
import * as gemini from './gemini.js';
import * as seedream from './seedream.js';

const EZ_KEY = process.env.EZMODEL_API_KEY || process.env.GEMINI_API_KEY || '';
const EZ_BASE = process.env.EZMODEL_BASE_URL || process.env.GEMINI_BASE_URL || 'https://www.ezmodel.cloud';

async function toBuffer(src) {
  if (Buffer.isBuffer(src)) return src;
  if (typeof src === 'string' && src.startsWith('data:')) return Buffer.from(src.split(',')[1] || '', 'base64');
  const r = await fetch(src, { signal: AbortSignal.timeout(60000) });
  return Buffer.from(await r.arrayBuffer());
}

function extractOpenAI(j) {
  const d = j?.data?.[0];
  if (d?.b64_json) return { buffer: Buffer.from(d.b64_json, 'base64'), mimeType: 'image/png' };
  if (d?.url) return { _url: d.url };
  throw new Error('图像生成无返回: ' + JSON.stringify(j?.error || j).slice(0, 200));
}

/** gemini provider（参考图原生支持） */
const geminiImage = (prompt, refs, opts) => gemini.generateImage(prompt, refs, opts);

/** openai gpt-image-2：无参考图走 generations，有参考图走 edits(multipart) */
async function openaiImage(prompt, refs = [], { model = 'gpt-image-2', size = '1024x1024' } = {}) {
  if (!EZ_KEY) throw new Error('缺少 EZMODEL_API_KEY');
  let res;
  if (!refs.length) {
    res = await fetch(`${EZ_BASE}/v1/images/generations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${EZ_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, size }),
      signal: AbortSignal.timeout(150000),
    });
  } else {
    const fd = new FormData();
    fd.append('model', model);
    fd.append('prompt', prompt);
    fd.append('size', size);
    for (const ref of refs) {
      const buf = await toBuffer(ref);
      fd.append('image[]', new Blob([buf], { type: 'image/png' }), 'ref.png');
    }
    res = await fetch(`${EZ_BASE}/v1/images/edits`, {
      method: 'POST', headers: { Authorization: `Bearer ${EZ_KEY}` }, body: fd,
      signal: AbortSignal.timeout(150000),
    });
  }
  const out = extractOpenAI(await res.json());
  if (out._url) return { buffer: await toBuffer(out._url), mimeType: 'image/png' };
  return out;
}

const PROVIDERS = {
  gemini: geminiImage,
  seedream: (prompt, refs, opts) => seedream.generateImage(prompt, refs, opts), // Seedream 4.5（fal 国际版，带参考图编辑、人脸不封）
  openai: openaiImage, // gpt-image-2
};

/**
 * 生成图像，返回 { buffer, mimeType }。
 * @param {string} prompt
 * @param {Array<string|Buffer>} refs 参考图（换装：模特图+衣服图）
 * @param {{provider?:string, model?:string, size?:string, aspectRatio?:string}} opts
 */
export async function generate(prompt, refs = [], opts = {}) {
  const provider = opts.provider || process.env.IMAGE_PROVIDER || 'gemini';
  const fn = PROVIDERS[provider];
  if (!fn) throw new Error(`未知图像 provider: ${provider}（可选: ${Object.keys(PROVIDERS).join(', ')}）`);
  let lastErr;
  for (let i = 0; i < 2; i++) {
    try { return await fn(prompt, refs, opts); }
    catch (e) { lastErr = e; await new Promise((r) => setTimeout(r, 700 * (i + 1))); }
  }
  // 所选模型失败（如 GPT Image 超时）→ 退回 Gemini 再试，别整镜降级成原图
  if (provider !== 'gemini') {
    try { return await geminiImage(prompt, refs, opts); } catch (e2) { lastErr = e2; }
  }
  throw lastErr;
}

export const listProviders = () => Object.keys(PROVIDERS);
