/**
 * Invitation Token API - S149: Tenant Admin MVP
 *
 * GET - Validate invitation token
 * POST - Accept invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import type { Invitation } from '@/lib/workspace/types';

// Shared in-memory store (same as parent route - in production, use DB)
// This is a simplified approach for MVP
const invitations = new Map<string, Invitation>();

// GET - Validate token and return invitation details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Missing token' },
        { status: 400 }
      );
    }

    // Find invitation by token
    const invitation = Array.from(invitations.values()).find(
      (inv) => inv.token === token
    );

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired invitation' },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date(invitation.expiresAt) < new Date()) {
      invitation.status = 'expired';
      invitations.set(invitation.id, invitation);
      return NextResponse.json(
        { success: false, error: 'Invitation has expired' },
        { status: 410 }
      );
    }

    // Check if already used
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `Invitation is ${invitation.status}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        email: invitation.email,
        role: invitation.role,
        workspaceId: invitation.workspaceId,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error('[Invitation Token] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Accept invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const session = await getServerSession();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Missing token' },
        { status: 400 }
      );
    }

    // Find invitation by token
    const invitation = Array.from(invitations.values()).find(
      (inv) => inv.token === token
    );

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invalid invitation token' },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date(invitation.expiresAt) < new Date()) {
      invitation.status = 'expired';
      invitations.set(invitation.id, invitation);
      return NextResponse.json(
        { success: false, error: 'Invitation has expired' },
        { status: 410 }
      );
    }

    // Check if already accepted
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `Invitation is already ${invitation.status}` },
        { status: 400 }
      );
    }

    // If user is logged in, verify email matches
    if (session?.user?.email) {
      if (session.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
        return NextResponse.json(
          {
            success: false,
            error: 'Email mismatch. Please log in with the invited email address.',
            expectedEmail: invitation.email,
          },
          { status: 403 }
        );
      }
    }

    // Accept invitation
    invitation.status = 'accepted';
    invitations.set(invitation.id, invitation);

    // TODO: In production:
    // 1. Add user to workspace members table
    // 2. Create user account if doesn't exist
    // 3. Send welcome email

    console.log(`[Invitation] Accepted: ${invitation.email} joined workspace ${invitation.workspaceId} as ${invitation.role}`);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Invitation accepted successfully',
        workspaceId: invitation.workspaceId,
        role: invitation.role,
        // Redirect URL for frontend
        redirectUrl: `/dashboard?workspace=${invitation.workspaceId}`,
      },
    });
  } catch (error) {
    console.error('[Invitation Token] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
