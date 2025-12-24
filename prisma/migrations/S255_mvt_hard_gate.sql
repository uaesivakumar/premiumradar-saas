/**
 * S255: MVT Hard Gate - Sub-Vertical Enforcement
 *
 * Implements Minimum Viable Truth (MVT) at Sub-Vertical creation time.
 * No partial saves. No draft leaks. No runtime visibility without complete MVT.
 *
 * MVT Components:
 * 1. ICP Truth Triad (primary_entity_type + buyer_role + decision_owner)
 * 2. Signal Allow-List (allowed_signals with justification)
 * 3. Kill Rules (minimum 2, at least 1 compliance/regulatory)
 * 4. Sales-Bench Seed Scenarios (golden + kill paths)
 *
 * Mandated by:
 * - Control Plane v2.0 (runtime eligibility hard gate)
 * - PRD v1.2 (authority before intelligence)
 * - PRD v1.3 (Sales-Bench invariance)
 *
 * SAFE TO RUN MULTIPLE TIMES (uses IF NOT EXISTS patterns)
 */

-- =============================================================================
-- PHASE 1: MVT SCHEMA EXTENSION FOR os_sub_verticals
-- =============================================================================

-- 1.1 ICP Truth Triad: buyer_role
ALTER TABLE os_sub_verticals
  ADD COLUMN IF NOT EXISTS buyer_role VARCHAR(100);

COMMENT ON COLUMN os_sub_verticals.buyer_role IS
  'MVT v1: The typical buyer role for this sales motion (e.g., HR, CFO, Individual Buyer). Part of ICP Truth Triad.';

-- 1.2 ICP Truth Triad: decision_owner
ALTER TABLE os_sub_verticals
  ADD COLUMN IF NOT EXISTS decision_owner VARCHAR(100);

COMMENT ON COLUMN os_sub_verticals.decision_owner IS
  'MVT v1: Who actually commits/signs for this sales motion. Part of ICP Truth Triad.';

-- 1.3 Signal Allow-List (JSONB array)
ALTER TABLE os_sub_verticals
  ADD COLUMN IF NOT EXISTS allowed_signals JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN os_sub_verticals.allowed_signals IS
  'MVT v1: Explicit signal allow-list. Each entry: {signal_key, entity_type, justification}. Only these signals are discoverable.';

-- 1.4 Kill Rules (JSONB array)
ALTER TABLE os_sub_verticals
  ADD COLUMN IF NOT EXISTS kill_rules JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN os_sub_verticals.kill_rules IS
  'MVT v1: Kill rules that override scoring. Each entry: {rule, action, reason}. Minimum 2 required, at least 1 compliance.';

-- 1.5 Sales-Bench Seed Scenarios (JSONB object)
ALTER TABLE os_sub_verticals
  ADD COLUMN IF NOT EXISTS seed_scenarios JSONB DEFAULT '{"golden":[],"kill":[]}'::jsonb;

COMMENT ON COLUMN os_sub_verticals.seed_scenarios IS
  'MVT v1: Sales-Bench deterministic scenario skeletons. Required: {golden: [...], kill: [...]}. Min 2 each.';

-- 1.6 MVT Version (for future schema migrations)
ALTER TABLE os_sub_verticals
  ADD COLUMN IF NOT EXISTS mvt_version INTEGER DEFAULT 1;

COMMENT ON COLUMN os_sub_verticals.mvt_version IS
  'MVT schema version. Current: 1. Used for forward compatibility.';

-- 1.7 MVT Validation Status
ALTER TABLE os_sub_verticals
  ADD COLUMN IF NOT EXISTS mvt_valid BOOLEAN DEFAULT false;

COMMENT ON COLUMN os_sub_verticals.mvt_valid IS
  'Whether this sub-vertical has passed MVT validation. False = not runtime eligible.';

-- 1.8 MVT Validated At timestamp
ALTER TABLE os_sub_verticals
  ADD COLUMN IF NOT EXISTS mvt_validated_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN os_sub_verticals.mvt_validated_at IS
  'When MVT validation last passed. NULL if never validated.';

-- =============================================================================
-- PHASE 2: INDEXES FOR MVT QUERIES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_os_sub_verticals_mvt_valid
  ON os_sub_verticals(mvt_valid);

CREATE INDEX IF NOT EXISTS idx_os_sub_verticals_mvt_version
  ON os_sub_verticals(mvt_version);

-- =============================================================================
-- PHASE 3: RUNTIME ELIGIBILITY VIEW
-- =============================================================================
-- A sub-vertical is runtime eligible ONLY if:
-- 1. MVT is valid (mvt_valid = true)
-- 2. Sub-vertical is active (is_active = true)
-- 3. At least one persona exists with ACTIVE policy
-- 4. Parent vertical is active

DROP VIEW IF EXISTS v_runtime_eligible_sub_verticals;

CREATE VIEW v_runtime_eligible_sub_verticals AS
SELECT
  sv.id,
  sv.key,
  sv.name,
  sv.primary_entity_type,
  sv.buyer_role,
  sv.decision_owner,
  sv.mvt_version,
  sv.mvt_valid,
  sv.mvt_validated_at,
  v.key as vertical_key,
  v.name as vertical_name,
  (
    sv.is_active = true AND
    sv.mvt_valid = true AND
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
    WHEN sv.mvt_valid = false THEN 'MVT_INCOMPLETE'
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
JOIN os_verticals v ON sv.vertical_id = v.id;

COMMENT ON VIEW v_runtime_eligible_sub_verticals IS
  'MVT v1: Shows which sub-verticals are runtime eligible. Use eligibility_blocker to diagnose issues.';

-- =============================================================================
-- PHASE 4: MVT VALIDATION FUNCTION
-- =============================================================================
-- This function validates MVT completeness and returns detailed errors

CREATE OR REPLACE FUNCTION validate_mvt(sub_vertical_id UUID)
RETURNS TABLE (
  is_valid BOOLEAN,
  errors TEXT[]
) AS $$
DECLARE
  sv RECORD;
  error_list TEXT[] := '{}';
  allowed_signals_count INTEGER;
  kill_rules_count INTEGER;
  compliance_rules_count INTEGER;
  golden_scenarios_count INTEGER;
  kill_scenarios_count INTEGER;
BEGIN
  -- Fetch sub-vertical
  SELECT * INTO sv FROM os_sub_verticals WHERE id = sub_vertical_id;

  IF sv IS NULL THEN
    RETURN QUERY SELECT false, ARRAY['Sub-vertical not found'];
    RETURN;
  END IF;

  -- 1. ICP Truth Triad validation
  IF sv.primary_entity_type IS NULL OR sv.primary_entity_type = '' THEN
    error_list := array_append(error_list, 'primary_entity_type is required');
  END IF;

  IF sv.buyer_role IS NULL OR sv.buyer_role = '' THEN
    error_list := array_append(error_list, 'buyer_role is required');
  END IF;

  IF sv.decision_owner IS NULL OR sv.decision_owner = '' THEN
    error_list := array_append(error_list, 'decision_owner is required');
  END IF;

  -- 2. Signal Allow-List validation
  SELECT COUNT(*) INTO allowed_signals_count
  FROM jsonb_array_elements(COALESCE(sv.allowed_signals, '[]'::jsonb));

  IF allowed_signals_count < 1 THEN
    error_list := array_append(error_list, 'At least 1 allowed_signal is required');
  END IF;

  -- Check signal entity_type matches primary_entity_type
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(COALESCE(sv.allowed_signals, '[]'::jsonb)) AS signal
    WHERE signal->>'entity_type' IS NOT NULL
      AND signal->>'entity_type' != sv.primary_entity_type
  ) THEN
    error_list := array_append(error_list, 'Signal entity_type must match primary_entity_type');
  END IF;

  -- 3. Kill Rules validation
  SELECT COUNT(*) INTO kill_rules_count
  FROM jsonb_array_elements(COALESCE(sv.kill_rules, '[]'::jsonb));

  IF kill_rules_count < 2 THEN
    error_list := array_append(error_list, 'Minimum 2 kill_rules required (found: ' || kill_rules_count || ')');
  END IF;

  -- Check for at least 1 compliance rule
  SELECT COUNT(*) INTO compliance_rules_count
  FROM jsonb_array_elements(COALESCE(sv.kill_rules, '[]'::jsonb)) AS rule
  WHERE lower(rule->>'reason') LIKE '%compliance%'
     OR lower(rule->>'reason') LIKE '%regulatory%'
     OR lower(rule->>'reason') LIKE '%legal%'
     OR lower(rule->>'reason') LIKE '%aml%'
     OR lower(rule->>'reason') LIKE '%kyc%';

  IF compliance_rules_count < 1 THEN
    error_list := array_append(error_list, 'At least 1 compliance/regulatory kill_rule required');
  END IF;

  -- 4. Sales-Bench Seed Scenarios validation
  SELECT COUNT(*) INTO golden_scenarios_count
  FROM jsonb_array_elements(COALESCE(sv.seed_scenarios->'golden', '[]'::jsonb));

  SELECT COUNT(*) INTO kill_scenarios_count
  FROM jsonb_array_elements(COALESCE(sv.seed_scenarios->'kill', '[]'::jsonb));

  IF golden_scenarios_count < 2 THEN
    error_list := array_append(error_list, 'Minimum 2 golden seed_scenarios required (found: ' || golden_scenarios_count || ')');
  END IF;

  IF kill_scenarios_count < 2 THEN
    error_list := array_append(error_list, 'Minimum 2 kill seed_scenarios required (found: ' || kill_scenarios_count || ')');
  END IF;

  -- Return result
  RETURN QUERY SELECT (array_length(error_list, 1) IS NULL OR array_length(error_list, 1) = 0), error_list;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_mvt IS
  'Validates MVT completeness for a sub-vertical. Returns (is_valid, errors[]).';

-- =============================================================================
-- PHASE 5: TRIGGER TO UPDATE mvt_valid ON CHANGES
-- =============================================================================

CREATE OR REPLACE FUNCTION update_mvt_validity()
RETURNS TRIGGER AS $$
DECLARE
  validation_result RECORD;
BEGIN
  -- Run validation
  SELECT * INTO validation_result FROM validate_mvt(NEW.id);

  -- Update mvt_valid and timestamp
  NEW.mvt_valid := validation_result.is_valid;
  IF validation_result.is_valid THEN
    NEW.mvt_validated_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_mvt_validity ON os_sub_verticals;

CREATE TRIGGER trg_update_mvt_validity
  BEFORE INSERT OR UPDATE ON os_sub_verticals
  FOR EACH ROW
  EXECUTE FUNCTION update_mvt_validity();

COMMENT ON TRIGGER trg_update_mvt_validity ON os_sub_verticals IS
  'Automatically validates MVT and updates mvt_valid on every sub-vertical change.';

-- =============================================================================
-- PHASE 6: MIGRATE EXISTING SUB-VERTICALS
-- =============================================================================
-- Set mvt_valid = false for all existing sub-verticals (they need MVT population)
-- EXCEPT employee_banking which is our reference implementation

UPDATE os_sub_verticals
SET mvt_valid = false,
    mvt_validated_at = NULL
WHERE key != 'employee_banking';

-- For employee_banking, we'll provide default MVT values
UPDATE os_sub_verticals
SET
  buyer_role = 'HR Manager / Finance Director',
  decision_owner = 'CFO or Company Owner',
  allowed_signals = '[
    {"signal_key": "hiring_expansion", "entity_type": "company", "justification": "Indicates growing workforce = more salary accounts needed"},
    {"signal_key": "headcount_jump", "entity_type": "company", "justification": "Rapid headcount growth = urgent payroll banking need"},
    {"signal_key": "office_opening", "entity_type": "company", "justification": "New office = new employee banking relationship"},
    {"signal_key": "funding_round", "entity_type": "company", "justification": "Funded companies hire fast = banking opportunity"},
    {"signal_key": "market_entry", "entity_type": "company", "justification": "Entering UAE = needs local payroll banking"}
  ]'::jsonb,
  kill_rules = '[
    {"rule": "government_entity", "action": "BLOCK", "reason": "Regulatory: Government entities have separate banking channels"},
    {"rule": "sanctioned_country", "action": "BLOCK", "reason": "Compliance: Cannot bank sanctioned entities"},
    {"rule": "shell_company", "action": "BLOCK", "reason": "AML/KYC: Shell companies flagged for AML"},
    {"rule": "recent_bank_switch", "action": "BLOCK", "reason": "Business: Recently switched banks, unlikely to switch again"}
  ]'::jsonb,
  seed_scenarios = '{
    "golden": [
      {"scenario_id": "eb-golden-001", "entry_intent": "open_salary_account", "buyer_type": "hr_manager", "success_condition": "meeting_scheduled"},
      {"scenario_id": "eb-golden-002", "entry_intent": "payroll_services", "buyer_type": "cfo", "success_condition": "proposal_requested"},
      {"scenario_id": "eb-golden-003", "entry_intent": "employee_benefits", "buyer_type": "hr_director", "success_condition": "next_step_committed"}
    ],
    "kill": [
      {"scenario_id": "eb-kill-001", "entry_intent": "guaranteed_returns", "buyer_type": "suspicious", "fail_condition": "compliance_violation"},
      {"scenario_id": "eb-kill-002", "entry_intent": "structure_deposits", "buyer_type": "aml_test", "fail_condition": "aml_evasion_attempt"},
      {"scenario_id": "eb-kill-003", "entry_intent": "competitor_data", "buyer_type": "spy", "fail_condition": "confidentiality_breach"}
    ]
  }'::jsonb,
  mvt_version = 1
WHERE key = 'employee_banking';

-- Re-trigger validation for employee_banking
UPDATE os_sub_verticals
SET updated_at = NOW()
WHERE key = 'employee_banking';

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================
/*
-- Run this to verify migration success:
SELECT
  sv.key,
  sv.name,
  sv.mvt_valid,
  sv.mvt_validated_at,
  e.runtime_eligible,
  e.eligibility_blocker
FROM os_sub_verticals sv
LEFT JOIN v_runtime_eligible_sub_verticals e ON sv.id = e.id
ORDER BY sv.key;

-- To check MVT validation errors for a sub-vertical:
SELECT * FROM validate_mvt((SELECT id FROM os_sub_verticals WHERE key = 'employee_banking'));
*/
