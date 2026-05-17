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
  dark2: "#111111",
  dark3: "#1A1A1A",
  dark4: "#222222",
  gray1: "#333333",
  gray2: "#555555",
  gray3: "#888888",
  gray4: "#AAAAAA",
  gray5: "#2A2A2A",   // ダークテーマのborder
  bg: "#0A0A0A",
  card: "#161616",
  white: "#FFFFFF",
};

const CAT_COLORS: Record<string, string> = {
  sf: T.red, f4: "#4D8BFF", kart: "#2ECC71", other: T.gray3,
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

type DriverWithProfile = Driver & { profiles?: { full_name: string; avatar_url?: string } | null };

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
      result = result.filter((d) => {
        const name = d.profiles?.full_name ?? (d as any).full_name ?? "";
        return name.toLowerCase().includes(q) ||
          d.bio?.toLowerCase().includes(q) ||
          d.team_name?.toLowerCase().includes(q);
      });
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
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Text style={{ fontSize: 15 }}>🏎</Text>
          </View>
          <Text style={styles.logoText}>DriverFund</Text>
        </View>
      </View>

      {/* ── Search ── */}
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

      {/* ── Category chips ── */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.catScroll} contentContainerStyle={styles.catScrollContent}
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
            const displayName = item.profiles?.full_name ?? (item as any).full_name ?? "—";
            const displayAvatar = item.profiles?.avatar_url ?? (item as any).avatar_url;
            const catColor = CAT_COLORS[cat] ?? T.gray3;
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/driver/${item.id}`)}
                activeOpacity={0.8}
              >
                {/* カバー画像エリア */}
                {(item as any).cover_url ? (
                  <Image
                    source={{ uri: (item as any).cover_url }}
                    style={styles.cardCover}
                    defaultSource={{ uri: "https://images.unsplash.com/photo-1541348263662-e068b7b52ddc?w=900&q=60" }}
                  />
                ) : (
                  <View style={[styles.cardCover, styles.cardCoverFallback, { borderLeftWidth: 4, borderLeftColor: catColor }]}>
                    <Text style={[styles.cardCoverFallbackText, { color: catColor }]}>
                      {categoryLabel[cat]}
                    </Text>
                  </View>
                )}

                {/* カテゴリバッジ（カバー上） */}
                <View style={[styles.catBadge, { borderColor: catColor }]}>
                  <Text style={[styles.catBadgeText, { color: catColor }]}>{categoryLabel[cat]}</Text>
                </View>

                {/* カード下部 */}
                <View style={styles.cardBody}>
                  {/* アバター */}
                  <View style={styles.cardAvatarWrap}>
                    {displayAvatar ? (
                      <Image source={{ uri: displayAvatar }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, styles.avatarFallback]}>
                        <Text style={styles.avatarInitial}>{displayName[0] ?? "?"}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardInfo}>
                    <View style={styles.cardTopRow}>
                      <Text style={styles.driverName}>{displayName}</Text>
                      {item.car_number ? (
                        <Text style={styles.carNumber}>#{item.car_number}</Text>
                      ) : null}
                    </View>
                    {item.team_name ? (
                      <Text style={styles.teamName} numberOfLines={1}>{item.team_name}</Text>
                    ) : null}
                    {item.catchphrase ? (
                      <Text style={styles.catchphrase} numberOfLines={1}>
                        「{item.catchphrase}」
                      </Text>
                    ) : null}
                  </View>

                  {/* 応援者数 */}
                  <View style={styles.supporterBadge}>
                    <Text style={styles.supporterCount}>{item.total_supporters}</Text>
                    <Text style={styles.supporterLabel}>人が応援</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* ── ログアウトメニュー（右上アイコン削除→FlatList下部に移動） ── */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuSheet}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuEmail} numberOfLines={1}>{user?.email}</Text>
              <Text style={styles.menuRole}>サポーター</Text>
            </View>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setMenuVisible(false);
              Alert.alert("ログアウト", "ログアウトしますか？", [
                { text: "キャンセル", style: "cancel" },
                { text: "ログアウト", style: "destructive", onPress: () => signOut() },
              ]);
            }}>
              <Text style={styles.menuItemTextDanger}>ログアウト</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },

  // Header
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14,
    backgroundColor: T.dark2,
    borderBottomWidth: 1, borderBottomColor: T.gray5,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoIcon: {
    width: 28, height: 28, backgroundColor: T.red, borderRadius: 6,
    alignItems: "center", justifyContent: "center",
  },
  logoText: { fontSize: 20, fontWeight: "900", color: T.white, letterSpacing: 1 },

  // Search
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: T.dark3, borderRadius: 10, borderWidth: 1, borderColor: T.gray5,
    paddingHorizontal: 14, paddingVertical: 10,
    margin: 16, marginBottom: 0,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 13, color: T.white },

  // Category chips
  catScroll: { flexGrow: 0, marginTop: 12 },
  catScrollContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 12, flexDirection: "row", alignItems: "center" },
  catChip: {
    borderWidth: 1, borderColor: T.gray5, borderRadius: 20,
    paddingVertical: 6, paddingHorizontal: 16, backgroundColor: T.dark3,
    flexShrink: 0,
  },
  catChipActive: { backgroundColor: T.red, borderColor: T.red },
  catChipText: { fontSize: 12, fontWeight: "600", color: T.gray3 },
  catChipTextActive: { color: T.white },

  // List
  list: { padding: 16, gap: 12, paddingBottom: 100 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { textAlign: "center", color: T.gray3, marginTop: 60, fontSize: 15 },

  // Card
  card: {
    backgroundColor: T.card, borderRadius: 16, overflow: "hidden",
    borderWidth: 1, borderColor: T.gray5,
  },
  cardCover: { width: "100%", height: 120, resizeMode: "cover" },
  cardCoverFallback: { backgroundColor: T.dark3, justifyContent: "center", alignItems: "center" },
  cardCoverAccent: { height: 3, width: "100%" },
  cardCoverFallbackText: { fontSize: 11, fontWeight: "800", letterSpacing: 2, textTransform: "uppercase", opacity: 0.5 },

  catBadge: {
    position: "absolute", top: 10, left: 10,
    borderWidth: 1, borderRadius: 4,
    paddingVertical: 2, paddingHorizontal: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  catBadgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" },

  cardBody: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 12, gap: 10,
  },
  cardAvatarWrap: { marginTop: -28 },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: T.dark2 },
  avatarFallback: { backgroundColor: T.red, justifyContent: "center", alignItems: "center" },
  avatarInitial: { color: T.white, fontSize: 18, fontWeight: "800" },

  cardInfo: { flex: 1 },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  driverName: { fontSize: 15, fontWeight: "800", color: T.white, flex: 1 },
  carNumber: { fontSize: 13, fontWeight: "700", color: T.gray3, letterSpacing: 1 },
  teamName: { fontSize: 11, color: T.gray3, marginTop: 1 },
  catchphrase: { fontSize: 11, color: T.red, fontStyle: "italic", marginTop: 3 },

  supporterBadge: { alignItems: "center" },
  supporterCount: { fontSize: 18, fontWeight: "900", color: T.white },
  supporterLabel: { fontSize: 9, color: T.gray3, marginTop: 1 },

  // Menu
  menuOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  menuSheet: {
    backgroundColor: T.dark3, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40,
  },
  menuHeader: { marginBottom: 16 },
  menuEmail: { fontSize: 14, fontWeight: "600", color: T.white },
  menuRole: { fontSize: 12, color: T.gray3, marginTop: 2 },
  menuDivider: { height: 1, backgroundColor: T.gray5, marginBottom: 16 },
  menuItem: { paddingVertical: 14 },
  menuItemTextDanger: { fontSize: 15, color: T.red, fontWeight: "700", textAlign: "center" },
});
