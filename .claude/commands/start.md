# PremiumRadar-SAAS Session Bootstrap

You are starting a new session on the **PremiumRadar-SAAS** project.

**Workspace:** PremiumRadar-SAAS (Notion)
**Token:** GCP Secret Manager `NOTION_TOKEN_SAAS`

## EXECUTE THESE STEPS IN ORDER:

### Step 1: Read Context
Read the master context file:
- File: `docs/UPR_SAAS_CONTEXT.md` (MANDATORY - must load before any action)

### Step 2: Fetch Notion Token from Secret Manager
```bash
export NOTION_TOKEN=$(gcloud secrets versions access latest --secret=NOTION_TOKEN_SAAS)
```

### Step 3: Validate Environment
Check Cloud Run services health:
```bash
# Staging
curl -s https://upr.sivakumar.ai/api/health | jq .

# Production (if applicable)
curl -s https://premiumradar.com/api/health | jq .
```

### Step 4: Fetch Sprint Status
```bash
node scripts/notion/getCurrentSprint.js
```

To check a specific sprint:
```bash
node scripts/notion/getCurrentSprint.js <sprint_number>
```

### Step 5: Report to User
Provide a summary:
1. Current sprint number and goal
2. Features in progress
3. Features not started
4. Progress (X/Y complete)
5. Current environment status (staging/production)
6. Ask: "What would you like to work on?"

## Notion Database IDs
- Sprints: `5c32e26d-641a-4711-a9fb-619703943fb9`
- Features: `26ae5afe-4b5f-4d97-b402-5c459f188944`
- Knowledge: `f1552250-cafc-4f5f-90b0-edc8419e578b`

## Environment Mapping
- **Staging:** https://upr.sivakumar.ai (auto-deploy on push to `main`)
- **Production:** https://premiumradar.com (manual deploy via `production` branch)

## Key Files
- `docs/UPR_SAAS_CONTEXT.md` - Master context (MUST READ FIRST)
- `lib/os-client.ts` - OS API client (ONLY way to call OS)
- `.notion-db-ids.json` - Database IDs
- `.github/workflows/deploy.yml` - CI/CD pipeline

## Golden Rules (from Context)
- **TC MUST** load context file before executing anything
- **TC MUST** validate Notion schema before read/write
- **TC MUST** validate Cloud Run health before proceeding
- **TC MUST NOT** auto-create sprints or features
- **TC MUST NOT** deploy to production without approval
- All OS calls via `lib/os-client.ts` only
- Run `npm run build` after major changes
- Update Notion feature status when Done
