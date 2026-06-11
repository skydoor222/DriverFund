// =============================================================
// 画像アップロード共通ヘルパー
// expo-image-picker で選択 → Supabase Storage にアップロード → public URL を返す
// =============================================================
import * as ImagePicker from "expo-image-picker";
import { supabase } from "./supabase";

// base64 文字列 → Uint8Array（依存パッケージ無しで実装）
function base64ToBytes(base64: string): Uint8Array {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;

  const clean = base64.replace(/[^A-Za-z0-9+/]/g, "");
  const len = clean.length;
  const bufferLength = Math.floor((len * 3) / 4);
  const bytes = new Uint8Array(bufferLength);

  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const e1 = lookup[clean.charCodeAt(i)];
    const e2 = lookup[clean.charCodeAt(i + 1)];
    const e3 = lookup[clean.charCodeAt(i + 2)];
    const e4 = lookup[clean.charCodeAt(i + 3)];
    bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (i + 2 < len) bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    if (i + 3 < len) bytes[p++] = ((e3 & 3) << 6) | e4;
  }
  return bytes;
}

export type BucketName = "avatars" | "covers" | "returns";

export interface PickAndUploadOptions {
  bucket: BucketName;
  // 保存先パス接頭辞（例: userId）。同名で上書きしたい場合に使用
  pathPrefix: string;
  aspect?: [number, number];
  // 正方形トリミングを許可するか
  allowsEditing?: boolean;
}

export interface UploadResult {
  url: string | null;
  canceled: boolean;
  error?: string;
}

/**
 * 画像を選択してアップロードし public URL を返す。
 * Web/native 両対応（base64 経由で ArrayBuffer 化）。
 */
export async function pickAndUploadImage(opts: PickAndUploadOptions): Promise<UploadResult> {
  const { bucket, pathPrefix, aspect, allowsEditing = true } = opts;

  // 権限（native のみ）
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (perm.status !== "granted" && perm.canAskAgain === false) {
    return { url: null, canceled: false, error: "写真へのアクセスが許可されていません" };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing,
    aspect,
    quality: 0.85,
    base64: true,
  });

  if (result.canceled || !result.assets?.[0]) {
    return { url: null, canceled: true };
  }

  const asset = result.assets[0];

  try {
    let fileBody: Uint8Array | Blob;
    const ext = guessExt(asset.uri, asset.mimeType);

    if (asset.base64) {
      fileBody = base64ToBytes(asset.base64);
    } else {
      // base64 が無い場合は fetch で blob 化（web フォールバック）
      const res = await fetch(asset.uri);
      fileBody = await res.blob();
    }

    // パスは衝突しにくいよう prefix/timestamp.ext
    const stamp = `${pathPrefix}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(stamp, fileBody as any, {
        contentType: asset.mimeType ?? `image/${ext}`,
        upsert: true,
      });

    if (error) return { url: null, canceled: false, error: error.message };

    const { data } = supabase.storage.from(bucket).getPublicUrl(stamp);
    return { url: data.publicUrl, canceled: false };
  } catch (e: any) {
    return { url: null, canceled: false, error: e?.message ?? "アップロードに失敗しました" };
  }
}

function guessExt(uri: string, mime?: string): string {
  if (mime?.includes("png")) return "png";
  if (mime?.includes("webp")) return "webp";
  if (mime?.includes("heic")) return "jpg"; // heic は jpg として保存
  const m = uri.split("?")[0].split(".").pop()?.toLowerCase();
  if (m && ["jpg", "jpeg", "png", "webp"].includes(m)) return m === "jpeg" ? "jpg" : m;
  return "jpg";
}
