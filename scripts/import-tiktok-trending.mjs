/**
 * 抓 TikTok 热门 sound 入曲库（feature 2）
 *
 * 用法：node --env-file=.env scripts/import-tiktok-trending.mjs ["关键词1" "关键词2" ...]
 *   不传关键词时用下面的默认带货向关键词。
 *
 * 逻辑：每个关键词搜热门视频 → 取其中「被复用的音乐」(musicOriginal=false，即真正的热门 sound，
 *       原声多是博主自己说话，跳过) → 下载 playUrl → ffmpeg 统一转 mp3 → 入 bgm_library。
 * 去重：按 musicId(source_url)。幂等，可反复跑。
 * ⚠️ 这些是平台热门音乐、多含版权；license_type 标 tiktok_trending、attribution 记作者，
 *    发布到各平台的合规由使用者(终端用户)负责（按产品决策：版权归用户操心）。
 */
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { insertRow, selectRows } from '../server/lib/supabase.js';
import { uploadBuffer } from '../server/lib/storage.js';
import * as ff from '../server/replica/ai/ffmpeg.js';

const TOKEN = process.env.APIFY_TOKEN;
const KEYWORDS = process.argv.slice(2).length ? process.argv.slice(2) : ['好物推荐', '美妆好物', '穿搭分享'];
const PER = 15;
const DL_HEADERS = { 'User-Agent': 'Mozilla/5.0', Referer: 'https://www.tiktok.com/' };

async function apifyTikTok(query) {
  const r = await fetch(`https://api.apify.com/v2/acts/clockworks~tiktok-scraper/run-sync-get-dataset-items?token=${TOKEN}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ searchQueries: [query], resultsPerPage: PER, searchSection: '/video', maxProfilesPerQuery: 1 }),
    signal: AbortSignal.timeout(120000),
  });
  if (!r.ok) throw new Error(`Apify ${r.status}: ${(await r.text()).slice(0, 150)}`);
  return r.json();
}

async function main() {
  if (!TOKEN) throw new Error('缺少 APIFY_TOKEN');
  const work = mkdtempSync(join(tmpdir(), 'moly-tt-'));
  const existing = new Set((await selectRows('bgm_library', 'select=source_url')).map((r) => r.source_url).filter(Boolean));
  const seen = new Set();
  let added = 0;
  try {
    for (const kw of KEYWORDS) {
      console.log(`\n搜「${kw}」…`);
      let items = [];
      try { items = await apifyTikTok(kw); } catch (e) { console.error('  抓取失败:', e.message); continue; }
      for (const it of items) {
        const mm = it.musicMeta || {};
        if (mm.musicOriginal !== false) continue;        // 只要复用的热门 sound，跳过原声
        const musicId = mm.musicId || '';
        const srcUrl = `tiktok:music:${musicId}`;
        if (!mm.playUrl || !musicId || seen.has(musicId) || existing.has(srcUrl)) continue;
        seen.add(musicId);
        try {
          const ar = await fetch(mm.playUrl, { headers: DL_HEADERS, signal: AbortSignal.timeout(60000) });
          if (!ar.ok) { console.log('  下载失败', ar.status, mm.musicName); continue; }
          const raw = join(work, `raw_${musicId}`);
          writeFileSync(raw, Buffer.from(await ar.arrayBuffer()));
          const out = join(work, `${musicId}.mp3`);
          await ff.ffmpeg(['-y', '-i', raw, '-vn', '-t', '60', '-c:a', 'libmp3lame', '-q:a', '4', out]); // 取前60s、统一mp3
          const buf = readFileSync(out);
          if (buf.length < 10000) { console.log('  音频异常(过小)跳过', mm.musicName); continue; }
          const fileUrl = await uploadBuffer(`bgm-library/tiktok_${musicId}.mp3`, buf, 'audio/mpeg');
          await insertRow('bgm_library', {
            title: (mm.musicName || '热门音乐').slice(0, 80),
            artist: mm.musicAuthor || null,
            mood: ['热门'],
            genre: 'tiktok trending',
            duration: (await ff.probe(out)).duration || null,
            license_type: 'tiktok_trending',
            source_url: srcUrl,
            attribution: `TikTok · ${mm.musicAuthor || ''}`.trim(),
            file_url: fileUrl,
            active: true,
          });
          console.log('  ✓ 入库:', mm.musicName, '·', mm.musicAuthor);
          added++;
        } catch (e) { console.log('  失败:', mm.musicName, String(e.message || e).slice(0, 60)); }
      }
    }
  } finally { try { rmSync(work, { recursive: true, force: true }); } catch { /* ignore */ } }
  console.log(`\n完成：新增 ${added} 首热门音乐，曲库总数 ${(await selectRows('bgm_library', 'select=id')).length}。`);
}
main().catch((e) => { console.error('失败:', e.message); process.exit(1); });
