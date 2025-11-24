# UPR SaaS Context (Master Reference)

**Version:** 1.0.0
**Last Updated:** AUTO (by TC after every sprint)

---

# 🔥 Purpose

This file is the single source of truth for:
- Sprint execution
- Notion integration
- Cloud Run deployment
- Repo structure
- TC behavior rules
- Environment mapping
- Feature tracking
- Documentation

TC **must load this file** before executing any action.

---

## 1. Repositories

```
~/Projects/UPR/
├── upr-os/
├── upr-os-worker/
├── premiumradar-saas/
└── upr-infra/
```

---

## 2. Notion Database IDs (Production)

| DB | ID |
|----|----|
| Sprints | `5c32e26d-641a-4711-a9fb-619703943fb9` |
| Features | `26ae5afe-4b5f-4d97-b402-5c459f188944` |
| Knowledge | `f1552250-cafc-4f5f-90b0-edc8419e578b` |

**Token:** Stored in GCP Secret Manager as `NOTION_TOKEN_SAAS`

---

## 3. Cloud Environments

### Staging (Testing)

- **Domain:** https://upr.sivakumar.ai
- **Cloud Run Service:** `premiumradar-saas-staging`
- **Purpose:** Sprint development, demos, validation
- **Deployment:** Automatic on push to `main`

### Production (Live SaaS)

- **Domain:** https://premiumradar.com
- **Cloud Run Service:** `premiumradar-saas-production`
- **Purpose:** Customer-facing SaaS
- **Deployment:** Manual merge to `production` branch

### Shared Backend

- `upr-os-service` (Core Intelligence Layer)
- `upr-os-worker` (Async Processing)

---

## 4. Deployment Rules

### Staging Deployment (AUTOMATIC)

**Trigger:** Push to `main` branch

```bash
git push origin main
```

**CI/CD will:**
1. Build SaaS
2. Deploy to Cloud Run staging → `premiumradar-saas-staging`
3. Update domain → `upr.sivakumar.ai`
4. Post deployment log
5. TC runs `/start` to validate

✔ This environment is for Sprint development & testing
✔ Workers & OS auto-sync

### Production Deployment (MANUAL)

**Trigger:** Push to `production` branch

```bash
git checkout production
git merge main
git push origin production
```

**CI/CD will:**
1. Build SaaS
2. Deploy to Cloud Run production → `premiumradar-saas-production`
3. Update SLA domain → `premiumradar.com`
4. TC runs `/qa` to certify deployment
5. TC updates:
   - Release Notes
   - Knowledge page
   - Sprint DB (if applicable)

✔ Safe
✔ Zero-risk
✔ VC-ready governance

---

## 5. TC Operating Rules

### TC MUST:

- Load this file before executing anything
- Validate Notion schema before read/write
- Validate Cloud Run health before proceeding
- Update:
  - Sprint page
  - Features page
  - Knowledge page
- Create:
  - Sprint docs
  - QA docs
  - Batch docs

### TC MUST NOT:

- Auto-create sprints (without explicit founder request)
- Auto-create features (without explicit founder request)
- Modify OS v1
- Deploy to production without approval
- Assume any table/column name
- Assume any environment variables
- Run local commands
- Use local database

### Notion Sync Rules (MANDATORY)

**CRITICAL:** TC must populate ALL required fields when updating Notion databases, not just status fields.

#### For Every Sprint Record, TC Must Populate:

- Status (select)
- Sprint Name (title)
- Goal (rich_text)
- Outcomes (rich_text)
- Highlights (rich_text)
- Business Value (rich_text)
- Started At (date)
- Completed At (date)
- Commit (rich_text)
- Git Tag (rich_text)
- Branch (rich_text)
- Phases Updated (multi_select)
- Learnings (rich_text)
- Commits Count (number)
- Synced At (date)

#### For Every Feature Record, TC Must Populate:

- Feature Name (title)
- Sprint (number)
- Status (select)
- Priority (select)
- Complexity (select)
- Type (select)
- Notes (rich_text)
- Tags (multi_select)
- Started At (date)
- Completed At (date)
- Assignee (rich_text)
- Done? (checkbox)

#### 9-Step Notion Sync Workflow:

When TC performs any Notion update, TC must follow this workflow:

1. **Fetch schema** - Retrieve full database schema
2. **Validate schema** - Ensure all required properties exist
3. **Detect missing fields** - Identify which fields are empty
4. **Populate all required fields** - Update every field listed above
5. **Delete meaningless columns** - Remove unused/redundant columns
6. **Check Knowledge Page** - Determine if Knowledge Page needs update
7. **Apply updates** - Execute all database writes
8. **Write detailed commit message** - Document changes in Notion logs
9. **Confirm completion** - Verify all updates succeeded

**Example Script:** `scripts/notion/fullSecuritySync.js`

#### Forbidden Practices:

- ❌ NEVER update only the Status field
- ❌ NEVER skip filling required fields
- ❌ NEVER assume a field is optional
- ❌ NEVER leave Notes, Learnings, or Business Value empty

### Sprint & Feature Creation Rules

**Default Behavior:**
- TC must **never** auto-create sprints or features without explicit founder request
- TC only **reads** from Notion and **executes** assigned work
- TC **updates status** of existing sprints/features

**When Explicitly Requested:**

When the founder explicitly asks TC to create sprints or features (e.g., "Generate Security Sprints S1-S6"), TC is allowed to:

1. **Design** the sprint structure
2. **Create** individual features
3. **Write** the full sequence and continuity
4. **Store** them in Notion

**Approval Process:**

1. After creation, the **founder must approve or modify** the sprints/features in Notion
2. Only after **founder approval** can TC begin executing the sprint
3. TC announces when sprints/features are created and awaits approval

**Example Flow:**
```
Founder: "Generate Security Sprints S1-S6"
TC: Creates sprints and features in Notion
TC: "S1-S6 created with 42 features. Please review in Notion."
Founder: Reviews and approves
Founder: "Begin Sprint S1"
TC: Executes Sprint S1
```

---

## 6. Slash Commands

### /start

Execute at session start:
- Load context
- Load sprint from Notion
- Sync features
- Validate environment
- Validate Cloud Run
- Prepare sprint session

### /qa

Execute for sprint certification:
- Execute full QA suite
- Generate QA report
- Update Notion
- Certify sprint
- Prepare release hooks

---

## 7. Environment Variables

### From GCP Secret Manager:

- `NOTION_TOKEN_SAAS`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_KEY`
- `OS_BASE_URL`
- `SAAS_SERVICE_URL`
- `WORKER_SERVICE_URL`

### Access via:

```bash
gcloud secrets versions access latest --secret=NOTION_TOKEN_SAAS
```

---

## 8. Documentation Rules

TC updates these automatically:

```
/docs/sprints/Sprint_X_Plan.md
/docs/qa/Sprint_X_QA_Report.md
/docs/batches/Batch_Summary_SX-SY.md
/docs/knowledge/*
/docs/changelog/UPR_CHANGELOG.md
```

---

## 9. Security Rules

### Zero-Trust Security Model

```
                     [Internet]
                          │
                    Cloud Armor WAF
                    (SQLi, XSS, Rate)
                          │
                    ┌─────▼─────┐
                    │  SaaS     │ ← Public (allUsers)
                    │  Service  │
                    └─────┬─────┘
                          │ OIDC Token
                    ┌─────▼─────┐
                    │  OS       │ ← Private (SaaS SA only)
                    │  Service  │
                    └─────┬─────┘
                          │ OIDC Token
                    ┌─────▼─────┐
                    │  Worker   │ ← Private (OS SA + Pub/Sub)
                    │  Service  │
                    └───────────┘
```

### IAM Bindings

- `premiumradar-saas-service`: `allUsers` can invoke
- `upr-os-service`: Only `premiumradar-saas-sa` can invoke
- `upr-os-worker`: Only `upr-os-sa` and Pub/Sub SA can invoke

### Security Gate (QA Mandatory)

**MANDATORY before QA certification:**

1. **TC must run Prompt Injection Red-Team Suite** before QA certification
2. **TC must verify no internal config fields leak to clients**
3. **TC must run OWASP top-10 smoke tests** each sprint
4. **TC must update `SECURITY_CHANGELOG.md`** after any security-affecting change
5. **Any sprint failing security gate stays QA Pending**

**Files:**
- `SECURITY_CHANGELOG.md` - Track all security-affecting changes
- `tests/security/` - Security test suites

---

## 10. Security Sprints (MANDATORY BEFORE SPRINT 1)

**CRITICAL:** All security sprints (S1-S6) must be completed before starting product Sprint 1.

See: `docs/SECURITY_SPRINTS.md` for full details.

### Security Sprint Overview

| Sprint | Name | Priority | Status |
|--------|------|----------|--------|
| **S1** | Prompt Injection Firewall v1.0 | Critical | ✅ Completed |
| **S2** | OS Identity & Token Hardening | Critical | ✅ Completed |
| **S3** | Anti-Reverse-Engineering | Critical | ✅ Completed |
| **S4** | Red-Team Suite v1.0 | Critical | ✅ Completed |
| **S5** | WAF + Abuse Prevention | Critical | ✅ Completed |
| **S6** | Immutable Security Change Log | Critical | ✅ Completed |

**Completion Date:** 2025-11-24
**Total Features Delivered:** 32 features
**Total Code:** ~3,500 lines of production security code
**Git Commits:** ff7705e (S1), bfa6d9c (S2-S6)
**Git Tags:** sprint-s1-certified through sprint-s6-certified

### Security Gate Before Product Sprints

- ✅ All S1-S6 sprints completed
- ✅ 150+ red-team prompts passing
- ✅ OWASP Top 10 coverage verified
- ✅ Third-party security audit (optional but recommended)
- ✅ SECURITY_CHANGELOG.md established

**No product development starts until security foundation is complete.**

---

## 11. Success Criteria

PremiumRadar SaaS Sprint = **COMPLETE** only if:

- ✅ All sprint tasks done
- ✅ `/qa` passed
- ✅ Security sprints completed (if applicable)
- ✅ TC has updated:
  - Sprint DB
  - Features DB
  - Knowledge Page
- ✅ Deployment validated on staging

---

## 12. Domain → Environment Mapping

| Domain | Environment | Cloud Run Service | Purpose |
|--------|-------------|-------------------|---------|
| upr.sivakumar.ai | Staging | premiumradar-saas-staging | Sprint testing, demo |
| premiumradar.com | Production | premiumradar-saas-production | Actual SaaS |

**Note:** OS & Worker remain the same for both environments.

---

## 13. CI/CD Workflows

### Repository: premiumradar-saas

**Branch Strategy:**
- `main` → deploy to staging (upr.sivakumar.ai)
- `production` → deploy to production (premiumradar.com)

**Workflow:** `.github/workflows/deploy.yml`

### Repository: upr-os

**Branch Strategy:**
- `main` → autodeploy (OS is backend/core)

**Workflow:** `.github/workflows/deploy.yml`

### Repository: upr-os-worker

**Branch Strategy:**
- `main` → deploy worker

**Workflow:** `.github/workflows/deploy.yml`

---

## Appendix: Quick Reference

### Sprint Commands

```bash
# Get current sprint features
NOTION_TOKEN=$(gcloud secrets versions access latest --secret=NOTION_TOKEN_SAAS)
node scripts/notion/getCurrentSprint.js

# Update feature status
node scripts/notion/updateSprint<N>Feature.js "<feature_name>" "<status>"

# Complete sprint
node scripts/notion/updateNotionComplete.js <current_sprint> <previous_sprint>
```

### Deployment Commands

```bash
# Deploy to staging
git push origin main

# Deploy to production
git checkout production
git merge main
git push origin production
```

### Health Check

```bash
# SaaS Staging
curl -s https://upr.sivakumar.ai/api/health | jq .

# SaaS Production
curl -s https://premiumradar.com/api/health | jq .

# OS Service
gcloud run services describe upr-os-service --region=us-central1 --format="value(status.url)"

# Worker Service
gcloud run services describe upr-os-worker --region=us-central1 --format="value(status.url)"
```

---

**End of UPR_SAAS_CONTEXT.md**
