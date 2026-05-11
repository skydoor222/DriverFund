import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Modal, Alert, ActivityIndicator, Linking, Dimensions,
} from "react-native";

const { width: SCREEN_W } = Dimensions.get("window");
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { Driver, ReturnItem } from "../../lib/types";

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
  bg: "#F5F5F5",
  white: "#FFFFFF",
};

const CAT_COLORS: Record<string, string> = {
  sf: T.red, f4: "#0058CC", kart: "#00933B", other: T.gray2,
};
const CAT_BG: Record<string, string> = {
  sf: "#FFF0F3", f4: "#EEF3FF", kart: "#EEFFEE", other: "#F5F5F5",
};

const RACE_CATEGORY_LABEL: Record<string, string> = {
  kart: "カート", f4: "F4", sf: "SF", other: "その他",
};

type DriverDetail = Driver & { profiles: { full_name: string; avatar_url?: string } };

const TABS = ["プロフィール", "応援メニュー"];

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

  const individualItems = returnItems.filter((i) => i.target === "individual" || i.target === "both");
  const corporateItems = returnItems.filter((i) => i.target === "corporate" || i.target === "both");

  if (loading) return <View style={styles.center}><ActivityIndicator color={T.red} /></View>;
  if (!driver) return <View style={styles.center}><Text>ドライバーが見つかりません</Text></View>;

  const fullName = driver.profiles?.full_name ?? "";
  const avatarUrl = driver.profiles?.avatar_url ?? driver.avatar_url;
  const cat = driver.category;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} stickyHeaderIndices={[2]}>
        {/* Cover */}
        <View style={styles.coverSection}>
          {driver.cover_url ? (
            <Image source={{ uri: driver.cover_url }} style={styles.cover} />
          ) : (
            <View style={styles.cover}>
              {/* Speed lines decoration */}
              {[...Array(8)].map((_, i) => (
                <View key={i} style={[styles.speedLine, { left: -20 + i * 55 }]} />
              ))}
              <View style={styles.coverLabel}>
                <View style={{ width: 48, height: 2, backgroundColor: T.red, borderRadius: 1, marginBottom: 4 }} />
                <Text style={styles.coverLabelText}>RACING SCENE</Text>
              </View>
            </View>
          )}
          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          {/* Overlapping avatar */}
          <View style={styles.avatarWrapper}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>{fullName[0] ?? "?"}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Profile info */}
        <View style={styles.profileBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{fullName}</Text>
            <View style={[styles.badge, { backgroundColor: CAT_BG[cat] || "#F5F5F5", borderColor: (CAT_COLORS[cat] || T.gray2) + "33" }]}>
              <Text style={[styles.badgeText, { color: CAT_COLORS[cat] || T.gray2 }]}>
                {RACE_CATEGORY_LABEL[cat]}
              </Text>
            </View>
            {driver.car_number ? (
              <Text style={styles.carNumber}>#{driver.car_number}</Text>
            ) : null}
          </View>

          <View style={styles.metaRow}>
            {driver.age ? <Text style={styles.meta}>{driver.age}歳</Text> : null}
            {driver.hometown ? <Text style={styles.meta}>{driver.hometown}</Text> : null}
            {driver.team_name ? <Text style={styles.meta}>{driver.team_name}</Text> : null}
          </View>

          {driver.catchphrase ? (
            <Text style={styles.catchphrase}>「{driver.catchphrase}」</Text>
          ) : null}

          {/* Stats bar */}
          <View style={styles.statsBar}>
            {[
              { label: "応援者", value: String(driver.total_supporters ?? 0), unit: "名" },
              { label: "月間収益", value: "¥" + ((driver.total_supporters ?? 0) * 1500 / 1000).toFixed(0) + "K", unit: "" },
              { label: "活動年数", value: driver.age ? String(Math.max(1, Math.floor((driver.age - 15) / 2))) : "—", unit: driver.age ? "年" : "" },
            ].map((s, i) => (
              <View key={i} style={[styles.statItem, i < 2 && styles.statDivider]}>
                <Text style={styles.statValue}>{s.value}{s.unit}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
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

        {/* Tabs — sticky */}
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

        {/* Tab content */}
        {tab === "プロフィール" && (
          <View>
            {/* ── ストーリー ── */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionHeading}>ストーリー</Text>
              </View>
              <Text style={styles.bioText}>{driver.bio ?? "このドライバーのストーリーは準備中です。"}</Text>
            </View>

            {/* ── フォトギャラリー ── */}
            {driver.photo_urls && driver.photo_urls.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.sectionAccent} />
                  <Text style={styles.sectionHeading}>フォトギャラリー</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
                  {driver.photo_urls.map((url, i) => (
                    <Image key={i} source={{ uri: url }} style={styles.galleryPhoto} />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* ── 経歴タイムライン ── */}
            {(() => {
              let timeline: { year: string; event: string }[] = [];
              try { if (driver.career_timeline) timeline = JSON.parse(driver.career_timeline); } catch {}
              return timeline.length > 0 ? (
                <View style={styles.section}>
                  <View style={styles.sectionTitleRow}>
                    <View style={styles.sectionAccent} />
                    <Text style={styles.sectionHeading}>経歴</Text>
                  </View>
                  <View style={styles.timeline}>
                    {timeline.map((item, i) => (
                      <View key={i} style={styles.timelineRow}>
                        <View style={styles.timelineLeft}>
                          <Text style={styles.timelineYear}>{item.year}</Text>
                          {i < timeline.length - 1 && <View style={styles.timelineLine} />}
                        </View>
                        <View style={styles.timelineRight}>
                          <View style={styles.timelineDot} />
                          <Text style={styles.timelineEvent}>{item.event}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null;
            })()}

            {/* ── 今季目標 ── */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionHeading}>今季目標</Text>
              </View>
              {driver.goal ? (
                driver.goal.split("\n").filter(Boolean).map((line, i) => (
                  <View key={i} style={styles.goalRow}>
                    <View style={styles.goalDot} />
                    <Text style={styles.goalText}>{line}</Text>
                  </View>
                ))
              ) : <Text style={styles.bioText}>今季目標は準備中です</Text>}
            </View>

            {/* ── 戦績 ── */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionHeading}>戦績</Text>
              </View>
              {driver.race_history ? (
                driver.race_history.split("\n").filter(Boolean).map((line, i) => (
                  <View key={i} style={styles.raceHistoryRow}>
                    <Text style={styles.raceHistoryText}>{line}</Text>
                  </View>
                ))
              ) : <Text style={styles.bioText}>戦績は準備中です</Text>}
            </View>

            {/* ── スポンサー ── */}
            {(() => {
              let sponsors: { name: string; logo_url?: string }[] = [];
              try { if (driver.sponsors) sponsors = JSON.parse(driver.sponsors); } catch {}
              return sponsors.length > 0 ? (
                <View style={[styles.section, { marginBottom: 32 }]}>
                  <View style={styles.sectionTitleRow}>
                    <View style={styles.sectionAccent} />
                    <Text style={styles.sectionHeading}>スポンサー</Text>
                  </View>
                  <View style={styles.sponsorRow}>
                    {sponsors.map((s, i) => (
                      <View key={i} style={styles.sponsorChip}>
                        {s.logo_url ? (
                          <Image source={{ uri: s.logo_url }} style={styles.sponsorLogo} />
                        ) : (
                          <Text style={styles.sponsorName}>{s.name}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              ) : null;
            })()}
          </View>
        )}

        {tab === "応援メニュー" && (
          <View style={styles.plansSection}>
            {individualItems.length > 0 && (
              <>
                <Text style={styles.planCatLabel}>個人向け</Text>
                {individualItems.map((item) => (
                  <ReturnCard key={item.id} item={item} onPress={() => setSelectedItem(item)} />
                ))}
              </>
            )}

            {corporateItems.length > 0 && (
              <>
                <Text style={[styles.planCatLabel, { marginTop: 16 }]}>企業向け</Text>
                {corporateItems.map((item) => (
                  <ReturnCard key={item.id} item={item} onPress={() => setSelectedItem(item)} />
                ))}
              </>
            )}

            {returnItems.length === 0 && (
              <Text style={styles.empty}>応援メニューは準備中です</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Purchase modal */}
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
                <Text style={styles.modalDesc}>{selectedItem.description}</Text>
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

function ReturnCard({ item, onPress }: { item: ReturnItem; onPress: () => void }) {
  const isSoldOut = item.remaining !== null && item.remaining === 0;
  return (
    <TouchableOpacity
      style={[styles.returnCard, isSoldOut && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={isSoldOut}
      activeOpacity={0.85}
    >
      {/* 画像バナー */}
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.returnImage} />
      ) : (
        <View style={styles.returnImagePlaceholder}>
          <Text style={{ fontSize: 36 }}>🎁</Text>
        </View>
      )}
      {/* SOLD OUT オーバーレイ */}
      {isSoldOut && (
        <View style={styles.soldOutOverlay}>
          <Text style={styles.soldOutLabel}>SOLD OUT</Text>
        </View>
      )}
      {/* 課金バッジ */}
      <View style={styles.billingBadgeSmall}>
        <Text style={styles.billingBadgeSmallText}>
          {item.billing_type === "monthly" ? "月額" : "単発"}
        </Text>
      </View>

      {/* 情報エリア */}
      <View style={styles.returnBody}>
        <View style={styles.returnBodyTop}>
          <Text style={styles.returnTitle}>{item.title}</Text>
          <Text style={styles.returnPrice}>
            ¥{item.price.toLocaleString()}
            <Text style={styles.returnBilling}>{item.billing_type === "monthly" ? "/月" : ""}</Text>
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
  container: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Cover
  coverSection: { height: 200, position: "relative" },
  cover: {
    width: "100%", height: 160, backgroundColor: T.dark,
    overflow: "hidden", justifyContent: "center", alignItems: "center",
  },
  speedLine: {
    position: "absolute", width: 1, top: 0, bottom: 0,
    backgroundColor: "white", opacity: 0.12,
    transform: [{ skewX: "-20deg" }],
  },
  coverLabel: { alignItems: "center" },
  coverLabelText: { color: T.gray2, fontSize: 10, letterSpacing: 2, opacity: 0.5 },
  backBtn: {
    position: "absolute", top: 12, left: 12,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center", justifyContent: "center",
  },
  backBtnText: { color: T.white, fontSize: 16 },
  avatarWrapper: {
    position: "absolute", bottom: 0, left: 20,
    borderRadius: 36, borderWidth: 3, borderColor: T.white,
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarFallback: { backgroundColor: T.red, justifyContent: "center", alignItems: "center" },
  avatarInitial: { color: T.white, fontSize: 28, fontWeight: "800" },

  // Profile block
  profileBlock: {
    backgroundColor: T.white, padding: 20, paddingTop: 36,
    borderBottomWidth: 1, borderBottomColor: T.gray5,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  name: { fontSize: 22, fontWeight: "900", color: T.dark },
  badge: {
    borderRadius: 4, paddingVertical: 3, paddingHorizontal: 8, borderWidth: 1,
  },
  badgeText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  carNumber: { fontSize: 18, fontWeight: "700", color: T.gray3, letterSpacing: 1 },
  metaRow: { flexDirection: "row", gap: 12, marginBottom: 6 },
  meta: { fontSize: 12, color: T.gray3 },
  catchphrase: { fontSize: 13, color: T.red, fontWeight: "700", fontStyle: "italic", marginBottom: 14 },
  statsBar: {
    flexDirection: "row", borderWidth: 1, borderColor: T.gray5,
    borderRadius: 10, overflow: "hidden", marginBottom: 12,
  },
  statItem: { flex: 1, paddingVertical: 10, alignItems: "center" },
  statDivider: { borderRightWidth: 1, borderRightColor: T.gray5 },
  statValue: { fontSize: 20, fontWeight: "800", color: T.dark, letterSpacing: 0.5 },
  statLabel: { fontSize: 10, color: T.gray3, marginTop: 1 },
  snsRow: { flexDirection: "row", gap: 8, marginTop: 4 },
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
    flex: 1, paddingVertical: 11, alignItems: "center",
    borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  tabItemActive: { borderBottomColor: T.red },
  tabText: { fontSize: 12, fontWeight: "600", color: T.gray3 },
  tabTextActive: { color: T.red },

  // Tab content
  tabContent: {
    backgroundColor: T.white, padding: 16, marginBottom: 10,
  },
  // Section
  section: { backgroundColor: T.white, marginBottom: 8, padding: 20 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionAccent: { width: 3, height: 16, backgroundColor: T.red, borderRadius: 2 },
  sectionHeading: { fontSize: 15, fontWeight: "900", color: T.dark, letterSpacing: 0.3 },
  bioText: { fontSize: 14, color: T.gray2, lineHeight: 24 },

  // Gallery
  galleryScroll: { marginHorizontal: -4 },
  galleryPhoto: { width: 200, height: 140, borderRadius: 10, marginRight: 10 },

  // Timeline
  timeline: { paddingLeft: 4 },
  timelineRow: { flexDirection: "row", gap: 16, minHeight: 48 },
  timelineLeft: { width: 44, alignItems: "flex-end" },
  timelineYear: { fontSize: 11, fontWeight: "700", color: T.red, paddingTop: 2 },
  timelineLine: { flex: 1, width: 1, backgroundColor: T.gray5, alignSelf: "center", marginTop: 4, marginBottom: 0 },
  timelineRight: { flex: 1, flexDirection: "row", gap: 10, paddingBottom: 20 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: T.red, marginTop: 4, flexShrink: 0 },
  timelineEvent: { flex: 1, fontSize: 13, color: T.dark, lineHeight: 20 },

  // Goal / Race history
  goalRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  goalDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.red, marginTop: 6, flexShrink: 0 },
  goalText: { fontSize: 13, color: T.dark, flex: 1, lineHeight: 20 },
  raceHistoryRow: {
    borderLeftWidth: 2, borderLeftColor: T.gray5, paddingLeft: 12, marginBottom: 8,
  },
  raceHistoryText: { fontSize: 13, color: T.gray2, lineHeight: 20 },

  // Sponsors
  sponsorRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sponsorChip: {
    borderWidth: 1, borderColor: T.gray5, borderRadius: 8,
    paddingVertical: 6, paddingHorizontal: 14,
    alignItems: "center", justifyContent: "center",
  },
  sponsorLogo: { width: 60, height: 24, resizeMode: "contain" },
  sponsorName: { fontSize: 12, fontWeight: "600", color: T.gray2 },

  // Plans
  plansSection: { padding: 16, paddingBottom: 80 },
  planCatLabel: { fontSize: 12, fontWeight: "700", color: T.gray3, marginBottom: 10, letterSpacing: 0.5, textTransform: "uppercase" },
  empty: { color: T.gray3, fontSize: 14 },

  // ReturnCard — new card-style with image banner
  returnCard: {
    backgroundColor: T.white, borderRadius: 16, marginBottom: 14,
    borderWidth: 1, borderColor: T.gray5, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  returnImage: { width: "100%", height: 180, resizeMode: "cover" },
  returnImagePlaceholder: {
    width: "100%", height: 140, backgroundColor: T.bg,
    alignItems: "center", justifyContent: "center",
  },
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject as any,
    backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center",
    height: 180,
  },
  soldOutLabel: { color: T.white, fontWeight: "900", fontSize: 20, letterSpacing: 2 },
  billingBadgeSmall: {
    position: "absolute", top: 10, right: 10,
    backgroundColor: T.dark, borderRadius: 4, paddingVertical: 3, paddingHorizontal: 8,
  },
  billingBadgeSmallText: { color: T.white, fontSize: 10, fontWeight: "700" },
  returnBody: { padding: 14 },
  returnBodyTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  returnTitle: { fontSize: 15, fontWeight: "800", color: T.dark, flex: 1, marginRight: 8 },
  returnDesc: { fontSize: 12, color: T.gray2, lineHeight: 18, marginBottom: 10 },
  returnPrice: { fontSize: 20, fontWeight: "800", color: T.dark, letterSpacing: 0.5 },
  returnBilling: { fontSize: 12, color: T.gray3, fontWeight: "400" },
  supportBtn: {
    backgroundColor: T.red, borderRadius: 10,
    paddingVertical: 10, alignItems: "center", marginTop: 4,
  },
  supportBtnText: { color: T.white, fontSize: 13, fontWeight: "700" },
  remainingText: { fontSize: 11, color: T.red, fontWeight: "700", marginTop: 6, textAlign: "right" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: T.dark2, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 44,
  },
  modalHandle: {
    alignSelf: "center", width: 36, height: 4, borderRadius: 2,
    backgroundColor: "#333", marginTop: 12, marginBottom: 0,
  },
  modalContent: { padding: 24, alignItems: "center" },
  modalEmoji: { fontSize: 44, marginBottom: 10 },
  modalTitle: { fontSize: 22, fontWeight: "900", color: T.white, marginBottom: 8 },
  modalDesc: { fontSize: 13, color: T.gray3, lineHeight: 20, textAlign: "center", marginBottom: 20 },
  modalPriceBox: {
    backgroundColor: T.dark3, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    width: "100%", marginBottom: 24,
  },
  modalPriceLabel: { fontSize: 13, color: T.gray4 },
  modalPrice: { fontSize: 32, fontWeight: "800", color: T.white, letterSpacing: 0.5 },
  billingBadge: {
    backgroundColor: "#3D2E00", borderRadius: 4, paddingVertical: 3, paddingHorizontal: 8,
  },
  billingBadgeText: { fontSize: 10, fontWeight: "700", color: T.yellow },
  confirmBtn: {
    backgroundColor: T.red, borderRadius: 12, paddingVertical: 16,
    width: "100%", alignItems: "center",
  },
  confirmBtnText: { color: T.white, fontSize: 16, fontWeight: "800" },
  cancelBtn: { paddingVertical: 14, alignItems: "center", marginTop: 4, width: "100%" },
  cancelBtnText: { color: T.gray3, fontSize: 13 },
});
