import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { colors, spacing, typography } from "../../lib/theme";
import { useAuth } from "../../lib/auth";
import { DriverRow, EmptyState } from "../../components/ui";
import { fetchDriver, type DriverLike } from "../../lib/drivers";
import { getFavorites, getViewHistory } from "../../lib/history";

type Tab = "favorites" | "history";

export default function SavedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("favorites");
  const [favorites, setFavorites] = useState<DriverLike[]>([]);
  const [history, setHistory] = useState<DriverLike[]>([]);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async (ids: string[]): Promise<DriverLike[]> => {
    const list = await Promise.all(ids.map((id) => fetchDriver(id)));
    return list.filter(Boolean) as DriverLike[];
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const [favIds, histIds] = await Promise.all([
      getFavorites(user?.id),
      getViewHistory(),
    ]);
    const [favs, hist] = await Promise.all([hydrate(favIds), hydrate(histIds)]);
    setFavorites(favs);
    setHistory(hist);
    setLoading(false);
  }, [user, hydrate]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const data = tab === "favorites" ? favorites : history;

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>気になる</Text>
        <View style={s.tabs}>
          <TabBtn label="お気に入り" active={tab === "favorites"} onPress={() => setTab("favorites")} />
          <TabBtn label="閲覧履歴" active={tab === "history"} onPress={() => setTab("history")} />
        </View>
      </View>

      {loading ? (
        <View style={s.loading}><ActivityIndicator color={colors.brand} size="large" /></View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(d) => d.id}
          contentContainerStyle={s.list}
          ListEmptyComponent={
            tab === "favorites" ? (
              <EmptyState
                icon="heart-outline"
                title="お気に入りがまだありません"
                message="気になる選手のページで♡を押すと、ここに追加されます。"
                actionLabel="選手を探す"
                onAction={() => router.push("/(tabs)/search")}
              />
            ) : (
              <EmptyState
                icon="time-outline"
                title="閲覧履歴はまだありません"
                message="選手のページを見ると、ここに履歴が残ります。"
                actionLabel="選手を探す"
                onAction={() => router.push("/(tabs)/search")}
              />
            )
          }
          renderItem={({ item }) => (
            <View style={s.rowWrap}>
              <DriverRow driver={item} onPress={() => router.push(`/driver/${item.id}`)} />
            </View>
          )}
        />
      )}
    </View>
  );
}

function TabBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={s.tabBtn}>
      <Text style={[s.tabTxt, active && s.tabTxtActive]}>{label}</Text>
      {active && <View style={s.tabUnderline} />}
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgGrouped },
  header: {
    backgroundColor: colors.bg, paddingTop: 52, paddingHorizontal: spacing.xl,
    borderBottomWidth: 1, borderBottomColor: colors.separator,
  },
  title: { ...typography.title1, color: colors.label, marginBottom: spacing.md },
  tabs: { flexDirection: "row", gap: spacing.xl },
  tabBtn: { paddingBottom: spacing.sm, alignItems: "center" },
  tabTxt: { ...typography.headline, color: colors.labelTertiary },
  tabTxtActive: { color: colors.label },
  tabUnderline: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 2.5,
    backgroundColor: colors.brand, borderRadius: 2,
  },
  loading: { paddingVertical: 80, alignItems: "center" },
  list: { paddingVertical: spacing.md, paddingBottom: 40 },
  rowWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
});
