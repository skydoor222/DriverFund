# DriverFund 引き継ぎ手順

> **方針**: 前任者（戸田）は開発から離れます。
> 全サービスを**熊田さん所有**に切り替え、以後はAIを使って
> 自分たちで修正できる状態にします。
>
> **修正のやり方は [AI_MANUAL.md](./AI_MANUAL.md) を見てください。**

---

## 現在の状態（2026-08-21）

| サービス | 役割 | 状態 |
|---|---|---|
| GitHub | コード置き場 | ⏳ 移管待ち（現: `skydoor222`） |
| Vercel | サイト配信 | ⏳ 移管待ち（現: 戸田アカウント） |
| Supabase | DB・ログイン・画像 | ✅ 組織「DriverFund」へ移管済み／熊田さん招待済み |
| Stripe | 決済 | ✅ 熊田さん名義（戸田の権限削除のみ残） |

**アプリは正常稼働中** https://driverfund-app.vercel.app
（選手4名表示・新規登録も動作確認済み）

---

## 移管手順

### ① Supabase（ほぼ完了）

- [x] 専用組織「DriverFund」を作成し `driverfund` を移管
- [x] 熊田さん（`n-kumita@feelfree.work`）を **Owner** で招待
- [ ] **熊田さんが招待を承諾** ← 残
- [ ] 承諾後、戸田がOwnerを降りる

> 他のクライアント案件とは分離済みなので、熊田さんから他プロジェクトは見えません。

### ② GitHub

**熊田さん側の準備**
1. https://github.com でアカウント作成（無料）
2. アカウント名を戸田に伝える

**戸田側の作業**
3. https://github.com/skydoor222/DriverFund → Settings
4. 最下部 Danger Zone → **Transfer ownership**
5. 熊田さんのアカウント名を入力して実行

**熊田さん側**
6. 届いたメールから移管を承諾

> 組織(Organization)は作りません。個人アカウント直移管の方が簡単で、
> 権限管理も不要なためです。

### ③ Vercel

**熊田さん側の準備**
1. https://vercel.com で **GitHubアカウントを使って** サインアップ（無料）

**戸田側の作業**
2. https://vercel.com/skydoor222s-projects/driverfund-app → Settings
3. **Transfer Project** → 熊田さんのアカウントを指定

**熊田さん側**
4. 承諾後、Settings → Environment Variables に下記3つが
   入っているか確認（移管時に引き継がれるはずですが念のため）
   ```
   EXPO_PUBLIC_SUPABASE_URL
   EXPO_PUBLIC_SUPABASE_ANON_KEY
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY
   ```

> **以後、Vercelは基本的に触りません。**
> GitHubにコードが保存されると自動でビルド・公開されます。

### ④ Stripe

- [ ] 熊田さんが Settings → Team から**戸田(Administrator)を削除**
- [ ] 戸田が発行したAPIキーがあれば失効・再発行

---

## 完了チェック

- [ ] https://driverfund-app.vercel.app が表示される
- [ ] トップページに選手が表示される
- [ ] 新規アカウント登録ができる
- [ ] 熊田さんが GitHub のリポジトリを開ける
- [ ] 熊田さんが Supabase ダッシュボードを開ける
- [ ] Stripe から戸田が削除されている
- [ ] AI_MANUAL.md の手順でローカル起動できた

---

## 運用上の必須知識

### ⚠️ Supabaseは1週間放置で自動停止する

**無料プランの仕様です。** 停止するとアプリが全機能停止します
（登録・ログイン・決済すべて）。

- **復旧**: ダッシュボードで「Resume project」を押すだけ
- **データ**: 消えません。停止から**1年以内**なら完全復元できます
- **恒久対策**: 有料プラン（月25ドル程度）にすると停止しません

> 2026年6月〜8月、実際にこれで約2ヶ月サービスが停止していました。
> 運用が始まればアクセスが続くので止まりませんが、
> **収益が発生する段階では有料化を推奨します。**

### ⚠️ Vercelの無料プランは商用不可

Vercel の Hobby プランは**非商用の個人利用限定**です。
DriverFundは決済を扱うため、本格的な収益化時には
**Proプラン（月20ドル/人）が必要**になります。

### 💡 請求情報は事業主体のものを登録する

個人カードのままだと、その人が離れたとき支払いが止まり、
サービスが停止します。

---

## 既知の課題

| 項目 | 内容 |
|---|---|
| カテゴリ不足 | 要件定義は6分類(GT/フォーミュラ含む)だが実装は4分類 |
| キャッチコピー | トップに目的を示すコピーが未実装（FBK指摘事項） |
| 登録画面のビジュアル | メリット訴求が文字中心で単調（FBK指摘事項） |
| テストユーザー | `testdriver+1786699834@example.com` が残存。削除してよい |
| 依存パッケージ | Expo推奨版とズレあり。`npx expo install --check` で確認可 |

---

## ファイル一覧

| ファイル | 内容 |
|---|---|
| **[AI_MANUAL.md](./AI_MANUAL.md)** | **AIで修正する方法。まずこれを読む** |
| [CLAUDE.md](./CLAUDE.md) | AIが自動で読む規約（人は読まなくてよい） |
| [SETUP.md](./SETUP.md) | 開発環境の詳細セットアップ |
| [REQUIREMENTS.md](./REQUIREMENTS.md) | 要件定義書 |
| `supabase/migrations/` | DBスキーマ定義（番号順に適用） |
