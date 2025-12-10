/**
 * User Actions API - S149: Tenant Admin MVP
 *
 * POST - Perform action on user (disable, enable, ban, unban, resend-invite)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';

type UserAction = 'disable' | 'enable' | 'ban' | 'unban' | 'resend-invite';

// Helper: Check if user can manage users
function canManageUsers(role: string): boolean {
  return ['owner', 'admin', 'SUPER_ADMIN', 'TENANT_ADMIN'].includes(role);
}

// Helper: Check if action requires owner role
function requiresOwner(action: UserAction): boolean {
  return ['ban', 'unban'].includes(action);
}

// POST - Perform user action
export async function POST(
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
    const { action, reason } = body as { action: UserAction; reason?: string };

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Missing action field' },
        { status: 400 }
      );
    }

    const validActions: UserAction[] = ['disable', 'enable', 'ban', 'unban', 'resend-invite'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Check if action requires owner role
    if (requiresOwner(action) && userRole !== 'owner' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: `Only workspace owner can ${action} users` },
        { status: 403 }
      );
    }

    // Prevent self-action
    if (session.user.id === id || session.user.email === id) {
      return NextResponse.json(
        { success: false, error: `Cannot ${action} yourself` },
        { status: 400 }
      );
    }

    // Determine new status based on action
    let newStatus: string;
    let message: string;

    switch (action) {
      case 'disable':
        newStatus = 'suspended';
        message = 'User disabled successfully';
        break;
      case 'enable':
        newStatus = 'active';
        message = 'User enabled successfully';
        break;
      case 'ban':
        newStatus = 'banned';
        message = 'User banned successfully';
        break;
      case 'unban':
        newStatus = 'suspended';
        message = 'User unbanned (now suspended)';
        break;
      case 'resend-invite':
        // TODO: Resend invitation email
        message = 'Invitation resent';
        console.log(`[User Action] Resending invite to user ${id}`);
        return NextResponse.json({
          success: true,
          data: {
            id,
            action,
            message,
          },
        });
      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }

    // TODO: Update user status in database
    // TODO: If banning, revoke all active sessions
    // TODO: Send notification email for status change

    console.log(`[User Action] ${action} on user ${id}${reason ? ` - Reason: ${reason}` : ''}`);

    // Create audit log entry
    const auditEntry = {
      timestamp: new Date().toISOString(),
      action,
      targetUserId: id,
      performedBy: session.user.email,
      reason: reason || null,
      newStatus,
    };
    console.log('[User Action] Audit:', JSON.stringify(auditEntry));

    return NextResponse.json({
      success: true,
      data: {
        id,
        action,
        newStatus,
        message,
        auditId: `audit-${Date.now()}`,
      },
    });
  } catch (error) {
    console.error('[User Actions API] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
