-- S285: Role Taxonomy Update
-- Part of User & Enterprise Management Program v1.1
-- Phase B - Data Model & Migration
--
-- Updates role CHECK constraint to include new enterprise roles.

-- ============================================================
-- UPDATE ROLE CONSTRAINT
-- ============================================================

-- Step 1: Drop existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 2: Add new constraint with ALL roles (old + new)
-- Keep old roles during migration for backward compatibility
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (
  role IN (
    -- New roles (spec v1.1)
    'SUPER_ADMIN',
    'ENTERPRISE_ADMIN',
    'ENTERPRISE_USER',
    'INDIVIDUAL_USER',
    -- Legacy roles (keep during migration)
    'TENANT_ADMIN',
    'TENANT_USER',
    'READ_ONLY'
  )
);

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON COLUMN users.role IS 'User role: SUPER_ADMIN (global), ENTERPRISE_ADMIN (enterprise), ENTERPRISE_USER (workspace), INDIVIDUAL_USER (personal). Legacy: TENANT_ADMIN, TENANT_USER, READ_ONLY';

-- ============================================================
-- VERIFICATION
-- ============================================================

DO $$
BEGIN
  -- Verify constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_role_check'
    AND table_name = 'users'
  ) THEN
    RAISE EXCEPTION 'users_role_check constraint missing';
  END IF;

  RAISE NOTICE 'S285: role taxonomy updated successfully';
END $$;
