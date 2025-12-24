# S255 MVT Hard Gate - CRITICAL GAP ANALYSIS

**Date:** 2025-12-24
**Status:** INCOMPLETE - Critical gaps found

---

## EXECUTIVE SUMMARY

My initial "✅ CERTIFIED" was **false theater**. Upon proper cross-validation:

| Check | Status | Issue |
|-------|--------|-------|
| DB CHECK constraints | ❌ MISSING | No min count enforcement at DB level |
| DB NOT NULL on MVT fields | ❌ MISSING | Fields can be NULL |
| runtime_eligible constraint | ❌ MISSING | Only in VIEW, not enforced |
| API POST validation | ✅ WORKS | Proper MVT validation |
| API PUT validation | ❌ MISSING | MVT fields not even accepted |
| MVT version bumping | ❌ NOT IMPLEMENTED | Spec claims versioning, code has none |
| Immutability enforcement | ⚠️ PARTIAL | primary_entity_type blocked, but MVT fields just not updatable |

---

## GAP 1: No DB-Level Constraints (Bypass Risk)

### What's Missing

```sql
-- NONE OF THESE EXIST:
ALTER TABLE os_sub_verticals
  ADD CONSTRAINT chk_kill_rules_min_2
  CHECK (jsonb_array_length(kill_rules) >= 2);

ALTER TABLE os_sub_verticals
  ADD CONSTRAINT chk_buyer_role_required
  CHECK (buyer_role IS NOT NULL AND buyer_role != '');

ALTER TABLE os_sub_verticals
  ADD CONSTRAINT chk_mvt_valid_requires_complete
  CHECK (mvt_valid = false OR (buyer_role IS NOT NULL AND decision_owner IS NOT NULL));
```

### Why It Matters

The only enforcement is:
1. API-layer validation (can be bypassed with direct DB access)
2. DB trigger (can be disabled by superuser, bypassed by COPY)

Anyone with database write access can:
```sql
INSERT INTO os_sub_verticals (vertical_id, key, name, default_agent, primary_entity_type, mvt_valid)
VALUES ('...', 'test_bad', 'Bad', 'SIVA', 'company', true);
-- No kill rules, no seeds, but mvt_valid = true
```

The trigger will set `mvt_valid = false`, but if trigger is disabled:
```sql
SET session_replication_role = 'replica';  -- Disables triggers
INSERT INTO os_sub_verticals (..., mvt_valid) VALUES (..., true);
SET session_replication_role = 'origin';
```

---

## GAP 2: PUT Handler Doesn't Support MVT Updates

### What's Happening

The PUT handler in `sub-verticals/[id]/route.ts` only accepts:
- key
- name
- default_agent
- is_active
- related_entity_types

**MVT fields are completely ignored:**
- buyer_role - NOT IN UPDATE
- decision_owner - NOT IN UPDATE
- allowed_signals - NOT IN UPDATE
- kill_rules - NOT IN UPDATE
- seed_scenarios - NOT IN UPDATE

### Implication

1. You CANNOT fix MVT errors after creation - must delete and recreate
2. The spec claim "edits create new version" is **false** - edits don't exist
3. The "immutability" is accidental (omission), not intentional enforcement

---

## GAP 3: No Version Bumping Mechanism

### What Was Claimed
> "MVT stored versioned (mvt_version=1), immutable once ACTIVE, edits create new version"

### What Actually Exists

```typescript
// In POST handler:
mvt_version, is_active
...
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 1, true)
//                                                    ^^ hardcoded to 1

// In PUT handler:
// NO mvt_version handling AT ALL
```

There is no:
- Version increment on edit
- Version history table
- "ACTIVE" status that locks MVT
- Mechanism to create new version

---

## GAP 4: Missing Test Coverage

### Tests I Claimed Covered But Don't Actually Test

| Claim | Reality |
|-------|---------|
| "Update rejects invalid MVT" | ❌ PUT doesn't accept MVT fields at all |
| "Entity-type mismatch on UPDATE" | ❌ Can't update allowed_signals via API |
| "Version bumping" | ❌ No version mechanism exists |

### What Tests Actually Cover

The 34 tests only cover:
- `validateMVT()` function (pure TypeScript)
- Runtime eligibility logic (pure TypeScript)
- Error message quality (pure TypeScript)

**No tests hit the actual API endpoints or database.**

---

## GAP 5: Write Paths Not Protected

### All Write Paths to os_sub_verticals

| Path | MVT Validated? |
|------|----------------|
| `POST /api/superadmin/controlplane/sub-verticals` | ✅ Yes |
| `PUT /api/superadmin/controlplane/sub-verticals/:id` | ❌ MVT fields ignored |
| Direct SQL (Cloud SQL console) | ❌ Only trigger |
| Migration scripts | ❌ Only trigger |
| Future seeders | ❌ Only trigger |

---

## WHAT NEEDS TO BE FIXED

### Priority 1: DB Constraints (Hard Gate)

```sql
-- Add CHECK constraints
ALTER TABLE os_sub_verticals
  ADD CONSTRAINT chk_mvt_buyer_role
  CHECK (buyer_role IS NOT NULL AND char_length(buyer_role) > 0);

ALTER TABLE os_sub_verticals
  ADD CONSTRAINT chk_mvt_decision_owner
  CHECK (decision_owner IS NOT NULL AND char_length(decision_owner) > 0);

ALTER TABLE os_sub_verticals
  ADD CONSTRAINT chk_mvt_kill_rules_min_2
  CHECK (jsonb_array_length(COALESCE(kill_rules, '[]'::jsonb)) >= 2);

-- Prevent runtime_eligible bypass
ALTER TABLE os_sub_verticals
  ADD CONSTRAINT chk_mvt_valid_integrity
  CHECK (
    mvt_valid = false OR (
      buyer_role IS NOT NULL AND
      decision_owner IS NOT NULL AND
      jsonb_array_length(COALESCE(allowed_signals, '[]'::jsonb)) >= 1 AND
      jsonb_array_length(COALESCE(kill_rules, '[]'::jsonb)) >= 2
    )
  );
```

### Priority 2: PUT Handler Must Validate MVT

```typescript
// Add MVT fields to PUT handler
const {
  key, name, default_agent, is_active,
  buyer_role, decision_owner,  // ADD
  allowed_signals, kill_rules, seed_scenarios  // ADD
} = body;

// Re-validate MVT on any MVT field change
if (buyer_role || decision_owner || allowed_signals || kill_rules || seed_scenarios) {
  const mvtValidation = validateMVT(...);
  if (!mvtValidation.valid) {
    return Response.json({ error: 'MVT_INCOMPLETE', ... }, { status: 400 });
  }
}
```

### Priority 3: Version Bumping

If versioning is required (per spec), implement:

```sql
CREATE TABLE os_sub_vertical_versions (
  id UUID PRIMARY KEY,
  sub_vertical_id UUID REFERENCES os_sub_verticals(id),
  version INTEGER NOT NULL,
  mvt_snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Priority 4: API Integration Tests

```typescript
// test: POST with invalid MVT returns 400
// test: PUT with invalid MVT returns 400 (currently doesn't!)
// test: Direct SQL insert triggers validation
// test: runtime_eligible cannot be true with invalid MVT
```

---

## HONEST ASSESSMENT

S255 is **NOT COMPLETE**. My certification was premature.

What works:
- API POST validates MVT correctly
- DB trigger computes mvt_valid
- OS resolver blocks mvt_valid=false

What's broken:
- No DB constraints = bypass risk
- PUT doesn't support MVT = can't fix errors
- No versioning = spec violation
- Tests are shallow = theater

**Recommendation:** Mark S255 as "In Progress" until gaps are fixed.

---

*This gap analysis generated after founder cross-validation challenge.*
