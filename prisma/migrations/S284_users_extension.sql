-- S284: Users Table Extension
-- Part of User & Enterprise Management Program v1.1
-- Phase B - Data Model & Migration
--
-- Adds enterprise_id, workspace_id, and demo-related columns to users table.

-- ============================================================
-- EXTEND USERS TABLE
-- ============================================================

-- Add enterprise_id foreign key (nullable for migration)
ALTER TABLE users ADD COLUMN IF NOT EXISTS enterprise_id UUID;

-- Add workspace_id foreign key (nullable for migration)
ALTER TABLE users ADD COLUMN IF NOT EXISTS workspace_id UUID;

-- Add demo flag
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Add demo type (SYSTEM or ENTERPRISE)
ALTER TABLE users ADD COLUMN IF NOT EXISTS demo_type VARCHAR(20)
  CHECK (demo_type IS NULL OR demo_type IN ('SYSTEM', 'ENTERPRISE'));

-- Add demo expiry
ALTER TABLE users ADD COLUMN IF NOT EXISTS demo_expires_at TIMESTAMP WITH TIME ZONE;

-- ============================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================

-- Add FK to enterprises (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_enterprise_id_fkey'
    AND table_name = 'users'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_enterprise_id_fkey
      FOREIGN KEY (enterprise_id)
      REFERENCES enterprises(enterprise_id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Add FK to workspaces (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_workspace_id_fkey'
    AND table_name = 'users'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_workspace_id_fkey
      FOREIGN KEY (workspace_id)
      REFERENCES workspaces(workspace_id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_enterprise_id ON users(enterprise_id) WHERE enterprise_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_workspace_id ON users(workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_is_demo ON users(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_users_demo_expiry ON users(demo_expires_at) WHERE demo_expires_at IS NOT NULL;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON COLUMN users.enterprise_id IS 'Enterprise this user belongs to (NULL for INDIVIDUAL_USER)';
COMMENT ON COLUMN users.workspace_id IS 'Workspace this user is assigned to';
COMMENT ON COLUMN users.is_demo IS 'True if this is a demo user';
COMMENT ON COLUMN users.demo_type IS 'SYSTEM = Super Admin demo, ENTERPRISE = Enterprise demo';
COMMENT ON COLUMN users.demo_expires_at IS 'When demo user expires';

-- ============================================================
-- VERIFICATION
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'enterprise_id') THEN
    RAISE EXCEPTION 'users.enterprise_id column missing';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_demo') THEN
    RAISE EXCEPTION 'users.is_demo column missing';
  END IF;

  RAISE NOTICE 'S284: users table extended successfully';
END $$;
