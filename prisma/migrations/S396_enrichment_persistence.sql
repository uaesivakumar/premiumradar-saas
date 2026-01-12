-- S396: Enrichment Persistence
-- Persist enriched contacts to database so they survive server restarts
-- Pay Apollo once, use contacts forever

-- =============================================================================
-- ENRICHMENT SESSIONS TABLE
-- =============================================================================
-- Tracks each enrichment operation for a company

CREATE TABLE IF NOT EXISTS enrichment_sessions (
  id TEXT PRIMARY KEY,                    -- enr_timestamp_random
  entity_id TEXT NOT NULL,                -- Company ID being enriched
  entity_name TEXT NOT NULL,              -- Company name
  user_id TEXT NOT NULL,                  -- User who triggered enrichment
  tenant_id TEXT NOT NULL,                -- Tenant context
  workspace_id TEXT,                      -- Optional workspace context

  -- Stage tracking
  stage TEXT NOT NULL DEFAULT 'CONTACT_DISCOVERY_STARTED',
  -- Stages: CONTACT_DISCOVERY_STARTED, CONTACT_DISCOVERY_COMPLETE,
  --         SCORING_STARTED, SCORING_COMPLETE, FAILED

  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Error tracking
  error TEXT,

  -- Metrics
  contacts_found INTEGER DEFAULT 0,
  contacts_scored INTEGER DEFAULT 0,
  provider_calls INTEGER DEFAULT 0,
  total_cost_cents INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for looking up sessions by entity (most common query)
CREATE INDEX IF NOT EXISTS idx_enrichment_sessions_entity
  ON enrichment_sessions(entity_id);

-- Index for user's sessions
CREATE INDEX IF NOT EXISTS idx_enrichment_sessions_user
  ON enrichment_sessions(user_id);

-- Index for tenant's sessions
CREATE INDEX IF NOT EXISTS idx_enrichment_sessions_tenant
  ON enrichment_sessions(tenant_id);

-- =============================================================================
-- ENRICHED CONTACTS TABLE
-- =============================================================================
-- Stores contacts found during enrichment, scored by QTLE

CREATE TABLE IF NOT EXISTS enriched_contacts (
  id TEXT PRIMARY KEY,                    -- contact_timestamp_random
  session_id TEXT NOT NULL REFERENCES enrichment_sessions(id) ON DELETE CASCADE,
  entity_id TEXT NOT NULL,                -- Company ID (denormalized for queries)

  -- Identity
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  title TEXT NOT NULL,
  email TEXT,
  linkedin_url TEXT,
  phone TEXT,

  -- Classification
  role TEXT NOT NULL,                     -- decision_maker, influencer, champion, end_user
  seniority TEXT NOT NULL,                -- c_suite, vp, director, manager, individual
  department TEXT NOT NULL,

  -- Scoring (QTLE)
  qtle_score INTEGER NOT NULL,            -- 0-100
  score_breakdown JSONB NOT NULL,         -- { quality, timing, likelihood, engagement }

  -- Priority
  priority TEXT NOT NULL,                 -- primary, secondary, tertiary
  priority_rank INTEGER NOT NULL,         -- 1, 2, 3...

  -- Explanation
  why_recommended TEXT NOT NULL,
  confidence TEXT NOT NULL,               -- high, medium, low

  -- Source tracking
  source_provider TEXT NOT NULL,          -- apollo, linkedin, etc.
  source_id TEXT,                         -- Original ID from provider

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for looking up contacts by session
CREATE INDEX IF NOT EXISTS idx_enriched_contacts_session
  ON enriched_contacts(session_id);

-- Index for looking up contacts by entity (company)
CREATE INDEX IF NOT EXISTS idx_enriched_contacts_entity
  ON enriched_contacts(entity_id);

-- Index for finding primary contacts quickly
CREATE INDEX IF NOT EXISTS idx_enriched_contacts_priority
  ON enriched_contacts(entity_id, priority, priority_rank);

-- =============================================================================
-- ENRICHMENT EVIDENCE TABLE
-- =============================================================================
-- Raw provider responses (for audit/debugging, not sent to UI)

CREATE TABLE IF NOT EXISTS enrichment_evidence (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES enrichment_sessions(id) ON DELETE CASCADE,

  source TEXT NOT NULL,                   -- apollo, linkedin, clearbit, manual
  entity_type TEXT NOT NULL,              -- contact, company, signal

  -- Store raw and normalized data as JSONB
  raw_payload JSONB,                      -- Original provider response (may be null)
  normalized_data JSONB,                  -- Cleaned/transformed version (may be null)

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for session lookup
CREATE INDEX IF NOT EXISTS idx_enrichment_evidence_session
  ON enrichment_evidence(session_id);

-- =============================================================================
-- UPDATE TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION update_enrichment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enrichment_sessions_updated_at ON enrichment_sessions;
CREATE TRIGGER enrichment_sessions_updated_at
  BEFORE UPDATE ON enrichment_sessions
  FOR EACH ROW EXECUTE FUNCTION update_enrichment_updated_at();

DROP TRIGGER IF EXISTS enriched_contacts_updated_at ON enriched_contacts;
CREATE TRIGGER enriched_contacts_updated_at
  BEFORE UPDATE ON enriched_contacts
  FOR EACH ROW EXECUTE FUNCTION update_enrichment_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE enrichment_sessions IS 'S396: Tracks enrichment operations for companies';
COMMENT ON TABLE enriched_contacts IS 'S396: Contacts found during enrichment, scored by QTLE';
COMMENT ON TABLE enrichment_evidence IS 'S396: Raw provider data for audit (never sent to UI)';
