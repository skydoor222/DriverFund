import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../lib/theme";

export default function SupporterLayout() {
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
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700", letterSpacing: 0.3 },
      }}
    >
      <Tabs.Screen name="discover" options={{
        title: "探す",
        tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size - 2} color={color} />,
      }} />
      <Tabs.Screen name="my-drivers" options={{
        title: "フィード",
        tabBarIcon: ({ color, size }) => <Ionicons name="newspaper-outline" size={size - 2} color={color} />,
      }} />
    </Tabs>
  );
}
