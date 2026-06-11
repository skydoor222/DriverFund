import { useState } from "react";
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, Pressable, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { colors, spacing, typography, radius } from "../../lib/theme";
import { Button, Input } from "../../components/ui";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleReset() {
    if (!email) { setError("メールアドレスを入力してください"); return; }
    setError(""); setMessage(""); setLoading(true);

    const redirectTo = typeof window !== "undefined"
      ? `${window.location.origin}/auth/reset-password`
      : "driverfund://auth/reset-password";

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);
    if (error) setError(error.message);
    else setMessage("パスワードリセット用のメールを送信しました。メールを確認してください。");
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color={colors.label} />
        </Pressable>

        <Text style={styles.title}>パスワードをリセット</Text>
        <Text style={styles.subtitle}>
          登録したメールアドレスを入力してください。{"\n"}リセット用のリンクをお送りします。
        </Text>

        <Input label="メールアドレス" value={email} onChangeText={setEmail}
          placeholder="example@email.com" keyboardType="email-address" autoCapitalize="none"
          error={error || undefined} />

        {message ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.successText}>{message}</Text>
          </View>
        ) : null}

        <Button title={loading ? "送信中..." : "リセットメールを送信"} loading={loading}
          onPress={handleReset} style={{ marginTop: spacing.sm }} />

        <Pressable onPress={() => router.back()}
          style={({ pressed }) => [styles.link, pressed && { opacity: 0.6 }]}>
          <Text style={styles.linkText}>ログイン画面に戻る</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xxl, paddingTop: 56 },
  back: { marginLeft: -6, marginBottom: spacing.lg },
  title: { ...typography.title1, color: colors.label, marginBottom: spacing.sm },
  subtitle: { ...typography.subhead, color: colors.labelTertiary, lineHeight: 21, marginBottom: spacing.xxl },
  successBox: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: "#E3F9E9", borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md,
  },
  successText: { ...typography.footnote, color: "#248A3D", flex: 1, lineHeight: 18 },
  link: { marginTop: spacing.xl, alignItems: "center" },
  linkText: { ...typography.footnote, color: colors.brand, fontWeight: "600" },
});
