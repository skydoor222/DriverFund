// ============================================================
// 閲覧履歴 / お気に入り
// 履歴は端末ローカル（Web=localStorage）に保持。お気に入りはログイン時
// Supabase favorites テーブル、未ログイン時は localStorage にフォールバック。
// ============================================================
import { Platform } from "react-native";
import { supabase } from "./supabase";

const HISTORY_KEY = "df:viewed_drivers";
const FAV_KEY = "df:favorites";
const MAX_HISTORY = 30;

// ── プラットフォーム非依存の軽量ストレージ ──
// Web は localStorage、ネイティブは expo-secure-store を遅延ロード。
// （AsyncStorage への追加依存を避ける）
const store = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      try { return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null; }
      catch { return null; }
    }
    try {
      const SecureStore = await import("expo-secure-store");
      return SecureStore.getItemAsync(key);
    } catch { return null; }
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      try { if (typeof localStorage !== "undefined") localStorage.setItem(key, value); } catch { /* noop */ }
      return;
    }
    try {
      const SecureStore = await import("expo-secure-store");
      await SecureStore.setItemAsync(key, value);
    } catch { /* noop */ }
  },
};

// ── 閲覧履歴（最近見た選手ID、新しい順）──
export async function recordView(driverId: string): Promise<void> {
  try {
    const raw = await store.getItem(HISTORY_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    const next = [driverId, ...list.filter((x) => x !== driverId)].slice(0, MAX_HISTORY);
    await store.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch { /* noop */ }
}

export async function getViewHistory(): Promise<string[]> {
  try {
    const raw = await store.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// ── お気に入り ──
export async function getFavorites(userId?: string): Promise<string[]> {
  if (userId) {
    const { data, error } = await supabase.from("favorites").select("driver_id").eq("user_id", userId);
    if (!error && data) return data.map((r) => r.driver_id);
  }
  try {
    const raw = await store.getItem(FAV_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function isFavorite(driverId: string, userId?: string): Promise<boolean> {
  const favs = await getFavorites(userId);
  return favs.includes(driverId);
}

export async function toggleFavorite(driverId: string, userId?: string): Promise<boolean> {
  const favs = await getFavorites(userId);
  const has = favs.includes(driverId);

  if (userId) {
    if (has) {
      await supabase.from("favorites").delete().eq("user_id", userId).eq("driver_id", driverId);
    } else {
      await supabase.from("favorites").insert({ user_id: userId, driver_id: driverId });
    }
  }
  // ローカルも同期（オフライン/未ログイン用）
  const nextLocal = has ? favs.filter((x) => x !== driverId) : [...favs, driverId];
  try { await store.setItem(FAV_KEY, JSON.stringify(nextLocal)); } catch { /* noop */ }
  return !has; // 新しい状態（true=お気に入りになった）
}
