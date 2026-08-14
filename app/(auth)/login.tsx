import { useState } from "react";
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, Pressable, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { colors, spacing, typography, radius } from "../../lib/theme";
import { Button, Input } from "../../components/ui";

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } catch (e: any) {
      setError(
        "サーバーに接続できませんでした。通信環境を確認してもう一度お試しください。",
      );
      console.warn("login failed", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    try { await signInWithGoogle(); }
    catch (e: any) { setError(e.message ?? "Googleログインに失敗しました"); }
    finally { setGoogleLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color={colors.label} />
        </Pressable>

        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Ionicons name="car-sport" size={20} color={colors.white} />
          </View>
          <Text style={styles.logoText}>
            Driver<Text style={{ color: colors.brand }}>Fund</Text>
          </Text>
        </View>

        <Text style={styles.title}>ログイン</Text>

        <Button title={googleLoading ? "ログイン中..." : "Googleでログイン"} variant="secondary"
          icon="logo-google" onPress={handleGoogle} loading={googleLoading} />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>または</Text>
          <View style={styles.dividerLine} />
        </View>

        <Input label="メールアドレス" value={email} onChangeText={setEmail}
          placeholder="example@email.com" keyboardType="email-address" autoCapitalize="none" />
        <Input label="パスワード" value={password} onChangeText={setPassword}
          placeholder="••••••••" secureTextEntry autoCapitalize="none" />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button title="ログイン" variant="primary" loading={loading}
          onPress={handleLogin} style={{ marginTop: spacing.md }} />

        <Pressable onPress={() => router.push("/(auth)/forgot-password")}
          style={({ pressed }) => [styles.forgot, pressed && { opacity: 0.6 }]}>
          <Text style={styles.forgotText}>パスワードをお忘れの方はこちら</Text>
        </Pressable>

        <Pressable onPress={() => router.replace("/(auth)/signup")}
          style={({ pressed }) => [styles.link, pressed && { opacity: 0.6 }]}>
          <Text style={styles.linkText}>アカウントをお持ちでない方はこちら</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xxl, paddingTop: 56, paddingBottom: 48 },
  back: { marginLeft: -6, marginBottom: spacing.lg },
  logoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, justifyContent: "center", marginBottom: spacing.xxl },
  logoIcon: {
    width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.brand,
    alignItems: "center", justifyContent: "center",
  },
  logoText: { fontSize: 22, fontWeight: "900", color: colors.label, letterSpacing: 0.5 },
  title: { ...typography.title1, color: colors.label, textAlign: "center", marginBottom: spacing.xxl },
  divider: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginVertical: spacing.xxl },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.separator },
  dividerText: { ...typography.caption, color: colors.labelTertiary },
  error: { ...typography.footnote, color: colors.danger, marginBottom: spacing.md, textAlign: "center" },
  forgot: { marginTop: spacing.lg, alignItems: "center" },
  forgotText: { ...typography.caption, color: colors.labelTertiary },
  link: { marginTop: spacing.lg, alignItems: "center" },
  linkText: { ...typography.footnote, color: colors.brand, fontWeight: "600" },
});
