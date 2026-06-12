import { Redirect } from "expo-router";

// アプリのエントリーはホーム（サポーター主役・未ログインでも閲覧可）
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
