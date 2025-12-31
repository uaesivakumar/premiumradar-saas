/**
 * S342: Super Admin - Users API (Admin Plane v1.1)
 * List and create users across all enterprises
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifySession } from '@/lib/superadmin/security';
import { query, insert } from '@/lib/db/client';
import { emitBusinessEvent } from '@/lib/events/event-emitter';
import { createSuperAdminContextWithTarget, type ValidRole } from '@/lib/auth/session/session-context';
import bcrypt from 'bcryptjs';
import { getOrCreateTenantFromEnterprise, warnTenantIdUsage } from '@/lib/db/tenant-bridge';

const VALID_ROLES: ValidRole[] = ['SUPER_ADMIN', 'ENTERPRISE_ADMIN', 'ENTERPRISE_USER', 'INDIVIDUAL_USER'];

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

/**
 * POST /api/superadmin/users
 * Create a new user
 */
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();

    // Validate required fields
    if (!body.email) {
      return NextResponse.json(
        { success: false, error: 'email is required' },
        { status: 400 }
      );
    }
    if (!body.password) {
      return NextResponse.json(
        { success: false, error: 'password is required' },
        { status: 400 }
      );
    }

    // Validate role
    const role = body.role || 'ENTERPRISE_USER';
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { success: false, error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(body.password, 12);

    // Get tenant_id from enterprise_id (legacy compatibility)
    // The DB still has NOT NULL constraint on tenant_id
    let tenantId: string | null = null;
    if (body.enterprise_id) {
      warnTenantIdUsage('superadmin/users POST - legacy constraint');
      tenantId = await getOrCreateTenantFromEnterprise(body.enterprise_id);
    }

    // Create user (enterprise-first, tenant_id for legacy compatibility only)
    const user = await insert<{
      id: string;
      email: string;
      name: string | null;
      role: string;
      enterprise_id: string | null;
      workspace_id: string | null;
      is_demo: boolean;
      demo_type: string | null;
      created_at: Date;
    }>(
      `INSERT INTO users (
        email, password_hash, name, role,
        enterprise_id, workspace_id, is_demo, demo_type, tenant_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, email, name, role, enterprise_id, workspace_id, is_demo, demo_type, created_at`,
      [
        body.email,
        passwordHash,
        body.name || null,
        role,
        body.enterprise_id || null,
        body.workspace_id || null,
        body.is_demo || false,
        body.demo_type || null,
        tenantId,
      ]
    );

    // Emit business event with target context (S347)
    const ctx = createSuperAdminContextWithTarget({
      enterprise_id: user.enterprise_id,
      workspace_id: user.workspace_id,
    });
    await emitBusinessEvent(ctx, {
      event_type: 'USER_CREATED',
      entity_type: 'USER',
      entity_id: user.id,
      metadata: {
        email: user.email,
        role: user.role,
        enterprise_id: user.enterprise_id,
        actor_email: sessionResult.session?.email,
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('[SuperAdmin] POST /api/superadmin/users error:', error);

    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
