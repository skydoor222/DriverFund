import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Modal, Alert, ActivityIndicator, Linking, Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { Driver, ReturnItem, RaceResult } from "../../lib/types";

const { width: SCREEN_W } = Dimensions.get("window");

const T = {
  red: "#E8002D",
  yellow: "#FFB800",
  dark: "#0A0A0A",
  dark2: "#111111",
  dark3: "#1C1C1C",
  dark4: "#242424",
  gray2: "#555",
  gray3: "#777",
  gray4: "#BBBBBB",
  gray5: "#2E2E2E",
  bg: "#0A0A0A",
  white: "#FFFFFF",
};

const CAT_COLORS: Record<string, string> = {
  sf: T.red, f4: "#4D8BFF", kart: "#2ECC71", other: T.gray3,
};
const CAT_BG: Record<string, string> = {
  sf: "rgba(232,0,45,0.15)", f4: "rgba(77,139,255,0.15)", kart: "rgba(46,204,113,0.15)", other: "rgba(255,255,255,0.08)",
};
const RACE_CATEGORY_LABEL: Record<string, string> = {
  kart: "カート", f4: "F4", sf: "スーパーフォーミュラ", other: "その他",
};

type DriverDetail = Driver & { profiles: { full_name: string; avatar_url?: string } };

const TABS = ["ストーリー", "投稿"];

/** created_at または race_history の最初の年から活動年数を算出 */
function calcActiveYears(driver: DriverDetail): string {
  // career_timeline があれば最古の年から
  try {
    if (driver.career_timeline) {
      const tl: { year: string }[] = JSON.parse(driver.career_timeline);
      if (tl.length > 0) {
        const oldest = Math.min(...tl.map((t) => parseInt(t.year)).filter((y) => !isNaN(y)));
        if (!isNaN(oldest)) {
          const years = new Date().getFullYear() - oldest;
          return years <= 0 ? "1" : String(years);
        }
      }
    }
  } catch {}
  return "—";
}

export default function DriverProfilePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [driver, setDriver] = useState<DriverDetail | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ReturnItem | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [tab, setTab] = useState("ストーリー");
  const [posts] = useState([
    { id: "1", date: "2026年6月1日", title: "予選で初めてフロントロウ獲得！", body: "今日は鈴鹿で予選があった。セクター2でミスしたけど、全体タイムでP2を獲れた。チームのみんなのおかげです。応援してくれている皆さん、本当にありがとう。決勝も全力で戦います！" },
    { id: "2", date: "2026年5月24日", title: "テスト走行 — セッティング煮詰め中", body: "先週のレースで課題だったオーバーステアに取り組んでいる。エンジニアと何度もデータを見て、ようやく方向性が見えてきた。まだ完璧じゃないけど、着実に前に進んでいる感覚がある。" },
    { id: "3", date: "2026年5月18日", title: "ファンイベントに参加してきた", body: "今日はスポンサーさんが開催したファンイベントに参加。小さい子どもたちがヘルメット被って喜んでくれていたのが嬉しかった。こういう日があるからレースを続けられると改めて思った。" },
  ]);

  useEffect(() => { if (id) loadData(); }, [id]);

  async function loadData() {
    setLoading(true);
    const { data: d } = await supabase
      .from("drivers")
      .select("*, profiles(full_name, avatar_url)")
      .eq("id", id)
      .single();
    setDriver(d as any);
    const { data: r } = await supabase
      .from("return_items")
      .select("*")
      .eq("driver_id", id)
      .eq("is_active", true)
      .order("price");
    setReturnItems(r ?? []);
    setLoading(false);
  }

  async function handlePurchase() {
    if (!user) {
      Alert.alert("ログインが必要です", "応援するにはログインしてください", [
        { text: "キャンセル", style: "cancel" },
        { text: "ログイン", onPress: () => router.push("/(auth)/login") },
      ]);
      return;
    }
    if (!selectedItem || !driver) return;
    setPurchasing(true);

    try {
      // すでにPayment Linkがある場合はそれを使う
      let paymentUrl = selectedItem.stripe_payment_link_url;

      // なければEdge Functionで発行
      if (!paymentUrl) {
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
        const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
        const res = await fetch(`${supabaseUrl}/functions/v1/create-payment-link`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${anonKey}`,
          },
          body: JSON.stringify({ return_item_id: selectedItem.id }),
        });
        const data = await res.json();
        paymentUrl = data.url;
      }

      if (paymentUrl) {
        setSelectedItem(null);
        Linking.openURL(paymentUrl);
      } else {
        Alert.alert("エラー", "決済リンクの取得に失敗しました");
      }
    } catch (err: any) {
      Alert.alert("エラー", err.message ?? "決済リンクの取得に失敗しました");
    } finally {
      setPurchasing(false);
    }
  }

  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(supporter)/discover");
    }
  }

  const individualItems = returnItems.filter((i) => i.target === "individual" || i.target === "both");
  const corporateItems = returnItems.filter((i) => i.target === "corporate" || i.target === "both");

  if (loading) return <View style={styles.center}><ActivityIndicator color={T.red} size="large" /></View>;
  if (!driver) return (
    <View style={styles.center}>
      <Text style={{ color: T.gray3, fontSize: 15 }}>ドライバーが見つかりません</Text>
      <TouchableOpacity onPress={goBack} style={{ marginTop: 16 }}>
        <Text style={{ color: T.red }}>← 一覧に戻る</Text>
      </TouchableOpacity>
    </View>
  );

  const fullName = (driver as any).profiles?.full_name ?? driver.full_name ?? "";
  const avatarUrl = (driver as any).profiles?.avatar_url ?? driver.avatar_url;
  const cat = driver.category;
  const activeYears = calcActiveYears(driver);

  let timeline: { year: string; event: string }[] = [];
  try { if (driver.career_timeline) timeline = JSON.parse(driver.career_timeline); } catch {}

  let sponsors: { name: string; logo_url?: string }[] = [];
  try { if (driver.sponsors) sponsors = JSON.parse(driver.sponsors); } catch {}

  let raceResults: RaceResult[] = [];
  try { if (driver.race_results) raceResults = JSON.parse(driver.race_results); } catch {}

  // bioをJSONパース（物語型フォーマット）
  let story: { conflict?: string; why?: string; now?: string; fund_usage?: string; total_budget?: string; current_fund?: string } = {};
  try {
    if (driver.bio) {
      const parsed = JSON.parse(driver.bio);
      if (parsed && typeof parsed === "object") story = parsed;
    }
  } catch {
    // 旧フォーマット（文字列）
    story = { why: driver.bio ?? "" };
  }

  // 参戦費用の不足額計算
  const totalBudget = story.total_budget ? parseInt(story.total_budget) : null;
  const currentFund = story.current_fund ? parseInt(story.current_fund) : null;
  const shortage = totalBudget && currentFund != null ? totalBudget - currentFund : null;

  // プログレスバー用（事前計算 - inline Math.min/Math.roundはRN webでクラッシュする）
  const progressPct = totalBudget && totalBudget > 0
    ? Math.min(100, Math.round(((currentFund ?? 0) / totalBudget) * 100))
    : 0;
  const progressRemainder = 100 - progressPct;

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView style={styles.container} stickyHeaderIndices={[2]}>

        {/* ─── HERO ─── */}
        <View style={styles.heroSection}>
          {driver.cover_url ? (
            <Image source={{ uri: driver.cover_url }} style={styles.heroCover} />
          ) : (
            <View style={styles.heroCoverFallback}>
              {[...Array(12)].map((_, i) => (
                <View key={i} style={[styles.speedLine, { left: -40 + i * 60 }]} />
              ))}
            </View>
          )}
          {/* 下からのグラデ */}
          <View style={styles.heroGradient} />

          {/* 戻るボタン */}
          <TouchableOpacity style={styles.backBtn} onPress={goBack}>
            <Text style={styles.backBtnText}>‹</Text>
          </TouchableOpacity>

          {/* ヒーロー下部：アバター＋名前を統合 */}
          <View style={styles.heroBottom}>
            <View style={styles.heroAvatarWrap}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.heroAvatar} resizeMode="cover" />
              ) : (
                <View style={[styles.heroAvatar, { backgroundColor: CAT_COLORS[cat] ?? T.gray3, alignItems: "center", justifyContent: "center" }]}>
                  <Text style={{ color: T.white, fontSize: 28, fontWeight: "800" }}>{fullName[0]}</Text>
                </View>
              )}
            </View>
            <View style={styles.heroInfo}>
              <View style={styles.heroTopRow}>
                <View style={[styles.heroCatBadge, { backgroundColor: CAT_COLORS[cat] ?? T.gray3 }]}>
                  <Text style={styles.heroCatText}>{RACE_CATEGORY_LABEL[cat]}</Text>
                </View>
                {driver.car_number ? (
                  <Text style={styles.heroCarNumber}>#{driver.car_number}</Text>
                ) : null}
              </View>
              <Text style={styles.heroName}>{fullName}</Text>
              {(driver.team_name || driver.series_name) ? (
                <Text style={styles.heroTeam}>
                  {[driver.team_name, driver.series_name].filter(Boolean).join(" · ")}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* ─── PROFILE BLOCK ─── */}
        <View style={styles.profileBlock}>
          {/* キャッチフレーズ */}
          {driver.catchphrase ? (
            <Text style={styles.catchphrase}>"{driver.catchphrase}"</Text>
          ) : null}

          {/* メタ情報：横並びシンプル */}
          <View style={styles.metaRow}>
            {driver.age ? <Text style={styles.metaText}>{driver.age}歳</Text> : null}
            {driver.age && driver.hometown ? <Text style={styles.metaDot}>·</Text> : null}
            {driver.hometown ? <Text style={styles.metaText}>{driver.hometown}</Text> : null}
            {(driver as any).blood_type ? <Text style={styles.metaDot}>·</Text> : null}
            {(driver as any).blood_type ? <Text style={styles.metaText}>{(driver as any).blood_type}型</Text> : null}
          </View>

          {/* 座右の銘 */}
          {(driver as any).motto ? (
            <View style={styles.mottoBox}>
              <Text style={styles.mottoLabel}>座右の銘</Text>
              <Text style={styles.mottoText}>"{(driver as any).motto}"</Text>
            </View>
          ) : null}

          {/* Stats：横4列 */}
          <View style={styles.statsBar}>
            {[
              { value: driver.series_rank ? `P${driver.series_rank}` : "—", label: "今季順位" },
              { value: driver.total_points != null ? `${driver.total_points}` : "—", label: "獲得Pt" },
              { value: String(driver.total_supporters ?? 0), label: "応援者" },
              { value: activeYears !== "—" ? activeYears : "—", label: "活動年数" },
            ].map((s, i, arr) => (
              <View key={i} style={[styles.statItem, i < arr.length - 1 && styles.statDivider]}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* SNS */}
          {(driver.sns_x || driver.sns_instagram) && (
            <View style={styles.snsRow}>
              {driver.sns_x && (
                <TouchableOpacity style={styles.snsBtn} onPress={() => Linking.openURL(`https://x.com/${driver.sns_x?.replace("@", "")}`)}>
                  <Text style={styles.snsBtnText}>𝕏  {driver.sns_x}</Text>
                </TouchableOpacity>
              )}
              {driver.sns_instagram && (
                <TouchableOpacity style={styles.snsBtn} onPress={() => Linking.openURL(`https://instagram.com/${driver.sns_instagram?.replace("@", "")}`)}>
                  <Text style={styles.snsBtnText}>ig  {driver.sns_instagram}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* ─── TABS (sticky) ─── */}
        <View style={styles.tabBar}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabItem, tab === t && styles.tabItemActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── ストーリー TAB ─── */}
        {tab === "ストーリー" && (
          <View style={{ paddingBottom: 40 }}>

            {/* 今直面している壁 — 感情的フック */}
            {story.conflict ? (
              <View style={styles.section}>
                <View style={styles.conflictCard}>
                  <Text style={styles.conflictLabel}>⚡ 今、直面している壁</Text>
                  <Text style={styles.conflictText}>{story.conflict}</Text>
                </View>
              </View>
            ) : null}

            {/* 参戦費用ウィジェット */}
            {totalBudget ? (
              <View style={styles.section}>
                <SectionTitle>今シーズンの資金状況</SectionTitle>
                <View style={styles.budgetWidget}>
                  <View style={styles.budgetRow}>
                    <Text style={styles.budgetLabel}>今シーズン費用</Text>
                    <Text style={styles.budgetValue}>{totalBudget.toLocaleString()}万円</Text>
                  </View>
                  <View style={styles.budgetRow}>
                    <Text style={styles.budgetLabel}>現在調達済み</Text>
                    <Text style={[styles.budgetValue, { color: "#4CAF50" }]}>{(currentFund ?? 0).toLocaleString()}万円</Text>
                  </View>
                  <View style={styles.progressBg}>
                    <View style={[styles.progressFill, { flex: progressPct }]} />
                    <View style={{ flex: progressRemainder, backgroundColor: "transparent" }} />
                  </View>
                  {shortage != null && shortage > 0 && (
                    <Text style={styles.shortageText}>
                      あと <Text style={styles.shortageNum}>{shortage.toLocaleString()}万円</Text> が不足しています
                    </Text>
                  )}
                </View>
              </View>
            ) : null}

            {/* なぜレースを続けるのか */}
            {story.why ? (
              <View style={styles.section}>
                <SectionTitle>なぜレースを続けるのか</SectionTitle>
                <Text style={styles.storyText}>{story.why}</Text>
              </View>
            ) : null}

            {/* 今シーズンの状況 */}
            {story.now ? (
              <View style={styles.section}>
                <SectionTitle>今シーズンの状況</SectionTitle>
                <Text style={styles.storyText}>{story.now}</Text>
              </View>
            ) : null}

            {/* 経歴タイムライン */}
            {timeline.length > 0 && (
              <View style={styles.section}>
                <SectionTitle>経歴</SectionTitle>
                <View style={styles.timeline}>
                  {timeline.map((item, i) => (
                    <View key={i} style={styles.timelineRow}>
                      <View style={styles.timelineLeft}>
                        <Text style={styles.timelineYear}>{item.year}</Text>
                      </View>
                      <View style={styles.timelineCenter}>
                        <View style={styles.timelineDot} />
                        {i < timeline.length - 1 && <View style={styles.timelineLine} />}
                      </View>
                      <View style={styles.timelineRight}>
                        <Text style={styles.timelineEvent}>{item.event}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 今季目標 */}
            {driver.goal ? (
              <View style={styles.section}>
                <SectionTitle>今季の目標</SectionTitle>
                {driver.goal.split("\n").filter(Boolean).map((line, i) => (
                  <View key={i} style={styles.goalRow}>
                    <View style={styles.goalDot} />
                    <Text style={styles.goalText}>{line}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* 今季レース結果 */}
            {raceResults.length > 0 && (
              <View style={styles.section}>
                <SectionTitle>今季レース結果</SectionTitle>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { width: 36 }]}>Rd.</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1 }]}>サーキット</Text>
                  <Text style={[styles.tableHeaderCell, { width: 40, textAlign: "center" }]}>予選</Text>
                  <Text style={[styles.tableHeaderCell, { width: 40, textAlign: "center" }]}>決勝</Text>
                  <Text style={[styles.tableHeaderCell, { width: 52, textAlign: "right" }]}>Pt.</Text>
                </View>
                {raceResults.map((r, i) => {
                  const isWin = r.race === 1;
                  const isPodium = r.race != null && r.race <= 3;
                  return (
                    <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                      <Text style={[styles.tableCell, { width: 36, color: T.gray3 }]}>{r.round}</Text>
                      <Text style={[styles.tableCell, { flex: 1 }]} numberOfLines={1}>{r.circuit}</Text>
                      <Text style={[styles.tableCell, { width: 40, textAlign: "center", color: T.gray3 }]}>
                        {r.qualifying != null ? `P${r.qualifying}` : "—"}
                      </Text>
                      <View style={{ width: 40, alignItems: "center", justifyContent: "center" }}>
                        {r.race != null ? (
                          <View style={[styles.racePosBadge, isWin && { backgroundColor: T.yellow }, isPodium && !isWin && { backgroundColor: "#1A2A4A" }]}>
                            <Text style={[styles.racePosText, isWin && { color: "#000" }, isPodium && !isWin && { color: "#4D8BFF" }]}>P{r.race}</Text>
                          </View>
                        ) : (
                          <Text style={[styles.tableCell, { color: T.gray4 }]}>—</Text>
                        )}
                      </View>
                      <Text style={[styles.tableCell, { width: 52, textAlign: "right", color: r.points !== "0" ? T.white : T.gray3, fontWeight: r.points !== "0" ? "700" : "400" }]}>
                        {r.points}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* フォトギャラリー */}
            {driver.photo_urls && driver.photo_urls.length > 0 && (
              <View style={styles.section}>
                <SectionTitle>フォトギャラリー</SectionTitle>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }}>
                  <View style={{ paddingHorizontal: 20, flexDirection: "row", gap: 10 }}>
                    {driver.photo_urls.map((url, i) => (
                      <Image key={i} source={{ uri: url }} style={styles.galleryPhoto} />
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* ── 応援メニュー（ストーリー末尾） ── */}
            <View style={styles.section}>
              <SectionTitle>応援する</SectionTitle>
              {story.fund_usage ? (
                <View style={[styles.fundUsageCard, { marginBottom: 16 }]}>
                  <Text style={styles.fundUsageTitle}>あなたの支援で変わること</Text>
                  <Text style={styles.fundUsageText}>{story.fund_usage}</Text>
                </View>
              ) : null}
              {returnItems.length > 0 ? (
                <>
                  {individualItems.map((item) => (
                    <ReturnCard key={item.id} item={item} onPress={() => setSelectedItem(item)} />
                  ))}
                  {corporateItems.map((item) => (
                    <ReturnCard key={item.id} item={item} onPress={() => setSelectedItem(item)} />
                  ))}
                </>
              ) : (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>応援メニューは準備中です</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ─── 投稿 TAB ─── */}
        {tab === "投稿" && (
          <View style={{ paddingBottom: 60 }}>
            {posts.map((post) => (
              <View key={post.id} style={styles.postRow}>
                {/* 左：アバター＋スレッドライン */}
                <View style={styles.postLeft}>
                  <View>
                    {avatarUrl ? (
                      <Image source={{ uri: avatarUrl }} style={styles.postAvatar} resizeMode="cover" />
                    ) : (
                      <View style={[styles.postAvatar, { backgroundColor: CAT_COLORS[cat] ?? T.gray3, alignItems: "center", justifyContent: "center" }]}>
                        <Text style={{ color: T.white, fontWeight: "700", fontSize: 15 }}>{fullName[0]}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.postThread} />
                </View>
                {/* 右：コンテンツ */}
                <View style={styles.postRight}>
                  <View style={styles.postHeadRow}>
                    <Text style={styles.postName}>{fullName}</Text>
                    <Text style={styles.postDot}>·</Text>
                    <Text style={styles.postDate}>{post.date}</Text>
                  </View>
                  <Text style={styles.postTitle}>{post.title}</Text>
                  <Text style={styles.postBody}>{post.body}</Text>
                  <View style={styles.postActions}>
                    <TouchableOpacity style={styles.postActionBtn}>
                      <Text style={styles.postActionIco}>♡</Text>
                      <Text style={styles.postActionTxt}>24</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.postActionBtn}>
                      <Text style={styles.postActionIco}>○</Text>
                      <Text style={styles.postActionTxt}>6</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.postActionBtn}>
                      <Text style={styles.postActionIco}>↑</Text>
                      <Text style={styles.postActionTxt}>シェア</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ─── PURCHASE MODAL ─── */}
      <Modal visible={!!selectedItem} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            {selectedItem && (
              <View style={styles.modalContent}>
                {selectedItem.image_url ? (
                  <Image source={{ uri: selectedItem.image_url }} style={styles.modalImage} />
                ) : (
                  <Text style={styles.modalEmoji}>🏁</Text>
                )}
                <Text style={styles.modalTitle}>{selectedItem.title}</Text>
                {selectedItem.description ? (
                  <Text style={styles.modalDesc}>{selectedItem.description}</Text>
                ) : null}
                <View style={styles.modalPriceBox}>
                  <Text style={styles.modalPriceLabel}>
                    {selectedItem.billing_type === "monthly" ? "月額" : "金額"}
                  </Text>
                  <Text style={styles.modalPrice}>
                    ¥{selectedItem.price.toLocaleString()}
                  </Text>
                  <View style={styles.billingBadge}>
                    <Text style={styles.billingBadgeText}>
                      {selectedItem.billing_type === "monthly" ? "月次" : "単発"}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.confirmBtn, purchasing && { opacity: 0.6 }]}
                  onPress={handlePurchase}
                  disabled={purchasing}
                >
                  <Text style={styles.confirmBtnText}>
                    {purchasing ? "処理中..." : "この内容で応援する"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedItem(null)}>
                  <Text style={styles.cancelBtnText}>キャンセル</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Section title helper ──
function SectionTitle({ children }: { children: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionHeading}>{children}</Text>
    </View>
  );
}

// ── Return Card ──
function ReturnCard({ item, onPress }: { item: ReturnItem; onPress: () => void }) {
  const isSoldOut = item.remaining !== null && item.remaining !== undefined && item.remaining === 0;
  return (
    <TouchableOpacity
      style={[styles.returnCard, isSoldOut && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={isSoldOut}
      activeOpacity={0.85}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.returnImage} />
      ) : (
        <View style={styles.returnImagePlaceholder}>
          <Text style={{ fontSize: 40 }}>🎁</Text>
        </View>
      )}
      {isSoldOut && (
        <View style={styles.soldOutOverlay}>
          <Text style={styles.soldOutLabel}>SOLD OUT</Text>
        </View>
      )}
      <View style={styles.billingBadgeSmall}>
        <Text style={styles.billingBadgeSmallText}>
          {item.billing_type === "monthly" ? "月額" : "単発"}
        </Text>
      </View>
      <View style={styles.returnBody}>
        <View style={styles.returnBodyTop}>
          <Text style={styles.returnTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.returnPrice}>
            ¥{item.price.toLocaleString()}
            {item.billing_type === "monthly" && <Text style={styles.returnBilling}>/月</Text>}
          </Text>
        </View>
        {item.description ? (
          <Text style={styles.returnDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}
        {!isSoldOut && (
          <View style={styles.supportBtn}>
            <Text style={styles.supportBtnText}>この内容で応援する →</Text>
          </View>
        )}
        {item.remaining != null && item.remaining > 0 && item.remaining <= 5 && (
          <Text style={styles.remainingText}>残り{item.remaining}枠</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: T.dark },

  // ── Hero ──
  heroSection: { height: 280, position: "relative" },
  heroCover: { width: "100%", height: "100%", resizeMode: "cover", position: "absolute" },
  heroCoverFallback: {
    width: "100%", height: "100%", backgroundColor: "#111",
    overflow: "hidden", position: "absolute",
  },
  speedLine: {
    position: "absolute", width: 2, top: 0, bottom: 0,
    backgroundColor: T.white, opacity: 0.04,
    transform: [{ skewX: "-20deg" }],
  },
  heroGradient: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 200,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  backBtn: {
    position: "absolute", top: 52, left: 16,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center", justifyContent: "center",
    zIndex: 10,
  },
  backBtnText: { color: T.white, fontSize: 24, lineHeight: 28, marginLeft: -2 },

  // ヒーロー下部（アバター＋名前統合）
  heroBottom: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "flex-end",
    paddingHorizontal: 20, paddingBottom: 20, gap: 14,
  },
  heroAvatarWrap: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.2)",
    overflow: "hidden", flexShrink: 0,
  },
  heroAvatar: { width: "100%", height: "100%" },
  heroInfo: { flex: 1, paddingBottom: 2 },
  heroTopRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 5 },
  heroCatBadge: {
    borderRadius: 4, paddingVertical: 2, paddingHorizontal: 8,
  },
  heroCatText: { color: T.white, fontSize: 10, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" },
  heroCarNumber: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.5)", letterSpacing: 1 },
  heroName: { fontSize: 24, fontWeight: "900", color: T.white, letterSpacing: 0.3, lineHeight: 28 },
  heroTeam: { fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 3 },

  // ── Profile block ──
  profileBlock: {
    backgroundColor: T.bg, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: T.gray5,
  },
  catchphrase: {
    fontSize: 15, color: "#DDDDDD", fontWeight: "600", fontStyle: "italic",
    marginBottom: 12, lineHeight: 22,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16, flexWrap: "wrap" },
  metaText: { fontSize: 13, color: T.gray3 },
  metaDot: { fontSize: 13, color: T.gray5 },

  // Motto
  mottoBox: {
    backgroundColor: T.dark3, borderLeftWidth: 2, borderLeftColor: T.gray3,
    borderRadius: 6, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 16,
  },
  mottoLabel: { fontSize: 10, fontWeight: "700", color: T.gray3, marginBottom: 4, letterSpacing: 0.8, textTransform: "uppercase" },
  mottoText: { fontSize: 14, color: "#CCCCCC", fontStyle: "italic", lineHeight: 20 },

  // Stats
  statsBar: {
    flexDirection: "row", marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: "center", paddingVertical: 10 },
  statDivider: { borderRightWidth: 1, borderRightColor: T.gray5 },
  statValue: { fontSize: 20, fontWeight: "800", color: T.white },
  statUnit: { fontSize: 12, fontWeight: "400", color: T.gray3 },
  statLabel: { fontSize: 11, color: T.gray3, marginTop: 3 },

  // SNS
  snsRow: { flexDirection: "row", gap: 8 },
  snsBtn: {
    flex: 1, borderWidth: 1, borderColor: T.gray5, borderRadius: 8,
    paddingVertical: 9, alignItems: "center", backgroundColor: T.dark3,
  },
  snsBtnText: { fontSize: 12, fontWeight: "600", color: T.gray4, letterSpacing: 0.3 },

  // Tabs
  tabBar: {
    flexDirection: "row", backgroundColor: T.dark2,
    borderBottomWidth: 1, borderBottomColor: T.gray5,
  },
  tabItem: {
    flex: 1, paddingVertical: 13, alignItems: "center",
    borderBottomWidth: 2.5, borderBottomColor: "transparent",
  },
  tabItemActive: { borderBottomColor: T.red },
  tabText: { fontSize: 13, fontWeight: "600", color: T.gray3 },
  tabTextActive: { color: T.red, fontWeight: "700" },

  // Sections
  section: {
    backgroundColor: T.dark2, marginBottom: 2,
    paddingHorizontal: 20, paddingVertical: 20,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionAccent: { width: 3, height: 18, backgroundColor: T.red, borderRadius: 2 },
  sectionHeading: { fontSize: 17, fontWeight: "900", color: T.white, letterSpacing: 0.3 },
  bioText: { fontSize: 15, color: T.gray4, lineHeight: 28 },

  // Gallery
  galleryPhoto: { width: 220, height: 150, borderRadius: 12, resizeMode: "cover" },

  // Race results table
  tableHeader: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 6, paddingHorizontal: 8,
    borderBottomWidth: 2, borderBottomColor: T.dark,
    marginBottom: 2,
  },
  tableHeaderCell: { fontSize: 10, fontWeight: "800", color: T.gray4, letterSpacing: 0.5, textTransform: "uppercase" },
  tableRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 8, paddingHorizontal: 8,
    borderBottomWidth: 1, borderBottomColor: T.gray5,
  },
  tableRowAlt: { backgroundColor: T.dark3 },
  tableCell: { fontSize: 13, color: T.white },
  racePosBadge: {
    borderRadius: 4, paddingVertical: 2, paddingHorizontal: 6,
    backgroundColor: T.dark4,
  },
  racePosText: { fontSize: 11, fontWeight: "700", color: T.white },

  // Timeline
  timeline: {},
  timelineRow: { flexDirection: "row", gap: 0, marginBottom: 0 },
  timelineLeft: { width: 48, alignItems: "flex-end", paddingTop: 2 },
  timelineYear: { fontSize: 12, fontWeight: "800", color: T.red },
  timelineCenter: { width: 24, alignItems: "center" },
  timelineDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: T.red, borderWidth: 2, borderColor: T.dark2,
    marginTop: 2, zIndex: 1,
    shadowColor: T.red, shadowOpacity: 0.4, shadowRadius: 3, elevation: 2,
  },
  timelineLine: { flex: 1, width: 2, backgroundColor: T.gray5, minHeight: 24 },
  timelineRight: { flex: 1, paddingBottom: 24, paddingTop: 0 },
  timelineEvent: { fontSize: 14, color: "#CCCCCC", lineHeight: 24 },

  // Goal
  goalRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  goalDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.red, marginTop: 7, flexShrink: 0 },
  goalText: { fontSize: 15, color: "#CCCCCC", flex: 1, lineHeight: 26 },

  // Race history
  raceRow: { flexDirection: "row", gap: 8, marginBottom: 8, alignItems: "flex-start" },
  raceBullet: { fontSize: 12, color: T.red, marginTop: 3 },
  raceText: { fontSize: 13, color: T.gray4, flex: 1, lineHeight: 22 },

  // Sponsors
  sponsorRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sponsorChip: {
    borderWidth: 1, borderColor: T.gray5, borderRadius: 8,
    paddingVertical: 6, paddingHorizontal: 14, alignItems: "center", justifyContent: "center",
    backgroundColor: T.dark3,
  },
  sponsorLogo: { width: 60, height: 24, resizeMode: "contain" },
  sponsorName: { fontSize: 12, fontWeight: "600", color: T.gray4 },

  // 葛藤カード
  conflictCard: {
    backgroundColor: "rgba(232,0,45,0.08)", borderRadius: 14,
    padding: 18, borderLeftWidth: 4, borderLeftColor: T.red,
  },
  conflictLabel: { fontSize: 11, fontWeight: "800", color: T.red, letterSpacing: 0.5, marginBottom: 10 },
  conflictText: { fontSize: 16, color: T.white, fontWeight: "700", lineHeight: 28 },

  // ストーリーテキスト
  storyText: { fontSize: 15, color: "#CCCCCC", lineHeight: 30, letterSpacing: 0.2 },

  // 資金ウィジェット
  budgetWidget: {
    backgroundColor: T.dark3, borderRadius: 14, padding: 18,
    borderWidth: 1, borderColor: T.gray5, gap: 8,
  },
  budgetRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  budgetLabel: { fontSize: 13, color: T.gray3 },
  budgetValue: { fontSize: 16, fontWeight: "800", color: T.white },
  progressBg: {
    height: 8, backgroundColor: T.dark4, borderRadius: 4,
    overflow: "hidden", marginTop: 4, flexDirection: "row",
  },
  progressFill: {
    height: 8, backgroundColor: T.red,
  },
  shortageText: { fontSize: 12, color: T.gray3, marginTop: 4, textAlign: "center" },
  shortageNum: { color: T.red, fontWeight: "800" },

  // 支援で変わること
  fundUsageCard: {
    backgroundColor: "#0A0A0A", borderRadius: 14, padding: 18, marginBottom: 20,
  },
  fundUsageTitle: { fontSize: 13, fontWeight: "800", color: "#FFB800", marginBottom: 10 },
  fundUsageText: { fontSize: 13, color: "#AAAAAA", lineHeight: 24 },

  // Post (Twitter style)
  postRow: {
    flexDirection: "row",
    paddingTop: 14, paddingHorizontal: 16, paddingBottom: 4,
    borderBottomWidth: 1, borderBottomColor: T.gray5,
  },
  postLeft: { alignItems: "center", marginRight: 12 },
  postAvatar: { width: 40, height: 40, borderRadius: 20, marginBottom: 6 },
  postThread: { flex: 1, width: 2, backgroundColor: T.gray5, minHeight: 16 },
  postRight: { flex: 1, paddingBottom: 12 },
  postHeadRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4, flexWrap: "wrap" },
  postName: { fontSize: 14, fontWeight: "700", color: T.white },
  postDot: { color: T.gray3, fontSize: 14 },
  postDate: { fontSize: 13, color: T.gray3 },
  postTitle: { fontSize: 15, fontWeight: "700", color: T.white, lineHeight: 21, marginBottom: 6 },
  postBody: { fontSize: 14, color: "#AAAAAA", lineHeight: 22 },
  postActions: { flexDirection: "row", gap: 22, marginTop: 10 },
  postActionBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  postActionIco: { fontSize: 16, color: T.gray3 },
  postActionTxt: { fontSize: 13, color: T.gray3 },

  // Plans
  plansSection: { padding: 16, paddingBottom: 80 },
  planCatLabel: {
    fontSize: 12, fontWeight: "800", color: T.gray3,
    marginBottom: 12, letterSpacing: 0.5, textTransform: "uppercase",
  },
  emptyBox: { paddingVertical: 60, alignItems: "center" },
  emptyText: { color: T.gray3, fontSize: 14 },

  // ReturnCard
  returnCard: {
    backgroundColor: T.dark3, borderRadius: 16, marginBottom: 16,
    borderWidth: 1, borderColor: T.gray5, overflow: "hidden",
  },
  returnImage: { width: "100%", height: 190, resizeMode: "cover" },
  returnImagePlaceholder: {
    width: "100%", height: 140, backgroundColor: T.dark4,
    alignItems: "center", justifyContent: "center",
  },
  soldOutOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center",
    height: 190,
  },
  soldOutLabel: { color: T.white, fontWeight: "900", fontSize: 22, letterSpacing: 3 },
  billingBadgeSmall: {
    position: "absolute", top: 12, right: 12,
    backgroundColor: "rgba(0,0,0,0.75)", borderRadius: 5,
    paddingVertical: 4, paddingHorizontal: 10,
  },
  billingBadgeSmallText: { color: T.white, fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  returnBody: { padding: 16 },
  returnBodyTop: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 6, gap: 8,
  },
  returnTitle: { fontSize: 15, fontWeight: "800", color: T.white, flex: 1 },
  returnDesc: { fontSize: 12, color: T.gray4, lineHeight: 18, marginBottom: 10 },
  returnPrice: { fontSize: 22, fontWeight: "900", color: T.white },
  returnBilling: { fontSize: 12, color: T.gray3, fontWeight: "400" },
  supportBtn: {
    backgroundColor: T.red, borderRadius: 10,
    paddingVertical: 11, alignItems: "center",
  },
  supportBtnText: { color: T.white, fontSize: 13, fontWeight: "700" },
  remainingText: { fontSize: 11, color: T.red, fontWeight: "700", marginTop: 8, textAlign: "right" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: T.dark2, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingBottom: 48,
  },
  modalHandle: {
    alignSelf: "center", width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#333", marginTop: 12,
  },
  modalContent: { padding: 24, alignItems: "center" },
  modalImage: { width: "100%", height: 200, borderRadius: 14, marginBottom: 16, resizeMode: "cover" },
  modalEmoji: { fontSize: 48, marginBottom: 10 },
  modalTitle: { fontSize: 22, fontWeight: "900", color: T.white, marginBottom: 8, textAlign: "center" },
  modalDesc: { fontSize: 13, color: T.gray3, lineHeight: 20, textAlign: "center", marginBottom: 20 },
  modalPriceBox: {
    backgroundColor: T.dark3, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    width: "100%", marginBottom: 24,
  },
  modalPriceLabel: { fontSize: 13, color: T.gray4 },
  modalPrice: { fontSize: 32, fontWeight: "900", color: T.white, letterSpacing: 0.5 },
  billingBadge: {
    backgroundColor: "#3D2E00", borderRadius: 5, paddingVertical: 4, paddingHorizontal: 10,
  },
  billingBadgeText: { fontSize: 10, fontWeight: "700", color: T.yellow },
  confirmBtn: {
    backgroundColor: T.red, borderRadius: 14, paddingVertical: 16,
    width: "100%", alignItems: "center",
  },
  confirmBtnText: { color: T.white, fontSize: 16, fontWeight: "800" },
  cancelBtn: { paddingVertical: 14, alignItems: "center", marginTop: 4, width: "100%" },
  cancelBtnText: { color: T.gray3, fontSize: 14 },
});
