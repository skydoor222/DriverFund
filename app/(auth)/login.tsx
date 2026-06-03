import { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
  }

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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}><Text style={{ fontSize: 18 }}>🏎</Text></View>
          <Text style={styles.logoText}>DriverFund</Text>
        </View>

        <Text style={styles.title}>ログイン</Text>

        {/* Google login */}
        <TouchableOpacity
          style={[styles.googleBtn, googleLoading && styles.btnDisabled]}
          onPress={handleGoogle}
          disabled={googleLoading}
        >
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleBtnText}>
            {googleLoading ? "ログイン中..." : "Googleでログイン"}
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>または</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email / Password */}
        <Text style={styles.label}>メールアドレス</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="example@email.com"
          placeholderTextColor={T.gray3}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>パスワード</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={T.gray3}
          secureTextEntry
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? "ログイン中..." : "ログイン"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")}>
          <Text style={styles.forgotLink}>パスワードをお忘れの方はこちら</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/(auth)/signup")}>
          <Text style={styles.link}>アカウントをお持ちでない方はこちら</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.dark, padding: 28, paddingTop: 64 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 40 },
  logoIcon: {
    width: 34, height: 34, backgroundColor: T.red, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    shadowColor: T.red, shadowOpacity: 0.5, shadowRadius: 10, elevation: 6,
  },
  logoText: { fontSize: 22, fontWeight: "900", color: T.white, letterSpacing: 2 },
  title: { fontSize: 26, fontWeight: "900", color: T.white, marginBottom: 28, textAlign: "center", letterSpacing: 0.5 },
  googleBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    borderWidth: 1, borderColor: T.gray5, borderRadius: 12,
    paddingVertical: 14, backgroundColor: T.dark3,
  },
  googleIcon: {
    fontSize: 16, fontWeight: "900", color: T.white,
    width: 22, height: 22, textAlign: "center", lineHeight: 22,
  },
  googleBtnText: { fontSize: 15, fontWeight: "600", color: T.white },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: T.gray5 },
  dividerText: { fontSize: 12, color: T.gray3 },
  label: { fontSize: 11, fontWeight: "700", color: T.gray4, marginTop: 18, marginBottom: 8, letterSpacing: 1, textTransform: "uppercase" },
  input: {
    borderWidth: 1, borderColor: T.gray5, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15,
    color: T.white, backgroundColor: T.dark3,
  },
  errorText: { color: T.red, fontSize: 13, marginTop: 12, textAlign: "center" },
  btn: {
    backgroundColor: T.red, borderRadius: 12,
    paddingVertical: 16, alignItems: "center", marginTop: 28,
    shadowColor: T.red, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: T.white, fontSize: 15, fontWeight: "800", letterSpacing: 0.5 },
  forgotLink: { color: T.gray3, textAlign: "center", marginTop: 16, fontSize: 12 },
  link: { color: T.red, textAlign: "center", marginTop: 20, fontSize: 13, fontWeight: "600" },
});
