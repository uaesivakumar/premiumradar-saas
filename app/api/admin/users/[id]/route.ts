/**
 * User Detail API - S149: Tenant Admin MVP
 *
 * GET - Get user details
 * PATCH - Update user role
 * DELETE - Remove user from workspace
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
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

// GET - Get user details
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

    // Mock user lookup (replace with DB)
    const mockUser = {
      id,
      userId: `u-${id}`,
      email: 'user@company.com',
      name: 'Mock User',
      role: 'analyst' as TeamRole,
      status: 'active',
      workspaceId: 'ws-default',
      joinedAt: new Date('2024-01-15'),
      lastActiveAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: mockUser,
    });
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

    // Mock: Check role change permission
    const targetRole = 'analyst' as TeamRole; // Would come from DB
    if (!canChangeRole(userRole, targetRole, newRole)) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to assign this role' },
        { status: 403 }
      );
    }

    // TODO: Update user role in database
    console.log(`[User] Role changed: ${id} -> ${newRole}`);

    return NextResponse.json({
      success: true,
      data: {
        id,
        role: newRole,
        message: 'Role updated successfully',
      },
    });
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

    // Mock: Check if trying to remove owner
    const targetRole = 'analyst' as TeamRole; // Would come from DB
    if (targetRole === 'owner') {
      return NextResponse.json(
        { success: false, error: 'Cannot remove workspace owner' },
        { status: 403 }
      );
    }

    // TODO: Remove user from workspace in database
    console.log(`[User] Removed from workspace: ${id}`);

    return NextResponse.json({
      success: true,
      data: {
        id,
        message: 'User removed from workspace',
      },
    });
  } catch (error) {
    console.error('[User API] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
