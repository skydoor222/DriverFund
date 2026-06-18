import { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Image, Modal, Alert, ActivityIndicator, Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import {
  colors, spacing, typography, radius, shadow,
  categoryColor, categoryShort, categoryLabel,
} from "../../lib/theme";
import { achievementRate, type ReturnItem, type RaceResult, type Post, type Race } from "../../lib/types";
import { fetchDriver, type DriverLike } from "../../lib/drivers";
import { recordView, isFavorite, toggleFavorite } from "../../lib/history";
import { AchievementBar, Countdown, ChallengeCard } from "../../components/ui";

const TABS = ["ストーリー", "応援する", "投稿"] as const;
type Tab = typeof TABS[number];

// bio が物語型JSONなら分解、ただの文字列なら why に入れる
function parseStory(bio?: string) {
  if (!bio) return { why: "" };
  try {
    const p = JSON.parse(bio);
    if (p && typeof p === "object") return p as Record<string, string>;
  } catch { /* fallthrough */ }
  return { why: bio };
}

export default function DriverDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [driver, setDriver] = useState<DriverLike | null>(null);
  const [nextRace, setNextRace] = useState<Race | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("ストーリー");
  const [selected, setSelected] = useState<ReturnItem | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [fav, setFav] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const d = await fetchDriver(id);
    setDriver(d);

    const [{ data: items }, { data: postRows }] = await Promise.all([
      supabase.from("return_items").select("*").eq("driver_id", id).eq("is_active", true).order("price"),
      supabase.from("posts").select("*").eq("driver_id", id).order("created_at", { ascending: false }).limit(20),
    ]);
    setReturnItems(items ?? []);
    setPosts((postRows as Post[]) ?? []);

    // 次戦（カテゴリ一致の最も近い未来のレース）
    if (d) {
      const { data: race } = await supabase
        .from("races").select("*")
        .eq("category", d.category)
        .gte("race_date", new Date().toISOString().slice(0, 10))
        .order("race_date", { ascending: true }).limit(1).maybeSingle();
      setNextRace((race as Race) ?? null);
    }
    setLoading(false);
    recordView(id);
    setFav(await isFavorite(id, user?.id));
  }, [id, user]);

  useEffect(() => { load(); }, [load]);

  async function onToggleFav() {
    if (!id) return;
    const next = await toggleFavorite(id, user?.id);
    setFav(next);
  }

  async function handlePurchase() {
    if (!user) {
      Alert.alert("ログインが必要です", "応援するにはログインしてください", [
        { text: "キャンセル", style: "cancel" },
        { text: "ログイン", onPress: () => { setSelected(null); router.push("/(auth)/login"); } },
      ]);
      return;
    }
    if (!selected || !driver) return;
    setPurchasing(true);
    try {
      let paymentUrl = selected.stripe_payment_link_url;
      if (!paymentUrl) {
        const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
        const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
        const res = await fetch(`${url}/functions/v1/create-payment-link`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({ return_item_id: selected.id }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.error) throw new Error(data.error ?? "決済の準備に失敗しました。");
        paymentUrl = data.url;
      }
      if (paymentUrl) {
        setSelected(null);
        if (typeof window !== "undefined") {
          window.location.href = paymentUrl;
        } else {
          await Linking.openURL(paymentUrl);
        }
      }
      else Alert.alert("準備中", "このドライバーの決済設定がまだ完了していません。");
    } catch (e: any) {
      Alert.alert("エラー", e.message ?? "決済リンクの取得に失敗しました");
    } finally {
      setPurchasing(false);
    }
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  }

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.brand} size="large" /></View>;
  if (!driver) return (
    <View style={s.center}>
      <Ionicons name="car-sport-outline" size={40} color={colors.labelQuaternary} />
      <Text style={s.notFound}>ドライバーが見つかりません</Text>
      <Pressable onPress={goBack} style={{ marginTop: spacing.md }}>
        <Text style={{ color: colors.brand, fontWeight: "700" }}>← 戻る</Text>
      </Pressable>
    </View>
  );

  const cat = driver.category;
  const rate = achievementRate(driver);
  const story = parseStory(driver.bio);
  let timeline: { year: string; event: string }[] = [];
  try { if (driver.career_timeline) timeline = JSON.parse(driver.career_timeline); } catch {}
  let raceResults: RaceResult[] = [];
  try { if (driver.race_results) raceResults = JSON.parse(driver.race_results); } catch {}

  const lowestPrice = returnItems.length ? Math.min(...returnItems.map((i) => i.price)) : null;

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} stickyHeaderIndices={[2]}>
        {/* ── HERO (大カバー画像) ── */}
        <View style={s.hero}>
          {driver.cover_url ? (
            <Image source={{ uri: driver.cover_url }} style={s.heroImg} resizeMode="cover" />
          ) : (
            <View style={[s.heroImg, s.heroPlaceholder]}>
              <Ionicons name="car-sport" size={56} color={colors.labelQuaternary} />
            </View>
          )}
          <Pressable style={s.backBtn} onPress={goBack} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={colors.label} />
          </Pressable>
          <Pressable style={s.favBtn} onPress={onToggleFav} hitSlop={8}>
            <Ionicons name={fav ? "heart" : "heart-outline"} size={22} color={fav ? colors.brand : colors.label} />
          </Pressable>
          <View style={[s.catChip, { backgroundColor: categoryColor[cat] ?? colors.catOther }]}>
            <Text style={s.catChipTxt}>{categoryLabel[cat] ?? cat}</Text>
          </View>
        </View>

        {/* ── HEADER (名前・達成率・カウントダウン) ── */}
        <View style={s.headerBlock}>
          <View style={s.nameRow}>
            <Text style={s.name}>{driver.full_name}</Text>
            {driver.car_number ? <Text style={s.carNo}>#{driver.car_number}</Text> : null}
          </View>
          {(driver.team_name || driver.series_name) ? (
            <Text style={s.team}>{[driver.team_name, driver.series_name].filter(Boolean).join(" · ")}</Text>
          ) : null}
          {driver.catchphrase ? <Text style={s.catch}>{driver.catchphrase}</Text> : null}

          {/* 達成率（金額ベース） */}
          {driver.season_goal_amount ? (
            <View style={s.achieveCard}>
              <AchievementBar
                rate={rate}
                raised={driver.season_raised_amount}
                goal={driver.season_goal_amount}
              />
              <View style={s.achieveMeta}>
                <View style={s.achieveMetaItem}>
                  <Ionicons name="people" size={14} color={colors.labelTertiary} />
                  <Text style={s.achieveMetaTxt}>{driver.total_supporters ?? 0}人が応援中</Text>
                </View>
                {nextRace && (
                  <Countdown raceDate={nextRace.race_date} circuit={nextRace.circuit} />
                )}
              </View>
            </View>
          ) : (
            <View style={[s.achieveMeta, { marginTop: spacing.md }]}>
              <View style={s.achieveMetaItem}>
                <Ionicons name="people" size={14} color={colors.labelTertiary} />
                <Text style={s.achieveMetaTxt}>{driver.total_supporters ?? 0}人が応援中</Text>
              </View>
              {nextRace && <Countdown raceDate={nextRace.race_date} circuit={nextRace.circuit} />}
            </View>
          )}

          {/* SNS */}
          {(driver.sns_x || driver.sns_instagram) && (
            <View style={s.snsRow}>
              {driver.sns_x && (
                <Pressable style={s.snsBtn} onPress={() => Linking.openURL(`https://x.com/${driver.sns_x?.replace("@", "")}`)}>
                  <Ionicons name="logo-twitter" size={15} color={colors.labelSecondary} />
                  <Text style={s.snsTxt}>{driver.sns_x}</Text>
                </Pressable>
              )}
              {driver.sns_instagram && (
                <Pressable style={s.snsBtn} onPress={() => Linking.openURL(`https://instagram.com/${driver.sns_instagram?.replace("@", "")}`)}>
                  <Ionicons name="logo-instagram" size={15} color={colors.labelSecondary} />
                  <Text style={s.snsTxt}>{driver.sns_instagram}</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>

        {/* ── TABS (sticky) ── */}
        <View style={s.tabBar}>
          {TABS.map((t) => (
            <Pressable key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
              <Text style={[s.tabTxt, tab === t && s.tabTxtActive]}>{t}</Text>
            </Pressable>
          ))}
        </View>

        {/* ── STORY ── */}
        {tab === "ストーリー" && (
          <View style={s.tabBody}>
            {/* チャレンジ（目標）— 参考アプリ風。最上部で挑戦を宣言 */}
            {driver.goal ? (
              <ChallengeCard goals={driver.goal.split("\n").map((l) => l.trim()).filter(Boolean)} />
            ) : null}

            {story.conflict ? (
              <View style={s.conflictCard}>
                <View style={s.conflictHead}>
                  <Ionicons name="flash" size={15} color={colors.brand} />
                  <Text style={s.conflictLabel}>今、直面している壁</Text>
                </View>
                <Text style={s.conflictTxt}>{story.conflict}</Text>
              </View>
            ) : null}

            {story.why ? (
              <Section title="なぜレースを続けるのか">
                <Text style={s.bodyTxt}>{story.why}</Text>
              </Section>
            ) : null}

            {story.now ? (
              <Section title="今シーズンの状況">
                <Text style={s.bodyTxt}>{story.now}</Text>
              </Section>
            ) : null}

            {/* メタ情報 */}
            {(driver.age || driver.hometown || driver.motto) && (
              <Section title="プロフィール">
                <View style={s.metaList}>
                  {driver.age ? <MetaRow icon="calendar-outline" label="年齢" value={`${driver.age}歳`} /> : null}
                  {driver.hometown ? <MetaRow icon="location-outline" label="出身" value={driver.hometown} /> : null}
                  {driver.blood_type ? <MetaRow icon="water-outline" label="血液型" value={`${driver.blood_type}型`} /> : null}
                  {driver.motto ? <MetaRow icon="bookmark-outline" label="座右の銘" value={driver.motto} /> : null}
                </View>
              </Section>
            )}

            {/* 経歴 */}
            {timeline.length > 0 && (
              <Section title="経歴">
                {timeline.map((t, i) => (
                  <View key={i} style={s.tlRow}>
                    <Text style={s.tlYear}>{t.year}</Text>
                    <View style={s.tlDotCol}>
                      <View style={s.tlDot} />
                      {i < timeline.length - 1 && <View style={s.tlLine} />}
                    </View>
                    <Text style={s.tlEvent}>{t.event}</Text>
                  </View>
                ))}
              </Section>
            )}

            {/* 今季レース結果 */}
            {raceResults.length > 0 && (
              <Section title="今季レース結果">
                <View style={s.tblHead}>
                  <Text style={[s.tblHCell, { width: 32 }]}>Rd</Text>
                  <Text style={[s.tblHCell, { flex: 1 }]}>サーキット</Text>
                  <Text style={[s.tblHCell, { width: 40, textAlign: "center" }]}>予選</Text>
                  <Text style={[s.tblHCell, { width: 40, textAlign: "center" }]}>決勝</Text>
                  <Text style={[s.tblHCell, { width: 44, textAlign: "right" }]}>Pt</Text>
                </View>
                {raceResults.map((r, i) => {
                  const podium = r.race != null && r.race <= 3;
                  return (
                    <View key={i} style={[s.tblRow, i % 2 === 1 && { backgroundColor: colors.surfaceAlt }]}>
                      <Text style={[s.tblCell, { width: 32, color: colors.labelTertiary }]}>{r.round}</Text>
                      <Text style={[s.tblCell, { flex: 1 }]} numberOfLines={1}>{r.circuit}</Text>
                      <Text style={[s.tblCell, { width: 40, textAlign: "center", color: colors.labelTertiary }]}>
                        {r.qualifying != null ? `P${r.qualifying}` : "—"}
                      </Text>
                      <Text style={[s.tblCell, { width: 40, textAlign: "center", fontWeight: podium ? "800" : "400", color: podium ? colors.brand : colors.label }]}>
                        {r.race != null ? `P${r.race}` : "—"}
                      </Text>
                      <Text style={[s.tblCell, { width: 44, textAlign: "right", fontWeight: r.points !== "0" ? "700" : "400" }]}>{r.points}</Text>
                    </View>
                  );
                })}
              </Section>
            )}

            {/* ギャラリー */}
            {driver.photo_urls && driver.photo_urls.length > 0 && (
              <Section title="フォトギャラリー">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", gap: spacing.sm }}>
                    {driver.photo_urls.map((url, i) => (
                      <Image key={i} source={{ uri: url }} style={s.galleryImg} />
                    ))}
                  </View>
                </ScrollView>
              </Section>
            )}

            {/* 目標 */}
            {driver.goal ? (
              <Section title="今季の目標">
                {driver.goal.split("\n").filter(Boolean).map((line, i) => (
                  <View key={i} style={s.goalRow}>
                    <Ionicons name="flag" size={14} color={colors.brand} style={{ marginTop: 3 }} />
                    <Text style={s.goalTxt}>{line}</Text>
                  </View>
                ))}
              </Section>
            ) : null}
          </View>
        )}

        {/* ── 応援する ── */}
        {tab === "応援する" && (
          <View style={s.tabBody}>
            {/* パーソナルスポンサー イントロ（参考アプリ風） */}
            <View style={s.sponsorIntro}>
              <Ionicons name="star" size={18} color={colors.brand} />
              <Text style={s.sponsorIntroTxt}>
                スポンサーになって{driver.full_name}を応援しよう！
              </Text>
            </View>

            {story.fund_usage ? (
              <View style={s.fundCard}>
                <Text style={s.fundTitle}>あなたの支援で変わること</Text>
                <Text style={s.fundTxt}>{story.fund_usage}</Text>
              </View>
            ) : null}
            {returnItems.length > 0 ? (
              returnItems.map((item) => (
                <ReturnCard key={item.id} item={item} onPress={() => setSelected(item)} />
              ))
            ) : (
              <View style={s.emptyPlans}>
                <Ionicons name="gift-outline" size={36} color={colors.labelQuaternary} />
                <Text style={s.emptyPlansTxt}>応援プランは準備中です</Text>
              </View>
            )}
          </View>
        )}

        {/* ── 投稿 ── */}
        {tab === "投稿" && (
          <View style={s.tabBody}>
            {posts.length > 0 ? (
              posts.map((p) => (
                <View key={p.id} style={s.postCard}>
                  <View style={s.postHead}>
                    {driver.avatar_url ? (
                      <Image source={{ uri: driver.avatar_url }} style={s.postAvatar} />
                    ) : (
                      <View style={[s.postAvatar, s.postAvatarPh]}>
                        <Text style={s.postAvatarTxt}>{driver.full_name?.[0]}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={s.postName}>{driver.full_name}</Text>
                      <Text style={s.postDate}>{formatPostDate(p.created_at)}</Text>
                    </View>
                  </View>
                  {p.title ? <Text style={s.postTitle}>{p.title}</Text> : null}
                  <Text style={s.postBody}>{p.body}</Text>
                  {p.image_urls && p.image_urls.length > 0 && (
                    <Image source={{ uri: p.image_urls[0] }} style={s.postImg} />
                  )}
                </View>
              ))
            ) : (
              <View style={s.emptyPlans}>
                <Ionicons name="newspaper-outline" size={36} color={colors.labelQuaternary} />
                <Text style={s.emptyPlansTxt}>まだ投稿がありません</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── 固定フッターCTA ── */}
      {returnItems.length > 0 && (
        <View style={s.footer}>
          <View>
            <Text style={s.footerLabel}>最小応援額</Text>
            <Text style={s.footerPrice}>¥{(lowestPrice ?? 0).toLocaleString()}〜</Text>
          </View>
          <Pressable style={s.footerBtn} onPress={() => setTab("応援する")}>
            <Ionicons name="star" size={16} color={colors.white} />
            <Text style={s.footerBtnTxt}>スポンサーになる</Text>
          </Pressable>
        </View>
      )}

      {/* ── 購入モーダル ── */}
      <Modal visible={!!selected} animationType="slide" transparent>
        <Pressable style={s.modalOverlay} onPress={() => setSelected(null)}>
          <Pressable style={s.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={s.modalHandle} />
            {selected && (
              <View style={s.modalContent}>
                {selected.image_url ? (
                  <Image source={{ uri: selected.image_url }} style={s.modalImg} />
                ) : null}
                <Text style={s.modalTitle}>{selected.title}</Text>
                {selected.description ? <Text style={s.modalDesc}>{selected.description}</Text> : null}
                <View style={s.modalPriceBox}>
                  <Text style={s.modalPriceLabel}>{selected.billing_type === "monthly" ? "月額" : "金額"}</Text>
                  <Text style={s.modalPrice}>¥{selected.price.toLocaleString()}</Text>
                </View>
                <Pressable style={[s.modalConfirm, purchasing && { opacity: 0.6 }]} onPress={handlePurchase} disabled={purchasing}>
                  <Text style={s.modalConfirmTxt}>{purchasing ? "処理中..." : "この内容で応援する"}</Text>
                </Pressable>
                <Pressable style={s.modalCancel} onPress={() => setSelected(null)}>
                  <Text style={s.modalCancelTxt}>キャンセル</Text>
                </Pressable>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ── ヘルパー ──
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <View style={s.sectionTitleRow}>
        <View style={s.sectionAccent} />
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function MetaRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={s.metaRow}>
      <Ionicons name={icon} size={16} color={colors.labelTertiary} />
      <Text style={s.metaLabel}>{label}</Text>
      <Text style={s.metaValue}>{value}</Text>
    </View>
  );
}

function ReturnCard({ item, onPress }: { item: ReturnItem; onPress: () => void }) {
  const soldOut = item.remaining === 0;
  return (
    <Pressable style={[s.returnCard, soldOut && { opacity: 0.5 }]} onPress={onPress} disabled={soldOut}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={s.returnImg} />
      ) : (
        <View style={[s.returnImg, s.returnImgPh]}>
          <Ionicons name="gift" size={32} color={colors.labelQuaternary} />
        </View>
      )}
      <View style={s.returnBody}>
        <View style={s.returnTop}>
          <Text style={s.returnTitle} numberOfLines={2}>{item.title}</Text>
          <View style={s.billPill}>
            <Text style={s.billPillTxt}>{item.billing_type === "monthly" ? "月額" : "単発"}</Text>
          </View>
        </View>
        {item.description ? <Text style={s.returnDesc} numberOfLines={2}>{item.description}</Text> : null}
        <View style={s.returnFoot}>
          <Text style={s.returnPrice}>
            ¥{item.price.toLocaleString()}
            {item.billing_type === "monthly" && <Text style={s.returnPer}>/月</Text>}
          </Text>
          {soldOut ? (
            <Text style={s.soldOut}>満了</Text>
          ) : (
            <View style={s.returnCta}>
              <Text style={s.returnCtaTxt}>応援する</Text>
              <Ionicons name="arrow-forward" size={13} color={colors.white} />
            </View>
          )}
        </View>
        {item.remaining != null && item.remaining > 0 && item.remaining <= 5 && (
          <Text style={s.remaining}>残り{item.remaining}枠</Text>
        )}
      </View>
    </Pressable>
  );
}

function formatPostDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgGrouped },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, gap: spacing.sm },
  notFound: { ...typography.subhead, color: colors.labelTertiary },

  // Hero
  hero: { height: 260, position: "relative", backgroundColor: colors.bgGrouped },
  heroImg: { width: "100%", height: "100%" },
  heroPlaceholder: { alignItems: "center", justifyContent: "center" },
  backBtn: {
    position: "absolute", top: 48, left: spacing.lg, width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center", ...shadow.sm,
  },
  favBtn: {
    position: "absolute", top: 48, right: spacing.lg, width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center", ...shadow.sm,
  },
  catChip: {
    position: "absolute", bottom: spacing.md, left: spacing.lg,
    borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 4,
  },
  catChipTxt: { color: colors.white, fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },

  // Header
  headerBlock: { backgroundColor: colors.bg, padding: spacing.xl, gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  name: { ...typography.title1, color: colors.label },
  carNo: { ...typography.headline, color: colors.labelTertiary, fontWeight: "800" },
  team: { ...typography.subhead, color: colors.labelTertiary },
  catch: { ...typography.callout, color: colors.labelSecondary, fontStyle: "italic", marginTop: spacing.sm, lineHeight: 23 },

  achieveCard: {
    backgroundColor: colors.bgWarm, borderRadius: radius.lg, padding: spacing.lg,
    marginTop: spacing.lg, gap: spacing.md,
  },
  achieveMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: spacing.sm },
  achieveMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  achieveMetaTxt: { ...typography.footnote, color: colors.labelSecondary, fontWeight: "600" },

  snsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  snsBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 10,
  },
  snsTxt: { ...typography.footnote, color: colors.labelSecondary, fontWeight: "600" },

  // Tabs
  tabBar: { flexDirection: "row", backgroundColor: colors.bg, borderBottomWidth: 1, borderBottomColor: colors.separator },
  tab: { flex: 1, paddingVertical: 13, alignItems: "center", borderBottomWidth: 2.5, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: colors.brand },
  tabTxt: { ...typography.subhead, fontWeight: "600", color: colors.labelTertiary },
  tabTxtActive: { color: colors.brand, fontWeight: "700" },

  tabBody: { padding: spacing.lg, gap: spacing.md },

  // Section
  section: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, ...shadow.sm },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  sectionAccent: { width: 3, height: 18, backgroundColor: colors.brand, borderRadius: 2 },
  sectionTitle: { ...typography.headline, color: colors.label },
  bodyTxt: { ...typography.callout, color: colors.labelSecondary, lineHeight: 27 },

  conflictCard: {
    backgroundColor: colors.brandTint, borderRadius: radius.lg, padding: spacing.lg,
    borderLeftWidth: 4, borderLeftColor: colors.brand,
  },
  conflictHead: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: spacing.sm },
  conflictLabel: { ...typography.caption2, color: colors.brand, fontWeight: "800" },
  conflictTxt: { ...typography.headline, color: colors.label, lineHeight: 26 },

  metaList: { gap: spacing.sm },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  metaLabel: { ...typography.footnote, color: colors.labelTertiary, width: 64 },
  metaValue: { ...typography.subhead, color: colors.label, flex: 1 },

  // Timeline
  tlRow: { flexDirection: "row", gap: spacing.sm },
  tlYear: { ...typography.footnote, fontWeight: "800", color: colors.brand, width: 44, paddingTop: 1 },
  tlDotCol: { width: 16, alignItems: "center" },
  tlDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brand, marginTop: 4 },
  tlLine: { flex: 1, width: 2, backgroundColor: colors.separator, minHeight: 20 },
  tlEvent: { ...typography.subhead, color: colors.labelSecondary, flex: 1, paddingBottom: spacing.lg, lineHeight: 22 },

  // Table
  tblHead: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 4, borderBottomWidth: 1.5, borderBottomColor: colors.separator },
  tblHCell: { ...typography.caption2, color: colors.labelTertiary, fontWeight: "700" },
  tblRow: { flexDirection: "row", paddingVertical: 9, paddingHorizontal: 4, borderRadius: radius.sm },
  tblCell: { ...typography.footnote, color: colors.label },

  galleryImg: { width: 200, height: 134, borderRadius: radius.md, backgroundColor: colors.bgGrouped },

  goalRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  goalTxt: { ...typography.subhead, color: colors.labelSecondary, flex: 1, lineHeight: 24 },

  // Sponsor intro
  sponsorIntro: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.brandTint, borderRadius: radius.lg, padding: spacing.lg,
  },
  sponsorIntroTxt: { ...typography.headline, color: colors.brand, flex: 1, lineHeight: 23 },

  // Fund
  fundCard: { backgroundColor: colors.bgWarm, borderRadius: radius.lg, padding: spacing.lg },
  fundTitle: { ...typography.headline, color: colors.brand, marginBottom: spacing.sm },
  fundTxt: { ...typography.subhead, color: colors.labelSecondary, lineHeight: 24 },

  // Return card
  returnCard: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: "hidden", ...shadow.sm },
  returnImg: { width: "100%", height: 170 },
  returnImgPh: { backgroundColor: colors.bgGrouped, alignItems: "center", justifyContent: "center" },
  returnBody: { padding: spacing.lg },
  returnTop: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm, marginBottom: 4 },
  returnTitle: { ...typography.headline, color: colors.label, flex: 1 },
  billPill: { backgroundColor: colors.bgGrouped, borderRadius: radius.sm - 2, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  billPillTxt: { ...typography.caption, fontWeight: "700", color: colors.labelSecondary },
  returnDesc: { ...typography.footnote, color: colors.labelTertiary, lineHeight: 18, marginBottom: spacing.md },
  returnFoot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  returnPrice: { ...typography.title3, color: colors.label, fontWeight: "900" },
  returnPer: { ...typography.footnote, color: colors.labelTertiary, fontWeight: "400" },
  returnCta: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.brand, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: 9 },
  returnCtaTxt: { color: colors.white, ...typography.footnote, fontWeight: "700" },
  soldOut: { ...typography.footnote, fontWeight: "800", color: colors.labelTertiary },
  remaining: { ...typography.caption, color: colors.brand, fontWeight: "700", marginTop: spacing.sm, textAlign: "right" },

  emptyPlans: { alignItems: "center", paddingVertical: 56, gap: spacing.sm },
  emptyPlansTxt: { ...typography.subhead, color: colors.labelTertiary },

  // Post
  postCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, ...shadow.sm },
  postHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  postAvatar: { width: 40, height: 40, borderRadius: 20 },
  postAvatarPh: { backgroundColor: colors.bgGrouped, alignItems: "center", justifyContent: "center" },
  postAvatarTxt: { ...typography.headline, color: colors.labelSecondary },
  postName: { ...typography.subhead, fontWeight: "700", color: colors.label },
  postDate: { ...typography.caption, color: colors.labelTertiary },
  postTitle: { ...typography.headline, color: colors.label, marginBottom: 6 },
  postBody: { ...typography.subhead, color: colors.labelSecondary, lineHeight: 23 },
  postImg: { width: "100%", height: 200, borderRadius: radius.md, marginTop: spacing.md, backgroundColor: colors.bgGrouped },

  // Footer CTA
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.bg, paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: 28,
    borderTopWidth: 1, borderTopColor: colors.separator,
  },
  footerLabel: { ...typography.caption, color: colors.labelTertiary },
  footerPrice: { ...typography.title3, color: colors.label, fontWeight: "900" },
  footerBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.brand, borderRadius: radius.pill, paddingHorizontal: spacing.xxl, paddingVertical: 13, ...shadow.brand },
  footerBtnTxt: { color: colors.white, ...typography.headline },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
  modalHandle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, marginTop: spacing.md },
  modalContent: { padding: spacing.xxl, alignItems: "center" },
  modalImg: { width: "100%", height: 180, borderRadius: radius.lg, marginBottom: spacing.lg },
  modalTitle: { ...typography.title3, color: colors.label, textAlign: "center", marginBottom: spacing.sm },
  modalDesc: { ...typography.footnote, color: colors.labelTertiary, textAlign: "center", lineHeight: 20, marginBottom: spacing.lg },
  modalPriceBox: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.bgGrouped, borderRadius: radius.lg, padding: spacing.lg, width: "100%", marginBottom: spacing.lg },
  modalPriceLabel: { ...typography.subhead, color: colors.labelSecondary },
  modalPrice: { ...typography.title2, color: colors.label, fontWeight: "900" },
  modalConfirm: { backgroundColor: colors.brand, borderRadius: radius.lg, paddingVertical: 15, width: "100%", alignItems: "center", ...shadow.brand },
  modalConfirmTxt: { color: colors.white, ...typography.headline },
  modalCancel: { paddingVertical: spacing.md, marginTop: 4 },
  modalCancelTxt: { ...typography.subhead, color: colors.labelTertiary },
});
