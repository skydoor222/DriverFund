import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadow } from "../../lib/theme";

type Variant = "primary" | "secondary" | "tinted" | "ghost" | "danger";
type Size = "lg" | "md" | "sm";

export function Button({
  title, onPress, variant = "primary", size = "lg",
  loading = false, disabled = false, icon, style, fullWidth = true,
}: {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  fullWidth?: boolean;
}) {
  const isDisabled = disabled || loading;
  const v = VARIANTS[variant];
  const s = SIZES[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { paddingVertical: s.py, paddingHorizontal: s.px, borderRadius: s.radius },
        v.container,
        variant === "primary" && shadow.brand,
        fullWidth && { alignSelf: "stretch" },
        pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
        isDisabled && { opacity: 0.4 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text.color} size="small" />
      ) : (
        <View style={styles.row}>
          {icon && <Ionicons name={icon} size={s.fontSize + 2} color={v.text.color} style={{ marginRight: 8 }} />}
          <Text style={[styles.text, { fontSize: s.fontSize }, v.text]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const VARIANTS: Record<Variant, { container: ViewStyle; text: { color: string } }> = {
  primary:   { container: { backgroundColor: colors.brand }, text: { color: colors.white } },
  secondary: { container: { backgroundColor: colors.bgGrouped }, text: { color: colors.label } },
  tinted:    { container: { backgroundColor: colors.brandTint }, text: { color: colors.brand } },
  ghost:     { container: { backgroundColor: "transparent" }, text: { color: colors.brand } },
  danger:    { container: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.danger }, text: { color: colors.danger } },
};

const SIZES: Record<Size, { py: number; px: number; fontSize: number; radius: number }> = {
  lg: { py: 16, px: 24, fontSize: 16, radius: radius.md },
  md: { py: 12, px: 18, fontSize: 15, radius: radius.sm },
  sm: { py: 8,  px: 14, fontSize: 13, radius: radius.sm },
};

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  text: { fontWeight: "600", letterSpacing: 0.5 },
});
