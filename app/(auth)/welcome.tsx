import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

const T = {
  red: "#E8002D",
  yellow: "#FFB800",
  dark: "#0A0A0A",
  gray2: "#555",
  gray3: "#888",
  white: "#FFFFFF",
};

// Speed lines rendered as thin rotated View elements
function SpeedLines() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {[...Array(12)].map((_, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            width: i % 3 === 0 ? 2 : 1,
            top: 0,
            bottom: 0,
            left: -50 + i * 45,
            backgroundColor: "white",
            opacity: 0.04,
            transform: [{ skewX: "-20deg" }],
          }}
        />
      ))}
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SpeedLines />

      {/* Red accent stripe */}
      <View style={styles.redStripe} />
      <View style={styles.yellowStripe} />

      {/* Logo */}
      <View style={styles.logoRow}>
        <View style={styles.logoIcon}>
          <Text style={styles.logoEmoji}>🏎</Text>
        </View>
        <Text style={styles.logoText}>DriverFund</Text>
      </View>

      {/* Center content */}
      <View style={styles.hero}>
        <Text style={styles.tagline}>走る時間を、{"\n"}営業ではなく{"\n"}練習に。</Text>
        <View style={styles.redLine} />
        <Text style={styles.sub}>
          ドライバーが自分でお返しを設定し、{"\n"}
          応援者から直接支援を受けるサービス。
        </Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push("/(auth)/signup")}
        >
          <Text style={styles.primaryBtnText}>はじめる</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={styles.outlineBtnText}>ログイン</Text>
        </TouchableOpacity>

        <Text style={styles.legal}>
          続けることで利用規約・プライバシーポリシーに同意します
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.dark,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 48,
    overflow: "hidden",
  },
  redStripe: {
    position: "absolute",
    top: 0,
    right: 60,
    width: 4,
    height: "45%",
    backgroundColor: T.red,
    opacity: 0.8,
  },
  yellowStripe: {
    position: "absolute",
    top: 0,
    right: 72,
    width: 2,
    height: "30%",
    backgroundColor: T.yellow,
    opacity: 0.5,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoIcon: {
    width: 36,
    height: 36,
    backgroundColor: T.red,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  logoEmoji: { fontSize: 20 },
  logoText: {
    color: T.white,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 2,
  },
  hero: {
    flex: 1,
    justifyContent: "center",
    gap: 20,
  },
  tagline: {
    color: T.red,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 40,
    letterSpacing: 0.5,
  },
  redLine: {
    width: 48,
    height: 3,
    backgroundColor: T.red,
    borderRadius: 2,
  },
  sub: {
    color: T.gray3,
    fontSize: 13,
    lineHeight: 24,
  },
  buttons: {
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: T.red,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: {
    color: T.white,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  outlineBtn: {
    borderWidth: 2,
    borderColor: T.white,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  outlineBtnText: {
    color: T.white,
    fontSize: 15,
    fontWeight: "700",
  },
  legal: {
    textAlign: "center",
    color: T.gray2,
    fontSize: 11,
    marginTop: 4,
  },
});
