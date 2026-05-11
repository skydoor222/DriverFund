import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator, Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { Colors } from "../../constants/colors";
import { Driver, ReturnItem } from "../../lib/types";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = (SCREEN_W - 48) / 2;

interface DriverCard {
  driver: Driver;
  returnItems: ReturnItem[];
  totalMonthly: number;
  totalOneTime: number;
}

export default function MyDriversScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [cards, setCards] = useState<DriverCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) load(); }, [user]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("sponsorships")
      .select(`
        *,
        return_item:return_items(*),
        driver:drivers(*)
      `)
      .eq("supporter_id", user!.id)
      .eq("status", "active")
      .order("started_at", { ascending: false });

    // Group by driver
    const driverMap = new Map<string, DriverCard>();
    for (const s of (data ?? [])) {
      const driver = s.driver as Driver;
      if (!driver) continue;
      if (!driverMap.has(driver.id)) {
        driverMap.set(driver.id, {
          driver,
          returnItems: [],
          totalMonthly: 0,
          totalOneTime: 0,
        });
      }
      const card = driverMap.get(driver.id)!;
      if (s.return_item) {
        card.returnItems.push(s.return_item as ReturnItem);
        if (s.return_item.billing_type === "monthly") {
          card.totalMonthly += s.amount;
        } else {
          card.totalOneTime += s.amount;
        }
      }
    }

    setCards(Array.from(driverMap.values()));
    setLoading(false);
  }

  const grandTotal = cards.reduce((sum, c) => sum + c.totalMonthly, 0);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator color={Colors.primary} />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>マイ選手</Text>

      {cards.length > 0 && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>月額応援合計</Text>
          <Text style={styles.summaryAmount}>¥{grandTotal.toLocaleString()}<Text style={styles.summaryUnit}> / 月</Text></Text>
          <Text style={styles.summaryCount}>{cards.length}名の選手を応援中</Text>
        </View>
      )}

      <FlatList
        data={cards}
        keyExtractor={(item) => item.driver.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🏁</Text>
            <Text style={styles.emptyTitle}>まだ応援中の選手がいません</Text>
            <Text style={styles.emptySubtext}>気になるドライバーを見つけて{"\n"}応援をはじめよう</Text>
            <TouchableOpacity
              style={styles.discoverBtn}
              onPress={() => router.push("/(supporter)/discover")}
            >
              <Text style={styles.discoverBtnText}>ドライバーを探す</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => <DriverCard card={item} onPress={() => router.push(`/driver/${item.driver.id}`)} />}
      />
    </View>
  );
}

function DriverCard({ card, onPress }: { card: DriverCard; onPress: () => void }) {
  const { driver, returnItems, totalMonthly } = card;
  const coverUri = driver.cover_url ?? driver.avatar_url;

  const categoryLabel: Record<string, string> = {
    kart: "カート", f4: "F4", sf: "スーパーフォーミュラ", other: "その他"
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Cover image with gradient */}
      <View style={styles.coverContainer}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={styles.coverImage} />
        ) : (
          <View style={[styles.coverImage, styles.coverPlaceholder]} />
        )}
        {/* Gradient overlay via plain View */}
        <View style={styles.coverGradient} />
        {/* Category badge */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{categoryLabel[driver.category] ?? driver.category}</Text>
        </View>
        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          {driver.avatar_url ? (
            <Image source={{ uri: driver.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>{driver.full_name[0]}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Card body */}
      <View style={styles.cardBody}>
        <Text style={styles.driverName} numberOfLines={1}>{driver.full_name}</Text>
        {driver.team_name && (
          <Text style={styles.teamName} numberOfLines={1}>{driver.team_name}</Text>
        )}

        {/* Stats row */}
        <View style={styles.statsRow}>
          {driver.series_rank && (
            <View style={styles.statItem}>
              <Text style={styles.statValue}>P{driver.series_rank}</Text>
              <Text style={styles.statLabel}>順位</Text>
            </View>
          )}
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{returnItems.length}</Text>
            <Text style={styles.statLabel}>メニュー</Text>
          </View>
          {totalMonthly > 0 && (
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.primary }]}>¥{(totalMonthly / 1000).toFixed(0)}k</Text>
              <Text style={styles.statLabel}>月額</Text>
            </View>
          )}
        </View>

        {/* Return item chips */}
        <View style={styles.chips}>
          {returnItems.slice(0, 2).map((ri) => (
            <View key={ri.id} style={styles.chip}>
              <Text style={styles.chipText} numberOfLines={1}>{ri.title}</Text>
            </View>
          ))}
          {returnItems.length > 2 && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>+{returnItems.length - 2}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: 56 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  pageTitle: { fontSize: 24, fontWeight: "800", color: Colors.black, paddingHorizontal: 20, marginBottom: 16 },

  summaryCard: {
    marginHorizontal: 20, backgroundColor: Colors.primary, borderRadius: 16,
    padding: 20, marginBottom: 20,
  },
  summaryLabel: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "500" },
  summaryAmount: { color: Colors.white, fontSize: 30, fontWeight: "800", marginTop: 2 },
  summaryUnit: { fontSize: 15, fontWeight: "500" },
  summaryCount: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 4 },

  list: { paddingHorizontal: 16, paddingBottom: 32 },
  row: { gap: 16, marginBottom: 16 },

  card: {
    width: CARD_W,
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  coverContainer: { height: 130, position: "relative" },
  coverImage: { width: "100%", height: "100%", resizeMode: "cover" },
  coverPlaceholder: { backgroundColor: "#C8D6E5" },
  coverGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  categoryBadge: {
    position: "absolute", top: 8, left: 8,
    backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 6,
    paddingVertical: 2, paddingHorizontal: 8,
  },
  categoryText: { color: Colors.white, fontSize: 10, fontWeight: "700" },
  avatarWrapper: {
    position: "absolute", bottom: -18, left: 10,
    borderRadius: 22, borderWidth: 2.5, borderColor: Colors.white,
    width: 44, height: 44,
    overflow: "hidden",
  },
  avatar: { width: 44, height: 44, borderRadius: 20 },
  avatarPlaceholder: {
    backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center",
  },
  avatarInitial: { color: Colors.white, fontSize: 18, fontWeight: "700" },

  cardBody: { paddingTop: 24, paddingHorizontal: 10, paddingBottom: 12 },
  driverName: { fontSize: 14, fontWeight: "800", color: Colors.black },
  teamName: { fontSize: 11, color: Colors.gray500, marginTop: 1 },

  statsRow: { flexDirection: "row", gap: 10, marginTop: 10, marginBottom: 8 },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 13, fontWeight: "800", color: Colors.black },
  statLabel: { fontSize: 9, color: Colors.gray500, marginTop: 1 },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  chip: {
    backgroundColor: Colors.background, borderRadius: 6,
    paddingVertical: 2, paddingHorizontal: 6,
  },
  chipText: { fontSize: 10, color: Colors.gray700, fontWeight: "500" },

  emptyContainer: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: Colors.black },
  emptySubtext: { fontSize: 14, color: Colors.gray500, textAlign: "center", lineHeight: 22 },
  discoverBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 36, marginTop: 8,
  },
  discoverBtnText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
});
