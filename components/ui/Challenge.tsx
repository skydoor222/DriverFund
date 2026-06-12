import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, radius } from "../../lib/theme";

// ── チャレンジ（目標）カード ──
// 参考アプリの「チャレンジ」セクション風。選手が掲げる目標を旗付きで表示。
export function ChallengeCard({
  goals,
  onSeeAll,
}: {
  goals: string[];          // 目標テキスト（複数行 → 複数項目）
  onSeeAll?: () => void;
}) {
  if (!goals.length) return null;
  const primary = goals[0];
  const hasMore = goals.length > 1;
  return (
    <View style={s.card}>
      <Text style={s.label}>目標</Text>
      <View style={s.goalRow}>
        <Ionicons name="flag" size={18} color={colors.brand} />
        <Text style={s.goalText}>{primary}</Text>
      </View>
      {hasMore && onSeeAll && (
        <>
          <View style={s.divider} />
          <Pressable onPress={onSeeAll} style={({ pressed }) => [s.seeAll, pressed && { opacity: 0.6 }]}>
            <Text style={s.seeAllTxt}>すべて見る</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.bgGrouped, borderRadius: radius.lg, padding: spacing.lg },
  label: { ...typography.footnote, color: colors.labelTertiary, marginBottom: spacing.sm },
  goalRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  goalText: { ...typography.headline, color: colors.label, flex: 1, lineHeight: 24 },
  divider: { height: 1, backgroundColor: colors.separator, marginVertical: spacing.md },
  seeAll: { alignItems: "center", paddingVertical: 2 },
  seeAllTxt: { ...typography.subhead, color: colors.labelSecondary, fontWeight: "600" },
});
