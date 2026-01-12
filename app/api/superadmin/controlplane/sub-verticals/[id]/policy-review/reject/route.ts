/**
 * Policy Rejection API - S399
 *
 * POST /api/superadmin/controlplane/sub-verticals/[id]/policy-review/reject
 *   - Rejects a pending policy interpretation
 *   - Records rejection reason for audit trail
 *
 * Part of Phase 1: Policy Compiler (Foundational)
 * Master Implementation Plan - LOCKED
 */

import { NextRequest } from 'next/server';
import { queryOne } from '@/lib/db/client';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';
import { logControlPlaneAudit } from '@/lib/db/controlplane-audit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/superadmin/controlplane/sub-verticals/[id]/policy-review/reject
 *
 * Rejects the pending policy interpretation.
 *
 * Request body:
 * {
 *   "version_id": "uuid",
 *   "rejection_reason": "string" (required)
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
    const { version_id, rejection_reason } = body;

    if (!version_id) {
      return Response.json(
        { success: false, error: 'version_id is required' },
        { status: 400 }
      );
    }

    if (!rejection_reason || rejection_reason.trim() === '') {
      return Response.json(
        { success: false, error: 'rejection_reason is required' },
        { status: 400 }
      );
    }

    // Get the pending version
    const pendingVersion = await queryOne<{
      id: string;
      version: number;
      sub_vertical_id: string;
      status: string;
    }>(
      `SELECT id, version, sub_vertical_id, status
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
          message: `Cannot reject policy in status '${pendingVersion.status}'. Only 'pending_approval' can be rejected.`,
        },
        { status: 400 }
      );
    }

    // Reject this version
    const rejectedVersion = await queryOne<{
      id: string;
      version: number;
      status: string;
      rejected_at: string;
    }>(
      `UPDATE enrichment_policy_versions
       SET status = 'rejected',
           rejected_by = $1,
           rejected_at = NOW(),
           rejection_reason = $2
       WHERE id = $3
       RETURNING id, version, status, rejected_at`,
      [actorUser, rejection_reason.trim(), version_id]
    );

    // Audit log
    await logControlPlaneAudit({
      actorUser,
      action: 'reject_policy',
      targetType: 'enrichment_policy_version',
      targetId: version_id,
      requestJson: {
        version: pendingVersion.version,
        rejection_reason: rejection_reason.substring(0, 100),
      },
      resultJson: {
        rejected_at: rejectedVersion?.rejected_at,
      },
      success: true,
    });

    return Response.json({
      success: true,
      data: {
        version_id: rejectedVersion?.id,
        version: rejectedVersion?.version,
        status: 'rejected',
        rejected_by: actorUser,
        rejected_at: rejectedVersion?.rejected_at,
        rejection_reason: rejection_reason.trim(),
      },
      message: `Policy v${rejectedVersion?.version} rejected. Edit the policy text and re-interpret to try again.`,
    });
  } catch (error) {
    console.error('[PolicyReject POST] Error:', error);
    return Response.json(
      { success: false, error: 'Failed to reject policy' },
      { status: 500 }
    );
  }
}
