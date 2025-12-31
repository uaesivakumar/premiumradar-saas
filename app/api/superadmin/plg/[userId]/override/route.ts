/**
 * Super Admin PLG - Override Context
 *
 * Allows Super Admin to correct:
 * - Vertical / Sub-Vertical / Region
 * - Workspace binding
 * - Enterprise assignment
 *
 * Emits PLG_ADMIN_OVERRIDE event for Activity UI.
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
    const body = await request.json();

    // Get current user state
    const userResult = await client.query(
      `SELECT
        u.*,
        up.vertical as current_vertical,
        up.sub_vertical as current_sub_vertical,
        up.region_country as current_region
      FROM users u
      LEFT JOIN user_profiles up ON up.user_id = u.id
      WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];
    const overrideAt = new Date().toISOString();

    // Track what changed
    const changes: Record<string, { from: any; to: any }> = {};

    await client.query('BEGIN');

    // Update profile context if provided
    if (body.vertical !== undefined || body.sub_vertical !== undefined || body.region_country !== undefined) {
      const updates: string[] = [];
      const values: any[] = [userId];
      let paramIndex = 2;

      if (body.vertical !== undefined && body.vertical !== user.current_vertical) {
        updates.push(`vertical = $${paramIndex}`);
        values.push(body.vertical);
        changes.vertical = { from: user.current_vertical, to: body.vertical };
        paramIndex++;
      }

      if (body.sub_vertical !== undefined && body.sub_vertical !== user.current_sub_vertical) {
        updates.push(`sub_vertical = $${paramIndex}`);
        values.push(body.sub_vertical);
        changes.sub_vertical = { from: user.current_sub_vertical, to: body.sub_vertical };
        paramIndex++;
      }

      if (body.region_country !== undefined && body.region_country !== user.current_region) {
        updates.push(`region_country = $${paramIndex}`);
        values.push(body.region_country);
        changes.region_country = { from: user.current_region, to: body.region_country };
        paramIndex++;
      }

      if (updates.length > 0) {
        updates.push('updated_at = NOW()');
        await client.query(
          `UPDATE user_profiles
           SET ${updates.join(', ')}
           WHERE user_id = $1`,
          values
        );
      }
    }

    // Update user bindings if provided
    if (body.workspace_id !== undefined || body.enterprise_id !== undefined) {
      const userUpdates: string[] = [];
      const userValues: any[] = [userId];
      let paramIndex = 2;

      if (body.workspace_id !== undefined && body.workspace_id !== user.workspace_id) {
        userUpdates.push(`workspace_id = $${paramIndex}`);
        userValues.push(body.workspace_id || null);
        changes.workspace_id = { from: user.workspace_id, to: body.workspace_id };
        paramIndex++;
      }

      if (body.enterprise_id !== undefined && body.enterprise_id !== user.enterprise_id) {
        userUpdates.push(`enterprise_id = $${paramIndex}`);
        userValues.push(body.enterprise_id || null);
        changes.enterprise_id = { from: user.enterprise_id, to: body.enterprise_id };
        paramIndex++;

        // If assigning to enterprise, update role
        if (body.enterprise_id && user.role === 'INDIVIDUAL_USER') {
          userUpdates.push(`role = 'ENTERPRISE_USER'`);
          changes.role = { from: 'INDIVIDUAL_USER', to: 'ENTERPRISE_USER' };
        }
      }

      if (userUpdates.length > 0) {
        userUpdates.push('updated_at = NOW()');
        await client.query(
          `UPDATE users
           SET ${userUpdates.join(', ')}
           WHERE id = $1`,
          userValues
        );
      }
    }

    // Update profile metadata to record override
    await client.query(
      `UPDATE user_profiles
       SET
         metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
           'last_override_at', $2,
           'last_override_by', 'superadmin',
           'last_override_changes', $3::jsonb
         ),
         updated_at = NOW()
       WHERE user_id = $1`,
      [userId, overrideAt, JSON.stringify(changes)]
    );

    await client.query('COMMIT');

    // Emit PLG_ADMIN_OVERRIDE event
    if (Object.keys(changes).length > 0) {
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
          event_type: 'PLG_ADMIN_OVERRIDE',
          entity_type: 'USER',
          entity_id: userId,
          metadata: {
            action: 'override_context',
            target_user_email: user.email,
            target_user_role: user.role,
            override_at: overrideAt,
            performed_by: session.session?.email || 'superadmin',
            changes,
          },
        }
      );
    }

    console.log('[PLG Admin] Override context:', {
      userId,
      email: user.email,
      changes,
      performedBy: session.session?.email || 'superadmin',
    });

    return NextResponse.json({
      success: true,
      message: Object.keys(changes).length > 0
        ? 'Context overridden successfully'
        : 'No changes made',
      data: {
        userId,
        changes,
        overrideAt,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[PLG Admin] Override error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to override context' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
