# DriverFund MVP セットアップガイド

## 前提条件
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Supabaseアカウント
- Stripeアカウント（決済を本番化する際）

---

## 1. Supabase セットアップ

1. [supabase.com](https://supabase.com) でプロジェクトを作成
2. SQL Editorを開き、`supabase/migrations/` 配下のSQLを**以下の順番で**実行
   ```
   1. 0001_base_schema.sql               ← ベーステーブル
   2. 0002_feed_and_ranking.sql
   3. 20260603_stripe_payment_link.sql
   4. 20260609_stripe_connect.sql
   ```
   > 0002 以降は既存テーブルへの列追加のため、順番を守ること。
3. Storage で以下のバケットを作成（Public）
   - `avatars`
   - `covers`
4. Project Settings → API から以下をコピー
   - `Project URL`
   - `anon public key`

---

## 2. 環境変数の設定

```bash
cp .env.example .env
```

`.env` に以下を入力:
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 3. 依存関係インストール

```bash
npm install
```

---

## 4. 起動

```bash
npx expo start
```

iPhoneでQRコードをスキャン（Expo Goアプリが必要）

---

## 5. Stripe Connect（決済を本番化する際）

MVP段階では決済なしでSponsorshipレコードのみ作成しています。
本番化する際は以下を実装:

1. Stripe Connectアカウント作成
2. ドライバー向けConnected Accountオンボーディング
3. Supabase Edge Function で Payment Intent / Subscription を作成
4. Webhook で sponsorships テーブルのstatusを更新

```
応援者 → Stripe Payment Intent → DriverFund Platform Account
                                   ├── 手数料 (15%) → DriverFund
                                   └── 残り (85%) → ドライバーConnected Account
```

---

## 画面構成

```
app/
├── (auth)/
│   ├── welcome.tsx      # ウェルカム画面
│   ├── login.tsx        # ログイン
│   └── signup.tsx       # 新規登録
├── (driver)/
│   ├── dashboard.tsx    # ドライバーダッシュボード
│   ├── returns.tsx      # お返し管理
│   └── setup.tsx        # プロフィール設定
├── (supporter)/
│   ├── discover.tsx     # ドライバー一覧
│   └── my-supports.tsx  # 応援中一覧
└── driver/
    └── [id].tsx         # 公開プロフィールページ（購入フロー含む）
```

---

## 人力オペレーション（MVP期）

ドライバーが5〜10人の段階では以下を手動で行う:

| 作業 | 方法 |
|---|---|
| ドライバー登録ヒアリング | Googleフォーム + 電話フォローアップ |
| プロフィール入力代行 | アプリのsetup画面でスタッフが入力 |
| 決済後の送金 | Stripeダッシュボードから手動振込 |
| 応援者への連絡 | Stripeのメール通知 + メール手送り |
