# DriverFund — AI向けプロジェクト規約

> **AIへ**: このファイルはプロジェクトの規約です。作業前に必ず読んでください。
> Claude Codeは自動で読みます。Codex等で作業する場合は、
> 最初に「CLAUDE.md を読んでから作業して」と指示されることを想定しています。

レーシングドライバー向けの月額応援（サブスク型クラファン）Webアプリ。

**運営は非エンジニアです。** GitHub上のPull Request経由で変更を確認し、
Mergeボタンを押して本番反映します。したがって:

- **PRの説明は日本語で、専門用語を避けて書くこと**
- 何をどう変えたか、利用者から見て何が変わるかを明記すること
- 壊れる可能性がある変更は、その旨をPR説明の冒頭に書くこと

## 技術構成

- **Expo Router + React Native Web** → `expo export -p web` でWeb書き出し
- **Supabase** — DB(PostgreSQL/RLS) / 認証 / 画像ストレージ / Edge Functions
- **Stripe** — Payment Links + Connect。Edge Functions経由で決済
- **Vercel** — GitHubのpushをトリガーに自動ビルド・自動デプロイ

## 絶対に守るルール

### デザイン
- **色・余白・文字サイズは `lib/theme.ts` のトークンを必ず使う。ハードコード禁止。**
  - ✅ `colors.brand` / `spacing.lg` / `typography.headline`
  - ❌ `"#E8002D"` / `padding: 16` / `fontSize: 17`
- 新しい色が必要なら、まず `lib/theme.ts` にトークンを追加してから使う
- `constants/colors.ts` はレガシー。新規コードでは使わない

### ビルド成果物
- **`dist/` は絶対にコミットしない。** `.gitignore` 済み
  - 過去に `dist/` をコミットしていたため、Vercelが古いビルドを配信し続け、
    ソースを修正しても2ヶ月間本番に反映されない事故が発生した
- Vercelは `vercel.json` の `buildCommand` で毎回ソースからビルドする

### 秘密情報
- `.env` および APIキーを**コード内に書かない・ログに出さない**
- `service_role` キーはクライアント側で絶対に使わない（`anon` キーのみ）

### データベース
- スキーマ変更は `supabase/migrations/` にSQLファイルを追加する形で行う
  - 番号順に適用される。`0001_base_schema.sql` がベーステーブル
  - 既存マイグレーションを書き換えない（追記型）
- RLS(Row Level Security)が全テーブルで有効。ポリシーを壊さないこと

### Edge Functions
- `supabase/functions/` 配下は **Deno製**
- ルートの `tsc --noEmit` では必ずエラーが出るが**正常**。無視してよい
- 型チェック時は `grep -v "^supabase/functions"` で除外して確認する

## カテゴリを追加・変更する場合

`RacingCategory` は複数箇所に散っている。**必ず全部を更新すること:**

1. `lib/types.ts` — `RacingCategory` 型
2. `lib/theme.ts` — `categoryLabel` / `categoryShort` / `categoryColor` / `catXxx` 色
3. `components/ui/CategoryScroller.tsx` — `RACING_CATEGORIES`
4. `app/(driver-onboard)/setup.tsx` — `CATEGORIES` 選択肢
5. `supabase/migrations/` — `drivers.category` の CHECK 制約を変更する新規マイグレーション

> 要件定義(`REQUIREMENTS.md`)では GT / フォーミュラ を含む6分類だが、
> 現在は kart / f4 / sf / other の4分類のみ実装されている。

## 動作確認

```bash
npm install
npx expo start --web     # http://localhost:8081
```

型チェック（Edge Functions のエラーは除外）:
```bash
./node_modules/.bin/tsc --noEmit 2>&1 | grep -v "^supabase/functions"
```

## 非エンジニア運営者への配慮

- 変更内容は**専門用語を避けて日本語で説明する**
- 破壊的な操作（DB削除、プロジェクト削除、強制push）は**必ず事前に確認を取る**
- エラーは握りつぶさず、ユーザーに見える形で表示する
  - 過去に通信エラーを catch しておらず、ボタンが固まったまま
    何も表示されない不具合があった
- **`main` ブランチへ直接pushしない。** 必ずPull Requestを作ること
  - PRは `.github/workflows/auto-merge.yml` により**自動でマージされる**
  - 型チェックとビルドが通った場合のみマージされる（壊れていれば止まる）
  - つまり**PRを作った時点で本番反映が確定する**。中途半端な状態で
    PRを作らないこと

## 変更後に必ず確認すること

型チェックを通してからPRを出すこと:

```bash
./node_modules/.bin/tsc --noEmit 2>&1 | grep -v "^supabase/functions"
```

出力が空なら正常。`supabase/functions/` のエラーはDeno製のため
除外して判定する（→ 上記「Edge Functions」参照）。
