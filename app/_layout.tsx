import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import { Ionicons } from "@expo/vector-icons";
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
      <Stack.Screen name="driver/[id]" options={{ headerShown: true, title: "" }} />
      <Stack.Screen name="auth/reset-password" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
