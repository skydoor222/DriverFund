import { Text } from "react-native";
import { Tabs } from "expo-router";

export default function DriverLayout() {
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
        name="dashboard"
        options={{
          title: "ホーム",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size - 2, color }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="returns"
        options={{
          title: "お返し",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size - 2, color }}>🎁</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="setup"
        options={{
          title: "設定",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size - 2, color }}>⚙️</Text>
          ),
        }}
      />
    </Tabs>
  );
}
