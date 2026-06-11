import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, radius } from "../../lib/theme";
import { Button } from "../../components/ui";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* ── ロゴ＋コピー ── */}
      <View style={styles.hero}>
        <View style={styles.logoIcon}>
          <Ionicons name="car-sport" size={36} color={colors.white} />
        </View>
        <Text style={styles.logo}>
          Driver<Text style={{ color: colors.brand }}>Fund</Text>
        </Text>
        <Text style={styles.tagline}>走る夢を、直接支援する</Text>

        <Text style={styles.copy}>ドライバーに、{"\n"}直接届ける応援を。</Text>
        <Text style={styles.copyBody}>
          サイン入りグッズ・ピット見学・マシンロゴ掲載。{"\n"}
          あなたの支援がドライバーの夢を叶える。
        </Text>
      </View>

      {/* ── ボタン ── */}
      <View style={styles.buttons}>
        <Button title="ドライバーを応援する" icon="heart"
          onPress={() => router.push({ pathname: "/(auth)/signup", params: { role: "supporter" } })} />

        <Pressable
          onPress={() => router.push({ pathname: "/(auth)/signup", params: { role: "driver" } })}
          style={({ pressed }) => [styles.driverLink, pressed && { opacity: 0.6 }]}>
          <Text style={styles.driverLinkText}>ドライバーとして登録する</Text>
        </Pressable>

        <Pressable onPress={() => router.push("/(auth)/login")}
          style={({ pressed }) => pressed && { opacity: 0.6 }}>
          <Text style={styles.loginLink}>すでにアカウントをお持ちの方</Text>
        </Pressable>

        <Text style={styles.legal}>続けることで利用規約・プライバシーポリシーに同意します</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, justifyContent: "space-between" },
  hero: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xxxl },
  logoIcon: {
    width: 76, height: 76, borderRadius: radius.xl, backgroundColor: colors.brand,
    alignItems: "center", justifyContent: "center", marginBottom: spacing.xl,
    shadowColor: colors.brand, shadowOpacity: 0.3, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  logo: { fontSize: 40, fontWeight: "900", color: colors.label, letterSpacing: 0.5 },
  tagline: { ...typography.footnote, color: colors.labelTertiary, marginTop: spacing.sm, letterSpacing: 1, marginBottom: spacing.huge },
  copy: { ...typography.title1, color: colors.label, textAlign: "center", lineHeight: 38, marginBottom: spacing.md },
  copyBody: { ...typography.subhead, color: colors.labelTertiary, textAlign: "center", lineHeight: 22 },

  buttons: { paddingHorizontal: spacing.xxl, paddingBottom: 44, gap: spacing.lg },
  driverLink: { alignItems: "center", paddingVertical: 2 },
  driverLinkText: { ...typography.subhead, color: colors.labelSecondary, fontWeight: "600" },
  loginLink: { ...typography.footnote, color: colors.labelTertiary, textAlign: "center" },
  legal: { fontSize: 11, color: colors.labelQuaternary, textAlign: "center", marginTop: -4 },
});
