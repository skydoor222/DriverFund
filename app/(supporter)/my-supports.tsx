import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { Colors } from "../../constants/colors";

export default function MySupportsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [sponsorships, setSponsorships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) load(); }, [user]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("sponsorships")
      .select(`
        *,
        return_item:return_items(*),
        driver:drivers(*, profiles(full_name, avatar_url))
      `)
      .eq("supporter_id", user!.id)
      .order("started_at", { ascending: false });
    setSponsorships(data ?? []);
    setLoading(false);
  }

  const totalMonthly = sponsorships
    .filter((s) => s.return_item?.billing_type === "monthly" && s.status === "active")
    .reduce((sum, s) => sum + s.amount, 0);

  if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>応援中</Text>

      {sponsorships.length > 0 && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>月額応援合計</Text>
          <Text style={styles.summaryAmount}>¥{totalMonthly.toLocaleString()} / 月</Text>
        </View>
      )}

      <FlatList
        data={sponsorships}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>まだ応援しているドライバーがいません</Text>
            <TouchableOpacity
              style={styles.discoverBtn}
              onPress={() => router.push("/(supporter)/discover")}
            >
              <Text style={styles.discoverBtnText}>ドライバーを探す</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const driver = item.driver;
          const profile = driver?.profiles;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/driver/${driver?.id}`)}
            >
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{(profile?.full_name ?? "?")[0]}</Text>
                </View>
              )}
              <View style={styles.cardBody}>
                <Text style={styles.driverName}>{profile?.full_name}</Text>
                <Text style={styles.returnTitle}>{item.return_item?.title}</Text>
                <Text style={styles.amount}>
                  ¥{item.amount.toLocaleString()}
                  {item.return_item?.billing_type === "monthly" ? " / 月" : ""}
                </Text>
              </View>
              <View style={[
                styles.statusBadge,
                item.status === "active" ? styles.statusActive : styles.statusInactive,
              ]}>
                <Text style={styles.statusText}>
                  {item.status === "active" ? "応援中" : "停止中"}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: 56 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "800", color: Colors.black, paddingHorizontal: 20, marginBottom: 16 },
  summaryCard: {
    marginHorizontal: 20, backgroundColor: Colors.primary, borderRadius: 14,
    padding: 18, marginBottom: 16,
  },
  summaryLabel: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  summaryAmount: { color: Colors.white, fontSize: 28, fontWeight: "800", marginTop: 4 },
  list: { padding: 20, gap: 12 },
  emptyContainer: { alignItems: "center", marginTop: 60, gap: 20 },
  emptyText: { color: Colors.gray300, fontSize: 15 },
  discoverBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 32,
  },
  discoverBtnText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
  card: {
    flexDirection: "row", backgroundColor: Colors.white, borderRadius: 14,
    padding: 14, alignItems: "center", gap: 12,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarPlaceholder: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center",
  },
  avatarInitial: { color: Colors.white, fontSize: 20, fontWeight: "700" },
  cardBody: { flex: 1 },
  driverName: { fontSize: 15, fontWeight: "700", color: Colors.black },
  returnTitle: { fontSize: 13, color: Colors.gray500, marginTop: 2 },
  amount: { fontSize: 14, fontWeight: "700", color: Colors.primary, marginTop: 4 },
  statusBadge: { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
  statusActive: { backgroundColor: "#F0FFF4" },
  statusInactive: { backgroundColor: Colors.gray100 },
  statusText: { fontSize: 12, fontWeight: "600", color: Colors.gray700 },
});
