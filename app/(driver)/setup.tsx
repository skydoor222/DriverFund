import { Redirect } from "expo-router";

// プロフィール編集は (driver-onboard)/setup に一本化（登録・編集兼用）
export default function DriverSetupRedirect() {
  return <Redirect href="/(driver-onboard)/setup" />;
}
