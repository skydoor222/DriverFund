import { Stack } from "expo-router";
import { colors } from "../../lib/theme";

export default function DriverOnboardLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="setup" />
    </Stack>
  );
}
