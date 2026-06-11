import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Share,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { Driver, Sponsorship } from "../../lib/types";
import { colors, radius, spacing, typography, shadow } from "../../lib/theme";
import { Card } from "../../components/ui";

export default function DriverDashboard() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [loading, setLoading] = useState(true);

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
      message: `DriverFundで私を応援してください！\n\nhttps://driverfund-app.vercel.app/driver/${driver.id}`,
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

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.brand} /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>こんにちは、{profile?.full_name ?? "ドライバー"}さん</Text>
        <Text style={styles.pageTitle}>ダッシュボード</Text>
      </View>

      {/* 収益サマリーカード */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>今月の支援総額</Text>
        <Text style={styles.summaryAmount}>¥{total.toLocaleString()}</Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>{sponsorships.length}</Text>
            <Text style={styles.summaryStatLabel}>応援者数</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>¥{monthlyTotal.toLocaleString()}</Text>
            <Text style={styles.summaryStatLabel}>月額収益</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>¥{oneTimeTotal.toLocaleString()}</Text>
            <Text style={styles.summaryStatLabel}>単発収益</Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        {/* プロフィール未設定バナー */}
        {!driver && (
          <Card onPress={() => router.push("/(driver)/setup")} style={styles.setupBanner} elevated={false}>
            <View style={styles.setupRow}>
              <View style={styles.setupIcon}>
                <Ionicons name="person-add" size={22} color={colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.setupTitle}>プロフィールを設定しよう</Text>
                <Text style={styles.setupSub}>設定が完了するとページが公開されます</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.white} />
            </View>
          </Card>
        )}

        {driver && !driver.is_published && (
          <Card style={styles.draftCard} elevated={false}>
            <View style={styles.draftRow}>
              <Ionicons name="document-text-outline" size={18} color={colors.warning} />
              <Text style={styles.draftText}>下書き — プロフィール設定から公開できます</Text>
            </View>
          </Card>
        )}

        {/* クイックアクション */}
        {driver && (
          <View style={styles.actions}>
            <Action icon="eye-outline" label="ページを見る" onPress={() => router.push(`/driver/${driver.id}`)} />
            <Action icon="share-outline" label="シェア" onPress={shareProfile} />
            <Action icon="gift-outline" label="お返し管理" onPress={() => router.push("/(driver)/returns")} />
          </View>
        )}

        {/* 最近の応援者 */}
        {sponsorships.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>最近の応援者</Text>
            <Card padded={false}>
              {sponsorships.slice(0, 6).map((s, i) => (
                <View key={s.id} style={[styles.sponsorRow, i > 0 && styles.sponsorBorder]}>
                  <View style={styles.sponsorAvatar}>
                    <Ionicons name="person" size={16} color={colors.labelSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sponsorName}>{s.return_item?.title ?? "応援"}</Text>
                    <Text style={styles.sponsorPlan}>
                      {s.return_item?.billing_type === "monthly" ? "月額支援" : "単発支援"}
                    </Text>
                  </View>
                  <Text style={styles.sponsorAmount}>¥{(s.amount ?? 0).toLocaleString()}</Text>
                </View>
              ))}
            </Card>
          </>
        )}

        {driver && sponsorships.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="heart-outline" size={36} color={colors.labelQuaternary} />
            <Text style={styles.emptyText}>まだ応援者がいません</Text>
            <Text style={styles.emptySub}>ページをシェアして応援を募りましょう</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function Action({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.action} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={22} color={colors.brand} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgGrouped },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg },

  header: { paddingHorizontal: spacing.xl, paddingTop: 56, paddingBottom: spacing.md },
  eyebrow: { ...typography.footnote, color: colors.labelTertiary, marginBottom: 2 },
  pageTitle: { ...typography.title1, color: colors.label },

  summaryCard: {
    backgroundColor: colors.label, marginHorizontal: spacing.lg, borderRadius: radius.xl,
    padding: spacing.xl, ...shadow.md,
  },
  summaryLabel: { ...typography.footnote, color: "rgba(255,255,255,0.6)" },
  summaryAmount: { fontSize: 40, fontWeight: "900", color: colors.white, letterSpacing: 0.5, marginTop: 4 },
  summaryStats: { flexDirection: "row", alignItems: "center", marginTop: spacing.lg },
  summaryStat: { flex: 1 },
  summaryStatValue: { ...typography.headline, color: colors.white },
  summaryStatLabel: { fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 },
  summaryDivider: { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.15)" },

  body: { padding: spacing.lg, gap: spacing.lg },

  setupBanner: { backgroundColor: colors.brand },
  setupRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  setupIcon: {
    width: 44, height: 44, borderRadius: radius.md, backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  setupTitle: { ...typography.headline, color: colors.white },
  setupSub: { ...typography.caption, color: "rgba(255,255,255,0.85)", marginTop: 2 },

  draftCard: { backgroundColor: "#FFF8EE", borderWidth: 1, borderColor: "#FFE4B8" },
  draftRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  draftText: { ...typography.footnote, color: "#A56A00", flex: 1 },

  actions: { flexDirection: "row", gap: spacing.md },
  action: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, paddingVertical: spacing.lg,
    alignItems: "center", gap: spacing.sm, ...shadow.sm,
  },
  actionIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brandTint,
    alignItems: "center", justifyContent: "center",
  },
  actionLabel: { ...typography.caption, color: colors.labelSecondary, fontWeight: "600" },

  sectionTitle: { ...typography.headline, color: colors.label, marginTop: spacing.sm },
  sponsorRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  sponsorBorder: { borderTopWidth: 1, borderTopColor: colors.separator },
  sponsorAvatar: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: colors.bgGrouped,
    alignItems: "center", justifyContent: "center",
  },
  sponsorName: { ...typography.subhead, fontWeight: "700", color: colors.label },
  sponsorPlan: { ...typography.caption, color: colors.labelTertiary, marginTop: 1 },
  sponsorAmount: { ...typography.subhead, fontWeight: "700", color: colors.label },

  emptyBox: { alignItems: "center", paddingVertical: 50, gap: spacing.sm },
  emptyText: { ...typography.callout, color: colors.labelSecondary, fontWeight: "600" },
  emptySub: { ...typography.footnote, color: colors.labelTertiary },
});
