-- S288: Data Migration - Tenants to Enterprises
-- Part of User & Enterprise Management Program v1.1
-- Phase B - Data Model & Migration
--
-- Migrates existing tenant data into enterprises table.
-- Links users to enterprises. Creates default workspaces.

-- ============================================================
-- PRE-MIGRATION BACKUP (Record current state)
-- ============================================================

-- Create a backup table for rollback if needed
CREATE TABLE IF NOT EXISTS _migration_backup_s288 (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(50) NOT NULL,
  record_id UUID NOT NULL,
  original_data JSONB NOT NULL,
  migrated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- STEP 1: MIGRATE TENANTS TO ENTERPRISES
-- ============================================================

-- Insert tenants into enterprises (with legacy_tenant_id link for rollback)
-- Note: enterprises table uses 'status' enum and requires 'region', 'type'
INSERT INTO enterprises (
  enterprise_id,
  name,
  region,
  type,
  domain,
  plan,
  max_users,
  max_discoveries_per_month,
  status,
  metadata,
  stripe_customer_id,
  stripe_subscription_id,
  subscription_status,
  legacy_tenant_id,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),  -- New enterprise_id
  t.name,
  'UAE',  -- Default region for migrated tenants (banking focus)
  'REAL'::enterprise_type,  -- Real enterprises (not demo)
  t.domain,
  -- Map tenant plans to valid enterprise plans (free, starter, professional, enterprise)
  CASE
    WHEN t.plan IN ('free', 'starter', 'professional', 'enterprise') THEN t.plan
    WHEN t.plan = 'solo' THEN 'starter'
    WHEN t.plan = 'team' THEN 'professional'
    WHEN t.plan = 'business' THEN 'enterprise'
    ELSE 'free'
  END,
  COALESCE(t.max_users, 5),
  COALESCE(t.max_discoveries_per_month, 100),
  CASE WHEN COALESCE(t.is_active, true) THEN 'ACTIVE'::enterprise_status ELSE 'SUSPENDED'::enterprise_status END,
  COALESCE(t.metadata, '{}'),
  t.stripe_customer_id,
  t.stripe_subscription_id,
  COALESCE(t.subscription_status, 'trialing'),
  t.id,  -- Link to original tenant for migration tracking
  t.created_at,
  COALESCE(t.updated_at, NOW())
FROM tenants t
WHERE NOT EXISTS (
  -- Don't duplicate if already migrated
  SELECT 1 FROM enterprises e WHERE e.legacy_tenant_id = t.id
);

-- ============================================================
-- STEP 2: UPDATE USERS TO LINK TO ENTERPRISES
-- ============================================================

-- Update users with enterprise_id based on their tenant_id
UPDATE users u
SET enterprise_id = e.enterprise_id
FROM enterprises e
WHERE u.tenant_id IS NOT NULL
  AND e.legacy_tenant_id = u.tenant_id
  AND u.enterprise_id IS NULL;

-- ============================================================
-- STEP 3: MIGRATE USER ROLES
-- ============================================================

-- Migrate TENANT_ADMIN to ENTERPRISE_ADMIN
UPDATE users
SET role = 'ENTERPRISE_ADMIN'
WHERE role = 'TENANT_ADMIN'
  AND enterprise_id IS NOT NULL;

-- Migrate TENANT_USER to ENTERPRISE_USER
UPDATE users
SET role = 'ENTERPRISE_USER'
WHERE role = 'TENANT_USER'
  AND enterprise_id IS NOT NULL;

-- ============================================================
-- STEP 4: CREATE DEFAULT WORKSPACES
-- ============================================================

-- Create a default workspace for each enterprise that doesn't have one
-- Uses employee_banking as default sub_vertical (primary banking focus)
INSERT INTO workspaces (
  workspace_id,
  enterprise_id,
  name,
  sub_vertical_id,
  is_default,
  settings,
  created_at
)
SELECT
  gen_random_uuid(),
  e.enterprise_id,
  'Default Workspace',
  (SELECT id FROM os_sub_verticals WHERE key = 'employee_banking' LIMIT 1),
  true,
  '{}',
  NOW()
FROM enterprises e
WHERE e.legacy_tenant_id IS NOT NULL  -- Only for migrated tenants
  AND NOT EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.enterprise_id = e.enterprise_id
    AND w.is_default = true
  );

-- ============================================================
-- STEP 5: ASSIGN USERS TO DEFAULT WORKSPACES
-- ============================================================

-- Set workspace_id for users who don't have one
UPDATE users u
SET workspace_id = w.workspace_id
FROM workspaces w
WHERE u.enterprise_id IS NOT NULL
  AND u.workspace_id IS NULL
  AND w.enterprise_id = u.enterprise_id
  AND w.is_default = true;

-- ============================================================
-- VERIFICATION
-- ============================================================

DO $$
DECLARE
  migrated_enterprises INTEGER;
  users_with_enterprise INTEGER;
  users_with_new_role INTEGER;
  default_workspaces INTEGER;
BEGIN
  -- Count migrated enterprises
  SELECT COUNT(*) INTO migrated_enterprises
  FROM enterprises
  WHERE legacy_tenant_id IS NOT NULL;

  -- Count users linked to enterprises
  SELECT COUNT(*) INTO users_with_enterprise
  FROM users
  WHERE enterprise_id IS NOT NULL;

  -- Count users with new roles
  SELECT COUNT(*) INTO users_with_new_role
  FROM users
  WHERE role IN ('ENTERPRISE_ADMIN', 'ENTERPRISE_USER');

  -- Count default workspaces
  SELECT COUNT(*) INTO default_workspaces
  FROM workspaces
  WHERE is_default = true;

  RAISE NOTICE 'S288 Migration Summary:';
  RAISE NOTICE '  Enterprises migrated from tenants: %', migrated_enterprises;
  RAISE NOTICE '  Users linked to enterprises: %', users_with_enterprise;
  RAISE NOTICE '  Users with new role taxonomy: %', users_with_new_role;
  RAISE NOTICE '  Default workspaces created: %', default_workspaces;

  IF migrated_enterprises < 1 THEN
    RAISE WARNING 'No enterprises migrated - check if tenants exist';
  END IF;

  RAISE NOTICE 'S288: Data migration completed successfully';
END $$;
