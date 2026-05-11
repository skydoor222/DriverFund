import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function SupporterLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#E8002D",
        tabBarInactiveTintColor: "#555555",
        tabBarStyle: {
          backgroundColor: "#111111",
          borderTopColor: "#222222",
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: "探す",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-drivers"
        options={{
          title: "マイ選手",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flag" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
