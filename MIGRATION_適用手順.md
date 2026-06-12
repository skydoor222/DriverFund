# マイグレーション適用手順（要・あなたの操作）

新機能（ランキング・達成率・新着フィード・お気に入り）を有効にするには、
DBに新テーブル・新カラムを追加する必要があります。

> **現状でも既存の選手は表示されます**（達成率は0%表示）。
> 下記を適用すると、達成率・お気に入り・投稿フィードがフルに動きます。

## 方法A: Supabase SQL Editor（最も簡単・推奨）

1. https://supabase.com/dashboard/project/thktcznsxieijkhxzitk/sql/new を開く
2. `supabase/migrations/0002_feed_and_ranking.sql` の中身を全部コピペ
3. 「Run」を押す

これだけで完了。エラーが出ても `if not exists` 付きなので再実行可能。

## 方法B: CLI（トークンがある場合）

```bash
cd "/Users/sorato/Downloads/tib開発/DriverFund"
SUPABASE_ACCESS_TOKEN=<あなたのトークン> \
  npx supabase db push
```

## 達成率を表示するには

選手の編集画面（マイ → 選手ダッシュボード → プロフィール）で
「今季の活動資金目標」セクションに金額を入力 → 公開。
- 年間目標（万円）: 例 500
- 調達済み（万円）: 例 215
→ 達成率43%バーが各画面に表示されます。
