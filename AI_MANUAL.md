# DriverFund 修正マニュアル（AIに任せる版）

> **このファイルをまるごとAIに読ませてください。**
> Claude Code / Codex / Cursor など、どれでも使えます。
>
> プログラミングの知識は要りません。
> やることは「AIに日本語でお願いする」だけです。

---

## 0. 3行でわかる仕組み

```
あなた「〇〇を直して」 → AI がコードを直す → GitHubに保存
                                              ↓
                              1〜2分後、自動でサイトに反映される
```

**Vercel（サイトを配信している場所）は触りません。** 自動です。

---

## 1. 最初の1回だけやる準備

### 1-1. 必要なもの

| もの | 用途 | 取得先 |
|---|---|---|
| GitHubアカウント | コードの保管庫 | https://github.com |
| Claude Code か Codex | 修正してくれるAI | 下記参照 |

**Claude Code の入れ方（推奨）**
1. https://claude.ai/code にアクセス
2. 案内に従ってインストール
3. ターミナル（Macなら「ターミナル」アプリ）で `claude` と打つと起動

### 1-2. コードを手元に持ってくる

ターミナルで下記を1行ずつコピペして実行してください。

```bash
cd ~/Desktop
git clone https://github.com/<あなたのGitHubアカウント名>/DriverFund.git
cd DriverFund
npm install
```

最後の `npm install` は3〜5分かかります。待ってください。

### 1-3. 秘密の鍵を置く

`.env` というファイルを作ります。ターミナルで:

```bash
cp .env.example .env
```

作られた `.env` をテキストエディタで開き、下記を埋めます。
値は **Supabaseダッシュボード** から取ってきます（→ 3章）。

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

> ⚠️ `.env` は**絶対に人に見せない・GitHubに上げない**でください。
> （設定済みなので勝手に上がることはありません）

### 1-4. 手元で動かしてみる

```bash
npx expo start --web
```

ブラウザで http://localhost:8081 が開けば成功です。
止めるときはターミナルで `Ctrl + C`。

---

## 2. AIへの頼み方（ここが本番）

`DriverFund` フォルダの中でAIを起動して、**日本語で頼むだけ**です。

```bash
cd ~/Desktop/DriverFund
claude
```

### そのまま使えるプロンプト集

**■ 文言を変えたい**
```
トップページの「あなたへのおすすめ」という見出しを
「注目のドライバー」に変えてください。
```

**■ 色を変えたい**
```
アプリのメインカラーを今の赤から濃い青に変えたいです。
lib/theme.ts のトークンを変更してください。
色はハードコードせず、必ずトークン経由でお願いします。
```

**■ カテゴリを追加したい**
```
レースカテゴリに「GT」と「フォーミュラ」を追加してください。
components/ui/CategoryScroller.tsx と lib/theme.ts の
categoryLabel / categoryColor / RacingCategory 型、
それと app/(driver-onboard)/setup.tsx の選択肢、
supabase の drivers テーブルの category 制約も
更新が必要なはずなので、必要な箇所を全部洗い出してから直してください。
```

**■ 画面の見た目を変えたい**
```
ドライバー登録画面（app/(driver-onboard)/welcome.tsx）の
メリット紹介部分が文字ばかりで単調です。
もっと視覚的に魅力が伝わるデザインにしてください。
lib/theme.ts のデザイントークンを使ってください。
```

**■ 動かない・エラーが出た**
```
アプリで〇〇をしたら△△というエラーが出ました。
原因を調べて直してください。
推測で直さず、実際にコードを読んで確認してから直してください。
```

**■ 変更を公開したい**
```
今の変更をGitHubに反映して、本番サイトに公開してください。
```
→ これでAIが `git commit` と `git push` をやってくれます。
1〜2分後に https://driverfund-app.vercel.app に反映されます。

---

## 3. AIに渡すURL・情報一覧

AIが「〇〇の情報が必要」と言ったときは、ここから渡してください。

| 何 | URL | 用途 |
|---|---|---|
| **コード置き場** | https://github.com/（移管後のアカウント）/DriverFund | AIが直す対象 |
| **公開サイト** | https://driverfund-app.vercel.app | 反映結果の確認 |
| **データベース** | https://supabase.com/dashboard | 選手データ・ログイン管理 |
| **配信サーバー** | https://vercel.com/dashboard | 基本触らない |
| **決済** | https://dashboard.stripe.com | 入金確認 |

### Supabaseから鍵を取る手順（`.env` 用）

1. https://supabase.com/dashboard にログイン
2. 組織「DriverFund」→ プロジェクト `driverfund` を開く
3. 左メニュー下部の **Settings（歯車）→ API**
4. 下記2つをコピー
   - `Project URL` → `.env` の `EXPO_PUBLIC_SUPABASE_URL` へ
   - `anon` `public` キー → `.env` の `EXPO_PUBLIC_SUPABASE_ANON_KEY` へ

---

## 4. やってはいけないこと

| ❌ | なぜ |
|---|---|
| `.env` の中身を人に見せる／SNSに貼る | 誰でもDBを触れるようになります |
| `service_role` キーを使う・アプリに書く | 全権限の鍵です。漏れると終わりです |
| Supabaseのテーブルを画面から直接削除 | アプリが動かなくなります。AIに相談してください |
| `dist` フォルダをGitHubに上げる | 過去にこれで修正が2ヶ月反映されない事故が起きました |
| Supabaseプロジェクトを1週間以上放置 | 無料枠は自動停止します（→ 5章） |

---

## 5. 知っておくべき「詰まりポイント」

### ■ Supabaseの自動停止
**無料プランは1週間アクセスがないと自動停止します。**
停止するとアプリが全部動かなくなります（登録・ログイン・決済すべて）。

- 復旧: ダッシュボードで「Resume project」を押すだけ
- データは消えません（停止から**1年以内**なら復元可能）
- 恒久対策: 有料プラン（月25ドル程度）にすると停止しません

> 2026年8月、実際にこれで2ヶ月間サービスが停止していました。

### ■ Vercelの規約
Vercelの無料プラン（Hobby）は**非商用の個人利用限定**です。
DriverFundは決済を扱うため、**本格的に収益化する際は
Proプラン（月20ドル/人）への変更が必要**です。

### ■ 環境変数を変えたら再デプロイ
Vercelの環境変数を変更しても、**再デプロイしないと反映されません。**
「キーを変えたのに直らない」の原因はほぼこれです。

---

## 6. 困ったときのプロンプト

```
このリポジトリの AI_MANUAL.md と HANDOVER.md を読んでください。
そのうえで、〇〇について教えてください。
```

```
今アプリが動きません。何が原因か調査してください。
Supabaseが停止している可能性もあるので、
まず接続確認から始めてください。
```

---

## 7. 技術的な詳細（AI向け・人は読まなくていい）

- **フレームワーク**: Expo Router (React Native Web) → Web書き出し
- **DB/認証/ストレージ**: Supabase (PostgreSQL + RLS)
- **決済**: Stripe (Payment Links + Connect) / Supabase Edge Functions 経由
- **ホスティング**: Vercel（`expo export -p web` でビルド → `dist/` を配信）
- **デザイン**: `lib/theme.ts` のトークンを唯一の情報源とする。色のハードコード禁止
- **DBスキーマ**: `supabase/migrations/` に番号順。`0001` がベーステーブル
- **注意**: `supabase/functions/` は Deno 製のため `tsc` でエラーが出るが正常
