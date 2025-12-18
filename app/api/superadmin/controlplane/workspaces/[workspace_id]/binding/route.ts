/**
 * OS Control Plane Workspace Binding API
 *
 * GET /api/superadmin/controlplane/workspaces/:workspace_id/binding - Get binding
 * PUT /api/superadmin/controlplane/workspaces/:workspace_id/binding - Create or update binding
 *
 * Workspace binding links a tenant's workspace to:
 * - vertical_id
 * - sub_vertical_id
 * - persona_id
 *
 * This is what resolve-config uses at runtime.
 */

import { NextRequest } from 'next/server';
import { query, queryOne, insert } from '@/lib/db/client';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';
import {
  logControlPlaneAudit,
  validationError,
  notFoundError,
  serverError,
} from '@/lib/db/controlplane-audit';

interface OSWorkspaceBinding {
  id: string;
  tenant_id: string;
  workspace_id: string;
  vertical_id: string;
  sub_vertical_id: string;
  persona_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  vertical_key?: string;
  sub_vertical_key?: string;
  persona_key?: string;
}

interface RouteParams {
  params: Promise<{ workspace_id: string }>;
}

/**
 * GET /api/superadmin/controlplane/workspaces/:workspace_id/binding
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { workspace_id } = await params;

  // Get tenant_id from query params
  const url = new URL(request.url);
  const tenant_id = url.searchParams.get('tenant_id');

  if (!tenant_id) {
    return validationError('tenant_id', 'tenant_id query parameter is required');
  }

  try {
    const binding = await queryOne<OSWorkspaceBinding>(
      `SELECT wb.id, wb.tenant_id, wb.workspace_id, wb.vertical_id, wb.sub_vertical_id,
              wb.persona_id, wb.is_active, wb.created_at, wb.updated_at,
              v.key as vertical_key, sv.key as sub_vertical_key, p.key as persona_key
       FROM os_workspace_bindings wb
       JOIN os_verticals v ON wb.vertical_id = v.id
       JOIN os_sub_verticals sv ON wb.sub_vertical_id = sv.id
       JOIN os_personas p ON wb.persona_id = p.id
       WHERE wb.tenant_id = $1 AND wb.workspace_id = $2`,
      [tenant_id, workspace_id]
    );

    if (!binding) {
      return notFoundError('Workspace binding');
    }

    return Response.json({
      success: true,
      data: binding,
    });
  } catch (error) {
    console.error('[ControlPlane:Binding GET] Error:', error);
    return serverError('Failed to fetch binding');
  }
}

/**
 * PUT /api/superadmin/controlplane/workspaces/:workspace_id/binding
 * Create or update workspace binding (upsert)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { workspace_id } = await params;
  const actorUser = sessionResult.session?.email || 'unknown';

  try {
    const body = await request.json();
    const { tenant_id, vertical_id, sub_vertical_id, persona_id, is_active } = body;

    // Validation: tenant_id
    if (!tenant_id) {
      await logControlPlaneAudit({
        actorUser,
        action: 'update_binding',
        targetType: 'binding',
        requestJson: { ...body, workspace_id },
        success: false,
        errorMessage: 'tenant_id is required',
      });
      return validationError('tenant_id', 'tenant_id is required');
    }

    // Validation: vertical_id
    if (!vertical_id) {
      await logControlPlaneAudit({
        actorUser,
        action: 'update_binding',
        targetType: 'binding',
        requestJson: { ...body, workspace_id },
        success: false,
        errorMessage: 'vertical_id is required',
      });
      return validationError('vertical_id', 'vertical_id is required');
    }

    // Verify vertical exists
    const vertical = await queryOne<{ id: string; key: string }>(
      'SELECT id, key FROM os_verticals WHERE id = $1',
      [vertical_id]
    );

    if (!vertical) {
      await logControlPlaneAudit({
        actorUser,
        action: 'update_binding',
        targetType: 'binding',
        requestJson: { ...body, workspace_id },
        success: false,
        errorMessage: 'Vertical not found',
      });
      return notFoundError('Vertical');
    }

    // Validation: sub_vertical_id
    if (!sub_vertical_id) {
      await logControlPlaneAudit({
        actorUser,
        action: 'update_binding',
        targetType: 'binding',
        requestJson: { ...body, workspace_id },
        success: false,
        errorMessage: 'sub_vertical_id is required',
      });
      return validationError('sub_vertical_id', 'sub_vertical_id is required');
    }

    // Verify sub-vertical exists and belongs to vertical
    const subVertical = await queryOne<{ id: string; key: string }>(
      'SELECT id, key FROM os_sub_verticals WHERE id = $1 AND vertical_id = $2',
      [sub_vertical_id, vertical_id]
    );

    if (!subVertical) {
      await logControlPlaneAudit({
        actorUser,
        action: 'update_binding',
        targetType: 'binding',
        requestJson: { ...body, workspace_id },
        success: false,
        errorMessage: 'Sub-Vertical not found or does not belong to vertical',
      });
      return notFoundError('Sub-Vertical');
    }

    // Validation: persona_id
    if (!persona_id) {
      await logControlPlaneAudit({
        actorUser,
        action: 'update_binding',
        targetType: 'binding',
        requestJson: { ...body, workspace_id },
        success: false,
        errorMessage: 'persona_id is required',
      });
      return validationError('persona_id', 'persona_id is required');
    }

    // Verify persona exists and belongs to sub-vertical
    const persona = await queryOne<{ id: string; key: string }>(
      'SELECT id, key FROM os_personas WHERE id = $1 AND sub_vertical_id = $2',
      [persona_id, sub_vertical_id]
    );

    if (!persona) {
      await logControlPlaneAudit({
        actorUser,
        action: 'update_binding',
        targetType: 'binding',
        requestJson: { ...body, workspace_id },
        success: false,
        errorMessage: 'Persona not found or does not belong to sub-vertical',
      });
      return notFoundError('Persona');
    }

    // Check if binding already exists
    const existingBinding = await queryOne<{ id: string }>(
      'SELECT id FROM os_workspace_bindings WHERE tenant_id = $1 AND workspace_id = $2',
      [tenant_id, workspace_id]
    );

    let result: OSWorkspaceBinding | null;
    let action: 'create_binding' | 'update_binding';

    if (existingBinding) {
      // Update existing binding
      action = 'update_binding';
      result = await queryOne<OSWorkspaceBinding>(
        `UPDATE os_workspace_bindings
         SET vertical_id = $1, sub_vertical_id = $2, persona_id = $3, is_active = $4
         WHERE tenant_id = $5 AND workspace_id = $6
         RETURNING id, tenant_id, workspace_id, vertical_id, sub_vertical_id, persona_id,
                   is_active, created_at, updated_at`,
        [vertical_id, sub_vertical_id, persona_id, is_active !== false, tenant_id, workspace_id]
      );
    } else {
      // Create new binding
      action = 'create_binding';
      result = await insert<OSWorkspaceBinding>(
        `INSERT INTO os_workspace_bindings
         (tenant_id, workspace_id, vertical_id, sub_vertical_id, persona_id, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, tenant_id, workspace_id, vertical_id, sub_vertical_id, persona_id,
                   is_active, created_at, updated_at`,
        [tenant_id, workspace_id, vertical_id, sub_vertical_id, persona_id, is_active !== false]
      );
    }

    // Audit log success
    await logControlPlaneAudit({
      actorUser,
      action,
      targetType: 'binding',
      targetId: result?.id,
      requestJson: { ...body, workspace_id },
      resultJson: {
        ...result,
        vertical_key: vertical.key,
        sub_vertical_key: subVertical.key,
        persona_key: persona.key,
      },
      success: true,
    });

    return Response.json({
      success: true,
      data: {
        ...result,
        vertical_key: vertical.key,
        sub_vertical_key: subVertical.key,
        persona_key: persona.key,
      },
    }, { status: existingBinding ? 200 : 201 });

  } catch (error) {
    console.error('[ControlPlane:Binding PUT] Error:', error);
    return serverError('Failed to update binding');
  }
}
