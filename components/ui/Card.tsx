import { Pressable, StyleSheet, View, ViewStyle } from "react-native";
import { colors, radius, shadow, spacing } from "../../lib/theme";

export function Card({
  children, onPress, style, padded = true, elevated = true,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padded?: boolean;
  elevated?: boolean;
}) {
  const content = (
    <View
      style={[
        styles.card,
        padded && { padding: spacing.lg },
        elevated ? shadow.sm : styles.bordered,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.92, transform: [{ scale: 0.995 }] }}>
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  },
  bordered: { borderWidth: 1, borderColor: colors.separator },
});
