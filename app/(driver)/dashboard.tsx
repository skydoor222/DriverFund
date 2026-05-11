import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Share,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { Driver, Sponsorship } from "../../lib/types";

const T = {
  red: "#E8002D",
  dark: "#0A0A0A",
  dark2: "#141414",
  dark3: "#1E1E1E",
  gray1: "#222",
  gray2: "#555",
  gray3: "#888",
  gray4: "#BDBDBD",
  gray5: "#E8E8E8",
  bg: "#F5F5F5",
  white: "#FFFFFF",
};

const BAR_HEIGHTS = [60, 45, 72, 55, 80, 65, 90];

export default function DriverDashboard() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ホーム");

  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    setLoading(true);
    const { data: d } = await supabase.from("drivers").select("*").eq("profile_id", user!.id).single();
    setDriver(d);
    if (d) {
      const { data: s } = await supabase
        .from("sponsorships")
        .select("*, return_item:return_items(*)")
        .eq("driver_id", d.id)
        .eq("status", "active");
      setSponsorships(s ?? []);
    }
    setLoading(false);
  }

  async function shareProfile() {
    if (!driver) return;
    await Share.share({
      message: `DriverFundで私を応援してください！\n\nhttps://driverfund.app/driver/${driver.id}`,
      title: `${profile?.full_name}のドライバーページ`,
    });
  }

  const monthlyTotal = sponsorships
    .filter((s) => s.return_item?.billing_type === "monthly")
    .reduce((sum, s) => sum + (s.amount ?? 0), 0);
  const oneTimeTotal = sponsorships
    .filter((s) => s.return_item?.billing_type === "one_time")
    .reduce((sum, s) => sum + (s.amount ?? 0), 0);
  const total = monthlyTotal + oneTimeTotal;

  const initials = (profile?.full_name ?? "?").split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase();

  if (loading) return <View style={styles.center}><ActivityIndicator color={T.red} /></View>;

  return (
    <View style={styles.container}>
      {/* Dark header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.logoText}>DriverFund</Text>
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarSmallText}>{initials}</Text>
          </View>
        </View>

        <Text style={styles.headerLabel}>今月の支援総額</Text>
        <Text style={styles.totalAmount}>
          ¥{total > 0 ? total.toLocaleString() : "0"}
        </Text>

        <View style={styles.subStats}>
          <View style={styles.subStat}>
            <Text style={styles.subStatValue}>{sponsorships.length}名</Text>
            <Text style={styles.subStatLabel}>応援者数</Text>
          </View>
          <View style={styles.subStat}>
            <Text style={styles.subStatValue}>¥{oneTimeTotal > 0 ? (oneTimeTotal / 1000).toFixed(0) + "K" : "0"}</Text>
            <Text style={styles.subStatLabel}>単発収益</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.outlineBtn} onPress={shareProfile}>
            <Text style={styles.outlineBtnText}>🔗 プロフィールを共有</Text>
          </TouchableOpacity>
          {driver && (
            <TouchableOpacity
              style={styles.redBtn}
              onPress={() => router.push(`/driver/${driver.id}`)}
            >
              <Text style={styles.redBtnText}>👁 プロフィールを見る</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Profile not set banner */}
        {!driver && (
          <TouchableOpacity
            style={styles.setupBanner}
            onPress={() => router.push("/(driver)/setup")}
          >
            <Text style={styles.setupBannerTitle}>プロフィールを設定しよう</Text>
            <Text style={styles.setupBannerSub}>設定が完了するとページが公開されます →</Text>
          </TouchableOpacity>
        )}

        {driver && !driver.is_published && (
          <View style={styles.draftBadge}>
            <Text style={styles.draftText}>📝 下書き — プロフィール設定から公開できます</Text>
          </View>
        )}

        {/* Recent supporters */}
        {sponsorships.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>最近の応援者</Text>
            <View style={styles.card}>
              {sponsorships.slice(0, 5).map((s, i) => (
                <View
                  key={s.id}
                  style={[styles.sponsorRow, i < Math.min(sponsorships.length, 5) - 1 && styles.sponsorRowBorder]}
                >
                  <View style={styles.sponsorAvatar}>
                    <Text style={styles.sponsorAvatarText}>👤</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sponsorName}>{s.return_item?.title ?? "応援者"}</Text>
                    <Text style={styles.sponsorPlan}>{s.return_item?.title ?? "—"}</Text>
                  </View>
                  <Text style={styles.sponsorAmount}>¥{(s.amount ?? 0).toLocaleString()}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Bar chart */}
        <Text style={styles.sectionTitle}>収益推移</Text>
        <View style={styles.chart}>
          {BAR_HEIGHTS.map((h, i) => (
            <View key={i} style={styles.barWrap}>
              <View
                style={[
                  styles.bar,
                  { height: h * 0.6, backgroundColor: i === BAR_HEIGHTS.length - 1 ? T.red : T.gray5 },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Action grid */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(driver)/returns")}
          >
            <Text style={styles.actionIcon}>🎁</Text>
            <Text style={styles.actionLabel}>お返し管理</Text>
          </TouchableOpacity>
          {driver && (
            <TouchableOpacity style={styles.actionCard} onPress={shareProfile}>
              <Text style={styles.actionIcon}>🔗</Text>
              <Text style={styles.actionLabel}>ページをシェア</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionCard} onPress={signOut}>
            <Text style={styles.actionIcon}>🚪</Text>
            <Text style={styles.actionLabel}>ログアウト</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        {[
          { label: "ホーム", icon: "🏠" },
          { label: "お返し", icon: "🎁", onPress: () => { setActiveTab("お返し"); router.push("/(driver)/returns"); } },
          { label: "設定", icon: "⚙️" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.label}
            style={styles.navItem}
            onPress={tab.onPress ?? (() => setActiveTab(tab.label))}
          >
            <Text style={styles.navIcon}>{tab.icon}</Text>
            <Text style={[styles.navLabel, activeTab === tab.label && styles.navLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Dark header
  header: { backgroundColor: T.dark, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  logoText: { fontSize: 20, fontWeight: "900", color: T.white, letterSpacing: 2 },
  avatarSmall: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: T.dark3,
    alignItems: "center", justifyContent: "center",
  },
  avatarSmallText: { color: T.white, fontSize: 13, fontWeight: "700" },
  headerLabel: { fontSize: 11, color: T.gray3, marginBottom: 4 },
  totalAmount: { fontSize: 48, fontWeight: "900", color: T.white, letterSpacing: 0.5, lineHeight: 56 },
  subStats: { flexDirection: "row", gap: 16, marginTop: 10, marginBottom: 14 },
  subStat: { flexDirection: "row", gap: 4, alignItems: "baseline" },
  subStatValue: { fontSize: 18, fontWeight: "800", color: T.white, letterSpacing: 0.5 },
  subStatLabel: { fontSize: 10, color: T.gray3 },
  headerActions: { flexDirection: "row", gap: 8 },
  outlineBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 8,
    borderWidth: 1, borderColor: T.gray1, alignItems: "center",
  },
  outlineBtnText: { color: T.gray4, fontSize: 12, fontWeight: "600" },
  redBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 8,
    backgroundColor: T.red, alignItems: "center",
  },
  redBtnText: { color: T.white, fontSize: 12, fontWeight: "700" },

  // Content
  content: { flex: 1 },
  setupBanner: {
    backgroundColor: T.red, borderRadius: 14, padding: 18, margin: 16,
  },
  setupBannerTitle: { color: T.white, fontSize: 16, fontWeight: "700" },
  setupBannerSub: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4 },
  draftBadge: {
    backgroundColor: T.gray5, borderRadius: 10, padding: 12, margin: 16, marginBottom: 0,
  },
  draftText: { fontSize: 13, color: T.gray2 },
  sectionTitle: {
    fontSize: 14, fontWeight: "800", color: T.dark, marginHorizontal: 16,
    marginTop: 18, marginBottom: 10,
  },
  card: {
    backgroundColor: T.white, borderRadius: 14, marginHorizontal: 16,
    borderWidth: 1, borderColor: T.gray5,
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
    overflow: "hidden",
  },
  sponsorRow: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 12, paddingHorizontal: 14,
  },
  sponsorRowBorder: { borderBottomWidth: 1, borderBottomColor: T.gray5 },
  sponsorAvatar: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: T.dark,
    alignItems: "center", justifyContent: "center",
  },
  sponsorAvatarText: { fontSize: 18 },
  sponsorName: { fontSize: 13, fontWeight: "700", color: T.dark },
  sponsorPlan: { fontSize: 11, color: T.gray3 },
  sponsorAmount: { fontSize: 13, fontWeight: "600", color: T.gray2 },
  chart: {
    backgroundColor: T.white, borderRadius: 14, marginHorizontal: 16, padding: 16,
    borderWidth: 1, borderColor: T.gray5,
    flexDirection: "row", alignItems: "flex-end", gap: 6, height: 100,
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  barWrap: { flex: 1, alignItems: "center" },
  bar: { width: "100%", borderRadius: 3 },
  actions: { flexDirection: "row", gap: 10, margin: 16 },
  actionCard: {
    flex: 1, backgroundColor: T.white, borderRadius: 14, padding: 16, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  actionIcon: { fontSize: 24, marginBottom: 6 },
  actionLabel: { fontSize: 12, color: T.dark, fontWeight: "600", textAlign: "center" },

  // Bottom nav
  bottomNav: {
    height: 56, backgroundColor: T.white, borderTopWidth: 1, borderTopColor: T.gray5,
    flexDirection: "row",
  },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2 },
  navIcon: { fontSize: 18 },
  navLabel: { fontSize: 9, fontWeight: "600", color: T.gray3 },
  navLabelActive: { color: T.red },
});
