import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Font from "expo-font";
import { Ionicons } from "@expo/vector-icons";
import { AuthProvider, useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { colors } from "../lib/theme";

function RootNavigator() {
  const { session, profile, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // ── 認証ガード ──
  // サポーター主役のため、未ログインでも (tabs) は自由に閲覧できる。
  // 保護するのは選手管理エリア (driver) のみ。
  useEffect(() => {
    if (loading) return;

    const root = segments[0];
    const inDriverArea = root === "(driver)";

    // 未ログインで選手管理エリアに入ろうとしたらログインへ
    if (!session && inDriverArea) {
      router.replace("/(auth)/login");
      return;
    }

    // ログイン直後に auth 画面に居続けないよう、ホームへ送る
    const inAuthGroup = root === "(auth)";
    if (session && inAuthGroup) {
      if (profile?.role === "driver") router.replace("/(driver)/dashboard");
      else router.replace("/(tabs)");
    }
  }, [session, profile, loading, segments]);

  // Google OAuth新規ユーザー: profileが未作成の場合は自動作成
  useEffect(() => {
    if (!session) return;
    const user = session.user;
    if (user.app_metadata?.provider !== "google") return;

    supabase.from("profiles").select("id").eq("id", user.id).single().then(({ data }) => {
      if (!data) {
        const fullName =
          user.user_metadata?.full_name ?? user.user_metadata?.name ??
          user.email?.split("@")[0] ?? "";
        supabase.from("profiles").insert({
          id: user.id,
          full_name: fullName,
          avatar_url: user.user_metadata?.avatar_url ?? null,
          role: "supporter",
        });
      }
    });
  }, [session]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(driver)" />
      <Stack.Screen name="(driver-onboard)" />
      <Stack.Screen name="auth/callback" />
      <Stack.Screen name="driver/[id]" />
      <Stack.Screen name="payment-success" />
      <Stack.Screen name="auth/reset-password" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = Font.useFonts({
    ...Ionicons.font,
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
