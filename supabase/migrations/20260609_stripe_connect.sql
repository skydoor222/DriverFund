-- drivers に Stripe Connect カラムを追加
alter table public.drivers
  add column if not exists stripe_account_id text,
  add column if not exists stripe_onboarding_complete boolean default false;

-- account.updated webhook でオンボーディング完了を自動検知するために
-- stripe_account_id にインデックスを追加
create index if not exists idx_drivers_stripe_account_id
  on public.drivers(stripe_account_id);
