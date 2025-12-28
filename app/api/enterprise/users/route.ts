/**
 * S293: User Management APIs
 * Part of User & Enterprise Management Program v1.1
 * Phase C - Backend & API
 *
 * GET  /api/enterprise/users - List enterprise users
 * POST /api/enterprise/users - Create new user (ENTERPRISE_ADMIN only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { getEnterpriseUsers, hasUserCapacity, getEnterpriseById } from '@/lib/db/enterprises';
import { hasRequiredRole, toEnterpriseRole } from '@/lib/auth/rbac/types';
import { createUser } from '@/lib/db/users';
import { getOrCreateDefaultWorkspace } from '@/lib/db/workspaces';
import { query } from '@/lib/db/client';

// ============================================================
// GET /api/enterprise/users - List enterprise users
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const enterpriseId = session.enterpriseId;

    if (!enterpriseId) {
      return NextResponse.json(
        { success: false, error: 'No enterprise associated with user' },
        { status: 404 }
      );
    }

    // Get users in the enterprise
    const users = await getEnterpriseUsers(enterpriseId);

    // Check capacity
    const enterprise = await getEnterpriseById(enterpriseId);
    const hasCapacity = await hasUserCapacity(enterpriseId);

    return NextResponse.json({
      success: true,
      data: {
        users: users.map((user) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          workspace_id: user.workspace_id,
          is_demo: user.is_demo,
          created_at: user.created_at,
          last_login_at: user.last_login_at,
        })),
        total: users.length,
        limit: enterprise?.max_users || 5,
        has_capacity: hasCapacity,
      },
    });
  } catch (error) {
    console.error('[API] GET /api/enterprise/users error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list users' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/enterprise/users - Create new user (ENTERPRISE_ADMIN only)
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has ENTERPRISE_ADMIN or higher role
    const userRole = session.user.role as 'SUPER_ADMIN' | 'ENTERPRISE_ADMIN' | 'ENTERPRISE_USER' | 'INDIVIDUAL_USER' | 'TENANT_ADMIN' | 'TENANT_USER' | 'READ_ONLY';
    if (!hasRequiredRole(userRole, 'ENTERPRISE_ADMIN') && !hasRequiredRole(userRole, 'TENANT_ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'ENTERPRISE_ADMIN role required' },
        { status: 403 }
      );
    }

    const enterpriseId = session.enterpriseId;

    if (!enterpriseId) {
      return NextResponse.json(
        { success: false, error: 'No enterprise associated with user' },
        { status: 404 }
      );
    }

    // Check capacity
    const hasCapacity = await hasUserCapacity(enterpriseId);
    if (!hasCapacity) {
      return NextResponse.json(
        { success: false, error: 'Enterprise user limit reached. Upgrade your plan to add more users.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!body.password || body.password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Determine role - only allow ENTERPRISE_USER for now
    // SUPER_ADMIN cannot create more admins
    let role = 'ENTERPRISE_USER';
    if (body.role === 'ENTERPRISE_ADMIN' && hasRequiredRole(userRole, 'SUPER_ADMIN')) {
      role = 'ENTERPRISE_ADMIN';
    }

    // Get default sub-vertical ID for the workspace
    const subVerticalResult = await query<{ id: string }>(
      `SELECT id FROM os_sub_verticals WHERE key = 'employee_banking' LIMIT 1`
    );
    const subVerticalId = subVerticalResult[0]?.id;

    if (!subVerticalId) {
      return NextResponse.json(
        { success: false, error: 'Default sub-vertical not found' },
        { status: 500 }
      );
    }

    // Get or create default workspace
    const workspace = await getOrCreateDefaultWorkspace(enterpriseId, subVerticalId);

    // Create the user
    const newUser = await createUser({
      email: body.email,
      password: body.password,
      name: body.name,
      enterpriseId: enterpriseId,
      workspaceId: workspace.workspace_id,
      role: role as 'ENTERPRISE_USER' | 'ENTERPRISE_ADMIN' | 'SUPER_ADMIN' | 'INDIVIDUAL_USER',
      vertical: body.vertical || 'banking',
      subVertical: body.sub_vertical || 'employee-banking',
      regionCountry: body.region_country || 'UAE',
    });

    // Link user to enterprise and workspace
    await query(
      `UPDATE users SET enterprise_id = $1, workspace_id = $2 WHERE id = $3`,
      [enterpriseId, workspace.workspace_id, newUser.id]
    );

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: role as 'ENTERPRISE_USER' | 'ENTERPRISE_ADMIN' | 'SUPER_ADMIN' | 'INDIVIDUAL_USER',
          workspace_id: workspace.workspace_id,
          created_at: newUser.created_at,
        },
      },
    });
  } catch (error) {
    console.error('[API] POST /api/enterprise/users error:', error);

    // Handle unique constraint violation (duplicate email)
    if ((error as Error).message?.includes('duplicate key')) {
      return NextResponse.json(
        { success: false, error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
