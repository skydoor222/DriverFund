import { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";

const T = {
  red: "#E8002D",
  dark: "#0A0A0A",
  dark2: "#111111",
  dark3: "#1A1A1A",
  dark4: "#222222",
  gray2: "#555",
  gray3: "#666",
  gray4: "#999",
  gray5: "#2A2A2A",
  bg: "#141414",
  white: "#FFFFFF",
};

export default function SignupScreen() {
  const router = useRouter();
  const { role: roleParam } = useLocalSearchParams<{ role?: string }>();
  const role = roleParam === "driver" ? "driver" : "supporter";
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
      options: { data: { full_name: fullName, role } },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (data.session) {
      // profileをupsert（auth triggerが遅い場合の保険）
      await supabase.from("profiles").upsert({
        id: data.session.user.id,
        full_name: fullName,
        email,
        role,
      }, { onConflict: "id" });

      if (role === "driver") {
        router.replace("/(driver)/setup");
      } else {
        router.replace("/(supporter)/discover");
      }
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
          <Text style={styles.title}>{role === "driver" ? "ドライバー登録" : "アカウント作成"}</Text>
          <Text style={styles.subtitle}>
            {role === "driver"
              ? "🏎  ドライバーとしてページを作成します"
              : "ドライバーを応援するアカウントを作成します"}
          </Text>
          {role === "driver" && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>DRIVER</Text>
            </View>
          )}
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
          <Text style={styles.btnText}>
            {loading ? "登録中..." : role === "driver" ? "ドライバー登録する" : "登録する"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
          <Text style={styles.link}>すでにアカウントをお持ちの方はこちら</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.dark },
  content: { padding: 28, paddingTop: 64, paddingBottom: 60 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 32 },
  logoIcon: {
    width: 34, height: 34, backgroundColor: T.red, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    shadowColor: T.red, shadowOpacity: 0.5, shadowRadius: 10, elevation: 6,
  },
  logoText: { fontSize: 22, fontWeight: "900", color: T.white, letterSpacing: 2 },
  titleBlock: { alignItems: "center", marginBottom: 28 },
  title: { fontSize: 26, fontWeight: "900", color: T.white, marginBottom: 8, letterSpacing: 0.5 },
  subtitle: { fontSize: 13, color: T.gray3, textAlign: "center" },
  roleBadge: {
    marginTop: 10, backgroundColor: T.red, borderRadius: 6,
    paddingVertical: 3, paddingHorizontal: 10, alignSelf: "center",
  },
  roleBadgeText: { color: T.white, fontSize: 10, fontWeight: "800", letterSpacing: 2 },
  googleBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    borderWidth: 1, borderColor: T.gray5, borderRadius: 12,
    paddingVertical: 14, backgroundColor: T.dark3,
    marginTop: 8,
  },
  googleIcon: {
    fontSize: 16, fontWeight: "900", color: T.white,
    width: 22, height: 22, textAlign: "center", lineHeight: 22,
  },
  googleBtnText: { fontSize: 15, fontWeight: "600", color: T.white },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: T.gray5 },
  dividerText: { fontSize: 12, color: T.gray3 },
  fieldBlock: { marginTop: 18 },
  label: { fontSize: 11, fontWeight: "700", color: T.gray4, marginBottom: 8, letterSpacing: 1, textTransform: "uppercase" },
  input: {
    borderWidth: 1, borderColor: T.gray5, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15,
    color: T.white, backgroundColor: T.dark3,
  },
  errorText: { color: T.red, fontSize: 13, marginTop: 12, textAlign: "center" },
  btn: {
    backgroundColor: T.red, borderRadius: 12,
    paddingVertical: 16, alignItems: "center", marginTop: 32,
    shadowColor: T.red, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: T.white, fontSize: 15, fontWeight: "800", letterSpacing: 0.5 },
  link: { color: T.red, textAlign: "center", marginTop: 20, fontSize: 13, fontWeight: "600" },
});
