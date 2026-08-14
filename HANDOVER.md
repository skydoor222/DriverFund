# DriverFund 引き継ぎ手順（チーム移管版）

> **前提**: 前任者（外部開発者）は今後開発に関与しません。
> 個人アカウント依存をなくし、**チーム全員が編集できる状態**にするための手順です。
>
> ⚠️ **重要**: 旧Supabaseプロジェクトは削除済みです。DBの再構築が必須で、
> これを完了しないとアプリは一切動きません。**STEP 2 が最優先**です。

---

## 現在の状態（2026-08-14 時点）

| 項目 | 状態 |
|---|---|
| フロントエンド（Vercel） | ✅ 稼働中 https://driverfund-app.vercel.app |
| GitHubリポジトリ | ✅ 存在 `skydoor222/DriverFund` |
| **Supabase（DB・認証）** | ❌ **プロジェクト削除済み。DNSごと消滅** |
| Stripe | ⚠️ サンドボックス。本番未設定 |
| 登録済みドライバー | ❌ 0人（DB消滅により全データ喪失） |

**つまり今のアプリは「画面は出るが、何も動かない」状態です。**
ログインも登録も決済も、すべてDB復旧後に動き始めます。

---

## 移管の考え方：個人 → チーム

個人アカウントのままだと、その人が抜けた瞬間に同じ問題が再発します。
**4サービスすべてを「Organization / Team」で作り直す**のが今回の方針です。

| サービス | 個人所有（NG） | チーム所有（推奨） |
|---|---|---|
| GitHub | 個人アカウントのリポジトリ | **Organization** を作成しその配下に置く |
| Vercel | Hobby（個人） | **Team** を作成（Proは有料。Hobbyでも複数人可だが権限管理は弱い） |
| Supabase | 個人プロジェクト | **Organization** を作成しメンバー招待 |
| Stripe | 個人アカウント | **法人アカウント**＋チームメンバー招待 |

---

## STEP 1: GitHub Organization を作る（最初にやる）

1. https://github.com/organizations/plan → **Free** プランで Organization 作成
   - 例: `driverfund` / `driverfund-jp`
2. チームメンバー全員を **Member** として招待
   - 開発を主導する人は **Owner** にする（最低2名を Owner にしておくこと。
     1人だとその人が抜けたとき再び詰みます）
3. リポジトリを Organization へ移管
   - 現リポジトリ https://github.com/skydoor222/DriverFund
   - Settings → 最下部 Danger Zone → **Transfer ownership** → 作成した Organization を指定
4. 移管後、Settings → Collaborators and teams で全員に **Write** 権限を付与

> これで「全員が編集できる」状態になります。以降のVercel連携もOrg配下になります。

---

## STEP 2: Supabase を作り直す（最優先・これが無いと動かない）

### 2-1. Organization とプロジェクトを作成
1. https://supabase.com/dashboard → 新規 **Organization** を作成
2. その配下に新規プロジェクト作成
   - Name: `driverfund`
   - Region: **Northeast Asia (Tokyo)**
   - Database Password は**必ずチームの共有パスワード管理ツールに保管**
3. Organization → Team → チームメンバーを **Owner / Administrator** として招待（複数名）

### 2-2. スキーマを流し込む
SQL Editor を開き、**以下の順番どおりに**リポジトリ内のSQLを貼り付けて実行します。

```
1. supabase/migrations/0001_base_schema.sql        ← ベーステーブル（新規復元）
2. supabase/migrations/0002_feed_and_ranking.sql   ← フィード・ランキング
3. supabase/migrations/20260603_stripe_payment_link.sql
4. supabase/migrations/20260609_stripe_connect.sql
```

> ⚠️ 順番厳守。0002 以降は「既存テーブルに列を追加する」形式のため、
> 0001 を先に流さないとエラーになります。

### 2-3. Storage バケットを作る
Storage → New bucket で以下2つを作成し、**どちらも Public** にする：
- `avatars`
- `covers`

### 2-4. 認証設定
- Authentication → Providers → **Email** を有効化
- Google ログインを使う場合は **Google** を有効化し、
  Authorized redirect URI に `https://<プロジェクトRef>.supabase.co/auth/v1/callback` を設定
- Authentication → URL Configuration →
  Site URL に `https://driverfund-app.vercel.app` を設定

### 2-5. APIキーを控える
Project Settings → API から取得（STEP 4 で使う）：
- `Project URL`
- `anon public` key

---

## STEP 3: Vercel をチームに移す

1. https://vercel.com/teams/create → Team を作成（メンバーを招待）
2. 既存プロジェクト `driverfund-app` を Team へ移管
   - Project Settings → **Transfer Project** → 作成したTeamを指定
   - ※ URL `driverfund-app.vercel.app` は移管後も維持されます
3. Team Settings → Members で全員を **Member** 以上に設定
4. STEP 1 で移管した GitHub Organization のリポジトリと再連携
   （Settings → Git → Connect Git Repository）

---

## STEP 4: 環境変数を設定して再デプロイ

Vercel → Project → Settings → Environment Variables に以下を設定
（Production / Preview / Development すべてにチェック）：

| 変数名 | 値の取得元 |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | STEP 2-5 の Project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | STEP 2-5 の anon public key |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | STEP 5 の `pk_...` |

設定後、Deployments → 最新のデプロイ → **Redeploy** を実行。

> 環境変数はビルド時に埋め込まれるため、**変更したら必ず再デプロイが必要**です。
> 「キーを変えたのに反映されない」の原因はほぼこれです。

---

## STEP 5: Stripe（決済）

> 💰 **お金が入金される先なので、必ず事業主体（法人または代表者）が
> オーナーになってください。** 開発者の個人アカウントに紐づけてはいけません。

1. https://dashboard.stripe.com でアカウント作成（事業主体名義）
2. 本人確認・銀行口座登録を完了（これが済まないと本番決済は不可）
3. Settings → Team → 開発メンバーを **Administrator** として招待
4. 開発者 → APIキー
   - `pk_...`（公開可能キー）→ Vercel の `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` へ
   - `sk_...`（シークレットキー）→ 下記 Supabase Secrets へ
5. 開発者 → Webhook → エンドポイントを追加
   - URL: `https://<新プロジェクトRef>.supabase.co/functions/v1/stripe-webhook`
   - イベント: `checkout.session.completed` / `invoice.payment_succeeded`
     / `customer.subscription.deleted` / `account.updated`
   - 作成後の署名シークレット `whsec_...` を控える

### Supabase Edge Functions のデプロイとシークレット設定

```bash
# リポジトリのルートで実行
npx supabase login
npx supabase link --project-ref <新プロジェクトRef>

# Edge Functions をデプロイ
npx supabase functions deploy stripe-webhook --no-verify-jwt
npx supabase functions deploy create-payment-link
npx supabase functions deploy create-connect-account

# シークレットを設定
npx supabase secrets set \
  STRIPE_SECRET_KEY=sk_xxxxx \
  STRIPE_WEBHOOK_SECRET=whsec_xxxxx \
  APP_URL=https://driverfund-app.vercel.app
```

> テスト段階は `pk_test_` / `sk_test_` でOK。本番公開時に live キーへ切り替え、
> そのタイミングで Webhook も本番用に作り直してください。

---

## STEP 6: ローカル開発環境（各メンバー）

```bash
git clone https://github.com/<Organization>/DriverFund.git
cd DriverFund
npm install
cp .env.example .env    # .env に STEP 2-5 のキーを記入
npx expo start --web
```

ブラウザで http://localhost:8081 が開きます。

---

## STEP 7: 動作確認チェックリスト

すべて ✅ になれば移管完了です。

- [ ] https://driverfund-app.vercel.app が表示される
- [ ] 新規アカウント登録ができる（**現在ここが失敗する ← STEP 2 未完了が原因**）
- [ ] ログイン・ログアウトができる
- [ ] ドライバー登録フローが最後まで進む
- [ ] ドライバープロフィールを公開 → トップページに表示される
- [ ] 応援プランを作成できる
- [ ] 「応援する」→ Stripe決済画面に遷移する
- [ ] テストカード `4242 4242 4242 4242` で決済が通る
- [ ] Stripeダッシュボードに売上が表示される
- [ ] チームメンバー全員が GitHub に push できる

---

## 引き継ぎ後、最初にやるべきこと

DBが空なので、**トップページに選手が0人**です。この状態では
「サービスとして成立していない」ように見えてしまいます。

1. **ダミーでもいいので選手を3〜5人登録する**
   （実在の選手なら必ず本人の許可を取ること）
2. 各選手に写真（カバー・アバター）と応援プランを設定する
3. その状態でデザインを再評価する

> 現在指摘されている「余白が目立つ」「ビジュアル要素が少ない」の
> **相当部分はデータが0件であること**が原因です。中身を入れてから
> デザイン判断をすることを強く推奨します。

---

## 既知の課題・改善余地

| 項目 | 内容 |
|---|---|
| カテゴリ不足 | 要件定義では GT / フォーミュラ を含む6分類だが、現在4分類のみ実装 |
| トップのキャッチコピー | 「目的が一目で分かるコピー」が未実装（FBK指摘事項） |
| 登録画面のビジュアル | メリット訴求が文字中心で単調（FBK指摘事項） |
| Edge Functions の型エラー | Deno製のため `tsc` ではエラーが出るが実害なし（無視してよい） |
| 依存パッケージ | Expo推奨版とズレあり。`npx expo install --check` で確認可能 |
