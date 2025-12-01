/**
 * Sprint S50: Journey Run History
 *
 * Database tables for storing journey execution logs, AI prompts/responses,
 * context snapshots, and errors for the Journey Execution Viewer.
 *
 * Read-only from UI perspective - written by journey-engine during execution.
 */

-- =============================================================================
-- JOURNEY RUNS (Main execution records)
-- =============================================================================

CREATE TABLE IF NOT EXISTS journey_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  workspace_id UUID,

  -- Execution status
  status VARCHAR(20) NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'success', 'failed', 'paused', 'cancelled')),

  -- Timing
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,

  -- Trigger info
  triggered_by VARCHAR(20) NOT NULL DEFAULT 'user'
    CHECK (triggered_by IN ('user', 'autonomous', 'api', 'schedule', 'webhook')),
  trigger_data JSONB,

  -- Entity being processed (if single-entity journey)
  entity_id UUID,
  entity_type VARCHAR(50),

  -- Summary (auto-generated after completion)
  summary TEXT,

  -- Input data
  input_data JSONB,

  -- Final output data
  output_data JSONB,

  -- Metrics summary
  total_steps INTEGER DEFAULT 0,
  completed_steps INTEGER DEFAULT 0,
  failed_steps INTEGER DEFAULT 0,
  skipped_steps INTEGER DEFAULT 0,
  total_duration_ms INTEGER,
  total_cost_micros BIGINT DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for journey_runs
CREATE INDEX idx_journey_runs_journey_id ON journey_runs(journey_id);
CREATE INDEX idx_journey_runs_tenant_id ON journey_runs(tenant_id);
CREATE INDEX idx_journey_runs_status ON journey_runs(status);
CREATE INDEX idx_journey_runs_started_at ON journey_runs(started_at DESC);
CREATE INDEX idx_journey_runs_triggered_by ON journey_runs(triggered_by);

-- =============================================================================
-- JOURNEY RUN STEPS (Individual step executions)
-- =============================================================================

CREATE TABLE IF NOT EXISTS journey_run_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES journey_runs(id) ON DELETE CASCADE,
  step_id VARCHAR(255) NOT NULL,
  step_name VARCHAR(255),
  step_type VARCHAR(50),

  -- Execution status
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'queued', 'running', 'completed', 'failed', 'skipped', 'waiting', 'timeout')),

  -- Timing
  queued_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,

  -- Decision info (for branching steps)
  decision JSONB,
  decision_reason TEXT,

  -- Fallback info
  fallback_strategy VARCHAR(50),
  fallback_triggered BOOLEAN DEFAULT FALSE,
  fallback_step_id VARCHAR(255),

  -- Retry info
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_retry_at TIMESTAMP WITH TIME ZONE,

  -- Input/Output data
  input_data JSONB,
  output_data JSONB,

  -- Step sequence
  execution_order INTEGER,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for journey_run_steps
CREATE INDEX idx_journey_run_steps_run_id ON journey_run_steps(run_id);
CREATE INDEX idx_journey_run_steps_step_id ON journey_run_steps(step_id);
CREATE INDEX idx_journey_run_steps_status ON journey_run_steps(status);
CREATE INDEX idx_journey_run_steps_execution_order ON journey_run_steps(run_id, execution_order);

-- =============================================================================
-- JOURNEY RUN AI LOGS (AI prompt/response history)
-- =============================================================================

CREATE TABLE IF NOT EXISTS journey_run_ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES journey_runs(id) ON DELETE CASCADE,
  step_id VARCHAR(255) NOT NULL,

  -- Template info
  template_id VARCHAR(255),
  template_version INTEGER,

  -- Prompt data
  system_prompt TEXT,
  user_prompt TEXT,
  prompt_variables JSONB,

  -- Response data
  response TEXT,
  response_parsed JSONB,

  -- Model info
  model_id VARCHAR(100),
  model_preference VARCHAR(50),

  -- Token usage
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,

  -- Cost tracking (in micros = millionths of dollar)
  cost_micros BIGINT DEFAULT 0,

  -- Timing
  latency_ms INTEGER,

  -- Decision/Outcome (for AI decision nodes)
  selected_outcome VARCHAR(255),
  confidence DECIMAL(5, 4),
  reasoning TEXT,

  -- Checkpoint info
  checkpoint_required BOOLEAN DEFAULT FALSE,
  checkpoint_id UUID,
  checkpoint_status VARCHAR(20),

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for journey_run_ai_logs
CREATE INDEX idx_journey_run_ai_logs_run_id ON journey_run_ai_logs(run_id);
CREATE INDEX idx_journey_run_ai_logs_step_id ON journey_run_ai_logs(step_id);
CREATE INDEX idx_journey_run_ai_logs_template_id ON journey_run_ai_logs(template_id);
CREATE INDEX idx_journey_run_ai_logs_created_at ON journey_run_ai_logs(created_at DESC);

-- =============================================================================
-- JOURNEY RUN CONTEXT SNAPSHOTS (Context at each step)
-- =============================================================================

CREATE TABLE IF NOT EXISTS journey_run_context_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES journey_runs(id) ON DELETE CASCADE,
  step_id VARCHAR(255) NOT NULL,

  -- Snapshot type
  snapshot_type VARCHAR(20) NOT NULL DEFAULT 'step'
    CHECK (snapshot_type IN ('start', 'step', 'decision', 'checkpoint', 'end')),

  -- Context data
  context_json JSONB NOT NULL,

  -- What changed from previous snapshot
  changes_from_previous JSONB,

  -- Data sources included
  sources_included TEXT[],

  -- Token estimate for this context
  estimated_tokens INTEGER,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for journey_run_context_snapshots
CREATE INDEX idx_journey_run_context_snapshots_run_id ON journey_run_context_snapshots(run_id);
CREATE INDEX idx_journey_run_context_snapshots_step_id ON journey_run_context_snapshots(step_id);
CREATE INDEX idx_journey_run_context_snapshots_type ON journey_run_context_snapshots(snapshot_type);

-- =============================================================================
-- JOURNEY RUN ERRORS (Error tracking)
-- =============================================================================

CREATE TABLE IF NOT EXISTS journey_run_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES journey_runs(id) ON DELETE CASCADE,
  step_id VARCHAR(255),

  -- Error details
  error_code VARCHAR(100) NOT NULL,
  error_type VARCHAR(50),
  message TEXT NOT NULL,
  stacktrace TEXT,

  -- Context when error occurred
  context_snapshot JSONB,

  -- Recovery info
  retryable BOOLEAN DEFAULT FALSE,
  recovered BOOLEAN DEFAULT FALSE,
  recovery_action VARCHAR(50),

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for journey_run_errors
CREATE INDEX idx_journey_run_errors_run_id ON journey_run_errors(run_id);
CREATE INDEX idx_journey_run_errors_step_id ON journey_run_errors(step_id);
CREATE INDEX idx_journey_run_errors_code ON journey_run_errors(error_code);
CREATE INDEX idx_journey_run_errors_created_at ON journey_run_errors(created_at DESC);

-- =============================================================================
-- JOURNEY RUN CHECKPOINTS (Human-in-the-loop checkpoints)
-- =============================================================================

CREATE TABLE IF NOT EXISTS journey_run_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES journey_runs(id) ON DELETE CASCADE,
  step_id VARCHAR(255) NOT NULL,

  -- Checkpoint status
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'skipped')),

  -- Checkpoint details
  checkpoint_type VARCHAR(50),
  risk_level VARCHAR(20),
  description TEXT,

  -- What the AI wants to do
  proposed_action JSONB,

  -- Human review
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,

  -- Expiration
  expires_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for journey_run_checkpoints
CREATE INDEX idx_journey_run_checkpoints_run_id ON journey_run_checkpoints(run_id);
CREATE INDEX idx_journey_run_checkpoints_status ON journey_run_checkpoints(status);
CREATE INDEX idx_journey_run_checkpoints_expires_at ON journey_run_checkpoints(expires_at);

-- =============================================================================
-- JOURNEY RUN TRANSITIONS (Edge traversals)
-- =============================================================================

CREATE TABLE IF NOT EXISTS journey_run_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES journey_runs(id) ON DELETE CASCADE,

  -- Transition info
  transition_id VARCHAR(255) NOT NULL,
  from_step_id VARCHAR(255) NOT NULL,
  to_step_id VARCHAR(255) NOT NULL,

  -- Evaluation
  condition_evaluated JSONB,
  condition_met BOOLEAN NOT NULL,
  evaluation_reason TEXT,

  -- Was this transition taken?
  taken BOOLEAN DEFAULT FALSE,

  evaluated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for journey_run_transitions
CREATE INDEX idx_journey_run_transitions_run_id ON journey_run_transitions(run_id);
CREATE INDEX idx_journey_run_transitions_from_step ON journey_run_transitions(from_step_id);
CREATE INDEX idx_journey_run_transitions_to_step ON journey_run_transitions(to_step_id);

-- =============================================================================
-- JOURNEY RUN OS CALLS (OS intelligence API calls)
-- =============================================================================

CREATE TABLE IF NOT EXISTS journey_run_os_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES journey_runs(id) ON DELETE CASCADE,
  step_id VARCHAR(255),

  -- API call details
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) DEFAULT 'POST',
  request_body JSONB,

  -- Response
  response_body JSONB,
  response_status INTEGER,

  -- Timing
  latency_ms INTEGER,

  -- Which OS capability was used
  os_capability VARCHAR(50),

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for journey_run_os_calls
CREATE INDEX idx_journey_run_os_calls_run_id ON journey_run_os_calls(run_id);
CREATE INDEX idx_journey_run_os_calls_endpoint ON journey_run_os_calls(endpoint);
CREATE INDEX idx_journey_run_os_calls_capability ON journey_run_os_calls(os_capability);

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Recent runs with summary stats
CREATE OR REPLACE VIEW recent_journey_runs AS
SELECT
  r.id,
  r.journey_id,
  r.tenant_id,
  r.status,
  r.triggered_by,
  r.started_at,
  r.ended_at,
  r.total_duration_ms,
  r.completed_steps,
  r.total_steps,
  r.total_cost_micros,
  r.total_tokens,
  r.summary,
  (SELECT COUNT(*) FROM journey_run_errors e WHERE e.run_id = r.id) AS error_count,
  (SELECT COUNT(*) FROM journey_run_checkpoints c WHERE c.run_id = r.id AND c.status = 'pending') AS pending_checkpoints
FROM journey_runs r
WHERE r.started_at >= NOW() - INTERVAL '7 days'
ORDER BY r.started_at DESC;

-- Run details with AI usage
CREATE OR REPLACE VIEW journey_run_ai_summary AS
SELECT
  r.id AS run_id,
  r.journey_id,
  COUNT(DISTINCT a.id) AS ai_calls,
  SUM(a.total_tokens) AS total_tokens,
  SUM(a.cost_micros) AS total_cost_micros,
  AVG(a.latency_ms) AS avg_latency_ms,
  ARRAY_AGG(DISTINCT a.model_id) AS models_used
FROM journey_runs r
LEFT JOIN journey_run_ai_logs a ON a.run_id = r.id
GROUP BY r.id, r.journey_id;

-- =============================================================================
-- UPDATE TRIGGER FOR updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION update_journey_runs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER journey_runs_updated_at
  BEFORE UPDATE ON journey_runs
  FOR EACH ROW EXECUTE FUNCTION update_journey_runs_timestamp();

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE journey_runs IS 'Sprint S50: Main journey execution records';
COMMENT ON TABLE journey_run_steps IS 'Sprint S50: Individual step execution logs';
COMMENT ON TABLE journey_run_ai_logs IS 'Sprint S50: AI prompt/response history';
COMMENT ON TABLE journey_run_context_snapshots IS 'Sprint S50: Context snapshots at each step';
COMMENT ON TABLE journey_run_errors IS 'Sprint S50: Error tracking';
COMMENT ON TABLE journey_run_checkpoints IS 'Sprint S50: Human-in-the-loop checkpoints';
COMMENT ON TABLE journey_run_transitions IS 'Sprint S50: Transition evaluations';
COMMENT ON TABLE journey_run_os_calls IS 'Sprint S50: OS intelligence API call logs';
