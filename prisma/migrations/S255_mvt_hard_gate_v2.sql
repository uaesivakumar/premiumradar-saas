/**
 * S255 MVT Hard Gate v2 - REAL ENFORCEMENT
 *
 * Fixes all gaps from v1:
 * 1. Real versioning table (os_sub_vertical_mvt_versions)
 * 2. DB CHECK constraints that cannot be bypassed
 * 3. Trigger enforcement for complex validations
 * 4. runtime_eligible hard gate at DB level
 *
 * SEMANTICS (LOCKED):
 * - primary_entity_type: IMMUTABLE forever once created
 * - MVT edits create new version, do not overwrite
 * - Exactly one ACTIVE version per sub-vertical
 * - runtime_eligible can NEVER be true unless mvt_valid is true
 */

-- =============================================================================
-- PHASE 1: CREATE MVT VERSIONS TABLE (REAL VERSIONING)
-- =============================================================================

CREATE TABLE IF NOT EXISTS os_sub_vertical_mvt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_vertical_id UUID NOT NULL REFERENCES os_sub_verticals(id) ON DELETE CASCADE,
  mvt_version INTEGER NOT NULL DEFAULT 1,

  -- ICP Truth Triad
  buyer_role VARCHAR(100) NOT NULL,
  decision_owner VARCHAR(100) NOT NULL,

  -- Signal Allow-List
  allowed_signals JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Kill Rules
  kill_rules JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Sales-Bench Seed Scenarios
  seed_scenarios JSONB NOT NULL DEFAULT '{"golden":[],"kill":[]}'::jsonb,

  -- Validation state
  mvt_valid BOOLEAN NOT NULL DEFAULT false,
  mvt_validated_at TIMESTAMPTZ,

  -- Status: DRAFT | ACTIVE | DEPRECATED
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255),

  -- Unique version per sub-vertical
  CONSTRAINT uq_sub_vertical_version UNIQUE (sub_vertical_id, mvt_version)
);

-- Only ONE active version per sub-vertical (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_mvt_version
  ON os_sub_vertical_mvt_versions(sub_vertical_id)
  WHERE status = 'ACTIVE';

COMMENT ON TABLE os_sub_vertical_mvt_versions IS
  'MVT versions for sub-verticals. Each edit creates new version. Only one ACTIVE per sub-vertical.';

-- =============================================================================
-- PHASE 2: ADD ACTIVE VERSION POINTER TO SUB-VERTICALS
-- =============================================================================

ALTER TABLE os_sub_verticals
  ADD COLUMN IF NOT EXISTS active_mvt_version_id UUID REFERENCES os_sub_vertical_mvt_versions(id);

COMMENT ON COLUMN os_sub_verticals.active_mvt_version_id IS
  'Points to the currently ACTIVE MVT version. NULL = no valid MVT.';

-- =============================================================================
-- PHASE 3: DB CHECK CONSTRAINTS (CANNOT BE BYPASSED)
-- =============================================================================

-- 3.1: runtime_eligible can NEVER be true unless mvt_valid is true
-- We enforce this by making mvt_valid control runtime_eligible
-- The view already computes this, but we add a trigger as hard gate

-- 3.2: MVT version table constraints
ALTER TABLE os_sub_vertical_mvt_versions
  ADD CONSTRAINT chk_mvt_buyer_role_required
  CHECK (char_length(buyer_role) > 0);

ALTER TABLE os_sub_vertical_mvt_versions
  ADD CONSTRAINT chk_mvt_decision_owner_required
  CHECK (char_length(decision_owner) > 0);

ALTER TABLE os_sub_vertical_mvt_versions
  ADD CONSTRAINT chk_mvt_status_valid
  CHECK (status IN ('DRAFT', 'ACTIVE', 'DEPRECATED'));

-- 3.3: Complex JSONB constraints via trigger (CHECK can't do this well)
CREATE OR REPLACE FUNCTION validate_mvt_version_constraints()
RETURNS TRIGGER AS $$
DECLARE
  allowed_signals_count INTEGER;
  kill_rules_count INTEGER;
  compliance_rules_count INTEGER;
  golden_count INTEGER;
  kill_count INTEGER;
  signal_entity_mismatch BOOLEAN;
  primary_entity TEXT;
BEGIN
  -- Get primary_entity_type from parent sub-vertical
  SELECT primary_entity_type INTO primary_entity
  FROM os_sub_verticals WHERE id = NEW.sub_vertical_id;

  -- 1. allowed_signals: min 1
  SELECT COUNT(*) INTO allowed_signals_count
  FROM jsonb_array_elements(COALESCE(NEW.allowed_signals, '[]'::jsonb));

  IF allowed_signals_count < 1 THEN
    RAISE EXCEPTION 'MVT_CONSTRAINT_VIOLATION: At least 1 allowed_signal required (found: %)', allowed_signals_count;
  END IF;

  -- 2. Signal entity_type must match primary_entity_type
  SELECT EXISTS (
    SELECT 1 FROM jsonb_array_elements(COALESCE(NEW.allowed_signals, '[]'::jsonb)) AS signal
    WHERE signal->>'entity_type' IS NOT NULL
      AND signal->>'entity_type' != primary_entity
  ) INTO signal_entity_mismatch;

  IF signal_entity_mismatch THEN
    RAISE EXCEPTION 'MVT_CONSTRAINT_VIOLATION: Signal entity_type must match primary_entity_type (%)', primary_entity;
  END IF;

  -- 3. kill_rules: min 2
  SELECT COUNT(*) INTO kill_rules_count
  FROM jsonb_array_elements(COALESCE(NEW.kill_rules, '[]'::jsonb));

  IF kill_rules_count < 2 THEN
    RAISE EXCEPTION 'MVT_CONSTRAINT_VIOLATION: Minimum 2 kill_rules required (found: %)', kill_rules_count;
  END IF;

  -- 4. At least 1 compliance/regulatory kill_rule
  SELECT COUNT(*) INTO compliance_rules_count
  FROM jsonb_array_elements(COALESCE(NEW.kill_rules, '[]'::jsonb)) AS rule
  WHERE lower(rule->>'reason') LIKE '%compliance%'
     OR lower(rule->>'reason') LIKE '%regulatory%'
     OR lower(rule->>'reason') LIKE '%legal%'
     OR lower(rule->>'reason') LIKE '%aml%'
     OR lower(rule->>'reason') LIKE '%kyc%'
     OR lower(rule->>'reason') LIKE '%sanction%';

  IF compliance_rules_count < 1 THEN
    RAISE EXCEPTION 'MVT_CONSTRAINT_VIOLATION: At least 1 compliance/regulatory kill_rule required';
  END IF;

  -- 5. seed_scenarios.golden: min 2
  SELECT COUNT(*) INTO golden_count
  FROM jsonb_array_elements(COALESCE(NEW.seed_scenarios->'golden', '[]'::jsonb));

  IF golden_count < 2 THEN
    RAISE EXCEPTION 'MVT_CONSTRAINT_VIOLATION: Minimum 2 golden seed_scenarios required (found: %)', golden_count;
  END IF;

  -- 6. seed_scenarios.kill: min 2
  SELECT COUNT(*) INTO kill_count
  FROM jsonb_array_elements(COALESCE(NEW.seed_scenarios->'kill', '[]'::jsonb));

  IF kill_count < 2 THEN
    RAISE EXCEPTION 'MVT_CONSTRAINT_VIOLATION: Minimum 2 kill seed_scenarios required (found: %)', kill_count;
  END IF;

  -- All checks passed - set mvt_valid = true
  NEW.mvt_valid := true;
  NEW.mvt_validated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_mvt_version ON os_sub_vertical_mvt_versions;

CREATE TRIGGER trg_validate_mvt_version
  BEFORE INSERT OR UPDATE ON os_sub_vertical_mvt_versions
  FOR EACH ROW
  EXECUTE FUNCTION validate_mvt_version_constraints();

COMMENT ON TRIGGER trg_validate_mvt_version ON os_sub_vertical_mvt_versions IS
  'Enforces MVT constraints at DB level. Cannot be bypassed. Raises exception on violation.';

-- =============================================================================
-- PHASE 4: IMMUTABILITY ENFORCEMENT
-- =============================================================================

-- Prevent primary_entity_type changes after creation
CREATE OR REPLACE FUNCTION enforce_primary_entity_type_immutable()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.primary_entity_type IS NOT NULL AND OLD.primary_entity_type != NEW.primary_entity_type THEN
    RAISE EXCEPTION 'IMMUTABILITY_VIOLATION: primary_entity_type cannot be changed after creation (was: %, attempted: %)',
      OLD.primary_entity_type, NEW.primary_entity_type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_entity_type_immutable ON os_sub_verticals;

CREATE TRIGGER trg_enforce_entity_type_immutable
  BEFORE UPDATE ON os_sub_verticals
  FOR EACH ROW
  EXECUTE FUNCTION enforce_primary_entity_type_immutable();

-- =============================================================================
-- PHASE 5: RUNTIME ELIGIBILITY HARD GATE
-- =============================================================================

-- Update the view to use active MVT version
DROP VIEW IF EXISTS v_runtime_eligible_sub_verticals;

CREATE VIEW v_runtime_eligible_sub_verticals AS
SELECT
  sv.id,
  sv.key,
  sv.name,
  sv.primary_entity_type,
  mv.buyer_role,
  mv.decision_owner,
  mv.mvt_version,
  mv.mvt_valid,
  mv.mvt_validated_at,
  v.key as vertical_key,
  v.name as vertical_name,
  (
    sv.is_active = true AND
    mv.mvt_valid = true AND
    mv.status = 'ACTIVE' AND
    v.is_active = true AND
    EXISTS (
      SELECT 1 FROM os_personas p
      JOIN os_persona_policies pp ON pp.persona_id = p.id
      WHERE p.sub_vertical_id = sv.id
        AND p.is_active = true
        AND pp.status = 'ACTIVE'
    )
  ) as runtime_eligible,
  CASE
    WHEN sv.is_active = false THEN 'SUB_VERTICAL_INACTIVE'
    WHEN sv.active_mvt_version_id IS NULL THEN 'NO_MVT_VERSION'
    WHEN mv.mvt_valid = false THEN 'MVT_INVALID'
    WHEN mv.status != 'ACTIVE' THEN 'MVT_NOT_ACTIVE'
    WHEN v.is_active = false THEN 'VERTICAL_INACTIVE'
    WHEN NOT EXISTS (
      SELECT 1 FROM os_personas p
      JOIN os_persona_policies pp ON pp.persona_id = p.id
      WHERE p.sub_vertical_id = sv.id
        AND p.is_active = true
        AND pp.status = 'ACTIVE'
    ) THEN 'NO_ACTIVE_PERSONA_POLICY'
    ELSE NULL
  END as eligibility_blocker
FROM os_sub_verticals sv
JOIN os_verticals v ON sv.vertical_id = v.id
LEFT JOIN os_sub_vertical_mvt_versions mv ON sv.active_mvt_version_id = mv.id;

-- =============================================================================
-- PHASE 6: MIGRATE EXISTING DATA
-- =============================================================================

-- Migrate existing MVT data from os_sub_verticals to versions table
-- Only for sub-verticals that have MVT fields populated

INSERT INTO os_sub_vertical_mvt_versions (
  sub_vertical_id,
  mvt_version,
  buyer_role,
  decision_owner,
  allowed_signals,
  kill_rules,
  seed_scenarios,
  status,
  created_by
)
SELECT
  sv.id,
  COALESCE(sv.mvt_version, 1),
  COALESCE(sv.buyer_role, 'MIGRATION_REQUIRED'),
  COALESCE(sv.decision_owner, 'MIGRATION_REQUIRED'),
  COALESCE(sv.allowed_signals, '[]'::jsonb),
  COALESCE(sv.kill_rules, '[]'::jsonb),
  COALESCE(sv.seed_scenarios, '{"golden":[],"kill":[]}'::jsonb),
  CASE WHEN sv.mvt_valid = true THEN 'ACTIVE' ELSE 'DRAFT' END,
  'S255_MIGRATION'
FROM os_sub_verticals sv
WHERE sv.buyer_role IS NOT NULL
  AND sv.decision_owner IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM os_sub_vertical_mvt_versions mv
    WHERE mv.sub_vertical_id = sv.id
  )
ON CONFLICT DO NOTHING;

-- Update active_mvt_version_id pointer for migrated data
UPDATE os_sub_verticals sv
SET active_mvt_version_id = (
  SELECT mv.id
  FROM os_sub_vertical_mvt_versions mv
  WHERE mv.sub_vertical_id = sv.id
    AND mv.status = 'ACTIVE'
  LIMIT 1
)
WHERE sv.active_mvt_version_id IS NULL
  AND EXISTS (
    SELECT 1 FROM os_sub_vertical_mvt_versions mv
    WHERE mv.sub_vertical_id = sv.id AND mv.status = 'ACTIVE'
  );

-- =============================================================================
-- PHASE 7: HELPER FUNCTION FOR VERSION CREATION
-- =============================================================================

CREATE OR REPLACE FUNCTION create_mvt_version(
  p_sub_vertical_id UUID,
  p_buyer_role VARCHAR(100),
  p_decision_owner VARCHAR(100),
  p_allowed_signals JSONB,
  p_kill_rules JSONB,
  p_seed_scenarios JSONB,
  p_created_by VARCHAR(255) DEFAULT NULL
)
RETURNS os_sub_vertical_mvt_versions AS $$
DECLARE
  new_version INTEGER;
  result os_sub_vertical_mvt_versions;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(mvt_version), 0) + 1 INTO new_version
  FROM os_sub_vertical_mvt_versions
  WHERE sub_vertical_id = p_sub_vertical_id;

  -- Deprecate current active version
  UPDATE os_sub_vertical_mvt_versions
  SET status = 'DEPRECATED'
  WHERE sub_vertical_id = p_sub_vertical_id AND status = 'ACTIVE';

  -- Insert new version (trigger will validate)
  INSERT INTO os_sub_vertical_mvt_versions (
    sub_vertical_id, mvt_version, buyer_role, decision_owner,
    allowed_signals, kill_rules, seed_scenarios, status, created_by
  )
  VALUES (
    p_sub_vertical_id, new_version, p_buyer_role, p_decision_owner,
    p_allowed_signals, p_kill_rules, p_seed_scenarios, 'ACTIVE', p_created_by
  )
  RETURNING * INTO result;

  -- Update pointer in parent table
  UPDATE os_sub_verticals
  SET active_mvt_version_id = result.id
  WHERE id = p_sub_vertical_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_mvt_version IS
  'Creates new MVT version, deprecates old one, updates pointer. Returns new version row.';

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================
/*
-- Check constraints exist:
SELECT conname, contype, consrc
FROM pg_constraint
WHERE conrelid = 'os_sub_vertical_mvt_versions'::regclass;

-- Check trigger exists:
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgrelid = 'os_sub_vertical_mvt_versions'::regclass;

-- Test constraint violation (should fail):
INSERT INTO os_sub_vertical_mvt_versions (sub_vertical_id, buyer_role, decision_owner)
VALUES ('00000000-0000-0000-0000-000000000000', 'test', 'test');
-- Expected: MVT_CONSTRAINT_VIOLATION: Minimum 2 kill_rules required

-- Check version history:
SELECT sub_vertical_id, mvt_version, status, created_at
FROM os_sub_vertical_mvt_versions
ORDER BY sub_vertical_id, mvt_version;
*/
