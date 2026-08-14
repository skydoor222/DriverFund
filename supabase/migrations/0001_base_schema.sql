-- ============================================================
-- Migration 0001: ベーススキーマ（profiles / drivers / return_items /
--                 sponsorships / favorites）
--
-- 【経緯】
-- 旧Supabaseプロジェクトの削除に伴い、ベーススキーマを定義した
-- schema.sql がリポジトリ上に存在しない状態になっていた
-- （SETUP.md は supabase/schema.sql を参照しているが、実体は無かった）。
-- 既存の 0002 以降は全て alter table の追記型マイグレーションのため、
-- このファイルが無いと DB をゼロから再構築できない。
-- lib/types.ts とアプリ側クエリの実使用に基づいて再構成したもの。
--
-- 適用順: 0001 → 0002 → 20260603 → 20260609
-- ============================================================

-- ── profiles: auth.users と 1:1。ロール（driver / supporter）を保持 ──
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  avatar_url text,
  role       text not null default 'supporter'
             check (role in ('driver','supporter')),
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;

drop policy if exists "profiles: 本人が読める" on public.profiles;
create policy "profiles: 本人が読める"
  on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles: 本人が作成できる" on public.profiles;
create policy "profiles: 本人が作成できる"
  on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "profiles: 本人が更新できる" on public.profiles;
create policy "profiles: 本人が更新できる"
  on public.profiles for update using (auth.uid() = id);

-- 新規サインアップ時に profiles 行を自動生成する
-- （Googleログインではアプリ側の upsert が走らないため必須）
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'role', 'supporter')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── drivers: 選手プロフィール（公開ページの実体）──
create table if not exists public.drivers (
  id           uuid default gen_random_uuid() primary key,
  profile_id   uuid references public.profiles(id) on delete cascade not null unique,
  full_name    text,
  avatar_url   text,
  cover_url    text,
  catchphrase  text,
  bio          text,                 -- 物語型ストーリーを JSON 文字列で保持
  hometown     text,
  age          int,
  category     text not null default 'other'
               check (category in ('kart','f4','sf','other')),
  series_name  text,
  car_number   text,
  team_name    text,
  race_history text,
  goal         text,
  sns_x        text,
  sns_instagram text,
  total_supporters int default 0,
  monthly_revenue  int default 0,
  is_published boolean default false,
  -- 拡張フィールド（JSON 文字列で保持）
  photo_urls      text[],
  career_timeline text,
  sponsors        text,
  blood_type      text,
  motto           text,
  race_results    text,
  series_rank     int,
  team_rank       int,
  total_points    int,
  created_at   timestamptz default now()
);
alter table public.drivers enable row level security;

-- 公開中の選手は誰でも閲覧できる（未ログインの閲覧が主要導線のため）
drop policy if exists "drivers: 公開中は全員が読める" on public.drivers;
create policy "drivers: 公開中は全員が読める"
  on public.drivers for select
  using (is_published = true or auth.uid() = profile_id);

drop policy if exists "drivers: 本人が作成できる" on public.drivers;
create policy "drivers: 本人が作成できる"
  on public.drivers for insert with check (auth.uid() = profile_id);

drop policy if exists "drivers: 本人が更新できる" on public.drivers;
create policy "drivers: 本人が更新できる"
  on public.drivers for update using (auth.uid() = profile_id);

create index if not exists idx_drivers_profile_id on public.drivers(profile_id);
create index if not exists idx_drivers_published  on public.drivers(is_published);
create index if not exists idx_drivers_category   on public.drivers(category);

-- ── return_items: 応援プラン（リターン）──
create table if not exists public.return_items (
  id             uuid default gen_random_uuid() primary key,
  driver_id      uuid references public.drivers(id) on delete cascade not null,
  title          text not null,
  description    text,
  category       text not null default 'report'
                 check (category in ('report','goods','pit','part',
                                     'experience','logo_machine',
                                     'logo_suit','logo_helmet')),
  price          int not null,
  quantity_limit int,
  remaining      int,
  billing_type   text not null default 'monthly'
                 check (billing_type in ('monthly','one_time')),
  target         text not null default 'both'
                 check (target in ('individual','corporate','both')),
  is_active      boolean default true,
  created_at     timestamptz default now()
);
alter table public.return_items enable row level security;

drop policy if exists "return_items: 全員が読める" on public.return_items;
create policy "return_items: 全員が読める"
  on public.return_items for select using (true);

-- 選手本人のみ自分のプランを操作できる
drop policy if exists "return_items: 選手本人が操作できる" on public.return_items;
create policy "return_items: 選手本人が操作できる"
  on public.return_items for all
  using (
    exists (
      select 1 from public.drivers d
      where d.id = return_items.driver_id and d.profile_id = auth.uid()
    )
  );

create index if not exists idx_return_items_driver_id on public.return_items(driver_id);

-- ── sponsorships: 応援（支援）レコード ──
create table if not exists public.sponsorships (
  id              uuid default gen_random_uuid() primary key,
  supporter_id    uuid references public.profiles(id) on delete set null,
  driver_id       uuid references public.drivers(id) on delete cascade not null,
  return_item_id  uuid references public.return_items(id) on delete set null,
  amount          int not null,
  status          text not null default 'active'
                  check (status in ('active','paused','completed')),
  started_at      timestamptz default now(),
  next_billing_at timestamptz,
  created_at      timestamptz default now()
);
alter table public.sponsorships enable row level security;

-- 応援者は自分の応援を、選手は自分への応援を見られる
drop policy if exists "sponsorships: 当事者が読める" on public.sponsorships;
create policy "sponsorships: 当事者が読める"
  on public.sponsorships for select
  using (
    auth.uid() = supporter_id
    or exists (
      select 1 from public.drivers d
      where d.id = sponsorships.driver_id and d.profile_id = auth.uid()
    )
  );

create index if not exists idx_sponsorships_supporter on public.sponsorships(supporter_id);
create index if not exists idx_sponsorships_driver    on public.sponsorships(driver_id);

-- ── favorites: 気になる（お気に入り）──
create table if not exists public.favorites (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  driver_id  uuid references public.drivers(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (user_id, driver_id)
);
alter table public.favorites enable row level security;

drop policy if exists "favorites: 本人のみ操作できる" on public.favorites;
create policy "favorites: 本人のみ操作できる"
  on public.favorites for all using (auth.uid() = user_id);

create index if not exists idx_favorites_user_id on public.favorites(user_id);
