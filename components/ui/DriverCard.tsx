import { View, Text, StyleSheet, Image, Pressable, ImageStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography, shadow, categoryShort, categoryColor } from "../../lib/theme";
import { achievementRate, type Driver, type Race } from "../../lib/types";
import { AchievementBar, RankBadge, daysUntil } from "./Achievement";

type DriverLike = Driver & { full_name?: string; next_race?: Race | null };

function coverStyle(extra?: ImageStyle): ImageStyle[] {
  return [s.cover as ImageStyle, ...(extra ? [extra] : [])];
}

function CoverImage({ uri, style, label }: { uri?: string; style: ImageStyle[]; label?: string }) {
  if (uri) return <Image source={{ uri }} style={style} resizeMode="cover" />;
  return (
    <View style={[...style, s.coverPlaceholder]}>
      <Ionicons name="car-sport" size={34} color={colors.labelQuaternary} />
      {label ? <Text style={s.coverPlaceholderTxt}>{label}</Text> : null}
    </View>
  );
}

// ── 大カード（ホームのグリッド / 詳細リスト）──
export function DriverCardLarge({ driver, onPress }: { driver: DriverLike; onPress?: () => void }) {
  const rate = achievementRate(driver);
  const cat = categoryShort[driver.category] ?? "";
  const days = driver.next_race?.race_date ? daysUntil(driver.next_race.race_date) : null;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.lg, pressed && s.pressed]}>
      <View style={s.lgCoverWrap}>
        <CoverImage uri={driver.cover_url} style={coverStyle(s.lgCover)} />
        <View style={[s.catChip, { backgroundColor: categoryColor[driver.category] ?? colors.catOther }]}>
          <Text style={s.catChipTxt}>{cat}</Text>
        </View>
        {days != null && days <= 14 && (
          <View style={s.daysChip}>
            <Ionicons name="flag" size={10} color={colors.white} />
            <Text style={s.daysChipTxt}>{days === 0 ? "本日" : `あと${days}日`}</Text>
          </View>
        )}
      </View>
      <View style={s.lgBody}>
        <Text style={s.lgName} numberOfLines={1}>{driver.full_name ?? "ドライバー"}</Text>
        {driver.catchphrase ? (
          <Text style={s.lgCatch} numberOfLines={2}>{driver.catchphrase}</Text>
        ) : null}
        <View style={{ marginTop: spacing.sm }}>
          <AchievementBar rate={rate} compact />
        </View>
        <View style={s.lgMeta}>
          <Ionicons name="people" size={12} color={colors.labelTertiary} />
          <Text style={s.lgMetaTxt}>{driver.total_supporters ?? 0}人が応援中</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ── 横スクロール用コンパクトカード（チェックした選手 等）──
export function DriverCardCompact({ driver, onPress }: { driver: DriverLike; onPress?: () => void }) {
  const days = driver.next_race?.race_date ? daysUntil(driver.next_race.race_date) : null;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.cmp, pressed && s.pressed]}>
      <CoverImage uri={driver.cover_url} style={coverStyle(s.cmpCover)} />
      <View style={s.cmpBody}>
        <Text style={s.cmpName} numberOfLines={1}>{driver.full_name ?? "ドライバー"}</Text>
        <Text style={s.cmpDays}>
          {days != null ? (days === 0 ? "本日開催" : `次戦まであと${days}日`) : `${driver.total_supporters ?? 0}人が応援中`}
        </Text>
      </View>
    </Pressable>
  );
}

// ── 横長リスト行（新着タブ）──
export function DriverRow({ driver, onPress }: { driver: DriverLike; onPress?: () => void }) {
  const rate = achievementRate(driver);
  const cat = categoryShort[driver.category] ?? "";
  const days = driver.next_race?.race_date ? daysUntil(driver.next_race.race_date) : null;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.row, pressed && s.pressed]}>
      <CoverImage uri={driver.cover_url} style={coverStyle(s.rowCover)} />
      <View style={s.rowBody}>
        <View style={s.rowCatRow}>
          <View style={[s.catChipSm, { backgroundColor: categoryColor[driver.category] ?? colors.catOther }]}>
            <Text style={s.catChipTxt}>{cat}</Text>
          </View>
          {days != null && (
            <View style={s.rowDays}>
              <Ionicons name="time-outline" size={12} color={colors.labelTertiary} />
              <Text style={s.rowDaysTxt}>{days === 0 ? "本日" : `あと${days}日`}</Text>
            </View>
          )}
        </View>
        <Text style={s.rowName} numberOfLines={1}>{driver.full_name ?? "ドライバー"}</Text>
        {driver.catchphrase ? <Text style={s.rowCatch} numberOfLines={2}>{driver.catchphrase}</Text> : null}
        {rate > 0 && (
          <Text style={s.rowRate}>
            <Text style={{ color: colors.flameDeep, fontWeight: "900" }}>達成率 {rate}%</Text>
          </Text>
        )}
      </View>
    </Pressable>
  );
}

// ── ランキング行（さがすタブ）──
export function DriverRankRow({ driver, rank, change, onPress }: {
  driver: DriverLike; rank: number; change?: number; onPress?: () => void;
}) {
  const rate = achievementRate(driver);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.rank, pressed && s.pressed]}>
      <RankBadge rank={rank} change={change} />
      <CoverImage uri={driver.cover_url} style={coverStyle(s.rankCover)} />
      <View style={s.rankBody}>
        <Text style={s.rankName} numberOfLines={1}>{driver.full_name ?? "ドライバー"}</Text>
        {driver.catchphrase ? <Text style={s.rankCatch} numberOfLines={1}>{driver.catchphrase}</Text> : null}
        <View style={s.rankMeta}>
          <Ionicons name="flame" size={12} color={colors.flame} />
          <Text style={s.rankRate}>達成率 {rate}%</Text>
          <Text style={s.rankDot}>·</Text>
          <Text style={s.rankSup}>{driver.total_supporters ?? 0}人</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.labelQuaternary} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  cover: { backgroundColor: colors.bgGrouped },
  coverPlaceholder: { alignItems: "center", justifyContent: "center", gap: 4 },
  coverPlaceholderTxt: { ...typography.caption, color: colors.labelQuaternary },

  catChip: {
    position: "absolute", top: spacing.sm, left: spacing.sm,
    borderRadius: radius.sm - 2, paddingHorizontal: 7, paddingVertical: 3,
  },
  catChipSm: { borderRadius: radius.sm - 3, paddingHorizontal: 6, paddingVertical: 2 },
  catChipTxt: { color: colors.white, fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  daysChip: {
    position: "absolute", top: spacing.sm, right: spacing.sm,
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "rgba(0,0,0,0.6)", borderRadius: radius.sm - 2,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  daysChipTxt: { color: colors.white, fontSize: 10, fontWeight: "800" },

  // Large
  lg: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: "hidden", ...shadow.sm },
  lgCoverWrap: { position: "relative" },
  lgCover: { width: "100%", aspectRatio: 16 / 10 },
  lgBody: { padding: spacing.md },
  lgName: { ...typography.headline, color: colors.label },
  lgCatch: { ...typography.footnote, color: colors.labelSecondary, lineHeight: 18, marginTop: 2 },
  lgMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.sm },
  lgMetaTxt: { ...typography.caption, color: colors.labelTertiary },

  // Compact
  cmp: { width: 160, backgroundColor: colors.surface, borderRadius: radius.md, overflow: "hidden", ...shadow.sm },
  cmpCover: { width: "100%", aspectRatio: 16 / 10 },
  cmpBody: { padding: spacing.sm + 2 },
  cmpName: { ...typography.subhead, fontWeight: "700", color: colors.label },
  cmpDays: { ...typography.caption, color: colors.labelTertiary, marginTop: 2 },

  // Row
  row: {
    flexDirection: "row", gap: spacing.md, backgroundColor: colors.surface,
    borderRadius: radius.lg, padding: spacing.sm + 2, ...shadow.sm,
  },
  rowCover: { width: 120, height: 84, borderRadius: radius.md },
  rowBody: { flex: 1, justifyContent: "center", gap: 3 },
  rowCatRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  rowDays: { flexDirection: "row", alignItems: "center", gap: 2 },
  rowDaysTxt: { ...typography.caption, color: colors.labelTertiary },
  rowName: { ...typography.headline, color: colors.label },
  rowCatch: { ...typography.footnote, color: colors.labelSecondary, lineHeight: 17 },
  rowRate: { ...typography.caption, marginTop: 1 },

  // Rank
  rank: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.sm + 2, ...shadow.sm,
  },
  rankCover: { width: 64, height: 64, borderRadius: radius.md },
  rankBody: { flex: 1, gap: 2 },
  rankName: { ...typography.subhead, fontWeight: "700", color: colors.label },
  rankCatch: { ...typography.caption, color: colors.labelTertiary },
  rankMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 1 },
  rankRate: { ...typography.caption, fontWeight: "700", color: colors.flameDeep },
  rankDot: { color: colors.labelQuaternary },
  rankSup: { ...typography.caption, color: colors.labelTertiary },
});
