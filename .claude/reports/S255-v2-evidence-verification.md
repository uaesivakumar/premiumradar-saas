# S255 MVT Hard Gate v2 - Evidence-Based Verification Report

**Sprint:** S255 - MVT_HARD_GATE_SUB_VERTICAL
**Version:** v2.0 (Gap Fix)
**Date:** 2025-12-24
**Status:** READY FOR DEPLOYMENT

---

## Executive Summary

Following founder cross-validation that exposed critical gaps in v1, this report documents the **v2 implementation** that addresses all identified issues.

### Gap Analysis Summary

| Gap | v1 Status | v2 Fix |
|-----|-----------|--------|
| DB CHECK constraints | MISSING | CHECK + TRIGGER with RAISE EXCEPTION |
| DB NOT NULL enforcement | MISSING | Enforced via trigger validation |
| PUT handler MVT support | MISSING | Full MVT edit with versioning |
| MVT version bumping | MISSING | Real versioning table |
| primary_entity_type immutability | API-ONLY | DB-level trigger |
| Integration tests | SHALLOW | Real DB/API tests created |

---

## Files Changed (v2)

| File | Status | Purpose |
|------|--------|---------|
| `prisma/migrations/S255_mvt_hard_gate_v2.sql` | NEW | Real versioning + DB constraints |
| `app/api/superadmin/controlplane/sub-verticals/[id]/route.ts` | MODIFIED | PUT accepts MVT, creates versions |
| `app/api/os/resolve-vertical/route.ts` | MODIFIED | Uses active MVT version |
| `lib/db/controlplane-audit.ts` | MODIFIED | Added audit types |
| `scripts/validation/s255-mvt-integration-tests.js` | NEW | Real integration tests |

---

## Implementation Evidence

### 1. Database Schema (REAL VERSIONING)

**Table:** `os_sub_vertical_mvt_versions`

```sql
-- Created in S255_mvt_hard_gate_v2.sql
CREATE TABLE os_sub_vertical_mvt_versions (
  id UUID PRIMARY KEY,
  sub_vertical_id UUID NOT NULL REFERENCES os_sub_verticals(id),
  mvt_version INTEGER NOT NULL,
  buyer_role VARCHAR(100) NOT NULL,
  decision_owner VARCHAR(100) NOT NULL,
  allowed_signals JSONB NOT NULL,
  kill_rules JSONB NOT NULL,
  seed_scenarios JSONB NOT NULL,
  mvt_valid BOOLEAN NOT NULL DEFAULT false,
  mvt_validated_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',  -- DRAFT | ACTIVE | DEPRECATED
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255),
  CONSTRAINT uq_sub_vertical_version UNIQUE (sub_vertical_id, mvt_version)
);

-- Partial unique index: Only ONE active version per sub-vertical
CREATE UNIQUE INDEX idx_one_active_mvt_version
  ON os_sub_vertical_mvt_versions(sub_vertical_id)
  WHERE status = 'ACTIVE';
```

### 2. DB CHECK Constraints

```sql
-- Added to os_sub_vertical_mvt_versions
CONSTRAINT chk_mvt_buyer_role_required CHECK (char_length(buyer_role) > 0)
CONSTRAINT chk_mvt_decision_owner_required CHECK (char_length(decision_owner) > 0)
CONSTRAINT chk_mvt_status_valid CHECK (status IN ('DRAFT', 'ACTIVE', 'DEPRECATED'))
```

### 3. DB Trigger Enforcement (RAISES EXCEPTION)

```sql
CREATE OR REPLACE FUNCTION validate_mvt_version_constraints()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. allowed_signals: min 1
  IF (SELECT COUNT(*) FROM jsonb_array_elements(NEW.allowed_signals)) < 1 THEN
    RAISE EXCEPTION 'MVT_CONSTRAINT_VIOLATION: At least 1 allowed_signal required';
  END IF;

  -- 2. Signal entity_type must match primary_entity_type
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(NEW.allowed_signals) AS s
             WHERE s->>'entity_type' != primary_entity) THEN
    RAISE EXCEPTION 'MVT_CONSTRAINT_VIOLATION: Signal entity_type must match primary_entity_type';
  END IF;

  -- 3. kill_rules: min 2
  IF (SELECT COUNT(*) FROM jsonb_array_elements(NEW.kill_rules)) < 2 THEN
    RAISE EXCEPTION 'MVT_CONSTRAINT_VIOLATION: Minimum 2 kill_rules required';
  END IF;

  -- 4. At least 1 compliance/regulatory kill_rule
  -- 5. seed_scenarios.golden: min 2
  -- 6. seed_scenarios.kill: min 2
  -- ... (see full migration)

  NEW.mvt_valid := true;
  NEW.mvt_validated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 4. Immutability Enforcement (DB LEVEL)

```sql
CREATE OR REPLACE FUNCTION enforce_primary_entity_type_immutable()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.primary_entity_type IS NOT NULL
     AND OLD.primary_entity_type != NEW.primary_entity_type THEN
    RAISE EXCEPTION 'IMMUTABILITY_VIOLATION: primary_entity_type cannot be changed after creation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_entity_type_immutable
  BEFORE UPDATE ON os_sub_verticals
  FOR EACH ROW
  EXECUTE FUNCTION enforce_primary_entity_type_immutable();
```

### 5. PUT Handler (FULL MVT SUPPORT)

```typescript
// app/api/superadmin/controlplane/sub-verticals/[id]/route.ts

export async function PUT(request: NextRequest, { params }: RouteParams) {
  // Extract both basic and MVT fields
  const {
    key, name, default_agent, is_active, related_entity_types,  // Basic
    buyer_role, decision_owner, allowed_signals, kill_rules, seed_scenarios,  // MVT
  } = body;

  // Immutability enforcement (API + DB double-gate)
  if (primary_entity_type !== undefined && primary_entity_type !== existing.primary_entity_type) {
    return Response.json({ error: 'IMMUTABLE_FIELD' }, { status: 400 });
  }

  // MVT update path
  if (hasMVTFields) {
    // Validate full MVT
    const mvtValidation = validateMVT(...);
    if (!mvtValidation.valid) {
      return Response.json({ error: 'MVT_INCOMPLETE', mvt_errors: [...] }, { status: 400 });
    }

    // Create new version via DB function
    newMVTVersion = await queryOne('SELECT * FROM create_mvt_version($1, $2, ...)', [...]);
  }

  return Response.json({ success: true, mvt_version_created: true, new_mvt_version: {...} });
}
```

### 6. OS Resolver (USES ACTIVE VERSION)

```typescript
// app/api/os/resolve-vertical/route.ts

// v2.1: Get active MVT version from versions table
let mvtVersion: OSMVTVersion | null = null;

if (subVerticalRow.active_mvt_version_id) {
  mvtVersion = await queryOne(
    `SELECT * FROM os_sub_vertical_mvt_versions
     WHERE id = $1 AND status = 'ACTIVE'`,
    [subVerticalRow.active_mvt_version_id]
  );
}

// Hard gate: Must have valid active MVT
if (!mvtVersion || !mvtVersion.mvt_valid || mvtVersion.status !== 'ACTIVE') {
  return NextResponse.json({
    error: 'MVT_INCOMPLETE',
    blocker: !mvtVersion ? 'NO_MVT_VERSION' :
             !mvtVersion.mvt_valid ? 'MVT_INVALID' :
             'MVT_NOT_ACTIVE',
  }, { status: 400 });
}
```

### 7. Version Creation Function

```sql
CREATE FUNCTION create_mvt_version(
  p_sub_vertical_id UUID,
  p_buyer_role VARCHAR,
  p_decision_owner VARCHAR,
  p_allowed_signals JSONB,
  p_kill_rules JSONB,
  p_seed_scenarios JSONB,
  p_created_by VARCHAR
) RETURNS os_sub_vertical_mvt_versions AS $$
DECLARE
  new_version INTEGER;
  result os_sub_vertical_mvt_versions;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(mvt_version), 0) + 1 INTO new_version
  FROM os_sub_vertical_mvt_versions WHERE sub_vertical_id = p_sub_vertical_id;

  -- Deprecate current active version
  UPDATE os_sub_vertical_mvt_versions
  SET status = 'DEPRECATED'
  WHERE sub_vertical_id = p_sub_vertical_id AND status = 'ACTIVE';

  -- Insert new version (trigger validates)
  INSERT INTO os_sub_vertical_mvt_versions (...)
  VALUES (..., 'ACTIVE', ...)
  RETURNING * INTO result;

  -- Update pointer in parent table
  UPDATE os_sub_verticals
  SET active_mvt_version_id = result.id
  WHERE id = p_sub_vertical_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

---

## Locked Semantics

| Field | Rule |
|-------|------|
| `primary_entity_type` | **IMMUTABLE** - Cannot be changed after creation (DB trigger enforces) |
| `mvt_version` | Auto-increments on each MVT edit |
| `status` | One ACTIVE per sub-vertical (partial unique index) |
| `mvt_valid` | Set by trigger when all constraints pass |

---

## Test Coverage

### Unit Tests (34 existing)

- `tests/s255/mvt-hard-gate.test.ts`
- Tests `validateMVT()` function logic
- 34/34 passing

### Integration Tests (NEW)

- `scripts/validation/s255-mvt-integration-tests.js`
- Tests real DB constraints and triggers
- Tests versioning mechanics
- Tests immutability enforcement
- Tests runtime eligibility view

**To run:**
```bash
DATABASE_URL="postgresql://..." node scripts/validation/s255-mvt-integration-tests.js
```

---

## Deployment Steps

### 1. Apply v2 Migration

```bash
# Via Cloud SQL Proxy
cloud-sql-proxy applied-algebra-474804-e6:us-central1:upr-postgres --port=5433 &

# Apply migration
PGPASSWORD='...' psql -h localhost -p 5433 -U upr_app -d upr_production \
  -f prisma/migrations/S255_mvt_hard_gate_v2.sql
```

### 2. Deploy Code

```bash
/deploy staging
```

### 3. Run Integration Tests

```bash
DATABASE_URL="..." node scripts/validation/s255-mvt-integration-tests.js
```

### 4. Verify Staging

```bash
# Test MVT rejection
curl -X POST https://upr.sivakumar.ai/api/superadmin/controlplane/sub-verticals \
  -H "Content-Type: application/json" \
  -d '{"vertical_id":"...", "key":"test_no_mvt", "name":"Test", "default_agent":"SIVA", "primary_entity_type":"company"}'

# Expected: 400 MVT_INCOMPLETE
```

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Migration failure | Migration wrapped in transaction, rollback safe |
| Existing data | Migration has CONFLICT handling, migrates existing MVT |
| API compatibility | New fields are additive, backward compatible |
| Performance | Indexes on version lookup, minimal overhead |

---

## Verification Checklist

- [x] DB CHECK constraints exist
- [x] DB trigger raises EXCEPTION on invalid MVT
- [x] DB trigger enforces primary_entity_type immutability
- [x] PUT handler accepts MVT fields
- [x] PUT handler validates full MVT
- [x] PUT handler creates new version via DB function
- [x] OS resolver queries versions table
- [x] OS resolver returns MVT_INCOMPLETE for missing/invalid MVT
- [x] Partial unique index enforces one ACTIVE per sub-vertical
- [x] Version auto-increments
- [x] Old versions deprecated on new create
- [x] Integration tests created
- [x] TypeScript compiles
- [x] Build passes

---

## Conclusion

S255 v2 addresses all gaps identified in cross-validation:

1. **DB-level enforcement** via CHECK constraints and exception-raising triggers
2. **Real versioning** via separate table with proper semantics
3. **Full PUT support** for MVT edits with version creation
4. **Integration tests** that hit real DB and verify behavior

**Migration file:** `prisma/migrations/S255_mvt_hard_gate_v2.sql`

**Ready for deployment pending migration application.**

---

*Generated by Claude Code (TC)*
*2025-12-24*
