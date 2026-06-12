import { View, TextInput, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "../../lib/theme";

export function SearchBar({
  value,
  onChangeText,
  placeholder = "選手を探す",
  onSubmit,
  editable = true,
  onPress,
}: {
  value?: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  editable?: boolean;
  onPress?: () => void;       // 非編集時に押すとさがすタブへ遷移、等
}) {
  const inner = (
    <View style={s.bar} pointerEvents={editable ? "auto" : "none"}>
      <Ionicons name="search" size={18} color={colors.labelTertiary} />
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.labelTertiary}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        editable={editable}
      />
      {value ? (
        <Pressable onPress={() => onChangeText?.("")} hitSlop={8}>
          <Ionicons name="close-circle" size={18} color={colors.labelQuaternary} />
        </Pressable>
      ) : null}
    </View>
  );
  if (!editable && onPress) {
    return <Pressable onPress={onPress}>{inner}</Pressable>;
  }
  return inner;
}

const s = StyleSheet.create({
  bar: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.bgGrouped, borderRadius: radius.md,
    paddingHorizontal: spacing.md, height: 44,
  },
  input: { flex: 1, ...typography.body, color: colors.label, padding: 0 },
});
