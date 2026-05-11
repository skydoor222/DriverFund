import { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

const T = {
  red: "#E8002D",
  dark: "#0A0A0A",
  gray3: "#888",
  gray5: "#E8E8E8",
  bg: "#F5F5F5",
  white: "#FFFFFF",
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleReset() {
    if (!email) {
      setError("メールアドレスを入力してください");
      return;
    }
    setError("");
    setMessage("");
    setLoading(true);

    const redirectTo = typeof window !== "undefined"
      ? `${window.location.origin}/auth/reset-password`
      : "driverfund://auth/reset-password";

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setMessage("パスワードリセット用のメールを送信しました。メールを確認してください。");
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

        <Text style={styles.title}>パスワードをリセット</Text>
        <Text style={styles.subtitle}>
          登録したメールアドレスを入力してください。{"\n"}パスワードリセット用のリンクをお送りします。
        </Text>

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

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {message ? <Text style={styles.successText}>{message}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleReset}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading ? "送信中..." : "リセットメールを送信"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>ログイン画面に戻る</Text>
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
  title: { fontSize: 24, fontWeight: "900", color: T.dark, marginBottom: 12, textAlign: "center" },
  subtitle: { fontSize: 13, color: T.gray3, textAlign: "center", lineHeight: 20, marginBottom: 28 },
  label: { fontSize: 12, fontWeight: "700", color: T.dark, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: T.gray5, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
    color: T.dark, backgroundColor: T.bg,
  },
  errorText: { color: T.red, fontSize: 13, marginTop: 10, textAlign: "center" },
  successText: { color: "#22C55E", fontSize: 13, marginTop: 10, textAlign: "center", lineHeight: 20 },
  btn: {
    backgroundColor: T.red, borderRadius: 10,
    paddingVertical: 14, alignItems: "center", marginTop: 24,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: T.white, fontSize: 15, fontWeight: "700" },
  link: { color: T.red, textAlign: "center", marginTop: 16, fontSize: 13, textDecorationLine: "underline" },
});
