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
  gray2: "#555",
  gray3: "#888",
  gray5: "#E8E8E8",
  bg: "#F5F5F5",
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
  container: { flex: 1, backgroundColor: T.white, padding: 24, paddingTop: 56 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 32 },
  logoIcon: {
    width: 32, height: 32, backgroundColor: T.red, borderRadius: 7,
    alignItems: "center", justifyContent: "center",
  },
  logoText: { fontSize: 22, fontWeight: "900", color: T.dark, letterSpacing: 2 },
  title: { fontSize: 24, fontWeight: "900", color: T.dark, marginBottom: 24, textAlign: "center" },
  googleBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    borderWidth: 1.5, borderColor: T.gray5, borderRadius: 10,
    paddingVertical: 13, backgroundColor: T.white,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  googleIcon: {
    fontSize: 16, fontWeight: "900", color: T.dark,
    width: 22, height: 22, textAlign: "center", lineHeight: 22,
  },
  googleBtnText: { fontSize: 15, fontWeight: "600", color: T.dark },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: T.gray5 },
  dividerText: { fontSize: 12, color: T.gray3 },
  label: { fontSize: 12, fontWeight: "700", color: T.dark, marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: T.gray5, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
    color: T.dark, backgroundColor: T.bg,
  },
  errorText: { color: T.red, fontSize: 13, marginTop: 10, textAlign: "center" },
  btn: {
    backgroundColor: T.red, borderRadius: 10,
    paddingVertical: 14, alignItems: "center", marginTop: 24,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: T.white, fontSize: 15, fontWeight: "700" },
  forgotLink: { color: T.gray3, textAlign: "center", marginTop: 12, fontSize: 12, textDecorationLine: "underline" },
  link: { color: T.red, textAlign: "center", marginTop: 16, fontSize: 13, textDecorationLine: "underline" },
});
