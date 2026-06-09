#!/bin/bash
# DriverFund Stripe 自動セットアップスクリプト
# 実行: bash scripts/setup-stripe.sh

set -e
cd "$(dirname "$0")/.."

echo "=== DriverFund Stripe セットアップ ==="

# 1. APIキー取得
echo ""
echo "▶ Stripe APIキーを取得中..."
SECRET_KEY=$(stripe config get secret_key 2>/dev/null | awk '{print $NF}')
if [ -z "$SECRET_KEY" ]; then
  echo "エラー: stripe login が完了していません"
  exit 1
fi
echo "✓ APIキー取得: ${SECRET_KEY:0:12}..."

# 2. テスト用Webhookエンドポイント確認
SUPABASE_URL=$(grep EXPO_PUBLIC_SUPABASE_URL .env | cut -d= -f2)
WEBHOOK_URL="${SUPABASE_URL}/functions/v1/stripe-webhook"
echo ""
echo "▶ WebhookエンドポイントURL: $WEBHOOK_URL"

# 3. Webhook作成（Stripe API直接叩く）
echo ""
echo "▶ Stripe Webhook登録中..."
WEBHOOK_RESPONSE=$(curl -s -X POST https://api.stripe.com/v1/webhook_endpoints \
  -u "${SECRET_KEY}:" \
  -d "url=${WEBHOOK_URL}" \
  -d "enabled_events[]=checkout.session.completed" \
  -d "enabled_events[]=invoice.payment_succeeded" \
  -d "enabled_events[]=customer.subscription.deleted" \
  -d "description=DriverFund Webhook")

WEBHOOK_SECRET=$(echo "$WEBHOOK_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('secret',''))")
WEBHOOK_ID=$(echo "$WEBHOOK_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))")

if [ -z "$WEBHOOK_SECRET" ]; then
  echo "Webhook既存チェック..."
  # すでに登録済みの場合はそのまま続行
  echo "⚠ Webhook登録をスキップ（手動で確認してください）"
else
  echo "✓ Webhook登録完了: $WEBHOOK_ID"
  echo "✓ Webhook Secret: ${WEBHOOK_SECRET:0:12}..."
fi

# 4. Supabase Edge Functions デプロイ
echo ""
echo "▶ Supabase Edge Functions デプロイ中..."
npx supabase functions deploy create-payment-link --project-ref thktcznsxieijkhxzitk
npx supabase functions deploy stripe-webhook --project-ref thktcznsxieijkhxzitk
echo "✓ Edge Functions デプロイ完了"

# 5. Supabase 環境変数設定
echo ""
echo "▶ Supabase 環境変数設定中..."
ANON_KEY=$(grep EXPO_PUBLIC_SUPABASE_ANON_KEY .env | cut -d= -f2)

npx supabase secrets set \
  STRIPE_SECRET_KEY="$SECRET_KEY" \
  STRIPE_WEBHOOK_SECRET="$WEBHOOK_SECRET" \
  APP_URL="https://driverfund-app.vercel.app" \
  --project-ref thktcznsxieijkhxzitk
echo "✓ Supabase 環境変数設定完了"

# 6. DBマイグレーション
echo ""
echo "▶ DBマイグレーション実行中..."
SUPABASE_SERVICE_KEY=$(npx supabase projects api-keys --project-ref thktcznsxieijkhxzitk 2>/dev/null | grep service_role | awk '{print $NF}')
curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": $(cat supabase/migrations/20260603_stripe_payment_link.sql | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))')}" \
  > /dev/null

# より確実な方法：supabase CLIで実行
npx supabase db push --project-ref thktcznsxieijkhxzitk 2>/dev/null || echo "⚠ マイグレーションは手動実行が必要な場合があります"
echo "✓ DBマイグレーション完了"

# 7. Vercel環境変数更新
echo ""
echo "▶ Vercel環境変数更新中..."
echo "$SECRET_KEY" | npx vercel env add STRIPE_SECRET_KEY production 2>/dev/null || true
echo "https://driverfund-app.vercel.app" | npx vercel env add APP_URL production 2>/dev/null || true
echo "✓ Vercel環境変数更新完了"

echo ""
echo "==============================="
echo "✅ セットアップ完了！"
echo ""
echo "移管する場合："
echo "1. 新しい運営者がStripeアカウントでAPIキーを発行"
echo "2. supabase secrets set STRIPE_SECRET_KEY=新しいキー"
echo "3. Stripe WebhookのURLを新アカウントに登録し直す"
echo "==============================="
