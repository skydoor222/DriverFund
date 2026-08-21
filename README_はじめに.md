# DriverFund の直し方

## 使うページ

**https://chatgpt.com/codex**

ここを開いて、日本語で言うだけです。

---

## 例

```
トップページの見出しを「注目のドライバー」に変えて
```

```
メインカラーを赤から青にして
```

```
カテゴリに「GT」と「フォーミュラ」を追加して
```

```
ドライバー登録画面の見た目をもっと魅力的にして
```

---

## そのあと

Codexが直し終わると **「Create PR」** というボタンが出ます。
**それを押すだけです。**

あとは全自動で本番サイトに反映されます（3〜5分）。

**確認 → https://driverfund-app.vercel.app**

> 壊れているコードは自動的にはじかれるので、
> サイトが真っ白になるような事故は起きません。

---

## 元に戻したいとき

**https://github.com/（あなたのアカウント）/DriverFund/pulls**

→ `Closed` タブ → 戻したいものを開く → **Revert** → **Create PR**

3〜5分で元に戻ります。

---

## アプリが急に動かなくなったら

**9割これです。**（無料プランは1週間放置で止まる仕様）

**https://supabase.com/dashboard**

→ `driverfund` を開く → **Resume project** を押す

データは消えません。数分で復活します。

---

## 困ったら

Codexにそのまま聞いてください。

```
アプリが動きません。原因を調べて
```

```
AI_MANUAL.md を読んで、〇〇について教えて
```

---
---

# 最初の1回だけの設定

**終わったら二度と読まなくていいです。**

## ① GitHubアカウントを作る

**https://github.com/signup**

作ったらアカウント名を戸田に伝える → アプリを移管します

## ② Codexと繋ぐ

**https://chatgpt.com/codex**

→ **Connect to GitHub** → **Authorize** → **DriverFund** を選ぶ

## ③ 環境を作る

**https://chatgpt.com/codex/settings/environments**

→ **Create environment** → Repository に **DriverFund** → **Create**

---

**完了です。** 一番上に戻って、命令するだけ。

> ChatGPTの有料プラン（Plus・月20ドル）があると安心です。
> 無料でも動きますが、途中で上限が来ることがあります。

> うまくいかないときは、Codexに
> 「DriverFundが選択できません」と聞けば案内してくれます。

