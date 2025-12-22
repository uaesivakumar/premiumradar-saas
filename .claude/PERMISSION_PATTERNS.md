# PremiumRadar Permission Patterns v2.1

**Version:** 2.1 - Staging/Prod split, narrowed WebFetch domains

---

## CRITICAL CHANGES FROM v2.0

1. **Staging deploys: AUTO-APPROVED**
2. **Prod deploys: APPROVE ONCE PER SESSION**
3. **WebFetch narrowed to exact required domains**
4. **Prod deploy command must include explicit prod identifier**

---

## Permission Levels

```
Level 0: AUTO-APPROVED
         No prompt, immediate execution
         Includes: staging deploys, builds, tests

Level 1: APPROVE ONCE PER SESSION
         Prompt first time, auto-approve rest of session
         Includes: PRODUCTION deploys, schema migrations

Level 2: APPROVE EVERY TIME
         Always prompt, no auto-approval
         Includes: force push, destructive deletes

Level 3: FOUNDER ONLY (Never auto-approve)
         Requires explicit founder command
         Includes: secret rotation, billing API, DNS
```

---

## Staging vs Production Deploy Split

### STAGING (Level 0 - Auto-Approved)

```json
{
  "allow": [
    "Bash(gcloud run deploy premiumradar-saas-staging:*)",
    "Bash(gcloud run deploy *-staging:*)",
    "Bash(gcloud builds submit:*)"
  ]
}
```

**Staging deploy patterns:**
```bash
# These are AUTO-APPROVED
gcloud run deploy premiumradar-saas-staging --source .
gcloud run deploy upr-os-staging --source .
```

### PRODUCTION (Level 1 - Approve Once Per Session)

```json
{
  "ask": [
    "Bash(gcloud run deploy premiumradar-saas --source:*)",
    "Bash(gcloud run deploy upr-os-service --source:*)",
    "Bash(gcloud run deploy *production*:*)"
  ]
}
```

**Production deploy patterns:**
```bash
# These REQUIRE APPROVAL (once per session)
gcloud run deploy premiumradar-saas --source .       # PROD
gcloud run deploy upr-os-service --source .          # PROD
gcloud run deploy premiumradar-production --source . # PROD
```

### Production Detection

Production deploys are identified by:
1. Service name does NOT contain "staging"
2. Service name matches known production services:
   - `premiumradar-saas`
   - `upr-os-service`
   - `upr-os-worker`

### Session State for Production Approval

```json
{
  "permissions": {
    "staging_deploy_approved": true,
    "prod_deploy_approved": false,
    "prod_deploy_approved_at": null,
    "prod_deploys_this_session": 0
  }
}
```

After first prod deploy approval:
```json
{
  "permissions": {
    "prod_deploy_approved": true,
    "prod_deploy_approved_at": "2025-12-21T10:30:00Z",
    "prod_deploys_this_session": 1
  }
}
```

---

## WebFetch Domain Restrictions

### NARROWED: Only Exact Required Domains

```json
{
  "allow": [
    "WebFetch(domain:upr.sivakumar.ai)",
    "WebFetch(domain:premiumradar-saas-staging-191599223867.us-central1.run.app)",
    "WebFetch(domain:upr-os-service-191599223867.us-central1.run.app)",
    "WebFetch(domain:api.notion.com)"
  ]
}
```

### REMOVED: Broad Domains

```json
{
  "deny": [
    "WebFetch(domain:www.notion.so)",
    "WebFetch(domain:*.notion.so)",
    "WebFetch(domain:*.run.app)"
  ]
}
```

### Rationale

| Old Pattern | Risk | New Pattern |
|-------------|------|-------------|
| `www.notion.so` | Broad access to Notion UI | `api.notion.com` only |
| `*.run.app` | Any Cloud Run service | Exact service URLs |

---

## Recommended settings.local.json v2.1

```json
{
  "permissions": {
    "allow": [
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git push:*)",
      "Bash(git checkout:*)",
      "Bash(git branch:*)",
      "Bash(git merge:*)",
      "Bash(git pull:*)",
      "Bash(git status:*)",
      "Bash(git log:*)",
      "Bash(git diff:*)",
      "Bash(git stash:*)",
      "Bash(git tag:*)",

      "Bash(npm run build:*)",
      "Bash(npm run dev:*)",
      "Bash(npm run start:*)",
      "Bash(npm run lint:*)",
      "Bash(npm test:*)",
      "Bash(npm install:*)",
      "Bash(npm audit:*)",
      "Bash(npm outdated:*)",
      "Bash(npx tsc:*)",
      "Bash(npx tsx:*)",

      "Bash(node:*)",

      "Bash(curl:*)",
      "Bash(cat:*)",
      "Bash(ls:*)",
      "Bash(mkdir:*)",
      "Bash(chmod:*)",
      "Bash(jq:*)",

      "Bash(gcloud run services describe:*)",
      "Bash(gcloud run services list:*)",
      "Bash(gcloud run revisions list:*)",
      "Bash(gcloud logging read:*)",
      "Bash(gcloud secrets versions access:*)",
      "Bash(gcloud secrets list:*)",
      "Bash(gcloud builds list:*)",
      "Bash(gcloud builds log:*)",
      "Bash(gcloud config:*)",
      "Bash(gcloud auth:*)",

      "Bash(gcloud run deploy *-staging:*)",
      "Bash(gcloud run deploy premiumradar-saas-staging:*)",
      "Bash(gcloud builds submit:*)",

      "Bash(gh pr create:*)",
      "Bash(gh pr view:*)",
      "Bash(gh pr merge:*)",
      "Bash(gh run list:*)",
      "Bash(gh run view:*)",
      "Bash(gh run watch:*)",

      "WebFetch(domain:upr.sivakumar.ai)",
      "WebFetch(domain:premiumradar-saas-staging-191599223867.us-central1.run.app)",
      "WebFetch(domain:upr-os-service-191599223867.us-central1.run.app)",
      "WebFetch(domain:api.notion.com)",

      "Edit(*)",
      "Write(*)",
      "Read(*)",
      "Glob(*)",
      "Grep(*)"
    ],

    "deny": [
      "Bash(git push --force:*)",
      "Bash(git push -f:*)",
      "Bash(git reset --hard:*)",
      "Bash(rm -rf /:*)",
      "Bash(rm -rf ~:*)",
      "Bash(*DROP TABLE*)",
      "Bash(*TRUNCATE*)",
      "Bash(*sk_live_*)",
      "Bash(gcloud secrets versions add:*)",
      "Bash(gcloud secrets create:*)",

      "WebFetch(domain:www.notion.so)",
      "WebFetch(domain:*.notion.so)"
    ],

    "ask": [
      "Bash(gcloud run deploy premiumradar-saas --source:*)",
      "Bash(gcloud run deploy upr-os-service --source:*)",
      "Bash(gcloud run deploy upr-os-worker --source:*)",
      "Bash(gcloud run services update:*)",
      "Bash(gcloud run domain-mappings:*)"
    ]
  }
}
```

---

## Production Deploy Protocol

### First Production Deploy of Session

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PRODUCTION DEPLOY REQUEST (Level 1)                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ Service:    premiumradar-saas (PRODUCTION)                              │
│ Command:    gcloud run deploy premiumradar-saas --source .              │
│                                                                          │
│ This is PRODUCTION. Changes will be live immediately.                   │
│                                                                          │
│ Checklist:                                                               │
│   ✓ /integrator passed                                                  │
│   ✓ /qa passed                                                          │
│   ✓ Staging verified                                                    │
│                                                                          │
│ [Approve for Session] [Approve Once] [Deny]                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Subsequent Production Deploys (Same Session)

```
Production deploy: premiumradar-saas
Session approval: GRANTED at 10:30:00
Deploys this session: 2

Proceeding with deploy...
```

---

## Deploy Command Patterns

### Staging (Auto-Approved)

```bash
# Pattern: service name contains "staging"
gcloud run deploy premiumradar-saas-staging --source . --region us-central1
gcloud run deploy upr-os-staging --source . --region us-central1
```

### Production (Requires Approval)

```bash
# Pattern: service name is exact production name
gcloud run deploy premiumradar-saas --source . --region us-central1
gcloud run deploy upr-os-service --source . --region us-central1
gcloud run deploy upr-os-worker --source . --region us-central1
```

### Detection Logic

```javascript
function isProductionDeploy(command) {
  const productionServices = [
    'premiumradar-saas',
    'upr-os-service',
    'upr-os-worker'
  ];

  // Check if deploying to a production service
  for (const service of productionServices) {
    // Exact match (not staging variant)
    if (command.includes(`deploy ${service} `) ||
        command.includes(`deploy ${service}$`)) {
      return true;
    }
  }

  // Contains "production" in name
  if (command.includes('production')) {
    return true;
  }

  // Has staging in name = NOT production
  if (command.includes('staging')) {
    return false;
  }

  return false;
}
```

---

## Level Summary

| Level | Operations | Prompt | Auto-After-First |
|-------|------------|--------|------------------|
| 0 | Build, test, staging deploy, git | Never | N/A |
| 1 | Production deploy, migrations | First time | Yes |
| 2 | Force push, destructive | Every time | No |
| 3 | Secrets, billing, DNS | Blocked | N/A |

---

## Security Boundaries

### Never Auto-Approve

| Operation | Level | Reason |
|-----------|-------|--------|
| `git push --force` | 2 | History rewrite |
| `gcloud secrets create` | 3 | Security critical |
| `gcloud secrets versions add` | 3 | Secret mutation |
| `*sk_live_*` | 3 | Production Stripe |
| `DROP TABLE` | 3 | Data destruction |
| `TRUNCATE` | 3 | Data destruction |

### Staging-Only Auto-Approve

| Operation | Level | Why Safe |
|-----------|-------|----------|
| `gcloud run deploy *-staging` | 0 | Non-production |
| `gcloud builds submit` | 0 | Builds only |
| `curl` to staging URLs | 0 | Read-only |

### Production Requires Session Approval

| Operation | Level | Notes |
|-----------|-------|-------|
| `gcloud run deploy premiumradar-saas` | 1 | Prod SaaS |
| `gcloud run deploy upr-os-service` | 1 | Prod OS |
| `gcloud run services update` | 1 | Env changes |

---

## Audit Trail

All deploys logged to session state:

```json
{
  "permissions": {
    "deploy_log": [
      {
        "timestamp": "2025-12-21T10:15:00Z",
        "service": "premiumradar-saas-staging",
        "is_production": false,
        "auto_approved": true
      },
      {
        "timestamp": "2025-12-21T10:30:00Z",
        "service": "premiumradar-saas",
        "is_production": true,
        "auto_approved": false,
        "approved_by": "user",
        "approval_type": "session"
      },
      {
        "timestamp": "2025-12-21T11:00:00Z",
        "service": "premiumradar-saas",
        "is_production": true,
        "auto_approved": true,
        "reason": "session approval granted at 10:30:00"
      }
    ]
  }
}
```

---

## Golden Rules v2.1

1. **Staging = auto, Prod = approve** - Clear separation
2. **Narrow domains** - Only exact URLs needed
3. **Session-scoped prod** - One approval covers session
4. **Explicit prod identifier** - Service name must be exact
5. **All deploys logged** - Audit trail in session state
