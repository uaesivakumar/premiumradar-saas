-- S286: Demo Policies Table
-- Part of User & Enterprise Management Program v1.1
-- Phase B - Data Model & Migration
--
-- Creates demo_policies table for config-driven demo behavior (NO HARDCODING)

-- ============================================================
-- DEMO POLICIES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS demo_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Policy name for admin reference
  name VARCHAR(255) NOT NULL,

  -- Scope: who this policy applies to
  scope VARCHAR(30) NOT NULL CHECK (
    scope IN ('INDIVIDUAL_REAL', 'INDIVIDUAL_SYSTEM', 'ENTERPRISE')
  ),

  -- Duration limits
  max_duration_days INTEGER,
  idle_expiry_hours INTEGER,

  -- User limits
  max_users INTEGER,

  -- Action limits
  max_actions_per_day INTEGER,
  max_discoveries_per_day INTEGER,

  -- Feature limits
  allow_exports BOOLEAN DEFAULT false,
  allow_automation BOOLEAN DEFAULT false,
  allow_api_access BOOLEAN DEFAULT false,

  -- Policy metadata
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,  -- Higher = takes precedence

  -- Audit
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_demo_policies_scope ON demo_policies(scope);
CREATE INDEX IF NOT EXISTS idx_demo_policies_active ON demo_policies(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_demo_policies_priority ON demo_policies(priority DESC);

-- ============================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================

CREATE OR REPLACE FUNCTION update_demo_policies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS demo_policies_updated_at ON demo_policies;
CREATE TRIGGER demo_policies_updated_at
  BEFORE UPDATE ON demo_policies
  FOR EACH ROW EXECUTE FUNCTION update_demo_policies_updated_at();

-- ============================================================
-- DEFAULT POLICIES
-- ============================================================

INSERT INTO demo_policies (name, scope, max_duration_days, idle_expiry_hours, max_users, max_actions_per_day, allow_exports)
SELECT 'Default Individual Real', 'INDIVIDUAL_REAL', 14, 72, 1, 50, false
WHERE NOT EXISTS (SELECT 1 FROM demo_policies WHERE scope = 'INDIVIDUAL_REAL' AND name = 'Default Individual Real');

INSERT INTO demo_policies (name, scope, max_duration_days, idle_expiry_hours, max_users, max_actions_per_day, allow_exports)
SELECT 'Default Individual System', 'INDIVIDUAL_SYSTEM', NULL, NULL, 1, 1000, true
WHERE NOT EXISTS (SELECT 1 FROM demo_policies WHERE scope = 'INDIVIDUAL_SYSTEM' AND name = 'Default Individual System');

INSERT INTO demo_policies (name, scope, max_duration_days, idle_expiry_hours, max_users, max_actions_per_day, allow_exports)
SELECT 'Default Enterprise Demo', 'ENTERPRISE', 30, 168, 10, 100, false
WHERE NOT EXISTS (SELECT 1 FROM demo_policies WHERE scope = 'ENTERPRISE' AND name = 'Default Enterprise Demo');

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE demo_policies IS 'Config-driven demo policies - NO HARDCODING of demo behavior anywhere in code';
COMMENT ON COLUMN demo_policies.scope IS 'INDIVIDUAL_REAL = real self-serve user trial, INDIVIDUAL_SYSTEM = Super Admin test user, ENTERPRISE = enterprise demo';
COMMENT ON COLUMN demo_policies.idle_expiry_hours IS 'Expire demo after N hours of inactivity';
COMMENT ON COLUMN demo_policies.priority IS 'Higher priority policies override lower ones for same scope';

-- ============================================================
-- VERIFICATION
-- ============================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count FROM demo_policies;

  IF policy_count < 3 THEN
    RAISE WARNING 'Expected at least 3 default demo policies, found %', policy_count;
  END IF;

  RAISE NOTICE 'S286: demo_policies table created with % default policies', policy_count;
END $$;
