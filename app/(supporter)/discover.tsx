import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, TextInput, ActivityIndicator, ScrollView, Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { Driver, RacingCategory } from "../../lib/types";

const T = {
  red: "#E8002D",
  bg: "#0D0D0D",
  surface: "#161616",
  border: "#252525",
  text: "#F0F0F0",
  sub: "#888888",
  muted: "#555555",
  white: "#FFFFFF",
};

const CAT_COLORS: Record<string, string> = {
  sf: "#E8002D", f4: "#3B82F6", kart: "#22C55E", other: "#666",
};

const CATEGORIES: { value: RacingCategory | "all"; label: string }[] = [
  { value: "all",   label: "すべて" },
  { value: "kart",  label: "カート" },
  { value: "f4",    label: "F4" },
  { value: "sf",    label: "SF" },
  { value: "other", label: "その他" },
];

const catLabel: Record<RacingCategory, string> = {
  kart: "カート", f4: "F4", sf: "SF", other: "その他",
};

type DriverWithProfile = Driver & {
  profiles?: { full_name: string; avatar_url?: string } | null;
};

export default function DiscoverScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [drivers, setDrivers]   = useState<DriverWithProfile[]>([]);
  const [filtered, setFiltered] = useState<DriverWithProfile[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [category, setCategory] = useState<RacingCategory | "all">("all");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { loadDrivers(); }, []);

  useEffect(() => {
    let list = drivers;
    if (category !== "all") list = list.filter(d => d.category === category);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(d => {
        const name = d.profiles?.full_name ?? (d as any).full_name ?? "";
        return (
          name.toLowerCase().includes(q) ||
          (d.team_name ?? "").toLowerCase().includes(q)
        );
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
    <View style={s.root}>

      {/* ─── ヘッダー ─── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>DriverFund</Text>
        <TouchableOpacity style={s.avatarBtn} onPress={() => setMenuOpen(true)}>
          <Text style={s.avatarBtnText}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* ─── 検索 ─── */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Text style={s.searchIco}>🔍</Text>
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="名前・チームで検索"
            placeholderTextColor={T.muted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Text style={s.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ─── カテゴリ ─── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chipRow}
        style={s.chipScroll}
      >
        {CATEGORIES.map(c => (
          <TouchableOpacity
            key={c.value}
            style={[s.chip, category === c.value && s.chipOn]}
            onPress={() => setCategory(c.value)}
          >
            <Text style={[s.chipTxt, category === c.value && s.chipTxtOn]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ─── リスト ─── */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={T.red} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          ItemSeparatorComponent={() => <View style={s.separator} />}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Text style={s.emptyTxt}>ドライバーが見つかりません</Text>
            </View>
          }
          renderItem={({ item }) => {
            const name   = item.profiles?.full_name ?? (item as any).full_name ?? "—";
            const avatar = item.profiles?.avatar_url ?? (item as any).avatar_url;
            const cat    = item.category as RacingCategory;
            const color  = CAT_COLORS[cat] ?? "#666";
            return (
              <TouchableOpacity
                style={s.row}
                onPress={() => router.push(`/driver/${item.id}`)}
                activeOpacity={0.7}
              >
                {/* アバター */}
                <View style={s.avatarWrap}>
                  {avatar ? (
                    <Image source={{ uri: avatar }} style={s.avatar} resizeMode="cover" />
                  ) : (
                    <View style={[s.avatar, s.avatarFallback, { backgroundColor: color }]}>
                      <Text style={s.avatarInitial}>{name[0]}</Text>
                    </View>
                  )}
                </View>

                {/* 情報 */}
                <View style={s.info}>
                  <View style={s.nameRow}>
                    <Text style={s.name} numberOfLines={1}>{name}</Text>
                    {item.car_number ? (
                      <Text style={s.number}>#{item.car_number}</Text>
                    ) : null}
                  </View>

                  <View style={s.metaRow}>
                    {/* カテゴリバッジ */}
                    <View style={[s.catBadge, { borderColor: color }]}>
                      <Text style={[s.catBadgeTxt, { color }]}>{catLabel[cat]}</Text>
                    </View>
                    {item.team_name ? (
                      <Text style={s.team} numberOfLines={1}>{item.team_name}</Text>
                    ) : null}
                  </View>

                  {item.catchphrase ? (
                    <Text style={s.phrase} numberOfLines={1}>
                      {item.catchphrase}
                    </Text>
                  ) : null}
                </View>

                {/* 応援数 */}
                <View style={s.countWrap}>
                  <Text style={s.countNum}>{item.total_supporters ?? 0}</Text>
                  <Text style={s.countLbl}>応援</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* ─── アカウントメニュー ─── */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuOpen(false)}
      >
        <TouchableOpacity
          style={s.overlay}
          activeOpacity={1}
          onPress={() => setMenuOpen(false)}
        >
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <View style={s.sheetUserRow}>
              <View style={s.sheetAvatar}>
                <Text style={{ fontSize: 20 }}>👤</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.sheetEmail} numberOfLines={1}>{user?.email}</Text>
                <Text style={s.sheetRole}>サポーター</Text>
              </View>
            </View>
            <View style={s.sheetDivider} />
            <TouchableOpacity
              style={s.sheetItem}
              onPress={() => { setMenuOpen(false); setTimeout(() => signOut(), 150); }}
            >
              <Text style={s.sheetItemIco}>🚪</Text>
              <Text style={s.sheetItemTxt}>ログアウト</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.sheetCancel} onPress={() => setMenuOpen(false)}>
              <Text style={s.sheetCancelTxt}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: T.text, letterSpacing: 0.5 },
  avatarBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: T.surface, borderWidth: 1, borderColor: T.border,
    alignItems: "center", justifyContent: "center",
  },
  avatarBtnText: { fontSize: 16 },

  // Search
  searchRow: { paddingHorizontal: 16, paddingBottom: 10 },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: T.surface, borderRadius: 10, borderWidth: 1, borderColor: T.border,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  searchIco: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 14, color: T.text },
  searchClear: { fontSize: 14, color: T.sub, paddingLeft: 6 },

  // Chips
  chipScroll: { flexGrow: 0 },
  chipRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 12, flexDirection: "row" },
  chip: {
    borderWidth: 1, borderColor: T.border, borderRadius: 16,
    paddingVertical: 5, paddingHorizontal: 14, backgroundColor: T.surface,
  },
  chipOn: { backgroundColor: T.red, borderColor: T.red },
  chipTxt: { fontSize: 13, fontWeight: "500", color: T.sub },
  chipTxtOn: { color: T.white, fontWeight: "700" },

  // List
  list: { paddingBottom: 100 },
  separator: { height: 1, backgroundColor: T.border, marginLeft: 76 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyWrap: { paddingTop: 80, alignItems: "center" },
  emptyTxt: { color: T.sub, fontSize: 15 },

  // Row card
  row: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  avatarWrap: {},
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarInitial: { color: "#fff", fontSize: 20, fontWeight: "800" },

  info: { flex: 1, gap: 3 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontSize: 15, fontWeight: "700", color: T.text, flex: 1 },
  number: { fontSize: 12, color: T.sub, fontWeight: "600" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  catBadge: {
    borderWidth: 1, borderRadius: 4,
    paddingVertical: 1, paddingHorizontal: 6,
  },
  catBadgeTxt: { fontSize: 10, fontWeight: "700", letterSpacing: 0.3 },
  team: { fontSize: 12, color: T.sub, flex: 1 },
  phrase: { fontSize: 12, color: T.sub, fontStyle: "italic" },

  countWrap: { alignItems: "center", minWidth: 40 },
  countNum: { fontSize: 16, fontWeight: "800", color: T.text },
  countLbl: { fontSize: 10, color: T.sub, marginTop: 1 },

  // Modal
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#1A1A1A", borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 12, paddingHorizontal: 24, paddingBottom: 44,
  },
  sheetHandle: {
    alignSelf: "center", width: 36, height: 4,
    borderRadius: 2, backgroundColor: T.border, marginBottom: 20,
  },
  sheetUserRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  sheetAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: T.surface, borderWidth: 1, borderColor: T.border,
    alignItems: "center", justifyContent: "center",
  },
  sheetEmail: { fontSize: 14, fontWeight: "700", color: T.text },
  sheetRole: { fontSize: 12, color: T.sub, marginTop: 2 },
  sheetDivider: { height: 1, backgroundColor: T.border, marginBottom: 8 },
  sheetItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  sheetItemIco: { fontSize: 18 },
  sheetItemTxt: { fontSize: 15, color: T.red, fontWeight: "700" },
  sheetCancel: {
    marginTop: 8, paddingVertical: 13,
    backgroundColor: T.surface, borderRadius: 10, alignItems: "center",
  },
  sheetCancelTxt: { fontSize: 14, color: T.sub, fontWeight: "600" },
});
