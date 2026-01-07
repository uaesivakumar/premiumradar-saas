-- S357: Confidence Tracking Schema
-- Behavior Contract B008: Confidence score updated from feedback
--
-- Tracks confidence scores for various entities based on user feedback.
-- Confidence updates are immutable (append-only log).

-- Confidence scores table
CREATE TABLE IF NOT EXISTS entity_confidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  entity_type VARCHAR(30) NOT NULL,  -- 'COMPANY', 'SIGNAL', 'ENRICHMENT', 'PATTERN'
  entity_id VARCHAR(255) NOT NULL,   -- The entity being tracked
  confidence_score DECIMAL(5,4) NOT NULL DEFAULT 0.5,  -- 0.0000 to 1.0000
  positive_signals INTEGER DEFAULT 0,
  negative_signals INTEGER DEFAULT 0,
  total_interactions INTEGER DEFAULT 0,
  last_feedback_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign key
  CONSTRAINT fk_entity_confidence_tenant FOREIGN KEY (tenant_id)
    REFERENCES tenants(id) ON DELETE CASCADE,

  -- Unique constraint
  CONSTRAINT uq_entity_confidence_entity UNIQUE (tenant_id, entity_type, entity_id)
);

-- Confidence history (append-only log)
CREATE TABLE IF NOT EXISTS confidence_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_confidence_id UUID NOT NULL,
  previous_score DECIMAL(5,4) NOT NULL,
  new_score DECIMAL(5,4) NOT NULL,
  delta DECIMAL(5,4) NOT NULL,
  trigger_event_id UUID,  -- Reference to workspace_events
  trigger_reason VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign key
  CONSTRAINT fk_confidence_history_entity FOREIGN KEY (entity_confidence_id)
    REFERENCES entity_confidence(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_entity_confidence_tenant_type
  ON entity_confidence(tenant_id, entity_type);

CREATE INDEX IF NOT EXISTS idx_entity_confidence_score
  ON entity_confidence(tenant_id, confidence_score DESC);

CREATE INDEX IF NOT EXISTS idx_confidence_history_entity
  ON confidence_history(entity_confidence_id, created_at DESC);

-- Prevent deletion of confidence history (immutability)
CREATE OR REPLACE FUNCTION prevent_confidence_history_deletion()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Confidence history is immutable and cannot be deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_prevent_confidence_history_delete ON confidence_history;
CREATE TRIGGER tr_prevent_confidence_history_delete
  BEFORE DELETE ON confidence_history
  FOR EACH ROW
  EXECUTE FUNCTION prevent_confidence_history_deletion();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_entity_confidence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_entity_confidence_updated_at ON entity_confidence;
CREATE TRIGGER tr_entity_confidence_updated_at
  BEFORE UPDATE ON entity_confidence
  FOR EACH ROW
  EXECUTE FUNCTION update_entity_confidence_timestamp();

-- Comments
COMMENT ON TABLE entity_confidence IS 'S357: Entity confidence scores updated by learning loop';
COMMENT ON TABLE confidence_history IS 'S357: Immutable history of confidence score changes';
