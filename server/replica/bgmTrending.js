/**
 * TikTok 热门 sound 抓取 → 入 bgm_library（feature 2 共用核心）
 * 被「找爆款」端点(routes.js)和命令行脚本(scripts/import-tiktok-trending.mjs)共用。
 * ⚠️ 抓的是平台热门音乐、多含版权；license_type 标 tiktok_trending、记 attribution，
 *    发布到各平台的合规由终端用户负责（按产品决策：版权归用户操心）。
 */
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { insertRow, selectRows } from '../lib/supabase.js';
import { uploadBuffer } from '../lib/storage.js';
import * as ff from './ai/ffmpeg.js';

const DL_HEADERS = { 'User-Agent': 'Mozilla/5.0', Referer: 'https://www.tiktok.com/' };

async function apifyTikTok(query, perPage) {
  const TOKEN = process.env.APIFY_TOKEN;
  if (!TOKEN) throw new Error('缺少 APIFY_TOKEN');
  const r = await fetch(`https://api.apify.com/v2/acts/clockworks~tiktok-scraper/run-sync-get-dataset-items?token=${TOKEN}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ searchQueries: [query], resultsPerPage: perPage, searchSection: '/video', maxProfilesPerQuery: 1 }),
    signal: AbortSignal.timeout(120000),
  });
  if (!r.ok) throw new Error(`Apify ${r.status}: ${(await r.text()).slice(0, 150)}`);
  return r.json();
}

/**
 * 抓某关键词的 TikTok 热门 sound 入 bgm_library。只取「被复用的热门音乐」(musicOriginal=false，
 * 原声多是博主自己说话，跳过)。下载 playUrl → ffmpeg 转 mp3 → 上传 → 入库。按 musicId 去重、幂等。
 * @returns {{added:number, tracks:Array}}
 */
export async function fetchTrendingToLibrary(keyword, { perPage = 15, max = 8 } = {}) {
  const work = mkdtempSync(join(tmpdir(), 'moly-tt-'));
  const existing = new Set((await selectRows('bgm_library', 'select=source_url')).map((r) => r.source_url).filter(Boolean));
  const seen = new Set();
  const tracks = [];
  try {
    const items = await apifyTikTok(keyword, perPage);
    for (const it of items) {
      if (tracks.length >= max) break;
      const mm = it.musicMeta || {};
      if (mm.musicOriginal !== false) continue;
      const musicId = mm.musicId || '';
      const srcUrl = `tiktok:music:${musicId}`;
      if (!mm.playUrl || !musicId || seen.has(musicId) || existing.has(srcUrl)) continue;
      seen.add(musicId);
      try {
        const ar = await fetch(mm.playUrl, { headers: DL_HEADERS, signal: AbortSignal.timeout(60000) });
        if (!ar.ok) continue;
        const raw = join(work, `raw_${musicId}`);
        writeFileSync(raw, Buffer.from(await ar.arrayBuffer()));
        const out = join(work, `${musicId}.mp3`);
        await ff.ffmpeg(['-y', '-i', raw, '-vn', '-t', '60', '-c:a', 'libmp3lame', '-q:a', '4', out]); // 取前60s、统一mp3
        const buf = readFileSync(out);
        if (buf.length < 10000) continue;
        const fileUrl = await uploadBuffer(`bgm-library/tiktok_${musicId}.mp3`, buf, 'audio/mpeg');
        const row = await insertRow('bgm_library', {
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
        tracks.push(row);
      } catch { /* 单首失败跳过 */ }
    }
  } finally { try { rmSync(work, { recursive: true, force: true }); } catch { /* ignore */ } }
  return { added: tracks.length, tracks };
}
