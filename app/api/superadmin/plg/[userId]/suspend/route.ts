/**
 * Super Admin PLG - Suspend User
 *
 * Suspends an individual user - immediate access revocation.
 * Emits PLG_ADMIN_SUSPEND event for Activity UI.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, getPool } from '@/lib/db/client';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';
import { emitBusinessEvent } from '@/lib/events/event-emitter';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    // Validate Super Admin session
    const session = await validateSuperAdminSession();
    if (!session.valid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId } = params;
    const body = await request.json().catch(() => ({}));

    // Get user
    const userResult = await client.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return NextResponse.json(
        { success: false, error: 'User is already suspended' },
        { status: 400 }
      );
    }

    const suspendedAt = new Date().toISOString();

    await client.query('BEGIN');

    // Suspend user
    await client.query(
      `UPDATE users
       SET is_active = false, updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    // Update profile metadata
    await client.query(
      `UPDATE user_profiles
       SET
         metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
           'suspended', true,
           'suspended_at', $2,
           'suspended_by', 'superadmin',
           'suspension_reason', $3
         ),
         updated_at = NOW()
       WHERE user_id = $1`,
      [userId, suspendedAt, body.reason || 'admin_action']
    );

    await client.query('COMMIT');

    // Emit PLG_ADMIN_SUSPEND event
    await emitBusinessEvent(
      {
        user_id: session.session?.email || 'superadmin',
        role: 'SUPER_ADMIN',
        enterprise_id: null,
        workspace_id: null,
        sub_vertical_id: null,
        region_code: null,
        is_demo: false,
        demo_type: null,
      },
      {
        event_type: 'PLG_ADMIN_SUSPEND',
        entity_type: 'USER',
        entity_id: userId,
        metadata: {
          action: 'suspend',
          target_user_email: user.email,
          target_user_role: user.role,
          suspended_at: suspendedAt,
          suspension_reason: body.reason || 'admin_action',
          performed_by: session.session?.email || 'superadmin',
          was_demo: user.is_demo,
        },
      }
    );

    console.log('[PLG Admin] Suspended user:', {
      userId,
      email: user.email,
      performedBy: session.session?.email || 'superadmin',
    });

    return NextResponse.json({
      success: true,
      message: 'User suspended',
      data: {
        userId,
        suspendedAt,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[PLG Admin] Suspend error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to suspend user' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
