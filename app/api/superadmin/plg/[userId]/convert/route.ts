/**
 * Super Admin PLG - Force Convert Demo to Real
 *
 * Explicitly converts a demo user to a real user.
 * Emits PLG_ADMIN_CONVERT event for Activity UI.
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

    // Validate user is a demo user
    if (!user.is_demo) {
      return NextResponse.json(
        { success: false, error: 'User is not a demo user' },
        { status: 400 }
      );
    }

    const convertedAt = new Date().toISOString();

    await client.query('BEGIN');

    // Update user - set is_demo = false
    await client.query(
      `UPDATE users
       SET is_demo = false, updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    // Update profile metadata
    await client.query(
      `UPDATE user_profiles
       SET
         metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
           'demo_converted', true,
           'demo_converted_at', $2,
           'conversion_reason', $3,
           'converted_by', 'superadmin'
         ),
         updated_at = NOW()
       WHERE user_id = $1`,
      [userId, convertedAt, body.conversion_reason || 'admin_force_convert']
    );

    await client.query('COMMIT');

    // Emit PLG_ADMIN_CONVERT event
    await emitBusinessEvent(
      {
        user_id: session.session?.email || 'superadmin', // Super admin performing action
        role: 'SUPER_ADMIN',
        enterprise_id: null,
        workspace_id: null,
        sub_vertical_id: null,
        region_code: null,
        is_demo: false,
        demo_type: null,
      },
      {
        event_type: 'PLG_ADMIN_CONVERT',
        entity_type: 'USER',
        entity_id: userId,
        metadata: {
          action: 'force_convert',
          target_user_email: user.email,
          target_user_role: user.role,
          converted_at: convertedAt,
          conversion_reason: body.conversion_reason || 'admin_force_convert',
          performed_by: session.session?.email || 'superadmin',
          was_demo: true,
          days_as_demo: Math.floor(
            (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
          ),
        },
      }
    );

    console.log('[PLG Admin] Force-converted user:', {
      userId,
      email: user.email,
      performedBy: session.session?.email || 'superadmin',
    });

    return NextResponse.json({
      success: true,
      message: 'User converted to real user',
      data: {
        userId,
        convertedAt,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[PLG Admin] Convert error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to convert user' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
