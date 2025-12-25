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
 *
 * v2.0 VALIDATION (Control Plane Migration):
 * - Vertical must be active
 * - Sub-vertical must be active and belong to vertical
 * - Persona must be active and belong to sub-vertical
 * - Persona must have an ACTIVE policy (hard requirement)
 * - All 5 layers must be valid or binding fails (no silent degradation)
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

    // v2.0: Verify vertical exists AND is active
    const vertical = await queryOne<{ id: string; key: string; is_active: boolean }>(
      'SELECT id, key, is_active FROM os_verticals WHERE id = $1',
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

    // v2.0: Vertical must be active
    if (!vertical.is_active) {
      await logControlPlaneAudit({
        actorUser,
        action: 'update_binding',
        targetType: 'binding',
        requestJson: { ...body, workspace_id },
        success: false,
        errorMessage: 'Cannot bind to inactive vertical',
      });
      return Response.json({
        success: false,
        error: 'VERTICAL_INACTIVE',
        message: `Vertical '${vertical.key}' is inactive. Cannot create binding to inactive entities.`,
      }, { status: 400 });
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

    // v2.0: Verify sub-vertical exists, belongs to vertical, AND is active
    const subVertical = await queryOne<{ id: string; key: string; is_active: boolean }>(
      'SELECT id, key, is_active FROM os_sub_verticals WHERE id = $1 AND vertical_id = $2',
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

    // v2.0: Sub-vertical must be active
    if (!subVertical.is_active) {
      await logControlPlaneAudit({
        actorUser,
        action: 'update_binding',
        targetType: 'binding',
        requestJson: { ...body, workspace_id },
        success: false,
        errorMessage: 'Cannot bind to inactive sub-vertical',
      });
      return Response.json({
        success: false,
        error: 'SUB_VERTICAL_INACTIVE',
        message: `Sub-Vertical '${subVertical.key}' is inactive. Cannot create binding to inactive entities.`,
      }, { status: 400 });
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

    // v2.0: Verify persona exists, belongs to sub-vertical, AND is active
    const persona = await queryOne<{ id: string; key: string; is_active: boolean }>(
      'SELECT id, key, is_active FROM os_personas WHERE id = $1 AND sub_vertical_id = $2',
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

    // v2.0: Persona must be active
    if (!persona.is_active) {
      await logControlPlaneAudit({
        actorUser,
        action: 'update_binding',
        targetType: 'binding',
        requestJson: { ...body, workspace_id },
        success: false,
        errorMessage: 'Cannot bind to inactive persona',
      });
      return Response.json({
        success: false,
        error: 'PERSONA_INACTIVE',
        message: `Persona '${persona.key}' is inactive. Cannot create binding to inactive entities.`,
      }, { status: 400 });
    }

    // v2.0 CRITICAL: Verify persona has an ACTIVE policy
    const activePolicy = await queryOne<{ id: string; policy_version: number; status: string }>(
      `SELECT id, policy_version, status FROM os_persona_policies
       WHERE persona_id = $1 AND status = 'ACTIVE'`,
      [persona_id]
    );

    if (!activePolicy) {
      await logControlPlaneAudit({
        actorUser,
        action: 'update_binding',
        targetType: 'binding',
        requestJson: { ...body, workspace_id },
        success: false,
        errorMessage: 'Persona has no active policy - binding blocked',
      });
      return Response.json({
        success: false,
        error: 'NO_ACTIVE_POLICY',
        message: `Persona '${persona.key}' has no ACTIVE policy. All personas must have an ACTIVE policy before they can be bound to workspaces.`,
        hint: 'Activate a policy for this persona in the Control Plane, then retry binding.',
      }, { status: 400 });
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
         SET vertical_id = $1, sub_vertical_id = $2, persona_id = $3, is_active = $4, updated_at = NOW()
         WHERE tenant_id = $5 AND workspace_id = $6
         RETURNING id, tenant_id, workspace_id, vertical_id, sub_vertical_id, persona_id,
                   is_active, created_at, updated_at`,
        [vertical_id, sub_vertical_id, persona_id, is_active !== false, tenant_id, workspace_id]
      );
    } else {
      // Create new binding
      action = 'create_binding';
      result = await queryOne<OSWorkspaceBinding>(
        `INSERT INTO os_workspace_bindings
         (tenant_id, workspace_id, vertical_id, sub_vertical_id, persona_id, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, tenant_id, workspace_id, vertical_id, sub_vertical_id, persona_id,
                   is_active, created_at, updated_at`,
        [tenant_id, workspace_id, vertical_id, sub_vertical_id, persona_id, is_active !== false]
      );
    }

    // Guard: Ensure result is not null
    if (!result) {
      console.error('[ControlPlane:Binding PUT] Database operation returned null');
      await logControlPlaneAudit({
        actorUser,
        action,
        targetType: 'binding',
        requestJson: { ...body, workspace_id },
        success: false,
        errorMessage: 'Database operation returned null result',
      });
      return Response.json({
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to create or update binding - database returned empty result',
      }, { status: 500 });
    }

    // Build response data
    const responseData = {
      id: result.id,
      tenant_id: result.tenant_id,
      workspace_id: result.workspace_id,
      vertical_id: result.vertical_id,
      sub_vertical_id: result.sub_vertical_id,
      persona_id: result.persona_id,
      is_active: result.is_active,
      created_at: result.created_at,
      updated_at: result.updated_at,
      vertical_key: vertical.key,
      sub_vertical_key: subVertical.key,
      persona_key: persona.key,
    };

    // Audit log success
    await logControlPlaneAudit({
      actorUser,
      action,
      targetType: 'binding',
      targetId: result.id,
      requestJson: { ...body, workspace_id },
      resultJson: responseData,
      success: true,
    });

    return Response.json({
      success: true,
      data: responseData,
    }, { status: existingBinding ? 200 : 201 });

  } catch (error) {
    console.error('[ControlPlane:Binding PUT] Error:', error);
    // Ensure we always return valid JSON even on error
    return Response.json({
      success: false,
      error: 'SERVER_ERROR',
      message: error instanceof Error ? error.message : 'Failed to update binding',
    }, { status: 500 });
  }
}
