/**
 * User Invitations API - S149: Tenant Admin MVP
 *
 * POST - Send invitation email
 * GET - List pending invitations
 * DELETE - Revoke invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { randomBytes } from 'crypto';
import type { Invitation, TeamRole, InvitationStatus } from '@/lib/workspace/types';

// In-memory store for MVP (replace with DB in production)
const invitations = new Map<string, Invitation>();

// Helper: Generate secure token
function generateInviteToken(): string {
  return randomBytes(32).toString('base64url');
}

// Helper: Check if user has permission to manage invitations
function canManageInvitations(role: string): boolean {
  return ['owner', 'admin', 'SUPER_ADMIN', 'TENANT_ADMIN'].includes(role);
}

// POST - Send invitation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permission
    const userRole = (session.user as { role?: string }).role || 'viewer';
    if (!canManageInvitations(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to send invitations' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, role, workspaceId } = body as {
      email: string;
      role: TeamRole;
      workspaceId: string;
    };

    // Validate input
    if (!email || !role || !workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: email, role, workspaceId' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles: TeamRole[] = ['owner', 'admin', 'analyst', 'viewer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Check for existing pending invitation
    const existingInvite = Array.from(invitations.values()).find(
      (inv) => inv.email === email && inv.workspaceId === workspaceId && inv.status === 'pending'
    );

    if (existingInvite) {
      return NextResponse.json(
        { success: false, error: 'Invitation already pending for this email' },
        { status: 409 }
      );
    }

    // Create invitation
    const invitation: Invitation = {
      id: randomBytes(16).toString('hex'),
      workspaceId,
      email: email.toLowerCase(),
      role,
      invitedBy: session.user.id || session.user.email || 'unknown',
      token: generateInviteToken(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'pending',
      createdAt: new Date(),
    };

    // Store invitation
    invitations.set(invitation.id, invitation);

    // TODO: Send email via email service
    // For MVP, log the invitation link
    const inviteLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/invite/${invitation.token}`;
    console.log(`[Invitation] Sent to ${email}: ${inviteLink}`);

    return NextResponse.json({
      success: true,
      data: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        status: invitation.status,
        // Include link in dev mode
        ...(process.env.NODE_ENV === 'development' && { inviteLink }),
      },
    });
  } catch (error) {
    console.error('[Invitations API] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - List invitations
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
    if (!canManageInvitations(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const status = searchParams.get('status') as InvitationStatus | null;

    // Filter invitations
    let filtered = Array.from(invitations.values());

    if (workspaceId) {
      filtered = filtered.filter((inv) => inv.workspaceId === workspaceId);
    }

    if (status) {
      filtered = filtered.filter((inv) => inv.status === status);
    }

    // Check for expired invitations and update status
    const now = new Date();
    filtered = filtered.map((inv) => {
      if (inv.status === 'pending' && new Date(inv.expiresAt) < now) {
        inv.status = 'expired';
        invitations.set(inv.id, inv);
      }
      return inv;
    });

    // Sort by createdAt descending
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      data: {
        invitations: filtered.map((inv) => ({
          id: inv.id,
          email: inv.email,
          role: inv.role,
          status: inv.status,
          invitedBy: inv.invitedBy,
          expiresAt: inv.expiresAt,
          createdAt: inv.createdAt,
        })),
        total: filtered.length,
      },
    });
  } catch (error) {
    console.error('[Invitations API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Revoke invitation
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userRole = (session.user as { role?: string }).role || 'viewer';
    if (!canManageInvitations(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('id');

    if (!invitationId) {
      return NextResponse.json(
        { success: false, error: 'Missing invitation ID' },
        { status: 400 }
      );
    }

    const invitation = invitations.get(invitationId);

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found' },
        { status: 404 }
      );
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Can only revoke pending invitations' },
        { status: 400 }
      );
    }

    // Revoke invitation
    invitation.status = 'revoked';
    invitations.set(invitationId, invitation);

    console.log(`[Invitation] Revoked: ${invitation.email}`);

    return NextResponse.json({
      success: true,
      data: { message: 'Invitation revoked successfully' },
    });
  } catch (error) {
    console.error('[Invitations API] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
