# Stripe 受け取り先を夏生さんのアカウントに切り替える手順

## 方針（方法2）

- **お金の入金先 = 夏生さんのStripeアカウント**
- 夏生さんがStripeアカウントの**オーナー**
- あなた（実装担当）が**管理者**として招待され、自分のログインでキーを取得 → Supabaseに設定
- → 夏生さんからシークレットキーを口頭で聞く必要がない（自分のアクセス権で取得する）

---

## STEP 1: 夏生さんにやってもらうこと（メッセージ送信）

下記メッセージを夏生さんに送る。夏生さん側の作業は**2つだけ**：

1. Stripeアカウントを作る
2. あなたを管理者として招待する

---

## STEP 2: あなたがやること（招待を受けたあと）

夏生さんのアカウントに自分のログインで入り、以下を実施。

### 2-1. APIキーを取得
1. https://dashboard.stripe.com にログイン
2. 右上のアカウント切り替えで「**夏生さんのアカウント**」を選択
3. 開発者 → APIキー（招待先メール: `sorato@moretokyo.jp`）
   - 「公開可能キー」`pk_live_...` をコピー
   - 「シークレットキー」`sk_live_...` を発行・コピー

### 2-2. Webhookを登録
1. 開発者 → Webhook → エンドポイントを追加
2. エンドポイントURL:
   ```
   https://thktcznsxieijkhxzitk.supabase.co/functions/v1/stripe-webhook
   ```
3. リッスンするイベント:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
4. 作成後、「署名シークレット」`whsec_...` をコピー

### 2-3. Supabase Edge Functions のシークレットを更新
```bash
SUPABASE_ACCESS_TOKEN=<あなたのSupabaseアクセストークン> \
npx supabase secrets set \
  STRIPE_SECRET_KEY=sk_live_xxxxx \
  STRIPE_WEBHOOK_SECRET=whsec_xxxxx \
  APP_URL=https://driverfund-app.vercel.app \
  --project-ref thktcznsxieijkhxzitk
```

### 2-4. Vercelの公開キーを更新
- Vercel → Settings → Environment Variables
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` を `pk_live_...` に更新
- 再デプロイ（git push でOK）

### 2-5. 古い決済リンクをリセット（重要）
旧アカウントで作られた Payment Link は無効になるため、DBをクリアして再生成させる：
```sql
-- Supabase SQL Editor で実行
update return_items set stripe_payment_link_url = null;
```

---

## STEP 3: 動作確認

- [ ] https://driverfund-app.vercel.app で支援アイテムの購入ボタンを押す
- [ ] Stripe決済画面に遷移する
- [ ] テスト決済が通る
- [ ] 夏生さんのStripeダッシュボードに売上が表示される

---

## 注意

- **本番（live）モードのキーを使う場合**、夏生さんは事前にStripeの本人確認・銀行口座登録を完了している必要がある（Stripeのオンボーディング）
- テスト段階では `pk_test_` / `sk_test_` でOK。本番公開時に `live` に切り替える
