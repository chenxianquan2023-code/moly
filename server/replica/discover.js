/**
 * 找爆款路由：Apify 抓取 TikTok/Amazon 爆款 + 付费下载 + 转存为复刻资产。
 * 计费：抓取免费；下载原视频扣 DOWNLOAD_COST 积分；用它复刻(导入封面+文案)扣 IMPORT_COST 积分。
 * discover_cache / discover_downloads 两张表为可选优化——未建表时优雅降级（不缓存/不记录）。
 */
import { Router } from 'express';
import * as apify from '../lib/apify.js';
import { deductPoints, addPoints } from '../lib/points.js';
import { uploadFromUrl, makePath } from '../lib/storage.js';
import { insertRow, selectOne } from '../lib/supabase.js';
import { DOWNLOAD_COST, IMPORT_COST } from './pricing.js';
import { isAllowed } from '../lib/access.js';

export const discoverRouter = Router();

const CACHE_DAYS = 3;
const BETA_DENY = '内测阶段仅向受邀账号开放，如需试用请联系管理员开通。';

function getEmail(req, res) {
  const email = String(req.body?.userEmail || req.query?.userEmail || req.headers['x-user-email'] || '')
    .trim().toLowerCase();
  if (!email) { res.status(401).json({ success: false, message: '缺少用户标识 userEmail' }); return null; }
  if (!isAllowed(email)) { res.status(403).json({ success: false, code: 'NOT_ALLOWED', message: BETA_DENY }); return null; }
  return email;
}

// 缓存读/写（容错：表不存在或出错就当未命中/跳过）
// v2：搜索改为抓3倍候选按点赞降序——旧缓存(纯数组=相关性序的12条)整体作废，命中即重抓，否则排序修复永远轮不到执行
const CACHE_VERSION = 2;
async function readCache(keyword, platform) {
  try {
    const row = await selectOne('discover_cache',
      `keyword=eq.${encodeURIComponent(keyword)}&platform=eq.${platform}&order=created_at.desc&select=results,created_at`);
    if (!row) return null;
    if ((Date.now() - new Date(row.created_at).getTime()) / 86400000 > CACHE_DAYS) return null;
    const r = row.results;
    if (r && !Array.isArray(r) && r.v === CACHE_VERSION && Array.isArray(r.items)) return r.items;
    return null; // 旧版数组缓存 → 作废重抓
  } catch { return null; }
}
async function writeCache(keyword, platform, results) {
  try { await insertRow('discover_cache', { keyword, platform, results: { v: CACHE_VERSION, items: results } }); } catch { /* 没建表则跳过 */ }
}

// POST /api/discover/search  { keyword, platforms:['tiktok','amazon'] } —— 抓取免费
discoverRouter.post('/discover/search', async (req, res) => {
  try {
    const email = getEmail(req, res); if (!email) return; // 找爆款搜索走 Apify 花钱，须受邀账号
    const keyword = String(req.body?.keyword || '').trim();
    const platforms = Array.isArray(req.body?.platforms) && req.body.platforms.length
      ? req.body.platforms : ['tiktok'];
    if (!keyword) return res.status(400).json({ success: false, message: '请输入商品关键词' });
    if (!apify.apifyConfigured()) return res.status(500).json({ success: false, message: '服务端未配置 APIFY_TOKEN' });

    const results = {};
    const notes = [];
    await Promise.all(platforms.map(async (p) => {
      try {
        let items = await readCache(keyword, p);
        if (!items) {
          items = p === 'tiktok' ? await apify.searchTikTok(keyword, 12)
                : p === 'amazon' ? await apify.searchAmazon(keyword, 12) : [];
          await writeCache(keyword, p, items);
        }
        results[p] = items;
      } catch (e) {
        results[p] = [];
        notes.push(`${p} 抓取失败`);
        console.error(`[discover/search] ${p}:`, String(e.message || e).split('\n')[0]);
      }
    }));
    res.json({ success: true, keyword, results, notes });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/discover/download  { userEmail, sourceUrl } —— 扣积分下载 TikTok 原视频（已下过免费重下）
discoverRouter.post('/discover/download', async (req, res) => {
  try {
    const email = getEmail(req, res); if (!email) return;
    const sourceUrl = String(req.body?.sourceUrl || '').trim();
    if (!sourceUrl) return res.status(400).json({ success: false, message: '缺少 sourceUrl' });

    try {
      const prev = await selectOne('discover_downloads',
        `user_email=eq.${encodeURIComponent(email)}&source_url=eq.${encodeURIComponent(sourceUrl)}&select=video_url`);
      if (prev?.video_url) return res.json({ success: true, videoUrl: prev.video_url, charged: 0 });
    } catch { /* 没建表，继续正常付费流程 */ }

    try {
      await deductPoints(email, DOWNLOAD_COST, '下载爆款视频');
    } catch (e) {
      if (e.code === 'INSUFFICIENT') return res.json({ success: false, code: 'INSUFFICIENT', need: DOWNLOAD_COST, points: e.points });
      if (e.code === 'NO_USER') return res.status(401).json({ success: false, message: '用户不存在，请重新登录' });
      throw e;
    }

    let stored;
    try {
      const dlUrl = await apify.fetchTikTokVideoUrl(sourceUrl);
      stored = await uploadFromUrl(makePath(email, 'discover', 'video.mp4'), dlUrl);
    } catch (e) {
      // 下载/转存失败 → 退回已扣积分，避免"扣了钱没拿到视频"
      try { await addPoints(email, DOWNLOAD_COST, '下载失败退款'); } catch { /* 退款失败也不抛 */ }
      return res.status(502).json({ success: false, message: '原视频抓取失败，已退回积分：' + String(e.message || e).split('\n')[0].slice(0, 80) });
    }
    try { await insertRow('discover_downloads', { user_email: email, source_url: sourceUrl, video_url: stored, credits: DOWNLOAD_COST }); } catch { /* 没表不记录 */ }
    res.json({ success: true, videoUrl: stored, charged: DOWNLOAD_COST });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/discover/to-asset  { userEmail, item } —— 用它复刻（扣 IMPORT_COST），秒级带入封面+文案/商品图
discoverRouter.post('/discover/to-asset', async (req, res) => {
  try {
    const email = getEmail(req, res); if (!email) return;
    const item = req.body?.item || {};
    const isTiktok = item.platform === 'tiktok';
    const isAmazon = item.platform === 'amazon' && !!item.image;
    if (!isTiktok && !isAmazon) return res.status(400).json({ success: false, message: '无法识别的素材' });

    // 先扣导入费（秒级、稳定，不再重下原视频）
    try {
      await deductPoints(email, IMPORT_COST, '用爆款复刻·导入素材');
    } catch (e) {
      if (e.code === 'INSUFFICIENT') return res.json({ success: false, code: 'INSUFFICIENT', need: IMPORT_COST, points: e.points });
      if (e.code === 'NO_USER') return res.status(401).json({ success: false, message: '用户不存在，请重新登录' });
      throw e;
    }

    if (isTiktok) {
      const mode = String(req.body?.mode || 'light');
      if (mode === 'deep' && item.sourceUrl) {
        // 深度复刻：下载原视频 → 转 source_video 资产，走分镜分析（较慢、个别视频可能抓不到）
        try {
          const dlUrl = await apify.fetchTikTokVideoUrl(item.sourceUrl);
          const fileUrl = await uploadFromUrl(makePath(email, 'discover', 'ref.mp4'), dlUrl);
          const asset = await insertRow('assets', { user_email: email, asset_type: 'source_video', file_url: fileUrl });
          return res.json({ success: true, kind: 'sourceVideo', asset, desc: item.desc || '', charged: IMPORT_COST });
        } catch (e) {
          // 抓取失败 → 回退轻量（封面+文案），并明确告知
          let cover = item.cover || '';
          try { if (cover) cover = await uploadFromUrl(makePath(email, 'discover', 'cover.jpg'), cover); } catch { /* 用原直链 */ }
          return res.json({ success: true, kind: 'inspiration', cover, desc: item.desc || '', charged: IMPORT_COST, deepFailed: true, note: '原视频没抓到，已自动用轻量模式（封面+文案）继续' });
        }
      }
      // 轻量（默认）：固化封面图（避免 TikTok CDN 直链过期）+ 带入文案
      let cover = item.cover || '';
      try { if (cover) cover = await uploadFromUrl(makePath(email, 'discover', 'cover.jpg'), cover); } catch { /* 固化失败就用原直链 */ }
      return res.json({ success: true, kind: 'inspiration', cover, desc: item.desc || '', charged: IMPORT_COST });
    }
    // Amazon：商品图固化为 product_image 资产
    const fileUrl = await uploadFromUrl(makePath(email, 'discover', 'product.jpg'), item.image);
    const asset = await insertRow('assets', { user_email: email, asset_type: 'product_image', file_url: fileUrl });
    return res.json({ success: true, kind: 'productImage', asset, desc: item.title || '', charged: IMPORT_COST });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
