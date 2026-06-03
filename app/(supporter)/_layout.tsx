import { View, Text } from "react-native";
import { Tabs } from "expo-router";

function SearchIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 24, height: 24, alignItems: "center", justifyContent: "center" }}>
      <View style={{
        width: 14, height: 14, borderRadius: 7,
        borderWidth: 2, borderColor: color,
      }} />
      <View style={{
        position: "absolute", bottom: 1, right: 1,
        width: 7, height: 2, borderRadius: 1,
        backgroundColor: color,
        transform: [{ rotate: "45deg" }, { translateX: 2 }],
      }} />
    </View>
  );
}

function FeedIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 24, height: 20, justifyContent: "space-between" }}>
      <View style={{ height: 2, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ height: 2, backgroundColor: color, borderRadius: 1, opacity: 0.7 }} />
      <View style={{ height: 2, width: "70%", backgroundColor: color, borderRadius: 1, opacity: 0.5 }} />
    </View>
  );
}

export default function SupporterLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "#555555",
        tabBarStyle: {
          backgroundColor: "#0D0D0D",
          borderTopColor: "#222222",
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 24,
          paddingTop: 8,
          marginBottom: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: "探す",
          tabBarIcon: ({ color }) => <SearchIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-drivers"
        options={{
          title: "フィード",
          tabBarIcon: ({ color }) => <FeedIcon color={color} />,
        }}
      />
    </Tabs>
  );
}
