import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { colors, radius, spacing, typography } from "../../lib/theme";
import { Button } from "../../components/ui";

interface Post {
  id: string;
  driverName: string;
  driverAvatar?: string;
  driverCategory: string;
  date: string;
  title: string;
  body: string;
  likeCount: number;
  commentCount: number;
}

const SAMPLE_POSTS: Post[] = [
  { id: "p1", driverName: "山田 遼", driverCategory: "SF", date: "2時間前",
    title: "予選P2！フロントロウ獲得",
    body: "今日は鈴鹿で予選があった。セクター2でミスしたけど、全体タイムでP2を獲れた。チームのみんなのおかげです。決勝も全力で戦います！",
    likeCount: 48, commentCount: 12 },
  { id: "p2", driverName: "伊藤 遥", driverCategory: "F4", date: "昨日",
    title: "テスト走行 — ようやく方向性が見えてきた",
    body: "先週のレースで課題だったオーバーステアに取り組んでいる。エンジニアと何度もデータを見て、着実に前に進んでいる感覚がある。",
    likeCount: 31, commentCount: 7 },
  { id: "p3", driverName: "佐藤 蓮", driverCategory: "カート", date: "3日前",
    title: "ファンイベントで子どもたちと",
    body: "ヘルメットを被って喜んでいた子どもたちの笑顔が忘れられない。こういう日があるからレースを続けられると改めて思った。",
    likeCount: 94, commentCount: 23 },
];

export default function MyDriversScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState<Set<string>>(new Set());

  useEffect(() => { if (user) load(); }, [user]);

  async function load() {
    setLoading(true);
    await supabase.from("sponsorships").select("driver_id")
      .eq("supporter_id", user!.id).eq("status", "active");
    setPosts(SAMPLE_POSTS);
    setLoading(false);
  }

  function toggleLike(id: string) {
    setLiked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.brand} size="large" /></View>;

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.headerTitle}>フィード</Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Ionicons name="heart-outline" size={40} color={colors.labelQuaternary} />
            <Text style={s.emptyTitle}>まだ応援中の選手がいません</Text>
            <Text style={s.emptySub}>気になるドライバーを見つけて応援しよう</Text>
            <Button title="ドライバーを探す" onPress={() => router.push("/(supporter)/discover")}
              fullWidth={false} style={{ marginTop: spacing.sm }} />
          </View>
        }
        renderItem={({ item }) => {
          const isLiked = liked.has(item.id);
          return (
            <View style={s.post}>
              <View style={s.postHead}>
                <View style={s.avatar}>
                  <Text style={s.avatarInitial}>{item.driverName[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.nameRow}>
                    <Text style={s.driverName}>{item.driverName}</Text>
                    <View style={s.catBadge}><Text style={s.catBadgeTxt}>{item.driverCategory}</Text></View>
                  </View>
                  <Text style={s.date}>{item.date}</Text>
                </View>
              </View>

              <Text style={s.title}>{item.title}</Text>
              <Text style={s.body}>{item.body}</Text>

              <View style={s.actions}>
                <TouchableOpacity style={s.actionBtn} onPress={() => toggleLike(item.id)}>
                  <Ionicons name={isLiked ? "heart" : "heart-outline"} size={19}
                    color={isLiked ? colors.brand : colors.labelTertiary} />
                  <Text style={[s.actionTxt, isLiked && { color: colors.brand }]}>
                    {item.likeCount + (isLiked ? 1 : 0)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.actionBtn}>
                  <Ionicons name="chatbubble-outline" size={17} color={colors.labelTertiary} />
                  <Text style={s.actionTxt}>{item.commentCount}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.actionBtn}>
                  <Ionicons name="share-outline" size={18} color={colors.labelTertiary} />
                  <Text style={s.actionTxt}>シェア</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },

  header: {
    paddingHorizontal: spacing.xl, paddingTop: 56, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.separator,
  },
  headerTitle: { ...typography.title2, color: colors.label },

  list: { paddingBottom: 100 },

  post: {
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.separator,
  },
  postHead: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.md },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgGrouped,
    alignItems: "center", justifyContent: "center",
  },
  avatarInitial: { ...typography.headline, color: colors.labelSecondary },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  driverName: { ...typography.subhead, fontWeight: "700", color: colors.label },
  catBadge: { backgroundColor: colors.bgGrouped, borderRadius: radius.sm - 3, paddingHorizontal: 6, paddingVertical: 1 },
  catBadgeTxt: { fontSize: 10, fontWeight: "700", color: colors.labelSecondary },
  date: { ...typography.caption, color: colors.labelTertiary, marginTop: 1 },

  title: { ...typography.headline, color: colors.label, lineHeight: 22, marginBottom: 6 },
  body: { ...typography.subhead, color: colors.labelSecondary, lineHeight: 22 },

  actions: { flexDirection: "row", gap: spacing.xxl, marginTop: spacing.md },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionTxt: { ...typography.footnote, color: colors.labelTertiary },

  emptyWrap: { alignItems: "center", paddingTop: 80, gap: spacing.md, paddingHorizontal: 40 },
  emptyTitle: { ...typography.headline, color: colors.label, textAlign: "center" },
  emptySub: { ...typography.subhead, color: colors.labelTertiary, textAlign: "center", lineHeight: 22 },
});
