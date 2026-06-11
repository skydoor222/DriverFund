import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../../lib/theme";

// 画面トップの大見出し（iOS large title 風）
export function ScreenHeader({
  title, subtitle, right, onBack,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onBack?: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={10} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={colors.label} />
          </Pressable>
        ) : null}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={styles.right}>{right}</View>
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

// セクション見出し（赤アクセントバー付き）
export function SectionHeader({ title, note }: { title: string; note?: string }) {
  return (
    <View style={styles.section}>
      <View style={styles.accent} />
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {note ? <Text style={styles.sectionNote}>{note}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.xl, paddingTop: 56, paddingBottom: spacing.md },
  headerRow: { flexDirection: "row", alignItems: "center" },
  backBtn: { marginLeft: -6, marginRight: 2 },
  title: { ...typography.title1, color: colors.label, flex: 1 },
  right: { marginLeft: spacing.sm },
  subtitle: { ...typography.subhead, color: colors.labelTertiary, marginTop: 4 },

  section: { flexDirection: "row", alignItems: "flex-start", gap: 9, marginTop: spacing.xxxl, marginBottom: spacing.md },
  accent: { width: 3, height: 19, backgroundColor: colors.brand, borderRadius: 2, marginTop: 1 },
  sectionTitle: { ...typography.headline, color: colors.label },
  sectionNote: { ...typography.caption, color: colors.labelTertiary, marginTop: 3, lineHeight: 17 },
});
