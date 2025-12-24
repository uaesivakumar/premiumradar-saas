/**
 * S261: DATA FOUNDATION - Business Events & Workspace State
 * Sprint: S261
 * Authorization: BTE/User Management Implementation Plan
 *
 * Creates immutable event tables for behavioral telemetry:
 * - business_events: Immutable business events (INSERT ONLY)
 * - user_actions: User action tracking
 * - workspace_state: Current workspace state
 *
 * GUARDRAILS:
 * - business_events is IMMUTABLE (no updates, no deletes)
 * - Columns match contract EXACTLY (no extra fields)
 * - Extra data goes in metadata jsonb
 */

-- ============================================================
-- BUSINESS_EVENTS TABLE (IMMUTABLE)
-- ============================================================

CREATE TABLE IF NOT EXISTS business_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  sub_vertical_id UUID NOT NULL,
  actor_user_id UUID NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for replay & aggregation
CREATE INDEX idx_business_events_workspace_ts ON business_events(workspace_id, timestamp);
CREATE INDEX idx_business_events_subvertical_ts ON business_events(sub_vertical_id, timestamp);
CREATE INDEX idx_business_events_actor_ts ON business_events(actor_user_id, timestamp);
CREATE INDEX idx_business_events_entity ON business_events(entity_type, entity_id);

-- Comments
COMMENT ON TABLE business_events IS 'Immutable business event store. INSERT ONLY - no updates or deletes permitted.';
COMMENT ON COLUMN business_events.event_type IS 'Type of event (e.g., discovery_started, lead_contacted, deal_closed)';
COMMENT ON COLUMN business_events.entity_type IS 'Type of entity involved (e.g., lead, deal, company)';
COMMENT ON COLUMN business_events.metadata IS 'Additional event data - use this for extra fields instead of adding columns';

-- ============================================================
-- IMMUTABILITY TRIGGER FOR BUSINESS_EVENTS
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_business_events_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'business_events table is immutable. UPDATE and DELETE operations are not permitted.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Block UPDATE
CREATE TRIGGER trigger_business_events_no_update
  BEFORE UPDATE ON business_events
  FOR EACH ROW EXECUTE FUNCTION prevent_business_events_mutation();

-- Block DELETE
CREATE TRIGGER trigger_business_events_no_delete
  BEFORE DELETE ON business_events
  FOR EACH ROW EXECUTE FUNCTION prevent_business_events_mutation();

-- ============================================================
-- USER_ACTIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS user_actions (
  action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  workspace_id UUID NOT NULL,
  actor_user_id UUID NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for replay & aggregation
CREATE INDEX idx_user_actions_workspace_ts ON user_actions(workspace_id, timestamp);
CREATE INDEX idx_user_actions_actor_ts ON user_actions(actor_user_id, timestamp);

-- Comments
COMMENT ON TABLE user_actions IS 'User action tracking for behavioral telemetry';
COMMENT ON COLUMN user_actions.action_type IS 'Type of action (e.g., button_click, page_view, form_submit)';
COMMENT ON COLUMN user_actions.metadata IS 'Additional action data';

-- ============================================================
-- WORKSPACE_STATE TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS workspace_state (
  workspace_id UUID PRIMARY KEY,
  current_sales_stage TEXT,
  pending_actions JSONB DEFAULT '[]'::jsonb,
  last_recommendation_id UUID,
  last_action_taken_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE workspace_state IS 'Current state of each workspace for NBA context';
COMMENT ON COLUMN workspace_state.current_sales_stage IS 'Current stage in sales pipeline';
COMMENT ON COLUMN workspace_state.pending_actions IS 'Array of pending recommended actions';
COMMENT ON COLUMN workspace_state.last_recommendation_id IS 'ID of last NBA recommendation';

-- Update trigger for workspace_state
CREATE OR REPLACE FUNCTION update_workspace_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_workspace_state_updated_at
  BEFORE UPDATE ON workspace_state
  FOR EACH ROW EXECUTE FUNCTION update_workspace_state_timestamp();

-- ============================================================
-- VALIDATION QUERIES (Run after migration)
-- ============================================================

-- A) Confirm tables exist + columns correct:
--    \d+ business_events
--    \d+ user_actions
--    \d+ workspace_state

-- B) Confirm immutability on business_events:
--    UPDATE business_events SET event_type='x' WHERE 1=0; -- Should fail
--    DELETE FROM business_events WHERE 1=0; -- Should fail

-- C) Confirm indexes exist:
--    \di *business_events*
--    \di *user_actions*

-- D) Deterministic replay test:
--    Insert 3 events with known timestamps
--    Query by (workspace_id, timestamp)
--    Confirm order is stable and exact
