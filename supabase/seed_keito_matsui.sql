-- ============================================
-- 松井 啓人 プロフィール シードデータ
-- Supabase SQL Editor で実行してください
-- https://supabase.com/dashboard/project/thktcznsxieijkhxzitk/sql
-- ============================================

-- Step 1: auth.users に追加（Supabase管理ユーザー作成）
-- ※ Supabase Dashboard > Authentication > Users で
--    「Add user」から keito@keitomatsui.jp を手動追加してもOK
--    その場合はStep1をスキップし、UUIDをStep2に入れてください

-- Step 2: profiles に追加
-- ※ 上でauthユーザーを作成したあと、そのUUIDを id に入れる
INSERT INTO public.profiles (id, full_name, email, role)
SELECT
  au.id,
  '松井 啓人',
  'keito@keitomatsui.jp',
  'driver'
FROM auth.users au
WHERE au.email = 'keito@keitomatsui.jp'
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- Step 3: drivers に追加
INSERT INTO public.drivers (
  profile_id,
  full_name,
  catchphrase,
  hometown,
  age,
  category,
  series_name,
  car_number,
  team_name,
  motto,
  bio,
  race_history,
  goal,
  sns_instagram,
  is_published
)
SELECT
  p.id,
  '松井 啓人',
  '弱者からF1へ。屈しない挑戦者。',
  'アメリカ・ケンタッキー州生まれ、大阪在住',
  21,
  'f4',
  '全日本FIA-F4選手権 / スーパーフォーミュラ・ライツ',
  '19',
  'AKILAND RACING / B-MAX RACING TEAM',
  'Invictus（屈しない者）',
  '{"conflict":"今シーズンの参戦費用は数千万円規模。両親からの支援は2025年で終わり、自力での資金調達が急務。練習機会も限られており、チーム体制の面でも恵まれない環境が続いている。","why":"父の影響でF1を意識し始め、インドネシアの日本人学校で同世代のレーサーと出会ったことで本格的に夢を持った。中学からカートを開始。高校時代に資金問題で一度レースを離れたが、ヨーロッパ旅行中に「このまま夢を諦めたら一生後悔する」と気づき、大学1年の夏に両親を説得してレースに復帰した。","now":"2025年は全日本FIA-F4（#19 AKILAND RACING）とスーパーフォーミュラ・ライツ（#58 B-MAX）に参戦中。2026年のF3鈴鹿参戦に向け資金調達を進めている。","fund_usage":"F3レース参戦費（契約金・マシン使用料・タイヤ・燃料）、国内外遠征費、トレーニング費用。2026年のF3鈴鹿大会参戦費1,000万円＋テスト費用1,000万円が当面の目標。","total_budget":"2000","current_fund":"調達中"}',
  '2024年 レース活動再開 / 2025年 全日本FIA-F4 Champion Class参戦（#19）/ 2025年 スーパーフォーミュラ・ライツ参戦（#58 B-MAX RACING TEAM）',
  '2026年F3鈴鹿参戦 → 2027年FIA F3 → 2028年FIA F2 → 2029年F1デビュー',
  '@keitomatsui_jp',
  true
FROM public.profiles p
WHERE p.email = 'keito@keitomatsui.jp'
ON CONFLICT (profile_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  catchphrase = EXCLUDED.catchphrase,
  hometown = EXCLUDED.hometown,
  age = EXCLUDED.age,
  category = EXCLUDED.category,
  series_name = EXCLUDED.series_name,
  car_number = EXCLUDED.car_number,
  team_name = EXCLUDED.team_name,
  motto = EXCLUDED.motto,
  bio = EXCLUDED.bio,
  race_history = EXCLUDED.race_history,
  goal = EXCLUDED.goal,
  sns_instagram = EXCLUDED.sns_instagram,
  is_published = EXCLUDED.is_published;

-- Step 4: 支援アイテムを追加
WITH driver_row AS (
  SELECT d.id FROM public.drivers d
  JOIN public.profiles p ON p.id = d.profile_id
  WHERE p.email = 'keito@keitomatsui.jp'
)
INSERT INTO public.return_items (driver_id, title, description, price, category, billing_type, target, is_active)
SELECT
  driver_row.id,
  items.title,
  items.description,
  items.price,
  items.category,
  items.billing_type,
  items.target,
  true
FROM driver_row, (VALUES
  ('月次活動レポート',     '毎月のレース結果・練習内容・F1への道のりをレポートでお届け。啓人の挑戦をリアルタイムで追えます。',                   1000,  'report',     'monthly',  'individual'),
  ('サイン入りフォトカード', '啓人直筆サイン入りのレース写真カード。世界チャンピオンになる前の今だけの一枚。',                                   5000,  'goods',      'one_time', 'individual'),
  ('ピット見学＋ツーショット', 'レースイベントでのピット見学権＋啓人との写真撮影。現場の熱量を体感してください。',                              30000, 'pit',        'one_time', 'individual'),
  ('マシンロゴ掲載（月額）', 'レーシングマシンに企業・個人ロゴを掲載。SNS・メディア露出とともに啓人の挑戦を一緒に発信できます。',               50000, 'logo_machine','monthly', 'corporate'),
  ('F3チャレンジ共同オーナー', '2026年F3鈴鹿大会の参戦スポンサー。ドキュメンタリー動画への出演権＋全イベント招待付き。',                       200000,'logo_suit',  'one_time', 'corporate')
) AS items(title, description, price, category, billing_type, target);

-- 確認クエリ
SELECT
  p.full_name,
  d.catchphrase,
  d.car_number,
  d.team_name,
  d.is_published,
  COUNT(r.id) as item_count
FROM public.profiles p
JOIN public.drivers d ON d.profile_id = p.id
LEFT JOIN public.return_items r ON r.driver_id = d.id AND r.is_active = true
WHERE p.email = 'keito@keitomatsui.jp'
GROUP BY p.full_name, d.catchphrase, d.car_number, d.team_name, d.is_published;
