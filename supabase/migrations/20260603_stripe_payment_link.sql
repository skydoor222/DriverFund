-- return_items に Stripe カラムを追加
alter table public.return_items
  add column if not exists stripe_price_id text,
  add column if not exists stripe_payment_link_url text;

-- image_url カラムがなければ追加（アプリ側で参照している）
alter table public.return_items
  add column if not exists image_url text;

-- sponsorships に stripe カラムがなければ追加
alter table public.sponsorships
  add column if not exists stripe_payment_intent_id text,
  add column if not exists stripe_subscription_id text;

-- remaining をデクリメントするヘルパー関数
create or replace function public.decrement_remaining(item_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.return_items
  set remaining = remaining - 1
  where id = item_id
    and remaining is not null
    and remaining > 0;
end;
$$;
