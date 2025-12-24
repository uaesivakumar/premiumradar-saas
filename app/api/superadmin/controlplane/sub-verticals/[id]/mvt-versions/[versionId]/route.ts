/**
 * Single MVT Version API (S256)
 *
 * GET /api/superadmin/controlplane/sub-verticals/:id/mvt-versions/:versionId
 *   - Get single MVT version details
 *
 * POST /api/superadmin/controlplane/sub-verticals/:id/mvt-versions/:versionId/activate
 *   - Activate this version (deprecates current active)
 *
 * POST /api/superadmin/controlplane/sub-verticals/:id/mvt-versions/:versionId/deprecate
 *   - Deprecate this version
 */

import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';
import {
  logControlPlaneAudit,
  notFoundError,
  validationError,
  serverError,
} from '@/lib/db/controlplane-audit';

interface MVTVersion {
  id: string;
  sub_vertical_id: string;
  mvt_version: number;
  buyer_role: string;
  decision_owner: string;
  allowed_signals: unknown;
  kill_rules: unknown;
  seed_scenarios: unknown;
  mvt_valid: boolean;
  mvt_validated_at: string | null;
  status: string;
  created_at: string;
  created_by: string | null;
}

interface RouteParams {
  params: Promise<{ id: string; versionId: string }>;
}

/**
 * GET /api/superadmin/controlplane/sub-verticals/:id/mvt-versions/:versionId
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, versionId } = await params;

  try {
    const version = await queryOne<MVTVersion>(
      `SELECT id, sub_vertical_id, mvt_version, buyer_role, decision_owner,
              allowed_signals, kill_rules, seed_scenarios,
              mvt_valid, mvt_validated_at, status, created_at, created_by
       FROM os_sub_vertical_mvt_versions
       WHERE id = $1 AND sub_vertical_id = $2`,
      [versionId, id]
    );

    if (!version) {
      return notFoundError('MVT Version');
    }

    return Response.json({
      success: true,
      version,
    });
  } catch (error) {
    console.error('[MVT Version GET] Error:', error);
    return serverError('Failed to fetch MVT version');
  }
}

/**
 * POST /api/superadmin/controlplane/sub-verticals/:id/mvt-versions/:versionId
 * Action endpoint for activate/deprecate
 *
 * Body: { action: 'activate' | 'deprecate' }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, versionId } = await params;
  const actorUser = sessionResult.session?.email || 'unknown';

  try {
    const body = await request.json();
    const { action } = body;

    if (!action || !['activate', 'deprecate'].includes(action)) {
      return validationError('action', 'Must be "activate" or "deprecate"');
    }

    // Check version exists
    const version = await queryOne<MVTVersion>(
      `SELECT id, sub_vertical_id, mvt_version, status, mvt_valid
       FROM os_sub_vertical_mvt_versions
       WHERE id = $1 AND sub_vertical_id = $2`,
      [versionId, id]
    );

    if (!version) {
      return notFoundError('MVT Version');
    }

    if (action === 'activate') {
      // Cannot activate invalid MVT
      if (!version.mvt_valid) {
        await logControlPlaneAudit({
          actorUser,
          action: 'update_sub_vertical_mvt',
          targetType: 'mvt_version',
          targetId: versionId,
          requestJson: body,
          success: false,
          errorMessage: 'Cannot activate invalid MVT version',
        });
        return Response.json(
          {
            success: false,
            error: 'MVT_INVALID',
            message: 'Cannot activate an invalid MVT version',
          },
          { status: 400 }
        );
      }

      // Already active
      if (version.status === 'ACTIVE') {
        return Response.json({
          success: true,
          message: 'Version is already active',
          activated_version: version,
        });
      }

      // Deprecate current active version
      await query(
        `UPDATE os_sub_vertical_mvt_versions
         SET status = 'DEPRECATED'
         WHERE sub_vertical_id = $1 AND status = 'ACTIVE'`,
        [id]
      );

      // Activate this version
      const activated = await queryOne<MVTVersion>(
        `UPDATE os_sub_vertical_mvt_versions
         SET status = 'ACTIVE'
         WHERE id = $1
         RETURNING *`,
        [versionId]
      );

      // Update sub-vertical pointer
      await query(
        `UPDATE os_sub_verticals
         SET active_mvt_version_id = $1, updated_at = NOW()
         WHERE id = $2`,
        [versionId, id]
      );

      await logControlPlaneAudit({
        actorUser,
        action: 'update_sub_vertical_mvt',
        targetType: 'mvt_version',
        targetId: versionId,
        requestJson: body,
        resultJson: { action: 'activate', new_status: 'ACTIVE' },
        success: true,
      });

      return Response.json({
        success: true,
        message: `Version ${activated?.mvt_version} activated`,
        activated_version: activated,
      });
    } else {
      // Deprecate action
      if (version.status === 'DEPRECATED') {
        return Response.json({
          success: true,
          message: 'Version is already deprecated',
          deprecated_version: version,
        });
      }

      // If deprecating active version, clear sub-vertical pointer
      if (version.status === 'ACTIVE') {
        await query(
          `UPDATE os_sub_verticals
           SET active_mvt_version_id = NULL, updated_at = NOW()
           WHERE id = $1`,
          [id]
        );
      }

      const deprecated = await queryOne<MVTVersion>(
        `UPDATE os_sub_vertical_mvt_versions
         SET status = 'DEPRECATED'
         WHERE id = $1
         RETURNING *`,
        [versionId]
      );

      await logControlPlaneAudit({
        actorUser,
        action: 'update_sub_vertical_mvt',
        targetType: 'mvt_version',
        targetId: versionId,
        requestJson: body,
        resultJson: { action: 'deprecate', new_status: 'DEPRECATED' },
        success: true,
      });

      return Response.json({
        success: true,
        message: `Version ${deprecated?.mvt_version} deprecated`,
        deprecated_version: deprecated,
        warning: version.status === 'ACTIVE'
          ? 'Active version deprecated. Sub-vertical now has no active MVT and is not runtime-eligible.'
          : undefined,
      });
    }
  } catch (error) {
    console.error('[MVT Version POST] Error:', error);
    return serverError('Failed to update MVT version');
  }
}
