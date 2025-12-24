/**
 * OS Verticals CRUD API (Control Plane v2.6)
 *
 * GET  /api/superadmin/controlplane/verticals - List all verticals
 * POST /api/superadmin/controlplane/verticals - Create new vertical
 *
 * v2.6 Contract Rules:
 * - key: required, lowercase snake_case, immutable
 * - name: required, display name
 * - entity_type: REJECTED (moved to sub-vertical.primary_entity_type)
 * - region_scope: REJECTED (moved to persona.scope + persona.region_code)
 * - All writes logged to os_controlplane_audit
 *
 * 5-Layer Hierarchy:
 * Vertical → Sub-Vertical → Persona → Policy → Binding
 *
 * Wizard is the source of truth: /superadmin/controlplane/wizard/new
 */

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
  // DEPRECATED in v2.0 - these columns exist in DB but are NOT used
  // entity_type: moved to os_sub_verticals.primary_entity_type
  // region_scope: moved to os_personas.scope + os_personas.region_code
  entity_type?: string | null;
  region_scope?: string[] | null;
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
 * POST /api/superadmin/controlplane/verticals
 * Create new vertical (v2.6 - unlocked)
 */
export async function POST(request: NextRequest) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const actorUser = sessionResult.session?.email || 'unknown';

  // v2.6: Vertical creation unlocked. Use wizard for full stack creation.

  try {
    const body = await request.json();
    const { key, name, entity_type, region_scope } = body;

    // v2.0 HARD REJECT: Deprecated fields must NOT be sent
    if (entity_type !== undefined) {
      await logControlPlaneAudit({
        actorUser,
        action: 'create_vertical',
        targetType: 'vertical',
        requestJson: body,
        success: false,
        errorMessage: 'DEPRECATED_FIELD_REJECTED: entity_type moved to sub-vertical.primary_entity_type',
      });
      return Response.json({
        success: false,
        error: 'DEPRECATED_FIELD',
        field: 'entity_type',
        message: 'entity_type is deprecated in v2.0. Use sub-vertical.primary_entity_type instead.',
      }, { status: 400 });
    }

    if (region_scope !== undefined) {
      await logControlPlaneAudit({
        actorUser,
        action: 'create_vertical',
        targetType: 'vertical',
        requestJson: body,
        success: false,
        errorMessage: 'DEPRECATED_FIELD_REJECTED: region_scope moved to persona.scope + persona.region_code',
      });
      return Response.json({
        success: false,
        error: 'DEPRECATED_FIELD',
        field: 'region_scope',
        message: 'region_scope is deprecated in v2.0. Use persona.scope and persona.region_code instead.',
      }, { status: 400 });
    }

    // Validation: key (required, snake_case)
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

    // Validation: name (required)
    if (!name || typeof name !== 'string' || !name.trim()) {
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

    // Insert vertical (v2.0: only key, name - deprecated columns get NULL)
    const result = await insert<OSVertical>(
      `INSERT INTO os_verticals (key, name, is_active)
       VALUES ($1, $2, true)
       RETURNING id, key, name, is_active, created_at, updated_at`,
      [key, name.trim()]
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
