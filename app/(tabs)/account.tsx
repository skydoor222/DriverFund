import { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, radius, shadow } from "../../lib/theme";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui";

export default function AccountScreen() {
  const router = useRouter();
  const { session, profile, user, signOut, loading } = useAuth();
  const [sponsorCount, setSponsorCount] = useState(0);
  const [isDriver, setIsDriver] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { count } = await supabase
      .from("sponsorships").select("id", { count: "exact", head: true })
      .eq("supporter_id", user.id).eq("status", "active");
    setSponsorCount(count ?? 0);

    const { data: driver } = await supabase
      .from("drivers").select("id").eq("profile_id", user.id).maybeSingle();
    setIsDriver(!!driver);
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return <View style={s.center}><ActivityIndicator color={colors.brand} size="large" /></View>;
  }

  // ── 未ログイン ──
  if (!session) {
    return (
      <View style={s.root}>
        <View style={s.header}><Text style={s.title}>マイページ</Text></View>
        <ScrollView contentContainerStyle={s.guestScroll}>
          <View style={s.guestCard}>
            <View style={s.guestIcon}>
              <Ionicons name="heart" size={28} color={colors.brand} />
            </View>
            <Text style={s.guestTitle}>ログインして応援しよう</Text>
            <Text style={s.guestMsg}>
              お気に入りの保存・選手への応援・購入履歴の確認には{"\n"}アカウントが必要です。
            </Text>
            <Button title="ログイン / 新規登録" onPress={() => router.push("/(auth)/login")} style={{ marginTop: spacing.lg }} />
          </View>

          <Pressable onPress={() => router.push("/(driver-onboard)/welcome")} style={s.driverCta}>
            <View style={s.driverCtaIcon}>
              <Ionicons name="car-sport" size={22} color={colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.driverCtaTitle}>選手の方はこちら</Text>
              <Text style={s.driverCtaSub}>ドライバーとして登録して応援を集める</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.labelTertiary} />
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // ── ログイン済み ──
  return (
    <View style={s.root}>
      <View style={s.header}><Text style={s.title}>マイページ</Text></View>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* プロフィールカード */}
        <View style={s.profileCard}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.avatarPh]}>
              <Text style={s.avatarInitial}>{(profile?.full_name ?? "U")[0]}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{profile?.full_name || "ユーザー"}</Text>
            <Text style={s.email}>{profile?.email || user?.email}</Text>
          </View>
        </View>

        {/* 応援サマリー */}
        <View style={s.statRow}>
          <View style={s.statCard}>
            <Text style={s.statNum}>{sponsorCount}</Text>
            <Text style={s.statLabel}>応援中の選手</Text>
          </View>
        </View>

        {/* メニュー */}
        <View style={s.menu}>
          <MenuItem icon="heart-outline" label="お気に入り" onPress={() => router.push("/(tabs)/saved")} />
          <MenuItem icon="receipt-outline" label="応援・購入履歴" onPress={() => router.push("/(tabs)/saved")} />
          {isDriver ? (
            <MenuItem icon="speedometer-outline" label="選手ダッシュボード" onPress={() => router.push("/(driver)/dashboard")} highlight />
          ) : (
            <MenuItem icon="car-sport-outline" label="選手として登録する" onPress={() => router.push("/(driver-onboard)/welcome")} highlight />
          )}
        </View>

        <View style={s.menu}>
          <MenuItem icon="log-out-outline" label="ログアウト" onPress={signOut} danger />
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function MenuItem({
  icon, label, onPress, highlight, danger,
}: {
  icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void;
  highlight?: boolean; danger?: boolean;
}) {
  const color = danger ? colors.danger : highlight ? colors.brand : colors.labelSecondary;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.menuItem, pressed && { backgroundColor: colors.bgGrouped }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[s.menuLabel, danger && { color: colors.danger }, highlight && { color: colors.brand, fontWeight: "700" }]}>
        {label}
      </Text>
      {!danger && <Ionicons name="chevron-forward" size={18} color={colors.labelQuaternary} />}
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgGrouped },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.bg, paddingTop: 52, paddingBottom: spacing.md, paddingHorizontal: spacing.xl,
    borderBottomWidth: 1, borderBottomColor: colors.separator,
  },
  title: { ...typography.title1, color: colors.label },

  // Guest
  guestScroll: { padding: spacing.lg, gap: spacing.md },
  guestCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xxl,
    alignItems: "center", ...shadow.sm,
  },
  guestIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: colors.brandTint,
    alignItems: "center", justifyContent: "center", marginBottom: spacing.md,
  },
  guestTitle: { ...typography.title3, color: colors.label, marginBottom: spacing.sm },
  guestMsg: { ...typography.subhead, color: colors.labelTertiary, textAlign: "center", lineHeight: 21 },

  driverCta: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, ...shadow.sm,
  },
  driverCtaIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brandTint,
    alignItems: "center", justifyContent: "center",
  },
  driverCtaTitle: { ...typography.headline, color: colors.label },
  driverCtaSub: { ...typography.caption, color: colors.labelTertiary, marginTop: 1 },

  // Logged in
  scroll: { padding: spacing.lg, gap: spacing.md },
  profileCard: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, ...shadow.sm,
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPh: { backgroundColor: colors.bgGrouped, alignItems: "center", justifyContent: "center" },
  avatarInitial: { ...typography.title2, color: colors.labelSecondary },
  name: { ...typography.headline, color: colors.label },
  email: { ...typography.footnote, color: colors.labelTertiary, marginTop: 2 },

  statRow: { flexDirection: "row", gap: spacing.md },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.lg, alignItems: "center", ...shadow.sm,
  },
  statNum: { ...typography.title1, color: colors.brand },
  statLabel: { ...typography.footnote, color: colors.labelTertiary, marginTop: 2 },

  menu: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: "hidden", ...shadow.sm },
  menuItem: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator,
  },
  menuLabel: { ...typography.body, color: colors.label, flex: 1 },
});
