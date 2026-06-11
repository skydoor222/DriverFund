import { useState } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from "react-native";
import { colors, radius, spacing, typography } from "../../lib/theme";

export function Input({
  label, hint, error, multiline, style, containerStyle, ...props
}: TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
  containerStyle?: ViewStyle;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        {...props}
        multiline={multiline}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        placeholderTextColor={colors.labelQuaternary}
        style={[
          styles.input,
          multiline && styles.multiline,
          focused && styles.focused,
          error && styles.errored,
          style,
        ]}
      />
      {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label: {
    ...typography.footnote,
    fontWeight: "600",
    color: colors.labelSecondary,
    marginBottom: 7,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    fontSize: 16,
    color: colors.label,
  },
  multiline: { minHeight: 110, paddingTop: 13, textAlignVertical: "top", lineHeight: 23 },
  focused: { borderColor: colors.brand, backgroundColor: colors.white },
  errored: { borderColor: colors.danger },
  hint: { ...typography.caption, color: colors.labelTertiary, marginTop: 6, lineHeight: 17 },
  error: { ...typography.caption, color: colors.danger, marginTop: 6 },
});
