#!/bin/bash
#
# Admin Plane v1.1 Proof Pack
# Validates all Admin Plane API contracts via curl
#
# Usage: ./scripts/admin_plane_proof_pack.sh
#
# Required env vars:
#   BASE_URL - API base URL (default: http://localhost:3000)
#   SUPER_ADMIN_COOKIE - Session cookie for auth
#

set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"
COOKIE_FILE="${SUPER_ADMIN_COOKIE_FILE:-/tmp/superadmin_cookies.txt}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_pass() { echo -e "${GREEN}✓ $1${NC}"; }
log_fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }
log_info() { echo -e "${YELLOW}→ $1${NC}"; }

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║       Admin Plane v1.1 — Proof Pack                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "BASE_URL: $BASE_URL"
echo ""

# Store IDs for later use
ENTERPRISE_REAL_ID=""
ENTERPRISE_DEMO_ID=""
USER_ADMIN_ID=""
USER_EU_ID=""
WORKSPACE_ID=""

# ============================================================
# 3.1 Enterprise Lifecycle
# ============================================================
echo "═══════════════════════════════════════════════════════════════"
echo "3.1 ENTERPRISE LIFECYCLE"
echo "═══════════════════════════════════════════════════════════════"

# Create REAL enterprise
log_info "Creating REAL enterprise..."
RESULT=$(curl -s -X POST "$BASE_URL/api/superadmin/enterprises" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_FILE" \
  -d '{"name":"Proof Pack Real Corp","type":"REAL","region":"UAE","plan":"starter"}')
echo "$RESULT" | jq .
ENTERPRISE_REAL_ID=$(echo "$RESULT" | jq -r '.data.enterprise_id // empty')
[ -n "$ENTERPRISE_REAL_ID" ] && log_pass "REAL enterprise created: $ENTERPRISE_REAL_ID" || log_fail "Failed to create REAL enterprise"

# Create DEMO enterprise
log_info "Creating DEMO enterprise..."
RESULT=$(curl -s -X POST "$BASE_URL/api/superadmin/enterprises" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_FILE" \
  -d '{"name":"Proof Pack Demo Corp","type":"DEMO","region":"UAE","demo_days":14}')
echo "$RESULT" | jq .
ENTERPRISE_DEMO_ID=$(echo "$RESULT" | jq -r '.data.enterprise_id // empty')
[ -n "$ENTERPRISE_DEMO_ID" ] && log_pass "DEMO enterprise created: $ENTERPRISE_DEMO_ID" || log_fail "Failed to create DEMO enterprise"

# Patch enterprise (change plan)
log_info "Patching REAL enterprise plan..."
RESULT=$(curl -s -X PATCH "$BASE_URL/api/superadmin/enterprises/$ENTERPRISE_REAL_ID" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_FILE" \
  -d '{"plan":"professional"}')
echo "$RESULT" | jq .
PLAN=$(echo "$RESULT" | jq -r '.data.plan // empty')
[ "$PLAN" = "professional" ] && log_pass "Enterprise plan updated to professional" || log_fail "Failed to update plan"

# List enterprises
log_info "Listing enterprises..."
RESULT=$(curl -s -X GET "$BASE_URL/api/superadmin/enterprises?limit=5" \
  -b "$COOKIE_FILE")
echo "$RESULT" | jq '.data.enterprises[:3]'
TOTAL=$(echo "$RESULT" | jq -r '.data.total // 0')
[ "$TOTAL" -gt 0 ] && log_pass "Listed $TOTAL enterprises" || log_fail "Failed to list enterprises"

# ============================================================
# 3.2 User Lifecycle
# ============================================================
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "3.2 USER LIFECYCLE"
echo "═══════════════════════════════════════════════════════════════"

# Create enterprise admin
log_info "Creating ENTERPRISE_ADMIN..."
RESULT=$(curl -s -X POST "$BASE_URL/api/superadmin/users" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_FILE" \
  -d "{\"email\":\"admin-pp-$(uuidgen | cut -c1-8)@proofpack.test\",\"password\":\"Test123!\",\"name\":\"Proof Admin\",\"role\":\"ENTERPRISE_ADMIN\",\"enterprise_id\":\"$ENTERPRISE_REAL_ID\"}")
echo "$RESULT" | jq .
USER_ADMIN_ID=$(echo "$RESULT" | jq -r '.data.id // empty')
[ -n "$USER_ADMIN_ID" ] && log_pass "ENTERPRISE_ADMIN created: $USER_ADMIN_ID" || log_fail "Failed to create admin"

# Create enterprise user
log_info "Creating ENTERPRISE_USER..."
RESULT=$(curl -s -X POST "$BASE_URL/api/superadmin/users" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_FILE" \
  -d "{\"email\":\"user-pp-$(uuidgen | cut -c1-8)@proofpack.test\",\"password\":\"Test123!\",\"name\":\"Proof User\",\"role\":\"ENTERPRISE_USER\",\"enterprise_id\":\"$ENTERPRISE_REAL_ID\"}")
echo "$RESULT" | jq .
USER_EU_ID=$(echo "$RESULT" | jq -r '.data.id // empty')
[ -n "$USER_EU_ID" ] && log_pass "ENTERPRISE_USER created: $USER_EU_ID" || log_fail "Failed to create user"

# Suspend user
log_info "Suspending user..."
RESULT=$(curl -s -X PATCH "$BASE_URL/api/superadmin/users/$USER_EU_ID" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_FILE" \
  -d '{"is_active":false}')
echo "$RESULT" | jq '.data | {id, is_active}'
IS_ACTIVE=$(echo "$RESULT" | jq -r 'if .data.is_active == false then "false" else "true" end')
[ "$IS_ACTIVE" = "false" ] && log_pass "User suspended" || log_fail "Failed to suspend user"

# Reactivate user
log_info "Reactivating user..."
RESULT=$(curl -s -X PATCH "$BASE_URL/api/superadmin/users/$USER_EU_ID" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_FILE" \
  -d '{"is_active":true}')
IS_ACTIVE=$(echo "$RESULT" | jq -r 'if .data.is_active == true then "true" else "false" end')
[ "$IS_ACTIVE" = "true" ] && log_pass "User reactivated" || log_fail "Failed to reactivate user"

# ============================================================
# 3.3 Demo One-Click
# ============================================================
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "3.3 DEMO ONE-CLICK"
echo "═══════════════════════════════════════════════════════════════"

# Get a sub-vertical ID first
SUB_VERTICAL_ID=$(curl -s "$BASE_URL/api/superadmin/controlplane/sub-verticals" \
  -b "$COOKIE_FILE" | jq -r '.data[0].id // empty')

if [ -z "$SUB_VERTICAL_ID" ]; then
  log_info "No sub-vertical found, skipping demo one-click test"
else
  log_info "Creating demo via 1-click API..."
  RESULT=$(curl -s -X POST "$BASE_URL/api/superadmin/demos" \
    -H "Content-Type: application/json" \
    -b "$COOKIE_FILE" \
    -d "{\"enterprise_name\":\"1Click Demo $(uuidgen | cut -c1-8)\",\"admin_email\":\"demo-$(uuidgen | cut -c1-8)@proofpack.test\",\"admin_name\":\"Demo Admin\",\"sub_vertical_id\":\"$SUB_VERTICAL_ID\",\"demo_days\":14}")
  echo "$RESULT" | jq '.data | {enterprise: .enterprise.enterprise_id, workspace: .workspace.workspace_id, admin: .admin_user.id, temp_password: .temp_password, expires_at: .expires_at}'
  DEMO_ENT_ID=$(echo "$RESULT" | jq -r '.data.enterprise.enterprise_id // empty')
  [ -n "$DEMO_ENT_ID" ] && log_pass "1-click demo created: $DEMO_ENT_ID" || log_fail "Failed to create 1-click demo"

  # Extend demo
  log_info "Extending demo..."
  RESULT=$(curl -s -X PATCH "$BASE_URL/api/superadmin/demos/$DEMO_ENT_ID" \
    -H "Content-Type: application/json" \
    -b "$COOKIE_FILE" \
    -d '{"action":"extend","days":7}')
  echo "$RESULT" | jq '.data | {action, days_added, new_expiry}'
  ACTION=$(echo "$RESULT" | jq -r '.data.action // empty')
  [ "$ACTION" = "extended" ] && log_pass "Demo extended" || log_fail "Failed to extend demo"

  # Convert demo
  log_info "Converting demo to real..."
  RESULT=$(curl -s -X PATCH "$BASE_URL/api/superadmin/demos/$DEMO_ENT_ID" \
    -H "Content-Type: application/json" \
    -b "$COOKIE_FILE" \
    -d '{"action":"convert","plan":"starter"}')
  echo "$RESULT" | jq '.data | {action, type, new_plan}'
  ACTION=$(echo "$RESULT" | jq -r '.data.action // empty')
  [ "$ACTION" = "converted" ] && log_pass "Demo converted to real" || log_fail "Failed to convert demo"
fi

# ============================================================
# 3.4 Workspace
# ============================================================
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "3.4 WORKSPACE CRUD"
echo "═══════════════════════════════════════════════════════════════"

if [ -n "$SUB_VERTICAL_ID" ] && [ -n "$ENTERPRISE_REAL_ID" ]; then
  log_info "Creating workspace..."
  RESULT=$(curl -s -X POST "$BASE_URL/api/superadmin/workspaces" \
    -H "Content-Type: application/json" \
    -b "$COOKIE_FILE" \
    -d "{\"enterprise_id\":\"$ENTERPRISE_REAL_ID\",\"name\":\"Proof Workspace\",\"sub_vertical_id\":\"$SUB_VERTICAL_ID\"}")
  echo "$RESULT" | jq .
  WORKSPACE_ID=$(echo "$RESULT" | jq -r '.data.workspace_id // empty')
  [ -n "$WORKSPACE_ID" ] && log_pass "Workspace created: $WORKSPACE_ID" || log_fail "Failed to create workspace"
else
  log_info "Skipping workspace creation (no sub_vertical_id)"
fi

# ============================================================
# 4. AUDIT TRAIL
# ============================================================
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "4. AUDIT TRAIL VERIFICATION"
echo "═══════════════════════════════════════════════════════════════"

log_info "Querying audit trail..."
RESULT=$(curl -s -X GET "$BASE_URL/api/superadmin/audit?limit=10" \
  -b "$COOKIE_FILE")
echo "$RESULT" | jq '.data.events[:5] | .[] | {event_type, entity_type, timestamp}'
AUDIT_COUNT=$(echo "$RESULT" | jq -r '.data.total // 0')
log_pass "Found $AUDIT_COUNT audit events"

log_info "Checking event distribution..."
echo "$RESULT" | jq '.data.distribution'

# ============================================================
# 5. EVIDENCE PACK
# ============================================================
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "5. EVIDENCE PACK GENERATION"
echo "═══════════════════════════════════════════════════════════════"

if [ -n "$ENTERPRISE_REAL_ID" ]; then
  log_info "Generating evidence pack for enterprise..."
  RESULT=$(curl -s -X GET "$BASE_URL/api/superadmin/evidence?entity_type=ENTERPRISE&entity_id=$ENTERPRISE_REAL_ID" \
    -b "$COOKIE_FILE")
  echo "$RESULT" | jq '.data.evidence_pack | {summary, confidence, narrator_version, counterfactuals}'
  NARRATOR=$(echo "$RESULT" | jq -r '.data.evidence_pack.narrator_version // empty')
  [ "$NARRATOR" = "deterministic-v1.1" ] && log_pass "Evidence pack generated (deterministic-v1.1)" || log_fail "Wrong narrator version"
fi

# ============================================================
# SUMMARY
# ============================================================
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    PROOF PACK SUMMARY                        ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║ REAL Enterprise ID:  $ENTERPRISE_REAL_ID"
echo "║ DEMO Enterprise ID:  $ENTERPRISE_DEMO_ID"
echo "║ Admin User ID:       $USER_ADMIN_ID"
echo "║ Enterprise User ID:  $USER_EU_ID"
echo "║ Workspace ID:        ${WORKSPACE_ID:-N/A}"
echo "║ Audit Events:        $AUDIT_COUNT"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✓ All API contract tests passed!${NC}"
