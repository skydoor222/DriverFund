import { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, radius, shadow } from "../../lib/theme";
import {
  SearchBar, CategoryChips, DriverCardLarge, DriverCardCompact, EmptyState,
} from "../../components/ui";
import { fetchPublishedDrivers, type DriverLike } from "../../lib/drivers";
import { getViewHistory } from "../../lib/history";

export default function HomeScreen() {
  const router = useRouter();
  const [category, setCategory] = useState("all");
  const [featured, setFeatured] = useState<DriverLike | null>(null);
  const [recommended, setRecommended] = useState<DriverLike[]>([]);
  const [viewed, setViewed] = useState<DriverLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const all = await fetchPublishedDrivers({
      category,
      order: "supporters",
      limit: 50,
    });
    setFeatured(all[0] ?? null);
    setRecommended(all);

    // 閲覧履歴（チェックした選手）
    const history = await getViewHistory();
    if (history.length) {
      const map = new Map(all.map((d) => [d.id, d]));
      // 履歴にあるが all に無い場合もあるので、足りない分は別途取得
      const fromAll = history.map((id) => map.get(id)).filter(Boolean) as DriverLike[];
      setViewed(fromAll);
    } else {
      setViewed([]);
    }
    setLoading(false);
  }, [category]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const go = (id: string) => router.push(`/driver/${id}`);

  return (
    <View style={s.root}>
      {/* ヘッダー */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <View style={s.brandRow}>
            <Ionicons name="flag" size={20} color={colors.brand} />
            <Text style={s.brand}>DriverFund</Text>
          </View>
          {/* 選手登録への控えめな導線 */}
          <Pressable onPress={() => router.push("/(driver-onboard)/welcome")} hitSlop={8} style={s.driverLink}>
            <Ionicons name="car-sport" size={13} color={colors.labelSecondary} />
            <Text style={s.driverLinkTxt}>選手として登録</Text>
            <Ionicons name="chevron-forward" size={12} color={colors.labelTertiary} />
          </Pressable>
        </View>
        <View style={s.searchWrap}>
          <SearchBar editable={false} onPress={() => router.push("/(tabs)/search")} placeholder="選手・チームを探す" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
        stickyHeaderIndices={[0]}
      >
        {/* カテゴリチップ（sticky） */}
        <View style={s.chipsBar}>
          <CategoryChips selected={category} onSelect={setCategory} />
        </View>

        {loading ? (
          <View style={s.loading}><ActivityIndicator color={colors.brand} size="large" /></View>
        ) : recommended.length === 0 ? (
          <EmptyState
            icon="car-sport-outline"
            title="まだ公開中の選手がいません"
            message="新しいドライバーの登録をお待ちください。あなたが選手なら、今すぐ登録できます。"
            actionLabel="選手として登録する"
            onAction={() => router.push("/(driver-onboard)/welcome")}
          />
        ) : (
          <>
            {/* 編集部おすすめ大バナー */}
            {featured && (
              <View style={s.section}>
                <SectionTitle icon="flame" title="今週の注目ドライバー" />
                <Pressable onPress={() => go(featured.id)} style={({ pressed }) => [s.feature, pressed && { opacity: 0.9 }]}>
                  <DriverCardLarge driver={featured} onPress={() => go(featured.id)} />
                  <View style={s.featureBadge}>
                    <Text style={s.featureBadgeTxt}>編集部おすすめ</Text>
                  </View>
                </Pressable>
              </View>
            )}

            {/* チェックした選手（横スクロール） */}
            {viewed.length > 0 && (
              <View style={s.section}>
                <SectionTitle icon="time" title="チェックした選手" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hScroll}>
                  {viewed.map((d) => (
                    <DriverCardCompact key={d.id} driver={d} onPress={() => go(d.id)} />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 今日のおすすめ（2列グリッド） */}
            <View style={s.section}>
              <SectionTitle icon="thumbs-up" title="あなたへのおすすめ" />
              <View style={s.grid}>
                {recommended.map((d) => (
                  <View key={d.id} style={s.gridItem}>
                    <DriverCardLarge driver={d} onPress={() => go(d.id)} />
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function SectionTitle({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <View style={s.sectionTitle}>
      <Ionicons name={icon} size={17} color={colors.flame} />
      <Text style={s.sectionTitleTxt}>{title}</Text>
    </View>
  );
}

const GUTTER = spacing.lg;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgGrouped },

  header: { backgroundColor: colors.bg, paddingTop: 52, borderBottomWidth: 1, borderBottomColor: colors.separator },
  headerTop: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: GUTTER, marginBottom: spacing.sm,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  brand: { ...typography.title3, color: colors.label, letterSpacing: 0.3 },
  driverLink: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingVertical: 4, paddingHorizontal: 8, borderRadius: radius.pill, backgroundColor: colors.bgGrouped,
  },
  driverLinkTxt: { ...typography.caption, fontWeight: "700", color: colors.labelSecondary },
  searchWrap: { paddingHorizontal: GUTTER, paddingBottom: spacing.md },

  scroll: { paddingBottom: 20 },
  chipsBar: { backgroundColor: colors.bgGrouped, paddingVertical: spacing.sm },

  loading: { paddingVertical: 80, alignItems: "center" },

  section: { marginTop: spacing.lg },
  sectionTitle: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: GUTTER, marginBottom: spacing.md,
  },
  sectionTitleTxt: { ...typography.title3, color: colors.label },

  feature: { paddingHorizontal: GUTTER, position: "relative" },
  featureBadge: {
    position: "absolute", top: spacing.sm + 6, right: GUTTER + 6,
    backgroundColor: colors.brand, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4,
    ...shadow.sm,
  },
  featureBadgeTxt: { color: colors.white, fontSize: 11, fontWeight: "800" },

  hScroll: { paddingHorizontal: GUTTER, gap: spacing.md },

  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: GUTTER - spacing.xs },
  gridItem: { width: "50%", padding: spacing.xs },
});
