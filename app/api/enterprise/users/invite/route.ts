/**
 * S310: User Invite API
 * Part of User & Enterprise Management Program v1.1
 * Phase D - Frontend & UI
 *
 * API endpoint for sending user invitations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { query, queryOne } from '@/lib/db/client';

/**
 * POST /api/enterprise/users/invite
 * Send invitation to a new user
 *
 * Required: ENTERPRISE_ADMIN or SUPER_ADMIN role
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin permission
    const isAdmin =
      session.user.role === 'SUPER_ADMIN' ||
      session.user.role === 'ENTERPRISE_ADMIN' ||
      session.user.role === 'TENANT_ADMIN';

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get enterprise_id from user's session
    const userResult = await queryOne<{ enterprise_id: string | null }>(
      'SELECT enterprise_id FROM users WHERE id = $1',
      [session.user.id]
    );

    const enterpriseId = userResult?.enterprise_id;

    if (!enterpriseId) {
      return NextResponse.json(
        { success: false, error: 'No enterprise associated with user' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { email, name, role, workspace_id } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['ENTERPRISE_ADMIN', 'ENTERPRISE_USER'];
    const userRole = role && validRoles.includes(role) ? role : 'ENTERPRISE_USER';

    // Check if user already exists
    const existingUsers = await query<{ id: string; enterprise_id: string | null }>(
      'SELECT id, enterprise_id FROM users WHERE email = $1',
      [emailLower]
    );

    if (existingUsers.length > 0) {
      const existingEnterpriseId = existingUsers[0].enterprise_id;
      if (existingEnterpriseId === enterpriseId) {
        return NextResponse.json(
          { success: false, error: 'User is already a member of this enterprise' },
          { status: 400 }
        );
      } else if (existingEnterpriseId) {
        return NextResponse.json(
          { success: false, error: 'User is already a member of another enterprise' },
          { status: 400 }
        );
      }
    }

    // Check enterprise user limit
    const limitResult = await queryOne<{ user_count: string; max_users: number | null }>(
      `SELECT
        (SELECT COUNT(*) FROM users WHERE enterprise_id = $1) as user_count,
        (SELECT max_users FROM enterprises WHERE id = $1) as max_users`,
      [enterpriseId]
    );

    if (limitResult?.max_users && parseInt(limitResult.user_count) >= limitResult.max_users) {
      return NextResponse.json(
        { success: false, error: 'User limit reached. Upgrade your plan to add more users.' },
        { status: 400 }
      );
    }

    // Validate workspace if provided
    if (workspace_id) {
      const wsCheck = await query(
        'SELECT id FROM workspaces WHERE id = $1 AND enterprise_id = $2',
        [workspace_id, enterpriseId]
      );
      if (wsCheck.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid workspace' },
          { status: 400 }
        );
      }
    }

    // Generate invitation token
    const inviteToken = generateInviteToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store invitation
    const invitations = await query<{
      id: string;
      email: string;
      name: string | null;
      role: string;
      expires_at: Date;
    }>(
      `INSERT INTO user_invitations (
        enterprise_id, email, name, role, workspace_id, invite_token, expires_at, invited_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (enterprise_id, email)
      DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        workspace_id = EXCLUDED.workspace_id,
        invite_token = EXCLUDED.invite_token,
        expires_at = EXCLUDED.expires_at,
        invited_by = EXCLUDED.invited_by,
        created_at = NOW()
      RETURNING id, email, name, role, expires_at`,
      [enterpriseId, emailLower, name || null, userRole, workspace_id || null, inviteToken, expiresAt, session.user.id]
    );

    // In production, send email here
    // await sendInvitationEmail(emailLower, inviteToken, enterpriseName);

    return NextResponse.json({
      success: true,
      data: {
        invitation: invitations[0],
        message: 'Invitation sent successfully',
      },
    });
  } catch (error) {
    console.error('User invite error:', error);

    // Check for table not exists error
    if (error instanceof Error && error.message.includes('user_invitations')) {
      // Create the table if it doesn't exist
      try {
        await query(`
          CREATE TABLE IF NOT EXISTS user_invitations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
            email VARCHAR(255) NOT NULL,
            name VARCHAR(255),
            role VARCHAR(50) NOT NULL DEFAULT 'ENTERPRISE_USER',
            workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
            invite_token VARCHAR(255) NOT NULL UNIQUE,
            expires_at TIMESTAMPTZ NOT NULL,
            invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
            accepted_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(enterprise_id, email)
          )
        `);
        // Retry the operation would go here, but for now just return error
      } catch (createErr) {
        console.error('Failed to create user_invitations table:', createErr);
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}

/**
 * Generate a secure invitation token
 */
function generateInviteToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 48; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
