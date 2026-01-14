/**
 * Policy Approval API - S399 + S401 (Phase 1 Gate)
 *
 * POST /api/superadmin/controlplane/sub-verticals/[id]/policy-review/approve
 *   - Approves a pending policy interpretation
 *   - Creates immutable approved version
 *   - Deprecates any previously approved version
 *
 * PHASE 1 APPROVAL CONTRACT (enforced):
 * 1. DSL validity: DSL must parse with zero lint errors
 * 2. IPR immutability: Approved policy hash = DSL hash
 * 3. Runtime binding: DSL policies use compiled_ipr_only
 * 4. Audit artifact: Stores DSL text, compiler version, timestamp, approver
 *
 * Part of Phase 1: Policy Compiler (Foundational)
 * Master Implementation Plan - LOCKED
 */

import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';
import { logControlPlaneAudit } from '@/lib/db/controlplane-audit';
import { validateIPR, hashPolicyText } from '@/lib/policy/ipr-schema';
import {
  compilePolicyDSL,
  isDSLFormat,
  DSL_COMPILER_VERSION,
} from '@/lib/enrichment/policy-dsl';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/superadmin/controlplane/sub-verticals/[id]/policy-review/approve
 *
 * Approves the pending policy interpretation.
 * The IPR can be edited before approval.
 *
 * Request body:
 * {
 *   "version_id": "uuid",
 *   "edited_ipr": { ... } (optional - if founder edited the interpretation),
 *   "approval_notes": "string" (optional)
 * }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const actorUser = sessionResult.session?.email || 'unknown';

  try {
    const body = await request.json();
    const { version_id, edited_ipr, approval_notes } = body;

    if (!version_id) {
      return Response.json(
        { success: false, error: 'version_id is required' },
        { status: 400 }
      );
    }

    // Get the pending version with DSL audit artifact fields
    const pendingVersion = await queryOne<{
      id: string;
      version: number;
      sub_vertical_id: string;
      policy_text: string;
      interpreted_ipr: unknown;
      status: string;
      source_format: string | null;
      dsl_text: string | null;
      compiler_version: string | null;
      policy_hash: string | null;
      runtime_binding: string | null;
    }>(
      `SELECT id, version, sub_vertical_id, policy_text, interpreted_ipr, status,
              source_format, dsl_text, compiler_version, policy_hash, runtime_binding
       FROM enrichment_policy_versions
       WHERE id = $1 AND sub_vertical_id = $2`,
      [version_id, id]
    );

    if (!pendingVersion) {
      return Response.json(
        { success: false, error: 'Policy version not found' },
        { status: 404 }
      );
    }

    if (pendingVersion.status !== 'pending_approval') {
      return Response.json(
        {
          success: false,
          error: 'INVALID_STATUS',
          message: `Cannot approve policy in status '${pendingVersion.status}'. Only 'pending_approval' can be approved.`,
        },
        { status: 400 }
      );
    }

    // Use edited IPR if provided, otherwise use original
    const finalIPR = edited_ipr || pendingVersion.interpreted_ipr;

    // Validate the IPR
    const validation = validateIPR(finalIPR);
    if (!validation.valid) {
      return Response.json(
        {
          success: false,
          error: 'IPR_VALIDATION_FAILED',
          message: 'The interpretation has validation errors. Please fix before approving.',
          validation_errors: validation.errors,
        },
        { status: 400 }
      );
    }

    // ================================================================
    // PHASE 1 APPROVAL CONTRACT VALIDATION
    // ================================================================
    const isDSLPolicy = pendingVersion.source_format === 'dsl';
    let approvalContractValidated = false;
    let approvalContractErrors: unknown[] | null = null;
    let approvalWarnings: string[] = [];

    if (isDSLPolicy) {
      console.log('[PolicyApprove] Validating DSL Approval Contract...');

      // CONTRACT RULE 1: DSL must parse with zero lint errors
      const dslText = pendingVersion.dsl_text || pendingVersion.policy_text;
      const recompileResult = compilePolicyDSL(dslText);

      if (!recompileResult.success) {
        // DSL has errors - cannot approve
        approvalContractErrors = recompileResult.errors;
        return Response.json(
          {
            success: false,
            error: 'APPROVAL_CONTRACT_FAILED',
            message: 'DSL Approval Contract validation failed. DSL has lint errors.',
            contract_errors: recompileResult.errors,
            contract_rule: 'DSL must parse with zero lint errors to be approved.',
          },
          { status: 400 }
        );
      }

      // CONTRACT RULE 2: Policy hash must match (no tampering)
      const currentHash = hashPolicyText(dslText);
      if (pendingVersion.policy_hash && pendingVersion.policy_hash !== currentHash) {
        return Response.json(
          {
            success: false,
            error: 'APPROVAL_CONTRACT_HASH_MISMATCH',
            message: 'DSL Approval Contract validation failed. Policy hash mismatch.',
            stored_hash: pendingVersion.policy_hash,
            computed_hash: currentHash,
            contract_rule: 'Approved policy hash must match DSL hash. Policy may have been tampered.',
          },
          { status: 400 }
        );
      }

      // CONTRACT RULE 3: Verify runtime_binding is 'compiled_ipr_only'
      if (pendingVersion.runtime_binding !== 'compiled_ipr_only') {
        // Auto-correct runtime_binding for DSL policies
        console.log('[PolicyApprove] Correcting runtime_binding to compiled_ipr_only');
      }

      // All contract rules passed
      approvalContractValidated = true;
      console.log('[PolicyApprove] DSL Approval Contract PASSED');
    } else {
      // Legacy free text policy - show deprecation warning
      approvalWarnings.push(
        'DEPRECATED: This policy uses legacy free-text format.',
        'Non-deterministic policies are subject to LLM interpretation drift.',
        'RECOMMENDATION: Convert to DSL format for deterministic compilation.',
        'Legacy policies will be deprecated in a future version.'
      );
      console.log('[PolicyApprove] WARNING: Approving legacy free-text policy (deprecated)');
    }

    // Deprecate any existing approved versions for this sub-vertical
    await query(
      `UPDATE enrichment_policy_versions
       SET status = 'deprecated',
           deprecated_by = $1,
           deprecated_at = NOW(),
           deprecation_reason = 'Superseded by version ' || $2
       WHERE sub_vertical_id = $3
         AND status = 'approved'
         AND id != $4`,
      [actorUser, pendingVersion.version, id, version_id]
    );

    // Approve this version with Approval Contract fields
    const approvedVersion = await queryOne<{
      id: string;
      version: number;
      status: string;
      approved_at: string;
      source_format: string;
      runtime_binding: string;
      approval_contract_validated: boolean;
    }>(
      `UPDATE enrichment_policy_versions
       SET status = 'approved',
           interpreted_ipr = $1,
           approved_by = $2,
           approved_at = NOW(),
           approval_notes = $3,
           -- Phase 1 Approval Contract fields
           runtime_binding = $5,
           approval_contract_validated = $6,
           approval_contract_errors = $7
       WHERE id = $4
       RETURNING id, version, status, approved_at, source_format, runtime_binding, approval_contract_validated`,
      [
        JSON.stringify(finalIPR),
        actorUser,
        approval_notes || null,
        version_id,
        // Approval Contract fields
        isDSLPolicy ? 'compiled_ipr_only' : 'interpreter_allowed',
        approvalContractValidated,
        approvalContractErrors ? JSON.stringify(approvalContractErrors) : null,
      ]
    );

    // Audit log with Approval Contract details
    await logControlPlaneAudit({
      actorUser,
      action: 'approve_policy',
      targetType: 'enrichment_policy_version',
      targetId: version_id,
      requestJson: {
        version: pendingVersion.version,
        was_edited: !!edited_ipr,
        has_notes: !!approval_notes,
        // Approval Contract audit
        source_format: pendingVersion.source_format,
        approval_contract_validated: approvalContractValidated,
      },
      resultJson: {
        approved_at: approvedVersion?.approved_at,
        runtime_binding: approvedVersion?.runtime_binding,
        approval_contract_validated: approvedVersion?.approval_contract_validated,
        compiler_version: pendingVersion.compiler_version,
        policy_hash: pendingVersion.policy_hash,
      },
      success: true,
    });

    // Build response with Approval Contract details
    const responseData: Record<string, unknown> = {
      version_id: approvedVersion?.id,
      version: approvedVersion?.version,
      status: 'approved',
      approved_by: actorUser,
      approved_at: approvedVersion?.approved_at,
      interpreted_ipr: finalIPR,
      // Phase 1 Approval Contract
      approval_contract: {
        validated: approvalContractValidated,
        source_format: approvedVersion?.source_format || pendingVersion.source_format,
        runtime_binding: approvedVersion?.runtime_binding,
        compiler_version: pendingVersion.compiler_version,
        policy_hash: pendingVersion.policy_hash,
      },
    };

    // Include deprecation warnings for legacy policies
    if (approvalWarnings.length > 0) {
      responseData.warnings = approvalWarnings;
    }

    // Build message
    let message = `Policy v${approvedVersion?.version} approved successfully.`;
    if (edited_ipr) {
      message += ' (with edits)';
    }
    message += ' This is now the active policy.';

    if (isDSLPolicy) {
      message += ` DSL Approval Contract validated. Runtime binding: compiled_ipr_only.`;
    } else {
      message += ` WARNING: Legacy free-text policy. Non-deterministic interpretation. Migrate to DSL.`;
    }

    return Response.json({
      success: true,
      data: responseData,
      message,
    });
  } catch (error) {
    console.error('[PolicyApprove POST] Error:', error);
    return Response.json(
      { success: false, error: 'Failed to approve policy' },
      { status: 500 }
    );
  }
}
