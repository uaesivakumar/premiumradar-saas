-- Migration: Add 'deal' entity type for SaaS Sales vertical
-- Date: 2025-12-18
-- Sprint: US SaaS Edition Private Beta
--
-- This enables 'deal' as a valid entity_type in personas table.
-- Actual vertical/persona configuration is done via Super Admin UI.

-- Step 1: Drop existing check constraint on personas table
ALTER TABLE personas DROP CONSTRAINT IF EXISTS personas_entity_type_check;

-- Step 2: Add new check constraint with 'deal' entity type
ALTER TABLE personas
ADD CONSTRAINT personas_entity_type_check
CHECK (entity_type IN ('company', 'individual', 'deal'));

-- Documentation
COMMENT ON COLUMN personas.entity_type IS 'Entity type: company (B2B), individual (B2C), deal (SaaS Sales)';
