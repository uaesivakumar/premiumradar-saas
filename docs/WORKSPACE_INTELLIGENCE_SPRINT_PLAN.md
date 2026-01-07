# WORKSPACE INTELLIGENCE FRAMEWORK
## Sprint Execution Plan v1.0

**Created:** 2026-01-06
**Status:** AWAITING FOUNDER APPROVAL
**Reference:** `docs/WORKSPACE_INTELLIGENCE_AUDIT_REPORT.md`
**Starting Sprint:** S350

---

## EXECUTION SUMMARY

| Phase | Sprints | Focus | Weeks |
|-------|---------|-------|-------|
| 1 | S350-S352 | Safety & Stability Foundation | 2 |
| 2 | S353-S355 | Memory Persistence & Fingerprinting | 2 |
| 3 | S356-S358 | Learning Loop Closure | 2 |
| 4 | S359-S361 | Single NBA Enforcement + NOW Surface | 2 |
| 5 | S362-S364 | Enterprise Lead Distribution | 2 |
| 6 | S365-S367 | Individual Lead Intake | 2 |

**Total Sprints:** 18
**Total Estimated Duration:** 12 weeks
**Repo:** SaaS Frontend (primary), OS (supporting)

---

# PHASE 1: SAFETY & STABILITY FOUNDATION

## S350: Security Hole Remediation & Auth Enforcement

### A. Sprint Objective
All API endpoints require authentication. Zero unauthenticated access paths exist.

### B. Scope

**Included:**
- Fix `/api/os/pipeline` missing auth
- Audit all 146 API routes for auth gaps
- Add VS1 auth gate to all unprotected endpoints
- Document auth enforcement policy

**Excluded:**
- Rate limiting (S351)
- Error logging (S352)
- Frontend changes

### C. Technical Work Items

**Backend:**
- Add `getServerSession()` to `/api/os/pipeline/route.ts`
- Create `lib/middleware/auth-gate.ts` reusable middleware
- Scan and fix all `/api/superadmin/*` routes
- Scan and fix all `/api/enterprise/*` routes

**Infra (GCP):**
- Enable Cloud Audit Logs for all API access
- Configure IAM alerting for unauthorized attempts

**Wiring:**
- None (auth layer only)

### D. Validation & Testing

**Automated Checks:**
- `tests/security/auth-enforcement.test.ts` - Test all 146 routes require auth
- CI job: `npm run test:auth` runs on every PR

**Smoke Tests:**
- Curl each protected endpoint without auth → expect 401
- Curl with valid session → expect 200

**Failure Simulations:**
- Expired token → expect redirect to login
- Invalid token → expect 401
- Missing session → expect 401

### E. Acceptance Criteria (Binary)

| Criteria | Pass/Fail |
|----------|-----------|
| All 146 routes have auth check | PASS/FAIL |
| `/api/os/pipeline` returns 401 without auth | PASS/FAIL |
| Auth test suite passes (100% coverage) | PASS/FAIL |
| Zero unauthenticated curl requests succeed | PASS/FAIL |

### F. Rollback / Safety

**Failure Detection:**
- Any endpoint returns 200 without auth → test fails
- Cloud Audit Logs show unauthorized access

**Safety:**
- Auth middleware is additive (doesn't break existing auth)
- Rollback: Remove middleware file, revert route changes

---

## S351: Rate Limiting Enforcement

### A. Sprint Objective
All high-value API endpoints enforce rate limits. Abuse is blocked automatically.

### B. Scope

**Included:**
- Wire existing rate limiter to all API routes
- Move rate limit store from in-memory to Cloud Memorystore (Redis)
- Configure per-endpoint limits
- Add rate limit headers to responses

**Excluded:**
- Cost tracking (S352)
- Frontend changes
- Alert configuration

### C. Technical Work Items

**Backend:**
- Create `lib/middleware/rate-limit.ts` middleware
- Migrate `lib/tenant/rate-limiter.ts` to Redis
- Add rate limiting to:
  - `/api/os/discovery` (10 req/min)
  - `/api/os/score` (30 req/min)
  - `/api/os/outreach` (20 req/min)
  - `/api/auth/*` (5 req/min for login attempts)
  - `/api/superadmin/*` (100 req/min)

**Infra (GCP):**
- Provision Cloud Memorystore (Redis) instance
- Configure connection from Cloud Run
- Set up Redis monitoring dashboard

**Wiring:**
- Add middleware to Next.js middleware chain
- Configure environment variable `REDIS_URL`

### D. Validation & Testing

**Automated Checks:**
- `tests/security/rate-limiting.test.ts` - Test limits enforced
- Redis connection health check on startup

**Smoke Tests:**
- Exceed limit → expect 429 Too Many Requests
- Within limit → expect 200

**Stress Tests:**
- 100 concurrent requests to `/api/os/discovery`
- Verify only first 10 succeed in window

**Failure Simulations:**
- Redis unavailable → fallback to in-memory with warning log
- Redis timeout → request proceeds with warning

### E. Acceptance Criteria (Binary)

| Criteria | Pass/Fail |
|----------|-----------|
| Rate limiter uses Redis | PASS/FAIL |
| Discovery endpoint blocks at 11th request | PASS/FAIL |
| 429 response includes retry-after header | PASS/FAIL |
| Redis fallback works when unavailable | PASS/FAIL |

### F. Rollback / Safety

**Failure Detection:**
- Redis health check fails → alert
- Rate limit not enforced → test fails

**Safety:**
- Fallback to in-memory if Redis unavailable
- Rollback: Disable middleware, revert to in-memory

---

## S352: Silent Failure Elimination & Error Logging

### A. Sprint Objective
All errors are logged. Zero silent failures. Cost anomalies trigger alerts.

### B. Scope

**Included:**
- Fix all empty `catch {}` blocks
- Add structured logging to all error paths
- Configure GCP Error Reporting
- Add cost tracking alerts (BigQuery + Monitoring)
- Create error dashboard

**Excluded:**
- Memory persistence (Phase 2)
- Learning loop (Phase 3)

### C. Technical Work Items

**Backend:**
- Fix `/api/superadmin/ai-query/route.ts` empty catches (lines 636, 682)
- Fix `/lib/costs/api-costs.ts` silent failures
- Fix `/api/waitlist/route.ts` silent analytics
- Create `lib/logging/structured-logger.ts`
- Add error context to all catch blocks

**Infra (GCP):**
- Enable Error Reporting API
- Configure Cloud Logging sink to BigQuery
- Create Monitoring alert policies:
  - API cost > $10/hour
  - Error rate > 5%
  - 5xx responses > 1%

**Wiring:**
- Integrate logger with all API routes
- Add request ID tracking

### D. Validation & Testing

**Automated Checks:**
- `tests/safety/no-silent-failures.test.ts` - Grep for empty catch
- ESLint rule: `no-empty` enabled

**Smoke Tests:**
- Force cost query failure → verify log entry created
- Force analytics failure → verify log entry created

**Failure Simulations:**
- Database connection failure → verify error logged
- External API timeout → verify error logged with context

### E. Acceptance Criteria (Binary)

| Criteria | Pass/Fail |
|----------|-----------|
| Zero empty catch blocks in codebase | PASS/FAIL |
| Cost failures create log entries | PASS/FAIL |
| Error Reporting shows all errors | PASS/FAIL |
| Cost alert fires at $10/hour | PASS/FAIL |

### F. Rollback / Safety

**Failure Detection:**
- Error Reporting shows no errors → logging broken
- Silent failure found → test fails

**Safety:**
- Logging is additive
- Rollback: Revert catch block changes

---

# PHASE 2: MEMORY PERSISTENCE & FINGERPRINTING

## S353: Persistent Memory Store Foundation

### A. Sprint Objective
System state survives server restarts. All caches persist to database.

### B. Scope

**Included:**
- Create `memory_store` database table
- Migrate vertical config cache to persistent store
- Migrate evidence cache to persistent store
- Add TTL-based expiration

**Excluded:**
- Fingerprinting (S354)
- Historical recall (S355)
- Redis migration (done in S351)

### C. Technical Work Items

**Backend:**
- Create migration: `prisma/migrations/S353_memory_store.sql`
  ```sql
  CREATE TABLE memory_store (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    store_key VARCHAR(255) NOT NULL,
    store_value JSONB NOT NULL,
    ttl_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(tenant_id, store_key)
  );
  CREATE INDEX idx_memory_store_expires ON memory_store(expires_at);
  ```
- Create `lib/memory/persistent-store.ts`
- Migrate `lib/admin/vertical-config-service.ts`
- Migrate `lib/stores/evidence-store.ts`
- Add cleanup job for expired entries

**Infra (GCP):**
- Cloud Scheduler job for TTL cleanup (hourly)

**Wiring:**
- Replace in-memory Map with PersistentStore
- Add fallback to in-memory on DB failure

### D. Validation & Testing

**Automated Checks:**
- `tests/memory/persistence.test.ts` - Data survives restart
- `tests/memory/ttl-expiration.test.ts` - Expired data removed

**Smoke Tests:**
- Store value → restart server → retrieve value
- Store with 1s TTL → wait 2s → verify deleted

**Failure Simulations:**
- DB unavailable → fallback to in-memory
- Write failure → log error, return stale value

### E. Acceptance Criteria (Binary)

| Criteria | Pass/Fail |
|----------|-----------|
| memory_store table exists | PASS/FAIL |
| Vertical config survives restart | PASS/FAIL |
| Evidence cache survives restart | PASS/FAIL |
| TTL cleanup runs hourly | PASS/FAIL |

### F. Rollback / Safety

**Failure Detection:**
- Cache miss rate increases → alert
- DB write failures → log

**Safety:**
- Fallback to in-memory
- Rollback: Revert to in-memory only

---

## S354: Request Fingerprinting Engine

### A. Sprint Objective
System can detect duplicate/similar actions using salted fingerprints.

### B. Scope

**Included:**
- Create fingerprint generation algorithm
- Store fingerprints in database
- Detect "exact same request" duplicates
- Detect "similar action" patterns

**Excluded:**
- Historical recall UI (S355)
- Learning loop (Phase 3)

### C. Technical Work Items

**Backend:**
- Create `lib/memory/fingerprint-engine.ts`
  ```typescript
  interface Fingerprint {
    hash: string;          // SHA-256 salted hash
    action_type: string;   // discovery, enrichment, outreach
    entity_type: string;   // company, individual
    entity_id?: string;
    created_at: Date;
    user_id: string;
    tenant_id: string;
  }
  ```
- Create migration: `prisma/migrations/S354_fingerprints.sql`
  ```sql
  CREATE TABLE action_fingerprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    fingerprint_hash VARCHAR(64) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    INDEX idx_fingerprint_lookup (tenant_id, fingerprint_hash)
  );
  ```
- Create `lib/memory/similarity-detector.ts`
- Integrate with `/api/os/discovery`, `/api/os/outreach`

**Infra:**
- None (database only)

**Wiring:**
- Add fingerprint check before API calls
- Store fingerprint after successful calls

### D. Validation & Testing

**Automated Checks:**
- `tests/memory/fingerprinting.test.ts`
- `tests/memory/similarity.test.ts`

**Smoke Tests:**
- Same discovery request twice → second returns "similar action" warning
- Different request → no warning

**Failure Simulations:**
- Fingerprint store failure → proceed without dedup

### E. Acceptance Criteria (Binary)

| Criteria | Pass/Fail |
|----------|-----------|
| Fingerprint table exists | PASS/FAIL |
| Same request detected as duplicate | PASS/FAIL |
| Different request passes | PASS/FAIL |
| Fingerprints never exposed in logs/UI | PASS/FAIL |

### F. Rollback / Safety

**Failure Detection:**
- High duplicate rate → alert
- Fingerprint failures → log

**Safety:**
- Fingerprinting is advisory, not blocking
- Rollback: Disable fingerprint checks

---

## S355: Historical Action Recall

### A. Sprint Objective
Users are informed when they attempt actions similar to past actions.

### B. Scope

**Included:**
- Query historical actions by similarity
- Return advisory messages for similar actions
- UI display of historical context
- "Proceed anyway" option

**Excluded:**
- Blocking duplicate actions (advisory only)
- Learning from outcomes (Phase 3)

### C. Technical Work Items

**Backend:**
- Create `lib/memory/action-history.ts`
  ```typescript
  interface ActionRecall {
    similar_action_found: boolean;
    previous_action_date: Date;
    previous_action_status: 'completed' | 'partial' | 'no_action';
    message: string;
    allow_proceed: boolean;
  }
  ```
- Add recall check to `/api/os/discovery`, `/api/os/outreach`
- Return recall data in API responses

**Frontend:**
- Create `components/workspace/HistoricalRecallBanner.tsx`
- Display advisory message with previous action date
- Add "Proceed Anyway" button

**Wiring:**
- Wire recall banner to discovery/outreach flows

### D. Validation & Testing

**Automated Checks:**
- `tests/memory/historical-recall.test.ts`
- `tests/ui/recall-banner.test.tsx`

**Smoke Tests:**
- Enrich company X → wait → enrich company X again → see recall banner
- New company → no banner

### E. Acceptance Criteria (Binary)

| Criteria | Pass/Fail |
|----------|-----------|
| Similar action returns recall message | PASS/FAIL |
| Recall banner displays in UI | PASS/FAIL |
| "Proceed Anyway" works | PASS/FAIL |
| No false positives for different actions | PASS/FAIL |

### F. Rollback / Safety

**Failure Detection:**
- Recall check fails → proceed without banner

**Safety:**
- Advisory only, never blocks
- Rollback: Hide banner, disable recall check

---

# PHASE 3: LEARNING LOOP CLOSURE

## S356: Event Consumption Pipeline

### A. Sprint Objective
BTE events are consumed in real-time and available for processing.

### B. Scope

**Included:**
- Set up Cloud Pub/Sub topic for BTE events
- Create event consumer service
- Store processed events for analysis
- Real-time event dashboard

**Excluded:**
- Confidence updates (S357)
- Cache decay (S358)

### C. Technical Work Items

**Backend:**
- Create `lib/events/event-consumer.ts`
- Configure Pub/Sub topic: `bte-events`
- Create Cloud Function: `process-bte-event`
- Store events in BigQuery for analysis

**Infra (GCP):**
- Cloud Pub/Sub topic + subscription
- Cloud Function (Python/Node)
- BigQuery dataset: `bte_events`
- Cloud Monitoring dashboard

**Wiring:**
- Emit events from BTE to Pub/Sub
- Consumer writes to BigQuery

### D. Validation & Testing

**Automated Checks:**
- `tests/events/pubsub-integration.test.ts`
- Event schema validation

**Smoke Tests:**
- Emit test event → verify arrives in BigQuery
- Verify latency < 5 seconds

**Stress Tests:**
- 1000 events/second → no message loss

### E. Acceptance Criteria (Binary)

| Criteria | Pass/Fail |
|----------|-----------|
| Pub/Sub topic exists and active | PASS/FAIL |
| Events appear in BigQuery within 5s | PASS/FAIL |
| No message loss under load | PASS/FAIL |
| Dashboard shows real-time events | PASS/FAIL |

### F. Rollback / Safety

**Failure Detection:**
- Dead letter queue fills → alert
- Latency > 30s → alert

**Safety:**
- Events buffered if consumer down
- Rollback: Disable Pub/Sub emission

---

## S357: Confidence Update Engine

### A. Sprint Objective
Event outcomes automatically update confidence scores.

### B. Scope

**Included:**
- Define confidence update rules
- Process success/failure events
- Update cached confidence values
- Track confidence history

**Excluded:**
- Cache decay (S358)
- UI display (Phase 4)

### C. Technical Work Items

**Backend:**
- Create `lib/intelligence/confidence-engine.ts`
  ```typescript
  interface ConfidenceUpdate {
    entity_id: string;
    event_type: 'success' | 'failure' | 'bounce' | 'open';
    confidence_delta: number;  // -0.1 to +0.1
    reason: string;
    new_confidence: number;
  }
  ```
- Create migration: `prisma/migrations/S357_confidence_tracking.sql`
  ```sql
  CREATE TABLE confidence_scores (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    confidence DECIMAL(5,4) NOT NULL,  -- 0.0000 to 1.0000
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    history JSONB DEFAULT '[]',
    UNIQUE(tenant_id, entity_type, entity_id)
  );
  ```
- Create Cloud Function: `update-confidence`
- Wire to Pub/Sub consumer

**Infra (GCP):**
- Cloud Function triggered by Pub/Sub

### D. Validation & Testing

**Automated Checks:**
- `tests/intelligence/confidence-updates.test.ts`
- Confidence never exceeds 0-1 bounds

**Smoke Tests:**
- Success event → confidence increases
- Failure event → confidence decreases

**Simulations:**
- 10 successes → confidence near 1.0
- 10 failures → confidence near 0.0

### E. Acceptance Criteria (Binary)

| Criteria | Pass/Fail |
|----------|-----------|
| Success events increase confidence | PASS/FAIL |
| Failure events decrease confidence | PASS/FAIL |
| Confidence stays within 0-1 | PASS/FAIL |
| History tracked per entity | PASS/FAIL |

### F. Rollback / Safety

**Failure Detection:**
- Confidence update failures → log + alert

**Safety:**
- Updates are idempotent
- Rollback: Disable confidence updates

---

## S358: Cache Decay & Self-Correction

### A. Sprint Objective
Stale cached data automatically decays. Bounced emails invalidate patterns.

### B. Scope

**Included:**
- Implement age-based confidence decay
- Email bounce → pattern invalidation
- Stale data warnings in API responses
- Automatic refresh triggers

**Excluded:**
- UI display (Phase 4)

### C. Technical Work Items

**Backend:**
- Create `lib/memory/decay-engine.ts`
  ```typescript
  const DECAY_RULES = {
    email_pattern: { halfLife: 30 * 24 * 60 * 60 * 1000 },  // 30 days
    company_data: { halfLife: 7 * 24 * 60 * 60 * 1000 },   // 7 days
    contact_data: { halfLife: 14 * 24 * 60 * 60 * 1000 },  // 14 days
  };
  ```
- Create Cloud Scheduler job: decay-confidence (daily)
- Wire bounce events to pattern invalidation
- Add freshness warnings to API responses

**Infra (GCP):**
- Cloud Scheduler for daily decay job

### D. Validation & Testing

**Automated Checks:**
- `tests/memory/decay-engine.test.ts`
- Decay calculation correctness

**Smoke Tests:**
- 30-day old pattern → confidence halved
- Bounce event → pattern confidence = 0

**Simulations:**
- Simulate 90 days → pattern nearly expired

### E. Acceptance Criteria (Binary)

| Criteria | Pass/Fail |
|----------|-----------|
| 30-day old patterns decay by 50% | PASS/FAIL |
| Bounce events zero out pattern | PASS/FAIL |
| Daily decay job runs | PASS/FAIL |
| Stale warnings in API responses | PASS/FAIL |

### F. Rollback / Safety

**Failure Detection:**
- Decay job failures → alert

**Safety:**
- Decay is gradual, never instant zero
- Rollback: Disable decay job

---

# PHASE 4: SINGLE NBA ENFORCEMENT + NOW SURFACE

## S359: Single NBA Rule Engine

### A. Sprint Objective
At any moment, exactly ONE next best action exists. Multiple NBAs are eliminated.

### B. Scope

**Included:**
- Create NBA selection algorithm
- Enforce single NBA per context
- Remove multiple recommendation displays
- Add NBA conflict resolution

**Excluded:**
- NOW panel UI (S360)
- User maturity (S361)

### C. Technical Work Items

**Backend:**
- Create `lib/nba/single-nba-engine.ts`
  ```typescript
  interface SingleNBA {
    action_id: string;
    action_type: 'call' | 'email' | 'research' | 'wait';
    target_entity_id: string;
    target_entity_name: string;
    reason: string;
    confidence: number;
    timing: { suggested: string; deadline?: Date };
    alternatives_count: number;  // How many were deprioritized
  }
  ```
- Modify `/api/os/intelligence/session` to return single NBA
- Add `getNBA()` function to SIVA store
- Remove multi-recommendation endpoints

**Wiring:**
- Update SIVA store to enforce single NBA
- Deprecate `getRecommendations()` (returns array)

### D. Validation & Testing

**Automated Checks:**
- `tests/nba/single-nba-rule.test.ts`
- `tests/nba/conflict-resolution.test.ts`

**Smoke Tests:**
- 10 opportunities → exactly 1 NBA returned
- NBA changes only when context changes

**Conflict Tests:**
- Two equal-priority actions → deterministic selection

### E. Acceptance Criteria (Binary)

| Criteria | Pass/Fail |
|----------|-----------|
| API returns exactly 1 NBA | PASS/FAIL |
| No multi-recommendation arrays | PASS/FAIL |
| NBA selection is deterministic | PASS/FAIL |
| Confidence score included | PASS/FAIL |

### F. Rollback / Safety

**Failure Detection:**
- Multiple NBAs returned → test fails

**Safety:**
- Fallback: Return highest-confidence action
- Rollback: Re-enable multi-recommendation

---

## S360: NOW Panel Implementation

### A. Sprint Objective
Users see a prominent NOW panel with their single next best action.

### B. Scope

**Included:**
- Create NOW panel component
- Wire to single NBA engine
- Add action execution flow
- Add defer/dismiss options

**Excluded:**
- User maturity gating (S361)
- Analytics

### C. Technical Work Items

**Frontend:**
- Create `components/workspace/NOWPanel.tsx`
  ```typescript
  interface NOWPanelProps {
    nba: SingleNBA;
    onExecute: () => void;
    onDefer: (reason: string) => void;
    onDismiss: () => void;
  }
  ```
- Style: Prominent, cannot be ignored, but dismissable
- Add to dashboard layout (above fold)

**Backend:**
- Create `/api/workspace/now` endpoint
- Wire defer/dismiss to event logging

**Wiring:**
- NOW panel fetches from `/api/workspace/now`
- Actions trigger appropriate flows

### D. Validation & Testing

**Automated Checks:**
- `tests/ui/now-panel.test.tsx`
- `tests/e2e/now-panel.spec.ts`

**Smoke Tests:**
- Dashboard load → NOW panel visible
- Execute action → flow completes
- Defer action → logs event, hides panel

### E. Acceptance Criteria (Binary)

| Criteria | Pass/Fail |
|----------|-----------|
| NOW panel renders on dashboard | PASS/FAIL |
| Single NBA displayed | PASS/FAIL |
| Execute triggers correct flow | PASS/FAIL |
| Defer/dismiss work correctly | PASS/FAIL |

### F. Rollback / Safety

**Failure Detection:**
- NOW panel fails to load → show fallback

**Safety:**
- Graceful degradation to list view
- Rollback: Hide NOW panel, show discovery

---

## S361: User Maturity Gating

### A. Sprint Objective
NBA prominence adapts based on user maturity (login count, engagement).

### B. Scope

**Included:**
- Track user login count
- Calculate maturity score
- Gate NOW panel by maturity
- Progressive disclosure of features

**Excluded:**
- Pattern reflections (future)
- Coaching mode (future)

### C. Technical Work Items

**Backend:**
- Create migration: `prisma/migrations/S361_user_maturity.sql`
  ```sql
  ALTER TABLE users ADD COLUMN login_count INTEGER DEFAULT 0;
  ALTER TABLE users ADD COLUMN maturity_score DECIMAL(3,2) DEFAULT 0.00;
  ALTER TABLE users ADD COLUMN first_login_at TIMESTAMPTZ;
  ALTER TABLE users ADD COLUMN last_login_at TIMESTAMPTZ;
  ```
- Create `lib/user/maturity-engine.ts`
- Update login handler to track logins

**Frontend:**
- Conditional NOW panel visibility:
  - Login 1-4: No NOW panel
  - Login 5-19: Soft NOW panel (dismissable)
  - Login 20+: Prominent NOW panel

### D. Validation & Testing

**Automated Checks:**
- `tests/user/maturity-tracking.test.ts`
- `tests/user/maturity-gating.test.ts`

**Smoke Tests:**
- New user → no NOW panel
- User with 20 logins → NOW panel visible

### E. Acceptance Criteria (Binary)

| Criteria | Pass/Fail |
|----------|-----------|
| Login count tracked | PASS/FAIL |
| Maturity score calculated | PASS/FAIL |
| NOW panel gated by maturity | PASS/FAIL |
| Progressive disclosure works | PASS/FAIL |

### F. Rollback / Safety

**Failure Detection:**
- Maturity calculation fails → default to visible

**Safety:**
- Fail-open: Show NOW panel if maturity unknown
- Rollback: Disable maturity gating

---

# PHASE 5: ENTERPRISE LEAD DISTRIBUTION

## S362: Lead Assignment Data Model

### A. Sprint Objective
Database supports lead assignment to users within enterprises.

### B. Scope

**Included:**
- Create leads table
- Create lead_assignments table
- Create assignment rules table
- Basic CRUD APIs

**Excluded:**
- Distribution algorithms (S363)
- Load balancing (S364)

### C. Technical Work Items

**Backend:**
- Create migration: `prisma/migrations/S362_lead_distribution.sql`
  ```sql
  CREATE TABLE leads (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    enterprise_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    entity_name VARCHAR(255),
    source VARCHAR(100),
    status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE lead_assignments (
    id UUID PRIMARY KEY,
    lead_id UUID REFERENCES leads(id),
    user_id UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by VARCHAR(50),  -- 'system' | 'admin' | user_id
    status VARCHAR(50) DEFAULT 'active',
    UNIQUE(lead_id, user_id)
  );

  CREATE TABLE assignment_rules (
    id UUID PRIMARY KEY,
    enterprise_id UUID NOT NULL,
    rule_type VARCHAR(50),  -- 'round_robin' | 'load_balanced' | 'region' | 'role'
    config JSONB,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
  );
  ```
- Create `lib/distribution/lead-store.ts`
- Create `/api/enterprise/leads/*` endpoints

### D. Validation & Testing

**Automated Checks:**
- `tests/distribution/data-model.test.ts`
- `tests/api/leads-crud.test.ts`

**Smoke Tests:**
- Create lead → verify in database
- Assign lead → verify assignment record

### E. Acceptance Criteria (Binary)

| Criteria | Pass/Fail |
|----------|-----------|
| Leads table exists | PASS/FAIL |
| Assignments table exists | PASS/FAIL |
| CRUD APIs functional | PASS/FAIL |
| Unique constraint prevents double assignment | PASS/FAIL |

### F. Rollback / Safety

**Failure Detection:**
- Migration fails → alert

**Safety:**
- New tables, no existing data affected
- Rollback: Drop tables

---

## S363: Distribution Algorithms

### A. Sprint Objective
Leads are automatically distributed using configurable algorithms.

### B. Scope

**Included:**
- Round-robin distribution
- Region-based routing
- Role-based routing
- Manual override support

**Excluded:**
- Load balancing (S364)
- Collision prevention (S364)

### C. Technical Work Items

**Backend:**
- Create `lib/distribution/algorithms/round-robin.ts`
- Create `lib/distribution/algorithms/region-based.ts`
- Create `lib/distribution/algorithms/role-based.ts`
- Create `lib/distribution/distributor.ts` (orchestrator)
- Create `/api/enterprise/distribution/assign` endpoint

### D. Validation & Testing

**Automated Checks:**
- `tests/distribution/round-robin.test.ts`
- `tests/distribution/region-based.test.ts`
- `tests/distribution/role-based.test.ts`

**Smoke Tests:**
- 10 leads, 5 users → 2 leads each (round-robin)
- UAE lead → assigned to UAE user

**Simulations:**
- 100 leads, 10 users → fair distribution

### E. Acceptance Criteria (Binary)

| Criteria | Pass/Fail |
|----------|-----------|
| Round-robin distributes evenly | PASS/FAIL |
| Region routing respects geography | PASS/FAIL |
| Role routing respects specialization | PASS/FAIL |
| Manual override works | PASS/FAIL |

### F. Rollback / Safety

**Failure Detection:**
- Distribution failure → log + manual queue

**Safety:**
- Fallback: Random assignment if algorithm fails
- Rollback: Disable auto-distribution

---

## S364: Load Balancing & Collision Prevention

### A. Sprint Objective
Distribution considers user workload. Same lead never assigned to multiple users.

### B. Scope

**Included:**
- User workload tracking
- Density-aware distribution
- Collision detection & prevention
- Fairness metrics

**Excluded:**
- Individual intake (Phase 6)

### C. Technical Work Items

**Backend:**
- Create `lib/distribution/workload-tracker.ts`
  ```typescript
  interface UserWorkload {
    user_id: string;
    active_leads: number;
    completed_today: number;
    avg_completion_time: number;
    capacity_score: number;  // 0-1
  }
  ```
- Add workload check to distributor
- Add collision detection before assignment
- Create workload dashboard data API

**Frontend:**
- Create admin view: Lead distribution dashboard

### D. Validation & Testing

**Automated Checks:**
- `tests/distribution/load-balancing.test.ts`
- `tests/distribution/collision-prevention.test.ts`

**Smoke Tests:**
- Overloaded user → skipped in round-robin
- Same lead assigned twice → second fails with error

**Stress Tests:**
- 1000 leads, 50 users → no collisions
- Rapid assignment → no race conditions

### E. Acceptance Criteria (Binary)

| Criteria | Pass/Fail |
|----------|-----------|
| Workload considered in distribution | PASS/FAIL |
| No double assignments | PASS/FAIL |
| Fairness score > 0.9 | PASS/FAIL |
| Race condition test passes | PASS/FAIL |

### F. Rollback / Safety

**Failure Detection:**
- Collision detected → alert + reject

**Safety:**
- Database constraint prevents double assignment
- Rollback: Disable workload consideration

---

# PHASE 6: INDIVIDUAL LEAD INTAKE

## S365: Intake Endpoint & Normalization

### A. Sprint Objective
Bank-fed individual leads can be ingested via secure API.

### B. Scope

**Included:**
- Create `/api/intake/leads` endpoint
- Input validation
- Field normalization
- Basic deduplication

**Excluded:**
- Tokenization (S366)
- Routing (S367)

### C. Technical Work Items

**Backend:**
- Create `/api/intake/leads/route.ts`
  ```typescript
  interface IndividualLeadInput {
    source_system: string;
    source_id: string;
    full_name: string;
    phone?: string;
    email?: string;
    product_interest: 'personal_loan' | 'home_loan' | 'credit_card';
    metadata?: Record<string, unknown>;
  }
  ```
- Create `lib/intake/normalizer.ts`
  - Phone: E.164 format
  - Email: lowercase, trim
  - Name: title case
- Create `lib/intake/validator.ts`
- Add rate limiting (100 leads/min per source)

### D. Validation & Testing

**Automated Checks:**
- `tests/intake/endpoint.test.ts`
- `tests/intake/normalization.test.ts`

**Smoke Tests:**
- Valid lead → 201 Created
- Invalid phone → 400 Bad Request

**Load Tests:**
- 1000 leads/minute → no failures

### E. Acceptance Criteria (Binary)

| Criteria | Pass/Fail |
|----------|-----------|
| Endpoint accepts valid leads | PASS/FAIL |
| Invalid input rejected with error | PASS/FAIL |
| Phone normalized to E.164 | PASS/FAIL |
| Rate limiting enforced | PASS/FAIL |

### F. Rollback / Safety

**Failure Detection:**
- Ingestion failures → dead letter queue

**Safety:**
- New endpoint, no existing functionality affected
- Rollback: Disable endpoint

---

## S366: Tokenization & Privacy

### A. Sprint Objective
Individual PII is tokenized. No raw PII in logs or analytics.

### B. Scope

**Included:**
- Phone/email tokenization
- Token-to-PII lookup (privileged)
- Audit logging for PII access
- Log scrubbing

**Excluded:**
- Routing (S367)

### C. Technical Work Items

**Backend:**
- Create `lib/intake/tokenizer.ts`
  ```typescript
  interface TokenizedLead {
    id: UUID;
    phone_token: string;  // Salted hash
    email_token: string;  // Salted hash
    // Original PII in separate encrypted store
  }
  ```
- Create migration: `prisma/migrations/S366_pii_vault.sql`
  ```sql
  CREATE TABLE pii_vault (
    token VARCHAR(64) PRIMARY KEY,
    encrypted_value BYTEA NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  -- Encrypted with KMS
  ```
- Create `lib/intake/pii-vault.ts`
- Add audit logging for PII lookups

**Infra (GCP):**
- Cloud KMS key for PII encryption
- Audit log sink for PII access

### D. Validation & Testing

**Automated Checks:**
- `tests/intake/tokenization.test.ts`
- `tests/security/pii-audit.test.ts`

**Smoke Tests:**
- Ingest lead → PII not in logs
- Lookup token → audit log created

### E. Acceptance Criteria (Binary)

| Criteria | Pass/Fail |
|----------|-----------|
| PII tokenized before storage | PASS/FAIL |
| No raw PII in application logs | PASS/FAIL |
| PII lookups create audit trail | PASS/FAIL |
| KMS encryption active | PASS/FAIL |

### F. Rollback / Safety

**Failure Detection:**
- KMS unavailable → reject ingestion

**Safety:**
- Fail-closed: No PII stored without encryption
- Rollback: Disable intake endpoint

---

## S367: Lead Routing & Activation

### A. Sprint Objective
Ingested leads are routed to appropriate workspace and trigger NBA.

### B. Scope

**Included:**
- Product-based routing rules
- Workspace assignment
- NBA trigger on intake
- Lead status tracking

**Excluded:**
- Enrichment (explicitly excluded per framework)

### C. Technical Work Items

**Backend:**
- Create `lib/intake/router.ts`
  ```typescript
  interface RoutingRule {
    product_type: string;
    target_sub_vertical: string;
    target_workspace_id?: string;
    priority: number;
  }
  ```
- Wire intake → lead_assignments
- Wire assignment → NBA generation
- Create `/api/intake/leads/[id]/status` endpoint

**Wiring:**
- Intake → Router → Assignment → NBA Engine

### D. Validation & Testing

**Automated Checks:**
- `tests/intake/routing.test.ts`
- `tests/intake/nba-trigger.test.ts`

**Smoke Tests:**
- Personal loan lead → routes to loan workspace
- Lead routed → NBA generated within 5s

**E2E Tests:**
- Full flow: Intake → Route → Assign → NBA visible

### E. Acceptance Criteria (Binary)

| Criteria | Pass/Fail |
|----------|-----------|
| Leads routed by product type | PASS/FAIL |
| Workspace assignment works | PASS/FAIL |
| NBA generated for new leads | PASS/FAIL |
| Status tracking functional | PASS/FAIL |

### F. Rollback / Safety

**Failure Detection:**
- Routing failures → manual queue

**Safety:**
- Unroutable leads go to manual review queue
- Rollback: Disable auto-routing

---

# GCP SERVICE MAPPING

| Service | Sprint | Purpose | Cost Tier |
|---------|--------|---------|-----------|
| Cloud Memorystore (Redis) | S351 | Rate limiting, caching | Medium |
| Cloud Audit Logs | S350 | Security audit trail | Low |
| Error Reporting | S352 | Error tracking | Low |
| Cloud Logging | S352 | Structured logs | Low |
| Cloud Monitoring | S352, All | Alerting | Low |
| BigQuery | S352, S356 | Analytics, events | Medium |
| Cloud Scheduler | S353, S358 | TTL cleanup, decay | Low |
| Cloud Pub/Sub | S356 | Event streaming | Low |
| Cloud Functions | S356, S357 | Event processing | Low |
| Cloud KMS | S366 | PII encryption | Low |

**Estimated Monthly GCP Cost:** $150-300

---

# RISK REGISTER

| Risk | Phase | Impact | Likelihood | Mitigation |
|------|-------|--------|------------|------------|
| Redis unavailable | 2 | High | Low | In-memory fallback |
| Pub/Sub message loss | 3 | High | Low | Dead letter queue |
| NBA algorithm incorrect | 4 | Medium | Medium | Extensive testing |
| Distribution unfair | 5 | Medium | Medium | Fairness metrics |
| PII leak | 6 | Critical | Low | KMS + audit + scrubbing |
| Phase dependency failure | All | High | Low | Each phase self-validates |

---

# TIMELINE (CONSERVATIVE)

| Phase | Sprints | Duration | Dependencies |
|-------|---------|----------|--------------|
| 1 | S350-S352 | 2 weeks | None |
| 2 | S353-S355 | 2 weeks | Phase 1 complete |
| 3 | S356-S358 | 2 weeks | Phase 2 complete |
| 4 | S359-S361 | 2 weeks | Phase 3 complete |
| 5 | S362-S364 | 2 weeks | Phase 4 complete |
| 6 | S365-S367 | 2 weeks | Phase 5 complete |

**Total:** 12 weeks (3 months)

---

# EXECUTION CHECKLIST

Each sprint completion requires:

- [ ] All acceptance criteria PASS
- [ ] No regressions in existing tests
- [ ] Build passes (`npm run build`)
- [ ] Type check passes (`npx tsc --noEmit`)
- [ ] Security tests pass
- [ ] Performance within bounds
- [ ] Documentation updated
- [ ] Notion status updated

---

## APPROVAL GATE

**This plan is ready for founder review.**

After approval:
1. Sprints will be created in Notion (S350-S367)
2. Features will be created per sprint
3. Execution begins with S350
4. No founder intervention required during execution

**Reply "approved" to proceed with Notion creation.**

---

**End of Sprint Execution Plan**
