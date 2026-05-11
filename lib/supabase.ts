import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

async function getStorage() {
  if (Platform.OS === "web") return undefined; // use default localStorage
  const SecureStore = await import("expo-secure-store");
  return {
    getItem: (key: string) => SecureStore.getItemAsync(key),
    setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
    removeItem: (key: string) => SecureStore.deleteItemAsync(key),
  };
}

const storage = Platform.OS === "web"
  ? undefined
  : {
      getItem: async (key: string) => {
        const SecureStore = await import("expo-secure-store");
        return SecureStore.getItemAsync(key);
      },
      setItem: async (key: string, value: string) => {
        const SecureStore = await import("expo-secure-store");
        return SecureStore.setItemAsync(key, value);
      },
      removeItem: async (key: string) => {
        const SecureStore = await import("expo-secure-store");
        return SecureStore.deleteItemAsync(key);
      },
    };

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});
