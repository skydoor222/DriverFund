import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { Driver } from "../../lib/types";

const T = {
  bg: "#0D0D0D",
  surface: "#161616",
  border: "#1E1E1E",
  text: "#F0F0F0",
  sub: "#777777",
  muted: "#444444",
  red: "#E8002D",
  white: "#FFFFFF",
};

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
  {
    id: "p1",
    driverName: "山田 遼", driverAvatar: undefined, driverCategory: "SF",
    date: "2時間前",
    title: "予選P2！フロントロウ獲得",
    body: "今日は鈴鹿で予選があった。セクター2でミスしたけど、全体タイムでP2を獲れた。チームのみんなのおかげです。決勝も全力で戦います！",
    likeCount: 48, commentCount: 12,
  },
  {
    id: "p2",
    driverName: "伊藤 遥", driverAvatar: undefined, driverCategory: "F4",
    date: "昨日",
    title: "テスト走行 — ようやく方向性が見えてきた",
    body: "先週のレースで課題だったオーバーステアに取り組んでいる。エンジニアと何度もデータを見て、着実に前に進んでいる感覚がある。",
    likeCount: 31, commentCount: 7,
  },
  {
    id: "p3",
    driverName: "佐藤 蓮", driverAvatar: undefined, driverCategory: "カート",
    date: "3日前",
    title: "ファンイベントで子どもたちと",
    body: "ヘルメットを被って喜んでいた子どもたちの笑顔が忘れられない。こういう日があるからレースを続けられると改めて思った。",
    likeCount: 94, commentCount: 23,
  },
  {
    id: "p4",
    driverName: "山田 遼", driverAvatar: undefined, driverCategory: "SF",
    date: "4日前",
    title: "資金が足りない現実と向き合う",
    body: "今シーズン残り3戦。タイヤ代だけで100万円以上かかる。スポンサー探しも続けているけど、厳しい状況は変わらない。それでも走り続ける。",
    likeCount: 127, commentCount: 41,
  },
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
    // 応援中ドライバー確認（将来的にここでフィルタ）
    await supabase
      .from("sponsorships")
      .select("driver_id")
      .eq("supporter_id", user!.id)
      .eq("status", "active");

    setPosts(SAMPLE_POSTS);
    setLoading(false);
  }

  function toggleLike(id: string) {
    setLiked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (loading) return (
    <View style={s.center}><ActivityIndicator color={T.red} size="large" /></View>
  );

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.headerTitle}>フィード</Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        ItemSeparatorComponent={() => <View style={s.sep} />}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Text style={s.emptyTitle}>まだ応援中の選手がいません</Text>
            <Text style={s.emptySub}>気になるドライバーを見つけて応援しよう</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => router.push("/(supporter)/discover")}>
              <Text style={s.emptyBtnTxt}>ドライバーを探す</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const isLiked = liked.has(item.id);
          return (
            <View style={s.post}>
              {/* 左カラム：アバター */}
              <View style={s.postLeft}>
                <View style={s.avatar}>
                  {item.driverAvatar ? (
                    <Image source={{ uri: item.driverAvatar }} style={s.avatarImg} resizeMode="cover" />
                  ) : (
                    <View style={[s.avatarImg, s.avatarFallback]}>
                      <Text style={s.avatarInitial}>{item.driverName[0]}</Text>
                    </View>
                  )}
                </View>
                <View style={s.threadLine} />
              </View>

              {/* 右カラム：コンテンツ */}
              <View style={s.postRight}>
                {/* ヘッダー行 */}
                <View style={s.postHead}>
                  <Text style={s.driverName}>{item.driverName}</Text>
                  <Text style={s.catBadge}>{item.driverCategory}</Text>
                  <Text style={s.dot}>·</Text>
                  <Text style={s.date}>{item.date}</Text>
                </View>

                {/* 本文 */}
                <Text style={s.title}>{item.title}</Text>
                <Text style={s.body}>{item.body}</Text>

                {/* アクションバー */}
                <View style={s.actions}>
                  <TouchableOpacity style={s.actionBtn} onPress={() => toggleLike(item.id)}>
                    <Text style={[s.actionIco, isLiked && { color: T.red }]}>
                      {isLiked ? "♥" : "♡"}
                    </Text>
                    <Text style={[s.actionTxt, isLiked && { color: T.red }]}>
                      {item.likeCount + (isLiked ? 1 : 0)}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.actionBtn}>
                    <Text style={s.actionIco}>○</Text>
                    <Text style={s.actionTxt}>{item.commentCount}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.actionBtn}>
                    <Text style={s.actionIco}>↑</Text>
                    <Text style={s.actionTxt}>シェア</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: T.text },

  list: { paddingBottom: 100 },
  sep: { height: 1, backgroundColor: T.border },

  // Twitter/Reddit style post
  post: {
    flexDirection: "row",
    paddingTop: 14, paddingHorizontal: 14, paddingBottom: 4,
  },

  // 左：アバター＋スレッドライン
  postLeft: { alignItems: "center", marginRight: 12 },
  avatar: { marginBottom: 6 },
  avatarImg: { width: 42, height: 42, borderRadius: 21 },
  avatarFallback: { backgroundColor: "#2A2A2A", alignItems: "center", justifyContent: "center" },
  avatarInitial: { color: T.text, fontSize: 16, fontWeight: "700" },
  threadLine: { flex: 1, width: 2, backgroundColor: T.border, minHeight: 16 },

  // 右：コンテンツ
  postRight: { flex: 1, paddingBottom: 12 },
  postHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" },
  driverName: { fontSize: 14, fontWeight: "700", color: T.text },
  catBadge: { fontSize: 11, color: T.sub, backgroundColor: "#1E1E1E", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  dot: { color: T.muted, fontSize: 14 },
  date: { fontSize: 13, color: T.sub },

  title: { fontSize: 15, fontWeight: "700", color: T.text, lineHeight: 21, marginBottom: 6 },
  body: { fontSize: 14, color: "#AAAAAA", lineHeight: 22 },

  // アクション
  actions: {
    flexDirection: "row", gap: 24, marginTop: 12,
  },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionIco: { fontSize: 16, color: T.sub },
  actionTxt: { fontSize: 13, color: T.sub },

  // Empty
  emptyWrap: { alignItems: "center", paddingTop: 80, gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: T.text, textAlign: "center" },
  emptySub: { fontSize: 14, color: T.sub, textAlign: "center", lineHeight: 22 },
  emptyBtn: {
    backgroundColor: T.red, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 28, marginTop: 8,
  },
  emptyBtnTxt: { color: T.white, fontWeight: "700", fontSize: 14 },
});
