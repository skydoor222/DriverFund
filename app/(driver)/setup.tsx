import { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, Image, ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { Colors } from "../../constants/colors";
import { RacingCategory } from "../../lib/types";

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

  const [catchphrase, setCatchphrase] = useState("");
  const [bio, setBio] = useState("");
  const [hometown, setHometown] = useState("");
  const [age, setAge] = useState("");
  const [category, setCategory] = useState<RacingCategory>("f4");
  const [seriesName, setSeriesName] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [teamName, setTeamName] = useState("");
  const [raceHistory, setRaceHistory] = useState("");
  const [goal, setGoal] = useState("");
  const [snsX, setSnsX] = useState("");
  const [snsInstagram, setSnsInstagram] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    if (user) loadDriver();
  }, [user]);

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
      setBio(data.bio ?? "");
      setHometown(data.hometown ?? "");
      setAge(data.age?.toString() ?? "");
      setCategory(data.category ?? "f4");
      setSeriesName(data.series_name ?? "");
      setCarNumber(data.car_number ?? "");
      setTeamName(data.team_name ?? "");
      setRaceHistory(data.race_history ?? "");
      setGoal(data.goal ?? "");
      setSnsX(data.sns_x ?? "");
      setSnsInstagram(data.sns_instagram ?? "");
      setAvatarUrl(data.avatar_url ?? null);
      setIsPublished(data.is_published ?? false);
    }
    setLoading(false);
  }

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      await uploadAvatar(uri);
    }
  }

  async function uploadAvatar(uri: string) {
    const ext = uri.split(".").pop() ?? "jpg";
    const fileName = `${user!.id}/avatar.${ext}`;
    const response = await fetch(uri);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from("avatars")
      .upload(fileName, blob, { upsert: true });

    if (!error) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
      setAvatarUrl(data.publicUrl);
    }
  }

  async function handleSave(publish = false) {
    setSaving(true);
    const payload = {
      profile_id: user!.id,
      catchphrase, bio, hometown,
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
    if (error) {
      Alert.alert("エラー", error.message);
    } else {
      if (publish) setIsPublished(true);
      Alert.alert("保存しました", publish ? "プロフィールを公開しました！" : "下書きを保存しました");
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>プロフィール設定</Text>

      {/* アバター */}
      <TouchableOpacity style={styles.avatarSection} onPress={pickAvatar}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>写真を追加</Text>
          </View>
        )}
        <Text style={styles.avatarChangeText}>タップして変更</Text>
      </TouchableOpacity>

      <Field label="キャッチコピー" value={catchphrase} onChange={setCatchphrase}
        placeholder="例: 7歳から夢を追い続けるドライバー" />

      <Field label="自己紹介・ストーリー *" value={bio} onChange={setBio}
        placeholder="なぜレースをやっているか、どんな思いで活動しているか..." multiline />

      <Text style={styles.label}>カテゴリ *</Text>
      <View style={styles.categoryRow}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.value}
            style={[styles.catBtn, category === c.value && styles.catBtnActive]}
            onPress={() => setCategory(c.value)}
          >
            <Text style={[styles.catBtnText, category === c.value && styles.catBtnTextActive]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Field label="シリーズ名" value={seriesName} onChange={setSeriesName} placeholder="全日本F4選手権" />
        </View>
        <View style={{ width: 80 }}>
          <Field label="カーナンバー" value={carNumber} onChange={setCarNumber} placeholder="#23" />
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

      <Field label="主な戦績" value={raceHistory} onChange={setRaceHistory}
        placeholder="2024年 全日本F4第3戦 3位..." multiline />

      <Field label="今シーズンの目標" value={goal} onChange={setGoal}
        placeholder="シリーズランキングTOP5入り" />

      <Text style={styles.sectionTitle}>SNS</Text>
      <Field label="X (Twitter) ID" value={snsX} onChange={setSnsX} placeholder="@username" />
      <Field label="Instagram ID" value={snsInstagram} onChange={setSnsInstagram} placeholder="@username" />

      <View style={styles.btns}>
        <TouchableOpacity
          style={[styles.draftBtn, saving && styles.btnDisabled]}
          onPress={() => handleSave(false)}
          disabled={saving}
        >
          <Text style={styles.draftBtnText}>{saving ? "保存中..." : "下書き保存"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.publishBtn, saving && styles.btnDisabled]}
          onPress={() => handleSave(true)}
          disabled={saving}
        >
          <Text style={styles.publishBtnText}>
            {isPublished ? "更新して公開" : "公開する"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Field({
  label, value, onChange, placeholder, multiline, keyboardType,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; keyboardType?: any;
}) {
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMulti]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.gray300}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "800", color: Colors.black, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.black, marginTop: 28, marginBottom: 4 },
  label: { fontSize: 13, fontWeight: "600", color: Colors.gray700, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: Colors.black, backgroundColor: Colors.white,
  },
  inputMulti: { minHeight: 100, textAlignVertical: "top" },
  avatarSection: { alignItems: "center", marginBottom: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.gray100, justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: Colors.border, borderStyle: "dashed",
  },
  avatarPlaceholderText: { color: Colors.gray500, fontSize: 12 },
  avatarChangeText: { color: Colors.primary, fontSize: 13, marginTop: 8 },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  catBtn: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 14,
  },
  catBtnActive: { borderColor: Colors.primary, backgroundColor: "#FFF0F3" },
  catBtnText: { fontSize: 14, color: Colors.gray500 },
  catBtnTextActive: { color: Colors.primary, fontWeight: "600" },
  row: { flexDirection: "row", gap: 12 },
  btns: { flexDirection: "row", gap: 12, marginTop: 32 },
  draftBtn: {
    flex: 1, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingVertical: 15, alignItems: "center",
  },
  draftBtnText: { color: Colors.gray700, fontSize: 15, fontWeight: "600" },
  publishBtn: {
    flex: 1, backgroundColor: Colors.primary,
    borderRadius: 12, paddingVertical: 15, alignItems: "center",
  },
  publishBtnText: { color: Colors.white, fontSize: 15, fontWeight: "700" },
  btnDisabled: { opacity: 0.6 },
});
