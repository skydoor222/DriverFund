import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, shadow, typography } from "../../lib/theme";

// iOS 風セグメンテッドコントロール
export function SegmentedControl<T extends string>({
  options, value, onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.track}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.segment, active && [styles.segmentActive, shadow.sm]]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    backgroundColor: colors.bgGrouped,
    borderRadius: radius.sm + 1,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm - 1,
  },
  segmentActive: { backgroundColor: colors.white },
  label: { ...typography.subhead, fontWeight: "600", color: colors.labelTertiary },
  labelActive: { color: colors.label, fontWeight: "700" },
});
