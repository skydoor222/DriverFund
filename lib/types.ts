export type UserRole = "driver" | "supporter";

export type RacingCategory = "kart" | "f4" | "sf" | "other";

export type ReturnItemCategory =
  | "report"       // 活動報告
  | "goods"        // サイン入りグッズ
  | "pit"          // ピット見学
  | "part"         // マシンパーツ
  | "experience"   // 体験（練習会・同乗）
  | "logo_machine" // マシンロゴ
  | "logo_suit"    // スーツロゴ
  | "logo_helmet"; // ヘルメットロゴ

export type BillingType = "monthly" | "one_time";

export type SponsorshipStatus = "active" | "paused" | "completed";

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Driver {
  id: string;
  profile_id: string;
  full_name: string;
  avatar_url?: string;
  cover_url?: string;
  catchphrase?: string;
  bio: string;
  hometown?: string;
  age?: number;
  category: RacingCategory;
  series_name?: string;
  car_number?: string;
  team_name?: string;
  race_history?: string;
  goal?: string;
  sns_x?: string;
  sns_instagram?: string;
  total_supporters: number;
  monthly_revenue: number;
  is_published: boolean;
  // 拡張フィールド
  photo_urls?: string[];       // ギャラリー写真（複数）
  career_timeline?: string;    // 経歴タイムライン（JSON文字列: [{year,event}]）
  sponsors?: string;           // 現スポンサー（JSON文字列: [{name,logo_url}]）
  blood_type?: string;         // 血液型
  motto?: string;              // 座右の銘
  // レース結果
  race_results?: string;       // JSON: [{round,circuit,qualifying,race,points}]
  series_rank?: number;        // 今季シリーズ順位
  team_rank?: number;          // 今季チーム順位
  total_points?: number;       // 今季獲得ポイント合計
  // Stripe Connect
  stripe_account_id?: string;
  stripe_onboarding_complete?: boolean;
  // v2: 達成率・ランキング・カウントダウン
  season_goal_amount?: number;    // 年間活動費目標（達成率の分母）
  season_raised_amount?: number;  // 今季応援総額（達成率の分子）
  weekly_rank?: number;           // 週次ランキング順位
  rank_change?: number;           // 前週比順位変動（+2 / -1）
  next_race_id?: string;          // 次戦
  created_at?: string;
}

// 達成率を計算（0-100+）
export function achievementRate(d: Pick<Driver, "season_goal_amount" | "season_raised_amount">): number {
  if (!d.season_goal_amount || d.season_goal_amount <= 0) return 0;
  return Math.round(((d.season_raised_amount ?? 0) / d.season_goal_amount) * 100);
}

export type PostType = "update" | "race_result" | "behind_scenes" | "milestone";

export interface Post {
  id: string;
  driver_id: string;
  type: PostType;
  title?: string;
  body: string;
  image_urls?: string[];
  race_round?: number;
  created_at: string;
  driver?: Driver;
}

export interface Race {
  id: string;
  category: string;
  series_name?: string;
  round?: number;
  circuit: string;
  race_date: string;   // ISO date
  created_at?: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  driver_id: string;
  created_at: string;
}

// レース結果1行の型
export interface RaceResult {
  round: number;
  circuit: string;
  qualifying: number | null;   // DNQ/DNS は null
  race: number | null;          // DNF/DNS は null
  points: string;               // "15" "2+15" など
}

export interface ReturnItem {
  id: string;
  driver_id: string;
  title: string;
  description?: string;
  image_url?: string;
  category: ReturnItemCategory;
  price: number;
  quantity_limit?: number;
  remaining?: number;
  billing_type: BillingType;
  target: "individual" | "corporate" | "both";
  is_active: boolean;
  // Stripe
  stripe_price_id?: string;
  stripe_payment_link_url?: string;
}

export interface Sponsorship {
  id: string;
  supporter_id: string;
  driver_id: string;
  return_item_id: string;
  amount: number;
  status: SponsorshipStatus;
  started_at: string;
  next_billing_at?: string;
  return_item?: ReturnItem;
  driver?: Driver;
}
