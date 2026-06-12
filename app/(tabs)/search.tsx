import { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, FlatList,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, categoryLabel } from "../../lib/theme";
import {
  SearchBar, CategoryScroller, DriverRankRow, DriverRow, EmptyState, RACING_CATEGORIES,
} from "../../components/ui";
import { fetchRanking, searchDrivers, type DriverLike } from "../../lib/drivers";

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [ranking, setRanking] = useState<DriverLike[]>([]);
  const [results, setResults] = useState<DriverLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const loadRanking = useCallback(async () => {
    const list = await fetchRanking(category === "all" ? undefined : category, 30);
    setRanking(list);
    setLoading(false);
  }, [category]);

  useFocusEffect(useCallback(() => { loadRanking(); }, [loadRanking]));

  const runSearch = useCallback(async () => {
    if (!query.trim()) { setResults([]); return; }
    setSearching(true);
    const r = await searchDrivers(query);
    setResults(r);
    setSearching(false);
  }, [query]);

  const go = (id: string) => router.push(`/driver/${id}`);
  const showingSearch = query.trim().length > 0;
  const catTitle = category === "all" ? "総合" : categoryLabel[category] ?? category;

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>さがす</Text>
        <View style={s.searchWrap}>
          <SearchBar
            value={query}
            onChangeText={(t) => { setQuery(t); if (!t) setResults([]); }}
            onSubmit={runSearch}
            placeholder="選手名・チーム名で検索"
          />
        </View>
      </View>

      {showingSearch ? (
        // ── 検索結果 ──
        searching ? (
          <View style={s.loading}><ActivityIndicator color={colors.brand} /></View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(d) => d.id}
            contentContainerStyle={s.list}
            ListHeaderComponent={
              <Text style={s.resultCount}>「{query}」の検索結果 {results.length}件</Text>
            }
            ListEmptyComponent={
              <EmptyState icon="search-outline" title="該当する選手が見つかりません" message="別のキーワードで試してみてください。" />
            }
            renderItem={({ item }) => (
              <View style={s.rowWrap}><DriverRow driver={item} onPress={() => go(item.id)} /></View>
            )}
          />
        )
      ) : (
        // ── カテゴリ別ランキング ──
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          <View style={s.catSection}>
            <Text style={s.catLabel}>カテゴリからさがす</Text>
            <CategoryScroller selected={category} onSelect={setCategory} />
          </View>

          <View style={s.rankHeader}>
            <Ionicons name="trophy" size={18} color={colors.flame} />
            <Text style={s.rankTitle}>「{catTitle}」人気ランキング</Text>
          </View>

          {loading ? (
            <View style={s.loading}><ActivityIndicator color={colors.brand} /></View>
          ) : ranking.length === 0 ? (
            <EmptyState
              icon="trophy-outline"
              title="ランキングはまだありません"
              message="選手が登録され応援が集まると、ここにランキングが表示されます。"
            />
          ) : (
            <View style={s.rankList}>
              {ranking.map((d, i) => (
                <DriverRankRow
                  key={d.id}
                  driver={d}
                  rank={i + 1}
                  change={d.rank_change}
                  onPress={() => go(d.id)}
                />
              ))}
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
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
  title: { ...typography.title1, color: colors.label, marginBottom: spacing.md },
  searchWrap: {},

  scroll: { paddingBottom: 20 },
  loading: { paddingVertical: 60, alignItems: "center" },

  catSection: { backgroundColor: colors.bg, paddingTop: spacing.lg, paddingBottom: spacing.sm, marginBottom: spacing.sm },
  catLabel: { ...typography.headline, color: colors.label, paddingHorizontal: spacing.xl, marginBottom: spacing.xs },

  rankHeader: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.md,
  },
  rankTitle: { ...typography.title3, color: colors.label },
  rankList: { paddingHorizontal: spacing.lg, gap: spacing.sm },

  list: { paddingBottom: 40, paddingTop: spacing.md },
  resultCount: { ...typography.footnote, color: colors.labelTertiary, paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  rowWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
});
