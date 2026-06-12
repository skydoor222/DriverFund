// =============================================================
// DriverFund Design System — Light × Minimal (Apple-style)
// 全画面はこのトークンを参照する。色のハードコード禁止。
// =============================================================

export const colors = {
  // ── Brand ──
  brand: "#E8002D",        // レーシングレッド（アクセントのみに使用）
  brandDark: "#C40026",
  brandTint: "#FFF0F2",    // 薄い赤背景（選択中チップ等）

  // ── Neutrals (iOS systemGray ベース) ──
  bg: "#FFFFFF",           // 画面背景
  bgGrouped: "#F2F2F7",    // グループ化背景（iOS settings 風）
  surface: "#FFFFFF",      // カード面
  surfaceAlt: "#FAFAFA",   // 一段沈んだ面

  // ── Text ──
  label: "#0A0A0A",        // 主要テキスト
  labelSecondary: "#3C3C43", // 副次テキスト
  labelTertiary: "#8E8E93",  // 補助テキスト（iOS systemGray）
  labelQuaternary: "#C7C7CC",// プレースホルダ

  // ── Lines ──
  separator: "#E5E5EA",    // 区切り線
  border: "#E0E0E5",       // 入力欄ボーダー
  borderStrong: "#D1D1D6",

  // ── Status ──
  success: "#34C759",
  warning: "#FF9500",
  danger: "#FF3B30",
  info: "#007AFF",

  // ── Category colors（レース）──
  catSf: "#E8002D",
  catF4: "#0A84FF",
  catKart: "#34C759",
  catOther: "#8E8E93",

  white: "#FFFFFF",
  black: "#000000",

  // ── クラファン風アクセント（達成率・ホットバッジ）──
  flame: "#FF6B2C",        // 達成率バーの炎オレンジ
  flameDeep: "#FF3D00",    // グラデの濃い側
  rankGold: "#F5A623",     // ランキング1位
  rankSilver: "#A8A8B3",   // 2位
  rankBronze: "#CD7F32",   // 3位
  bgWarm: "#FFF7F3",       // 暖色の薄い背景（おすすめセクション）
} as const;

// カテゴリ拡張（GT / フォーミュラ追加に備えた表示色フォールバック）
export const categoryColorOf = (cat?: string): string =>
  (cat && categoryColorMap[cat]) || colors.catOther;
const categoryColorMap: Record<string, string> = {
  sf: colors.catSf, f4: colors.catF4, kart: colors.catKart, other: colors.catOther,
};

// カテゴリ → 色
export const categoryColor: Record<string, string> = {
  sf: colors.catSf,
  f4: colors.catF4,
  kart: colors.catKart,
  other: colors.catOther,
};

export const categoryLabel: Record<string, string> = {
  kart: "カート",
  f4: "FIA-F4",
  sf: "スーパーフォーミュラ",
  other: "その他",
};
export const categoryShort: Record<string, string> = {
  kart: "カート", f4: "F4", sf: "SF", other: "その他",
};

// ── Spacing (4pt grid) ──
export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 48,
} as const;

// ── Radius ──
export const radius = {
  sm: 8, md: 12, lg: 16, xl: 20, pill: 999,
} as const;

// ── Typography ──
// iOS の San Francisco に近いウェイト・サイズ階層
export const typography = {
  largeTitle: { fontSize: 34, fontWeight: "800" as const, letterSpacing: 0.2 },
  title1:     { fontSize: 28, fontWeight: "800" as const, letterSpacing: 0.2 },
  title2:     { fontSize: 22, fontWeight: "700" as const, letterSpacing: 0.2 },
  title3:     { fontSize: 20, fontWeight: "700" as const },
  headline:   { fontSize: 17, fontWeight: "700" as const },
  body:       { fontSize: 17, fontWeight: "400" as const },
  callout:    { fontSize: 16, fontWeight: "400" as const },
  subhead:    { fontSize: 15, fontWeight: "400" as const },
  footnote:   { fontSize: 13, fontWeight: "400" as const },
  caption:    { fontSize: 12, fontWeight: "400" as const },
  caption2:   { fontSize: 11, fontWeight: "600" as const, letterSpacing: 0.5 },
} as const;

// ── Shadow（iOS 風の柔らかい影）──
export const shadow = {
  sm: {
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  md: {
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  brand: {
    shadowColor: colors.brand, shadowOpacity: 0.3, shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
} as const;

// レガシー互換（既存ファイルが T.xxx を参照している箇所のため）
export const T = colors;
