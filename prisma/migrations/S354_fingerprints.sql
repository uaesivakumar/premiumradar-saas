-- S354: Action Fingerprints
-- Behavior Contract B005: Duplicate actions detected via fingerprint
--
-- This table stores fingerprints of user actions for deduplication.
-- When a user attempts the same action twice, we can detect and warn them.
--
-- Usage:
-- - Detect duplicate API calls (same request within short time)
-- - Track action history for "Did you mean to do this again?" prompts
-- - Prevent accidental double-spends on expensive API calls

-- Create action_fingerprints table
CREATE TABLE IF NOT EXISTS action_fingerprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    fingerprint_hash VARCHAR(64) NOT NULL, -- SHA-256 hash
    action_type VARCHAR(100) NOT NULL,      -- e.g., 'discovery', 'enrichment', 'outreach'
    action_metadata JSONB,                   -- Additional context (company name, query, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Index for efficient duplicate detection
    CONSTRAINT action_fingerprints_unique UNIQUE (tenant_id, fingerprint_hash)
);

-- Index for user-specific lookups
CREATE INDEX IF NOT EXISTS idx_action_fingerprints_user
    ON action_fingerprints(tenant_id, user_id, created_at DESC);

-- Index for action type filtering
CREATE INDEX IF NOT EXISTS idx_action_fingerprints_type
    ON action_fingerprints(tenant_id, action_type, created_at DESC);

-- Index for recent actions (for cleanup)
CREATE INDEX IF NOT EXISTS idx_action_fingerprints_created
    ON action_fingerprints(created_at);

-- Comment explaining purpose
COMMENT ON TABLE action_fingerprints IS 'S354: Stores hashes of user actions for duplicate detection.';
COMMENT ON COLUMN action_fingerprints.fingerprint_hash IS 'SHA-256 hash of action parameters. Used for exact duplicate detection.';
COMMENT ON COLUMN action_fingerprints.action_type IS 'Category of action (discovery, enrichment, outreach, etc.)';
COMMENT ON COLUMN action_fingerprints.action_metadata IS 'Human-readable context for displaying "you did this before" messages.';

-- Enable RLS for tenant isolation
ALTER TABLE action_fingerprints ENABLE ROW LEVEL SECURITY;

-- RLS policy: tenants can only access their own data
CREATE POLICY action_fingerprints_tenant_isolation ON action_fingerprints
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- Cleanup function for old fingerprints (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_fingerprints()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM action_fingerprints
        WHERE created_at < NOW() - INTERVAL '90 days'
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_fingerprints() IS 'Call periodically to remove fingerprints older than 90 days.';
