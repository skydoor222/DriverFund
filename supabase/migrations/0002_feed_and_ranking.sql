-- ============================================================
-- Migration 0002: フィード・ランキング・カウントダウン基盤
-- 「毎日見たくなる」設計のためのテーブル追加
-- ============================================================

-- ── drivers に達成率・ランキング・カウントダウン用カラムを追加 ──
alter table public.drivers
  add column if not exists season_goal_amount   int default 0,   -- 年間活動費目標（達成率の分母）
  add column if not exists season_raised_amount int default 0,   -- 今季応援総額（達成率の分子）
  add column if not exists weekly_rank          int,             -- 週次ランキング順位
  add column if not exists rank_change          int default 0,   -- 前週比順位変動（+2 / -1）
  add column if not exists next_race_id         uuid;            -- 次戦（カウントダウン用）

-- ── races: レーススケジュール（カウントダウンの根拠）──
create table if not exists public.races (
  id          uuid default gen_random_uuid() primary key,
  category    text not null,
  series_name text,
  round       int,
  circuit     text not null,
  race_date   date not null,
  created_at  timestamptz default now()
);
alter table public.races enable row level security;
drop policy if exists "races: 全員が読める" on public.races;
create policy "races: 全員が読める" on public.races for select using (true);

-- ── posts: 選手の投稿（フィードの核）──
create table if not exists public.posts (
  id          uuid default gen_random_uuid() primary key,
  driver_id   uuid references public.drivers(id) on delete cascade not null,
  type        text not null default 'update'
              check (type in ('update','race_result','behind_scenes','milestone')),
  title       text,
  body        text not null,
  image_urls  text[],
  race_round  int,
  created_at  timestamptz default now()
);
alter table public.posts enable row level security;
drop policy if exists "posts: 全員が読める" on public.posts;
create policy "posts: 全員が読める" on public.posts for select using (true);
drop policy if exists "posts: ドライバーが自分のを管理" on public.posts;
create policy "posts: ドライバーが自分のを管理" on public.posts
  for all using (
    driver_id in (select id from public.drivers where profile_id = auth.uid())
  ) with check (
    driver_id in (select id from public.drivers where profile_id = auth.uid())
  );

create index if not exists idx_posts_driver_created
  on public.posts (driver_id, created_at desc);
create index if not exists idx_posts_created
  on public.posts (created_at desc);

-- ── favorites: お気に入り（気になるタブ）──
create table if not exists public.favorites (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  driver_id   uuid references public.drivers(id) on delete cascade not null,
  created_at  timestamptz default now(),
  unique (user_id, driver_id)
);
alter table public.favorites enable row level security;
drop policy if exists "favorites: 自分のお気に入りを管理" on public.favorites;
create policy "favorites: 自分のお気に入りを管理" on public.favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── 達成率を計算するビュー（ランキング用）──
create or replace view public.driver_rankings as
select
  d.id,
  d.profile_id,
  d.category,
  d.total_supporters,
  d.season_goal_amount,
  d.season_raised_amount,
  case
    when d.season_goal_amount > 0
    then round((d.season_raised_amount::numeric / d.season_goal_amount) * 100)
    else 0
  end as achievement_rate,
  d.weekly_rank,
  d.rank_change
from public.drivers d
where d.is_published = true;
