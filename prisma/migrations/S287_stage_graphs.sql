-- S287: Stage Graphs Table (Minimal Schema)
-- Part of User & Enterprise Management Program v1.1
-- Phase B - Data Model & Migration
--
-- Creates os_stage_graphs table for demo stage persistence.
-- This is MINIMAL schema only - full implementation comes in Phase E.

-- ============================================================
-- OS STAGE GRAPHS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS os_stage_graphs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  enterprise_id UUID NOT NULL,
  user_id UUID NOT NULL,

  -- Graph identification
  graph_key VARCHAR(100) NOT NULL,
  graph_version INTEGER DEFAULT 1,

  -- Stage data
  current_stage VARCHAR(100) NOT NULL,
  stage_data JSONB DEFAULT '{}',

  -- History (for replay/audit)
  stage_history JSONB DEFAULT '[]',

  -- Metadata
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT fk_stage_graphs_enterprise FOREIGN KEY (enterprise_id)
    REFERENCES enterprises(enterprise_id) ON DELETE CASCADE,
  CONSTRAINT fk_stage_graphs_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Partial unique index: one active graph per user per key
CREATE UNIQUE INDEX IF NOT EXISTS uq_stage_graphs_user_key
  ON os_stage_graphs(user_id, graph_key)
  WHERE is_active = true;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_stage_graphs_enterprise ON os_stage_graphs(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_stage_graphs_user ON os_stage_graphs(user_id);
CREATE INDEX IF NOT EXISTS idx_stage_graphs_key ON os_stage_graphs(graph_key);
CREATE INDEX IF NOT EXISTS idx_stage_graphs_active ON os_stage_graphs(is_active) WHERE is_active = true;

-- ============================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================

CREATE OR REPLACE FUNCTION update_stage_graphs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS stage_graphs_updated_at ON os_stage_graphs;
CREATE TRIGGER stage_graphs_updated_at
  BEFORE UPDATE ON os_stage_graphs
  FOR EACH ROW EXECUTE FUNCTION update_stage_graphs_updated_at();

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE os_stage_graphs IS 'Persisted stage graphs for demo/onboarding flows';
COMMENT ON COLUMN os_stage_graphs.graph_key IS 'Identifies the type of flow (e.g., demo_onboarding, eb_discovery)';
COMMENT ON COLUMN os_stage_graphs.current_stage IS 'Current stage in the flow';
COMMENT ON COLUMN os_stage_graphs.stage_data IS 'Data accumulated at current stage';
COMMENT ON COLUMN os_stage_graphs.stage_history IS 'Array of previous stage transitions for audit';

-- ============================================================
-- VERIFICATION
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'os_stage_graphs') THEN
    RAISE EXCEPTION 'os_stage_graphs table missing';
  END IF;

  RAISE NOTICE 'S287: os_stage_graphs table created successfully';
END $$;
