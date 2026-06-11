import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { RacingCategory } from "../../lib/types";
import { colors, spacing, typography } from "../../lib/theme";
import {
  Button, Input, SegmentedControl, AvatarUpload, CoverUpload, SectionHeader,
} from "../../components/ui";

const CATEGORIES: { value: RacingCategory; label: string }[] = [
  { value: "kart", label: "カート" },
  { value: "f4", label: "F4" },
  { value: "sf", label: "SF" },
  { value: "other", label: "その他" },
];

export default function SetupScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [driverId, setDriverId] = useState<string | null>(null);

  // 基本
  const [catchphrase, setCatchphrase] = useState("");
  const [hometown, setHometown] = useState("");
  const [age, setAge] = useState("");
  const [category, setCategory] = useState<RacingCategory>("f4");
  const [seriesName, setSeriesName] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [teamName, setTeamName] = useState("");
  const [snsX, setSnsX] = useState("");
  const [snsInstagram, setSnsInstagram] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);

  // 物語型ストーリー
  const [storyConflict, setStoryConflict] = useState("");
  const [storyWhy, setStoryWhy] = useState("");
  const [storyNow, setStoryNow] = useState("");
  const [goal, setGoal] = useState("");
  const [raceHistory, setRaceHistory] = useState("");
  const [fundUsage, setFundUsage] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [currentFund, setCurrentFund] = useState("");

  useEffect(() => { if (user) loadDriver(); }, [user]);

  async function loadDriver() {
    setLoading(true);
    const { data } = await supabase.from("drivers").select("*").eq("profile_id", user!.id).single();
    if (data) {
      setDriverId(data.id);
      setCatchphrase(data.catchphrase ?? "");
      setHometown(data.hometown ?? "");
      setAge(data.age?.toString() ?? "");
      setCategory(data.category ?? "f4");
      setSeriesName(data.series_name ?? "");
      setCarNumber(data.car_number ?? "");
      setTeamName(data.team_name ?? "");
      setSnsX(data.sns_x ?? "");
      setSnsInstagram(data.sns_instagram ?? "");
      setAvatarUrl(data.avatar_url ?? null);
      setCoverUrl(data.cover_url ?? null);
      setIsPublished(data.is_published ?? false);
      setGoal(data.goal ?? "");
      setRaceHistory(data.race_history ?? "");
      try {
        const parsed = data.bio ? JSON.parse(data.bio) : null;
        if (parsed && parsed.conflict !== undefined) {
          setStoryConflict(parsed.conflict ?? "");
          setStoryWhy(parsed.why ?? "");
          setStoryNow(parsed.now ?? "");
          setFundUsage(parsed.fund_usage ?? "");
          setTotalBudget(parsed.total_budget ?? "");
          setCurrentFund(parsed.current_fund ?? "");
        } else {
          setStoryWhy(data.bio ?? "");
        }
      } catch {
        setStoryWhy(data.bio ?? "");
      }
    }
    setLoading(false);
  }

  async function handleSave(publish = false) {
    if (!user) return;
    setSaving(true);
    const bioJson = JSON.stringify({
      conflict: storyConflict, why: storyWhy, now: storyNow,
      fund_usage: fundUsage, total_budget: totalBudget, current_fund: currentFund,
    });

    const payload = {
      profile_id: user.id,
      catchphrase, bio: bioJson, hometown,
      age: age ? parseInt(age) : null,
      category, series_name: seriesName, car_number: carNumber,
      team_name: teamName, race_history: raceHistory, goal,
      sns_x: snsX, sns_instagram: snsInstagram,
      avatar_url: avatarUrl, cover_url: coverUrl,
      is_published: publish || isPublished,
    };

    let error;
    let isNew = false;
    if (driverId) {
      ({ error } = await supabase.from("drivers").update(payload).eq("id", driverId));
    } else {
      const { data, error: e } = await supabase.from("drivers").insert(payload).select().single();
      if (data) { setDriverId(data.id); isNew = true; }
      error = e;
    }
    setSaving(false);
    if (error) { Alert.alert("エラー", error.message); return; }
    if (publish) setIsPublished(true);
    if (isNew || publish) {
      router.replace("/(driver)/dashboard");
    } else {
      Alert.alert("保存しました", "下書きを保存しました");
    }
  }

  function onImgError(msg: string) { Alert.alert("画像エラー", msg); }

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.brand} /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.pageTitle}>プロフィール設定</Text>
      <Text style={styles.pageSub}>応援者があなたを知るための情報を入力します</Text>

      {/* ── カバー＋アバター ── */}
      <View style={styles.mediaBlock}>
        <CoverUpload
          bucket="covers" pathPrefix={user!.id} value={coverUrl}
          onChange={setCoverUrl} onError={onImgError}
          aspect={[16, 9]} height={150}
        />
        <View style={styles.avatarOverlap}>
          <AvatarUpload
            bucket="avatars" pathPrefix={user!.id} value={avatarUrl}
            onChange={setAvatarUrl} onError={onImgError} size={92}
          />
        </View>
      </View>

      {/* ── 基本情報 ── */}
      <SectionHeader title="基本情報" />
      <Input label="キャッチフレーズ" value={catchphrase} onChangeText={setCatchphrase}
        placeholder="一言で自分を表すフレーズ" />

      <Text style={styles.label}>カテゴリ</Text>
      <View style={{ marginBottom: spacing.lg }}>
        <SegmentedControl options={CATEGORIES} value={category} onChange={setCategory} />
      </View>

      <View style={styles.row}>
        <Input containerStyle={{ flex: 1 }} label="シリーズ名" value={seriesName}
          onChangeText={setSeriesName} placeholder="全日本F4選手権" />
        <Input containerStyle={{ width: 96 }} label="カーNo." value={carNumber}
          onChangeText={setCarNumber} placeholder="7" keyboardType="numeric" />
      </View>

      <Input label="チーム名" value={teamName} onChangeText={setTeamName} placeholder="○○ Racing" />

      <View style={styles.row}>
        <Input containerStyle={{ flex: 1 }} label="出身地" value={hometown}
          onChangeText={setHometown} placeholder="東京都" />
        <Input containerStyle={{ width: 96 }} label="年齢" value={age}
          onChangeText={setAge} placeholder="19" keyboardType="numeric" />
      </View>

      {/* ── ストーリー ── */}
      <SectionHeader title="ストーリー" note="支援者が「応援したい」と感じるのはスペックではなく物語です" />

      <Input label="⚡ 今、直面している壁" value={storyConflict} onChangeText={setStoryConflict}
        placeholder="例：参戦費用300万円のうち150万円が未調達" multiline
        hint="具体的な数字や状況を書くほど刺さります" />

      <Input label="🔥 なぜレースを続けるのか" value={storyWhy} onChangeText={setStoryWhy}
        placeholder="レースを始めたきっかけ、続ける理由" multiline
        hint="原体験・諦めなかった理由を正直に" />

      <Input label="📍 今シーズンの状況" value={storyNow} onChangeText={setStoryNow}
        placeholder="現在地と次のステップ" multiline
        hint="例：第3戦終了時点でランキング5位" />

      {/* ── 資金状況 ── */}
      <SectionHeader title="支援で何が変わるか" note="応援ボタンを押す直前に読まれる最重要セクション" />

      <View style={styles.row}>
        <Input containerStyle={{ flex: 1 }} label="今季総費用（万円）" value={totalBudget}
          onChangeText={setTotalBudget} placeholder="300" keyboardType="numeric" />
        <Input containerStyle={{ flex: 1 }} label="調達済み（万円）" value={currentFund}
          onChangeText={setCurrentFund} placeholder="87" keyboardType="numeric" />
      </View>

      <Input label="支援の具体的な使い道" value={fundUsage} onChangeText={setFundUsage}
        placeholder={"例：月1,000円×10人 → タイヤ代1セット分"} multiline
        hint="月1,000円が10人集まったら何ができる？具体的に書くほど響きます" />

      {/* ── 実績・目標 ── */}
      <SectionHeader title="実績・目標" />
      <Input label="主な戦績" value={raceHistory} onChangeText={setRaceHistory}
        placeholder="2024年 全日本F4第3戦 3位..." multiline />
      <Input label="今シーズンの目標" value={goal} onChangeText={setGoal}
        placeholder="シリーズランキングTOP5入り" multiline />

      {/* ── SNS ── */}
      <SectionHeader title="SNS" />
      <Input label="X (Twitter)" value={snsX} onChangeText={setSnsX} placeholder="@username" autoCapitalize="none" />
      <Input label="Instagram" value={snsInstagram} onChangeText={setSnsInstagram} placeholder="@username" autoCapitalize="none" />

      {/* ── ボタン ── */}
      <View style={styles.btns}>
        <Button title="下書き保存" variant="secondary" loading={saving} onPress={() => handleSave(false)} style={{ flex: 1 }} fullWidth={false} />
        <Button title={isPublished ? "更新して公開" : "公開する"} variant="primary" loading={saving} onPress={() => handleSave(true)} style={{ flex: 1 }} fullWidth={false} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingTop: 56, paddingBottom: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg },
  pageTitle: { ...typography.title1, color: colors.label },
  pageSub: { ...typography.subhead, color: colors.labelTertiary, marginTop: 4, marginBottom: spacing.xxl },

  mediaBlock: { marginBottom: 52 },
  avatarOverlap: { position: "absolute", bottom: -46, left: spacing.lg },

  label: { ...typography.footnote, fontWeight: "600", color: colors.labelSecondary, marginBottom: 7 },
  row: { flexDirection: "row", gap: spacing.md },
  btns: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xxxl },
});
