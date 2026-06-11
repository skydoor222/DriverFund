import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../lib/theme";

export default function DriverLayout() {
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
      <Tabs.Screen name="dashboard" options={{
        title: "ホーム",
        tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size - 2} color={color} />,
      }} />
      <Tabs.Screen name="returns" options={{
        title: "お返し",
        tabBarIcon: ({ color, size }) => <Ionicons name="gift" size={size - 2} color={color} />,
      }} />
      <Tabs.Screen name="setup" options={{
        title: "プロフィール",
        tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size - 2} color={color} />,
      }} />
    </Tabs>
  );
}
