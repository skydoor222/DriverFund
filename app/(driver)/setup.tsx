import { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, Image, ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { RacingCategory } from "../../lib/types";

const T = {
  red: "#E8002D", dark: "#0A0A0A", dark2: "#111", dark3: "#1A1A1A",
  gray1: "#222", gray3: "#888", gray5: "#2A2A2A", white: "#FFF",
};

const CATEGORIES: { value: RacingCategory; label: string }[] = [
  { value: "kart", label: "カート" },
  { value: "f4", label: "FIA-F4" },
  { value: "sf", label: "スーパーフォーミュラ" },
  { value: "other", label: "その他" },
];

export default function SetupScreen() {
  const { user } = useAuth();
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
  const [isPublished, setIsPublished] = useState(false);

  // 物語型ストーリー（3分割）
  const [storyConflict, setStoryConflict] = useState("");   // 葛藤：今直面している壁
  const [storyWhy, setStoryWhy] = useState("");             // 原点：なぜレースを続けるのか
  const [storyNow, setStoryNow] = useState("");             // 今：今シーズンの状況

  // 目標・戦績
  const [goal, setGoal] = useState("");
  const [raceHistory, setRaceHistory] = useState("");

  // 支援の使い道
  const [fundUsage, setFundUsage] = useState("");           // 支援で何が変わるか

  // 参戦費用（数字）
  const [totalBudget, setTotalBudget] = useState("");       // 今シーズン総費用（万円）
  const [currentFund, setCurrentFund] = useState("");       // 現在集まっている額（万円）

  useEffect(() => { if (user) loadDriver(); }, [user]);

  async function loadDriver() {
    setLoading(true);
    const { data } = await supabase
      .from("drivers")
      .select("*")
      .eq("profile_id", user!.id)
      .single();

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
      setIsPublished(data.is_published ?? false);
      setGoal(data.goal ?? "");
      setRaceHistory(data.race_history ?? "");
      // 物語フィールド（bioをパース or そのまま）
      try {
        const parsed = data.bio ? JSON.parse(data.bio) : null;
        if (parsed && parsed.conflict) {
          setStoryConflict(parsed.conflict ?? "");
          setStoryWhy(parsed.why ?? "");
          setStoryNow(parsed.now ?? "");
          setFundUsage(parsed.fund_usage ?? "");
          setTotalBudget(parsed.total_budget ?? "");
          setCurrentFund(parsed.current_fund ?? "");
        } else {
          // 旧フォーマット（文字列）はそのままwhyに入れる
          setStoryWhy(data.bio ?? "");
        }
      } catch {
        setStoryWhy(data.bio ?? "");
      }
    }
    setLoading(false);
  }

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await uploadAvatar(result.assets[0].uri);
    }
  }

  async function uploadAvatar(uri: string) {
    const ext = uri.split(".").pop() ?? "jpg";
    const fileName = `${user!.id}/avatar.${ext}`;
    const response = await fetch(uri);
    const blob = await response.blob();
    const { error } = await supabase.storage.from("avatars").upload(fileName, blob, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
      setAvatarUrl(data.publicUrl);
    }
  }

  async function handleSave(publish = false) {
    setSaving(true);
    // bioをJSONで保存
    const bioJson = JSON.stringify({
      conflict: storyConflict,
      why: storyWhy,
      now: storyNow,
      fund_usage: fundUsage,
      total_budget: totalBudget,
      current_fund: currentFund,
    });

    const payload = {
      profile_id: user!.id,
      catchphrase, bio: bioJson, hometown,
      age: age ? parseInt(age) : null,
      category, series_name: seriesName, car_number: carNumber,
      team_name: teamName, race_history: raceHistory, goal,
      sns_x: snsX, sns_instagram: snsInstagram,
      avatar_url: avatarUrl,
      is_published: publish || isPublished,
    };

    let error;
    if (driverId) {
      ({ error } = await supabase.from("drivers").update(payload).eq("id", driverId));
    } else {
      const { data, error: e } = await supabase.from("drivers").insert(payload).select().single();
      if (data) setDriverId(data.id);
      error = e;
    }
    setSaving(false);
    if (error) Alert.alert("エラー", error.message);
    else {
      if (publish) setIsPublished(true);
      Alert.alert("保存しました", publish ? "プロフィールを公開しました！" : "下書きを保存しました");
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={T.red} /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>プロフィール設定</Text>

      {/* ── アバター ── */}
      <TouchableOpacity style={styles.avatarSection} onPress={pickAvatar}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>写真を追加</Text>
          </View>
        )}
        <Text style={styles.avatarHint}>タップして変更</Text>
      </TouchableOpacity>

      {/* ── 基本情報 ── */}
      <SectionHeader label="基本情報" />
      <Field label="キャッチフレーズ" value={catchphrase} onChange={setCatchphrase}
        placeholder="一言で自分を表すフレーズ" />

      <Text style={styles.label}>カテゴリ</Text>
      <View style={styles.categoryRow}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity key={c.value}
            style={[styles.catBtn, category === c.value && styles.catBtnActive]}
            onPress={() => setCategory(c.value)}>
            <Text style={[styles.catBtnText, category === c.value && styles.catBtnTextActive]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Field label="シリーズ名" value={seriesName} onChange={setSeriesName} placeholder="全日本F4選手権" />
        </View>
        <View style={{ width: 80 }}>
          <Field label="カーナンバー" value={carNumber} onChange={setCarNumber} placeholder="#7" />
        </View>
      </View>

      <Field label="チーム名" value={teamName} onChange={setTeamName} placeholder="○○ Racing" />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Field label="出身地" value={hometown} onChange={setHometown} placeholder="東京都" />
        </View>
        <View style={{ width: 80 }}>
          <Field label="年齢" value={age} onChange={setAge} placeholder="19" keyboardType="numeric" />
        </View>
      </View>

      {/* ── ストーリー（物語型） ── */}
      <SectionHeader label="ストーリー" note="支援者が「応援したい」と感じるのはスペックではなくあなたの物語です" />

      <View style={styles.storyCard}>
        <Text style={styles.storyCardIcon}>⚡</Text>
        <Text style={styles.storyCardTitle}>今、あなたが直面している壁</Text>
        <Text style={styles.storyCardHint}>
          具体的な数字や状況を書くほど刺さります{"\n"}
          例：「今シーズンの参戦費用300万円のうち150万円が未調達」
        </Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          value={storyConflict}
          onChangeText={setStoryConflict}
          placeholder="今直面している課題・壁を正直に書いてください"
          placeholderTextColor={T.gray3}
          multiline numberOfLines={4}
        />
      </View>

      <View style={styles.storyCard}>
        <Text style={styles.storyCardIcon}>🔥</Text>
        <Text style={styles.storyCardTitle}>なぜレースを続けるのか</Text>
        <Text style={styles.storyCardHint}>
          原体験・きっかけ・諦めなかった理由{"\n"}
          例：「7歳のとき父に連れて行かれたカート場で…」
        </Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          value={storyWhy}
          onChangeText={setStoryWhy}
          placeholder="レースを始めたきっかけ、続ける理由を教えてください"
          placeholderTextColor={T.gray3}
          multiline numberOfLines={5}
        />
      </View>

      <View style={styles.storyCard}>
        <Text style={styles.storyCardIcon}>📍</Text>
        <Text style={styles.storyCardTitle}>今シーズンの状況</Text>
        <Text style={styles.storyCardHint}>
          現在地と次のステップ{"\n"}
          例：「第3戦終了時点でランキング5位。表彰台まであと一歩」
        </Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          value={storyNow}
          onChangeText={setStoryNow}
          placeholder="今シーズンの現在地・手ごたえを書いてください"
          placeholderTextColor={T.gray3}
          multiline numberOfLines={4}
        />
      </View>

      {/* ── 支援の使い道 ── */}
      <SectionHeader label="支援で何が変わるか" note="応援ボタンを押す直前に読まれる最重要セクション" />

      <View style={styles.budgetRow}>
        <View style={{ flex: 1 }}>
          <Field label="今シーズン総費用（万円）" value={totalBudget} onChange={setTotalBudget}
            placeholder="300" keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="現在集まっている額（万円）" value={currentFund} onChange={setCurrentFund}
            placeholder="87" keyboardType="numeric" />
        </View>
      </View>

      <View style={{ marginTop: 12 }}>
        <Text style={styles.label}>支援の具体的な使い道</Text>
        <Text style={styles.fieldHint}>月1,000円が10人集まったら何ができる？具体的に書くほど響きます</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          value={fundUsage}
          onChangeText={setFundUsage}
          placeholder={"例：\n・月1,000円×10人 → タイヤ代1セット分、練習走行1回増やせる\n・月5,000円×5人 → 遠征1回分の交通費をまかなえる"}
          placeholderTextColor={T.gray3}
          multiline numberOfLines={5}
        />
      </View>

      {/* ── 実績・目標 ── */}
      <SectionHeader label="実績・目標" />
      <Field label="主な戦績" value={raceHistory} onChange={setRaceHistory}
        placeholder="2024年 全日本F4第3戦 3位..." multiline />
      <Field label="今シーズンの目標" value={goal} onChange={setGoal}
        placeholder="シリーズランキングTOP5入り" multiline />

      {/* ── SNS ── */}
      <SectionHeader label="SNS" />
      <Field label="X (Twitter)" value={snsX} onChange={setSnsX} placeholder="@username" />
      <Field label="Instagram" value={snsInstagram} onChange={setSnsInstagram} placeholder="@username" />

      {/* ── ボタン ── */}
      <View style={styles.btns}>
        <TouchableOpacity style={[styles.draftBtn, saving && styles.btnDisabled]}
          onPress={() => handleSave(false)} disabled={saving}>
          <Text style={styles.draftBtnText}>{saving ? "保存中..." : "下書き保存"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.publishBtn, saving && styles.btnDisabled]}
          onPress={() => handleSave(true)} disabled={saving}>
          <Text style={styles.publishBtnText}>{isPublished ? "更新して公開" : "公開する"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function SectionHeader({ label, note }: { label: string; note?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionAccent} />
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{label}</Text>
        {note ? <Text style={styles.sectionNote}>{note}</Text> : null}
      </View>
    </View>
  );
}

function Field({ label, value, onChange, placeholder, multiline, keyboardType }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; keyboardType?: any;
}) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMulti]}
        value={value} onChangeText={onChange}
        placeholder={placeholder} placeholderTextColor={T.gray3}
        multiline={multiline} numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.dark },
  content: { padding: 20, paddingBottom: 80 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: T.dark },
  pageTitle: { fontSize: 24, fontWeight: "800", color: T.white, marginBottom: 24 },

  // Avatar
  avatarSection: { alignItems: "center", marginBottom: 28 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: T.gray1, justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: T.gray5, borderStyle: "dashed",
  },
  avatarPlaceholderText: { color: T.gray3, fontSize: 12 },
  avatarHint: { color: T.red, fontSize: 12, marginTop: 8 },

  // Section
  sectionHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 32, marginBottom: 4 },
  sectionAccent: { width: 3, height: 20, backgroundColor: T.red, borderRadius: 2, marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: T.white },
  sectionNote: { fontSize: 11, color: T.gray3, marginTop: 3, lineHeight: 16 },

  // Field
  label: { fontSize: 12, fontWeight: "600", color: T.gray3, marginBottom: 6 },
  fieldHint: { fontSize: 11, color: T.gray3, marginBottom: 6, lineHeight: 16 },
  input: {
    borderWidth: 1, borderColor: T.gray5, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
    color: T.white, backgroundColor: T.dark3,
  },
  inputMulti: { minHeight: 100, textAlignVertical: "top" },

  // Category
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  catBtn: {
    borderWidth: 1, borderColor: T.gray5, borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 14, backgroundColor: T.dark3,
  },
  catBtnActive: { borderColor: T.red, backgroundColor: "rgba(232,0,45,0.12)" },
  catBtnText: { fontSize: 13, color: T.gray3 },
  catBtnTextActive: { color: T.red, fontWeight: "700" },

  row: { flexDirection: "row", gap: 12 },
  budgetRow: { flexDirection: "row", gap: 12, marginTop: 4 },

  // Story cards
  storyCard: {
    backgroundColor: T.dark3, borderRadius: 14, padding: 16,
    marginTop: 14, borderWidth: 1, borderColor: T.gray5,
  },
  storyCardIcon: { fontSize: 20, marginBottom: 6 },
  storyCardTitle: { fontSize: 14, fontWeight: "800", color: T.white, marginBottom: 4 },
  storyCardHint: { fontSize: 11, color: T.gray3, lineHeight: 17, marginBottom: 12 },

  // Buttons
  btns: { flexDirection: "row", gap: 12, marginTop: 36 },
  draftBtn: {
    flex: 1, borderWidth: 1, borderColor: T.gray5,
    borderRadius: 12, paddingVertical: 15, alignItems: "center",
    backgroundColor: T.dark3,
  },
  draftBtnText: { color: T.gray3, fontSize: 14, fontWeight: "600" },
  publishBtn: {
    flex: 1, backgroundColor: T.red,
    borderRadius: 12, paddingVertical: 15, alignItems: "center",
  },
  publishBtnText: { color: T.white, fontSize: 14, fontWeight: "800" },
  btnDisabled: { opacity: 0.5 },

});
