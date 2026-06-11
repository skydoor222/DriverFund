import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from "react-native";
import { useRouter } from "expo-router";

const { width: W, height: H } = Dimensions.get("window");

const T = {
  red: "#E8002D",
  yellow: "#FFB800",
  dark: "#0A0A0A",
  gray3: "#888",
  gray4: "#555",
  white: "#FFFFFF",
};

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>

      {/* ── 背景装飾：速度線 ── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[...Array(14)].map((_, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              width: i % 4 === 0 ? 3 : 1,
              top: 0,
              bottom: 0,
              left: -60 + i * 55,
              backgroundColor: "#fff",
              opacity: i % 4 === 0 ? 0.03 : 0.015,
              transform: [{ skewX: "-18deg" }],
            }}
          />
        ))}
        {/* ドット：上部右 */}
        <View style={styles.dotAccent1} />
        <View style={styles.dotAccent2} />
        {/* 赤ライン */}
        <View style={styles.redBar} />
        <View style={styles.yellowBar} />
      </View>

      {/* ── チェッカーフラッグ風 上部帯 ── */}
      <View style={styles.checkerRow}>
        {[...Array(12)].map((_, i) => (
          <View
            key={i}
            style={[styles.checkerCell, { backgroundColor: i % 2 === 0 ? "#fff" : "#000", opacity: 0.08 }]}
          />
        ))}
      </View>

      {/* ── ロゴ ── */}
      <View style={styles.logoArea}>
        {/* アイコン */}
        <View style={styles.logoIcon}>
          <Text style={styles.logoEmoji}>🏎</Text>
          <View style={styles.logoIconAccent} />
        </View>

        {/* テキストロゴ */}
        <Text style={styles.logoText}>Driver</Text>
        <Text style={styles.logoTextRed}>Fund</Text>

        {/* タグライン */}
        <View style={styles.taglineWrap}>
          <View style={styles.taglineLine} />
          <Text style={styles.tagline}>走る夢を、直接支援する</Text>
          <View style={styles.taglineLine} />
        </View>
      </View>

      {/* ── キャッチコピー ── */}
      <View style={styles.copyArea}>
        <Text style={styles.copy}>
          ドライバーに、{"\n"}直接届ける応援を。
        </Text>
        <Text style={styles.copyBody}>
          サイン入りグッズ・ピット見学・マシンロゴ掲載。{"\n"}
          あなたの支援がドライバーの夢を叶える。
        </Text>
      </View>

      {/* ── ボタン ── */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push({ pathname: "/(auth)/signup", params: { role: "supporter" } })}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>ドライバーを応援する</Text>
          <Text style={styles.primaryBtnArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.driverBtn}
          onPress={() => router.push({ pathname: "/(auth)/signup", params: { role: "driver" } })}
          activeOpacity={0.85}
        >
          <Text style={styles.driverBtnText}>🏎  ドライバーとして登録</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ghostBtn}
          onPress={() => router.push("/(auth)/login")}
          activeOpacity={0.7}
        >
          <Text style={styles.ghostBtnText}>すでにアカウントをお持ちの方</Text>
        </TouchableOpacity>

        <Text style={styles.legal}>
          続けることで利用規約・プライバシーポリシーに同意します
        </Text>
      </View>

      {/* ── 下部チェッカー ── */}
      <View style={[styles.checkerRow, styles.checkerBottom]}>
        {[...Array(12)].map((_, i) => (
          <View
            key={i}
            style={[styles.checkerCell, { backgroundColor: i % 2 === 1 ? "#fff" : "#000", opacity: 0.08 }]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.dark,
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 0,
    paddingBottom: 0,
    overflow: "hidden",
  },

  // 背景装飾
  dotAccent1: {
    position: "absolute", top: H * 0.18, right: 40,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: T.red, opacity: 0.06,
  },
  dotAccent2: {
    position: "absolute", bottom: H * 0.22, left: 20,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: T.yellow, opacity: 0.06,
  },
  redBar: {
    position: "absolute", top: 0, right: 80,
    width: 3, height: H * 0.35, backgroundColor: T.red, opacity: 0.5,
  },
  yellowBar: {
    position: "absolute", top: 0, right: 92,
    width: 2, height: H * 0.22, backgroundColor: T.yellow, opacity: 0.3,
  },

  // チェッカー帯
  checkerRow: {
    width: "100%", height: 20, flexDirection: "row",
  },
  checkerBottom: { position: "absolute", bottom: 0 },
  checkerCell: { flex: 1, height: 20 },

  // ロゴエリア
  logoArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 48,
  },
  logoIcon: {
    width: 80, height: 80,
    backgroundColor: T.red, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
    shadowColor: T.red, shadowOpacity: 0.6, shadowRadius: 20, elevation: 10,
  },
  logoEmoji: { fontSize: 44 },
  logoIconAccent: {
    position: "absolute", bottom: 0, right: 0,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: T.yellow,
    transform: [{ translateX: 6 }, { translateY: 6 }],
  },
  logoText: {
    fontSize: 52,
    fontWeight: "900",
    color: T.white,
    letterSpacing: 2,
    lineHeight: 56,
    marginBottom: -8,
  },
  logoTextRed: {
    fontSize: 52,
    fontWeight: "900",
    color: T.red,
    letterSpacing: 2,
    lineHeight: 60,
  },
  taglineWrap: {
    flexDirection: "row", alignItems: "center", gap: 10, marginTop: 18,
  },
  taglineLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.15)", maxWidth: 40 },
  tagline: { fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: 1.5, fontWeight: "500" },

  // コピー
  copyArea: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingBottom: 20,
    gap: 10,
  },
  copy: {
    fontSize: 24,
    fontWeight: "800",
    color: T.white,
    textAlign: "center",
    lineHeight: 36,
    letterSpacing: 0.3,
  },
  copyBody: {
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    lineHeight: 20,
  },

  // ボタン
  buttons: {
    width: "100%",
    paddingHorizontal: 24,
    paddingBottom: 44,
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: T.red,
    borderRadius: 14,
    paddingVertical: 17,
    paddingHorizontal: 24,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    shadowColor: T.red,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: {
    color: T.white,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  primaryBtnArrow: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 18,
    fontWeight: "700",
  },
  driverBtn: {
    alignSelf: "center",
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  driverBtnText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
    fontWeight: "500",
  },
  ghostBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  ghostBtnText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontWeight: "600",
  },
  legal: {
    textAlign: "center",
    color: "rgba(255,255,255,0.2)",
    fontSize: 10,
    marginTop: 2,
  },
});
