-- DriverFund MVP Schema

-- profiles: auth.usersと1対1でユーザー基本情報を管理
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role text not null check (role in ('driver', 'supporter')),
  full_name text not null,
  avatar_url text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "profiles: 自分のデータを読み書き" on public.profiles
  using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles: 全員が公開プロフィールを読める" on public.profiles
  for select using (true);

-- drivers: ドライバー詳細情報
create table public.drivers (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade unique not null,
  catchphrase text,
  bio text not null default '',
  hometown text,
  age int,
  category text not null check (category in ('kart', 'f4', 'sf', 'other')),
  series_name text,
  car_number text,
  team_name text,
  race_history text,
  goal text,
  cover_url text,
  sns_x text,
  sns_instagram text,
  is_published boolean default false,
  total_supporters int default 0,
  monthly_revenue int default 0,
  created_at timestamptz default now()
);
alter table public.drivers enable row level security;
create policy "drivers: 公開ドライバーは全員読める" on public.drivers
  for select using (is_published = true or profile_id = auth.uid());
create policy "drivers: 自分のデータを更新" on public.drivers
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- return_items: お返しメニュー
create table public.return_items (
  id uuid default gen_random_uuid() primary key,
  driver_id uuid references public.drivers(id) on delete cascade not null,
  title text not null,
  description text,
  category text not null check (category in (
    'report', 'goods', 'pit', 'part', 'experience',
    'logo_machine', 'logo_suit', 'logo_helmet'
  )),
  price int not null,
  quantity_limit int,
  remaining int,
  billing_type text not null check (billing_type in ('monthly', 'one_time')),
  target text not null default 'both' check (target in ('individual', 'corporate', 'both')),
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table public.return_items enable row level security;
create policy "return_items: 全員が読める" on public.return_items
  for select using (is_active = true);
create policy "return_items: ドライバーが自分のを管理" on public.return_items
  for all using (
    driver_id in (select id from public.drivers where profile_id = auth.uid())
  );

-- sponsorships: 応援契約
create table public.sponsorships (
  id uuid default gen_random_uuid() primary key,
  supporter_id uuid references public.profiles(id) on delete cascade not null,
  driver_id uuid references public.drivers(id) on delete cascade not null,
  return_item_id uuid references public.return_items(id) not null,
  status text not null default 'active' check (status in ('active', 'paused', 'completed')),
  stripe_payment_intent_id text,
  stripe_subscription_id text,
  amount int not null,
  started_at timestamptz default now(),
  next_billing_at timestamptz
);
alter table public.sponsorships enable row level security;
create policy "sponsorships: 自分の応援を読める" on public.sponsorships
  for select using (
    supporter_id = auth.uid()
    or driver_id in (select id from public.drivers where profile_id = auth.uid())
  );
create policy "sponsorships: 応援者が作成" on public.sponsorships
  for insert with check (supporter_id = auth.uid());

-- auth.usersにサインアップ時にprofilesを自動作成するトリガー
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, role, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'supporter'),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- remaining を自動デクリメントするトリガー
create or replace function public.decrement_remaining()
returns trigger language plpgsql as $$
begin
  update public.return_items
  set remaining = remaining - 1
  where id = new.return_item_id and remaining is not null;
  return new;
end;
$$;

create trigger on_sponsorship_created
  after insert on public.sponsorships
  for each row execute procedure public.decrement_remaining();
