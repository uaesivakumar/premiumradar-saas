/**
 * OS Control Plane Personas CRUD API
 *
 * GET  /api/superadmin/controlplane/personas - List all personas
 * POST /api/superadmin/controlplane/personas - Create new persona
 *
 * Contract Rules:
 * - key: required, lowercase snake_case
 * - sub_vertical_id: required, must exist
 * - Creates default policy on persona creation
 * - All writes logged to os_controlplane_audit
 */

import { NextRequest } from 'next/server';
import { query, insert, queryOne } from '@/lib/db/client';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';
import {
  logControlPlaneAudit,
  validateKey,
  conflictError,
  validationError,
  notFoundError,
  serverError,
} from '@/lib/db/controlplane-audit';

interface OSPersona {
  id: string;
  sub_vertical_id: string;
  key: string;
  name: string;
  mission: string | null;
  decision_lens: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  sub_vertical_key?: string;
  vertical_key?: string;
}

/**
 * GET /api/superadmin/controlplane/personas
 * List all personas with their parent info
 */
export async function GET() {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const personas = await query<OSPersona>(
      `SELECT p.id, p.sub_vertical_id, p.key, p.name, p.mission, p.decision_lens,
              p.is_active, p.created_at, p.updated_at,
              sv.key as sub_vertical_key, v.key as vertical_key
       FROM os_personas p
       JOIN os_sub_verticals sv ON p.sub_vertical_id = sv.id
       JOIN os_verticals v ON sv.vertical_id = v.id
       ORDER BY v.key, sv.key, p.created_at ASC`
    );

    return Response.json({
      success: true,
      data: personas,
    });
  } catch (error) {
    console.error('[ControlPlane:Personas GET] Error:', error);
    return serverError('Failed to fetch personas');
  }
}

/**
 * POST /api/superadmin/controlplane/personas
 * Create new persona with default policy
 */
export async function POST(request: NextRequest) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const actorUser = sessionResult.session?.email || 'unknown';

  try {
    const body = await request.json();
    const { sub_vertical_id, key, name, mission, decision_lens } = body;

    // Validation: sub_vertical_id
    if (!sub_vertical_id) {
      await logControlPlaneAudit({
        actorUser,
        action: 'create_persona',
        targetType: 'persona',
        requestJson: body,
        success: false,
        errorMessage: 'sub_vertical_id is required',
      });
      return validationError('sub_vertical_id', 'sub_vertical_id is required');
    }

    // Verify sub-vertical exists
    const subVertical = await queryOne<{ id: string }>(
      'SELECT id FROM os_sub_verticals WHERE id = $1',
      [sub_vertical_id]
    );

    if (!subVertical) {
      await logControlPlaneAudit({
        actorUser,
        action: 'create_persona',
        targetType: 'persona',
        requestJson: body,
        success: false,
        errorMessage: 'Sub-Vertical not found',
      });
      return notFoundError('Sub-Vertical');
    }

    // Validation: key
    const keyValidation = validateKey(key);
    if (!keyValidation.valid) {
      await logControlPlaneAudit({
        actorUser,
        action: 'create_persona',
        targetType: 'persona',
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
        action: 'create_persona',
        targetType: 'persona',
        requestJson: body,
        success: false,
        errorMessage: 'Name is required',
      });
      return validationError('name', 'Name is required');
    }

    // Check for duplicate key within sub-vertical
    const existing = await query<{ id: string }>(
      'SELECT id FROM os_personas WHERE sub_vertical_id = $1 AND key = $2',
      [sub_vertical_id, key]
    );

    if (existing.length > 0) {
      await logControlPlaneAudit({
        actorUser,
        action: 'create_persona',
        targetType: 'persona',
        requestJson: body,
        success: false,
        errorMessage: 'Duplicate key in sub-vertical',
      });
      return conflictError('key');
    }

    // Insert persona
    const result = await insert<OSPersona>(
      `INSERT INTO os_personas (sub_vertical_id, key, name, mission, decision_lens, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, sub_vertical_id, key, name, mission, decision_lens, is_active, created_at, updated_at`,
      [sub_vertical_id, key, name, mission || null, decision_lens || null]
    );

    // Create default policy for the persona
    await insert(
      `INSERT INTO os_persona_policies (persona_id, policy_version, allowed_intents, forbidden_outputs, allowed_tools)
       VALUES ($1, 1, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb)`,
      [result.id]
    );

    // Audit log success
    await logControlPlaneAudit({
      actorUser,
      action: 'create_persona',
      targetType: 'persona',
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
    console.error('[ControlPlane:Personas POST] Error:', error);
    return serverError('Failed to create persona');
  }
}
