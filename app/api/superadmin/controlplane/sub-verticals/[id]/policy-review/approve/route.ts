/**
 * Policy Approval API - S399
 *
 * POST /api/superadmin/controlplane/sub-verticals/[id]/policy-review/approve
 *   - Approves a pending policy interpretation
 *   - Creates immutable approved version
 *   - Deprecates any previously approved version
 *
 * Part of Phase 1: Policy Compiler (Foundational)
 * Master Implementation Plan - LOCKED
 */

import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';
import { logControlPlaneAudit } from '@/lib/db/controlplane-audit';
import { validateIPR } from '@/lib/policy/ipr-schema';

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

    // Get the pending version
    const pendingVersion = await queryOne<{
      id: string;
      version: number;
      sub_vertical_id: string;
      policy_text: string;
      interpreted_ipr: unknown;
      status: string;
    }>(
      `SELECT id, version, sub_vertical_id, policy_text, interpreted_ipr, status
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

    // Approve this version
    const approvedVersion = await queryOne<{
      id: string;
      version: number;
      status: string;
      approved_at: string;
    }>(
      `UPDATE enrichment_policy_versions
       SET status = 'approved',
           interpreted_ipr = $1,
           approved_by = $2,
           approved_at = NOW(),
           approval_notes = $3
       WHERE id = $4
       RETURNING id, version, status, approved_at`,
      [JSON.stringify(finalIPR), actorUser, approval_notes || null, version_id]
    );

    // Audit log
    await logControlPlaneAudit({
      actorUser,
      action: 'approve_policy',
      targetType: 'enrichment_policy_version',
      targetId: version_id,
      requestJson: {
        version: pendingVersion.version,
        was_edited: !!edited_ipr,
        has_notes: !!approval_notes,
      },
      resultJson: {
        approved_at: approvedVersion?.approved_at,
      },
      success: true,
    });

    return Response.json({
      success: true,
      data: {
        version_id: approvedVersion?.id,
        version: approvedVersion?.version,
        status: 'approved',
        approved_by: actorUser,
        approved_at: approvedVersion?.approved_at,
        interpreted_ipr: finalIPR,
      },
      message: `Policy v${approvedVersion?.version} approved successfully.${edited_ipr ? ' (with edits)' : ''} This is now the active policy.`,
    });
  } catch (error) {
    console.error('[PolicyApprove POST] Error:', error);
    return Response.json(
      { success: false, error: 'Failed to approve policy' },
      { status: 500 }
    );
  }
}
