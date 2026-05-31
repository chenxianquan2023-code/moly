/**
 * 配音音色库（多 provider）+ 试听样本
 * 「用户选音色」：前端拉 listVoices() 渲染可选项 + 试听；生成时传音色 id，
 * 由 resolveVoice(id) 解析成 {provider, voice, style} 交给 tts.synthesize。
 * 默认「女主播」——比「活力少女」自然、更有带货感。
 */
import { azureConfigured, volcanoConfigured } from './ai/tts.js';

const S = 'https://ycivzfqijxngognpoeil.supabase.co/storage/v1/object/public/moly-media/voices/samples/';

// MiniMax 音色（已生成试听样本）
export const MINIMAX_VOICES = [
  { id: 'presenter_female', provider: 'minimax', voiceId: 'presenter_female', label: '女主播', desc: '带货感强、自然', gender: '女', sample: S + '1780191134978_aq9gk7.mp3' },
  { id: 'audiobook_female_1', provider: 'minimax', voiceId: 'audiobook_female_1', label: '知性叙述', desc: '口播自然、不浮夸', gender: '女', sample: S + '1780191151747_najm5f.mp3' },
  { id: 'female-yujie', provider: 'minimax', voiceId: 'female-yujie', label: '御姐', desc: '低沉有磁性', gender: '女', sample: S + '1780191138899_90xm17.mp3' },
  { id: 'female-chengshu', provider: 'minimax', voiceId: 'female-chengshu', label: '知性成熟', desc: '沉稳可信', gender: '女', sample: S + '1780191141543_0u50v2.mp3' },
  { id: 'female-tianmei', provider: 'minimax', voiceId: 'female-tianmei', label: '甜美亲切', desc: '温柔邻家', gender: '女', sample: S + '1780191144152_ddrj13.mp3' },
  { id: 'male-qn-jingying', provider: 'minimax', voiceId: 'male-qn-jingying', label: '精英男声', desc: '专业、有说服力', gender: '男', sample: S + '1780191146650_jnycst.mp3' },
  { id: 'male-qn-qingse', provider: 'minimax', voiceId: 'male-qn-qingse', label: '青年男声', desc: '阳光、亲和', gender: '男', sample: S + '1780191149433_24n276.mp3' },
  { id: 'female-shaonv', provider: 'minimax', voiceId: 'female-shaonv', label: '活力少女', desc: '年轻活泼(偏可爱)', gender: '女', sample: S + '1780191154082_1qtir8.mp3' },
];

// Azure 神经语音（中文带货，自然度高；样本在配置 AZURE_SPEECH_KEY 后由脚本生成填入 sample）
export const AZURE_VOICES = [
  { id: 'az-xiaoxiao', provider: 'azure', voiceId: 'zh-CN-XiaoxiaoNeural', style: 'cheerful', label: '晓晓·活泼 (Azure)', desc: '微软神经语音，自然有感染力', gender: '女', sample: '' },
  { id: 'az-yunxi', provider: 'azure', voiceId: 'zh-CN-YunxiNeural', style: 'cheerful', label: '云希·活力 (Azure)', desc: '男声，年轻活泼', gender: '男', sample: '' },
  { id: 'az-yunhao', provider: 'azure', voiceId: 'zh-CN-YunhaoNeural', style: 'advertisement_upbeat', label: '云皓·广告腔 (Azure)', desc: '专为广告带货优化', gender: '男', sample: '' },
  { id: 'az-xiaomeng', provider: 'azure', voiceId: 'zh-CN-XiaomengNeural', style: 'chat', label: '晓梦·亲切 (Azure)', desc: '女声，聊天种草感', gender: '女', sample: '' },
];

// 火山引擎「语音合成大模型」(BigTTS)。每个音色显式标 langs（支持语言），前端"先选语言→只出支持该语言的音色"。
// 试听样本由 scripts/gen-volc-samples.mjs 按各音色主语言合成并上传 Supabase。
export const VOLCANO_VOICES = [
  // —— 中文（含方言/角色）——
  { id: 'volc-yuanqinvyou', provider: 'volcano', voiceId: 'zh_female_yuanqinvyou_moon_bigtts', label: '元气女友', desc: '元气活泼、甜美亲和，带货种草', gender: '女', category: '通用', langs: ['zh-CN'], sample: S + 'volc-yuanqinvyou.mp3' },
  { id: 'volc-shaonianzixin', provider: 'volcano', voiceId: 'zh_male_shaonianzixin_moon_bigtts', label: '少年梓辛', desc: '少年音清澈、阳光干净', gender: '男', category: '通用', langs: ['zh-CN'], sample: S + 'volc-shaonianzixin.mp3' },
  { id: 'volc-beijingxiaoye', provider: 'volcano', voiceId: 'zh_male_beijingxiaoye_moon_bigtts', label: '北京小爷', desc: '京腔痞帅、接地气有个性', gender: '男', category: '方言', langs: ['zh-CN'], sample: S + 'volc-beijingxiaoye.mp3' },
  { id: 'volc-guozhoudege', provider: 'volcano', voiceId: 'zh_male_guozhoudege_moon_bigtts', label: '广州德哥', desc: '粤味普通话、接地气生活感', gender: '男', category: '方言', langs: ['zh-CN'], sample: S + 'volc-guozhoudege.mp3' },
  { id: 'volc-sunwukong', provider: 'volcano', voiceId: 'zh_male_sunwukong_mars_bigtts', label: '猴哥·孙悟空', desc: '经典角色音，趣味十足', gender: '男', category: '角色', langs: ['zh-CN'], sample: S + 'volc-sunwukong.mp3' },
  { id: 'volc-xionger', provider: 'volcano', voiceId: 'zh_male_xionger_mars_bigtts', label: '熊二', desc: '憨厚呆萌、趣味亲和', gender: '男', category: '角色', langs: ['zh-CN'], sample: S + 'volc-xionger.mp3' },
  // —— 中 + 英 ——
  { id: 'volc-linjia', provider: 'volcano', voiceId: 'zh_female_linjia_mars_bigtts', label: '邻家女声', desc: '自然亲切，中英流畅', gender: '女', category: '通用', langs: ['zh-CN', 'en-US'], sample: S + 'volc-linjia.mp3' },
  { id: 'volc-shaoergushi', provider: 'volcano', voiceId: 'zh_female_shaoergushi_mars_bigtts', label: '故事姐姐', desc: '温柔讲述，中英皆宜', gender: '女', category: '通用', langs: ['zh-CN', 'en-US'], sample: S + 'volc-shaoergushi.mp3' },
  { id: 'volc-jieshuonansheng', provider: 'volcano', voiceId: 'zh_male_jieshuonansheng_mars_bigtts', label: '解说男声', desc: '沉稳解说，专业可信', gender: '男', category: '通用', langs: ['zh-CN', 'en-US'], sample: S + 'volc-jieshuonansheng.mp3' },
  { id: 'volc-jitangmeimei', provider: 'volcano', voiceId: 'zh_female_jitangmeimei_mars_bigtts', label: '鸡汤妹妹', desc: '治愈暖心，中英流畅', gender: '女', category: '通用', langs: ['zh-CN', 'en-US'], sample: S + 'volc-jitangmeimei.mp3' },
  // —— 纯英文 ——
  { id: 'volc-anna', provider: 'volcano', voiceId: 'en_female_anna_mars_bigtts', label: 'Anna · 英文女声', desc: '地道英文、自然流畅', gender: '女', category: '通用', langs: ['en-US'], sample: S + 'volc-anna.mp3' },
  // —— 日语 + 西班牙语 ——
  { id: 'volc-shuangkuaisisi', provider: 'volcano', voiceId: 'multi_female_shuangkuaisisi_moon_bigtts', label: '爽快思思', desc: '日/西多语种，爽朗清亮', gender: '女', category: '通用', langs: ['ja-JP', 'es-ES'], sample: S + 'volc-shuangkuaisisi.mp3' },
  { id: 'volc-jingqiangkanye', provider: 'volcano', voiceId: 'multi_male_jingqiangkanye_moon_bigtts', label: '侃爷', desc: '日/西多语种，磁性健谈', gender: '男', category: '通用', langs: ['ja-JP', 'es-ES'], sample: S + 'volc-jingqiangkanye.mp3' },
  { id: 'volc-wanqudashu', provider: 'volcano', voiceId: 'multi_male_wanqudashu_moon_bigtts', label: '玩趣大叔', desc: '日/西多语种，亲和有趣', gender: '男', category: '通用', langs: ['ja-JP', 'es-ES'], sample: S + 'volc-wanqudashu.mp3' },
  // —— 日语 ——
  { id: 'volc-gaolengyujie', provider: 'volcano', voiceId: 'multi_female_gaolengyujie_moon_bigtts', label: '高冷御姐', desc: '日语，低沉有距离感', gender: '女', category: '通用', langs: ['ja-JP'], sample: S + 'volc-gaolengyujie.mp3' },
];

export const DEFAULT_VOICE = 'volc-yuanqinvyou';

const ALL = [...MINIMAX_VOICES, ...VOLCANO_VOICES, ...AZURE_VOICES];

// 音色多以 langs 显式标注支持语言；未标的按 provider 默认。前端据此「先选语言→只出支持该语言的音色」。
const PROVIDER_LANGS = { volcano: ['zh-CN'], azure: ['zh-CN'] };

/** 对外可用音色：均为火山大模型音色（MiniMax 已下线——多语种太生硬）；Azure 仅在配置 key 后出现。 */
export function listVoices() {
  const out = [];
  if (volcanoConfigured()) out.push(...VOLCANO_VOICES);
  if (azureConfigured()) out.push(...AZURE_VOICES);
  return out.map((v) => ({ ...v, langs: v.langs || PROVIDER_LANGS[v.provider] || ['zh-CN'] }));
}

/** 把音色 id 解析成 synthesize 需要的 {provider, voice, style} */
export function resolveVoice(id) {
  const v = ALL.find((x) => x.id === id) || ALL.find((x) => x.id === DEFAULT_VOICE) || MINIMAX_VOICES[0];
  return { provider: v.provider, voice: v.voiceId, style: v.style || '' };
}
