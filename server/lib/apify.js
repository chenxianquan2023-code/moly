/**
 * 找爆款 · Apify 抓取封装：TikTok 爆款视频 + Amazon 爆款产品。
 * run-sync-get-dataset-items 同步拿结果，归一化成前端可直接渲染的卡片数据。
 * 字段映射依据真实抓取样本确定。需要环境变量 APIFY_TOKEN。
 */
const API = 'https://api.apify.com/v2/acts';
const TIKTOK = 'clockworks~tiktok-scraper';
const AMAZON = 'junglee~Amazon-crawler';

export const apifyConfigured = () => !!process.env.APIFY_TOKEN;

/** 同步跑一个 actor 并取 dataset items；非 2xx 抛错 */
async function runActor(actorId, input, timeoutMs = 180000) {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error('缺少 APIFY_TOKEN 环境变量');
  const res = await fetch(`${API}/${actorId}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Apify ${actorId} ${res.status}: ${t.slice(0, 160)}`);
  }
  const items = await res.json();
  return Array.isArray(items) ? items : [];
}

/** 搜索 TikTok 爆款视频（不下载、只拿元数据/封面）→ 归一化。
 *  TikTok 搜索接口按"相关性"排序(普通/擦边视频常排前面)，不是按热度——
 *  所以多抓 3 倍候选、按点赞降序取前 limit 条，"搜爆款"才真是爆款。 */
export async function searchTikTok(keyword, limit = 12) {
  // 2 倍候选：3 倍(36条)实测会让同步抓取超过网关超时(前端收到"upstream error"纯文本)，24 条是耗时/质量的平衡点
  const fetchN = Math.min(40, Math.max(limit * 2, 24));
  const items = await runActor(TIKTOK, {
    searchQueries: [keyword],
    searchSection: '/video',
    resultsPerPage: fetchN,
    shouldDownloadVideos: false,
  });
  return items
    .filter((x) => x && x.webVideoUrl && !x.isAd)
    .map((x) => ({
      platform: 'tiktok',
      sourceUrl: x.webVideoUrl,
      videoId: (String(x.webVideoUrl || '').match(/video\/(\d+)/) || [])[1] || String(x.id || ''),
      cover: x.videoMeta?.coverUrl || x.videoMeta?.originalCoverUrl || '',
      desc: x.text || '',
      author: x.authorMeta?.nickName || x.authorMeta?.name || '',
      likes: x.diggCount || 0,
      views: x.playCount || 0,
      shares: x.shareCount || 0,
      duration: x.videoMeta?.duration || 0,
    }))
    .sort((a, b) => (b.likes || 0) - (a.likes || 0))
    .slice(0, limit);
}

/** 搜索 Amazon 爆款产品（关键词拼搜索 URL）→ 归一化 */
export async function searchAmazon(keyword, limit = 12) {
  const url = `https://www.amazon.com/s?k=${encodeURIComponent(keyword)}`;
  const items = await runActor(AMAZON, {
    categoryOrProductUrls: [{ url }],
    maxItemsPerStartUrl: limit,
  });
  return items
    .filter((x) => x && x.url)
    .map((x) => ({
      platform: 'amazon',
      sourceUrl: x.url,
      image: x.thumbnailImage || x.highResolutionImages?.[0] || '',
      title: x.title || '',
      price: x.price ? `${x.price.currency || ''}${x.price.value ?? ''}` : '',
      rating: x.stars || 0,
      reviews: x.reviewsCount || 0,
      brand: x.brand || '',
      asin: x.asin || '',
    }));
}

/** 付费下载：重跑 TikTok actor、开下载附加项，返回原视频可下载 URL */
export async function fetchTikTokVideoUrl(sourceUrl) {
  const items = await runActor(
    TIKTOK,
    { postURLs: [sourceUrl], resultsPerPage: 1, shouldDownloadVideos: true },
    240000,
  );
  const x = items[0] || {};
  let url = x.mediaUrls?.[0] || '';
  if (!url) throw new Error('未取到可下载的视频地址（可能该视频受限）');
  // Apify 下载到的是私有 KVS 记录，直取会 403，需带 token；token 仅服务端转存用、不外泄
  if (/api\.apify\.com/.test(url) && !/[?&]token=/.test(url)) {
    url += (url.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(process.env.APIFY_TOKEN || '');
  }
  return url;
}
