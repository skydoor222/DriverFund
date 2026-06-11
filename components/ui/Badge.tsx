import { StyleSheet, Text, View } from "react-native";
import { categoryColor, categoryShort, colors, radius } from "../../lib/theme";

// カテゴリバッジ（塗り）
export function CategoryBadge({ category, size = "md" }: { category: string; size?: "sm" | "md" }) {
  const color = categoryColor[category] ?? colors.catOther;
  const small = size === "sm";
  return (
    <View style={[styles.cat, { backgroundColor: color, paddingVertical: small ? 2 : 3, paddingHorizontal: small ? 6 : 8 }]}>
      <Text style={[styles.catText, { fontSize: small ? 9 : 10 }]}>{categoryShort[category] ?? "—"}</Text>
    </View>
  );
}

// 汎用ピル（月額/単発 等）
export function Pill({
  label, tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "brand" | "info" | "success" | "warning";
}) {
  const t = TONES[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      <Text style={[styles.pillText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const TONES = {
  neutral: { bg: colors.bgGrouped, fg: colors.labelSecondary },
  brand:   { bg: colors.brandTint, fg: colors.brand },
  info:    { bg: "#E5F1FF", fg: colors.info },
  success: { bg: "#E3F9E9", fg: "#248A3D" },
  warning: { bg: "#FFF4E5", fg: "#C77700" },
} as const;

const styles = StyleSheet.create({
  cat: { borderRadius: radius.sm - 2, alignSelf: "flex-start" },
  catText: { color: colors.white, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" },
  pill: { borderRadius: radius.sm - 2, paddingVertical: 3, paddingHorizontal: 8, alignSelf: "flex-start" },
  pillText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
});
