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
  dark2: "#141414",
  dark3: "#1E1E1E",
  gray2: "#555",
  gray3: "#888",
  gray4: "#BDBDBD",
  gray5: "#E8E8E8",
  bg: "#F7F7F7",
  white: "#FFFFFF",
};

const CAT_COLORS: Record<string, string> = {
  sf: T.red, f4: "#0058CC", kart: "#00933B", other: T.gray2,
};
const CAT_BG: Record<string, string> = {
  sf: "#FFF0F3", f4: "#EEF3FF", kart: "#EEFFEE", other: "#F5F5F5",
};
const RACE_CATEGORY_LABEL: Record<string, string> = {
  kart: "カート", f4: "F4", sf: "スーパーフォーミュラ", other: "その他",
};

type DriverDetail = Driver & { profiles: { full_name: string; avatar_url?: string } };

const TABS = ["プロフィール", "応援メニュー"];

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
  const [tab, setTab] = useState("プロフィール");

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
    const { error } = await supabase.from("sponsorships").insert({
      supporter_id: user.id,
      driver_id: driver.id,
      return_item_id: selectedItem.id,
      amount: selectedItem.price,
      status: "active",
    });
    setPurchasing(false);
    setSelectedItem(null);
    if (error) Alert.alert("エラー", error.message);
    else Alert.alert("応援ありがとうございます！🏎", `${driver.profiles?.full_name}への応援が完了しました。`, [{ text: "OK" }]);
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

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView style={styles.container} stickyHeaderIndices={[2]}>

        {/* ─── HERO ─── */}
        <View style={styles.heroSection}>
          {/* Cover image / dark bg */}
          {driver.cover_url ? (
            <Image source={{ uri: driver.cover_url }} style={styles.heroCover} />
          ) : (
            <View style={styles.heroCoverFallback}>
              {[...Array(12)].map((_, i) => (
                <View key={i} style={[styles.speedLine, { left: -40 + i * 60 }]} />
              ))}
            </View>
          )}
          {/* Gradient overlay */}
          <View style={styles.heroGradient} />

          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={goBack}>
            <Text style={styles.backBtnText}>‹</Text>
          </TouchableOpacity>

          {/* Hero content — bottom of cover */}
          <View style={styles.heroContent}>
            {/* Category badge */}
            <View style={[styles.heroCatBadge, { backgroundColor: CAT_COLORS[cat] ?? T.gray2 }]}>
              <Text style={styles.heroCatText}>{RACE_CATEGORY_LABEL[cat]}</Text>
            </View>

            {/* Name + car number */}
            <View style={styles.heroNameRow}>
              <Text style={styles.heroName}>{fullName}</Text>
              {driver.car_number ? (
                <Text style={styles.heroCarNumber}>#{driver.car_number}</Text>
              ) : null}
            </View>

            {/* Team / Series */}
            {(driver.team_name || driver.series_name) && (
              <Text style={styles.heroTeam}>
                {[driver.team_name, driver.series_name].filter(Boolean).join("  /  ")}
              </Text>
            )}
          </View>
        </View>

        {/* ─── PROFILE BLOCK ─── */}
        <View style={styles.profileBlock}>
          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>{fullName[0] ?? "?"}</Text>
              </View>
            )}
          </View>

          {/* Catchphrase */}
          {driver.catchphrase ? (
            <Text style={styles.catchphrase}>「{driver.catchphrase}」</Text>
          ) : null}

          {/* Meta pills */}
          <View style={styles.metaRow}>
            {driver.age ? (
              <View style={styles.metaPill}><Text style={styles.metaPillText}>🎂 {driver.age}歳</Text></View>
            ) : null}
            {driver.hometown ? (
              <View style={styles.metaPill}><Text style={styles.metaPillText}>📍 {driver.hometown}</Text></View>
            ) : null}
            {(driver as any).blood_type ? (
              <View style={styles.metaPill}><Text style={styles.metaPillText}>🩸 {(driver as any).blood_type}型</Text></View>
            ) : null}
          </View>

          {/* 座右の銘 */}
          {(driver as any).motto ? (
            <View style={styles.mottoBox}>
              <Text style={styles.mottoLabel}>座右の銘</Text>
              <Text style={styles.mottoText}>「{(driver as any).motto}」</Text>
            </View>
          ) : null}

          {/* Stats bar */}
          <View style={styles.statsBar}>
            <View style={[styles.statItem, styles.statDivider]}>
              <Text style={styles.statValue}>
                {driver.series_rank ? (
                  <Text>P{driver.series_rank}</Text>
                ) : "—"}
              </Text>
              <Text style={styles.statLabel}>今季順位</Text>
            </View>
            <View style={[styles.statItem, styles.statDivider]}>
              <Text style={styles.statValue}>
                {driver.total_points != null ? String(driver.total_points) : "—"}
                {driver.total_points != null ? <Text style={styles.statUnit}>pt</Text> : null}
              </Text>
              <Text style={styles.statLabel}>獲得ポイント</Text>
            </View>
            <View style={[styles.statItem, styles.statDivider]}>
              <Text style={styles.statValue}>{driver.total_supporters ?? 0}<Text style={styles.statUnit}>名</Text></Text>
              <Text style={styles.statLabel}>応援者</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {activeYears}
                {activeYears !== "—" ? <Text style={styles.statUnit}>年</Text> : null}
              </Text>
              <Text style={styles.statLabel}>活動年数</Text>
            </View>
          </View>

          {/* SNS */}
          {(driver.sns_x || driver.sns_instagram) && (
            <View style={styles.snsRow}>
              {driver.sns_x && (
                <TouchableOpacity
                  style={styles.snsBtn}
                  onPress={() => Linking.openURL(`https://x.com/${driver.sns_x?.replace("@", "")}`)}
                >
                  <Text style={styles.snsBtnText}>𝕏 {driver.sns_x}</Text>
                </TouchableOpacity>
              )}
              {driver.sns_instagram && (
                <TouchableOpacity
                  style={styles.snsBtn}
                  onPress={() => Linking.openURL(`https://instagram.com/${driver.sns_instagram?.replace("@", "")}`)}
                >
                  <Text style={styles.snsBtnText}>📸 {driver.sns_instagram}</Text>
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

        {/* ─── PROFILE TAB ─── */}
        {tab === "プロフィール" && (
          <View style={{ paddingBottom: 40 }}>

            {/* 今季レース結果 */}
            {raceResults.length > 0 && (
              <View style={styles.section}>
                <SectionTitle>今季レース結果</SectionTitle>
                {/* Header row */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { width: 36 }]}>Rd.</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1 }]}>サーキット</Text>
                  <Text style={[styles.tableHeaderCell, { width: 40, textAlign: "center" }]}>予選</Text>
                  <Text style={[styles.tableHeaderCell, { width: 40, textAlign: "center" }]}>決勝</Text>
                  <Text style={[styles.tableHeaderCell, { width: 52, textAlign: "right" }]}>ポイント</Text>
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
                          <View style={[
                            styles.racePosBadge,
                            isWin && { backgroundColor: T.yellow },
                            isPodium && !isWin && { backgroundColor: "#E8F0FF" },
                          ]}>
                            <Text style={[
                              styles.racePosText,
                              isWin && { color: T.dark },
                              isPodium && !isWin && { color: "#0058CC" },
                            ]}>P{r.race}</Text>
                          </View>
                        ) : (
                          <Text style={[styles.tableCell, { color: T.gray4 }]}>—</Text>
                        )}
                      </View>
                      <Text style={[styles.tableCell, { width: 52, textAlign: "right", color: r.points !== "0" ? T.dark : T.gray4, fontWeight: r.points !== "0" ? "700" : "400" }]}>
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

            {/* ストーリー */}
            <View style={styles.section}>
              <SectionTitle>ストーリー</SectionTitle>
              <Text style={styles.bioText}>{driver.bio ?? "このドライバーのストーリーは準備中です。"}</Text>
            </View>

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
            <View style={styles.section}>
              <SectionTitle>今季目標</SectionTitle>
              {driver.goal
                ? driver.goal.split("\n").filter(Boolean).map((line, i) => (
                    <View key={i} style={styles.goalRow}>
                      <View style={styles.goalDot} />
                      <Text style={styles.goalText}>{line}</Text>
                    </View>
                  ))
                : <Text style={styles.bioText}>今季目標は準備中です</Text>}
            </View>

            {/* 戦績 */}
            <View style={styles.section}>
              <SectionTitle>戦績</SectionTitle>
              {driver.race_history
                ? driver.race_history.split("\n").filter(Boolean).map((line, i) => (
                    <View key={i} style={styles.raceRow}>
                      <Text style={styles.raceBullet}>▸</Text>
                      <Text style={styles.raceText}>{line}</Text>
                    </View>
                  ))
                : <Text style={styles.bioText}>戦績は準備中です</Text>}
            </View>

            {/* スポンサー */}
            {sponsors.length > 0 && (
              <View style={styles.section}>
                <SectionTitle>スポンサー</SectionTitle>
                <View style={styles.sponsorRow}>
                  {sponsors.map((s, i) => (
                    <View key={i} style={styles.sponsorChip}>
                      {s.logo_url
                        ? <Image source={{ uri: s.logo_url }} style={styles.sponsorLogo} />
                        : <Text style={styles.sponsorName}>{s.name}</Text>}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* ─── 応援メニュー TAB ─── */}
        {tab === "応援メニュー" && (
          <View style={styles.plansSection}>
            {individualItems.length > 0 && (
              <>
                <Text style={styles.planCatLabel}>🙋 個人向け</Text>
                {individualItems.map((item) => (
                  <ReturnCard key={item.id} item={item} onPress={() => setSelectedItem(item)} />
                ))}
              </>
            )}
            {corporateItems.length > 0 && (
              <>
                <Text style={[styles.planCatLabel, { marginTop: 20 }]}>🏢 企業向け</Text>
                {corporateItems.map((item) => (
                  <ReturnCard key={item.id} item={item} onPress={() => setSelectedItem(item)} />
                ))}
              </>
            )}
            {returnItems.length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>応援メニューは準備中です</Text>
              </View>
            )}
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
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: T.white },

  // ── Hero ──
  heroSection: { height: 260, position: "relative" },
  heroCover: { width: "100%", height: "100%", resizeMode: "cover", position: "absolute" },
  heroCoverFallback: {
    width: "100%", height: "100%", backgroundColor: T.dark,
    overflow: "hidden", position: "absolute",
  },
  speedLine: {
    position: "absolute", width: 2, top: 0, bottom: 0,
    backgroundColor: T.white, opacity: 0.06,
    transform: [{ skewX: "-20deg" }],
  },
  heroGradient: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 180,
    // フェードをCSSグラデ代わりに複数Viewで表現
    backgroundColor: "transparent",
  },
  backBtn: {
    position: "absolute", top: 48, left: 16,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center", justifyContent: "center",
    zIndex: 10,
  },
  backBtnText: { color: T.white, fontSize: 26, lineHeight: 30, marginLeft: -2 },
  heroContent: {
    position: "absolute", bottom: 20, left: 20, right: 20,
  },
  heroCatBadge: {
    alignSelf: "flex-start", borderRadius: 4,
    paddingVertical: 3, paddingHorizontal: 10, marginBottom: 8,
  },
  heroCatText: { color: T.white, fontSize: 10, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  heroNameRow: { flexDirection: "row", alignItems: "flex-end", gap: 10, marginBottom: 4 },
  heroName: { fontSize: 28, fontWeight: "900", color: T.white, letterSpacing: 0.5, flex: 1 },
  heroCarNumber: { fontSize: 22, fontWeight: "700", color: "rgba(255,255,255,0.6)", letterSpacing: 1 },
  heroTeam: { fontSize: 12, color: "rgba(255,255,255,0.65)", letterSpacing: 0.3 },

  // ── Profile block ──
  profileBlock: {
    backgroundColor: T.white, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: T.gray5,
  },
  avatarWrapper: {
    marginTop: -52, marginBottom: 12,
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 3, borderColor: T.white,
    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 6, elevation: 5,
    overflow: "hidden",
  },
  avatar: { width: "100%", height: "100%", borderRadius: 40 },
  avatarFallback: { backgroundColor: T.red, justifyContent: "center", alignItems: "center" },
  avatarInitial: { color: T.white, fontSize: 30, fontWeight: "800" },
  catchphrase: {
    fontSize: 14, color: T.red, fontWeight: "700", fontStyle: "italic",
    marginBottom: 12, lineHeight: 22,
  },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  metaPill: {
    backgroundColor: T.bg, borderRadius: 20,
    paddingVertical: 4, paddingHorizontal: 10,
  },
  metaPillText: { fontSize: 12, color: T.gray2 },

  // Motto
  mottoBox: {
    backgroundColor: "#FFF8F0", borderLeftWidth: 3, borderLeftColor: T.yellow,
    borderRadius: 6, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 14,
  },
  mottoLabel: { fontSize: 10, fontWeight: "700", color: T.gray3, marginBottom: 3, letterSpacing: 0.5 },
  mottoText: { fontSize: 14, fontWeight: "700", color: T.dark, fontStyle: "italic" },

  // Stats
  statsBar: {
    flexDirection: "row", borderWidth: 1, borderColor: T.gray5,
    borderRadius: 12, overflow: "hidden", marginBottom: 14,
    backgroundColor: T.white,
  },
  statItem: { flex: 1, paddingVertical: 12, alignItems: "center" },
  statDivider: { borderRightWidth: 1, borderRightColor: T.gray5 },
  statValue: { fontSize: 22, fontWeight: "900", color: T.dark },
  statUnit: { fontSize: 13, fontWeight: "400", color: T.gray3 },
  statLabel: { fontSize: 10, color: T.gray3, marginTop: 2, letterSpacing: 0.3 },

  // SNS
  snsRow: { flexDirection: "row", gap: 8 },
  snsBtn: {
    flex: 1, borderWidth: 1, borderColor: T.gray5, borderRadius: 8,
    paddingVertical: 8, alignItems: "center",
  },
  snsBtnText: { fontSize: 12, fontWeight: "600", color: T.gray2 },

  // Tabs
  tabBar: {
    flexDirection: "row", backgroundColor: T.white,
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
    backgroundColor: T.white, marginBottom: 8,
    paddingHorizontal: 20, paddingVertical: 20,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionAccent: { width: 3, height: 18, backgroundColor: T.red, borderRadius: 2 },
  sectionHeading: { fontSize: 15, fontWeight: "900", color: T.dark, letterSpacing: 0.3 },
  bioText: { fontSize: 14, color: T.gray2, lineHeight: 26 },

  // Gallery
  galleryPhoto: { width: 220, height: 150, borderRadius: 12, resizeMode: "cover" },

  // Race results table
  tableHeader: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 6, paddingHorizontal: 8,
    borderBottomWidth: 2, borderBottomColor: T.dark,
    marginBottom: 2,
  },
  tableHeaderCell: { fontSize: 10, fontWeight: "800", color: T.dark, letterSpacing: 0.5, textTransform: "uppercase" },
  tableRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 8, paddingHorizontal: 8,
    borderBottomWidth: 1, borderBottomColor: T.gray5,
  },
  tableRowAlt: { backgroundColor: "#FAFAFA" },
  tableCell: { fontSize: 13, color: T.dark },
  racePosBadge: {
    borderRadius: 4, paddingVertical: 2, paddingHorizontal: 6,
    backgroundColor: T.bg,
  },
  racePosText: { fontSize: 11, fontWeight: "700", color: T.dark },

  // Timeline
  timeline: {},
  timelineRow: { flexDirection: "row", gap: 0, marginBottom: 0 },
  timelineLeft: { width: 48, alignItems: "flex-end", paddingTop: 2 },
  timelineYear: { fontSize: 12, fontWeight: "800", color: T.red },
  timelineCenter: { width: 24, alignItems: "center" },
  timelineDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: T.red, borderWidth: 2, borderColor: T.white,
    marginTop: 2, zIndex: 1,
    shadowColor: T.red, shadowOpacity: 0.4, shadowRadius: 3, elevation: 2,
  },
  timelineLine: { flex: 1, width: 2, backgroundColor: T.gray5, minHeight: 24 },
  timelineRight: { flex: 1, paddingBottom: 24, paddingTop: 0 },
  timelineEvent: { fontSize: 13, color: T.dark, lineHeight: 22 },

  // Goal
  goalRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  goalDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.red, marginTop: 7, flexShrink: 0 },
  goalText: { fontSize: 14, color: T.dark, flex: 1, lineHeight: 22 },

  // Race history
  raceRow: { flexDirection: "row", gap: 8, marginBottom: 8, alignItems: "flex-start" },
  raceBullet: { fontSize: 12, color: T.red, marginTop: 3 },
  raceText: { fontSize: 13, color: T.gray2, flex: 1, lineHeight: 22 },

  // Sponsors
  sponsorRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sponsorChip: {
    borderWidth: 1, borderColor: T.gray5, borderRadius: 8,
    paddingVertical: 6, paddingHorizontal: 14, alignItems: "center", justifyContent: "center",
  },
  sponsorLogo: { width: 60, height: 24, resizeMode: "contain" },
  sponsorName: { fontSize: 12, fontWeight: "600", color: T.gray2 },

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
    backgroundColor: T.white, borderRadius: 16, marginBottom: 16,
    borderWidth: 1, borderColor: T.gray5, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  returnImage: { width: "100%", height: 190, resizeMode: "cover" },
  returnImagePlaceholder: {
    width: "100%", height: 140, backgroundColor: T.bg,
    alignItems: "center", justifyContent: "center",
  },
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject as any,
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
  returnTitle: { fontSize: 15, fontWeight: "800", color: T.dark, flex: 1 },
  returnDesc: { fontSize: 12, color: T.gray2, lineHeight: 18, marginBottom: 10 },
  returnPrice: { fontSize: 22, fontWeight: "900", color: T.dark },
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
