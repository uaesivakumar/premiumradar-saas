# PremiumRadar Sprint Execution v2.1 (Orchestrator)

**Version:** 2.1 - With Feature Wiring Contracts
**Role:** Orchestrator with MANDATORY contract generation

---

## CRITICAL: CONTRACT-FIRST EXECUTION

**Implementation CANNOT START until Feature Wiring Contracts are defined and persisted.**

If wiring cannot be clearly defined at /start → **ABORT SPRINT**.

---

## EXECUTION FLOW

```
/start S48
    │
    ├── Step 1: Initialize session state
    ├── Step 2: Load environment config
    ├── Step 3: Verify Notion availability (FAIL if unavailable)
    ├── Step 4: Fetch sprint features
    ├── Step 5: GENERATE FEATURE WIRING CONTRACTS ← MANDATORY
    ├── Step 6: Display contract table for FOUNDER REVIEW
    ├── Step 7: Persist contracts to session state
    ├── Step 8: Create todos (with contract references)
    ├── Step 9: Create branch
    └── Step 10: Begin execution (only after contracts exist)
```

---

## STEP 1: Initialize Session State

```bash
mkdir -p .claude/session
mkdir -p .claude/locks

SESSION_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
SPRINT="S48"
```

---

## STEP 2: Load Environment Config

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

## STEP 3: Verify Notion Availability

**FAIL EXPLICITLY if Notion unavailable. No silent skips.**

```bash
export NOTION_TOKEN=$(gcloud secrets versions access latest --secret=NOTION_TOKEN_SAAS 2>/dev/null)

if [ -z "$NOTION_TOKEN" ]; then
  echo "FAIL: Cannot retrieve NOTION_TOKEN from Secret Manager"
  echo "Reason: Secret access failed or token empty"
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
  echo "Content: $(cat /tmp/notion_test.json)"
  echo "Sprint start ABORTED"
  exit 1
fi

echo "Notion API verified"
```

---

## STEP 4: Fetch Sprint Features

```javascript
// Fetch sprint and features from Notion
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

console.log(JSON.stringify({
  sprint: sprints.results[0],
  features: features.results
}, null, 2));
```

---

## STEP 5: GENERATE FEATURE WIRING CONTRACTS (MANDATORY)

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
      "required_request_fields": [],
      "expected_response_shape": {
        "success_status": 200,
        "required_fields": ["theme", "userId"]
      }
    },
    {
      "method": "PUT",
      "path": "/api/user/preferences",
      "required_request_fields": ["theme"],
      "expected_response_shape": {
        "success_status": 200,
        "required_fields": ["success"]
      }
    }
  ],
  "test_ids": [
    {
      "file": "tests/api/preferences.test.ts",
      "test_name": "should update theme preference"
    },
    {
      "file": "tests/components/ThemeToggle.test.tsx",
      "test_name": "should toggle between light and dark"
    }
  ],
  "staging_verification_steps": [
    {
      "type": "http_status",
      "target": "/api/user/preferences",
      "method": "GET",
      "expected": { "status": 401 }
    },
    {
      "type": "smoke_test",
      "target": "/settings",
      "method": "GET",
      "expected": { "status": 200 }
    }
  ]
}
```

### Contract Generation Rules

1. **ui_entrypoint.type** must be one of:
   - `page` - Full page route
   - `route` - API route only
   - `component` - UI component (must specify `renders_at`)
   - `api_only` - Backend only, no UI
   - `background` - Background job/worker

2. **api_endpoints** - List ALL endpoints this feature uses or creates

3. **test_ids** - Explicit test files AND test names (not patterns)

4. **staging_verification_steps** - Actual runtime checks:
   - `http_status` - Check HTTP status code
   - `json_field` - Check specific field in JSON response
   - `health_check` - Check health endpoint
   - `smoke_test` - Check page renders (returns 200)

---

## STEP 6: Display Contract Table for Review

**FOUNDER MUST SEE THIS BEFORE IMPLEMENTATION STARTS**

```
════════════════════════════════════════════════════════════════════════════════
FEATURE WIRING CONTRACTS - S48
════════════════════════════════════════════════════════════════════════════════

Sprint: S48 - Dark Mode Implementation
Features: 3

────────────────────────────────────────────────────────────────────────────────
CONTRACT: S48-F1 - Dark mode toggle
────────────────────────────────────────────────────────────────────────────────

UI Entrypoint:
  Type:       component
  Path:       src/components/settings/ThemeToggle.tsx
  Renders At: /settings

API Endpoints:
  1. GET  /api/user/preferences
     Expected: 200, fields: [theme, userId]

  2. PUT  /api/user/preferences
     Request:  [theme]
     Expected: 200, fields: [success]

Tests:
  1. tests/api/preferences.test.ts :: "should update theme preference"
  2. tests/components/ThemeToggle.test.tsx :: "should toggle between light and dark"

Staging Verification:
  1. GET /api/user/preferences → 401 (auth required)
  2. GET /settings → 200 (page renders)

────────────────────────────────────────────────────────────────────────────────
CONTRACT: S48-F2 - Theme context provider
────────────────────────────────────────────────────────────────────────────────

UI Entrypoint:
  Type:       component
  Path:       src/contexts/ThemeContext.tsx
  Renders At: / (root)

API Endpoints:
  (none - client-side only)

Tests:
  1. tests/contexts/ThemeContext.test.tsx :: "should persist theme to localStorage"

Staging Verification:
  1. GET / → 200 (app loads)

────────────────────────────────────────────────────────────────────────────────
CONTRACT: S48-F3 - Theme persistence API
────────────────────────────────────────────────────────────────────────────────

UI Entrypoint:
  Type:       api_only
  Path:       app/api/user/preferences/route.ts

API Endpoints:
  1. GET  /api/user/preferences
  2. PUT  /api/user/preferences

Tests:
  1. tests/api/preferences.test.ts :: "should return 401 without auth"
  2. tests/api/preferences.test.ts :: "should return user preferences"
  3. tests/api/preferences.test.ts :: "should update preferences"

Staging Verification:
  1. GET /api/user/preferences → 401
  2. GET /api/health → 200

════════════════════════════════════════════════════════════════════════════════

TOTAL CONTRACTS: 3
TOTAL API ENDPOINTS: 4
TOTAL TESTS: 6
TOTAL VERIFICATIONS: 6

If contracts are unclear or incomplete, ABORT sprint now.
Proceeding will persist these contracts and block completion without verification.

════════════════════════════════════════════════════════════════════════════════
```

---

## STEP 7: Persist Contracts to Session State

```javascript
const sessionState = {
  session_id: SESSION_ID,
  started_at: TIMESTAMP,
  sprint: "S48",
  goal: "Add dark mode toggle to settings",
  service: "SaaS",
  repository: process.cwd(),
  branch: "feat/s48-dark-mode",

  environment: {
    staging_base_url: "https://upr.sivakumar.ai",
    staging_service_name: "premiumradar-saas-staging",
    os_service_name: "upr-os-service",
    health_endpoint: "/api/health",
    diag_endpoint: "/__diag",
    notion_available: true,
    notion_error: null
  },

  todos: {
    original_count: 9,  // IMMUTABLE
    current_count: 9,
    completed_count: 0,
    added_count: 0,
    scope_ratio: 1.0,        // CORRECTED FORMULA: current/original
    scope_added_ratio: 0.0,  // added/original
    drift_status: "on_track",
    drift_acknowledged: false,
    original_todos: [
      "S48-F1: Implement dark mode toggle",
      "S48-F1: Wire to /api/user/preferences",
      "S48-F1: Add tests",
      "S48-F2: Implement theme context",
      "S48-F2: Add tests",
      "S48-F3: Implement preferences API",
      "S48-F3: Add tests",
      "Run /integrator",
      "Run /qa"
    ]
  },

  feature_contracts: [
    // ... all contracts from Step 5 ...
  ],

  checkpoints: [],

  integration: {
    required: true,
    verified: false,
    contracts_defined: true,  // MUST be true
    contracts_verified_count: 0,
    contracts_failed_count: 0,
    bypassed: false
  },

  locks: {
    active_locks: [],
    max_concurrent_writers: 1,
    current_writer: null
  },

  permissions: {
    scope_id: "sprint-s48-permit",
    staging_deploy_approved: true,   // Auto-approved
    prod_deploy_approved: false       // Requires approval
  },

  sub_agents: []
};

fs.writeFileSync('.claude/session/current.json', JSON.stringify(sessionState, null, 2));
```

---

## STEP 8: Create Todos (With Contract References)

```javascript
// TodoWrite call - each todo references its contract
TodoWrite([
  // S48-F1: Dark mode toggle
  { content: "S48-F1: Implement dark mode toggle component", status: "pending", activeForm: "Implementing dark mode toggle" },
  { content: "S48-F1: Wire ThemeToggle to /api/user/preferences", status: "pending", activeForm: "Wiring to preferences API" },
  { content: "S48-F1: Add ThemeToggle tests", status: "pending", activeForm: "Adding ThemeToggle tests" },

  // S48-F2: Theme context
  { content: "S48-F2: Implement ThemeContext provider", status: "pending", activeForm: "Implementing ThemeContext" },
  { content: "S48-F2: Add ThemeContext tests", status: "pending", activeForm: "Adding ThemeContext tests" },

  // S48-F3: Preferences API
  { content: "S48-F3: Implement /api/user/preferences endpoint", status: "pending", activeForm: "Implementing preferences API" },
  { content: "S48-F3: Add preferences API tests", status: "pending", activeForm: "Adding API tests" },

  // Integration & QA (mandatory)
  { content: "Run /integrator to verify all contracts", status: "pending", activeForm: "Running /integrator" },
  { content: "Run /qa for certification", status: "pending", activeForm: "Running /qa" }
]);
```

---

## STEP 9: Create Branch

```bash
git checkout -b feat/s48-dark-mode
```

---

## STEP 10: Begin Execution

**ONLY after contracts are persisted.**

```
════════════════════════════════════════════════════════════════════════════════
SPRINT READY FOR EXECUTION
════════════════════════════════════════════════════════════════════════════════

Session:    abc-123-def
Sprint:     S48 - Dark Mode Implementation
Service:    SaaS
Branch:     feat/s48-dark-mode

Contracts:  3 defined
Todos:      9 (0 complete)
Scope:      1.0x (on track)

Environment:
  Staging:  https://upr.sivakumar.ai (200 OK)
  Notion:   Available

Single-Writer Lock: ENABLED (1 implementation agent max)

────────────────────────────────────────────────────────────────────────────────
EXECUTION RULES
────────────────────────────────────────────────────────────────────────────────

1. Contracts are IMMUTABLE - cannot change mid-sprint
2. /integrator will verify against contracts, not git diff
3. Scope ratio > 1.3 triggers WARNING
4. Scope ratio > 1.5 triggers PAUSE
5. Scope ratio > 2.0 triggers BLOCK
6. Only 1 implementation agent at a time

────────────────────────────────────────────────────────────────────────────────

First task: S48-F1: Implement dark mode toggle component

════════════════════════════════════════════════════════════════════════════════
```

---

## ABORT CONDITIONS

Sprint start ABORTS if:

1. **Notion unavailable** - Cannot fetch features
2. **Staging unreachable** - Cannot verify deployments
3. **Contracts unclear** - Cannot define wiring for a feature
4. **No features** - Sprint has no features in Notion
5. **Environment config missing** - No staging URL defined

---

## DRIFT CALCULATION (CORRECTED)

```javascript
// REMOVED: (added - completed) / original
// This hid scope explosion behind task completion

// NEW FORMULA:
const scope_ratio = current_count / original_count;
const scope_added_ratio = added_count / original_count;

// Thresholds:
// scope_ratio > 1.3  → WARN
// scope_ratio > 1.5  → PAUSE (require acknowledgment)
// scope_ratio > 2.0  → BLOCK (require founder override)

// Progress is tracked SEPARATELY:
const progress = completed_count / current_count;
```

---

## SINGLE-WRITER GUARANTEE

Before spawning an implementation agent:

```javascript
const session = JSON.parse(fs.readFileSync('.claude/session/current.json'));

if (session.locks.current_writer !== null) {
  console.error(`BLOCKED: Implementation agent ${session.locks.current_writer} is already active`);
  console.error("Wait for it to complete or terminate it first");
  return;
}

// Acquire lock
session.locks.current_writer = NEW_AGENT_ID;
fs.writeFileSync('.claude/session/current.json', JSON.stringify(session, null, 2));
```

After agent completes:

```javascript
session.locks.current_writer = null;
fs.writeFileSync('.claude/session/current.json', JSON.stringify(session, null, 2));
```

---

## GOLDEN RULES v2.1

1. **Contracts before code** - No implementation without wiring contract
2. **No git diff inference** - Contracts are the source of truth
3. **Scope ratio is king** - Not completion-adjusted drift
4. **One writer at a time** - Parallel edits impossible
5. **Abort on ambiguity** - If contracts unclear, don't start
6. **Environment from config** - No hardcoded URLs
7. **Notion required** - Silent skip is not allowed
