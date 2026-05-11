import { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";

const T = {
  red: "#E8002D",
  dark: "#0A0A0A",
  gray2: "#555",
  gray3: "#888",
  gray5: "#E8E8E8",
  bg: "#F5F5F5",
  white: "#FFFFFF",
};

export default function SignupScreen() {
  const router = useRouter();
  const { signInWithGoogle } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError(e.message ?? "Googleログインに失敗しました");
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleSignup() {
    if (!fullName || !email || !password) {
      setError("すべての項目を入力してください");
      return;
    }
    setError("");
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: "supporter" } },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (data.session) {
      router.replace("/(supporter)/discover");
    } else {
      setError("確認メールを送信しました。メールを確認してください。");
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}><Text style={{ fontSize: 18 }}>🏎</Text></View>
          <Text style={styles.logoText}>DriverFund</Text>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>アカウント作成</Text>
          <Text style={styles.subtitle}>ドライバーを応援するアカウントを作成します</Text>
        </View>

        {/* Google signup */}
        <TouchableOpacity
          style={[styles.googleBtn, googleLoading && styles.btnDisabled]}
          onPress={handleGoogle}
          disabled={googleLoading}
        >
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleBtnText}>
            {googleLoading ? "処理中..." : "Googleで登録"}
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>または</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Fields */}
        {([
          { id: "name", label: "名前", placeholder: "田中 健司", value: fullName, onChange: setFullName, secure: false, keyboard: "default" as const },
          { id: "email", label: "メールアドレス", placeholder: "tanaka@example.com", value: email, onChange: setEmail, secure: false, keyboard: "email-address" as const },
          { id: "pw", label: "パスワード（8文字以上）", placeholder: "••••••••", value: password, onChange: setPassword, secure: true, keyboard: "default" as const },
        ]).map((f) => (
          <View key={f.id} style={styles.fieldBlock}>
            <Text style={styles.label}>{f.label}</Text>
            <TextInput
              style={styles.input}
              value={f.value}
              onChangeText={f.onChange}
              placeholder={f.placeholder}
              placeholderTextColor={T.gray3}
              keyboardType={f.keyboard}
              secureTextEntry={f.secure}
              autoCapitalize="none"
            />
          </View>
        ))}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSignup}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? "登録中..." : "登録する"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
          <Text style={styles.link}>すでにアカウントをお持ちの方はこちら</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.white },
  content: { padding: 24, paddingTop: 56, paddingBottom: 60 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 24 },
  logoIcon: {
    width: 32, height: 32, backgroundColor: T.red, borderRadius: 7,
    alignItems: "center", justifyContent: "center",
  },
  logoText: { fontSize: 22, fontWeight: "900", color: T.dark, letterSpacing: 2 },
  titleBlock: { alignItems: "center", marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "900", color: T.dark, marginBottom: 6 },
  subtitle: { fontSize: 12, color: T.gray3, textAlign: "center" },
  googleBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    borderWidth: 1.5, borderColor: T.gray5, borderRadius: 10,
    paddingVertical: 13, backgroundColor: T.white,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    marginTop: 8,
  },
  googleIcon: {
    fontSize: 16, fontWeight: "900", color: T.dark,
    width: 22, height: 22, textAlign: "center", lineHeight: 22,
  },
  googleBtnText: { fontSize: 15, fontWeight: "600", color: T.dark },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: T.gray5 },
  dividerText: { fontSize: 12, color: T.gray3 },
  fieldBlock: { marginTop: 16 },
  label: { fontSize: 12, fontWeight: "700", color: T.dark, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: T.gray5, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
    color: T.dark, backgroundColor: T.bg,
  },
  errorText: { color: T.red, fontSize: 13, marginTop: 12, textAlign: "center" },
  btn: {
    backgroundColor: T.red, borderRadius: 10,
    paddingVertical: 14, alignItems: "center", marginTop: 28,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: T.white, fontSize: 15, fontWeight: "700", letterSpacing: 0.5 },
  link: { color: T.red, textAlign: "center", marginTop: 16, fontSize: 13, textDecorationLine: "underline" },
});
