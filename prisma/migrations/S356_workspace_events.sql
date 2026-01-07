-- S356: Workspace Events Table
-- Behavior Contract B007: User feedback captured as event
--
-- Stores all workspace intelligence events for the learning loop.
-- Events are immutable after creation.

-- Create workspace_events table
CREATE TABLE IF NOT EXISTS workspace_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  workspace_id UUID,
  entity_type VARCHAR(20) NOT NULL,
  entity_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT fk_workspace_events_tenant FOREIGN KEY (tenant_id)
    REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_workspace_events_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_workspace_events_tenant_type
  ON workspace_events(tenant_id, event_type);

CREATE INDEX IF NOT EXISTS idx_workspace_events_entity
  ON workspace_events(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_workspace_events_created
  ON workspace_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workspace_events_user
  ON workspace_events(user_id, created_at DESC);

-- Feedback events index for learning queries
CREATE INDEX IF NOT EXISTS idx_workspace_events_feedback
  ON workspace_events(tenant_id, created_at DESC)
  WHERE event_type IN ('LEAD_APPROVED', 'LEAD_REJECTED', 'LEAD_SNOOZED',
                       'NBA_ACCEPTED', 'NBA_DISMISSED', 'DEAL_WON', 'DEAL_LOST');

-- Prevent updates to events (immutability)
CREATE OR REPLACE FUNCTION prevent_workspace_event_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Workspace events are immutable and cannot be modified';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_prevent_workspace_event_update ON workspace_events;
CREATE TRIGGER tr_prevent_workspace_event_update
  BEFORE UPDATE ON workspace_events
  FOR EACH ROW
  EXECUTE FUNCTION prevent_workspace_event_modification();

-- Comment
COMMENT ON TABLE workspace_events IS 'S356: Immutable event log for workspace intelligence learning loop';
