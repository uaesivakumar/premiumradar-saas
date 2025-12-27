-- S282: Enterprises Table Extension
-- Part of User & Enterprise Management Program v1.1
-- Phase B - Data Model & Migration
--
-- DISCOVERY: enterprises table already exists with basic schema.
-- This migration EXTENDS the existing table with additional columns.

-- ============================================================
-- EXTEND ENTERPRISES TABLE
-- ============================================================

-- Add domain column
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS domain VARCHAR(255);

-- Add industry column
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS industry VARCHAR(100);

-- Add plan column (for billing tiers)
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS plan VARCHAR(50)
  CHECK (plan IN ('free', 'starter', 'professional', 'enterprise'));

-- Add Stripe billing columns
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50);

-- Add limit columns
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 3;
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS max_workspaces INTEGER DEFAULT 1;
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS max_discoveries_per_month INTEGER DEFAULT 100;

-- Add demo expiry column
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS demo_expires_at TIMESTAMP WITH TIME ZONE;

-- Add metadata column
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add updated_at column if missing
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add legacy tenant link for migration
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS legacy_tenant_id UUID UNIQUE;

-- ============================================================
-- ADDITIONAL INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_enterprises_domain ON enterprises(domain) WHERE domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_enterprises_plan ON enterprises(plan) WHERE plan IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_enterprises_legacy_tenant ON enterprises(legacy_tenant_id) WHERE legacy_tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_enterprises_demo_expiry ON enterprises(demo_expires_at) WHERE demo_expires_at IS NOT NULL;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE enterprises IS 'Enterprise entities - extended for User & Enterprise Management Program v1.1';
COMMENT ON COLUMN enterprises.domain IS 'Enterprise email domain for SSO/verification';
COMMENT ON COLUMN enterprises.plan IS 'Billing plan: free, starter, professional, enterprise';
COMMENT ON COLUMN enterprises.legacy_tenant_id IS 'Link to original tenant for migration - will be removed after cutover';
COMMENT ON COLUMN enterprises.demo_expires_at IS 'When demo enterprise expires. NULL for REAL enterprises.';

-- ============================================================
-- VERIFICATION
-- ============================================================

DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'enterprises';

  IF col_count < 15 THEN
    RAISE WARNING 'enterprises table has % columns, expected at least 15', col_count;
  END IF;

  -- Verify key columns exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enterprises' AND column_name = 'plan') THEN
    RAISE EXCEPTION 'enterprises.plan column missing';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enterprises' AND column_name = 'demo_expires_at') THEN
    RAISE EXCEPTION 'enterprises.demo_expires_at column missing';
  END IF;

  RAISE NOTICE 'S282: enterprises table extended successfully with % columns', col_count;
END $$;
