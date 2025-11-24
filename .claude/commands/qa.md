# PremiumRadar-SAAS QA & Sprint Certification

Run comprehensive QA validation before certifying a sprint.

## EXECUTE ALL CHECKS IN ORDER:

### 1. Integration Tests
```bash
npm test
```
Report: Pass/Fail count, any failures

### 2. API Health Check
Check all 3 Cloud Run services:
```bash
# SaaS Service
curl -s https://premiumradar-saas-service-191599223867.us-central1.run.app/api/health | jq .

# OS Service (requires auth)
gcloud run services describe upr-os-service --region=us-central1 --format="value(status.url)"

# Worker Service
gcloud run services describe upr-os-worker --region=us-central1 --format="value(status.url)"
```

### 3. Worker Check
```bash
# Check Pub/Sub subscriptions
gcloud pubsub subscriptions list --format="table(name,topic,ackDeadlineSeconds)"

# Check worker logs (last 10 entries)
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=upr-os-worker" --limit=10 --format="table(timestamp,textPayload)"
```

### 4. Schema Validation
```bash
npm run build
npm run type-check 2>/dev/null || npx tsc --noEmit
```

### 5. Deployment Validation
```bash
# List all Cloud Run services
gcloud run services list --region=us-central1 --format="table(SERVICE,REGION,URL,LAST_DEPLOYED)"

# Check service accounts
for svc in premiumradar-saas-service upr-os-service upr-os-worker; do
  echo "=== $svc ==="
  gcloud run services describe $svc --region=us-central1 --format="value(spec.template.spec.serviceAccountName)"
done
```

### 6. Security Validation
```bash
# Check IAM bindings
for svc in premiumradar-saas-service upr-os-service upr-os-worker; do
  echo "=== $svc IAM ==="
  gcloud run services get-iam-policy $svc --region=us-central1 --format="table(bindings.role,bindings.members)"
done

# Check Cloud Armor (if configured)
gcloud compute security-policies list 2>/dev/null || echo "No Cloud Armor policies"
```

### 7. OS → SaaS Dependency Check
```bash
# Verify os-client.ts exists and has OIDC
grep -n "getIdToken" lib/os-client.ts

# Check OS base URL config
grep -n "UPR_OS_BASE_URL" lib/os-client.ts .env.example
```

### 8. Update Notion
Fetch token and update sprint status:
```bash
export NOTION_TOKEN=$(gcloud secrets versions access latest --secret=NOTION_TOKEN_SAAS)
node scripts/notion/getCurrentSprint.js
```

### 9. Generate QA Report
Create a summary report with:
- Date/Time
- Sprint number
- All check results (Pass/Fail)
- Any warnings or issues
- Recommendations

### 10. Sprint Certification
If ALL checks pass:
- Mark sprint as "Complete" in Notion
- Create git tag: `sprint-X-certified`
- Push tag to remote

```bash
# Only if all checks pass
git tag -a sprint-X-certified -m "Sprint X QA Certified - $(date +%Y-%m-%d)"
git push origin sprint-X-certified
```

## Output Format

Provide a structured QA report:

```
============================================================
QA REPORT - Sprint X
Date: YYYY-MM-DD HH:MM
============================================================

1. Integration Tests:    [PASS/FAIL] (X/Y passed)
2. API Health:           [PASS/FAIL]
   - SaaS Service:       [OK/FAIL]
   - OS Service:         [OK/FAIL]
   - Worker Service:     [OK/FAIL]
3. Worker Check:         [PASS/FAIL]
4. Schema Validation:    [PASS/FAIL]
5. Deployment:           [PASS/FAIL]
6. Security:             [PASS/FAIL]
7. OS→SaaS Dependency:   [PASS/FAIL]
8. Notion Updated:       [PASS/FAIL]

============================================================
CERTIFICATION: [CERTIFIED / NOT CERTIFIED]
============================================================
Issues Found: X
Warnings: Y

[List any issues or warnings here]
```

## Notes
- Run this command at the end of each sprint
- All checks must pass for certification
- If any check fails, fix issues before re-running
- The sprint is NOT certified until all checks pass
