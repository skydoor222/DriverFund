import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth";
import { colors, spacing, typography, radius, shadow } from "../../lib/theme";
import { Button } from "../../components/ui";

const BENEFITS: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  { icon: "heart", title: "ファンから月額で応援を集める", body: "サブスク型だから、毎月安定した活動資金に。単発支援も受け取れます。" },
  { icon: "megaphone", title: "あなたの挑戦を発信できる", body: "レース速報や舞台裏を投稿。ファンが毎日あなたをチェックしに来ます。" },
  { icon: "gift", title: "応援プランを自由に設計", body: "サイン入りグッズ、ピット見学、マシンロゴ掲出など、お返しを自分で設定。" },
  { icon: "card", title: "決済・入金まで自動", body: "Stripe連携で安全に決済。面倒な請求管理は不要です。" },
];

export default function DriverOnboardWelcome() {
  const router = useRouter();
  const { session, profile } = useAuth();

  function start() {
    // 既にログイン済みなら直接プロフィール作成へ、未ログインなら選手としてサインアップ
    if (session) {
      router.push("/(driver-onboard)/setup");
    } else {
      router.push("/(auth)/signup?role=driver");
    }
  }

  return (
    <View style={s.root}>
      <Pressable onPress={() => router.back()} style={s.back} hitSlop={10}>
        <Ionicons name="close" size={26} color={colors.label} />
      </Pressable>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <View style={s.heroIcon}>
            <Ionicons name="car-sport" size={36} color={colors.brand} />
          </View>
          <Text style={s.title}>ドライバーとして{"\n"}応援を集めよう</Text>
          <Text style={s.subtitle}>
            レーシングドライバー専門の応援プラットフォーム。{"\n"}
            あなたの挑戦に、ファンの力を。
          </Text>
        </View>

        <View style={s.benefits}>
          {BENEFITS.map((b, i) => (
            <View key={i} style={s.benefitCard}>
              <View style={s.benefitIcon}>
                <Ionicons name={b.icon} size={20} color={colors.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.benefitTitle}>{b.title}</Text>
                <Text style={s.benefitBody}>{b.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={s.steps}>
          <Text style={s.stepsTitle}>登録は3ステップ</Text>
          {["アカウント登録", "プロフィール・写真を入力", "応援プランを設定して公開"].map((step, i) => (
            <View key={i} style={s.stepRow}>
              <View style={s.stepNum}><Text style={s.stepNumTxt}>{i + 1}</Text></View>
              <Text style={s.stepTxt}>{step}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={s.footer}>
        <Button
          title={session ? "プロフィールを作成する" : "ドライバー登録を始める"}
          icon="arrow-forward"
          onPress={start}
        />
        {!session && (
          <Pressable onPress={() => router.push("/(auth)/login")} style={s.loginLink}>
            <Text style={s.loginTxt}>すでにアカウントをお持ちの方</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  back: { position: "absolute", top: 50, right: spacing.lg, zIndex: 10, padding: 4 },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: 80, paddingBottom: 20 },

  hero: { alignItems: "center", marginBottom: spacing.xxl },
  heroIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: colors.brandTint,
    alignItems: "center", justifyContent: "center", marginBottom: spacing.lg,
  },
  title: { ...typography.title1, color: colors.label, textAlign: "center", lineHeight: 36 },
  subtitle: { ...typography.subhead, color: colors.labelTertiary, textAlign: "center", lineHeight: 22, marginTop: spacing.md },

  benefits: { gap: spacing.md, marginBottom: spacing.xxl },
  benefitCard: {
    flexDirection: "row", gap: spacing.md, backgroundColor: colors.surface,
    borderRadius: radius.lg, padding: spacing.lg, ...shadow.sm,
  },
  benefitIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brandTint,
    alignItems: "center", justifyContent: "center",
  },
  benefitTitle: { ...typography.headline, color: colors.label, marginBottom: 3 },
  benefitBody: { ...typography.footnote, color: colors.labelTertiary, lineHeight: 19 },

  steps: { backgroundColor: colors.bgGrouped, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  stepsTitle: { ...typography.headline, color: colors.label, marginBottom: spacing.xs },
  stepRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  stepNumTxt: { color: colors.white, ...typography.footnote, fontWeight: "800" },
  stepTxt: { ...typography.subhead, color: colors.labelSecondary },

  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: 32, borderTopWidth: 1, borderTopColor: colors.separator },
  loginLink: { alignItems: "center", marginTop: spacing.md },
  loginTxt: { ...typography.footnote, color: colors.brand, fontWeight: "600" },
});
