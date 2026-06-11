/**
 * DriverFund ドライバー情報入力フォーム作成スクリプト
 *
 * 使い方:
 * 1. https://script.google.com を開く
 * 2. 「新しいプロジェクト」を作成
 * 3. このコードを貼り付けて保存
 * 4. createDriverForm() を実行 → フォームURLが出力される
 * 5. 出力されたスプレッドシートIDをwebhook.gsの SPREADSHEET_ID に設定
 * 6. setupWebhook() を実行
 */

// ===== フォーム作成 =====
function createDriverForm() {
  var form = FormApp.create('DriverFund ドライバー情報登録フォーム');
  form.setDescription(
    'このフォームに入力すると、DriverFundのプロフィールページが自動的に更新されます。\n' +
    '登録済みのメールアドレス（Googleログインに使用したもの）を正確に入力してください。'
  );
  form.setCollectEmail(false);
  form.setProgressBar(true);

  // ── セクション1: 本人確認 ──
  form.addSectionHeaderItem()
    .setTitle('📋 本人確認')
    .setHelpText('DriverFundに登録済みのアカウント情報を入力してください');

  form.addTextItem()
    .setTitle('登録メールアドレス ※必須')
    .setHelpText('Googleログインに使用したメールアドレスを正確に入力してください')
    .setRequired(true);

  // ── セクション2: 基本プロフィール ──
  form.addPageBreakItem().setTitle('基本プロフィール');

  form.addTextItem()
    .setTitle('氏名（フルネーム）')
    .setHelpText('例：山田 太郎')
    .setRequired(true);

  form.addTextItem()
    .setTitle('キャッチフレーズ')
    .setHelpText('あなたを一言で表すフレーズ（例：諦めない、最速への挑戦者）');

  form.addTextItem()
    .setTitle('出身地')
    .setHelpText('例：東京都渋谷区');

  form.addTextItem()
    .setTitle('年齢')
    .setHelpText('例：21');

  form.addTextItem()
    .setTitle('血液型')
    .setHelpText('例：A');

  form.addMultipleChoiceItem()
    .setTitle('参戦カテゴリ')
    .setChoiceValues(['カート', 'FIA-F4', 'スーパーフォーミュラ', 'その他'])
    .setRequired(true);

  form.addTextItem()
    .setTitle('シリーズ名')
    .setHelpText('例：全日本F4選手権 西地域');

  form.addTextItem()
    .setTitle('カーナンバー')
    .setHelpText('例：7');

  form.addTextItem()
    .setTitle('チーム名')
    .setHelpText('例：○○ Racing Team');

  form.addTextItem()
    .setTitle('座右の銘')
    .setHelpText('例：限界は超えるためにある');

  // ── セクション3: ストーリー ──
  form.addPageBreakItem().setTitle('あなたのストーリー');

  form.addSectionHeaderItem()
    .setTitle('⚡ 今、直面している壁')
    .setHelpText('具体的な数字があると支援者の心に刺さります');

  form.addParagraphTextItem()
    .setTitle('今シーズン直面している課題・壁を正直に書いてください')
    .setHelpText('例：今シーズンの参戦費用300万円のうち150万円がまだ未調達。このままでは第4戦以降の出場が難しい状況です。')
    .setRequired(true);

  form.addSectionHeaderItem()
    .setTitle('🔥 なぜレースを続けるのか')
    .setHelpText('原体験・きっかけ・諦めなかった理由');

  form.addParagraphTextItem()
    .setTitle('レースを始めたきっかけ、続ける理由を教えてください')
    .setHelpText('例：7歳のとき父に連れて行かれたカート場で初めて速さの気持ちよさを知り…')
    .setRequired(true);

  form.addSectionHeaderItem()
    .setTitle('📍 今シーズンの状況');

  form.addParagraphTextItem()
    .setTitle('現在地と次のステップを書いてください')
    .setHelpText('例：第3戦終了時点でランキング5位。あと2戦、全力で表彰台を狙います。');

  // ── セクション4: 支援の使い道 ──
  form.addPageBreakItem().setTitle('支援金の使い道');

  form.addTextItem()
    .setTitle('今シーズン総費用（万円）')
    .setHelpText('例：300');

  form.addTextItem()
    .setTitle('現在集まっている額（万円）')
    .setHelpText('例：87');

  form.addParagraphTextItem()
    .setTitle('支援の具体的な使い道')
    .setHelpText('月1,000円が10人集まったら何ができる？具体的に書くと響きます\n例：月1,000円×10人→タイヤ代1セット分、練習走行1回増やせる');

  // ── セクション5: 実績・目標 ──
  form.addPageBreakItem().setTitle('実績・目標');

  form.addParagraphTextItem()
    .setTitle('主な戦績')
    .setHelpText('例：2024年 全日本F4第3戦 3位入賞 / 2023年 地方選手権シリーズ優勝');

  form.addTextItem()
    .setTitle('今シーズンの目標')
    .setHelpText('例：シリーズランキングTOP5入り、鈴鹿でのコースレコード更新');

  // ── セクション6: SNS ──
  form.addPageBreakItem().setTitle('SNS・連絡先');

  form.addTextItem()
    .setTitle('X (Twitter) アカウント')
    .setHelpText('@を含めて入力 例：@yamada_racer');

  form.addTextItem()
    .setTitle('Instagram アカウント')
    .setHelpText('@を含めて入力 例：@yamada_racer');

  // ── セクション7: 支援アイテム ──
  form.addPageBreakItem()
    .setTitle('支援アイテム設定')
    .setHelpText('あなたをサポートしてくれた人へのお返しアイテムを設定します。最大5件まで登録できます。');

  form.addSectionHeaderItem()
    .setTitle('アイテム1')
    .setHelpText('メインの支援プランを設定してください（必須）');

  var categoryChoices = ['活動報告', 'サイン入りグッズ', 'ピット見学', 'マシンパーツ', '体験（練習会・同乗）', 'マシンロゴ掲載', 'スーツロゴ掲載', 'ヘルメットロゴ掲載'];
  var billingChoices = ['毎月（月額）', '一回限り'];
  var targetChoices = ['個人サポーター向け', '企業・法人向け', '両方'];

  form.addTextItem().setTitle('【アイテム1】タイトル').setHelpText('例：毎月の活動レポート').setRequired(true);
  form.addParagraphTextItem().setTitle('【アイテム1】説明').setHelpText('例：レース結果・練習内容を毎月お届け');
  form.addTextItem().setTitle('【アイテム1】金額（円）').setHelpText('例：1000').setRequired(true);
  form.addMultipleChoiceItem().setTitle('【アイテム1】カテゴリ').setChoiceValues(categoryChoices).setRequired(true);
  form.addMultipleChoiceItem().setTitle('【アイテム1】支払いタイプ').setChoiceValues(billingChoices).setRequired(true);
  form.addMultipleChoiceItem().setTitle('【アイテム1】対象').setChoiceValues(targetChoices).setRequired(true);
  form.addTextItem().setTitle('【アイテム1】数量制限').setHelpText('上限なしの場合は空欄。例：10');

  // アイテム2〜5（任意）
  for (var i = 2; i <= 5; i++) {
    form.addSectionHeaderItem().setTitle('アイテム' + i + '（任意）');
    form.addTextItem().setTitle('【アイテム' + i + '】タイトル').setHelpText('例：サイン入りヘルメットステッカー');
    form.addParagraphTextItem().setTitle('【アイテム' + i + '】説明');
    form.addTextItem().setTitle('【アイテム' + i + '】金額（円）').setHelpText('例：3000');
    form.addMultipleChoiceItem().setTitle('【アイテム' + i + '】カテゴリ').setChoiceValues(categoryChoices);
    form.addMultipleChoiceItem().setTitle('【アイテム' + i + '】支払いタイプ').setChoiceValues(billingChoices);
    form.addMultipleChoiceItem().setTitle('【アイテム' + i + '】対象').setChoiceValues(targetChoices);
  }

  // ── セクション8: 公開設定 ──
  form.addPageBreakItem().setTitle('公開設定');

  form.addMultipleChoiceItem()
    .setTitle('プロフィールを今すぐ公開しますか？')
    .setChoiceValues(['はい、今すぐ公開する', 'いいえ、下書きとして保存する'])
    .setRequired(true);

  // スプレッドシートに回答を連携
  var ss = SpreadsheetApp.create('DriverFund 登録データ');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  Logger.log('✅ フォーム作成完了！');
  Logger.log('📝 フォームURL: ' + form.getPublishedUrl());
  Logger.log('📊 スプレッドシートID: ' + ss.getId());
  Logger.log('📊 スプレッドシートURL: ' + ss.getUrl());
  Logger.log('');
  Logger.log('次のステップ:');
  Logger.log('1. webhook.gs の SPREADSHEET_ID に上記IDを設定');
  Logger.log('2. SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定');
  Logger.log('3. setupWebhook() を実行');

  return { formUrl: form.getPublishedUrl(), spreadsheetId: ss.getId() };
}
