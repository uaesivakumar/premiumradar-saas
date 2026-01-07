-- S368: PII Vault & Tokenization
-- Adds encrypted columns and hash columns for PII deduplication
--
-- Strategy:
-- 1. Add encrypted + hash columns (this migration)
-- 2. Run migration script to encrypt existing data
-- 3. Update application code to use encrypted columns
-- 4. Drop plain-text columns in final migration
--
-- IMPORTANT: Do NOT drop plain-text columns until all data migrated
-- and application code updated.

-- ============================================================
-- STEP 1: Add encrypted PII columns to leads table
-- ============================================================

-- Encrypted contact email (AES-256-GCM, base64 encoded)
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS contact_email_encrypted TEXT;

-- Hash of contact email for deduplication (SHA-256, hex encoded)
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS contact_email_hash VARCHAR(64);

-- Encrypted contact phone
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS contact_phone_encrypted TEXT;

-- Hash of contact phone for deduplication
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS contact_phone_hash VARCHAR(64);

-- Encrypted contact name
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS contact_name_encrypted TEXT;

-- Hash of contact name for deduplication
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS contact_name_hash VARCHAR(64);

-- Flag to track migration status
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS pii_encrypted BOOLEAN DEFAULT false;

-- ============================================================
-- STEP 2: Create indexes for hash-based deduplication
-- ============================================================

-- Email hash index for dedup lookups
CREATE INDEX IF NOT EXISTS idx_leads_email_hash
ON leads(tenant_id, contact_email_hash)
WHERE contact_email_hash IS NOT NULL AND contact_email_hash != '';

-- Phone hash index for dedup lookups
CREATE INDEX IF NOT EXISTS idx_leads_phone_hash
ON leads(tenant_id, contact_phone_hash)
WHERE contact_phone_hash IS NOT NULL AND contact_phone_hash != '';

-- Name hash index for fuzzy matching support
CREATE INDEX IF NOT EXISTS idx_leads_name_hash
ON leads(tenant_id, contact_name_hash)
WHERE contact_name_hash IS NOT NULL AND contact_name_hash != '';

-- Composite index for migration tracking
CREATE INDEX IF NOT EXISTS idx_leads_pii_migration
ON leads(tenant_id, pii_encrypted)
WHERE pii_encrypted = false;

-- ============================================================
-- STEP 3: Create PII audit log table
-- ============================================================

CREATE TABLE IF NOT EXISTS pii_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID,
  action VARCHAR(50) NOT NULL, -- 'encrypt', 'decrypt', 'hash', 'migrate'
  entity_type VARCHAR(50) NOT NULL, -- 'lead', 'contact', etc.
  entity_id UUID,
  field_name VARCHAR(50), -- 'email', 'phone', 'name'
  success BOOLEAN NOT NULL,
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_pii_access_tenant FOREIGN KEY (tenant_id)
    REFERENCES tenants(id) ON DELETE CASCADE
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_pii_access_log_tenant_date
ON pii_access_log(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pii_access_log_entity
ON pii_access_log(entity_type, entity_id, created_at DESC);

-- ============================================================
-- STEP 4: Comments for documentation
-- ============================================================

COMMENT ON COLUMN leads.contact_email_encrypted IS 'S368: AES-256-GCM encrypted email. Format: salt:iv:authTag:ciphertext (base64)';
COMMENT ON COLUMN leads.contact_email_hash IS 'S368: SHA-256 hash for deduplication. Do NOT use for display.';
COMMENT ON COLUMN leads.contact_phone_encrypted IS 'S368: AES-256-GCM encrypted phone. Format: salt:iv:authTag:ciphertext (base64)';
COMMENT ON COLUMN leads.contact_phone_hash IS 'S368: SHA-256 hash for deduplication. Do NOT use for display.';
COMMENT ON COLUMN leads.contact_name_encrypted IS 'S368: AES-256-GCM encrypted name. Format: salt:iv:authTag:ciphertext (base64)';
COMMENT ON COLUMN leads.contact_name_hash IS 'S368: SHA-256 hash for deduplication. Do NOT use for display.';
COMMENT ON COLUMN leads.pii_encrypted IS 'S368: True when PII has been migrated to encrypted columns';

COMMENT ON TABLE pii_access_log IS 'S368: Audit log for PII access (encrypt/decrypt operations)';
