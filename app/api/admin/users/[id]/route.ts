/**
 * User Detail API
 * VS12.9: Wired to real database
 *
 * GET - Get user details from database
 * PATCH - Update user role
 * DELETE - Remove user from workspace
 *
 * Authorization Code: VS12-FRONTEND-WIRING-20251213
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { queryOne, query as dbQuery } from '@/lib/db/client';
import type { TeamRole } from '@/lib/workspace/types';

// Helper: Check if user can manage users
function canManageUsers(role: string): boolean {
  return ['owner', 'admin', 'SUPER_ADMIN', 'TENANT_ADMIN'].includes(role);
}

// Helper: Check if role change is allowed
function canChangeRole(currentUserRole: string, targetRole: TeamRole, newRole: TeamRole): boolean {
  // Only owner can create/change to owner
  if (newRole === 'owner' && currentUserRole !== 'owner') {
    return false;
  }
  // Admin can't change owner role
  if (targetRole === 'owner' && currentUserRole !== 'owner') {
    return false;
  }
  return true;
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
}

// GET - Get user details from database
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // VS12.9: Fetch from database
    try {
      const user = await queryOne<DBUser>(
        'SELECT id, email, full_name, role, status, tenant_id, created_at, last_login FROM users WHERE id = $1',
        [id]
      );

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          id: user.id,
          userId: user.id,
          email: user.email,
          name: user.full_name || user.email.split('@')[0],
          role: user.role || 'viewer',
          status: user.status || 'active',
          workspaceId: user.tenant_id || 'ws-default',
          joinedAt: user.created_at ? new Date(user.created_at) : undefined,
          lastActiveAt: user.last_login ? new Date(user.last_login) : undefined,
        },
      });
    } catch (dbError) {
      console.error('[User API] Database error:', dbError);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('[User API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update user role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userRole = (session.user as { role?: string }).role || 'viewer';
    if (!canManageUsers(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { role: newRole } = body as { role: TeamRole };

    if (!newRole) {
      return NextResponse.json(
        { success: false, error: 'Missing role field' },
        { status: 400 }
      );
    }

    const validRoles: TeamRole[] = ['owner', 'admin', 'analyst', 'viewer'];
    if (!validRoles.includes(newRole)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Prevent self role change
    if (session.user.id === id || session.user.email === id) {
      return NextResponse.json(
        { success: false, error: 'Cannot change your own role' },
        { status: 400 }
      );
    }

    // VS12.9: Fetch current role from database
    try {
      const targetUser = await queryOne<{ role: string }>(
        'SELECT role FROM users WHERE id = $1',
        [id]
      );

      if (!targetUser) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      const targetRole = (targetUser.role || 'viewer') as TeamRole;
      if (!canChangeRole(userRole, targetRole, newRole)) {
        return NextResponse.json(
          { success: false, error: 'Not authorized to assign this role' },
          { status: 403 }
        );
      }

      // VS12.9: Update user role in database
      await dbQuery(
        'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2',
        [newRole, id]
      );

      console.log(`[User] Role changed: ${id} -> ${newRole}`);

      return NextResponse.json({
        success: true,
        data: {
          id,
          role: newRole,
          message: 'Role updated successfully',
        },
      });
    } catch (dbError) {
      console.error('[User API] Database error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to update role' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[User API] PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove user from workspace
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userRole = (session.user as { role?: string }).role || 'viewer';
    if (!canManageUsers(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Prevent self removal
    if (session.user.id === id || session.user.email === id) {
      return NextResponse.json(
        { success: false, error: 'Cannot remove yourself' },
        { status: 400 }
      );
    }

    // VS12.9: Check if trying to remove owner
    try {
      const targetUser = await queryOne<{ role: string }>(
        'SELECT role FROM users WHERE id = $1',
        [id]
      );

      if (!targetUser) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      const targetRole = (targetUser.role || 'viewer') as TeamRole;
      if (targetRole === 'owner') {
        return NextResponse.json(
          { success: false, error: 'Cannot remove workspace owner' },
          { status: 403 }
        );
      }

      // VS12.9: Soft delete user (set status to removed)
      await dbQuery(
        'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2',
        ['removed', id]
      );

      console.log(`[User] Removed from workspace: ${id}`);

      return NextResponse.json({
        success: true,
        data: {
          id,
          message: 'User removed from workspace',
        },
      });
    } catch (dbError) {
      console.error('[User API] Database error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to remove user' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[User API] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
