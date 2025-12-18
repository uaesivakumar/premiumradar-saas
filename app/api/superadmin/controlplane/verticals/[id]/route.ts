/**
 * OS Vertical by ID API
 *
 * GET /api/superadmin/verticals/:id - Get single vertical
 * PUT /api/superadmin/verticals/:id - Update vertical
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

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/superadmin/verticals/:id
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const vertical = await queryOne<OSVertical>(
      `SELECT id, key, name, entity_type, region_scope, is_active, created_at, updated_at
       FROM os_verticals WHERE id = $1`,
      [id]
    );

    if (!vertical) {
      return notFoundError('Vertical');
    }

    return Response.json({
      success: true,
      data: vertical,
    });
  } catch (error) {
    console.error('[Vertical GET] Error:', error);
    return serverError('Failed to fetch vertical');
  }
}

/**
 * PUT /api/superadmin/verticals/:id
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
    const { key, name, entity_type, region_scope, is_active } = body;

    // Check vertical exists
    const existing = await queryOne<OSVertical>(
      'SELECT id, key FROM os_verticals WHERE id = $1',
      [id]
    );

    if (!existing) {
      await logControlPlaneAudit({
        actorUser,
        action: 'update_vertical',
        targetType: 'vertical',
        targetId: id,
        requestJson: body,
        success: false,
        errorMessage: 'Not found',
      });
      return notFoundError('Vertical');
    }

    // Validation: key (if provided)
    if (key !== undefined) {
      const keyValidation = validateKey(key);
      if (!keyValidation.valid) {
        await logControlPlaneAudit({
          actorUser,
          action: 'update_vertical',
          targetType: 'vertical',
          targetId: id,
          requestJson: body,
          success: false,
          errorMessage: keyValidation.error,
        });
        return validationError('key', keyValidation.error);
      }

      // Check for duplicate key (if changing)
      if (key !== existing.key) {
        const duplicate = await query<{ id: string }>(
          'SELECT id FROM os_verticals WHERE key = $1 AND id != $2',
          [key, id]
        );
        if (duplicate.length > 0) {
          await logControlPlaneAudit({
            actorUser,
            action: 'update_vertical',
            targetType: 'vertical',
            targetId: id,
            requestJson: body,
            success: false,
            errorMessage: 'Duplicate key',
          });
          return conflictError('key');
        }
      }
    }

    // Validation: entity_type (if provided)
    if (entity_type !== undefined) {
      const validEntityTypes = ['deal', 'company', 'individual'];
      if (!validEntityTypes.includes(entity_type)) {
        await logControlPlaneAudit({
          actorUser,
          action: 'update_vertical',
          targetType: 'vertical',
          targetId: id,
          requestJson: body,
          success: false,
          errorMessage: 'Invalid entity_type',
        });
        return validationError('entity_type', 'Must be one of: deal, company, individual');
      }
    }

    // Validation: region_scope (if provided)
    if (region_scope !== undefined) {
      if (!Array.isArray(region_scope) || region_scope.length === 0) {
        await logControlPlaneAudit({
          actorUser,
          action: 'update_vertical',
          targetType: 'vertical',
          targetId: id,
          requestJson: body,
          success: false,
          errorMessage: 'Invalid region_scope',
        });
        return validationError('region_scope', 'Must be non-empty array of regions');
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
    if (entity_type !== undefined) {
      updates.push(`entity_type = $${paramIndex++}`);
      values.push(entity_type);
    }
    if (region_scope !== undefined) {
      updates.push(`region_scope = $${paramIndex++}`);
      values.push(JSON.stringify(region_scope));
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      return validationError('body', 'No fields to update');
    }

    values.push(id);
    const result = await queryOne<OSVertical>(
      `UPDATE os_verticals
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, key, name, entity_type, region_scope, is_active, created_at, updated_at`,
      values
    );

    // Audit log success
    await logControlPlaneAudit({
      actorUser,
      action: 'update_vertical',
      targetType: 'vertical',
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
    console.error('[Vertical PUT] Error:', error);
    return serverError('Failed to update vertical');
  }
}
