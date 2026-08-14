import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { colors } from "../../lib/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.labelTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.separator,
          borderTopWidth: 1,
          height: Platform.OS === "web" ? 72 : 84,
          paddingBottom: Platform.OS === "web" ? 12 : 28,
          paddingTop: 8,
        },
        // 「マイページ」など長めのラベルが省略されないよう、
        // 文字詰めを解除し折り返しを禁止する
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 0,
          width: "100%",
          textAlign: "center",
        },
        tabBarItemStyle: { paddingHorizontal: 2 },
      }}
    >
      <Tabs.Screen name="index" options={{
        title: "ホーム",
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? "home" : "home-outline"} size={23} color={color} />
        ),
      }} />
      <Tabs.Screen name="new" options={{
        title: "新着",
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? "sparkles" : "sparkles-outline"} size={23} color={color} />
        ),
      }} />
      <Tabs.Screen name="search" options={{
        title: "さがす",
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? "search" : "search-outline"} size={23} color={color} />
        ),
      }} />
      <Tabs.Screen name="saved" options={{
        title: "気になる",
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? "heart" : "heart-outline"} size={23} color={color} />
        ),
      }} />
      <Tabs.Screen name="account" options={{
        title: "マイページ",
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? "person" : "person-outline"} size={23} color={color} />
        ),
      }} />
    </Tabs>
  );
}
