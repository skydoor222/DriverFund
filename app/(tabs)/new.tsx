import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { colors, spacing, typography } from "../../lib/theme";
import { DriverRow, EmptyState } from "../../components/ui";
import { fetchPublishedDrivers, type DriverLike } from "../../lib/drivers";

// 公開日（created_at）でグルーピングして「◯/◯にデビューした選手」を作る
function formatDateLabel(iso?: string): string {
  if (!iso) return "最近デビュー";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "最近デビュー";
  return `${d.getMonth() + 1}/${d.getDate()}にデビューした選手`;
}

export default function NewScreen() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<DriverLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const list = await fetchPublishedDrivers({ order: "newest", limit: 50 });
    setDrivers(list);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await load(); setRefreshing(false);
  }, [load]);

  // 日付ラベルでグループ見出しを挿入
  const sections: Array<{ type: "header"; label: string } | { type: "driver"; driver: DriverLike }> = [];
  let lastLabel = "";
  for (const d of drivers) {
    const label = formatDateLabel(d.created_at);
    if (label !== lastLabel) {
      sections.push({ type: "header", label });
      lastLabel = label;
    }
    sections.push({ type: "driver", driver: d });
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>新着</Text>
        <Text style={s.sub}>新しく登録したドライバー</Text>
      </View>

      {loading ? (
        <View style={s.loading}><ActivityIndicator color={colors.brand} size="large" /></View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item, i) => (item.type === "header" ? `h-${item.label}-${i}` : item.driver.id)}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
          ListEmptyComponent={
            <EmptyState
              icon="sparkles-outline"
              title="まだ新着の選手がいません"
              message="新しいドライバーが登録されると、ここに表示されます。"
              actionLabel="選手として登録する"
              onAction={() => router.push("/(driver-onboard)/welcome")}
            />
          }
          renderItem={({ item }) =>
            item.type === "header" ? (
              <Text style={s.groupHeader}>{item.label}</Text>
            ) : (
              <View style={s.rowWrap}>
                <DriverRow driver={item.driver} onPress={() => router.push(`/driver/${item.driver.id}`)} />
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgGrouped },
  header: {
    backgroundColor: colors.bg, paddingTop: 52, paddingBottom: spacing.md, paddingHorizontal: spacing.xl,
    borderBottomWidth: 1, borderBottomColor: colors.separator,
  },
  title: { ...typography.title1, color: colors.label },
  sub: { ...typography.subhead, color: colors.labelTertiary, marginTop: 2 },
  loading: { paddingVertical: 80, alignItems: "center" },
  list: { paddingBottom: 40 },
  groupHeader: {
    ...typography.title3, color: colors.label,
    paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.md,
  },
  rowWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
});
