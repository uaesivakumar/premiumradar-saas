/**
 * Super Admin PLG - Force Expire Demo
 *
 * Forces a demo to expire - user loses access until converted.
 * Emits PLG_ADMIN_EXPIRE event for Activity UI.
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

    // Validate user is a demo user
    if (!user.is_demo) {
      return NextResponse.json(
        { success: false, error: 'User is not a demo user' },
        { status: 400 }
      );
    }

    const expiredAt = new Date().toISOString();

    await client.query('BEGIN');

    // Set user as inactive (expired demo)
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
           'demo_expired', true,
           'demo_expired_at', $2,
           'expired_by', 'superadmin'
         ),
         updated_at = NOW()
       WHERE user_id = $1`,
      [userId, expiredAt]
    );

    await client.query('COMMIT');

    // Emit PLG_ADMIN_EXPIRE event
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
        event_type: 'PLG_ADMIN_EXPIRE',
        entity_type: 'USER',
        entity_id: userId,
        metadata: {
          action: 'force_expire',
          target_user_email: user.email,
          target_user_role: user.role,
          expired_at: expiredAt,
          performed_by: session.session?.email || 'superadmin',
          days_as_demo: Math.floor(
            (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
          ),
        },
      }
    );

    console.log('[PLG Admin] Force-expired demo:', {
      userId,
      email: user.email,
      performedBy: session.session?.email || 'superadmin',
    });

    return NextResponse.json({
      success: true,
      message: 'Demo expired - user access revoked',
      data: {
        userId,
        expiredAt,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[PLG Admin] Expire error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to expire demo' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
