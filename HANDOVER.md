# DriverFund 引き継ぎ手順（チーム移管版）

> **前提**: 前任者（外部開発者）は今後開発に関与しません。
> 個人アカウント依存をなくし、**チーム全員が編集できる状態**にするための手順です。
>
> ✅ **2026-08-14 更新**: Supabaseは「一時停止」であり削除ではありませんでした。
> 復旧済みで、選手データ・画像もすべて残っています。
> 専用組織「DriverFund」に移管し、熊田さんをOwnerとして招待済みです。
> **STEP 2 は対応不要**です（記録として残しています）。

---

## 現在の状態（2026-08-14 時点）

| 項目 | 状態 |
|---|---|
| フロントエンド（Vercel） | ✅ 稼働中 https://driverfund-app.vercel.app |
| GitHubリポジトリ | ✅ 存在 `skydoor222/DriverFund` |
| **Supabase（DB・認証）** | ✅ 復旧済み。組織「DriverFund」に移管し熊田さんを招待済み |
| Stripe | ✅ 熊田さん名義のアカウントあり（新Supabaseへの向け直しのみ必要） |
| 登録済みドライバー | ✅ 4人（データは全て復元済み） |

**アプリは正常に動作しています。** 選手4人が表示され、新規登録も
動作確認済みです。

---

## 移管の考え方：個人 → チーム

個人アカウントのままだと、その人が抜けた瞬間に同じ問題が再発します。
**4サービスすべてを「Organization / Team」で作り直す**のが今回の方針です。

| サービス | 個人所有（NG） | チーム所有（推奨） |
|---|---|---|
| GitHub | 個人アカウントのリポジトリ | **Organization** を作成しその配下に置く |
| Vercel | Hobby（個人） | **Team** を作成（Proは有料。Hobbyでも複数人可だが権限管理は弱い） |
| Supabase | 個人プロジェクト | **Organization** を作成しメンバー招待 |
| Stripe | — | ✅ 熊田さん名義で対応済み。メンバー招待のみ |

### 鉄則（今回の事故を繰り返さないために）

今回、Supabaseプロジェクトが自動停止してサービスが止まりました。原因は
**すべてのサービスが1人の個人アカウントにぶら下がっていた**ことです。
（幸いデータは失われませんでしたが、気づくのが1年遅れれば復元不能でした）
以下を必ず守ってください。

1. **各サービスのOwner/Adminは必ず2名以上。** 1名だとその人が
   離脱・退職・アカウント停止になった時点でプロジェクトが死にます。
2. **Supabaseの無料枠は1週間アクセスがないと自動停止する。**
   停止後は1年間だけ復元可能で、それを過ぎると復元できません。
   実運用が始まれば止まりませんが、収益が発生する段階では
   有料プラン（月25ドル程度）に上げること。自動バックアップも付きます。
3. **認証情報はチームの共有パスワード管理ツールに保管する。**
   （1Password / Bitwarden など。個人のメモやDMに置かない）
4. **メンバーが抜けるときは必ず全サービスから権限を削除する。**
   下記「オフボーディング手順」を使ってください。

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

## STEP 2: Supabase（✅ 対応済み — 以下は記録・再構築時の参考）

> **2026-08-14 実施済み**:
> - 専用組織「**DriverFund**」を作成し、`driverfund` プロジェクトを移管
>   （他のクライアント案件からは分離されています）
> - 熊田さん（`n-kumita@feelfree.work`）を **Owner** で招待済み
> - プロジェクトを Resume し、データ・画像とも復元を確認
> - 無料枠の「1ユーザー2プロジェクトまで」制限に当たったため、
>   `source-ai` を一時停止して枠を確保しています
>
> 以下の手順は、将来ゼロから作り直す場合の参考として残します。

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

> ✅ **Stripeはすでに熊田さん名義のアカウントが存在します。**
> 入金先として正しい状態なので、**アカウントを作り直す必要はありません。**
> やることは「新しいSupabaseに向け直す」ことだけです。

### 5-0. 現状と、やること
- アカウントオーナー: 熊田さん（事業主体名義）← 正しい
- 前任者は Administrator 権限を保有 → **移管完了後に削除してください**
  （Settings → Team → 該当メンバー → Remove）
- 開発を担当するメンバーを **Administrator** として招待する
- **本番決済を始める前に**、本人確認・銀行口座登録が完了しているか確認
  （未完了だと `live` キーでの決済ができません）

1. https://dashboard.stripe.com に熊田さんアカウントでログイン
2. Settings → Team → 開発メンバーを **Administrator** として招待
3. 開発者 → APIキー
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
- [x] 新規アカウント登録ができる（2026-08-14 動作確認済み）
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

復旧により選手4人（松井啓人・中村蒼・田中陽菜・佐藤颯太）が
表示されています。さらに増やす場合は以下を参考にしてください。

1. **選手を追加登録する**
   - `supabase/seed_keito_matsui.sql` に松井啓人選手のシードデータがあります。
     Authentication → Users で該当メールのユーザーを作成してから
     SQL Editor で実行すると1人目が入ります。
     ※ **実在選手のデータなので、掲載前に必ず本人の許可を取ること。**
   - 残りはアプリの選手登録フローから手入力するのが確実です。
2. 各選手に写真（カバー・アバター）と応援プランを設定する
3. 「今季の活動資金目標」を入力する（達成率バーが出て一気に
   クラファンらしい見た目になります）
4. その状態でデザインを再評価する

> 指摘されていた「ビジュアル要素が少ない」は、DB停止で選手が
> 表示されていなかったことが主因でした。現在は解消しています。

---

## 管理台帳（移管時に埋めて、以後メンテナンスすること）

各サービスの権限保有者を必ずここに記録してください。
**「誰が何を持っているか分からない」状態が今回の事故の温床でした。**

| サービス | Owner（2名以上） | その他メンバー | 請求先 |
|---|---|---|---|
| GitHub Organization | （記入） | （記入） | 無料 |
| Vercel Team | （記入） | （記入） | （記入） |
| Supabase Organization「DriverFund」 | 戸田 / 熊田さん（招待済） | — | 無料枠 |
| Stripe | 熊田さん | （記入） | 熊田さん |
| ドメイン（取得する場合） | （記入） | — | （記入） |

**共有パスワード管理ツール**: （ツール名とVault名を記入）

---

## オフボーディング手順（メンバーが抜けるとき）

抜ける人が最後の1人にならないよう、**先に後任をOwnerに追加してから**実施。

- [ ] GitHub Organization → People → 該当者を Remove
- [ ] Vercel → Team Settings → Members → 該当者を Remove
- [ ] Supabase → Organization → Team → 該当者を Remove
- [ ] Stripe → Settings → Team → 該当者を Remove
- [ ] 共有パスワード管理ツールから該当者のアクセスを削除
- [ ] 該当者が発行したAPIキー（Stripe secret key 等）を**すべて失効・再発行**
- [ ] 上記「管理台帳」を更新

> ⚠️ 特に **Stripeのシークレットキー失効** を忘れないこと。
> 抜けた人の手元に有効なキーが残ると、決済操作が可能なままになります。

### 前任者（今回の移管対象）の削除

移管完了・動作確認が終わったら、以下から前任者のアクセスを削除してください。

- [ ] GitHub `skydoor222`
- [ ] Vercel `skydoor222's projects`（プロジェクト移管後、旧チームから削除）
- [ ] Stripe（Administrator権限を保有中）
- [ ] 旧Supabase → プロジェクトごと消滅済みのため対応不要

---

## 既知の課題・改善余地

| 項目 | 内容 |
|---|---|
| カテゴリ不足 | 要件定義では GT / フォーミュラ を含む6分類だが、現在4分類のみ実装 |
| トップのキャッチコピー | 「目的が一目で分かるコピー」が未実装（FBK指摘事項） |
| 登録画面のビジュアル | メリット訴求が文字中心で単調（FBK指摘事項） |
| Edge Functions の型エラー | Deno製のため `tsc` ではエラーが出るが実害なし（無視してよい） |
| 依存パッケージ | Expo推奨版とズレあり。`npx expo install --check` で確認可能 |
