# Google Form → DriverFund 自動連携 セットアップ手順

## 概要

Google Formに入力 → Google Sheets → Apps Script → Supabase API → プロフィール自動更新

## セットアップ（5分）

### 1. Apps Scriptプロジェクトを作成

1. https://script.google.com を開く
2. 「新しいプロジェクト」をクリック
3. プロジェクト名を「DriverFund Form」に変更

### 2. スクリプトを貼り付ける

**ファイル1（Code.gs）** に `create-form.gs` の内容を貼り付け

**ファイル2（Webhook.gs）** を追加（+ボタン→スクリプト）して `webhook.gs` の内容を貼り付け

### 3. フォームを作成

1. `createDriverForm()` を選択して実行
2. Googleアカウントのアクセスを許可
3. 実行ログに表示される以下をメモ：
   - **フォームURL**（ドライバーに共有するURL）
   - **スプレッドシートID**

### 4. Webhookを設定

1. `webhook.gs` の `SPREADSHEET_ID` に上記IDを設定
2. `setupWebhook()` を実行
3. 「スプレッドシートへのアクセスを許可」→「メール送信を許可」

### 5. 動作テスト

1. `testOnFormSubmit()` を実行
2. Supabaseダッシュボードでデータが入ったか確認

---

## フォームの流れ

```
ページ1: 本人確認（メールアドレス）
ページ2: 基本プロフィール（名前・カテゴリ・チーム等）
ページ3: ストーリー（壁・きっかけ・現状）
ページ4: 支援の使い道（予算・使途）
ページ5: 実績・目標
ページ6: SNS
ページ7: 支援アイテム設定（最大5件）
ページ8: 公開設定
```

## 移管時の対応

新しい運営者に引き継ぐ場合、`webhook.gs` の以下を変更するだけ：

```javascript
var SUPABASE_SERVICE_ROLE_KEY = '新しいキー';
```
