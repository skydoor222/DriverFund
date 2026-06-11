/**
 * DriverFund フォーム送信 → Supabase 自動連携スクリプト
 * ※メール通知なし版（MailApp権限不要）
 */

var SUPABASE_URL = 'https://thktcznsxieijkhxzitk.supabase.co';

function getConfig() {
  var props = PropertiesService.getScriptProperties();
  return {
    spreadsheetId: props.getProperty('SPREADSHEET_ID'),
    serviceRoleKey: props.getProperty('SUPABASE_SERVICE_ROLE_KEY')
  };
}

var CATEGORY_LABEL_MAP = {
  'カート': 'kart',
  'FIA-F4': 'f4',
  'スーパーフォーミュラ': 'sf',
  'その他': 'other'
};

var RETURN_CATEGORY_MAP = {
  '活動報告': 'report',
  'サイン入りグッズ': 'goods',
  'ピット見学': 'pit',
  'マシンパーツ': 'part',
  '体験（練習会・同乗）': 'experience',
  'マシンロゴ掲載': 'logo_machine',
  'スーツロゴ掲載': 'logo_suit',
  'ヘルメットロゴ掲載': 'logo_helmet'
};

var BILLING_MAP = {
  '毎月（月額）': 'monthly',
  '一回限り': 'one_time'
};

var TARGET_MAP = {
  '個人サポーター向け': 'individual',
  '企業・法人向け': 'corporate',
  '両方': 'both'
};

function setupWebhook() {
  var config = getConfig();
  if (!config.spreadsheetId) {
    throw new Error('スクリプトプロパティに SPREADSHEET_ID を設定してください');
  }
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'onFormSubmit') ScriptApp.deleteTrigger(t);
  });
  var ss = SpreadsheetApp.openById(config.spreadsheetId);
  ScriptApp.newTrigger('onFormSubmit').forSpreadsheet(ss).onFormSubmit().create();
  Logger.log('✅ Webhookトリガーを登録しました');
}

function onFormSubmit(e) {
  var config = getConfig();
  var key = config.serviceRoleKey;
  if (!key) { Logger.log('エラー: SUPABASE_SERVICE_ROLE_KEY未設定'); return; }

  try {
    var r = e.namedValues;
    var email = getValue(r, '登録メールアドレス ※必須');
    if (!email) { Logger.log('エラー: メールが空'); return; }

    var profiles = supabaseGet('/rest/v1/profiles?email=eq.' + encodeURIComponent(email) + '&select=id,full_name', key);
    if (!profiles || profiles.length === 0) {
      Logger.log('エラー: プロフィールなし: ' + email);
      return;
    }
    var profile = profiles[0];

    var drivers = supabaseGet('/rest/v1/drivers?profile_id=eq.' + profile.id + '&select=id', key);

    var bio = JSON.stringify({
      conflict: getValue(r, '今シーズン直面している課題・壁を正直に書いてください'),
      why: getValue(r, 'レースを始めたきっかけ、続ける理由を教えてください'),
      now: getValue(r, '現在地と次のステップを書いてください'),
      fund_usage: getValue(r, '支援の具体的な使い道'),
      total_budget: getValue(r, '今シーズン総費用（万円）'),
      current_fund: getValue(r, '現在集まっている額（万円）')
    });

    var isPublished = getValue(r, 'プロフィールを今すぐ公開しますか？') === 'はい、今すぐ公開する';

    var payload = {
      profile_id: profile.id,
      full_name: getValue(r, '氏名（フルネーム）') || profile.full_name,
      catchphrase: getValue(r, 'キャッチフレーズ') || null,
      hometown: getValue(r, '出身地') || null,
      age: parseInt(getValue(r, '年齢')) || null,
      blood_type: getValue(r, '血液型') || null,
      category: CATEGORY_LABEL_MAP[getValue(r, '参戦カテゴリ')] || 'other',
      series_name: getValue(r, 'シリーズ名') || null,
      car_number: getValue(r, 'カーナンバー') || null,
      team_name: getValue(r, 'チーム名') || null,
      motto: getValue(r, '座右の銘') || null,
      bio: bio,
      race_history: getValue(r, '主な戦績') || null,
      goal: getValue(r, '今シーズンの目標') || null,
      sns_x: getValue(r, 'X (Twitter) アカウント') || null,
      sns_instagram: getValue(r, 'Instagram アカウント') || null,
      is_published: isPublished
    };

    var driverId;
    if (drivers && drivers.length > 0) {
      driverId = drivers[0].id;
      supabasePatch('/rest/v1/drivers?id=eq.' + driverId, payload, key);
      Logger.log('✅ ドライバー更新: ' + driverId);
    } else {
      var created = supabasePost('/rest/v1/drivers', payload, key);
      driverId = created[0].id;
      Logger.log('✅ ドライバー作成: ' + driverId);
    }

    supabasePatch('/rest/v1/return_items?driver_id=eq.' + driverId, { is_active: false }, key);

    for (var i = 1; i <= 5; i++) {
      var title = getValue(r, '【アイテム' + i + '】タイトル');
      if (!title) continue;
      var price = parseInt(getValue(r, '【アイテム' + i + '】金額（円）'));
      if (!price || isNaN(price)) continue;
      var qtyStr = getValue(r, '【アイテム' + i + '】数量制限');
      var qty = qtyStr ? parseInt(qtyStr) : null;
      if (isNaN(qty)) qty = null;
      supabasePost('/rest/v1/return_items', {
        driver_id: driverId,
        title: title.trim(),
        description: getValue(r, '【アイテム' + i + '】説明') || null,
        price: price,
        category: RETURN_CATEGORY_MAP[getValue(r, '【アイテム' + i + '】カテゴリ')] || 'report',
        billing_type: BILLING_MAP[getValue(r, '【アイテム' + i + '】支払いタイプ')] || 'monthly',
        target: TARGET_MAP[getValue(r, '【アイテム' + i + '】対象')] || 'individual',
        quantity_limit: qty,
        remaining: qty,
        is_active: true
      }, key);
      Logger.log('✅ アイテム' + i + ': ' + title);
    }

    Logger.log('🎉 完了: ' + email);
  } catch (err) {
    Logger.log('エラー: ' + err.toString());
    throw err;
  }
}

function getHeaders(key) {
  return {
    'apikey': key,
    'Authorization': 'Bearer ' + key,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
}

function supabaseGet(path, key) {
  return JSON.parse(UrlFetchApp.fetch(SUPABASE_URL + path, { method: 'GET', headers: getHeaders(key), muteHttpExceptions: true }).getContentText());
}

function supabasePost(path, payload, key) {
  var res = UrlFetchApp.fetch(SUPABASE_URL + path, { method: 'POST', headers: getHeaders(key), payload: JSON.stringify(payload), muteHttpExceptions: true }).getContentText();
  return res ? JSON.parse(res) : [];
}

function supabasePatch(path, payload, key) {
  UrlFetchApp.fetch(SUPABASE_URL + path, { method: 'PATCH', headers: getHeaders(key), payload: JSON.stringify(payload), muteHttpExceptions: true });
}

function getValue(r, key) {
  var v = r[key];
  if (!v || v.length === 0) return '';
  return (v[0] || '').toString().trim();
}

function testOnFormSubmit() {
  onFormSubmit({ namedValues: {
    '登録メールアドレス ※必須': ['s0rat0.t0da@gmail.com'],
    '氏名（フルネーム）': ['テスト太郎'],
    'キャッチフレーズ': ['最速への挑戦者'],
    '出身地': ['東京都'], '年齢': ['22'], '血液型': ['A'],
    '参戦カテゴリ': ['FIA-F4'], 'シリーズ名': ['全日本F4'], 'カーナンバー': ['77'],
    'チーム名': ['テストレーシング'], '座右の銘': ['限界は超えるためにある'],
    '今シーズン直面している課題・壁を正直に書いてください': ['費用150万未調達'],
    'レースを始めたきっかけ、続ける理由を教えてください': ['7歳でカートに乗った'],
    '現在地と次のステップを書いてください': ['ランキング5位'],
    '今シーズン総費用（万円）': ['300'], '現在集まっている額（万円）': ['87'],
    '支援の具体的な使い道': ['タイヤ代'],
    '主な戦績': ['2024年F4第3戦3位'], '今シーズンの目標': ['TOP5'],
    'X (Twitter) アカウント': ['@test'], 'Instagram アカウント': ['@test'],
    '【アイテム1】タイトル': ['月次活動レポート'], '【アイテム1】説明': ['毎月お届け'],
    '【アイテム1】金額（円）': ['1000'], '【アイテム1】カテゴリ': ['活動報告'],
    '【アイテム1】支払いタイプ': ['毎月（月額）'], '【アイテム1】対象': ['個人サポーター向け'],
    '【アイテム1】数量制限': [''],
    'プロフィールを今すぐ公開しますか？': ['いいえ、下書きとして保存する']
  }});
}
