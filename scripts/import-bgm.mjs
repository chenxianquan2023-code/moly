/**
 * BGM 曲库导入脚本（WS4）
 *
 * 用法：
 *   1) 先在 Supabase 执行 server/db/schema.sql 里的 bgm_library 建表。
 *   2) 把免版税音乐文件(mp3/wav，来自 Pixabay CC0 / Mixkit 等可商用免署名源)放进 scripts/bgm-assets/。
 *   3) 可选：在 scripts/bgm-manifest.json 里按「文件名→元数据」补充 title/mood/genre/license/source。
 *      缺省时 title 取文件名、mood 取 ['活力']、license_type 取 'pixabay_cc0'。
 *   4) 运行：  node --env-file=.env scripts/import-bgm.mjs
 *
 * 幂等：已存在同名 title 的曲目会跳过，可反复运行。
 * 合规：license_type/source_url/attribution 务必如实填写，备各平台审核与上架追溯。
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { insertRow, selectRows } from '../server/lib/supabase.js';
import { uploadBuffer } from '../server/lib/storage.js';
import * as ff from '../server/replica/ai/ffmpeg.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ASSET_DIR = join(HERE, 'bgm-assets');
const MANIFEST = join(HERE, 'bgm-manifest.json');
const AUDIO_EXT = new Set(['.mp3', '.wav', '.m4a', '.aac', '.ogg']);
const MIME = { '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.ogg': 'audio/ogg' };

async function main() {
  if (!existsSync(ASSET_DIR)) {
    console.error(`缺少素材目录：${ASSET_DIR}\n请创建并放入免版税音乐文件后重试。`);
    process.exit(1);
  }
  const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
  const files = readdirSync(ASSET_DIR).filter((f) => AUDIO_EXT.has(extname(f).toLowerCase()));
  if (!files.length) { console.error(`${ASSET_DIR} 里没有音频文件。`); process.exit(1); }

  const existing = new Set((await selectRows('bgm_library', 'select=title')).map((r) => r.title));
  let added = 0, skipped = 0;

  for (const f of files) {
    const meta = manifest[f] || {};
    const title = meta.title || basename(f, extname(f));
    if (existing.has(title)) { console.log(`跳过(已存在): ${title}`); skipped++; continue; }

    const localPath = join(ASSET_DIR, f);
    let duration = null;
    try { duration = (await ff.probe(localPath)).duration || null; } catch { /* 时长可空 */ }

    const buf = readFileSync(localPath);
    const ext = extname(f).toLowerCase();
    const storagePath = `bgm-library/${Date.now()}_${basename(f).replace(/[^\w.-]+/g, '_')}`;
    const fileUrl = await uploadBuffer(storagePath, buf, MIME[ext] || 'audio/mpeg');

    const row = await insertRow('bgm_library', {
      title,
      artist: meta.artist || null,
      mood: Array.isArray(meta.mood) ? meta.mood : ['活力'],
      genre: meta.genre || null,
      tempo_bpm: meta.tempo_bpm || null,
      duration,
      measured_lufs: null, // 运行时 extractSourceBgm 会统一 loudnorm，入库不强制测
      license_type: meta.license_type || 'pixabay_cc0',
      source_url: meta.source_url || null,
      attribution: meta.attribution || null,
      file_url: fileUrl,
      active: true,
    });
    console.log(`已入库: ${title}  [${(row.mood || []).join('/')}]  ${fileUrl}`);
    added++;
  }
  console.log(`\n完成：新增 ${added}，跳过 ${skipped}，曲库总数 ${(await selectRows('bgm_library', 'select=id')).length}。`);
}

main().catch((e) => { console.error('导入失败：', e?.message || e); process.exit(1); });
