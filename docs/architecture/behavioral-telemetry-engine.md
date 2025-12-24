# Behavioral Telemetry Engine (BTE) Architecture

**Version:** 1.0
**Status:** LOCKED
**Last Updated:** 2025-12-24

---

## Purpose

The Behavioral Telemetry Engine (BTE) is a **read-only** intelligence layer that computes behavioral signals from raw event data. It provides context to decision systems (like NBA) without making decisions itself.

---

## Core Principles

### 1. Read-Only Forever
- BTE has **READ-ONLY** database access
- BTE **NEVER** writes to core tables
- BTE **NEVER** calls SIVA runtime
- BTE **NEVER** requires envelopes (explicit S260 exemption)

### 2. Deterministic Computation
- Same events + same thresholds = same signals
- Signals are recomputable from raw events at any time
- No randomness, no external dependencies during computation

### 3. Separation of Concerns
- BTE computes signals
- NBA chooses actions
- BTE influences reasoning, not decisions

---

## Data Foundation (S261)

### business_events Table (Immutable)
```sql
CREATE TABLE business_events (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  sub_vertical_id uuid NOT NULL,
  actor_user_id uuid NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT NOW(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Immutability enforced via trigger
-- NO UPDATES, NO DELETES permitted
```

### user_actions Table
```sql
CREATE TABLE user_actions (
  action_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  workspace_id uuid NOT NULL,
  actor_user_id uuid NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT NOW(),
  metadata jsonb DEFAULT '{}'::jsonb
);
```

### workspace_state Table
```sql
CREATE TABLE workspace_state (
  workspace_id uuid PRIMARY KEY,
  current_sales_stage text,
  pending_actions jsonb DEFAULT '[]'::jsonb,
  last_recommendation_id uuid,
  last_action_taken_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT NOW()
);
```

---

## Signal Types (S262)

### Temporal Signals
| Signal | Description | Formula |
|--------|-------------|---------|
| `decision_latency` | Time between recommendation and action | `action_timestamp - recommendation_timestamp` |
| `idle_decay` | Days since last meaningful action | `NOW() - last_action_taken_at` |
| `momentum` | Actions per time period trend | `actions_this_week / actions_last_week` |
| `execution_consistency` | Variance in action timing | `stddev(decision_latency) over 30 days` |

### Execution Signals
| Signal | Description | Formula |
|--------|-------------|---------|
| `nba_adoption_rate` | % of recommendations acted upon | `actions_taken / recommendations_given` |
| `follow_through_rate` | % of started workflows completed | `completed_flows / started_flows` |
| `drop_off_point` | Stage where users abandon most | `mode(abandoned_stage)` |
| `hesitation_index` | Revisits before action | `page_views_before_action / expected_views` |

### Counterfactual Signals
| Signal | Description | Formula |
|--------|-------------|---------|
| `missed_opportunity_count` | Recommendations ignored that succeeded for others | `ignored_recs WHERE similar_users_succeeded` |
| `execution_gap` | Delta between potential and actual outcomes | `potential_value - realized_value` |

---

## Storage (S262)

### bte_signals Table
```sql
CREATE TABLE bte_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  signal_type text NOT NULL,
  signal_value numeric NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT NOW(),
  version integer NOT NULL DEFAULT 1
);

-- Retention: 18 months rolling
-- Recomputable from raw events
```

### bte_thresholds Table (Super Admin Only)
```sql
CREATE TABLE bte_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  threshold_key text NOT NULL UNIQUE,
  value numeric NOT NULL,
  version integer NOT NULL DEFAULT 1,
  updated_by uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- No auto-learning
-- No runtime mutation
-- Every change audited
```

---

## Service Architecture

```
/services/bte/
├── index.ts              # Service entry point
├── reader.ts             # Canonical event reader (READ-ONLY)
├── signals/
│   ├── temporal.ts       # decision_latency, idle_decay, momentum, consistency
│   ├── execution.ts      # nba_adoption, follow_through, drop_off, hesitation
│   └── counterfactual.ts # missed_opportunity, execution_gap
├── thresholds.ts         # Threshold config reader
└── types.ts              # Type definitions
```

---

## Hard Rules

1. **BTE must not import SIVA runtime** - No coupling to inference layer
2. **BTE must not write to any core table** - Read-only access only
3. **Thresholds only via config** - Super Admin controlled, no auto-learning
4. **No event bus/queues** - Direct DB reads only
5. **No envelope requirements** - Explicit S260 exemption

---

## Integration with NBA (S266)

```
NBA Input Expansion:
├── Workspace State (current stage, pending actions)
├── Persona Policy (constraints)
├── MVT Constraints (sub-vertical rules)
└── BTE Context (urgency, hesitation, decay)

BTE does NOT choose action.
NBA chooses action.
BTE influences reasoning + escalation only.
```

---

## Validation Requirements

Before BTE goes live:
1. BTE can recompute signals from raw events
2. Changing thresholds alters interpretation only (not raw data)
3. No envelope/runtime gate is triggered
4. If BTE writes or executes → ABORT

---

## Version History

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2025-12-24 | Initial architecture (LOCKED) |
