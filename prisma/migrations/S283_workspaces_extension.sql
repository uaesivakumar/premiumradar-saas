-- S283: Workspaces Table Extension
-- Part of User & Enterprise Management Program v1.1
-- Phase B - Data Model & Migration
--
-- DISCOVERY: workspaces table already exists with basic schema.
-- This migration EXTENDS the existing table with additional columns per spec.

-- ============================================================
-- EXTEND WORKSPACES TABLE
-- ============================================================

-- Add slug column for URL-friendly identifier
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS slug VARCHAR(100);

-- Add is_default flag (one default workspace per enterprise)
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Add settings JSON column for flexible configuration
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- Add updated_at column if missing
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================================
-- INDEXES
-- ============================================================

-- Index for default workspace lookup
CREATE INDEX IF NOT EXISTS idx_workspaces_default ON workspaces(enterprise_id, is_default) WHERE is_default = true;

-- Index for slug lookup
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug) WHERE slug IS NOT NULL;

-- ============================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================

CREATE OR REPLACE FUNCTION update_workspaces_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS workspaces_updated_at_trigger ON workspaces;
CREATE TRIGGER workspaces_updated_at_trigger
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_workspaces_updated_at();

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON COLUMN workspaces.slug IS 'URL-friendly workspace identifier';
COMMENT ON COLUMN workspaces.is_default IS 'True if this is the default workspace for the enterprise';
COMMENT ON COLUMN workspaces.settings IS 'Workspace-specific settings and configuration';

-- ============================================================
-- VERIFICATION
-- ============================================================

DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'workspaces';

  -- Verify key columns exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'is_default') THEN
    RAISE EXCEPTION 'workspaces.is_default column missing';
  END IF;

  RAISE NOTICE 'S283: workspaces table extended successfully with % columns', col_count;
END $$;
