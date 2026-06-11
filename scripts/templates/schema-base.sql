-- ============================================================
-- Base Schema Template
-- 新規プロジェクトのベースとして使用
-- ============================================================

-- profiles: auth.users と1対1
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null default '',
  avatar_url text,
  role text not null default 'user',
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "自分のプロフィールを読み書き" on public.profiles
  using (auth.uid() = id) with check (auth.uid() = id);
create policy "公開プロフィールは全員読める" on public.profiles
  for select using (true);

-- auth trigger: サインアップ時に profiles を自動作成
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
