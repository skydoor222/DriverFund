import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, TextInput, ActivityIndicator, ScrollView, Modal, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { Driver, RacingCategory } from "../../lib/types";

const T = {
  red: "#E8002D",
  dark: "#0A0A0A",
  dark3: "#1E1E1E",
  gray2: "#555",
  gray3: "#888",
  gray5: "#E8E8E8",
  bg: "#F5F5F5",
  white: "#FFFFFF",
};

const CAT_COLORS: Record<string, string> = {
  sf: T.red, f4: "#0058CC", kart: "#00933B", other: T.gray2,
};
const CAT_BG: Record<string, string> = {
  sf: "#FFF0F3", f4: "#EEF3FF", kart: "#EEFFEE", other: "#F5F5F5",
};

const CATEGORIES: { value: RacingCategory | "all"; label: string }[] = [
  { value: "all", label: "全て" },
  { value: "kart", label: "カート" },
  { value: "f4", label: "F4" },
  { value: "sf", label: "SF" },
  { value: "other", label: "その他" },
];

const categoryLabel: Record<RacingCategory, string> = {
  kart: "カート", f4: "F4", sf: "SF", other: "その他",
};

type DriverWithProfile = Driver & { profiles: { full_name: string; avatar_url?: string } };

export default function DiscoverScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [drivers, setDrivers] = useState<DriverWithProfile[]>([]);
  const [filtered, setFiltered] = useState<DriverWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<RacingCategory | "all">("all");
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => { loadDrivers(); }, []);

  useEffect(() => {
    let result = drivers;
    if (category !== "all") result = result.filter((d) => d.category === category);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.profiles?.full_name?.toLowerCase().includes(q) ||
          d.bio?.toLowerCase().includes(q) ||
          d.team_name?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [drivers, search, category]);

  async function loadDrivers() {
    setLoading(true);
    const { data } = await supabase
      .from("drivers")
      .select("*, profiles(full_name, avatar_url)")
      .eq("is_published", true)
      .order("total_supporters", { ascending: false });
    setDrivers((data as any) ?? []);
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Text style={{ fontSize: 16 }}>🏎</Text>
          </View>
          <Text style={styles.logoText}>DriverFund</Text>
        </View>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <View style={styles.avatarIcon}>
            <Text style={styles.avatarIconText}>
              {user?.email?.charAt(0).toUpperCase() ?? "?"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* プロフィールメニュー */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuSheet}>
            {/* ユーザー情報 */}
            <View style={styles.menuHeader}>
              <View style={styles.menuAvatar}>
                <Text style={styles.menuAvatarText}>
                  {user?.email?.charAt(0).toUpperCase() ?? "?"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuEmail} numberOfLines={1}>{user?.email}</Text>
                <Text style={styles.menuRole}>サポーター</Text>
              </View>
            </View>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                Alert.alert(
                  "ログアウト",
                  "ログアウトしますか？",
                  [
                    { text: "キャンセル", style: "cancel" },
                    { text: "ログアウト", style: "destructive", onPress: () => signOut() },
                  ]
                );
              }}
            >
              <Text style={styles.menuItemIcon}>🚪</Text>
              <Text style={styles.menuItemTextDanger}>ログアウト</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { marginTop: 4 }]}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.menuItemIcon}>✕</Text>
              <Text style={styles.menuItemText}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Search */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="ドライバーを探す…"
          placeholderTextColor={T.gray3}
        />
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catScrollContent}
      >
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.value}
            style={[styles.catChip, category === c.value && styles.catChipActive]}
            onPress={() => setCategory(c.value)}
          >
            <Text style={[styles.catChipText, category === c.value && styles.catChipTextActive]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={T.red} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>該当するドライバーが見つかりません</Text>
          }
          renderItem={({ item }) => {
            const cat = item.category as RacingCategory;
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/driver/${item.id}`)}
              >
                {/* Avatar */}
                <View style={styles.cardAvatarWrap}>
                  {item.profiles?.avatar_url ? (
                    <Image source={{ uri: item.profiles.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarInitial}>
                        {(item.profiles?.full_name ?? "?")[0]}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardBody}>
                  {/* Name + badge + car number */}
                  <View style={styles.cardTopRow}>
                    <Text style={styles.driverName}>{item.profiles?.full_name}</Text>
                    <View style={[styles.catBadge, { backgroundColor: CAT_BG[cat] || "#F5F5F5", borderColor: (CAT_COLORS[cat] || T.gray2) + "33" }]}>
                      <Text style={[styles.catBadgeText, { color: CAT_COLORS[cat] || T.gray2 }]}>
                        {categoryLabel[cat]}
                      </Text>
                    </View>
                    {item.car_number ? (
                      <Text style={styles.carNumber}>#{item.car_number}</Text>
                    ) : null}
                  </View>

                  {/* Catchphrase in red italic */}
                  {item.catchphrase ? (
                    <Text style={styles.catchphrase} numberOfLines={1}>{item.catchphrase}</Text>
                  ) : null}

                  <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>

                  <View style={styles.statsRow}>
                    <Text style={styles.stat}>👥 {item.total_supporters}名が応援中</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12,
    backgroundColor: T.white, borderBottomWidth: 1, borderBottomColor: T.gray5,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoIcon: {
    width: 28, height: 28, backgroundColor: T.red, borderRadius: 6,
    alignItems: "center", justifyContent: "center",
  },
  logoText: { fontSize: 20, fontWeight: "900", color: T.dark, letterSpacing: 1 },
  avatarIcon: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: T.red,
    alignItems: "center", justifyContent: "center",
  },
  avatarIconText: {
    color: "#fff", fontSize: 14, fontWeight: "800",
  },

  // メニュー
  menuOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-start", alignItems: "flex-end",
    paddingTop: 100, paddingRight: 16,
  },
  menuSheet: {
    backgroundColor: "#fff", borderRadius: 16, width: 260,
    paddingVertical: 8,
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  menuHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  menuAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: T.red,
    alignItems: "center", justifyContent: "center",
  },
  menuAvatarText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  menuEmail: { fontSize: 13, fontWeight: "600", color: T.dark },
  menuRole: { fontSize: 11, color: T.gray3, marginTop: 2 },
  menuDivider: { height: 1, backgroundColor: T.gray5, marginVertical: 4 },
  menuItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 13,
  },
  menuItemIcon: { fontSize: 16, width: 22, textAlign: "center" },
  menuItemText: { fontSize: 14, color: T.dark, fontWeight: "500" },
  menuItemTextDanger: { fontSize: 14, color: "#E8002D", fontWeight: "600" },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: T.bg, borderRadius: 10, borderWidth: 1, borderColor: T.gray5,
    paddingHorizontal: 12, paddingVertical: 8, margin: 16, marginBottom: 0,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 13, color: T.dark },
  catScroll: { flexGrow: 0, marginTop: 12 },
  catScrollContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  catChip: {
    borderWidth: 1, borderColor: T.gray5, borderRadius: 20,
    paddingVertical: 5, paddingHorizontal: 14, backgroundColor: T.white,
  },
  catChipActive: { backgroundColor: T.dark, borderColor: T.dark },
  catChipText: { fontSize: 12, fontWeight: "600", color: T.gray2 },
  catChipTextActive: { color: T.white },
  list: { padding: 16, gap: 10 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { textAlign: "center", color: T.gray3, marginTop: 60, fontSize: 15 },
  card: {
    flexDirection: "row", backgroundColor: T.white, borderRadius: 14,
    padding: 14, gap: 12,
    borderWidth: 1, borderColor: T.gray5,
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  cardAvatarWrap: { paddingTop: 2 },
  avatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: T.gray5 },
  avatarFallback: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: T.red, justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: T.gray5,
  },
  avatarInitial: { color: T.white, fontSize: 20, fontWeight: "800" },
  cardBody: { flex: 1 },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 },
  driverName: { fontSize: 15, fontWeight: "800", color: T.dark },
  catBadge: {
    borderRadius: 4, paddingVertical: 2, paddingHorizontal: 6,
    borderWidth: 1,
  },
  catBadgeText: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  carNumber: { marginLeft: "auto", fontSize: 15, fontWeight: "700", color: T.gray3, letterSpacing: 1 },
  catchphrase: { color: T.red, fontStyle: "italic", fontSize: 11, fontWeight: "700", marginBottom: 4 },
  bio: { fontSize: 11, color: T.gray2, lineHeight: 17, marginBottom: 6 },
  statsRow: { flexDirection: "row", gap: 12 },
  stat: { fontSize: 11, fontWeight: "600", color: T.gray2 },
});
