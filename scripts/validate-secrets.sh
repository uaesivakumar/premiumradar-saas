#!/bin/bash
# =============================================================================
# SECRET VALIDATION SCRIPT
# =============================================================================
# Run this BEFORE any deployment to ensure all secrets exist
# This script is called automatically by deploy-staging.sh
# =============================================================================

set -e

PROJECT_ID="applied-algebra-474804-e6"

# All required secrets for premiumradar-saas-staging
REQUIRED_SECRETS=(
  "DB_URL_SAAS"
  "NOTION_TOKEN_SAAS"
  "ENCRYPTION_KEY_SAAS"
  "RESEND_API_KEY_SAAS"
  "JWT_SECRET_SAAS"
  "SUPER_ADMIN_EMAILS"
  "SUPER_ADMIN_SECRET"
  "SUPER_ADMIN_SESSION_KEY"
)

echo "=============================================="
echo "SECRET VALIDATION CHECK"
echo "=============================================="
echo ""

MISSING=()
FOUND=0

for secret in "${REQUIRED_SECRETS[@]}"; do
  if gcloud secrets describe "$secret" --project="$PROJECT_ID" &>/dev/null; then
    echo "✓ $secret"
    ((FOUND++))
  else
    echo "✗ $secret - MISSING!"
    MISSING+=("$secret")
  fi
done

echo ""
echo "----------------------------------------------"
echo "Found: $FOUND / ${#REQUIRED_SECRETS[@]}"
echo "----------------------------------------------"

if [ ${#MISSING[@]} -gt 0 ]; then
  echo ""
  echo "❌ VALIDATION FAILED"
  echo ""
  echo "Missing secrets:"
  for secret in "${MISSING[@]}"; do
    echo "  - $secret"
  done
  echo ""
  echo "To create a missing secret:"
  echo "  echo 'YOUR_VALUE' | gcloud secrets create SECRET_NAME --data-file=- --project=$PROJECT_ID"
  echo ""
  exit 1
fi

echo ""
echo "✓ ALL SECRETS VALIDATED"
echo ""
