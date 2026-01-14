-- S401: Policy Approval Contract - DSL Audit Artifacts
-- Phase 1 Gate: Enforce deterministic policy governance
--
-- This migration adds fields required for the Policy Approval Contract:
-- - source_format: 'dsl' | 'legacy_free_text'
-- - dsl_text: Raw DSL source (canonical authoring format)
-- - compiler_version: Version of DSL compiler used
-- - policy_hash: Immutable hash for change detection
-- - runtime_binding: 'compiled_ipr_only' | 'interpreter_allowed'
--
-- GOVERNANCE RULES:
-- 1. DSL policies MUST parse with zero lint errors to be approved
-- 2. Approved policy hash = DSL hash (any change requires re-approval)
-- 3. Runtime uses ONLY compiled IPR for DSL policies (interpreter bypassed)
-- 4. Legacy policies show deprecation warning
--
-- Part of Phase 1: Policy Compiler (Foundational)
-- Master Implementation Plan - LOCKED

-- Add source_format column
ALTER TABLE enrichment_policy_versions
ADD COLUMN IF NOT EXISTS source_format VARCHAR(20) DEFAULT 'legacy_free_text'
  CHECK (source_format IN ('dsl', 'legacy_free_text'));

COMMENT ON COLUMN enrichment_policy_versions.source_format IS
'Policy authoring format:
- dsl: Deterministic DSL format (canonical, no LLM)
- legacy_free_text: Free-form English (deprecated, uses LLM)
DSL is the only supported format for new policies.';

-- Add dsl_text column (raw DSL source for audit)
ALTER TABLE enrichment_policy_versions
ADD COLUMN IF NOT EXISTS dsl_text TEXT;

COMMENT ON COLUMN enrichment_policy_versions.dsl_text IS
'Raw DSL source text (for DSL policies only).
This is the canonical authoring format.
Must match policy_hash for approval validation.';

-- Add compiler_version column
ALTER TABLE enrichment_policy_versions
ADD COLUMN IF NOT EXISTS compiler_version VARCHAR(50);

COMMENT ON COLUMN enrichment_policy_versions.compiler_version IS
'Version of the DSL compiler used.
Required for audit trail and reproducibility.
Example: dsl_compiler_v2.0';

-- Add policy_hash column
ALTER TABLE enrichment_policy_versions
ADD COLUMN IF NOT EXISTS policy_hash VARCHAR(64);

COMMENT ON COLUMN enrichment_policy_versions.policy_hash IS
'Immutable hash of the policy content.
For DSL: Hash of dsl_text
For legacy: Hash of policy_text
Any change to source requires new version and re-approval.';

-- Add runtime_binding column
ALTER TABLE enrichment_policy_versions
ADD COLUMN IF NOT EXISTS runtime_binding VARCHAR(30) DEFAULT 'interpreter_allowed'
  CHECK (runtime_binding IN ('compiled_ipr_only', 'interpreter_allowed'));

COMMENT ON COLUMN enrichment_policy_versions.runtime_binding IS
'Runtime enforcement mode:
- compiled_ipr_only: Use ONLY compiled IPR, bypass interpreter (DSL policies)
- interpreter_allowed: May use interpreter (legacy policies, deprecated)
DSL policies MUST use compiled_ipr_only.';

-- Add approval_contract_validated column
ALTER TABLE enrichment_policy_versions
ADD COLUMN IF NOT EXISTS approval_contract_validated BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN enrichment_policy_versions.approval_contract_validated IS
'Whether this policy passed the Phase 1 Approval Contract validation:
- DSL parses with zero lint errors
- Deterministic compile produces valid IPR JSON
- Policy hash matches
Only TRUE for approved DSL policies.';

-- Add approval_contract_errors column (for failed validations)
ALTER TABLE enrichment_policy_versions
ADD COLUMN IF NOT EXISTS approval_contract_errors JSONB;

COMMENT ON COLUMN enrichment_policy_versions.approval_contract_errors IS
'Errors from Approval Contract validation (if failed).
Array of { code, message, line } objects from DSL compiler.
NULL if validation passed.';

-- Create index for runtime lookup by hash
CREATE INDEX IF NOT EXISTS idx_epv_policy_hash
ON enrichment_policy_versions (policy_hash)
WHERE status = 'approved';

-- Create index for source format filtering
CREATE INDEX IF NOT EXISTS idx_epv_source_format
ON enrichment_policy_versions (source_format, status);

-- Update get_active_policy_version function to include new fields
CREATE OR REPLACE FUNCTION get_active_policy_version(p_sub_vertical_id UUID)
RETURNS TABLE (
  version_id UUID,
  version INTEGER,
  policy_text TEXT,
  interpreted_ipr JSONB,
  compiled_policy JSONB,
  approved_at TIMESTAMPTZ,
  approved_by VARCHAR(255),
  source_format VARCHAR(20),
  dsl_text TEXT,
  compiler_version VARCHAR(50),
  policy_hash VARCHAR(64),
  runtime_binding VARCHAR(30),
  approval_contract_validated BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    epv.id as version_id,
    epv.version,
    epv.policy_text,
    epv.interpreted_ipr,
    epv.compiled_policy,
    epv.approved_at,
    epv.approved_by,
    epv.source_format,
    epv.dsl_text,
    epv.compiler_version,
    epv.policy_hash,
    epv.runtime_binding,
    epv.approval_contract_validated
  FROM enrichment_policy_versions epv
  WHERE epv.sub_vertical_id = p_sub_vertical_id
    AND epv.status = 'approved'
  ORDER BY epv.version DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_active_policy_version IS
'Returns the latest approved policy version for a sub-vertical.
Includes DSL audit artifact fields for Phase 1 compliance.
Runtime should check runtime_binding to determine execution mode.';

-- Add comment to table about approval contract
COMMENT ON TABLE enrichment_policy_versions IS
'Immutable version history for enrichment policies.

PHASE 1 APPROVAL CONTRACT (enforced):
1. DSL validity: DSL must parse with zero lint errors
2. IPR immutability: Approved policy hash = DSL hash
3. Runtime binding: DSL policies use compiled_ipr_only
4. Audit artifact: Stores DSL text, compiler version, timestamp, approver

source_format = dsl:
  - Deterministic compilation (no LLM)
  - runtime_binding = compiled_ipr_only (mandatory)
  - approval_contract_validated = TRUE (required for approval)

source_format = legacy_free_text:
  - DEPRECATED: Shows migration warning
  - runtime_binding = interpreter_allowed (insecure)
  - Will be removed in future version';
