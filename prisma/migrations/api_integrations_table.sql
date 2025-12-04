/**
 * API Integrations Table
 *
 * Stores API keys and configuration for external data sources.
 * Managed via Super Admin panel - NO hardcoded keys in code.
 *
 * Supported integrations:
 * - Apollo: Company data, headcount, hiring signals
 * - SERP: News, hiring events, expansion signals
 * - LinkedIn (future): Profile enrichment
 * - Crunchbase (future): Funding, growth signals
 */

-- Create api_integrations table
CREATE TABLE IF NOT EXISTS api_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Integration identity
  provider VARCHAR(50) NOT NULL,  -- 'apollo', 'serp', 'linkedin', 'crunchbase'
  name VARCHAR(255) NOT NULL,     -- Human-readable name
  description TEXT,

  -- Credentials (encrypted in production)
  api_key TEXT NOT NULL,
  api_secret TEXT,  -- Optional, some APIs need key + secret

  -- Configuration
  base_url VARCHAR(500),          -- Override default API endpoint
  config JSONB NOT NULL DEFAULT '{}',  -- Provider-specific config (rate limits, etc.)

  -- Scoping
  tenant_id UUID,                 -- NULL = global, set = tenant-specific
  vertical VARCHAR(50),           -- NULL = all verticals, set = specific vertical

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,  -- Default integration for this provider

  -- Usage tracking
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  last_error_at TIMESTAMP WITH TIME ZONE,

  -- Unique constraint: one default per provider per tenant
  CONSTRAINT unique_default_integration UNIQUE (provider, tenant_id, is_default)
    DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes
CREATE INDEX idx_api_integrations_provider ON api_integrations(provider);
CREATE INDEX idx_api_integrations_active ON api_integrations(is_active) WHERE is_active = true;
CREATE INDEX idx_api_integrations_tenant ON api_integrations(tenant_id);
CREATE INDEX idx_api_integrations_default ON api_integrations(provider, is_default) WHERE is_default = true;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_api_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_api_integrations_updated_at
  BEFORE UPDATE ON api_integrations
  FOR EACH ROW EXECUTE FUNCTION update_api_integrations_updated_at();

-- Comments
COMMENT ON TABLE api_integrations IS 'API keys and configuration for external data sources (Apollo, SERP, etc.)';
COMMENT ON COLUMN api_integrations.provider IS 'Integration provider: apollo, serp, linkedin, crunchbase';
COMMENT ON COLUMN api_integrations.api_key IS 'API key - should be encrypted in production';
COMMENT ON COLUMN api_integrations.config IS 'Provider-specific config: rate limits, endpoints, etc.';
COMMENT ON COLUMN api_integrations.is_default IS 'Default integration for this provider (only one per provider per tenant)';
