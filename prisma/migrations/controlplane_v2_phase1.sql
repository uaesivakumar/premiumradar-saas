/**
 * Control Plane v2.0 - Phase 1: Database Alignment
 *
 * This migration aligns the OS Control Plane schema with v2.0 spec:
 *
 * 1.1 - Deprecate entity_type/region_scope on os_verticals (add comments)
 * 1.2 - Add primary_entity_type to os_sub_verticals (CRITICAL)
 * 1.3 - Add scope/region_code to os_personas
 * 1.4 - Add policy lifecycle status to os_persona_policies
 *
 * SAFE TO RUN MULTIPLE TIMES (uses IF NOT EXISTS / IF EXISTS patterns)
 */

-- =============================================================================
-- PHASE 1.1: DEPRECATE VERTICAL-LEVEL FIELDS
-- =============================================================================
-- Add comments to mark entity_type and region_scope as DEPRECATED
-- These fields are being moved to sub-vertical and persona levels respectively

COMMENT ON COLUMN os_verticals.entity_type IS
  'DEPRECATED (v2.0): Moving to os_sub_verticals.primary_entity_type. Do not use for new code.';

COMMENT ON COLUMN os_verticals.region_scope IS
  'DEPRECATED (v2.0): Moving to os_personas.region_code. Do not use for new code.';

-- =============================================================================
-- PHASE 1.2: UPGRADE os_sub_verticals (CRITICAL)
-- =============================================================================
-- Add primary_entity_type - this is the SINGLE MOST IMPORTANT schema correction
-- Entity type now belongs at sub-vertical level, not vertical level

-- Add primary_entity_type column
ALTER TABLE os_sub_verticals
  ADD COLUMN IF NOT EXISTS primary_entity_type VARCHAR(50);

-- Add related_entity_types array
ALTER TABLE os_sub_verticals
  ADD COLUMN IF NOT EXISTS related_entity_types TEXT[] DEFAULT '{}';

-- MIGRATE EXISTING DATA: Copy entity_type from parent vertical
UPDATE os_sub_verticals sv
SET primary_entity_type = v.entity_type
FROM os_verticals v
WHERE sv.vertical_id = v.id
  AND sv.primary_entity_type IS NULL;

-- Now make it NOT NULL after migration
ALTER TABLE os_sub_verticals
  ALTER COLUMN primary_entity_type SET NOT NULL;

-- Add check constraint for valid entity types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'valid_primary_entity_type' AND conrelid = 'os_sub_verticals'::regclass
  ) THEN
    ALTER TABLE os_sub_verticals
      ADD CONSTRAINT valid_primary_entity_type
      CHECK (primary_entity_type IN ('deal', 'company', 'individual'));
  END IF;
END $$;

COMMENT ON COLUMN os_sub_verticals.primary_entity_type IS
  'v2.0: The primary entity type this sub-vertical operates on. Drives discovery scope.';

COMMENT ON COLUMN os_sub_verticals.related_entity_types IS
  'v2.0: Additional entity types for context (e.g., company might include "individual" for contacts).';

-- =============================================================================
-- PHASE 1.3: UPGRADE os_personas
-- =============================================================================
-- Add scope (LOCAL/REGIONAL/GLOBAL) and region_code for persona inheritance

-- Add scope column with default LOCAL
ALTER TABLE os_personas
  ADD COLUMN IF NOT EXISTS scope VARCHAR(20) DEFAULT 'LOCAL';

-- Add region_code column
ALTER TABLE os_personas
  ADD COLUMN IF NOT EXISTS region_code VARCHAR(20);

-- Add check constraint for valid scope values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'valid_persona_scope' AND conrelid = 'os_personas'::regclass
  ) THEN
    ALTER TABLE os_personas
      ADD CONSTRAINT valid_persona_scope
      CHECK (scope IN ('LOCAL', 'REGIONAL', 'GLOBAL'));
  END IF;
END $$;

-- Migrate existing personas: set to GLOBAL since they were the only ones
UPDATE os_personas
SET scope = 'GLOBAL', region_code = NULL
WHERE scope IS NULL OR scope = 'LOCAL';

COMMENT ON COLUMN os_personas.scope IS
  'v2.0: Persona scope for inheritance. LOCAL = specific region, REGIONAL = region family, GLOBAL = default fallback.';

COMMENT ON COLUMN os_personas.region_code IS
  'v2.0: Region code for LOCAL/REGIONAL personas. NULL for GLOBAL scope.';

-- =============================================================================
-- PHASE 1.4: UPGRADE os_persona_policies
-- =============================================================================
-- Add policy lifecycle status (DRAFT → STAGED → ACTIVE → DEPRECATED)

-- Add status column with default ACTIVE (existing policies are active)
ALTER TABLE os_persona_policies
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';

-- Add check constraint for valid status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'valid_policy_status' AND conrelid = 'os_persona_policies'::regclass
  ) THEN
    ALTER TABLE os_persona_policies
      ADD CONSTRAINT valid_policy_status
      CHECK (status IN ('DRAFT', 'STAGED', 'ACTIVE', 'DEPRECATED'));
  END IF;
END $$;

-- Add staged_at and activated_at timestamps for lifecycle tracking
ALTER TABLE os_persona_policies
  ADD COLUMN IF NOT EXISTS staged_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE os_persona_policies
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE os_persona_policies
  ADD COLUMN IF NOT EXISTS deprecated_at TIMESTAMP WITH TIME ZONE;

-- Set activated_at for existing ACTIVE policies
UPDATE os_persona_policies
SET activated_at = created_at
WHERE status = 'ACTIVE' AND activated_at IS NULL;

COMMENT ON COLUMN os_persona_policies.status IS
  'v2.0: Policy lifecycle status. DRAFT (editing) → STAGED (testing) → ACTIVE (production) → DEPRECATED (archived).';

COMMENT ON COLUMN os_persona_policies.staged_at IS
  'v2.0: When the policy was moved to STAGED status for testing.';

COMMENT ON COLUMN os_persona_policies.activated_at IS
  'v2.0: When the policy was moved to ACTIVE status for production.';

COMMENT ON COLUMN os_persona_policies.deprecated_at IS
  'v2.0: When the policy was deprecated.';

-- =============================================================================
-- INDEXES FOR NEW COLUMNS
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_os_sub_verticals_entity_type
  ON os_sub_verticals(primary_entity_type);

CREATE INDEX IF NOT EXISTS idx_os_personas_scope
  ON os_personas(scope);

CREATE INDEX IF NOT EXISTS idx_os_personas_region
  ON os_personas(region_code) WHERE region_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_os_persona_policies_status
  ON os_persona_policies(status);

-- =============================================================================
-- VERIFICATION QUERY (for manual check after migration)
-- =============================================================================
-- Run this to verify migration success:
/*
SELECT
  'os_sub_verticals' as table_name,
  COUNT(*) as total,
  COUNT(primary_entity_type) as with_entity_type
FROM os_sub_verticals

UNION ALL

SELECT
  'os_personas' as table_name,
  COUNT(*) as total,
  COUNT(scope) as with_scope
FROM os_personas

UNION ALL

SELECT
  'os_persona_policies' as table_name,
  COUNT(*) as total,
  COUNT(status) as with_status
FROM os_persona_policies;
*/
