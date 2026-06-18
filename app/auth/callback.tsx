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
    if (typeof window === "undefined") return;

    async function handleCallback() {
      // URLフラグメント(#access_token=...) or クエリ(?code=...) を処理
      const hash = window.location.hash;
      const search = window.location.search;

      if (hash && hash.includes("access_token")) {
        // implicit flow: フラグメントからセッションを確立
        const { error } = await supabase.auth.getSession();
        if (error) { router.replace("/(auth)/login"); return; }
      } else if (search && search.includes("code=")) {
        // PKCE flow: codeをセッションに交換
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) { router.replace("/(auth)/login"); return; }
      }

      // セッション確認して遷移
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/(auth)/login"); return; }

      // profileのroleに応じて振り分け
      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", session.user.id).maybeSingle();

      if (profile?.role === "driver") {
        router.replace("/(driver)/dashboard");
      } else {
        router.replace("/(tabs)");
      }
    }

    handleCallback();
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
