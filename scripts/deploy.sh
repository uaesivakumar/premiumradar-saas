#!/bin/bash
# PremiumRadar SaaS Deployment Script
# This script ensures all required secrets are preserved during deployment

set -e

ENV=${1:-staging}
REGION="us-central1"
PROJECT="applied-algebra-474804-e6"

if [ "$ENV" = "staging" ]; then
  SERVICE="premiumradar-saas-staging"
  OS_URL="https://upr-os-service-191599223867.us-central1.run.app"
  APP_ENV="staging"
elif [ "$ENV" = "production" ]; then
  SERVICE="premiumradar-saas"
  OS_URL="https://upr-os-service-191599223867.us-central1.run.app"
  APP_ENV="production"
else
  echo "Usage: ./scripts/deploy.sh [staging|production]"
  exit 1
fi

IMAGE="us-central1-docker.pkg.dev/$PROJECT/cloud-run-source-deploy/$SERVICE"

echo "=========================================="
echo "Deploying PremiumRadar SaaS ($ENV)"
echo "=========================================="

# ============================================
# PRE-DEPLOYMENT CHECKS
# ============================================
echo ""
echo "Running pre-deployment checks..."

# Check we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "app" ]; then
  echo "ERROR: Must run from premiumradar-saas root directory"
  echo "Current directory: $(pwd)"
  exit 1
fi

# Check required secrets exist
REQUIRED_SECRETS="PR_OS_TOKEN DATABASE_URL SUPER_ADMIN_EMAILS SUPER_ADMIN_SECRET SUPER_ADMIN_SESSION_KEY"
echo "Verifying secrets in Secret Manager..."
for secret in $REQUIRED_SECRETS; do
  if ! gcloud secrets describe $secret --project=$PROJECT &>/dev/null; then
    echo "ERROR: Secret not found: $secret"
    exit 1
  fi
done
echo "All secrets verified."

echo ""
echo "Pre-deployment checks PASSED"
echo ""

# ============================================
# SAVE CURRENT STATE FOR ROLLBACK
# ============================================
echo "Saving current revision for rollback..."
PREVIOUS_REVISION=$(gcloud run services describe $SERVICE --region=$REGION --format="value(status.traffic[0].revisionName)" 2>/dev/null || echo "")
if [ -n "$PREVIOUS_REVISION" ]; then
  echo "Previous revision: $PREVIOUS_REVISION"
fi

# ============================================
# BUILD
# ============================================
echo ""
echo "Building Docker image..."
gcloud builds submit --region=$REGION --tag=$IMAGE:latest .

# Step 2: Deploy with all required secrets and env vars
echo ""
echo "Deploying with secrets..."
gcloud run deploy $SERVICE \
  --region=$REGION \
  --image=$IMAGE:latest \
  --platform=managed \
  --allow-unauthenticated \
  --set-secrets="PR_OS_TOKEN=PR_OS_TOKEN:latest,DATABASE_URL=DATABASE_URL:latest,SUPER_ADMIN_EMAILS=SUPER_ADMIN_EMAILS:latest,SUPER_ADMIN_SECRET=SUPER_ADMIN_SECRET:latest,SUPER_ADMIN_SESSION_KEY=SUPER_ADMIN_SESSION_KEY:latest" \
  --set-env-vars="NODE_ENV=production,NEXT_PUBLIC_APP_ENV=$APP_ENV,UPR_OS_BASE_URL=$OS_URL"

echo ""
echo "Deployment complete!"
echo ""

SERVICE_URL=$(gcloud run services describe $SERVICE --region=$REGION --format="value(status.url)")
echo "Service URL: $SERVICE_URL"

# Step 3: Verify health
echo ""
echo "Verifying health..."
sleep 5
HEALTH=$(curl -s "$SERVICE_URL/api/health" 2>/dev/null)
if echo "$HEALTH" | grep -q '"status":"healthy"'; then
  echo "Health check: PASSED"
  echo "$HEALTH" | jq . 2>/dev/null || echo "$HEALTH"
else
  echo "Health check: WARNING (may need secrets update)"
  echo "$HEALTH" | jq . 2>/dev/null || echo "$HEALTH"
fi

echo ""
echo "Run validation: /staging (or ./scripts/validate-deployment.sh $ENV)"
