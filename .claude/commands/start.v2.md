# PremiumRadar Sprint Execution v2.2 (Orchestrator)

**Version:** 2.2 - With Feature Wiring Contracts + MANDATORY /wiring + AUTO /qa
**Role:** Orchestrator with ENFORCED lifecycle

---

## CRITICAL: ENFORCED SPRINT LIFECYCLE

```
/start S48
    │
    ├── PHASE 1: INITIALIZATION
    │   ├── Step 1: Initialize session state
    │   ├── Step 2: Load environment config
    │   ├── Step 3: Verify Notion availability (FAIL if unavailable)
    │   ├── Step 4: Fetch sprint features
    │   ├── Step 5: GENERATE FEATURE WIRING CONTRACTS ← MANDATORY
    │   ├── Step 6: Display contract table for FOUNDER REVIEW
    │   ├── Step 7: Persist contracts to session state
    │   ├── Step 8: Create todos (with contract references)
    │   └── Step 9: Create branch
    │
    ├── PHASE 2: EXECUTION (Per Feature Loop)
    │   │
    │   │   ┌─────────────────────────────────────────────────────┐
    │   │   │  FOR EACH FEATURE:                                  │
    │   │   │                                                     │
    │   │   │  1. Implement feature code                          │
    │   │   │  2. Run /wiring ← MANDATORY (blocks completion)     │
    │   │   │  3. Mark feature done (only if wiring passes)       │
    │   │   │                                                     │
    │   │   └─────────────────────────────────────────────────────┘
    │   │
    │   └── Repeat until all features complete
    │
    └── PHASE 3: CERTIFICATION
        ├── Step 10: Run /integrator (verify contracts)
        ├── Step 11: Run /qa ← AUTO-RUN (blocks sprint completion)
        └── Step 12: Sprint certified (only if qa passes)
```

---

## NON-NEGOTIABLE RULES (v2.2)

| Rule | Enforcement |
|------|-------------|
| No feature complete without /wiring | BLOCKED |
| No sprint complete without /qa | BLOCKED |
| No code before contracts defined | ABORTED |
| No silent Notion failures | ABORTED |
| No hardcoded URLs | REJECTED |

---

## PHASE 1: INITIALIZATION

### Step 1: Initialize Session State

```bash
mkdir -p .claude/session
mkdir -p .claude/locks

SESSION_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
SPRINT="S48"
```

---

### Step 2: Load Environment Config

**NO HARDCODED URLs. Read from .env or session.**

```bash
# Create environment.json if not exists
cat > .claude/session/environment.json << 'EOF'
{
  "staging_base_url": "${STAGING_URL:-https://upr.sivakumar.ai}",
  "staging_service_name": "premiumradar-saas-staging",
  "os_service_name": "upr-os-service",
  "os_base_url": "${OS_URL:-https://upr-os-service-191599223867.us-central1.run.app}",
  "health_endpoint": "/api/health",
  "diag_endpoint": "/__diag",
  "region": "us-central1",
  "project": "applied-algebra-474804-e6"
}
EOF

# Load and validate
ENV_CONFIG=$(cat .claude/session/environment.json)
STAGING_URL=$(echo "$ENV_CONFIG" | jq -r '.staging_base_url')

# Verify staging is reachable
STAGING_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${STAGING_URL}/api/health" 2>/dev/null)
if [ "$STAGING_STATUS" != "200" ]; then
  echo "ERROR: Staging not reachable at $STAGING_URL (status: $STAGING_STATUS)"
  echo "Cannot start sprint without working staging environment"
  exit 1
fi
```

---

### Step 3: Verify Notion Availability

**FAIL EXPLICITLY if Notion unavailable. No silent skips.**

```bash
export NOTION_TOKEN=$(gcloud secrets versions access latest --secret=NOTION_TOKEN_SAAS 2>/dev/null)

if [ -z "$NOTION_TOKEN" ]; then
  echo "FAIL: Cannot retrieve NOTION_TOKEN from Secret Manager"
  echo "Sprint start ABORTED"
  exit 1
fi

# Test Notion API
NOTION_TEST=$(curl -s -w "%{http_code}" -o /tmp/notion_test.json \
  -H "Authorization: Bearer $NOTION_TOKEN" \
  -H "Notion-Version: 2022-06-28" \
  "https://api.notion.com/v1/users/me" 2>/dev/null | tail -c 3)

if [ "$NOTION_TEST" != "200" ]; then
  echo "FAIL: Notion API not accessible (status: $NOTION_TEST)"
  echo "Sprint start ABORTED"
  exit 1
fi

echo "Notion API verified"
```

---

### Step 4: Fetch Sprint Features

```javascript
const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_TOKEN });

const SPRINTS_DB = '5c32e26d-641a-4711-a9fb-619703943fb9';
const FEATURES_DB = '26ae5afe-4b5f-4d97-b402-5c459f188944';
const SPRINT_NUM = 48;

// Get sprint
const sprints = await notion.databases.query({
  database_id: SPRINTS_DB,
  filter: { property: 'Sprint', title: { contains: `S${SPRINT_NUM}` } }
});

if (sprints.results.length === 0) {
  console.error(`FAIL: Sprint S${SPRINT_NUM} not found in Notion`);
  process.exit(1);
}

// Get features
const features = await notion.databases.query({
  database_id: FEATURES_DB,
  filter: { property: 'Sprint', number: { equals: SPRINT_NUM } }
});
```

---

### Step 5: GENERATE FEATURE WIRING CONTRACTS (MANDATORY)

**For EACH feature, TC MUST define:**

```json
{
  "feature_id": "S48-F1",
  "feature_name": "Dark mode toggle",
  "ui_entrypoint": {
    "type": "component",
    "path": "src/components/settings/ThemeToggle.tsx",
    "renders_at": "/settings"
  },
  "api_endpoints": [
    {
      "method": "GET",
      "path": "/api/user/preferences",
      "expected_response_shape": {
        "success_status": 200,
        "required_fields": ["theme", "userId"]
      }
    }
  ],
  "wiring_checks": [
    {
      "type": "import_exists",
      "from": "app/settings/page.tsx",
      "imports": "ThemeToggle"
    },
    {
      "type": "api_called",
      "component": "ThemeToggle.tsx",
      "calls": "/api/user/preferences"
    }
  ],
  "staging_verification_steps": [
    {
      "type": "http_status",
      "target": "/api/user/preferences",
      "method": "GET",
      "expected": { "status": 401 }
    }
  ]
}
```

---

### Step 6: Display Contract Table for Review

**FOUNDER MUST SEE THIS BEFORE IMPLEMENTATION STARTS**

```
════════════════════════════════════════════════════════════════════════════════
FEATURE WIRING CONTRACTS - S48
════════════════════════════════════════════════════════════════════════════════

Sprint: S48 - Dark Mode Implementation
Features: 3

TOTAL CONTRACTS: 3
TOTAL API ENDPOINTS: 4
TOTAL WIRING CHECKS: 6
TOTAL VERIFICATIONS: 6

If contracts are unclear or incomplete, ABORT sprint now.

════════════════════════════════════════════════════════════════════════════════
```

---

### Step 7: Persist Contracts to Session State

```javascript
const sessionState = {
  session_id: SESSION_ID,
  started_at: TIMESTAMP,
  sprint: "S48",

  // ... (environment, todos, etc.)

  feature_contracts: [ /* all contracts */ ],

  // NEW IN v2.2: Wiring tracking per feature
  wiring_status: {
    // Will be populated as features complete
    // "S48-F1": { verified: false, last_check: null, errors: [] }
  },

  // NEW IN v2.2: QA gate
  qa_gate: {
    required: true,
    passed: false,
    last_run: null,
    certification_id: null
  }
};

fs.writeFileSync('.claude/session/current.json', JSON.stringify(sessionState, null, 2));
```

---

### Step 8: Create Todos (With Wiring Enforcement)

```javascript
// TodoWrite call - each feature INCLUDES wiring step
TodoWrite([
  // S48-F1: Dark mode toggle
  { content: "S48-F1: Implement dark mode toggle component", status: "pending", activeForm: "Implementing dark mode toggle" },
  { content: "S48-F1: Run /wiring verification", status: "pending", activeForm: "Verifying wiring for S48-F1" },  // ← MANDATORY

  // S48-F2: Theme context
  { content: "S48-F2: Implement ThemeContext provider", status: "pending", activeForm: "Implementing ThemeContext" },
  { content: "S48-F2: Run /wiring verification", status: "pending", activeForm: "Verifying wiring for S48-F2" },  // ← MANDATORY

  // S48-F3: Preferences API
  { content: "S48-F3: Implement /api/user/preferences endpoint", status: "pending", activeForm: "Implementing preferences API" },
  { content: "S48-F3: Run /wiring verification", status: "pending", activeForm: "Verifying wiring for S48-F3" },  // ← MANDATORY

  // Sprint completion gates
  { content: "Run /integrator to verify all contracts", status: "pending", activeForm: "Running /integrator" },
  { content: "Run /qa for certification", status: "pending", activeForm: "Running /qa" }  // ← AUTO-RUN
]);
```

---

### Step 9: Create Branch

```bash
git checkout -b feat/s48-dark-mode
```

---

## PHASE 2: FEATURE EXECUTION LOOP

### MANDATORY: /wiring After Each Feature

**TC CANNOT mark a feature as done until /wiring passes.**

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    FEATURE COMPLETION PROTOCOL                                ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  1. Implement feature code                                                   ║
║                                                                              ║
║  2. Run /wiring                                                              ║
║     │                                                                        ║
║     ├── If PASS → Continue to step 3                                         ║
║     │                                                                        ║
║     └── If FAIL → Fix wiring gaps → Re-run /wiring → Loop until PASS         ║
║                                                                              ║
║  3. Mark feature as done in TodoWrite                                        ║
║                                                                              ║
║  4. Update session state:                                                    ║
║     wiring_status["S48-F1"] = { verified: true, last_check: NOW }            ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Wiring Check Template

After implementing a feature, TC MUST run:

```
/wiring

Checking: S48-F1 - Dark mode toggle
────────────────────────────────────────────────────────────────────────────────

1. Import Check:
   ✅ ThemeToggle imported in app/settings/page.tsx

2. API Call Check:
   ✅ ThemeToggle.tsx calls /api/user/preferences

3. Handler Check:
   ✅ onClick connected to handleThemeChange

4. State Update Check:
   ✅ Response updates useState hook

5. Runtime Check:
   ✅ API endpoint responds (401 - auth required)

────────────────────────────────────────────────────────────────────────────────
WIRING STATUS: ✅ PASS
────────────────────────────────────────────────────────────────────────────────

Feature S48-F1 can now be marked as done.
```

### If Wiring Fails

```
/wiring

Checking: S48-F1 - Dark mode toggle
────────────────────────────────────────────────────────────────────────────────

1. Import Check:
   ❌ ThemeToggle NOT imported anywhere

2. API Call Check:
   ❌ ThemeToggle.tsx does NOT call any API

3. Handler Check:
   ❌ onClick not connected

────────────────────────────────────────────────────────────────────────────────
WIRING STATUS: ❌ FAIL (3 gaps found)
────────────────────────────────────────────────────────────────────────────────

BLOCKED: Cannot mark feature as done until wiring passes.

Missing wires:
1. Import ThemeToggle in app/settings/page.tsx
2. Add fetch call to /api/user/preferences in ThemeToggle
3. Connect onClick handler to toggle function
```

---

## PHASE 3: SPRINT CERTIFICATION

### Step 10: Run /integrator

Verify all contracts against implementation.

### Step 11: AUTO-RUN /qa

**When all features are done, /qa runs automatically.**

```javascript
// Check if all features have passed wiring
const allFeaturesDone = Object.values(session.wiring_status).every(f => f.verified);

if (allFeaturesDone) {
  console.log("All features have passed wiring verification.");
  console.log("AUTO-RUNNING /qa for sprint certification...");

  // Run /qa
  await runQA(session.sprint);
}
```

### Step 12: Sprint Certification

**Sprint is certified ONLY if:**

1. ✅ All features implemented
2. ✅ All features passed /wiring
3. ✅ /integrator passed
4. ✅ /qa passed

```
════════════════════════════════════════════════════════════════════════════════
SPRINT CERTIFICATION
════════════════════════════════════════════════════════════════════════════════

Sprint: S48 - Dark Mode Implementation
Status: ✅ CERTIFIED

Features:     3/3 complete
Wiring:       3/3 verified
Integrator:   PASS
QA:           PASS

Certification ID: CERT-S48-20251224-abc123
Certified At:     2025-12-24T12:00:00Z

════════════════════════════════════════════════════════════════════════════════

Proceeding to:
- Update Notion sprint status → Done
- Create git tag: sprint-s48-complete
- Push to origin
```

---

## ABORT CONDITIONS

Sprint ABORTS if:

1. **Notion unavailable** - Cannot fetch features
2. **Staging unreachable** - Cannot verify deployments
3. **Contracts unclear** - Cannot define wiring for a feature
4. **No features** - Sprint has no features in Notion
5. **Environment config missing** - No staging URL defined

Feature completion BLOCKED if:

1. **/wiring fails** - Missing connections found
2. **Tests fail** - Unit/integration tests don't pass

Sprint completion BLOCKED if:

1. **/qa fails** - Certification not granted
2. **/integrator fails** - Contracts not verified

---

## GOLDEN RULES v2.2

1. **Contracts before code** - No implementation without wiring contract
2. **Wiring before done** - No feature marked done without /wiring pass
3. **QA before certified** - No sprint certified without /qa pass
4. **No git diff inference** - Contracts are the source of truth
5. **Scope ratio is king** - Not completion-adjusted drift
6. **One writer at a time** - Parallel edits impossible
7. **Abort on ambiguity** - If contracts unclear, don't start
8. **Environment from config** - No hardcoded URLs
9. **Notion required** - Silent skip is not allowed

---

## QUICK REFERENCE

### Sprint Lifecycle Commands

| Phase | Command | When |
|-------|---------|------|
| Start | `/start S48` | Begin sprint |
| Per Feature | `/wiring` | After implementing each feature |
| End | `/qa` | Auto-runs when all features done |

### Notion Database IDs

- Sprints: `5c32e26d-641a-4711-a9fb-619703943fb9`
- Features: `26ae5afe-4b5f-4d97-b402-5c459f188944`

### Session Files

- Current session: `.claude/session/current.json`
- Environment: `.claude/session/environment.json`
- Locks: `.claude/locks/`
