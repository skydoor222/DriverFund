import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { ReturnItem, ReturnItemCategory, BillingType } from "../../lib/types";

const T = {
  red: "#E8002D",
  yellow: "#FFB800",
  dark: "#0A0A0A",
  dark3: "#1E1E1E",
  gray2: "#555",
  gray3: "#888",
  gray4: "#BDBDBD",
  gray5: "#E8E8E8",
  bg: "#F5F5F5",
  white: "#FFFFFF",
  blue: "#0058CC",
};

const CATEGORY_OPTIONS: { value: ReturnItemCategory; label: string; emoji: string }[] = [
  { value: "report", label: "活動報告", emoji: "📩" },
  { value: "goods", label: "サイン入りグッズ", emoji: "✍" },
  { value: "pit", label: "ピット見学", emoji: "🏎" },
  { value: "part", label: "マシンパーツ", emoji: "🔧" },
  { value: "experience", label: "体験", emoji: "🏁" },
  { value: "logo_machine", label: "マシンロゴ", emoji: "🚀" },
  { value: "logo_suit", label: "スーツロゴ", emoji: "👕" },
  { value: "logo_helmet", label: "ヘルメットロゴ", emoji: "🪖" },
];

const PRICE_SUGGESTIONS: Record<ReturnItemCategory, number[]> = {
  report: [3000, 5000],
  goods: [5000, 10000],
  pit: [30000, 50000],
  part: [100000, 200000],
  experience: [150000, 200000],
  logo_machine: [200000, 500000],
  logo_suit: [50000, 100000],
  logo_helmet: [30000, 80000],
};

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <TouchableOpacity
      onPress={onChange}
      style={[styles.toggle, { backgroundColor: value ? T.red : T.gray5 }]}
      activeOpacity={0.8}
    >
      <View style={[styles.toggleThumb, { left: value ? 20 : 2 }]} />
    </TouchableOpacity>
  );
}

export default function ReturnsScreen() {
  const { user } = useAuth();
  const [driverId, setDriverId] = useState<string | null>(null);
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState<ReturnItemCategory>("report");
  const [price, setPrice] = useState("");
  const [quantityLimit, setQuantityLimit] = useState("");
  const [billingType, setBillingType] = useState<BillingType>("monthly");

  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    setLoading(true);
    const { data: d } = await supabase.from("drivers").select("id").eq("profile_id", user!.id).single();
    if (d) {
      setDriverId(d.id);
      const { data } = await supabase.from("return_items").select("*").eq("driver_id", d.id).order("created_at");
      setItems(data ?? []);
    }
    setLoading(false);
  }

  function openCreate() {
    setEditingId(null);
    setTitle(""); setDescription(""); setImageUrl(""); setCategory("report");
    setPrice(""); setQuantityLimit(""); setBillingType("monthly");
    setModalVisible(true);
  }

  function openEdit(item: ReturnItem) {
    setEditingId(item.id);
    setTitle(item.title); setDescription(item.description ?? "");
    setImageUrl(item.image_url ?? "");
    setCategory(item.category); setPrice(item.price.toString());
    setQuantityLimit(item.quantity_limit?.toString() ?? "");
    setBillingType(item.billing_type);
    setModalVisible(true);
  }

  async function handleSave() {
    if (!title || !price || !driverId) {
      Alert.alert("エラー", "タイトルと価格を入力してください");
      return;
    }
    setSaving(true);
    const ql = quantityLimit ? parseInt(quantityLimit) : null;
    const payload = {
      driver_id: driverId, title, description,
      image_url: imageUrl || null,
      category,
      price: parseInt(price), quantity_limit: ql,
      remaining: editingId ? undefined : ql,
      billing_type: billingType, is_active: true,
    };
    let error;
    if (editingId) {
      ({ error } = await supabase.from("return_items").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("return_items").insert(payload));
    }
    setSaving(false);
    if (error) { Alert.alert("エラー", error.message); return; }
    setModalVisible(false);
    loadData();
  }

  async function toggleActive(item: ReturnItem) {
    await supabase.from("return_items").update({ is_active: !item.is_active }).eq("id", item.id);
    loadData();
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={T.red} /></View>;

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>お返し管理</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {!driverId && (
          <Text style={styles.empty}>先にプロフィールを設定してください</Text>
        )}

        {items.map((item) => {
          const cat = CATEGORY_OPTIONS.find((c) => c.value === item.category);
          const isMonthly = item.billing_type === "monthly";
          return (
            <TouchableOpacity key={item.id} style={styles.itemCard} onPress={() => openEdit(item)}>
              <View style={styles.itemEmojiBox}>
                <Text style={{ fontSize: 22 }}>{cat?.emoji ?? "🎁"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.itemTitleRow}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <View style={[styles.billingBadge, { backgroundColor: isMonthly ? "#EEF3FF" : T.bg, borderColor: (isMonthly ? T.blue : T.gray2) + "33" }]}>
                    <Text style={[styles.billingBadgeText, { color: isMonthly ? T.blue : T.gray2 }]}>
                      {isMonthly ? "月次" : "単発"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.itemPrice}>
                  ¥{item.price.toLocaleString()}{isMonthly ? "/月" : ""}
                  {item.quantity_limit ? ` | 残り${item.remaining ?? item.quantity_limit}枠` : ""}
                </Text>
                {item.description ? (
                  <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
                ) : null}
              </View>
              <View style={styles.itemActions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => openEdit(item)}
                >
                  <Text style={styles.editBtnText}>編集</Text>
                </TouchableOpacity>
                <Toggle value={item.is_active} onChange={() => toggleActive(item)} />
              </View>
            </TouchableOpacity>
          );
        })}

        {items.length === 0 && driverId && (
          <Text style={styles.empty}>まだお返しがありません。＋ボタンから追加しましょう</Text>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openCreate}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* Add/Edit modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>キャンセル</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingId ? "お返しを編集" : "お返しを追加"}</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text style={[styles.saveText, saving && { opacity: 0.5 }]}>
                {saving ? "保存中" : "保存"}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>カテゴリ</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            {CATEGORY_OPTIONS.map((c) => (
              <TouchableOpacity
                key={c.value}
                style={[styles.catChip, category === c.value && styles.catChipActive]}
                onPress={() => {
                  setCategory(c.value);
                  if (!price) setPrice(PRICE_SUGGESTIONS[c.value][0].toString());
                }}
              >
                <Text>{c.emoji}</Text>
                <Text style={[styles.catChipText, category === c.value && styles.catChipTextActive]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>タイトル *</Text>
          <TextInput
            style={styles.input} value={title} onChangeText={setTitle}
            placeholder="例: 活動報告 月額配信" placeholderTextColor={T.gray3}
          />

          <Text style={styles.label}>説明</Text>
          <TextInput
            style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
            value={description} onChangeText={setDescription}
            placeholder="内容の詳細..." multiline placeholderTextColor={T.gray3}
          />

          <Text style={styles.label}>リターン画像URL（任意）</Text>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
          ) : null}
          <TextInput
            style={styles.input} value={imageUrl} onChangeText={setImageUrl}
            placeholder="https://... (画像のURL)" placeholderTextColor={T.gray3}
            autoCapitalize="none" keyboardType="url"
          />
          <Text style={styles.imageHint}>
            ※ Supabase StorageやImgurなどにアップした画像のURLを貼り付けてください
          </Text>

          <Text style={styles.label}>月額 / 単発</Text>
          <View style={styles.billingRow}>
            {(["monthly", "one_time"] as BillingType[]).map((b) => (
              <TouchableOpacity
                key={b}
                style={[styles.billingBtn, billingType === b && styles.billingBtnActive]}
                onPress={() => setBillingType(b)}
              >
                <Text style={[styles.billingText, billingType === b && styles.billingTextActive]}>
                  {b === "monthly" ? "月額" : "単発"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>価格（円） *</Text>
          <TextInput
            style={styles.input} value={price} onChangeText={setPrice}
            keyboardType="numeric" placeholder="3000" placeholderTextColor={T.gray3}
          />
          <View style={styles.suggestionRow}>
            {PRICE_SUGGESTIONS[category].map((p) => (
              <TouchableOpacity key={p} style={styles.suggestion} onPress={() => setPrice(p.toString())}>
                <Text style={styles.suggestionText}>¥{p.toLocaleString()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>提供数量上限（空白=無制限）</Text>
          <TextInput
            style={styles.input} value={quantityLimit} onChangeText={setQuantityLimit}
            keyboardType="numeric" placeholder="例: 5" placeholderTextColor={T.gray3}
          />
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  content: { padding: 16, paddingBottom: 100 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    backgroundColor: T.white, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: T.gray5,
  },
  title: { fontSize: 17, fontWeight: "900", color: T.dark },
  empty: { color: T.gray3, textAlign: "center", marginTop: 40, fontSize: 15 },
  itemCard: {
    backgroundColor: T.white, borderRadius: 14, padding: 14, marginBottom: 10,
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderColor: T.gray5,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  itemEmojiBox: {
    width: 44, height: 44, backgroundColor: T.bg, borderRadius: 10,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  itemTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 },
  itemTitle: { fontSize: 14, fontWeight: "800", color: T.dark, flexShrink: 1 },
  billingBadge: {
    borderRadius: 4, paddingVertical: 2, paddingHorizontal: 6, borderWidth: 1,
  },
  billingBadgeText: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  itemPrice: { fontSize: 14, fontWeight: "700", color: T.dark, letterSpacing: 0.5 },
  itemDesc: { fontSize: 12, color: T.gray2, marginTop: 4 },
  itemActions: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 0 },
  editBtn: {
    backgroundColor: T.bg, borderWidth: 1, borderColor: T.gray5,
    borderRadius: 6, paddingVertical: 5, paddingHorizontal: 10,
  },
  editBtnText: { fontSize: 11, color: T.gray2 },
  toggle: {
    width: 40, height: 22, borderRadius: 11, position: "relative",
  },
  toggleThumb: {
    position: "absolute", top: 2, width: 18, height: 18, borderRadius: 9,
    backgroundColor: T.white, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
  },
  fab: {
    position: "absolute", bottom: 80, right: 20,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: T.red, alignItems: "center", justifyContent: "center",
    shadowColor: T.red, shadowOpacity: 0.5, shadowRadius: 10, elevation: 6,
  },
  fabText: { color: T.white, fontSize: 24, lineHeight: 28 },
  modal: { flex: 1, backgroundColor: T.white },
  modalContent: { padding: 20, paddingBottom: 60, gap: 4 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 17, fontWeight: "700", color: T.dark },
  cancelText: { color: T.gray2, fontSize: 15 },
  saveText: { color: T.red, fontSize: 15, fontWeight: "700" },
  label: { fontSize: 13, fontWeight: "600", color: T.dark, marginTop: 12, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: T.gray5, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: T.dark,
  },
  catScroll: { marginTop: 4 },
  catChip: {
    borderWidth: 1, borderColor: T.gray5, borderRadius: 20,
    paddingVertical: 8, paddingHorizontal: 14, marginRight: 8, alignItems: "center",
    flexDirection: "row", gap: 6,
  },
  catChipActive: { borderColor: T.red, backgroundColor: "#FFF0F3" },
  catChipText: { fontSize: 13, color: T.gray2 },
  catChipTextActive: { color: T.red, fontWeight: "600" },
  billingRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  billingBtn: {
    flex: 1, borderWidth: 1, borderColor: T.gray5,
    borderRadius: 10, paddingVertical: 12, alignItems: "center",
  },
  billingBtnActive: { borderColor: T.red, backgroundColor: "#FFF0F3" },
  billingText: { color: T.gray2, fontWeight: "600" },
  billingTextActive: { color: T.red },
  suggestionRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  suggestion: {
    borderWidth: 1, borderColor: T.gray5, borderRadius: 8,
    paddingVertical: 6, paddingHorizontal: 12,
  },
  suggestionText: { color: T.gray2, fontSize: 13 },
  imagePreview: { width: "100%", height: 160, borderRadius: 10, resizeMode: "cover", marginBottom: 8 },
  imageHint: { fontSize: 11, color: T.gray3, marginTop: 4, lineHeight: 16 },
});
