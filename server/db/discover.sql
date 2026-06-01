-- 找爆款：抓取缓存 + 付费下载记录。
-- 在 Supabase → SQL Editor 执行一次即可。未执行时后端会优雅降级（不缓存/不记录，但功能可用）。

create table if not exists public.discover_cache (
  id          uuid primary key default gen_random_uuid(),
  keyword     text not null,
  platform    text not null,            -- 'tiktok' | 'amazon'
  results     jsonb not null,           -- 归一化后的卡片数据数组
  created_at  timestamptz not null default now()
);
create index if not exists idx_discover_cache_key
  on public.discover_cache(keyword, platform, created_at desc);

create table if not exists public.discover_downloads (
  id          uuid primary key default gen_random_uuid(),
  user_email  text not null,
  source_url  text not null,            -- 原视频在平台上的唯一 URL
  video_url   text not null,            -- 转存到 Supabase 后的可下载 URL
  credits     int  not null default 5,
  created_at  timestamptz not null default now()
);
create index if not exists idx_discover_dl_user
  on public.discover_downloads(user_email, source_url);
