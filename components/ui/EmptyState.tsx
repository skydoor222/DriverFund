import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../../lib/theme";
import { Button } from "./Button";

export function EmptyState({
  icon = "car-sport-outline",
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={s.wrap}>
      <View style={s.iconCircle}>
        <Ionicons name={icon} size={32} color={colors.labelTertiary} />
      </View>
      <Text style={s.title}>{title}</Text>
      {message ? <Text style={s.msg}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} fullWidth={false} size="md" style={{ marginTop: spacing.md }} />
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: 56, paddingHorizontal: 40, gap: spacing.sm },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.bgGrouped,
    alignItems: "center", justifyContent: "center", marginBottom: spacing.xs,
  },
  title: { ...typography.headline, color: colors.label, textAlign: "center" },
  msg: { ...typography.subhead, color: colors.labelTertiary, textAlign: "center", lineHeight: 21 },
});
