/**
 * OS Vertical by ID API
 *
 * GET   /api/superadmin/controlplane/verticals/:id - Get single vertical
 * PATCH /api/superadmin/controlplane/verticals/:id - Update vertical (name, region_scope, is_active ONLY)
 *
 * IMMUTABLE FIELDS (cannot be changed after creation):
 * - key: identifier used in bindings and resolve-config
 * - entity_type: changing would break existing workflows
 *
 * Contract Rules:
 * - Only name, region_scope, is_active can be modified
 * - Deactivation logs affected binding count for audit trail
 * - All writes logged to os_controlplane_audit
 */

import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';
import {
  logControlPlaneAudit,
  validationError,
  notFoundError,
  serverError,
  type AuditAction,
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
 * GET /api/superadmin/controlplane/verticals/:id
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

    // Also get affected binding count for visibility
    const bindingCount = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM os_workspace_bindings WHERE vertical_id = $1`,
      [id]
    );

    return Response.json({
      success: true,
      data: {
        ...vertical,
        binding_count: parseInt(bindingCount?.count || '0', 10),
      },
    });
  } catch (error) {
    console.error('[Vertical GET] Error:', error);
    return serverError('Failed to fetch vertical');
  }
}

/**
 * PATCH /api/superadmin/controlplane/verticals/:id
 * Update vertical - ONLY name, region_scope, is_active allowed
 * key and entity_type are IMMUTABLE
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const actorUser = sessionResult.session?.email || 'unknown';

  try {
    const body = await request.json();

    // Check vertical exists
    const existing = await queryOne<OSVertical>(
      `SELECT id, key, name, entity_type, region_scope, is_active, created_at, updated_at
       FROM os_verticals WHERE id = $1`,
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
        errorMessage: 'Vertical not found',
      });
      return notFoundError('Vertical');
    }

    // ========================================
    // IMMUTABLE FIELD ENFORCEMENT
    // ========================================
    if (body.key !== undefined && body.key !== existing.key) {
      await logControlPlaneAudit({
        actorUser,
        action: 'update_vertical',
        targetType: 'vertical',
        targetId: id,
        requestJson: body,
        success: false,
        errorMessage: 'Attempted to modify immutable field: key',
      });
      return Response.json(
        {
          success: false,
          error: 'IMMUTABLE_FIELD',
          field: 'key',
          message: 'Key is immutable and cannot be changed after creation. Create a new vertical instead.',
        },
        { status: 400 }
      );
    }

    if (body.entity_type !== undefined && body.entity_type !== existing.entity_type) {
      await logControlPlaneAudit({
        actorUser,
        action: 'update_vertical',
        targetType: 'vertical',
        targetId: id,
        requestJson: body,
        success: false,
        errorMessage: 'Attempted to modify immutable field: entity_type',
      });
      return Response.json(
        {
          success: false,
          error: 'IMMUTABLE_FIELD',
          field: 'entity_type',
          message: 'Entity type is immutable and cannot be changed after creation. Create a new vertical instead.',
        },
        { status: 400 }
      );
    }

    // ========================================
    // MUTABLE FIELD VALIDATION & UPDATE
    // ========================================
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;
    const changes: Record<string, { from: unknown; to: unknown; affected_bindings?: number }> = {};

    // name (mutable)
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim() === '') {
        await logControlPlaneAudit({
          actorUser,
          action: 'update_vertical',
          targetType: 'vertical',
          targetId: id,
          requestJson: body,
          success: false,
          errorMessage: 'Invalid name: must be non-empty string',
        });
        return validationError('name', 'Name must be a non-empty string');
      }
      const newName = body.name.trim();
      if (newName !== existing.name) {
        updates.push(`name = $${paramIndex++}`);
        values.push(newName);
        changes.name = { from: existing.name, to: newName };
      }
    }

    // region_scope (mutable)
    if (body.region_scope !== undefined) {
      if (!Array.isArray(body.region_scope) || body.region_scope.length === 0) {
        await logControlPlaneAudit({
          actorUser,
          action: 'update_vertical',
          targetType: 'vertical',
          targetId: id,
          requestJson: body,
          success: false,
          errorMessage: 'Invalid region_scope: must be non-empty array',
        });
        return validationError('region_scope', 'Region scope must be a non-empty array');
      }
      const newRegions = body.region_scope.map((r: string) => r.trim().toUpperCase());
      updates.push(`region_scope = $${paramIndex++}`);
      values.push(JSON.stringify(newRegions));
      changes.region_scope = { from: existing.region_scope, to: newRegions };
    }

    // is_active (mutable) - DEACTIVATION HANDLING
    if (body.is_active !== undefined) {
      if (typeof body.is_active !== 'boolean') {
        await logControlPlaneAudit({
          actorUser,
          action: 'update_vertical',
          targetType: 'vertical',
          targetId: id,
          requestJson: body,
          success: false,
          errorMessage: 'Invalid is_active: must be boolean',
        });
        return validationError('is_active', 'is_active must be a boolean');
      }

      if (body.is_active !== existing.is_active) {
        // Count affected bindings for audit trail
        const affectedBindings = await query<{ count: string; tenant_ids: string[] }>(
          `SELECT
             COUNT(*) as count,
             ARRAY_AGG(DISTINCT tenant_id) as tenant_ids
           FROM os_workspace_bindings
           WHERE vertical_id = $1 AND is_active = true`,
          [id]
        );

        const bindingCount = parseInt(affectedBindings[0]?.count || '0', 10);

        if (!body.is_active && bindingCount > 0) {
          // Deactivating with active bindings - log warning
          console.warn(
            `[DEACTIVATION WARNING] Vertical ${existing.key} (${id}) is being deactivated with ${bindingCount} active bindings`
          );
        }

        updates.push(`is_active = $${paramIndex++}`);
        values.push(body.is_active);
        changes.is_active = {
          from: existing.is_active,
          to: body.is_active,
          affected_bindings: bindingCount,
        };
      }
    }

    // No changes
    if (updates.length === 0) {
      return Response.json({
        success: true,
        data: existing,
        message: 'No changes detected',
      });
    }

    // Add updated_at
    updates.push(`updated_at = NOW()`);

    // Execute update
    values.push(id);
    const result = await queryOne<OSVertical>(
      `UPDATE os_verticals
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, key, name, entity_type, region_scope, is_active, created_at, updated_at`,
      values
    );

    // Determine action type for audit
    let action: AuditAction = 'update_vertical';
    if (changes.is_active) {
      action = body.is_active ? 'activate_vertical' : 'deactivate_vertical';
    }

    // Audit log success
    await logControlPlaneAudit({
      actorUser,
      action,
      targetType: 'vertical',
      targetId: id,
      requestJson: body,
      resultJson: {
        key: existing.key,
        changes,
        updated: result,
      },
      success: true,
    });

    return Response.json({
      success: true,
      data: result,
      changes,
    });
  } catch (error) {
    console.error('[Vertical PATCH] Error:', error);
    return serverError('Failed to update vertical');
  }
}

// Keep PUT for backwards compatibility, but delegate to PATCH
export async function PUT(request: NextRequest, context: RouteParams) {
  return PATCH(request, context);
}
