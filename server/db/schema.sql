-- ============================================================
-- Moly · 爆款视频复刻 MVP —— 数据库 Schema (Supabase / PostgreSQL)
-- ============================================================
-- 应用方式：Supabase 控制台 → SQL Editor → 粘贴执行（幂等，可重复运行）。
-- 用户标识沿用现有 moly_users.email（与现有 auth/points 接口一致）。
-- 所有表启用 RLS：服务端用 service_role 密钥访问（绕过 RLS）；
-- 匿名/前端 anon key 无策略 = 无法直接读写，保证安全。
-- ============================================================

-- 素材表：商品图/衣服图/模特图/人脸图/姿态参考/爆款原视频
create table if not exists public.assets (
  id            uuid primary key default gen_random_uuid(),
  user_email    text not null,
  asset_type    text not null check (asset_type in
                  ('product_image','outfit_image','model_image',
                   'face_image','pose_reference','source_video')),
  file_url      text not null,
  thumbnail_url text,
  duration      numeric,          -- 视频时长（秒）
  width         integer,
  height        integer,
  status        text not null default 'ready'
                  check (status in ('uploading','ready','failed')),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_assets_user on public.assets(user_email);
create index if not exists idx_assets_type on public.assets(asset_type);

-- 爆款视频表
create table if not exists public.source_videos (
  id              uuid primary key default gen_random_uuid(),
  user_email      text not null,
  asset_id        uuid references public.assets(id) on delete set null,
  duration        numeric,
  width           integer,
  height          integer,
  cover_url       text,
  analysis_status text not null default 'pending'
                    check (analysis_status in ('pending','running','succeeded','failed')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_source_videos_user on public.source_videos(user_email);

-- 视频解析结果表
create table if not exists public.video_analysis (
  id              uuid primary key default gen_random_uuid(),
  source_video_id uuid not null references public.source_videos(id) on delete cascade,
  analysis_json   jsonb not null default '{}'::jsonb,  -- 时长/比例/分镜/字幕/动作/商品位置
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_video_analysis_sv on public.video_analysis(source_video_id);

-- 生成任务表（一键复刻；步骤级状态存 steps JSONB）
create table if not exists public.generation_tasks (
  id                uuid primary key default gen_random_uuid(),
  user_email        text not null,
  source_video_id   uuid references public.source_videos(id) on delete set null,
  task_type         text not null default 'one_click_replica',
  status            text not null default 'created'
                      check (status in ('created','queued','running','succeeded','failed','cancelled')),
  progress          integer not null default 0,   -- 0-100
  options_json      jsonb not null default '{}'::jsonb,  -- 勾选的复刻方式与语言/比例
  input_json        jsonb not null default '{}'::jsonb,  -- 输入素材 id 等
  output_json       jsonb not null default '{}'::jsonb,  -- 产物引用
  steps             jsonb not null default '[]'::jsonb,  -- [{capability,status,progress,cost,error}]
  credits_estimated integer not null default 0,
  credits_charged   integer not null default 0,
  error_message     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_gen_tasks_user on public.generation_tasks(user_email);
create index if not exists idx_gen_tasks_status on public.generation_tasks(status);

-- 生成视频表（最终成品）
create table if not exists public.generated_videos (
  id              uuid primary key default gen_random_uuid(),
  user_email      text not null,
  task_id         uuid references public.generation_tasks(id) on delete cascade,
  source_video_id uuid references public.source_videos(id) on delete set null,
  video_url       text not null,
  cover_url       text,
  subtitle_url    text,
  duration        numeric,
  created_at      timestamptz not null default now()
);
create index if not exists idx_generated_videos_user on public.generated_videos(user_email);

-- 人脸授权确认表（PRD P0-2 合规要求）
create table if not exists public.face_consents (
  id              uuid primary key default gen_random_uuid(),
  user_email      text not null,
  asset_id        uuid references public.assets(id) on delete cascade,
  consent_checked boolean not null default false,
  consent_time    timestamptz,
  ip              text,
  created_at      timestamptz not null default now()
);
create index if not exists idx_face_consents_user on public.face_consents(user_email);

-- 自动维护 updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

do $$
declare t text;
begin
  foreach t in array array['assets','source_videos','video_analysis','generation_tasks']
  loop
    execute format('drop trigger if exists trg_%I_updated on public.%I;', t, t);
    execute format('create trigger trg_%I_updated before update on public.%I
                    for each row execute function public.set_updated_at();', t, t);
  end loop;
end $$;

-- 启用 RLS（仅 service_role 可访问；anon/authenticated 无策略=拒绝）
alter table public.assets            enable row level security;
alter table public.source_videos     enable row level security;
alter table public.video_analysis    enable row level security;
alter table public.generation_tasks  enable row level security;
alter table public.generated_videos  enable row level security;
alter table public.face_consents     enable row level security;
