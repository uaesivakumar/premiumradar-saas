-- S359: NBA Tracking Schema
-- Behavior Contract B010: Single NBA selected per context
--
-- Tracks NBA selections and outcomes for learning.

-- NBA selections table
CREATE TABLE IF NOT EXISTS nba_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  lead_id UUID,
  nba_type VARCHAR(30) NOT NULL,
  nba_score DECIMAL(8,4),
  urgency VARCHAR(20),
  candidates_evaluated INTEGER DEFAULT 0,
  outcome VARCHAR(20),  -- 'completed', 'dismissed', 'deferred', 'expired'
  selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Foreign keys
  CONSTRAINT fk_nba_selections_tenant FOREIGN KEY (tenant_id)
    REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_nba_selections_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for queries
CREATE INDEX IF NOT EXISTS idx_nba_selections_tenant_user
  ON nba_selections(tenant_id, user_id, selected_at DESC);

CREATE INDEX IF NOT EXISTS idx_nba_selections_lead
  ON nba_selections(lead_id, selected_at DESC);

CREATE INDEX IF NOT EXISTS idx_nba_selections_outcome
  ON nba_selections(tenant_id, outcome, selected_at DESC);

-- NBA effectiveness metrics view
CREATE OR REPLACE VIEW nba_effectiveness AS
SELECT
  tenant_id,
  nba_type,
  COUNT(*) as total_presented,
  COUNT(*) FILTER (WHERE outcome = 'completed') as completed,
  COUNT(*) FILTER (WHERE outcome = 'dismissed') as dismissed,
  COUNT(*) FILTER (WHERE outcome = 'deferred') as deferred,
  ROUND(
    COUNT(*) FILTER (WHERE outcome = 'completed')::numeric /
    NULLIF(COUNT(*), 0) * 100, 2
  ) as completion_rate,
  AVG(nba_score) as avg_score,
  AVG(candidates_evaluated) as avg_candidates
FROM nba_selections
WHERE selected_at > NOW() - INTERVAL '30 days'
GROUP BY tenant_id, nba_type;

-- Comment
COMMENT ON TABLE nba_selections IS 'S359: Tracks NBA selections and outcomes for learning';
COMMENT ON VIEW nba_effectiveness IS 'S359: NBA effectiveness metrics by type';
