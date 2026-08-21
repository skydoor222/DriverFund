# DriverFund の直し方

## やること

**Codex に日本語で言うだけです。**

```
トップページの見出しを「注目のドライバー」に変えて
```

```
メインカラーを赤から青にして
```

```
カテゴリに「GT」と「フォーミュラ」を追加して
```

これで直ります。

---

## 反映のしかた

Codexが直し終わると「Create PR」というボタンが出ます。

1. **Create PR** を押す
2. GitHubの画面に移動する
3. 少し下に **プレビューURL** があるので、押して確認する
   （本番とは別のテストサイトです。ここで壊れてても本番は無事）
4. よければ **Merge pull request** を押す
5. **1〜2分で本番サイトに反映されます**

https://driverfund-app.vercel.app

---

## 失敗しても大丈夫

- 変更案が気に入らない → **Close** で捨てる。本番は無傷
- Merge後に問題発覚 → **Revert** ボタンで元に戻る

**取り返しがつかないことはほぼ起きません。気軽にどうぞ。**

---

## 困ったら

Codexにそのまま聞いてください。

```
AI_MANUAL.md を読んで、〇〇について教えて
```

```
アプリが動きません。原因を調べて
```

---

## アプリが急に動かなくなったら

**9割これです。** Supabase（データ保管庫）の自動停止。

1. https://supabase.com/dashboard を開く
2. `driverfund` を開く
3. **Resume project** を押す

データは消えません。数分で復活します。

---

<br>

# はじめての人へ（最初の1回だけ）

ここから下は**セットアップが終わったら読まなくていい**です。

## 1. GitHubアカウントを作る

https://github.com → Sign up（無料）

作ったら**アカウント名を戸田に伝えてください。** アプリを移管します。

## 2. ChatGPTのプランを確認

Codexを使うには **ChatGPT Plus（月20ドル）** があると安心です。
無料でも動きますが、途中で上限が来ることがあります。

## 3. CodexとGitHubを繋ぐ

1. https://chatgpt.com/codex を開く
2. **Connect to GitHub** を押す
3. GitHubの画面で **Authorize** を押す
4. リポジトリを聞かれたら **DriverFund** を選ぶ

## 4. 環境を作る

1. https://chatgpt.com/codex/settings/environments を開く
2. **Create environment** を押す
3. Repository で **DriverFund** を選ぶ
4. あとはそのまま **Create**

**完了です。** 以降はこのページの一番上に戻って、命令するだけです。

---

> うまくいかないときは、Codexに
> 「DriverFundリポジトリが選択できません」と聞けば案内してくれます。

> もっと詳しい情報は [AI_MANUAL.md](./AI_MANUAL.md) にあります。
