/**
 * /auth/callback
 * Google OAuthのリダイレクト先。
 * SupabaseがURLフラグメント(#access_token=...)を処理してセッションを確立する。
 * _layout.tsx の useEffect がセッションを検知して適切な画面へ遷移させる。
 */
import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Web: URLのハッシュフラグメントからセッションを取得
    if (typeof window !== "undefined") {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          // _layout.tsx の onAuthStateChange が遷移を処理するので待つだけ
        } else {
          // セッションが取れなかった場合はログインに戻す
          router.replace("/(auth)/login");
        }
      });
    }
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#E8002D" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
});
