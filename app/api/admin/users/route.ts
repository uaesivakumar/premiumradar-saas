/**
 * User Management API - S149: Tenant Admin MVP
 *
 * GET - List users with filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import type { TeamMember, TeamRole, MemberStatus } from '@/lib/workspace/types';

// Mock users for MVP (replace with DB in production)
const mockUsers: TeamMember[] = [
  {
    id: 'user-1',
    userId: 'u-001',
    workspaceId: 'ws-default',
    role: 'owner',
    email: 'owner@company.com',
    name: 'Sarah Chen',
    status: 'active',
    joinedAt: new Date('2024-01-15'),
    lastActiveAt: new Date(),
  },
  {
    id: 'user-2',
    userId: 'u-002',
    workspaceId: 'ws-default',
    role: 'admin',
    email: 'admin@company.com',
    name: 'Mohammed Hassan',
    status: 'active',
    invitedBy: 'u-001',
    joinedAt: new Date('2024-02-20'),
    lastActiveAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'user-3',
    userId: 'u-003',
    workspaceId: 'ws-default',
    role: 'analyst',
    email: 'analyst@company.com',
    name: 'Lisa Thompson',
    status: 'active',
    invitedBy: 'u-001',
    joinedAt: new Date('2024-03-10'),
    lastActiveAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: 'user-4',
    userId: 'u-004',
    workspaceId: 'ws-default',
    role: 'viewer',
    email: 'viewer@company.com',
    name: 'Ahmed Al Maktoum',
    status: 'invited',
    invitedBy: 'u-002',
  },
  {
    id: 'user-5',
    userId: 'u-005',
    workspaceId: 'ws-default',
    role: 'analyst',
    email: 'suspended@company.com',
    name: 'John Smith',
    status: 'suspended',
    invitedBy: 'u-001',
    joinedAt: new Date('2024-01-20'),
  },
];

// Helper: Check if user can manage users
function canManageUsers(role: string): boolean {
  return ['owner', 'admin', 'SUPER_ADMIN', 'TENANT_ADMIN'].includes(role);
}

// GET - List users
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
    const workspaceId = searchParams.get('workspaceId') || 'ws-default';
    const status = searchParams.get('status') as MemberStatus | null;
    const role = searchParams.get('role') as TeamRole | null;
    const search = searchParams.get('search')?.toLowerCase();
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Filter users
    let filtered = mockUsers.filter((u) => u.workspaceId === workspaceId);

    if (status) {
      filtered = filtered.filter((u) => u.status === status);
    }

    if (role) {
      filtered = filtered.filter((u) => u.role === role);
    }

    if (search) {
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search)
      );
    }

    // Sort by joinedAt or name
    filtered.sort((a, b) => {
      if (a.joinedAt && b.joinedAt) {
        return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
      }
      return a.name.localeCompare(b.name);
    });

    // Paginate
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    // Aggregate stats
    const stats = {
      total: mockUsers.filter((u) => u.workspaceId === workspaceId).length,
      active: mockUsers.filter((u) => u.workspaceId === workspaceId && u.status === 'active').length,
      invited: mockUsers.filter((u) => u.workspaceId === workspaceId && u.status === 'invited').length,
      suspended: mockUsers.filter((u) => u.workspaceId === workspaceId && u.status === 'suspended').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        users: paginated.map((u) => ({
          id: u.id,
          userId: u.userId,
          email: u.email,
          name: u.name,
          role: u.role,
          status: u.status,
          avatarUrl: u.avatarUrl,
          invitedBy: u.invitedBy,
          joinedAt: u.joinedAt,
          lastActiveAt: u.lastActiveAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
        stats,
      },
    });
  } catch (error) {
    console.error('[Users API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
