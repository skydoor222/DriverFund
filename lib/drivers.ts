// ============================================================
// ドライバーデータ取得層
// 各タブが共通で使う fetch ロジック。drivers + profiles を結合し
// アプリ内で扱いやすい DriverLike 形に正規化する。
// ============================================================
import { supabase } from "./supabase";
import type { Driver, Race } from "./types";

export type DriverLike = Driver & { full_name?: string; next_race?: Race | null };

// drivers + profiles を結合して名前・アバターを補完
const SELECT = `
  *,
  profile:profiles!drivers_profile_id_fkey ( full_name, avatar_url )
`;

function normalize(row: any): DriverLike {
  const p = row.profile ?? {};
  return {
    ...row,
    full_name: row.full_name ?? p.full_name ?? "ドライバー",
    avatar_url: row.avatar_url ?? p.avatar_url ?? undefined,
  };
}

// 公開済みドライバー一覧（カテゴリ絞り込み可）
export async function fetchPublishedDrivers(opts?: {
  category?: string;       // "all" 以外でフィルタ
  limit?: number;
  order?: "newest" | "supporters" | "achievement";
}): Promise<DriverLike[]> {
  let q = supabase.from("drivers").select(SELECT).eq("is_published", true);

  if (opts?.category && opts.category !== "all") {
    q = q.eq("category", opts.category);
  }
  if (opts?.order === "newest") q = q.order("created_at", { ascending: false });
  else if (opts?.order === "supporters") q = q.order("total_supporters", { ascending: false });
  else q = q.order("total_supporters", { ascending: false });

  if (opts?.limit) q = q.limit(opts.limit);

  const { data, error } = await q;
  if (error) { console.warn("fetchPublishedDrivers", error.message); return []; }
  return (data ?? []).map(normalize);
}

// 1人のドライバー詳細
export async function fetchDriver(id: string): Promise<DriverLike | null> {
  const { data, error } = await supabase.from("drivers").select(SELECT).eq("id", id).maybeSingle();
  if (error) { console.warn("fetchDriver", error.message); return null; }
  return data ? normalize(data) : null;
}

// 達成率順ランキング（クライアント側で算出してソート）
export async function fetchRanking(category?: string, limit = 30): Promise<DriverLike[]> {
  const drivers = await fetchPublishedDrivers({ category, limit: 100 });
  return drivers
    .map((d) => ({
      d,
      rate: d.season_goal_amount && d.season_goal_amount > 0
        ? (d.season_raised_amount ?? 0) / d.season_goal_amount
        : 0,
    }))
    .sort((a, b) => b.rate - a.rate || (b.d.total_supporters ?? 0) - (a.d.total_supporters ?? 0))
    .slice(0, limit)
    .map((x) => x.d);
}

// テキスト検索（名前・キャッチコピー・チーム名）
export async function searchDrivers(query: string): Promise<DriverLike[]> {
  const all = await fetchPublishedDrivers({ limit: 100 });
  const q = query.trim().toLowerCase();
  if (!q) return all;
  return all.filter((d) =>
    [d.full_name, d.catchphrase, d.team_name, d.series_name]
      .filter(Boolean)
      .some((s) => String(s).toLowerCase().includes(q))
  );
}
