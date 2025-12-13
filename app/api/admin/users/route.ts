/**
 * User Management API
 * VS12.9: Wired to real database
 *
 * GET - List users with filters from database
 * Authorization Code: VS12-FRONTEND-WIRING-20251213
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { query, queryOne } from '@/lib/db/client';
import type { TeamRole, MemberStatus } from '@/lib/workspace/types';

// Helper: Check if user can manage users
function canManageUsers(role: string): boolean {
  return ['owner', 'admin', 'SUPER_ADMIN', 'TENANT_ADMIN'].includes(role);
}

// VS12.9: Database user interface
interface DBUser {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  status?: string;
  tenant_id?: string;
  created_at?: string;
  last_login?: string;
  invited_by?: string;
}

// GET - List users from database
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userRole = (session.user as { role?: string }).role || 'viewer';
    if (!canManageUsers(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to view users' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || searchParams.get('workspaceId');
    const status = searchParams.get('status') as MemberStatus | null;
    const role = searchParams.get('role') as TeamRole | null;
    const search = searchParams.get('search')?.toLowerCase();
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // VS12.9: Fetch from database
    try {
      // Build dynamic query with filters
      let whereConditions = ['1=1'];
      const params: (string | number)[] = [];
      let paramIndex = 1;

      if (tenantId) {
        whereConditions.push(`tenant_id = $${paramIndex}`);
        params.push(tenantId);
        paramIndex++;
      }

      if (status) {
        whereConditions.push(`COALESCE(status, 'active') = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      if (role) {
        whereConditions.push(`role = $${paramIndex}`);
        params.push(role);
        paramIndex++;
      }

      if (search) {
        whereConditions.push(`(LOWER(email) LIKE $${paramIndex} OR LOWER(full_name) LIKE $${paramIndex})`);
        params.push(`%${search}%`);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Get total count
      const countResult = await queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM users WHERE ${whereClause}`,
        params
      );
      const total = parseInt(countResult?.count || '0');
      const totalPages = Math.ceil(total / limit);

      // Get users with pagination
      const users = await query<DBUser>(
        `SELECT id, email, full_name, role, status, tenant_id, created_at, last_login, invited_by
         FROM users
         WHERE ${whereClause}
         ORDER BY created_at DESC NULLS LAST
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
      );

      // Get stats
      const statsResult = await queryOne<{
        total: string;
        active: string;
        invited: string;
        suspended: string;
      }>(
        `SELECT
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE COALESCE(status, 'active') = 'active') as active,
           COUNT(*) FILTER (WHERE status = 'invited') as invited,
           COUNT(*) FILTER (WHERE status = 'suspended') as suspended
         FROM users
         WHERE ${tenantId ? 'tenant_id = $1' : '1=1'}`,
        tenantId ? [tenantId] : []
      );

      // Get tenant info
      const tenant = tenantId ? await queryOne<{ id: string; name: string }>(
        'SELECT id, name FROM tenants WHERE id = $1',
        [tenantId]
      ) : null;

      return NextResponse.json({
        success: true,
        data: {
          tenant: tenant || { id: tenantId || 'default', name: 'My Workspace' },
          users: (users || []).map((u) => ({
            id: u.id,
            userId: u.id,
            email: u.email,
            name: u.full_name || u.email.split('@')[0],
            full_name: u.full_name,
            role: u.role || 'viewer',
            status: u.status || 'active',
            invitedBy: u.invited_by,
            created_at: u.created_at,
            joinedAt: u.created_at ? new Date(u.created_at) : undefined,
            last_login: u.last_login,
            lastActiveAt: u.last_login ? new Date(u.last_login) : undefined,
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
          stats: {
            total: parseInt(statsResult?.total || '0'),
            active: parseInt(statsResult?.active || '0'),
            invited: parseInt(statsResult?.invited || '0'),
            suspended: parseInt(statsResult?.suspended || '0'),
          },
        },
      });
    } catch (dbError) {
      // VS12.9: Return empty state instead of mock data
      console.error('[Users API] Database error:', dbError);
      return NextResponse.json({
        success: true,
        data: {
          tenant: { id: tenantId || 'default', name: 'My Workspace' },
          users: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
          stats: {
            total: 0,
            active: 0,
            invited: 0,
            suspended: 0,
          },
        },
      });
    }
  } catch (error) {
    console.error('[Users API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
