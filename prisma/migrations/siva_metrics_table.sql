/**
 * SIVA Metrics Table
 *
 * Tracks every AI/API call for the SIVA Intelligence Dashboard.
 * Enables Bloomberg-style monitoring of AI performance over time.
 *
 * Metrics tracked:
 * - Provider (openai, apollo, serp)
 * - Token usage (input/output)
 * - Cost per call
 * - Response time
 * - Success/failure status
 * - Quality signals (when available)
 */

-- Create siva_metrics table
CREATE TABLE IF NOT EXISTS siva_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Call identification
  provider VARCHAR(50) NOT NULL,           -- 'openai', 'apollo', 'serp'
  operation VARCHAR(100) NOT NULL,         -- 'enrichment', 'signal_detection', 'persona_match', etc.
  integration_id UUID REFERENCES api_integrations(id),

  -- Context
  tenant_id UUID,                          -- Which tenant triggered this call
  user_id UUID,                            -- Which user triggered this call
  vertical VARCHAR(50),                    -- 'banking', 'insurance', etc.
  sub_vertical VARCHAR(100),               -- 'employee-banking', etc.

  -- Request details
  request_type VARCHAR(100),               -- 'chat_completion', 'people_search', 'news_search'
  model VARCHAR(100),                      -- 'gpt-4', 'gpt-3.5-turbo', etc. (for OpenAI)

  -- Token usage (primarily for LLM calls)
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,

  -- Cost tracking (in cents to avoid float issues)
  cost_cents INTEGER DEFAULT 0,            -- Cost in cents (e.g., 150 = $1.50)

  -- Performance
  response_time_ms INTEGER,                -- How long the API call took

  -- Status
  success BOOLEAN NOT NULL DEFAULT true,
  error_code VARCHAR(100),
  error_message TEXT,

  -- Quality signals (for scoring SIVA's performance)
  quality_score DECIMAL(5,2),              -- 0-100 quality score if available
  accuracy_score DECIMAL(5,2),             -- 0-100 accuracy if verifiable
  user_feedback INTEGER,                   -- 1-5 star rating if user provides

  -- Raw data (for debugging/analysis)
  request_summary TEXT,                    -- Brief summary of what was requested
  response_summary TEXT,                   -- Brief summary of what was returned
  metadata JSONB DEFAULT '{}'              -- Additional provider-specific data
);

-- Create indexes for efficient querying
CREATE INDEX idx_siva_metrics_created_at ON siva_metrics(created_at DESC);
CREATE INDEX idx_siva_metrics_provider ON siva_metrics(provider);
CREATE INDEX idx_siva_metrics_operation ON siva_metrics(operation);
CREATE INDEX idx_siva_metrics_tenant ON siva_metrics(tenant_id);
CREATE INDEX idx_siva_metrics_success ON siva_metrics(success);
CREATE INDEX idx_siva_metrics_date ON siva_metrics(DATE(created_at));

-- Composite indexes for common dashboard queries
CREATE INDEX idx_siva_metrics_provider_date ON siva_metrics(provider, DATE(created_at));
CREATE INDEX idx_siva_metrics_daily_stats ON siva_metrics(DATE(created_at), provider, success);

-- Comments
COMMENT ON TABLE siva_metrics IS 'Tracks all SIVA AI/API calls for the Intelligence Dashboard';
COMMENT ON COLUMN siva_metrics.provider IS 'API provider: openai, apollo, serp';
COMMENT ON COLUMN siva_metrics.operation IS 'Type of operation: enrichment, signal_detection, etc.';
COMMENT ON COLUMN siva_metrics.cost_cents IS 'Cost in cents (150 = $1.50) to avoid float precision issues';
COMMENT ON COLUMN siva_metrics.quality_score IS 'Quality score 0-100 based on output evaluation';
COMMENT ON COLUMN siva_metrics.user_feedback IS 'User satisfaction rating 1-5 stars';

-- Create view for daily aggregations (for dashboard)
CREATE OR REPLACE VIEW siva_daily_stats AS
SELECT
  DATE(created_at) as date,
  provider,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE success = true) as successful_calls,
  COUNT(*) FILTER (WHERE success = false) as failed_calls,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens,
  SUM(cost_cents) as total_cost_cents,
  AVG(response_time_ms) as avg_response_time_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) as p95_response_time_ms,
  AVG(quality_score) FILTER (WHERE quality_score IS NOT NULL) as avg_quality_score,
  AVG(accuracy_score) FILTER (WHERE accuracy_score IS NOT NULL) as avg_accuracy_score,
  AVG(user_feedback) FILTER (WHERE user_feedback IS NOT NULL) as avg_user_feedback
FROM siva_metrics
GROUP BY DATE(created_at), provider
ORDER BY DATE(created_at) DESC, provider;

COMMENT ON VIEW siva_daily_stats IS 'Pre-aggregated daily statistics for SIVA dashboard';
