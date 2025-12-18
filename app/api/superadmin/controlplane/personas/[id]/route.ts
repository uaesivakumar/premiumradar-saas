/**
 * OS Control Plane Persona by ID API
 *
 * GET /api/superadmin/controlplane/personas/:id - Get single persona
 * PUT /api/superadmin/controlplane/personas/:id - Update persona
 */

import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
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
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/superadmin/controlplane/personas/:id
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const persona = await queryOne<OSPersona>(
      `SELECT id, sub_vertical_id, key, name, mission, decision_lens, is_active, created_at, updated_at
       FROM os_personas WHERE id = $1`,
      [id]
    );

    if (!persona) {
      return notFoundError('Persona');
    }

    return Response.json({
      success: true,
      data: persona,
    });
  } catch (error) {
    console.error('[ControlPlane:Persona GET] Error:', error);
    return serverError('Failed to fetch persona');
  }
}

/**
 * PUT /api/superadmin/controlplane/personas/:id
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const actorUser = sessionResult.session?.email || 'unknown';

  try {
    const body = await request.json();
    const { key, name, mission, decision_lens, is_active } = body;

    // Check persona exists
    const existing = await queryOne<OSPersona>(
      'SELECT id, sub_vertical_id, key FROM os_personas WHERE id = $1',
      [id]
    );

    if (!existing) {
      await logControlPlaneAudit({
        actorUser,
        action: 'update_persona',
        targetType: 'persona',
        targetId: id,
        requestJson: body,
        success: false,
        errorMessage: 'Not found',
      });
      return notFoundError('Persona');
    }

    // Validation: key (if provided)
    if (key !== undefined) {
      const keyValidation = validateKey(key);
      if (!keyValidation.valid) {
        await logControlPlaneAudit({
          actorUser,
          action: 'update_persona',
          targetType: 'persona',
          targetId: id,
          requestJson: body,
          success: false,
          errorMessage: keyValidation.error,
        });
        return validationError('key', keyValidation.error);
      }

      // Check for duplicate key within same sub-vertical (if changing)
      if (key !== existing.key) {
        const duplicate = await query<{ id: string }>(
          'SELECT id FROM os_personas WHERE sub_vertical_id = $1 AND key = $2 AND id != $3',
          [existing.sub_vertical_id, key, id]
        );
        if (duplicate.length > 0) {
          await logControlPlaneAudit({
            actorUser,
            action: 'update_persona',
            targetType: 'persona',
            targetId: id,
            requestJson: body,
            success: false,
            errorMessage: 'Duplicate key in sub-vertical',
          });
          return conflictError('key');
        }
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (key !== undefined) {
      updates.push(`key = $${paramIndex++}`);
      values.push(key);
    }
    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (mission !== undefined) {
      updates.push(`mission = $${paramIndex++}`);
      values.push(mission);
    }
    if (decision_lens !== undefined) {
      updates.push(`decision_lens = $${paramIndex++}`);
      values.push(decision_lens);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      return validationError('body', 'No fields to update');
    }

    values.push(id);
    const result = await queryOne<OSPersona>(
      `UPDATE os_personas
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, sub_vertical_id, key, name, mission, decision_lens, is_active, created_at, updated_at`,
      values
    );

    // Audit log success
    await logControlPlaneAudit({
      actorUser,
      action: 'update_persona',
      targetType: 'persona',
      targetId: id,
      requestJson: body,
      resultJson: result as unknown as Record<string, unknown>,
      success: true,
    });

    return Response.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('[ControlPlane:Persona PUT] Error:', error);
    return serverError('Failed to update persona');
  }
}
