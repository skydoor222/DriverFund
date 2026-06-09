# DriverFund 運営引き継ぎ手順

新しい運営者がやることは **4つのサービスのアカウント権限を受け取る** だけです。

---

## 引き継ぎチェックリスト

### 1. GitHub（コードリポジトリ）
**現オーナーがやること：**
- https://github.com/skydoor222/DriverFund → Settings → Collaborators
- 新運営者のGitHubアカウントを `Admin` として招待

**新運営者がやること：**
- 招待を承諾するだけ

---

### 2. Vercel（Webホスティング）
**現オーナーがやること：**
- https://vercel.com/skydoor222s-projects/driverfund-app → Settings → Members
- 新運営者のメールアドレスを `Owner` として招待

**新運営者がやること：**
- 招待を承諾
- Vercelの環境変数（Settings → Environment Variables）を自分のキーに更新：
  ```
  EXPO_PUBLIC_SUPABASE_URL        ← Supabaseから取得
  EXPO_PUBLIC_SUPABASE_ANON_KEY   ← Supabaseから取得
  EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ← Stripeから取得
  ```
- 更新後に `vercel --prod` で再デプロイ（またはGitにpushするだけ）

---

### 3. Supabase（データベース・認証）
**現オーナーがやること：**
- https://supabase.com/dashboard/project/thktcznsxieijkhxzitk → Settings → Team
- 新運営者のメールアドレスを招待

**新運営者がやること：**
- 承諾後、Settings → API でキーを確認
- Supabase Edge Functions のシークレットを自分のStripeキーに更新：
  ```bash
  # Supabaseアクセストークンを取得してから実行
  SUPABASE_ACCESS_TOKEN=<新トークン> npx supabase secrets set \
    STRIPE_SECRET_KEY=<新Stripeシークレットキー> \
    STRIPE_WEBHOOK_SECRET=<新WebhookSecret> \
    APP_URL=https://driverfund-app.vercel.app \
    --project-ref thktcznsxieijkhxzitk
  ```

---

### 4. Stripe（決済）
**現オーナーがやること：**
- https://dashboard.stripe.com → 「DriverFund サンドボックス」アカウント
- Settings → Team → 新運営者を招待（Administrator権限）

**新運営者がやること：**
- 承諾後、Developers → API Keys で新しいキーを発行
- Developers → Webhooks で既存エンドポイントのシークレットを確認 or 再作成
  - エンドポイントURL: `https://thktcznsxieijkhxzitk.supabase.co/functions/v1/stripe-webhook`
  - イベント: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`, `account.updated`
- 上記Supabaseのシークレット更新コマンドを実行

---

## 環境変数の全体マップ

| 変数名 | どこで取得 | どこに設定 |
|--------|----------|----------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | Vercel環境変数 |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | Vercel環境変数 |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API Keys | Vercel環境変数 |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API Keys | Supabase Secrets |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks | Supabase Secrets |

---

## 完了確認

以下が動けば引き継ぎ完了：
- [ ] https://driverfund-app.vercel.app にアクセスできる
- [ ] Googleログインが通る
- [ ] 支援アイテムの「応援する」ボタンでStripe決済画面に遷移する
- [ ] テスト決済が通る（カード番号: `4242 4242 4242 4242`）
