// 生成火山音色的「试听样本」：按每个音色的主语言(langs[0])合成一句 → 上传 Supabase voices/samples/<id>.mp3。
// 同时充当 voice_type 可用性验证：✗ 即该音色在账号里未开通/ID 不对。
// 用法（仓库根目录）：node scripts/gen-volc-samples.mjs
import 'dotenv/config';
import { synthesize } from '../server/replica/ai/tts.js';
import { VOLCANO_VOICES } from '../server/replica/voices.js';
import { uploadBuffer } from '../server/lib/storage.js';

const TEXT = {
  'zh-CN': '哈喽大家好，欢迎来到我的直播间，这款好物真的太值了～',
  'en-US': "Hey guys, this is such a great find. You really don't want to miss it!",
  'ja-JP': 'こんにちは、今日は最高のおすすめ商品を紹介します！',
  'es-ES': '¡Hola a todos! Este producto es increíble, no te lo pierdas.',
};

let ok = 0;
for (const v of VOLCANO_VOICES) {
  const lang = (v.langs && v.langs[0]) || 'zh-CN';
  const text = TEXT[lang] || TEXT['zh-CN'];
  try {
    const buf = await synthesize(text, { provider: 'volcano', voice: v.voiceId });
    const url = await uploadBuffer(`voices/samples/${v.id}.mp3`, buf, 'audio/mpeg');
    console.log(`✓ ${v.label.padEnd(14)} [${lang}] ${String(buf.length).padStart(7)}B  ${v.voiceId}`);
    ok++;
  } catch (e) {
    console.log(`✗ ${v.label.padEnd(14)} [${lang}] ${v.voiceId} —— ${e.message}`);
  }
}
console.log(`\n结果：${ok}/${VOLCANO_VOICES.length} 个样本成功（✗ 的音色需在火山控制台确认已开通）`);
