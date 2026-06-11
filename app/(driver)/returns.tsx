import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Alert, ActivityIndicator, Image, Pressable, Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { ReturnItem, ReturnItemCategory, BillingType } from "../../lib/types";
import { colors, radius, spacing, typography, shadow } from "../../lib/theme";
import { Button, Input, SegmentedControl, Pill, CoverUpload } from "../../components/ui";

const CATEGORY_OPTIONS: { value: ReturnItemCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: "report", label: "活動報告", icon: "mail-outline" },
  { value: "goods", label: "グッズ", icon: "shirt-outline" },
  { value: "pit", label: "ピット見学", icon: "eye-outline" },
  { value: "part", label: "パーツ", icon: "build-outline" },
  { value: "experience", label: "体験", icon: "flag-outline" },
  { value: "logo_machine", label: "マシンロゴ", icon: "car-sport-outline" },
  { value: "logo_suit", label: "スーツロゴ", icon: "body-outline" },
  { value: "logo_helmet", label: "ヘルメット", icon: "shield-outline" },
];

const PRICE_SUGGESTIONS: Record<ReturnItemCategory, number[]> = {
  report: [1000, 3000], goods: [5000, 10000], pit: [30000, 50000],
  part: [100000, 200000], experience: [150000, 200000],
  logo_machine: [200000, 500000], logo_suit: [50000, 100000], logo_helmet: [30000, 80000],
};

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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
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
    setTitle(""); setDescription(""); setImageUrl(null); setCategory("report");
    setPrice(""); setQuantityLimit(""); setBillingType("monthly");
    setModalVisible(true);
  }

  function openEdit(item: ReturnItem) {
    setEditingId(item.id);
    setTitle(item.title); setDescription(item.description ?? "");
    setImageUrl(item.image_url ?? null);
    setCategory(item.category); setPrice(item.price.toString());
    setQuantityLimit(item.quantity_limit?.toString() ?? "");
    setBillingType(item.billing_type);
    setModalVisible(true);
  }

  async function handleSave() {
    if (!title || !price || !driverId) {
      Alert.alert("入力エラー", "タイトルと価格を入力してください");
      return;
    }
    setSaving(true);
    const ql = quantityLimit ? parseInt(quantityLimit) : null;
    const payload: any = {
      driver_id: driverId, title, description,
      image_url: imageUrl || null, category,
      price: parseInt(price), quantity_limit: ql,
      billing_type: billingType, is_active: true,
    };
    if (!editingId) payload.remaining = ql;

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

  async function handleDelete() {
    if (!editingId) return;
    Alert.alert("削除しますか？", "このお返しを削除します。元に戻せません。", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除", style: "destructive",
        onPress: async () => {
          await supabase.from("return_items").delete().eq("id", editingId);
          setModalVisible(false);
          loadData();
        },
      },
    ]);
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.brand} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgGrouped }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>お返し管理</Text>
        <Text style={styles.headerSub}>支援者へのリターンメニューを設定します</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {!driverId && (
          <View style={styles.emptyBox}>
            <Ionicons name="person-circle-outline" size={40} color={colors.labelTertiary} />
            <Text style={styles.emptyText}>先にプロフィールを設定してください</Text>
          </View>
        )}

        {items.map((item) => {
          const cat = CATEGORY_OPTIONS.find((c) => c.value === item.category);
          const isMonthly = item.billing_type === "monthly";
          return (
            <Pressable key={item.id} onPress={() => openEdit(item)}
              style={({ pressed }) => [styles.itemCard, pressed && { opacity: 0.95 }]}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.itemThumb} />
              ) : (
                <View style={styles.itemThumbEmpty}>
                  <Ionicons name={cat?.icon ?? "gift-outline"} size={22} color={colors.labelTertiary} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <View style={styles.itemTitleRow}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                  <Pill label={isMonthly ? "月額" : "単発"} tone={isMonthly ? "info" : "neutral"} />
                </View>
                <Text style={styles.itemPrice}>
                  ¥{item.price.toLocaleString()}{isMonthly ? "/月" : ""}
                  {item.quantity_limit ? `  ·  残り${item.remaining ?? item.quantity_limit}枠` : ""}
                </Text>
                {item.description ? (
                  <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
                ) : null}
              </View>
              <Switch
                value={item.is_active}
                onValueChange={() => toggleActive(item)}
                trackColor={{ true: colors.brand, false: colors.borderStrong }}
                thumbColor={colors.white}
              />
            </Pressable>
          );
        })}

        {items.length === 0 && driverId && (
          <View style={styles.emptyBox}>
            <Ionicons name="gift-outline" size={40} color={colors.labelTertiary} />
            <Text style={styles.emptyText}>まだお返しがありません</Text>
            <Text style={styles.emptySubText}>＋ボタンから最初のお返しを追加しましょう</Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      {driverId && (
        <TouchableOpacity style={styles.fab} onPress={openCreate} activeOpacity={0.85}>
          <Ionicons name="add" size={30} color={colors.white} />
        </TouchableOpacity>
      )}

      {/* Add/Edit modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>キャンセル</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingId ? "お返しを編集" : "お返しを追加"}</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text style={[styles.saveText, saving && { opacity: 0.4 }]}>{saving ? "保存中" : "保存"}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            {/* 画像 */}
            <CoverUpload
              bucket="returns" pathPrefix={driverId ?? "tmp"} value={imageUrl}
              onChange={setImageUrl} onError={(m) => Alert.alert("画像エラー", m)}
              label="リターン画像" aspect={[16, 10]} height={180}
            />
            <View style={{ height: spacing.lg }} />

            {/* カテゴリ */}
            <Text style={styles.label}>カテゴリ</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.lg }}>
              {CATEGORY_OPTIONS.map((c) => {
                const active = category === c.value;
                return (
                  <TouchableOpacity key={c.value}
                    style={[styles.catChip, active && styles.catChipActive]}
                    onPress={() => {
                      setCategory(c.value);
                      if (!price) setPrice(PRICE_SUGGESTIONS[c.value][0].toString());
                    }}>
                    <Ionicons name={c.icon} size={16} color={active ? colors.brand : colors.labelTertiary} />
                    <Text style={[styles.catChipText, active && styles.catChipTextActive]}>{c.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Input label="タイトル *" value={title} onChangeText={setTitle} placeholder="例: 活動報告 月額配信" />
            <Input label="説明" value={description} onChangeText={setDescription}
              placeholder="内容の詳細..." multiline />

            <Text style={styles.label}>支払いタイプ</Text>
            <View style={{ marginBottom: spacing.lg }}>
              <SegmentedControl
                options={[{ value: "monthly", label: "月額" }, { value: "one_time", label: "単発" }]}
                value={billingType} onChange={setBillingType}
              />
            </View>

            <Input label="価格（円）*" value={price} onChangeText={setPrice}
              keyboardType="numeric" placeholder="3000" />
            <View style={styles.suggestionRow}>
              {PRICE_SUGGESTIONS[category].map((p) => (
                <TouchableOpacity key={p} style={styles.suggestion} onPress={() => setPrice(p.toString())}>
                  <Text style={styles.suggestionText}>¥{p.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input label="提供数量上限（空白=無制限）" value={quantityLimit} onChangeText={setQuantityLimit}
              keyboardType="numeric" placeholder="例: 5" containerStyle={{ marginTop: spacing.lg }} />

            {editingId && (
              <Button title="このお返しを削除" variant="danger" icon="trash-outline"
                onPress={handleDelete} style={{ marginTop: spacing.lg }} />
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.bg, paddingHorizontal: spacing.xl, paddingTop: 56, paddingBottom: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.separator,
  },
  headerTitle: { ...typography.title2, color: colors.label },
  headerSub: { ...typography.footnote, color: colors.labelTertiary, marginTop: 3 },
  content: { padding: spacing.lg, paddingBottom: 120 },

  emptyBox: { alignItems: "center", paddingTop: 70, gap: 10 },
  emptyText: { ...typography.callout, color: colors.labelSecondary, fontWeight: "600" },
  emptySubText: { ...typography.footnote, color: colors.labelTertiary },

  itemCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md,
    flexDirection: "row", alignItems: "center", gap: spacing.md, ...shadow.sm,
  },
  itemThumb: { width: 52, height: 52, borderRadius: radius.md },
  itemThumbEmpty: {
    width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.bgGrouped,
    alignItems: "center", justifyContent: "center",
  },
  itemTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: 3 },
  itemTitle: { ...typography.subhead, fontWeight: "700", color: colors.label, flexShrink: 1 },
  itemPrice: { ...typography.subhead, fontWeight: "700", color: colors.label },
  itemDesc: { ...typography.caption, color: colors.labelTertiary, marginTop: 3 },

  fab: {
    position: "absolute", bottom: 28, right: 22,
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brand,
    alignItems: "center", justifyContent: "center", ...shadow.brand,
  },

  modalContainer: { flex: 1, backgroundColor: colors.bg },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.separator,
  },
  modalTitle: { ...typography.headline, color: colors.label },
  cancelText: { ...typography.body, color: colors.labelTertiary },
  saveText: { ...typography.body, color: colors.brand, fontWeight: "700" },
  modalContent: { padding: spacing.xl },

  label: { ...typography.footnote, fontWeight: "600", color: colors.labelSecondary, marginBottom: 7 },
  catChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill,
    paddingVertical: 8, paddingHorizontal: 14, backgroundColor: colors.surface,
  },
  catChipActive: { borderColor: colors.brand, backgroundColor: colors.brandTint },
  catChipText: { ...typography.footnote, color: colors.labelSecondary },
  catChipTextActive: { color: colors.brand, fontWeight: "700" },

  suggestionRow: { flexDirection: "row", gap: spacing.sm, marginTop: -spacing.sm },
  suggestion: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingVertical: 6, paddingHorizontal: 12, backgroundColor: colors.surfaceAlt,
  },
  suggestionText: { ...typography.footnote, color: colors.labelSecondary, fontWeight: "600" },
});
