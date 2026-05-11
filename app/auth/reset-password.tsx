/**
 * /auth/reset-password
 * パスワードリセットメールのリンクからリダイレクトされてくる画面。
 * Supabaseがセッションを確立した後、新しいパスワードを設定させる。
 */
import { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
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

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Supabaseがハッシュフラグメントからセッションを復元するのを待つ
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      } else {
        // セッションなし → ログインへ
        router.replace("/(auth)/login");
      }
    });
  }, []);

  async function handleUpdate() {
    if (!password || !confirm) {
      setError("パスワードを入力してください");
      return;
    }
    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください");
      return;
    }
    if (password !== confirm) {
      setError("パスワードが一致しません");
      return;
    }
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => router.replace("/(auth)/login"), 2000);
    }
  }

  if (!sessionReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={T.red} />
      </View>
    );
  }

  if (success) {
    return (
      <View style={styles.center}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.successTitle}>パスワードを更新しました</Text>
        <Text style={styles.successSub}>ログイン画面に戻ります...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}><Text style={{ fontSize: 18 }}>🏎</Text></View>
          <Text style={styles.logoText}>DriverFund</Text>
        </View>

        <Text style={styles.title}>新しいパスワードを設定</Text>

        <Text style={styles.label}>新しいパスワード（8文字以上）</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={T.gray3}
          secureTextEntry
        />

        <Text style={styles.label}>パスワード確認</Text>
        <TextInput
          style={styles.input}
          value={confirm}
          onChangeText={setConfirm}
          placeholder="••••••••"
          placeholderTextColor={T.gray3}
          secureTextEntry
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleUpdate}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading ? "更新中..." : "パスワードを更新"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.white, padding: 24, paddingTop: 56 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: T.white },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 32 },
  logoIcon: {
    width: 32, height: 32, backgroundColor: T.red, borderRadius: 7,
    alignItems: "center", justifyContent: "center",
  },
  logoText: { fontSize: 22, fontWeight: "900", color: T.dark, letterSpacing: 2 },
  title: { fontSize: 24, fontWeight: "900", color: T.dark, marginBottom: 24, textAlign: "center" },
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
  successIcon: { fontSize: 56, color: "#22C55E", marginBottom: 16 },
  successTitle: { fontSize: 20, fontWeight: "900", color: T.dark, marginBottom: 8 },
  successSub: { fontSize: 13, color: T.gray3 },
});
