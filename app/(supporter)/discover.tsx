import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, TextInput, ActivityIndicator, ScrollView, Modal, Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { Driver, RacingCategory } from "../../lib/types";
import { colors, radius, spacing, typography, shadow, categoryColor, categoryShort } from "../../lib/theme";

const CATEGORIES: { value: RacingCategory | "all"; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "kart", label: "カート" },
  { value: "f4", label: "F4" },
  { value: "sf", label: "SF" },
  { value: "other", label: "その他" },
];

type DriverWithProfile = Driver & {
  profiles?: { full_name: string; avatar_url?: string } | null;
};

export default function DiscoverScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [drivers, setDrivers] = useState<DriverWithProfile[]>([]);
  const [filtered, setFiltered] = useState<DriverWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<RacingCategory | "all">("all");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { loadDrivers(); }, []);

  useEffect(() => {
    let list = drivers;
    if (category !== "all") list = list.filter((d) => d.category === category);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d) => {
        const name = d.profiles?.full_name ?? (d as any).full_name ?? "";
        return name.toLowerCase().includes(q) || (d.team_name ?? "").toLowerCase().includes(q);
      });
    }
    setFiltered(list);
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
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>応援するドライバーを探す</Text>
          <Text style={styles.headerTitle}>DriverFund</Text>
        </View>
        <TouchableOpacity style={styles.avatarBtn} onPress={() => setMenuOpen(true)}>
          <Ionicons name="person" size={18} color={colors.labelSecondary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={17} color={colors.labelTertiary} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="名前・チームで検索"
            placeholderTextColor={colors.labelQuaternary}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={colors.labelQuaternary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow} style={styles.chipScroll}>
        {CATEGORIES.map((c) => {
          const active = category === c.value;
          return (
            <TouchableOpacity key={c.value}
              style={[styles.chip, active && styles.chipOn]}
              onPress={() => setCategory(c.value)}>
              <Text style={[styles.chipTxt, active && styles.chipTxtOn]}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.brand} size="large" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="car-sport-outline" size={40} color={colors.labelQuaternary} />
              <Text style={styles.emptyTxt}>ドライバーが見つかりません</Text>
            </View>
          }
          renderItem={({ item }) => {
            const name = item.profiles?.full_name ?? (item as any).full_name ?? "—";
            const avatar = item.profiles?.avatar_url ?? (item as any).avatar_url;
            const cat = item.category as RacingCategory;
            const color = categoryColor[cat] ?? colors.catOther;
            return (
              <Pressable
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.95, transform: [{ scale: 0.995 }] }]}
                onPress={() => router.push(`/driver/${item.id}`)}>
                <View style={styles.avatarWrap}>
                  {avatar ? (
                    <Image source={{ uri: avatar }} style={styles.avatar} resizeMode="cover" />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: color }]}>
                      <Text style={styles.avatarInitial}>{name[0]}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.info}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>{name}</Text>
                    {item.car_number ? <Text style={styles.number}>#{item.car_number}</Text> : null}
                  </View>
                  <View style={styles.metaRow}>
                    <View style={[styles.catBadge, { backgroundColor: color }]}>
                      <Text style={styles.catBadgeTxt}>{categoryShort[cat]}</Text>
                    </View>
                    {item.team_name ? <Text style={styles.team} numberOfLines={1}>{item.team_name}</Text> : null}
                  </View>
                  {item.catchphrase ? (
                    <Text style={styles.phrase} numberOfLines={1}>{item.catchphrase}</Text>
                  ) : null}
                </View>

                <View style={styles.countWrap}>
                  <Text style={styles.countNum}>{item.total_supporters ?? 0}</Text>
                  <Text style={styles.countLbl}>応援</Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {/* Account menu */}
      <Modal visible={menuOpen} transparent animationType="slide" onRequestClose={() => setMenuOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setMenuOpen(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetUserRow}>
              <View style={styles.sheetAvatar}>
                <Ionicons name="person" size={20} color={colors.labelSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetEmail} numberOfLines={1}>{user?.email}</Text>
                <Text style={styles.sheetRole}>サポーター</Text>
              </View>
            </View>
            <View style={styles.sheetDivider} />
            <TouchableOpacity style={styles.sheetItem}
              onPress={() => { setMenuOpen(false); router.push("/(supporter)/my-drivers"); }}>
              <Ionicons name="heart-outline" size={20} color={colors.label} />
              <Text style={styles.sheetItemTxt}>応援中のドライバー</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetItem}
              onPress={() => { setMenuOpen(false); setTimeout(() => signOut(), 150); }}>
              <Ionicons name="log-out-outline" size={20} color={colors.danger} />
              <Text style={[styles.sheetItemTxt, { color: colors.danger }]}>ログアウト</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.xl, paddingTop: 56, paddingBottom: spacing.md,
  },
  headerEyebrow: { ...typography.caption, color: colors.labelTertiary, marginBottom: 2 },
  headerTitle: { ...typography.title1, color: colors.label },
  avatarBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgGrouped,
    alignItems: "center", justifyContent: "center",
  },

  searchRow: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.bgGrouped, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 11,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.label },

  chipScroll: { flexGrow: 0 },
  chipRow: { paddingHorizontal: spacing.xl, gap: spacing.sm, paddingBottom: spacing.md },
  chip: {
    borderRadius: radius.pill, paddingVertical: 7, paddingHorizontal: 16,
    backgroundColor: colors.bgGrouped,
  },
  chipOn: { backgroundColor: colors.label },
  chipTxt: { ...typography.footnote, fontWeight: "600", color: colors.labelSecondary },
  chipTxtOn: { color: colors.white, fontWeight: "700" },

  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: 100 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyWrap: { paddingTop: 80, alignItems: "center", gap: spacing.md },
  emptyTxt: { ...typography.callout, color: colors.labelTertiary },

  card: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.sm + 2, ...shadow.sm,
  },
  avatarWrap: {},
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarInitial: { color: colors.white, fontSize: 22, fontWeight: "800" },

  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { ...typography.headline, color: colors.label, flexShrink: 1 },
  number: { ...typography.footnote, color: colors.labelTertiary, fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  catBadge: { borderRadius: radius.sm - 2, paddingVertical: 2, paddingHorizontal: 7 },
  catBadgeTxt: { color: colors.white, fontSize: 10, fontWeight: "800", letterSpacing: 0.4 },
  team: { ...typography.caption, color: colors.labelTertiary, flexShrink: 1 },
  phrase: { ...typography.caption, color: colors.labelTertiary, fontStyle: "italic" },

  countWrap: { alignItems: "center", minWidth: 44 },
  countNum: { ...typography.title3, color: colors.brand },
  countLbl: { fontSize: 10, color: colors.labelTertiary, marginTop: 1 },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingTop: spacing.md, paddingHorizontal: spacing.xxl, paddingBottom: 44,
  },
  sheetHandle: {
    alignSelf: "center", width: 36, height: 5, borderRadius: 3,
    backgroundColor: colors.borderStrong, marginBottom: spacing.xl,
  },
  sheetUserRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg },
  sheetAvatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: colors.bgGrouped,
    alignItems: "center", justifyContent: "center",
  },
  sheetEmail: { ...typography.subhead, fontWeight: "700", color: colors.label },
  sheetRole: { ...typography.caption, color: colors.labelTertiary, marginTop: 2 },
  sheetDivider: { height: 1, backgroundColor: colors.separator, marginBottom: spacing.xs },
  sheetItem: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.lg },
  sheetItemTxt: { ...typography.body, color: colors.label, fontWeight: "600" },
});
