import { useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "../../lib/theme";
import { pickAndUploadImage, BucketName } from "../../lib/uploadImage";

interface BaseProps {
  bucket: BucketName;
  pathPrefix: string;
  value?: string | null;
  onChange: (url: string) => void;
  onError?: (msg: string) => void;
}

// ── 円形アバター用 ──
export function AvatarUpload({ bucket, pathPrefix, value, onChange, onError, size = 100 }: BaseProps & { size?: number }) {
  const [uploading, setUploading] = useState(false);

  async function handlePick() {
    setUploading(true);
    const r = await pickAndUploadImage({ bucket, pathPrefix, aspect: [1, 1], allowsEditing: true });
    setUploading(false);
    if (r.url) onChange(r.url);
    else if (r.error) onError?.(r.error);
  }

  return (
    <View style={styles.avatarWrap}>
      <Pressable onPress={handlePick} style={({ pressed }) => pressed && { opacity: 0.85 }}>
        <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
          {value ? (
            <Image source={{ uri: value }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          ) : (
            <Ionicons name="person" size={size * 0.42} color={colors.labelQuaternary} />
          )}
          {uploading && (
            <View style={styles.overlay}><ActivityIndicator color={colors.white} /></View>
          )}
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={15} color={colors.white} />
          </View>
        </View>
      </Pressable>
      <Text style={styles.hint}>タップして写真を{value ? "変更" : "追加"}</Text>
    </View>
  );
}

// ── 横長カバー/リターン画像用 ──
export function CoverUpload({
  bucket, pathPrefix, value, onChange, onError, aspect = [16, 9], label, height = 170,
}: BaseProps & { aspect?: [number, number]; label?: string; height?: number }) {
  const [uploading, setUploading] = useState(false);

  async function handlePick() {
    setUploading(true);
    const r = await pickAndUploadImage({ bucket, pathPrefix, aspect, allowsEditing: true });
    setUploading(false);
    if (r.url) onChange(r.url);
    else if (r.error) onError?.(r.error);
  }

  return (
    <View>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <Pressable onPress={handlePick} style={({ pressed }) => pressed && { opacity: 0.9 }}>
        <View style={[styles.cover, { height }]}>
          {value ? (
            <>
              <Image source={{ uri: value }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
              <View style={styles.editPill}>
                <Ionicons name="camera" size={13} color={colors.white} />
                <Text style={styles.editPillText}>変更</Text>
              </View>
            </>
          ) : (
            <View style={styles.coverEmpty}>
              <Ionicons name="image-outline" size={28} color={colors.labelTertiary} />
              <Text style={styles.coverEmptyText}>写真を追加</Text>
            </View>
          )}
          {uploading && (
            <View style={[styles.overlay, { borderRadius: radius.lg }]}><ActivityIndicator color={colors.white} /></View>
          )}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarWrap: { alignItems: "center" },
  avatar: {
    backgroundColor: colors.bgGrouped,
    alignItems: "center", justifyContent: "center",
    overflow: "hidden", position: "relative",
  },
  cameraBadge: {
    position: "absolute", bottom: 2, right: 2,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.brand,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2.5, borderColor: colors.white,
  },
  hint: { ...typography.caption, color: colors.brand, marginTop: 10, fontWeight: "600" },

  fieldLabel: { ...typography.footnote, fontWeight: "600", color: colors.labelSecondary, marginBottom: 7 },
  cover: {
    width: "100%",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    overflow: "hidden",
    alignItems: "center", justifyContent: "center",
  },
  coverEmpty: { alignItems: "center", gap: 6 },
  coverEmptyText: { ...typography.footnote, color: colors.labelTertiary },
  editPill: {
    position: "absolute", bottom: spacing.md, right: spacing.md,
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: radius.pill, paddingVertical: 5, paddingHorizontal: 11,
  },
  editPillText: { color: colors.white, fontSize: 12, fontWeight: "600" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center", justifyContent: "center",
  },
});
