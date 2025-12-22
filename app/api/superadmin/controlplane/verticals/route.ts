/**
 * OS Verticals CRUD API
 *
 * GET  /api/superadmin/verticals - List all verticals
 * POST /api/superadmin/verticals - Create new vertical
 *
 * Contract Rules:
 * - key: required, lowercase snake_case
 * - entity_type: DEPRECATED (moving to sub-vertical in v2.0)
 * - region_scope: DEPRECATED (moving to persona in v2.0)
 * - All writes logged to os_controlplane_audit
 *
 * MIGRATION LOCK (Control Plane v2.0):
 * - New vertical creation is FROZEN during migration
 * - Only existing verticals can be edited (name, is_active)
 * - This lock will be removed after v2.0 migration completes
 */

// PHASE 0: Migration safety lock - prevents schema drift during v2.0 migration
// UNLOCKED: 2025-12-22 - v2.0 schema frozen + wizard live
const VERTICAL_CREATION_LOCKED = false;
const VERTICAL_CREATION_LOCK_REASON = 'Control Plane v2.0 migration in progress. New vertical creation is temporarily disabled. Contact admin to unlock.';

import { NextRequest } from 'next/server';
import { query, insert } from '@/lib/db/client';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';
import {
  logControlPlaneAudit,
  validateKey,
  conflictError,
  validationError,
  serverError,
} from '@/lib/db/controlplane-audit';

interface OSVertical {
  id: string;
  key: string;
  name: string;
  entity_type: string;
  region_scope: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/superadmin/verticals
 * List all verticals
 */
export async function GET() {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const verticals = await query<OSVertical>(
      `SELECT id, key, name, entity_type, region_scope, is_active, created_at, updated_at
       FROM os_verticals
       ORDER BY created_at ASC`
    );

    return Response.json({
      success: true,
      data: verticals,
    });
  } catch (error) {
    console.error('[Verticals GET] Error:', error);
    return serverError('Failed to fetch verticals');
  }
}

/**
 * POST /api/superadmin/verticals
 * Create new vertical
 *
 * LOCKED: Control Plane v2.0 migration in progress
 */
export async function POST(request: NextRequest) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const actorUser = sessionResult.session?.email || 'unknown';

  // PHASE 0: Migration safety lock
  if (VERTICAL_CREATION_LOCKED) {
    await logControlPlaneAudit({
      actorUser,
      action: 'create_vertical',
      targetType: 'vertical',
      requestJson: { locked: true },
      success: false,
      errorMessage: VERTICAL_CREATION_LOCK_REASON,
    });
    return Response.json({
      success: false,
      error: 'MIGRATION_LOCKED',
      message: VERTICAL_CREATION_LOCK_REASON,
    }, { status: 423 }); // 423 Locked
  }

  try {
    const body = await request.json();
    const { key, name, entity_type, region_scope } = body;

    // Validation: key
    const keyValidation = validateKey(key);
    if (!keyValidation.valid) {
      await logControlPlaneAudit({
        actorUser,
        action: 'create_vertical',
        targetType: 'vertical',
        requestJson: body,
        success: false,
        errorMessage: keyValidation.error,
      });
      return validationError('key', keyValidation.error);
    }

    // Validation: name
    if (!name || typeof name !== 'string') {
      await logControlPlaneAudit({
        actorUser,
        action: 'create_vertical',
        targetType: 'vertical',
        requestJson: body,
        success: false,
        errorMessage: 'Name is required',
      });
      return validationError('name', 'Name is required');
    }

    // Validation: entity_type
    const validEntityTypes = ['deal', 'company', 'individual'];
    if (!entity_type || !validEntityTypes.includes(entity_type)) {
      await logControlPlaneAudit({
        actorUser,
        action: 'create_vertical',
        targetType: 'vertical',
        requestJson: body,
        success: false,
        errorMessage: 'Invalid entity_type',
      });
      return validationError('entity_type', 'Must be one of: deal, company, individual');
    }

    // Validation: region_scope
    if (!region_scope || !Array.isArray(region_scope) || region_scope.length === 0) {
      await logControlPlaneAudit({
        actorUser,
        action: 'create_vertical',
        targetType: 'vertical',
        requestJson: body,
        success: false,
        errorMessage: 'region_scope must be non-empty array',
      });
      return validationError('region_scope', 'Must be non-empty array of regions');
    }

    // Check for duplicate key
    const existing = await query<{ id: string }>(
      'SELECT id FROM os_verticals WHERE key = $1',
      [key]
    );

    if (existing.length > 0) {
      await logControlPlaneAudit({
        actorUser,
        action: 'create_vertical',
        targetType: 'vertical',
        requestJson: body,
        success: false,
        errorMessage: 'Duplicate key',
      });
      return conflictError('key');
    }

    // Insert vertical
    const result = await insert<OSVertical>(
      `INSERT INTO os_verticals (key, name, entity_type, region_scope, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, key, name, entity_type, region_scope, is_active, created_at, updated_at`,
      [key, name, entity_type, JSON.stringify(region_scope)]
    );

    // Audit log success
    await logControlPlaneAudit({
      actorUser,
      action: 'create_vertical',
      targetType: 'vertical',
      targetId: result.id,
      requestJson: body,
      resultJson: result as unknown as Record<string, unknown>,
      success: true,
    });

    return Response.json({
      success: true,
      data: result,
    }, { status: 201 });

  } catch (error) {
    console.error('[Verticals POST] Error:', error);
    return serverError('Failed to create vertical');
  }
}
