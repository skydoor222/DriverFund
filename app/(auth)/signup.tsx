import { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { colors, spacing, typography, radius } from "../../lib/theme";
import { Button, Input, Pill } from "../../components/ui";

export default function SignupScreen() {
  const router = useRouter();
  const { role: roleParam } = useLocalSearchParams<{ role?: string }>();
  const role = roleParam === "driver" ? "driver" : "supporter";
  const isDriver = role === "driver";
  const { signInWithGoogle } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogle() {
    setGoogleLoading(true);
    try { await signInWithGoogle(); }
    catch (e: any) { setError(e.message ?? "Googleログインに失敗しました"); }
    finally { setGoogleLoading(false); }
  }

  async function handleSignup() {
    if (!fullName || !email || !password) {
      setError("すべての項目を入力してください");
      return;
    }
    setError("");
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, role } },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (data.session) {
      await supabase.from("profiles").upsert(
        { id: data.session.user.id, full_name: fullName, email, role },
        { onConflict: "id" },
      );
      router.replace(isDriver ? "/(driver)/setup" : "/(supporter)/discover");
    } else {
      setError("確認メールを送信しました。メールを確認してください。");
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color={colors.label} />
        </Pressable>

        <View style={styles.titleBlock}>
          {isDriver && <View style={{ marginBottom: spacing.md }}><Pill label="DRIVER" tone="brand" /></View>}
          <Text style={styles.title}>{isDriver ? "ドライバー登録" : "アカウント作成"}</Text>
          <Text style={styles.subtitle}>
            {isDriver ? "あなたのドライバーページを作成します" : "ドライバーを応援するアカウントを作成します"}
          </Text>
        </View>

        <Button title={googleLoading ? "処理中..." : "Googleで登録"} variant="secondary"
          icon="logo-google" onPress={handleGoogle} loading={googleLoading} />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>または</Text>
          <View style={styles.dividerLine} />
        </View>

        <Input label="名前" value={fullName} onChangeText={setFullName} placeholder="田中 健司" />
        <Input label="メールアドレス" value={email} onChangeText={setEmail}
          placeholder="tanaka@example.com" keyboardType="email-address" autoCapitalize="none" />
        <Input label="パスワード（8文字以上）" value={password} onChangeText={setPassword}
          placeholder="••••••••" secureTextEntry autoCapitalize="none" />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button title={isDriver ? "ドライバー登録する" : "登録する"} variant="primary"
          loading={loading} onPress={handleSignup} style={{ marginTop: spacing.md }} />

        <Pressable onPress={() => router.replace("/(auth)/login")}
          style={({ pressed }) => [styles.link, pressed && { opacity: 0.6 }]}>
          <Text style={styles.linkText}>すでにアカウントをお持ちの方はこちら</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xxl, paddingTop: 56, paddingBottom: 48 },
  back: { marginLeft: -6, marginBottom: spacing.lg },
  titleBlock: { marginBottom: spacing.xxl },
  title: { ...typography.title1, color: colors.label, marginBottom: 6 },
  subtitle: { ...typography.subhead, color: colors.labelTertiary },
  divider: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginVertical: spacing.xxl },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.separator },
  dividerText: { ...typography.caption, color: colors.labelTertiary },
  error: { ...typography.footnote, color: colors.danger, marginBottom: spacing.md, textAlign: "center" },
  link: { marginTop: spacing.xl, alignItems: "center" },
  linkText: { ...typography.footnote, color: colors.brand, fontWeight: "600" },
});
