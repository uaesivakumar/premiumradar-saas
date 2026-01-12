-- S397: Enrichment Policy Authoring
-- Add enrichment_policy_text field to os_sub_verticals
-- This enables plain English policy definition at the sub-vertical level
--
-- Part of Phase 1: Policy Compiler (Foundational)
-- Master Implementation Plan - LOCKED

-- Add enrichment policy columns to os_sub_verticals
ALTER TABLE os_sub_verticals
ADD COLUMN IF NOT EXISTS enrichment_policy_text TEXT,
ADD COLUMN IF NOT EXISTS enrichment_policy_version INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS enrichment_policy_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS enrichment_policy_updated_by VARCHAR(255);

-- Add comment for documentation
COMMENT ON COLUMN os_sub_verticals.enrichment_policy_text IS
'Plain English enrichment policy written by founder.
Example: "If company is large (500+ employees), prioritize HR Head and Payroll Manager.
If company is small (<100 employees), focus on Founder or Finance Manager."';

COMMENT ON COLUMN os_sub_verticals.enrichment_policy_version IS
'Version counter incremented on each policy edit. Used for tracking, not approval.';

COMMENT ON COLUMN os_sub_verticals.enrichment_policy_updated_at IS
'Timestamp of last policy text update.';

COMMENT ON COLUMN os_sub_verticals.enrichment_policy_updated_by IS
'User who last updated the policy text.';

-- Create index for quick lookup of sub-verticals with policies
CREATE INDEX IF NOT EXISTS idx_sub_verticals_has_policy
ON os_sub_verticals ((enrichment_policy_text IS NOT NULL));
