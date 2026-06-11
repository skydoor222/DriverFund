#!/usr/bin/env bash
# =============================================================
# new-project.sh — Supabase プロジェクトを1発セットアップ
#
# 使い方:
#   ./scripts/new-project.sh <project-name> <schema.sql>
#
# 例:
#   ./scripts/new-project.sh petmatch supabase/schema.sql
#   ./scripts/new-project.sh my-app path/to/custom-schema.sql
#
# 必要な環境変数（.env.local or export で事前にセット）:
#   SUPABASE_ACCESS_TOKEN   — Supabase の Personal Access Token
#                             https://supabase.com/dashboard/account/tokens
#   SUPABASE_ORG_ID         — 組織ID（下記で確認: supabase orgs list）
#
# オプション環境変数:
#   SUPABASE_DB_PASSWORD    — DBパスワード（省略時は自動生成）
#   SUPABASE_REGION         — リージョン（省略時: ap-northeast-1 = 東京）
# =============================================================

set -euo pipefail

# ── 引数チェック ──────────────────────────────────────────────
if [ $# -lt 1 ]; then
  echo "使い方: $0 <project-name> [schema.sql]"
  echo "例:     $0 petmatch supabase/schema.sql"
  exit 1
fi

PROJECT_NAME="$1"
SCHEMA_FILE="${2:-supabase/schema.sql}"

# ── 環境変数チェック ──────────────────────────────────────────
if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "❌ SUPABASE_ACCESS_TOKEN が未設定です"
  echo "   https://supabase.com/dashboard/account/tokens でトークンを発行して"
  echo "   export SUPABASE_ACCESS_TOKEN=sbp_xxx を実行してください"
  exit 1
fi

if [ -z "${SUPABASE_ORG_ID:-}" ]; then
  echo "🔍 SUPABASE_ORG_ID を自動取得中..."
  SUPABASE_ORG_ID=$(curl -sf \
    -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
    "https://api.supabase.com/v1/organizations" \
    | python3 -c "import sys,json; orgs=json.load(sys.stdin); print(orgs[0]['id'])")
  echo "   組織ID: ${SUPABASE_ORG_ID}"
fi

DB_PASSWORD="${SUPABASE_DB_PASSWORD:-$(openssl rand -base64 16 | tr -dc 'A-Za-z0-9' | head -c 20)}"
REGION="${SUPABASE_REGION:-ap-northeast-1}"

echo ""
echo "🚀 新規Supabaseプロジェクトを作成します"
echo "   名前:    ${PROJECT_NAME}"
echo "   リージョン: ${REGION}"
echo "   スキーマ: ${SCHEMA_FILE}"
echo ""

# ── Step 1: プロジェクト作成 ──────────────────────────────────
echo "📦 Step 1/4: プロジェクト作成中..."

CREATE_RESPONSE=$(curl -sf -X POST \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  "https://api.supabase.com/v1/projects" \
  -d "{
    \"name\": \"${PROJECT_NAME}\",
    \"organization_id\": \"${SUPABASE_ORG_ID}\",
    \"db_pass\": \"${DB_PASSWORD}\",
    \"region\": \"${REGION}\",
    \"plan\": \"free\"
  }")

PROJECT_REF=$(echo "$CREATE_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "   ✅ プロジェクト作成完了: ${PROJECT_REF}"

# ── Step 2: DB起動待ち ────────────────────────────────────────
echo "⏳ Step 2/4: DB起動待ち（最大3分）..."

for i in $(seq 1 36); do
  STATUS=$(curl -sf \
    -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
    "https://api.supabase.com/v1/projects/${PROJECT_REF}" \
    | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))")

  if [ "$STATUS" = "ACTIVE_HEALTHY" ]; then
    echo "   ✅ DB起動完了"
    break
  fi

  echo "   ... 状態: ${STATUS} (${i}/36)"
  sleep 5
done

if [ "$STATUS" != "ACTIVE_HEALTHY" ]; then
  echo "❌ DB起動がタイムアウトしました。Supabaseダッシュボードで確認してください"
  exit 1
fi

# ── Step 3: APIキー取得 ───────────────────────────────────────
echo "🔑 Step 3/4: APIキー取得中..."

KEYS_RESPONSE=$(curl -sf \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  "https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys")

ANON_KEY=$(echo "$KEYS_RESPONSE" | python3 -c "
import sys, json
keys = json.load(sys.stdin)
print(next(k['api_key'] for k in keys if k['name'] == 'anon'))
")

SERVICE_ROLE_KEY=$(echo "$KEYS_RESPONSE" | python3 -c "
import sys, json
keys = json.load(sys.stdin)
print(next(k['api_key'] for k in keys if k['name'] == 'service_role'))
")

SUPABASE_URL="https://${PROJECT_REF}.supabase.co"
echo "   ✅ キー取得完了"

# ── Step 4: スキーマ適用 ──────────────────────────────────────
echo "🗄️  Step 4/4: スキーマ適用中..."

if [ ! -f "$SCHEMA_FILE" ]; then
  echo "   ⚠️  スキーマファイルが見つかりません: ${SCHEMA_FILE}"
  echo "   スキップします（後でダッシュボードから手動で流してください）"
else
  # Management API の SQL実行エンドポイントを使用
  SQL_CONTENT=$(cat "$SCHEMA_FILE")

  SQL_RESPONSE=$(curl -sf -X POST \
    -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query" \
    -d "{\"query\": $(echo "$SQL_CONTENT" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))")}" \
    2>&1 || true)

  if echo "$SQL_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if 'error' not in str(d).lower() else 1)" 2>/dev/null; then
    echo "   ✅ スキーマ適用完了"
  else
    echo "   ⚠️  スキーマ適用に問題がある可能性があります。ダッシュボードで確認してください"
    echo "   レスポンス: ${SQL_RESPONSE}"
  fi
fi

# ── 結果出力 ──────────────────────────────────────────────────
OUTPUT_FILE=".env.${PROJECT_NAME}"

cat > "$OUTPUT_FILE" << EOF
# ${PROJECT_NAME} — Supabase 環境変数
# 生成日時: $(date)

EXPO_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
EXPO_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}
SUPABASE_PROJECT_REF=${PROJECT_REF}
SUPABASE_DB_PASSWORD=${DB_PASSWORD}

# Stripe（後で設定）
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
EOF

echo ""
echo "============================================================"
echo "✅ セットアップ完了！"
echo "============================================================"
echo ""
echo "📋 プロジェクト情報:"
echo "   URL:     ${SUPABASE_URL}"
echo "   Ref:     ${PROJECT_REF}"
echo "   Dashboard: https://supabase.com/dashboard/project/${PROJECT_REF}"
echo ""
echo "📄 環境変数を ${OUTPUT_FILE} に保存しました"
echo ""
echo "次のステップ:"
echo "  1. Vercel に環境変数を設定:"
echo "     vercel env add EXPO_PUBLIC_SUPABASE_URL < <(echo ${SUPABASE_URL})"
echo "     vercel env add EXPO_PUBLIC_SUPABASE_ANON_KEY < <(echo ${ANON_KEY})"
echo ""
echo "  2. Supabase シークレット（Edge Functions用）:"
echo "     SUPABASE_ACCESS_TOKEN=${SUPABASE_ACCESS_TOKEN} \\"
echo "     npx supabase secrets set STRIPE_SECRET_KEY=sk_xxx --project-ref ${PROJECT_REF}"
echo ""
echo "  3. Google OAuth を有効化:"
echo "     https://supabase.com/dashboard/project/${PROJECT_REF}/auth/providers"
echo "============================================================"
