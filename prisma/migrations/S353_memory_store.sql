-- S353: Persistent Memory Store
-- Behavior Contract B004: Memory survives server restart
--
-- This table stores key-value pairs with TTL support for persistent memory.
-- Unlike in-memory caches, data here survives server restarts.
--
-- Usage:
-- - Store enrichment results, API responses, user preferences
-- - TTL-based expiration (cleaned up by scheduled job)
-- - Tenant-scoped for data isolation

-- Create memory_store table
CREATE TABLE IF NOT EXISTS memory_store (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    store_key VARCHAR(512) NOT NULL,
    store_value JSONB NOT NULL,
    ttl_seconds INTEGER DEFAULT 86400, -- 24 hours default
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Composite unique constraint for tenant + key
    CONSTRAINT memory_store_tenant_key_unique UNIQUE (tenant_id, store_key)
);

-- Index for efficient key lookup
CREATE INDEX IF NOT EXISTS idx_memory_store_tenant_key
    ON memory_store(tenant_id, store_key);

-- Index for expiration cleanup
CREATE INDEX IF NOT EXISTS idx_memory_store_expires_at
    ON memory_store(expires_at)
    WHERE expires_at IS NOT NULL;

-- Comment explaining purpose
COMMENT ON TABLE memory_store IS 'S353: Persistent memory store with TTL support. Survives server restarts.';
COMMENT ON COLUMN memory_store.store_key IS 'Namespaced key like "enrichment:apollo:company_123"';
COMMENT ON COLUMN memory_store.ttl_seconds IS 'Time-to-live in seconds. Used to calculate expires_at on insert/update.';
COMMENT ON COLUMN memory_store.expires_at IS 'Absolute expiration time. Records past this time are eligible for cleanup.';

-- Enable RLS for tenant isolation
ALTER TABLE memory_store ENABLE ROW LEVEL SECURITY;

-- RLS policy: tenants can only access their own data
CREATE POLICY memory_store_tenant_isolation ON memory_store
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_memory_store_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on updates
DROP TRIGGER IF EXISTS memory_store_updated_at ON memory_store;
CREATE TRIGGER memory_store_updated_at
    BEFORE UPDATE ON memory_store
    FOR EACH ROW
    EXECUTE FUNCTION update_memory_store_updated_at();

-- Cleanup function (to be called by scheduled job)
CREATE OR REPLACE FUNCTION cleanup_expired_memory()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM memory_store
        WHERE expires_at < NOW()
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_memory() IS 'Call periodically to remove expired memory entries. Returns count of deleted rows.';
