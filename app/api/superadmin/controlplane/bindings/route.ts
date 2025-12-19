/**
 * OS Control Plane Workspace Bindings List API
 *
 * GET /api/superadmin/controlplane/bindings - List all workspace bindings
 *
 * Purpose: Read-only visibility into which tenants/workspaces are bound to which
 * verticals/personas. Essential for understanding blast radius before editing
 * or deactivating any control plane entity.
 *
 * Query params:
 * - vertical_id: filter by vertical
 * - sub_vertical_id: filter by sub-vertical
 * - persona_id: filter by persona
 * - tenant_id: filter by tenant
 * - is_active: filter by active status (true/false)
 * - limit: pagination limit (default 50, max 100)
 * - offset: pagination offset (default 0)
 */

import { NextRequest } from 'next/server';
import { query } from '@/lib/db/client';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';
import { serverError } from '@/lib/db/controlplane-audit';

interface WorkspaceBindingWithJoins {
  id: string;
  tenant_id: string;
  workspace_id: string;
  vertical_id: string;
  vertical_key: string;
  vertical_name: string;
  vertical_is_active: boolean;
  sub_vertical_id: string;
  sub_vertical_key: string;
  sub_vertical_name: string;
  sub_vertical_is_active: boolean;
  persona_id: string;
  persona_key: string;
  persona_name: string;
  persona_is_active: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/superadmin/controlplane/bindings
 * List all workspace bindings with full joined data
 */
export async function GET(request: NextRequest) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);

    // Parse filters
    const verticalId = url.searchParams.get('vertical_id');
    const subVerticalId = url.searchParams.get('sub_vertical_id');
    const personaId = url.searchParams.get('persona_id');
    const tenantId = url.searchParams.get('tenant_id');
    const isActiveParam = url.searchParams.get('is_active');

    // Parse pagination
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    // Build query dynamically
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (verticalId) {
      conditions.push(`wb.vertical_id = $${paramIndex++}`);
      values.push(verticalId);
    }

    if (subVerticalId) {
      conditions.push(`wb.sub_vertical_id = $${paramIndex++}`);
      values.push(subVerticalId);
    }

    if (personaId) {
      conditions.push(`wb.persona_id = $${paramIndex++}`);
      values.push(personaId);
    }

    if (tenantId) {
      conditions.push(`wb.tenant_id = $${paramIndex++}`);
      values.push(tenantId);
    }

    if (isActiveParam !== null) {
      conditions.push(`wb.is_active = $${paramIndex++}`);
      values.push(isActiveParam === 'true');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM os_workspace_bindings wb
       ${whereClause}`,
      values
    );
    const total = parseInt(countResult[0]?.count || '0', 10);

    // Get bindings with joins
    values.push(limit);
    values.push(offset);

    const bindings = await query<WorkspaceBindingWithJoins>(
      `SELECT
         wb.id,
         wb.tenant_id,
         wb.workspace_id,
         wb.vertical_id,
         v.key as vertical_key,
         v.name as vertical_name,
         v.is_active as vertical_is_active,
         wb.sub_vertical_id,
         sv.key as sub_vertical_key,
         sv.name as sub_vertical_name,
         sv.is_active as sub_vertical_is_active,
         wb.persona_id,
         p.key as persona_key,
         p.name as persona_name,
         p.is_active as persona_is_active,
         wb.is_active,
         wb.created_at,
         wb.updated_at
       FROM os_workspace_bindings wb
       JOIN os_verticals v ON wb.vertical_id = v.id
       JOIN os_sub_verticals sv ON wb.sub_vertical_id = sv.id
       JOIN os_personas p ON wb.persona_id = p.id
       ${whereClause}
       ORDER BY wb.updated_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      values
    );

    // Flag any bindings with inactive parents
    const bindingsWithWarnings = bindings.map((b) => {
      const warnings: string[] = [];
      if (!b.vertical_is_active) warnings.push('Vertical is inactive');
      if (!b.sub_vertical_is_active) warnings.push('Sub-vertical is inactive');
      if (!b.persona_is_active) warnings.push('Persona is inactive');

      return {
        ...b,
        has_warnings: warnings.length > 0,
        warnings,
      };
    });

    // Summary stats
    const activeCount = bindings.filter((b) => b.is_active).length;
    const warningCount = bindingsWithWarnings.filter((b) => b.has_warnings).length;

    return Response.json({
      success: true,
      data: {
        bindings: bindingsWithWarnings,
        pagination: {
          total,
          limit,
          offset,
          has_more: offset + limit < total,
        },
        summary: {
          total_bindings: total,
          active_bindings: activeCount,
          bindings_with_warnings: warningCount,
        },
      },
    });
  } catch (error) {
    console.error('[ControlPlane:Bindings List] Error:', error);
    return serverError('Failed to fetch bindings');
  }
}
