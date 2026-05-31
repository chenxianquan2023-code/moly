/**
 * TTS 配音 —— 可插拔多 provider 适配层
 * 当前接入 MiniMax(海螺)；后续加 OpenAI / ElevenLabs 只需多写一个 provider 函数。
 * 未来「用户选模型、不同定价」：在 PROVIDERS 注册 + 在积分定价表配置单价即可。
 */

/** MiniMax T2A v2：返回 mp3 Buffer */
async function minimaxTTS(text, { voice = 'male-qn-qingse', speed = 1.0, model = 'speech-02-hd', format = 'mp3', emotion = 'happy' } = {}) {
  const key = process.env.MINIMAX_API_KEY;
  if (!key) throw new Error('缺少 MINIMAX_API_KEY 环境变量');
  const group = process.env.MINIMAX_GROUP_ID; // 国际站 api.minimaxi.chat 不需要；国内站 api.minimax.chat 需要
  const base = process.env.MINIMAX_BASE_URL || 'https://api.minimaxi.chat';
  const url = `${base}/v1/t2a_v2${group ? `?GroupId=${encodeURIComponent(group)}` : ''}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      text,
      stream: false,
      voice_setting: { voice_id: voice, speed, vol: 1.0, pitch: 0, emotion },
      audio_setting: { sample_rate: 32000, bitrate: 128000, format, channel: 1 },
    }),
    signal: AbortSignal.timeout(60000),
  });
  const j = await res.json();
  if (j?.base_resp?.status_code !== 0) {
    throw new Error(`MiniMax TTS 失败: ${j?.base_resp?.status_msg || JSON.stringify(j).slice(0, 200)}`);
  }
  const hex = j?.data?.audio;
  if (!hex) throw new Error('MiniMax 未返回音频数据');
  return Buffer.from(hex, 'hex'); // T2A 返回 hex 编码音频
}

const xmlEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export const azureConfigured = () => !!process.env.AZURE_SPEECH_KEY;

/**
 * Azure 神经语音 TTS（微软认知服务）：中文自然度高、支持 express-as 情感风格。返回 mp3 Buffer。
 * 需要环境变量：AZURE_SPEECH_KEY、AZURE_SPEECH_REGION（如 eastasia / southeastasia / eastus）。
 */
async function azureTTS(text, { voice = 'zh-CN-XiaoxiaoNeural', style = '', rate = '0%', format = 'audio-24khz-48kbitrate-mono-mp3' } = {}) {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION || 'eastasia';
  if (!key) throw new Error('缺少 AZURE_SPEECH_KEY 环境变量');
  const lang = /^[a-z]{2}-[A-Z]{2}/.test(voice) ? voice.slice(0, 5) : 'zh-CN';
  const body = xmlEsc(text);
  const ssml = (useStyle) => `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${lang}"><voice name="${voice}"><prosody rate="${rate}">${useStyle && style ? `<mstts:express-as style="${style}">${body}</mstts:express-as>` : body}</prosody></voice></speak>`;
  const call = async (s) => {
    const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': format, 'User-Agent': 'moly-replica' },
      body: s,
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) throw new Error(`Azure TTS ${res.status}: ${(await res.text()).slice(0, 160)}`);
    return Buffer.from(await res.arrayBuffer());
  };
  try { return await call(ssml(true)); }
  catch (e) { if (style) { try { return await call(ssml(false)); } catch { throw e; } } throw e; } // 情感风格不支持→退回无风格
}

export const volcanoConfigured = () => !!(process.env.VOLC_TTS_APPID && process.env.VOLC_TTS_TOKEN);

/**
 * 火山引擎「语音合成大模型」(BigTTS)：中文自然度高、多情感。返回 mp3 Buffer。
 * 大模型音色形如 zh_female_yuanqinvyou_moon_bigtts，复用 openspeech /api/v1/tts 接口、cluster 仍为 volcano_tts。
 * 需要环境变量：VOLC_TTS_APPID、VOLC_TTS_TOKEN、VOLC_TTS_CLUSTER(默认 volcano_tts)。
 */
async function volcanoTTS(text, { voice = 'zh_female_yuanqinvyou_moon_bigtts', speed = 1.0, encoding = 'mp3' } = {}) {
  const appid = process.env.VOLC_TTS_APPID;
  const token = process.env.VOLC_TTS_TOKEN;
  const cluster = process.env.VOLC_TTS_CLUSTER || 'volcano_tts';
  if (!appid || !token) throw new Error('缺少 VOLC_TTS_APPID / VOLC_TTS_TOKEN');
  const reqid = globalThis.crypto?.randomUUID?.() || String(Date.now());
  const res = await fetch('https://openspeech.bytedance.com/api/v1/tts', {
    method: 'POST',
    headers: { Authorization: `Bearer;${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app: { appid, token, cluster },
      user: { uid: 'moly' },
      audio: { voice_type: voice, encoding, speed_ratio: speed, volume_ratio: 1.0, pitch_ratio: 1.0 },
      request: { reqid, text, text_type: 'plain', operation: 'query' },
    }),
    signal: AbortSignal.timeout(60000),
  });
  const j = await res.json();
  if (j.code !== 3000 || !j.data) throw new Error(`火山 TTS 失败: ${j.message || j.code || JSON.stringify(j).slice(0, 160)}`);
  return Buffer.from(j.data, 'base64');
}

// provider 注册表（key 即对外可选的「模型」标识）
const PROVIDERS = {
  minimax: minimaxTTS,
  azure: azureTTS,
  volcano: volcanoTTS,
  // elevenlabs: elevenLabsTTS,  // TODO: 以后加
};

/**
 * 合成配音，返回 mp3 Buffer。
 * @param {string} text
 * @param {{provider?:string, voice?:string, speed?:number, model?:string}} opts
 */
export async function synthesize(text, opts = {}) {
  const provider = opts.provider || process.env.TTS_PROVIDER || 'minimax';
  const fn = PROVIDERS[provider];
  if (!fn) throw new Error(`未知 TTS provider: ${provider}（可选: ${Object.keys(PROVIDERS).join(', ')}）`);
  if (!text || !text.trim()) throw new Error('TTS 文本为空');
  return fn(text, opts);
}

export const listProviders = () => Object.keys(PROVIDERS);
