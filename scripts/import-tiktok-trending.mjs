/**
 * 抓 TikTok 热门 sound 入曲库（命令行版；核心逻辑见 server/replica/bgmTrending.js，与前端「找爆款」共用）
 * 用法：node --env-file=.env scripts/import-tiktok-trending.mjs ["关键词1" "关键词2" ...]
 */
import { fetchTrendingToLibrary } from '../server/replica/bgmTrending.js';

const KEYWORDS = process.argv.slice(2).length ? process.argv.slice(2) : ['好物推荐', '美妆好物', '穿搭分享'];

async function main() {
  let total = 0;
  for (const kw of KEYWORDS) {
    console.log(`\n搜「${kw}」…`);
    try {
      const r = await fetchTrendingToLibrary(kw, { max: 8 });
      r.tracks.forEach((t) => console.log('  ✓ 入库:', t.title, '·', t.artist));
      console.log(`  本关键词新增 ${r.added}`);
      total += r.added;
    } catch (e) { console.error('  失败:', e.message); }
  }
  console.log(`\n完成：共新增 ${total} 首热门音乐。`);
}
main().catch((e) => { console.error('失败:', e.message); process.exit(1); });
