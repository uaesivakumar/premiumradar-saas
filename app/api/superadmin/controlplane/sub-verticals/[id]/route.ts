/**
 * OS Sub-Vertical by ID API
 *
 * GET /api/superadmin/sub-verticals/:id - Get single sub-vertical
 * PUT /api/superadmin/sub-verticals/:id - Update sub-vertical
 *
 * v2.0 Fields:
 * - primary_entity_type: IMMUTABLE after creation
 * - related_entity_types: mutable array
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

interface OSSubVertical {
  id: string;
  vertical_id: string;
  key: string;
  name: string;
  default_agent: string;
  primary_entity_type: string;       // v2.0
  related_entity_types: string[];    // v2.0
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Valid entity types (v2.0)
const VALID_ENTITY_TYPES = ['deal', 'company', 'individual'] as const;

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/superadmin/sub-verticals/:id
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const subVertical = await queryOne<OSSubVertical>(
      `SELECT sv.id, sv.vertical_id, sv.key, sv.name, sv.default_agent,
              sv.primary_entity_type, sv.related_entity_types,
              sv.is_active, sv.created_at, sv.updated_at
       FROM os_sub_verticals sv
       WHERE sv.id = $1`,
      [id]
    );

    if (!subVertical) {
      return notFoundError('Sub-Vertical');
    }

    return Response.json({
      success: true,
      data: subVertical,
    });
  } catch (error) {
    console.error('[SubVertical GET] Error:', error);
    return serverError('Failed to fetch sub-vertical');
  }
}

/**
 * PUT /api/superadmin/sub-verticals/:id
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
    const { key, name, default_agent, is_active, primary_entity_type, related_entity_types } = body;

    // Check sub-vertical exists
    const existing = await queryOne<OSSubVertical>(
      'SELECT id, vertical_id, key, primary_entity_type FROM os_sub_verticals WHERE id = $1',
      [id]
    );

    if (!existing) {
      await logControlPlaneAudit({
        actorUser,
        action: 'update_sub_vertical',
        targetType: 'sub_vertical',
        targetId: id,
        requestJson: body,
        success: false,
        errorMessage: 'Not found',
      });
      return notFoundError('Sub-Vertical');
    }

    // ========================================
    // IMMUTABLE FIELD ENFORCEMENT (v2.0)
    // ========================================
    if (primary_entity_type !== undefined && primary_entity_type !== existing.primary_entity_type) {
      await logControlPlaneAudit({
        actorUser,
        action: 'update_sub_vertical',
        targetType: 'sub_vertical',
        targetId: id,
        requestJson: body,
        success: false,
        errorMessage: 'Attempted to modify immutable field: primary_entity_type',
      });
      return Response.json(
        {
          success: false,
          error: 'IMMUTABLE_FIELD',
          field: 'primary_entity_type',
          message: 'primary_entity_type is immutable and cannot be changed after creation.',
        },
        { status: 400 }
      );
    }

    // Validation: key (if provided)
    if (key !== undefined) {
      const keyValidation = validateKey(key);
      if (!keyValidation.valid) {
        await logControlPlaneAudit({
          actorUser,
          action: 'update_sub_vertical',
          targetType: 'sub_vertical',
          targetId: id,
          requestJson: body,
          success: false,
          errorMessage: keyValidation.error,
        });
        return validationError('key', keyValidation.error);
      }

      // Check for duplicate key within same vertical (if changing)
      if (key !== existing.key) {
        const duplicate = await query<{ id: string }>(
          'SELECT id FROM os_sub_verticals WHERE vertical_id = $1 AND key = $2 AND id != $3',
          [existing.vertical_id, key, id]
        );
        if (duplicate.length > 0) {
          await logControlPlaneAudit({
            actorUser,
            action: 'update_sub_vertical',
            targetType: 'sub_vertical',
            targetId: id,
            requestJson: body,
            success: false,
            errorMessage: 'Duplicate key in vertical',
          });
          return conflictError('key');
        }
      }
    }

    // Validation: related_entity_types (v2.0 - mutable array)
    if (related_entity_types !== undefined) {
      if (!Array.isArray(related_entity_types)) {
        await logControlPlaneAudit({
          actorUser,
          action: 'update_sub_vertical',
          targetType: 'sub_vertical',
          targetId: id,
          requestJson: body,
          success: false,
          errorMessage: 'related_entity_types must be an array',
        });
        return validationError('related_entity_types', 'Must be an array of entity types');
      }
      // Validate each entry
      for (const entityType of related_entity_types) {
        if (!VALID_ENTITY_TYPES.includes(entityType)) {
          await logControlPlaneAudit({
            actorUser,
            action: 'update_sub_vertical',
            targetType: 'sub_vertical',
            targetId: id,
            requestJson: body,
            success: false,
            errorMessage: `Invalid related_entity_type: ${entityType}`,
          });
          return validationError('related_entity_types', `Invalid type: ${entityType}. Must be one of: deal, company, individual`);
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
    if (default_agent !== undefined) {
      updates.push(`default_agent = $${paramIndex++}`);
      values.push(default_agent);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }
    // v2.0: related_entity_types is mutable
    if (related_entity_types !== undefined) {
      updates.push(`related_entity_types = $${paramIndex++}`);
      values.push(related_entity_types);
    }

    if (updates.length === 0) {
      return validationError('body', 'No fields to update');
    }

    values.push(id);
    const result = await queryOne<OSSubVertical>(
      `UPDATE os_sub_verticals
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, vertical_id, key, name, default_agent, primary_entity_type, related_entity_types, is_active, created_at, updated_at`,
      values
    );

    // Audit log success
    await logControlPlaneAudit({
      actorUser,
      action: 'update_sub_vertical',
      targetType: 'sub_vertical',
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
    console.error('[SubVertical PUT] Error:', error);
    return serverError('Failed to update sub-vertical');
  }
}
