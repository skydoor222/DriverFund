import { useEffect } from "react";
import { Platform } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";

function RootNavigator() {
  const { session, profile, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inCallbackGroup = segments[0] === "auth"; // /auth/callback

    if (!session && !inAuthGroup && !inCallbackGroup) {
      router.replace("/(auth)/welcome");
    } else if (session && (inAuthGroup || inCallbackGroup)) {
      if (profile?.role === "driver") {
        router.replace("/(driver)/dashboard");
      } else {
        router.replace("/(supporter)/discover");
      }
    }
  }, [session, profile, loading]);

  // Google OAuth新規ユーザー: profileが未作成の場合は自動作成
  useEffect(() => {
    if (!session) return;

    const user = session.user;
    const provider = user.app_metadata?.provider;
    if (provider !== "google") return;

    // profileが存在しない場合のみ作成
    supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (!data) {
          const fullName =
            user.user_metadata?.full_name ??
            user.user_metadata?.name ??
            user.email?.split("@")[0] ?? "";
          const avatarUrl = user.user_metadata?.avatar_url ?? null;
          supabase.from("profiles").insert({
            id: user.id,
            full_name: fullName,
            avatar_url: avatarUrl,
            role: "supporter", // Google登録は常にsupporter
          });
        }
      });
  }, [session]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(driver)" />
      <Stack.Screen name="(supporter)" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="driver/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="auth/reset-password" />
    </Stack>
  );
}

export default function RootLayout() {
  // useFonts を使わない: WebではCSSで自動ロード、ネイティブではバンドル内フォントを使用
  // useFonts がWebで永遠にresolveされないバグを回避

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0D0D0D" }}>
      <AuthProvider>
        <StatusBar style="light" backgroundColor="#0D0D0D" />
        <RootNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
