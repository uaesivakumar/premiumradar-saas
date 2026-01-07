-- S368: Drop Plain-Text PII Columns (FINAL STEP)
--
-- WARNING: Only run this AFTER:
-- 1. S368_pii_encryption.sql has been applied
-- 2. migrate-pii-to-encrypted.ts has run successfully
-- 3. Application code has been updated to use encrypted columns
-- 4. All leads have pii_encrypted = true
--
-- VERIFICATION REQUIRED BEFORE RUNNING:
-- SELECT COUNT(*) FROM leads WHERE pii_encrypted = false;
-- Must return 0.

-- ============================================================
-- PRE-FLIGHT CHECK (run this first, do NOT proceed if > 0)
-- ============================================================
-- SELECT COUNT(*) as unmigrated FROM leads WHERE pii_encrypted = false;

-- ============================================================
-- STEP 1: Drop plain-text PII columns
-- ============================================================

-- Drop contact_email (plain text)
ALTER TABLE leads DROP COLUMN IF EXISTS contact_email;

-- Drop contact_phone (plain text)
ALTER TABLE leads DROP COLUMN IF EXISTS contact_phone;

-- Drop contact_name (plain text)
ALTER TABLE leads DROP COLUMN IF EXISTS contact_name;

-- ============================================================
-- STEP 2: Drop migration tracking column (no longer needed)
-- ============================================================

-- Keep pii_encrypted for now as a flag, can drop later
-- ALTER TABLE leads DROP COLUMN IF EXISTS pii_encrypted;

-- ============================================================
-- STEP 3: Update comments
-- ============================================================

COMMENT ON TABLE leads IS 'S368: PII encrypted at rest. Use contact_*_encrypted columns with PII vault for decryption.';

-- ============================================================
-- VERIFICATION QUERIES (run after migration)
-- ============================================================

-- Verify no plain-text columns exist:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'leads'
-- AND column_name IN ('contact_email', 'contact_phone', 'contact_name');
-- Should return 0 rows.

-- Verify encrypted columns exist:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'leads'
-- AND column_name LIKE 'contact_%_encrypted';
-- Should return 3 rows.
