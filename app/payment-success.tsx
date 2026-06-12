import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, spacing, typography, radius } from "../lib/theme";
import { Button } from "../components/ui";

export default function PaymentSuccessScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="checkmark" size={56} color={colors.white} />
      </View>
      <Text style={styles.title}>応援ありがとうございます！</Text>
      <Text style={styles.body}>
        決済が完了しました。{"\n"}
        あなたの支援がドライバーの夢を後押しします。
      </Text>

      <View style={styles.actions}>
        <Button title="ホームに戻る" variant="primary"
          onPress={() => router.replace("/(tabs)")} />
        <Button title="気になるリストを見る" variant="ghost"
          onPress={() => router.replace("/(tabs)/saved")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: colors.bg,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: spacing.xxxl,
  },
  iconCircle: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: colors.success,
    alignItems: "center", justifyContent: "center", marginBottom: spacing.xxl,
  },
  title: { ...typography.title2, color: colors.label, textAlign: "center", marginBottom: spacing.md },
  body: { ...typography.callout, color: colors.labelTertiary, textAlign: "center", lineHeight: 24, marginBottom: spacing.huge },
  actions: { alignSelf: "stretch", gap: spacing.sm },
});
