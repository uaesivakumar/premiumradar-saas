/**
 * Super Admin - Users API
 * List all users across all enterprises
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
    const enterpriseId = searchParams.get('enterprise_id');
    const role = searchParams.get('role');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let whereClause = 'WHERE 1=1';
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (enterpriseId) {
      whereClause += ` AND u.enterprise_id = $${paramIndex++}`;
      params.push(enterpriseId);
    }

    if (role) {
      whereClause += ` AND u.role = $${paramIndex++}`;
      params.push(role);
    }

    // Get users with enterprise info
    const users = await query<{
      id: string;
      email: string;
      name: string | null;
      role: string;
      enterprise_id: string | null;
      enterprise_name: string | null;
      workspace_id: string | null;
      is_demo: boolean;
      is_active: boolean;
      created_at: Date;
      last_login_at: Date | null;
    }>(
      `SELECT
        u.id,
        u.email,
        u.name,
        u.role,
        u.enterprise_id,
        e.name as enterprise_name,
        u.workspace_id,
        u.is_demo,
        u.is_active,
        u.created_at,
        u.last_login_at
      FROM users u
      LEFT JOIN enterprises e ON u.enterprise_id = e.enterprise_id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, limit, offset]
    );

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM users u ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0]?.count || '0');

    // Get stats
    const statsResult = await query<{
      total_users: string;
      active_users: string;
      demo_users: string;
      enterprise_admins: string;
    }>(
      `SELECT
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE is_active = true) as active_users,
        COUNT(*) FILTER (WHERE is_demo = true) as demo_users,
        COUNT(*) FILTER (WHERE role = 'ENTERPRISE_ADMIN') as enterprise_admins
      FROM users`
    );

    return NextResponse.json({
      success: true,
      data: {
        users,
        total,
        limit,
        offset,
        stats: {
          total_users: parseInt(statsResult[0]?.total_users || '0'),
          active_users: parseInt(statsResult[0]?.active_users || '0'),
          demo_users: parseInt(statsResult[0]?.demo_users || '0'),
          enterprise_admins: parseInt(statsResult[0]?.enterprise_admins || '0'),
        }
      }
    });
  } catch (error) {
    console.error('[SuperAdmin] GET /api/superadmin/users error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
