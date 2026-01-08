#!/bin/bash
# =============================================================================
# PROTECTED DEPLOYMENT SCRIPT - premiumradar-saas-staging
# =============================================================================
# This script ensures ALL required secrets and env vars are ALWAYS included.
# NEVER use manual gcloud commands for deployment - use this script.
# =============================================================================

set -e  # Exit on any error

PROJECT_ID="applied-algebra-474804-e6"
SERVICE_NAME="premiumradar-saas-staging"
REGION="us-central1"

# =============================================================================
# REQUIRED SECRETS - NEVER DEPLOY WITHOUT THESE
# =============================================================================
# WARNING: --set-secrets REPLACES all secrets. Every secret the service needs
# MUST be listed here or it will be WIPED on deployment!
# =============================================================================
REQUIRED_SECRETS=(
  # Core SaaS secrets
  "DATABASE_URL=DB_URL_SAAS:latest"
  "NOTION_TOKEN=NOTION_TOKEN_SAAS:latest"
  "ENCRYPTION_KEY=ENCRYPTION_KEY_SAAS:latest"
  "RESEND_API_KEY=RESEND_API_KEY_SAAS:latest"
  "JWT_SECRET=JWT_SECRET_SAAS:latest"
  # Super Admin secrets
  "SUPER_ADMIN_EMAILS=SUPER_ADMIN_EMAILS:latest"
  "SUPER_ADMIN_SECRET=SUPER_ADMIN_SECRET:latest"
  "SUPER_ADMIN_SESSION_KEY=SUPER_ADMIN_SESSION_KEY:latest"
  # OS Integration secrets (CRITICAL - SaaS→OS auth)
  "PR_OS_TOKEN=PR_OS_TOKEN:latest"
  # AI Provider secrets
  "ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest"
  "OPENAI_API_KEY=OPENAI_API_KEY:latest"
)

# =============================================================================
# REQUIRED ENV VARS
# =============================================================================
REQUIRED_ENV_VARS=(
  "NODE_ENV=production"
  "NEXT_PUBLIC_APP_ENV=staging"
  "UPR_OS_BASE_URL=https://upr-os-service-191599223867.us-central1.run.app"
)

# =============================================================================
# PRE-FLIGHT CHECKS
# =============================================================================
echo "=============================================="
echo "PROTECTED DEPLOYMENT: $SERVICE_NAME"
echo "=============================================="
echo ""

# Check all secrets exist in Secret Manager
echo "Checking required secrets exist..."
MISSING_SECRETS=()
for secret_mapping in "${REQUIRED_SECRETS[@]}"; do
  secret_name=$(echo "$secret_mapping" | cut -d'=' -f2 | cut -d':' -f1)
  if ! gcloud secrets describe "$secret_name" --project="$PROJECT_ID" &>/dev/null; then
    MISSING_SECRETS+=("$secret_name")
  fi
done

if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
  echo ""
  echo "❌ DEPLOYMENT BLOCKED - Missing secrets:"
  for secret in "${MISSING_SECRETS[@]}"; do
    echo "   - $secret"
  done
  echo ""
  echo "Create missing secrets before deploying."
  exit 1
fi
echo "✓ All required secrets exist"

# Build check
echo ""
echo "Running build check..."
if ! npm run build; then
  echo ""
  echo "❌ DEPLOYMENT BLOCKED - Build failed"
  exit 1
fi
echo "✓ Build passed"

# =============================================================================
# DEPLOY
# =============================================================================
echo ""
echo "Deploying to Cloud Run..."

# Build secrets string
SECRETS_STRING=$(IFS=','; echo "${REQUIRED_SECRETS[*]}")

# Build env vars string
ENV_VARS_STRING=$(IFS=','; echo "${REQUIRED_ENV_VARS[*]}")

gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --allow-unauthenticated \
  --set-secrets="$SECRETS_STRING" \
  --set-env-vars="$ENV_VARS_STRING"

# =============================================================================
# POST-DEPLOY VERIFICATION
# =============================================================================
echo ""
echo "Verifying deployment..."

# Check service is healthy
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --project="$PROJECT_ID" --format="value(status.url)")
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/api/health" 2>/dev/null || echo "000")

if [ "$HEALTH_STATUS" = "200" ]; then
  echo "✓ Service healthy"
else
  echo "⚠ Health check returned: $HEALTH_STATUS"
fi

# Verify secrets are mapped
echo ""
echo "Verifying secret mappings..."
CURRENT_SECRETS=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --project="$PROJECT_ID" --format="yaml(spec.template.spec.containers[0].env)" 2>/dev/null)

VERIFICATION_FAILED=false
for secret_mapping in "${REQUIRED_SECRETS[@]}"; do
  env_name=$(echo "$secret_mapping" | cut -d'=' -f1)
  if ! echo "$CURRENT_SECRETS" | grep -q "name: $env_name"; then
    echo "❌ Missing: $env_name"
    VERIFICATION_FAILED=true
  fi
done

if [ "$VERIFICATION_FAILED" = true ]; then
  echo ""
  echo "⚠ WARNING: Some secrets may not be properly mapped!"
  exit 1
fi

echo "✓ All secrets verified"

echo ""
echo "=============================================="
echo "✓ DEPLOYMENT COMPLETE"
echo "=============================================="
echo "Service URL: $SERVICE_URL"
echo ""
