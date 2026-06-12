import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, typography } from "../../lib/theme";

// ── 達成率バー（クラファンの射幸性の核）──
export function AchievementBar({
  rate,
  raised,
  goal,
  compact = false,
}: {
  rate: number;          // 達成率 %（100超もある）
  raised?: number;       // 集まった額
  goal?: number;         // 目標額
  compact?: boolean;
}) {
  const filled = Math.min(rate, 100);
  return (
    <View style={s.wrap}>
      <View style={s.topRow}>
        <View style={s.rateRow}>
          <Ionicons name="flame" size={compact ? 14 : 16} color={colors.flame} />
          <Text style={[s.rateLabel, compact && { fontSize: 12 }]}>達成率</Text>
          <Text style={[s.rateValue, compact && { fontSize: 18 }]}>{rate}</Text>
          <Text style={[s.ratePct, compact && { fontSize: 12 }]}>%</Text>
        </View>
        {raised != null && !compact && (
          <Text style={s.raised}>¥{raised.toLocaleString()}</Text>
        )}
      </View>
      <View style={[s.track, compact && { height: 5 }]}>
        <View style={[s.fill, { width: `${filled}%` }, compact && { height: 5 }]} />
      </View>
      {goal != null && !compact && (
        <Text style={s.goal}>目標 ¥{goal.toLocaleString()}</Text>
      )}
    </View>
  );
}

// ── ランキング順位バッジ（1/2/3位は色付き）──
export function RankBadge({ rank, change }: { rank: number; change?: number }) {
  const medal =
    rank === 1 ? colors.rankGold : rank === 2 ? colors.rankSilver : rank === 3 ? colors.rankBronze : null;
  return (
    <View style={s.rankWrap}>
      <Text style={[s.rankNum, medal ? { color: medal } : { color: colors.labelTertiary }]}>
        {rank}
      </Text>
      {change != null && change !== 0 && (
        <View style={s.changeRow}>
          <Ionicons
            name={change > 0 ? "caret-up" : "caret-down"}
            size={10}
            color={change > 0 ? colors.success : colors.labelTertiary}
          />
          <Text style={[s.changeTxt, { color: change > 0 ? colors.success : colors.labelTertiary }]}>
            {Math.abs(change)}
          </Text>
        </View>
      )}
    </View>
  );
}

// ── カウントダウン（次戦まで「あと◯日」）──
export function Countdown({
  raceDate,
  circuit,
  tone = "light",
}: {
  raceDate?: string;     // ISO date
  circuit?: string;
  tone?: "light" | "dark";
}) {
  if (!raceDate) return null;
  const days = daysUntil(raceDate);
  if (days == null) return null;
  const dark = tone === "dark";
  const urgent = days <= 7;
  return (
    <View style={[s.cdWrap, dark && s.cdWrapDark]}>
      <Ionicons name="flag" size={13} color={dark ? colors.white : colors.brand} />
      <Text style={[s.cdLabel, dark && { color: "rgba(255,255,255,0.7)" }]}>
        {circuit ? `次戦 ${circuit}` : "次戦"}
      </Text>
      <Text style={[s.cdDays, dark && { color: colors.white }, urgent && !dark && { color: colors.brand }]}>
        {days === 0 ? "本日開催" : `あと${days}日`}
      </Text>
    </View>
  );
}

export function daysUntil(iso: string): number | null {
  const target = new Date(iso + "T00:00:00");
  if (isNaN(target.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff < 0 ? null : diff;
}

const s = StyleSheet.create({
  wrap: { gap: 6 },
  topRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  rateRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  rateLabel: { ...typography.caption, color: colors.labelTertiary, marginRight: 2 },
  rateValue: { fontSize: 22, fontWeight: "900", color: colors.flameDeep, letterSpacing: -0.5 },
  ratePct: { fontSize: 14, fontWeight: "800", color: colors.flameDeep },
  raised: { ...typography.footnote, fontWeight: "700", color: colors.label },
  track: { height: 7, borderRadius: radius.pill, backgroundColor: colors.bgGrouped, overflow: "hidden" },
  fill: { height: 7, borderRadius: radius.pill, backgroundColor: colors.flame },
  goal: { ...typography.caption, color: colors.labelTertiary },

  rankWrap: { alignItems: "center", minWidth: 32 },
  rankNum: { fontSize: 26, fontWeight: "900", fontStyle: "italic", letterSpacing: -1 },
  changeRow: { flexDirection: "row", alignItems: "center", gap: 1, marginTop: -2 },
  changeTxt: { fontSize: 10, fontWeight: "800" },

  cdWrap: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: colors.brandTint, borderRadius: radius.sm,
    paddingVertical: 6, paddingHorizontal: 10, alignSelf: "flex-start",
  },
  cdWrapDark: { backgroundColor: "rgba(255,255,255,0.12)" },
  cdLabel: { ...typography.caption, color: colors.labelSecondary, fontWeight: "600" },
  cdDays: { ...typography.footnote, fontWeight: "800", color: colors.label },
});
