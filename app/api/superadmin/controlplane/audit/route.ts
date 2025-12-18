/**
 * OS Control Plane Audit Log API
 *
 * GET /api/superadmin/controlplane/audit
 *
 * Read-only endpoint for ops/compliance visibility.
 * Returns recent control plane audit entries.
 *
 * Query params:
 * - limit: Max entries (default 50, max 200)
 * - offset: Pagination offset (default 0)
 * - action: Filter by action type
 * - target_type: Filter by target type
 */

import { NextRequest } from 'next/server';
import { query } from '@/lib/db/client';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';

interface AuditEntry {
  id: string;
  actor_user: string;
  action: string;
  target_type: string;
  target_id: string | null;
  request_json: Record<string, unknown> | null;
  result_json: Record<string, unknown> | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

export async function GET(request: NextRequest) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const action = searchParams.get('action');
  const targetType = searchParams.get('target_type');

  try {
    // Build query with optional filters
    let whereClause = '';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (action) {
      whereClause += `${whereClause ? ' AND ' : 'WHERE '}action = $${paramIndex++}`;
      params.push(action);
    }

    if (targetType) {
      whereClause += `${whereClause ? ' AND ' : 'WHERE '}target_type = $${paramIndex++}`;
      params.push(targetType);
    }

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM os_controlplane_audit ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0]?.count || '0', 10);

    // Get entries
    params.push(limit, offset);
    const entries = await query<AuditEntry>(
      `SELECT
        id, actor_user, action, target_type, target_id,
        request_json, result_json, success, error_message, created_at
       FROM os_controlplane_audit
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      params
    );

    // Get distinct action types for filter dropdown
    const actionTypes = await query<{ action: string }>(
      'SELECT DISTINCT action FROM os_controlplane_audit ORDER BY action'
    );

    // Get distinct target types for filter dropdown
    const targetTypes = await query<{ target_type: string }>(
      'SELECT DISTINCT target_type FROM os_controlplane_audit ORDER BY target_type'
    );

    return Response.json({
      success: true,
      data: {
        entries,
        total,
        limit,
        offset,
        filters: {
          actions: actionTypes.map(a => a.action),
          targetTypes: targetTypes.map(t => t.target_type),
        },
      },
    });
  } catch (error) {
    console.error('[ControlPlane:Audit] Error:', error);
    return Response.json({
      success: false,
      error: 'server_error',
      message: 'Failed to fetch audit log',
    }, { status: 500 });
  }
}
