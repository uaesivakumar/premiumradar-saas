/**
 * Policy Review API - S399
 *
 * GET /api/superadmin/controlplane/sub-verticals/[id]/policy-review
 *   - Returns current/pending policy with interpretation for review
 *
 * Part of Phase 1: Policy Compiler (Foundational)
 * Master Implementation Plan - LOCKED
 */

import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';

interface PolicyVersionRow {
  id: string;
  version: number;
  policy_text: string;
  interpreted_ipr: unknown;
  interpretation_confidence: number;
  interpretation_warnings: unknown;
  interpreted_at: string;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  created_by: string;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/superadmin/controlplane/sub-verticals/[id]/policy-review
 *
 * Returns the policy review state:
 * - If there's a pending_approval version: return it for review
 * - If there's an approved version: return it with read-only view
 * - If no versions exist: return empty state
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Check sub-vertical exists
    const subVertical = await queryOne<{
      id: string;
      key: string;
      name: string;
      enrichment_policy_text: string | null;
    }>(
      `SELECT id, key, name, enrichment_policy_text
       FROM os_sub_verticals WHERE id = $1`,
      [id]
    );

    if (!subVertical) {
      return Response.json(
        { success: false, error: 'Sub-vertical not found' },
        { status: 404 }
      );
    }

    // Get pending approval version (if any)
    const pendingVersion = await queryOne<PolicyVersionRow>(
      `SELECT id, version, policy_text, interpreted_ipr,
              interpretation_confidence, interpretation_warnings,
              interpreted_at, status, approved_by, approved_at,
              rejected_by, rejected_at, rejection_reason,
              created_at, created_by
       FROM enrichment_policy_versions
       WHERE sub_vertical_id = $1 AND status = 'pending_approval'
       ORDER BY version DESC LIMIT 1`,
      [id]
    );

    // Get active approved version (if any)
    const activeVersion = await queryOne<PolicyVersionRow>(
      `SELECT id, version, policy_text, interpreted_ipr,
              interpretation_confidence, interpretation_warnings,
              interpreted_at, status, approved_by, approved_at,
              created_at, created_by
       FROM enrichment_policy_versions
       WHERE sub_vertical_id = $1 AND status = 'approved'
       ORDER BY version DESC LIMIT 1`,
      [id]
    );

    // Get all versions for history
    const allVersions = await query<{ version: number; status: string; created_at: string }>(
      `SELECT version, status, created_at
       FROM enrichment_policy_versions
       WHERE sub_vertical_id = $1
       ORDER BY version DESC
       LIMIT 10`,
      [id]
    );

    return Response.json({
      success: true,
      data: {
        sub_vertical: {
          id: subVertical.id,
          key: subVertical.key,
          name: subVertical.name,
          current_policy_text: subVertical.enrichment_policy_text,
        },

        // Pending approval (needs action)
        pending_review: pendingVersion
          ? {
              version_id: pendingVersion.id,
              version: pendingVersion.version,
              policy_text: pendingVersion.policy_text,
              interpreted_ipr: pendingVersion.interpreted_ipr,
              interpretation_confidence: pendingVersion.interpretation_confidence,
              interpretation_warnings: pendingVersion.interpretation_warnings,
              interpreted_at: pendingVersion.interpreted_at,
              created_at: pendingVersion.created_at,
              created_by: pendingVersion.created_by,
            }
          : null,

        // Active approved version
        active_version: activeVersion
          ? {
              version_id: activeVersion.id,
              version: activeVersion.version,
              policy_text: activeVersion.policy_text,
              interpreted_ipr: activeVersion.interpreted_ipr,
              approved_by: activeVersion.approved_by,
              approved_at: activeVersion.approved_at,
            }
          : null,

        // Version history
        version_history: allVersions,

        // State summary
        has_pending_review: !!pendingVersion,
        has_active_version: !!activeVersion,
        needs_interpretation: !pendingVersion && !activeVersion && !!subVertical.enrichment_policy_text,
      },
    });
  } catch (error) {
    console.error('[PolicyReview GET] Error:', error);

    // Handle missing table
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
      return Response.json({
        success: true,
        data: {
          sub_vertical: { id },
          pending_review: null,
          active_version: null,
          version_history: [],
          has_pending_review: false,
          has_active_version: false,
          needs_interpretation: true,
          _migration_required: true,
        },
      });
    }

    return Response.json(
      { success: false, error: 'Failed to fetch policy review' },
      { status: 500 }
    );
  }
}
