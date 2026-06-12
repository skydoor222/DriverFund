import { ScrollView, Pressable, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography, categoryColor } from "../../lib/theme";

export interface CategoryItem {
  key: string;          // "all" | "sf" | "f4" | "kart" | "other"
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const RACING_CATEGORIES: CategoryItem[] = [
  { key: "all", label: "すべて", icon: "flame" },
  { key: "sf", label: "SF", icon: "speedometer" },
  { key: "f4", label: "F4", icon: "car-sport" },
  { key: "kart", label: "カート", icon: "trophy" },
  { key: "other", label: "その他", icon: "ellipsis-horizontal" },
];

// ── 円アイコン横スクロール（さがすタブ）──
export function CategoryScroller({
  categories = RACING_CATEGORIES,
  selected,
  onSelect,
}: {
  categories?: CategoryItem[];
  selected?: string;
  onSelect?: (key: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.scroll}
    >
      {categories.map((c) => {
        const active = selected === c.key;
        const tint = c.key === "all" ? colors.flame : categoryColor[c.key] ?? colors.labelTertiary;
        return (
          <Pressable key={c.key} onPress={() => onSelect?.(c.key)} style={s.item}>
            <View style={[s.circle, active && { borderColor: tint, borderWidth: 2 }]}>
              <Ionicons name={c.icon} size={22} color={active ? tint : colors.labelSecondary} />
            </View>
            <Text style={[s.label, active && { color: colors.label, fontWeight: "700" }]}>{c.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ── チップ型横スクロール（ホーム上部フィルタ）──
export function CategoryChips({
  categories = RACING_CATEGORIES,
  selected,
  onSelect,
}: {
  categories?: CategoryItem[];
  selected?: string;
  onSelect?: (key: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipScroll}>
      {categories.map((c) => {
        const active = selected === c.key;
        return (
          <Pressable
            key={c.key}
            onPress={() => onSelect?.(c.key)}
            style={[s.chip, active && s.chipActive]}
          >
            <Text style={[s.chipTxt, active && s.chipTxtActive]}>{c.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.xl, gap: spacing.lg, paddingVertical: spacing.sm },
  item: { alignItems: "center", gap: 6, width: 60 },
  circle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surface,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.separator,
  },
  label: { ...typography.caption, color: colors.labelSecondary },

  chipScroll: { paddingHorizontal: spacing.xl, gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    paddingHorizontal: spacing.lg, paddingVertical: 7, borderRadius: radius.pill,
    backgroundColor: colors.bgGrouped,
  },
  chipActive: { backgroundColor: colors.label },
  chipTxt: { ...typography.footnote, fontWeight: "600", color: colors.labelSecondary },
  chipTxtActive: { color: colors.white },
});
