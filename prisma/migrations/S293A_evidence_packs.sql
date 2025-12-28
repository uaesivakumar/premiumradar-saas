-- S293A: Evidence Packs Database
-- Part of User & Enterprise Management Program v1.1
-- Phase C Patch - Backend & API
--
-- Database persistence for evidence packs (ranking, outreach, discovery)

-- Evidence packs table - stores serialized evidence packs per user/enterprise
CREATE TABLE IF NOT EXISTS evidence_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner context
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enterprise_id UUID REFERENCES enterprises(enterprise_id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(workspace_id) ON DELETE SET NULL,

  -- Pack type and target
  pack_type VARCHAR(50) NOT NULL CHECK (pack_type IN ('ranking', 'outreach', 'discovery')),
  target_entity VARCHAR(255) NOT NULL,  -- Company name or query
  target_type VARCHAR(50) DEFAULT 'company' CHECK (target_type IN ('company', 'sector', 'region', 'query')),

  -- Evidence data (JSONB for flexibility)
  pack_data JSONB NOT NULL,

  -- Scoring summary (denormalized for fast queries)
  overall_score NUMERIC(5,2),
  q_score NUMERIC(5,2),
  t_score NUMERIC(5,2),
  l_score NUMERIC(5,2),
  e_score NUMERIC(5,2),

  -- Metadata
  confidence NUMERIC(3,2),  -- 0.00 to 1.00
  evidence_count INTEGER DEFAULT 0,
  sources TEXT[],

  -- Lifecycle
  expires_at TIMESTAMP WITH TIME ZONE,
  is_archived BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_evidence_packs_user ON evidence_packs(user_id);
CREATE INDEX IF NOT EXISTS idx_evidence_packs_enterprise ON evidence_packs(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_evidence_packs_type ON evidence_packs(pack_type);
CREATE INDEX IF NOT EXISTS idx_evidence_packs_target ON evidence_packs(target_entity);
CREATE INDEX IF NOT EXISTS idx_evidence_packs_created ON evidence_packs(created_at DESC);

-- Composite index for user + type queries
CREATE INDEX IF NOT EXISTS idx_evidence_packs_user_type ON evidence_packs(user_id, pack_type);

-- GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_evidence_packs_data ON evidence_packs USING GIN (pack_data);

-- Evidence insights table - extracted key insights for quick access
CREATE TABLE IF NOT EXISTS evidence_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES evidence_packs(id) ON DELETE CASCADE,

  insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN (
    'key_insight', 'differentiator', 'risk',
    'why_now', 'why_this', 'why_you',
    'talking_point', 'avoid_topic',
    'match_criteria', 'signal_detected'
  )),
  insight_text TEXT NOT NULL,
  priority INTEGER DEFAULT 0,  -- Higher = more important

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_insights_pack ON evidence_insights(pack_id);
CREATE INDEX IF NOT EXISTS idx_evidence_insights_type ON evidence_insights(insight_type);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_evidence_packs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS evidence_packs_updated_at ON evidence_packs;
CREATE TRIGGER evidence_packs_updated_at
  BEFORE UPDATE ON evidence_packs
  FOR EACH ROW
  EXECUTE FUNCTION update_evidence_packs_updated_at();

-- Add comment
COMMENT ON TABLE evidence_packs IS 'S293A: Persisted evidence packs for ranking, outreach, and discovery decisions';
COMMENT ON TABLE evidence_insights IS 'S293A: Extracted insights from evidence packs for quick access';
