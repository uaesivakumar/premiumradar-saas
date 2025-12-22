# PremiumRadar Sub-Agent Execution Architecture

**Version:** 2.1 - Contract-Based Verification
**Status:** IMPLEMENTED - Awaiting Pilot Test

---

## Changes from v2.0 (Founder-Mandated Corrections)

| Issue | v2.0 | v2.1 |
|-------|------|------|
| Wiring detection | git diff inference | Feature Wiring Contracts |
| Drift formula | `(added-completed)/original` | `current_count/original_count` |
| DOM verification | String grep ("SIVA", etc.) | Route/health checks |
| Hardcoded URLs | Yes | Read from session.environment |
| Notion failure | Silent skip | Explicit FAIL |
| Staging/Prod deploy | Same level | Split (auto vs approve) |
| WebFetch domains | Broad | Narrowed to exact |
| Single writer | Mentioned | Implemented in locks |

---

## Architecture Overview v2.1

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      /start (Orchestrator)                               │
│  1. Initialize session state                                             │
│  2. Load environment config (no hardcoded URLs)                          │
│  3. Verify Notion (FAIL if unavailable)                                  │
│  4. Fetch sprint features                                                │
│  5. GENERATE FEATURE WIRING CONTRACTS ← MANDATORY                        │
│  6. Display contracts for founder review                                 │
│  7. Persist contracts to session                                         │
│  8. Create todos (scope_ratio tracking)                                  │
│  9. Acquire single-writer lock                                           │
└─────────────────────────────────────────────────────────────────────────┘
         │
         │  Implementation Phase (single writer only)
         │
         ├──→ Task(Explore) - Read-only research
         │
         ├──→ Task(Plan) - Architecture decisions
         │
         └──→ Task(general-purpose) - Implementation
                    │
                    │  Each feature todo references contract
                    │
         ┌──────────┴──────────┐
         │                     │
         ↓                     ↓
┌─────────────────────┐  ┌─────────────────────┐
│    /integrator       │  │       /qa           │
│  Contract-based      │  │  Route/health based │
│  Runtime proof       │  │  No DOM strings     │
│  No git diff         │  │  Environment config │
│  MUST PASS           │  │  Notion required    │
└─────────────────────┘  └─────────────────────┘
         │                     │
         └──────────┬──────────┘
                    │
                    ↓
              CERTIFICATION
```

---

## Feature Wiring Contract (Core Concept)

**Problem Solved:** git diff catches new files only, misses 80% of wiring edits.

**Solution:** Explicit contract per feature, defined at /start, verified at /integrator.

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
        "required_fields": ["theme"]
      }
    }
  ],
  "test_ids": [
    {
      "file": "tests/api/preferences.test.ts",
      "test_name": "should update theme preference"
    }
  ],
  "staging_verification_steps": [
    {
      "type": "http_status",
      "target": "/api/user/preferences",
      "expected": { "status": 401 }
    }
  ]
}
```

---

## Drift Calculation (Corrected)

**Old (flawed):**
```
drift = (added - completed) / original
```
This hid scope explosion behind task completion.

**New (correct):**
```
scope_ratio = current_count / original_count
scope_added_ratio = added_count / original_count

Thresholds:
  scope_ratio > 1.3 → WARN
  scope_ratio > 1.5 → PAUSE
  scope_ratio > 2.0 → BLOCK
```

Progress tracked separately:
```
progress = completed_count / current_count
```

---

## Single-Writer Guarantee

Only ONE implementation agent at a time.

```json
{
  "locks": {
    "max_concurrent_writers": 1,
    "current_writer": "agent-uuid-here",
    "active_locks": []
  }
}
```

Before spawning implementation agent:
```javascript
if (session.locks.current_writer !== null) {
  throw new Error("Another implementation agent is active");
}
session.locks.current_writer = NEW_AGENT_ID;
```

---

## Environment Configuration

**No hardcoded URLs.** Read from session.environment:

```json
{
  "environment": {
    "staging_base_url": "https://upr.sivakumar.ai",
    "staging_service_name": "premiumradar-saas-staging",
    "os_service_name": "upr-os-service",
    "health_endpoint": "/api/health",
    "diag_endpoint": "/__diag",
    "notion_available": true,
    "notion_error": null
  }
}
```

---

## Permission Split (Staging vs Prod)

| Environment | Level | Approval |
|-------------|-------|----------|
| Staging | 0 | Auto-approved |
| Production | 1 | Approve once per session |

Detection: Service name without "staging" = production.

---

## Verification Model

### /integrator - Contract Verification

For each feature contract:
1. **UI exists** - File path found
2. **UI renders** - Staging URL returns 2xx/3xx
3. **API responds** - Endpoints return expected status
4. **Tests pass** - Named tests execute and pass
5. **Staging works** - Verification steps succeed

**NO git diff. NO grep patterns.**

### /qa - Route/Health Verification

- Health endpoint returns 200
- Critical routes return 2xx/3xx/401
- Cloud Run services healthy
- Notion connected (explicit fail if not)

**NO DOM string checks.**

---

## Session State Schema

Key fields in `.claude/session/current.json`:

```json
{
  "session_id": "uuid",
  "sprint": "S48",
  "goal": "IMMUTABLE",

  "environment": { "staging_base_url": "...", "notion_available": true },

  "todos": {
    "original_count": 9,
    "current_count": 11,
    "scope_ratio": 1.22,
    "drift_status": "on_track"
  },

  "feature_contracts": [ ... ],

  "integration": {
    "contracts_defined": true,
    "verified": false,
    "contracts_verified_count": 0
  },

  "locks": {
    "current_writer": null,
    "max_concurrent_writers": 1
  },

  "permissions": {
    "staging_deploy_approved": true,
    "prod_deploy_approved": false
  }
}
```

---

## Command Reference

| Command | Purpose | Key Change in v2.1 |
|---------|---------|-------------------|
| /start | Initialize sprint | Generates Feature Wiring Contracts |
| /integrator | Verify wiring | Contract-based, no git diff |
| /qa | Certify sprint | Route/health checks, no DOM strings |
| /status | Check progress | scope_ratio instead of drift |

---

## Files Created/Updated

| File | Version | Purpose |
|------|---------|---------|
| `.claude/commands/start.v2.md` | 2.1 | Orchestrator with contracts |
| `.claude/commands/integrator.md` | 2.1 | Contract-based verification |
| `.claude/commands/qa.v2.md` | 2.1 | Route/health verification |
| `.claude/commands/status.v2.md` | 2.0 | Drift detection |
| `.claude/session/schema.json` | 2.1 | Session state schema |
| `.claude/PERMISSION_PATTERNS.md` | 2.1 | Staging/prod split |
| `.claude/GOVERNANCE_RULES.md` | 2.0 | Execution rules |

---

## Risks That Remain

| Risk | Mitigation |
|------|------------|
| Contract definition is manual | TC must define at /start, founder reviews |
| Runtime tests slow | Cache where possible, parallelize |
| Test name matching fragile | Exact string match required |
| Session state corruption | Validate on load, abort if invalid |

---

## Activation Checklist

- [x] Feature Wiring Contract schema implemented
- [x] git diff removed as primary signal
- [x] Drift formula corrected to scope_ratio
- [x] /start generates contracts before implementation
- [x] /integrator uses runtime proof
- [x] /qa reads from environment config
- [x] DOM string checks removed
- [x] Permission patterns split staging/prod
- [x] Single-writer guarantee implemented
- [x] **Pilot test on one feature** ← COMPLETED 2025-12-21

---

## Pilot Test Protocol

~~Before activating v2:~~

~~1. Pick a small feature (1-2 files)~~
~~2. Run `/start` with contract generation~~
~~3. Implement the feature~~
~~4. Run `/integrator` - verify contract checks~~
~~5. Run `/qa` - verify route/health checks~~
~~6. Report results~~

~~**Do NOT activate v2 files until pilot passes.**~~

### PILOT COMPLETED: 2025-12-21

**Pilot:** `saas_deal_evaluation` vertical with `skeptical_cfo` persona

**Results:**
- 6 Feature Wiring Contracts defined
- All endpoints implemented and verified
- Deterministic output confirmed (5 identical calls = 5 identical results)
- Edge cases applied from persona policy
- No banking logic leakage
- Entity type `deal` correctly used (not `company`)

**Report:** `.claude/session/pilot-001-report.md`

**Status:** v2.1 READY FOR ACTIVATION

---

**Document Owner:** TC (Claude Code Execution Layer)
**Last Updated:** 2025-12-21
