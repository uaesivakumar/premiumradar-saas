-- S270: DB-Level Idempotent Activation Guard
--
-- This migration adds a UNIQUE constraint to guarantee exactly-once activation.
-- The resolver code-level check is necessary but not sufficient.
-- The DB MUST be the final arbiter of idempotency.
--
-- CONSTRAINT: Only ONE active binding per (persona_id, tenant_id) combination.

-- ============================================================
-- STEP 1: Check for existing duplicates (FAIL LOUDLY)
-- ============================================================

DO $$
DECLARE
  duplicate_count INTEGER;
  duplicate_info TEXT;
BEGIN
  -- Count duplicates
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT persona_id, tenant_id, COUNT(*) as cnt
    FROM os_workspace_bindings
    WHERE is_active = true
      AND persona_id IS NOT NULL
      AND tenant_id IS NOT NULL
    GROUP BY persona_id, tenant_id
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_count > 0 THEN
    -- Log duplicate info before failing
    SELECT string_agg(
      'persona_id=' || persona_id::text || ', tenant_id=' || tenant_id::text || ', count=' || cnt::text,
      '; '
    ) INTO duplicate_info
    FROM (
      SELECT persona_id, tenant_id, COUNT(*) as cnt
      FROM os_workspace_bindings
      WHERE is_active = true
        AND persona_id IS NOT NULL
        AND tenant_id IS NOT NULL
      GROUP BY persona_id, tenant_id
      HAVING COUNT(*) > 1
    ) duplicates;

    RAISE EXCEPTION 'S270 BLOCKED: Found % duplicate active bindings. Manual cleanup required. Duplicates: %',
      duplicate_count, duplicate_info;
  END IF;

  RAISE NOTICE 'S270: No duplicate bindings found. Proceeding with UNIQUE constraint.';
END $$;

-- ============================================================
-- STEP 2: Create partial UNIQUE index
-- ============================================================
-- This ensures exactly ONE active binding per (persona_id, tenant_id).
-- Inactive bindings are not constrained (historical records allowed).

CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_bindings_idempotent
  ON os_workspace_bindings (persona_id, tenant_id)
  WHERE is_active = true
    AND persona_id IS NOT NULL
    AND tenant_id IS NOT NULL;

-- ============================================================
-- STEP 3: Add constraint comment for documentation
-- ============================================================

COMMENT ON INDEX idx_workspace_bindings_idempotent IS
  'S270: Guarantees exactly-once activation per (persona_id, tenant_id). The DB is the final arbiter of idempotency.';

-- ============================================================
-- VERIFICATION QUERY (for manual inspection)
-- ============================================================
-- Run this after migration to verify:
--
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'os_workspace_bindings'
--   AND indexname = 'idx_workspace_bindings_idempotent';
