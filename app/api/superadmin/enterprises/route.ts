/**
 * Super Admin - Enterprises API
 * List all enterprises (tenants)
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifySession } from '@/lib/superadmin/security';
import { query } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    // Verify super admin session
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               headersList.get('x-real-ip') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    const sessionResult = await verifySession(ip, userAgent);
    if (!sessionResult.valid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query params for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const plan = searchParams.get('plan');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let whereClause = 'WHERE 1=1';
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND e.status = $${paramIndex++}`;
      params.push(status);
    }

    if (plan) {
      whereClause += ` AND e.plan = $${paramIndex++}`;
      params.push(plan);
    }

    // Get enterprises with user counts
    const enterprises = await query<{
      enterprise_id: string;
      name: string;
      domain: string | null;
      type: string;
      status: string;
      plan: string | null;
      region: string;
      max_users: number;
      max_workspaces: number;
      user_count: string;
      workspace_count: string;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT
        e.enterprise_id,
        e.name,
        e.domain,
        e.type,
        e.status,
        e.plan,
        e.region,
        e.max_users,
        e.max_workspaces,
        (SELECT COUNT(*) FROM users u WHERE u.enterprise_id = e.enterprise_id) as user_count,
        (SELECT COUNT(*) FROM workspaces w WHERE w.enterprise_id = e.enterprise_id) as workspace_count,
        e.created_at,
        e.updated_at
      FROM enterprises e
      ${whereClause}
      ORDER BY e.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, limit, offset]
    );

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM enterprises e ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0]?.count || '0');

    // Get stats
    const statsResult = await query<{
      total_enterprises: string;
      active_enterprises: string;
      demo_enterprises: string;
      paid_enterprises: string;
    }>(
      `SELECT
        COUNT(*) as total_enterprises,
        COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_enterprises,
        COUNT(*) FILTER (WHERE type = 'DEMO') as demo_enterprises,
        COUNT(*) FILTER (WHERE plan IN ('starter', 'professional', 'enterprise')) as paid_enterprises
      FROM enterprises`
    );

    return NextResponse.json({
      success: true,
      data: {
        enterprises: enterprises.map(e => ({
          ...e,
          user_count: parseInt(e.user_count),
          workspace_count: parseInt(e.workspace_count),
        })),
        total,
        limit,
        offset,
        stats: {
          total_enterprises: parseInt(statsResult[0]?.total_enterprises || '0'),
          active_enterprises: parseInt(statsResult[0]?.active_enterprises || '0'),
          demo_enterprises: parseInt(statsResult[0]?.demo_enterprises || '0'),
          paid_enterprises: parseInt(statsResult[0]?.paid_enterprises || '0'),
        }
      }
    });
  } catch (error) {
    console.error('[SuperAdmin] GET /api/superadmin/enterprises error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch enterprises' },
      { status: 500 }
    );
  }
}
