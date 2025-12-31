/**
 * S342: Super Admin - User CRUD (Admin Plane v1.1)
 * Individual user operations: GET, PATCH, DELETE
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifySession } from '@/lib/superadmin/security';
import { queryOne, query as dbQuery } from '@/lib/db/client';
import { emitBusinessEvent } from '@/lib/events/event-emitter';
import { createSuperAdminContextWithTarget, type ValidRole } from '@/lib/auth/session/session-context';
import bcrypt from 'bcryptjs';

const VALID_ROLES: ValidRole[] = ['SUPER_ADMIN', 'ENTERPRISE_ADMIN', 'ENTERPRISE_USER', 'INDIVIDUAL_USER'];

interface UserRecord {
  id: string;
  email: string;
  name: string | null;
  role: string;
  enterprise_id: string | null;
  workspace_id: string | null;
  is_demo: boolean;
  demo_type: string | null;
  is_active: boolean;
  created_at: Date;
  last_login_at: Date | null;
}

/**
 * GET /api/superadmin/users/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               headersList.get('x-real-ip') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    const sessionResult = await verifySession(ip, userAgent);
    if (!sessionResult.valid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const user = await queryOne<UserRecord & { enterprise_name: string | null }>(
      `SELECT u.id, u.email, u.name, u.role, u.enterprise_id, e.name as enterprise_name,
              u.workspace_id, u.is_demo, u.demo_type, u.is_active, u.created_at, u.last_login_at
       FROM users u
       LEFT JOIN enterprises e ON u.enterprise_id = e.enterprise_id
       WHERE u.id = $1`,
      [id]
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('[SuperAdmin] GET /api/superadmin/users/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/superadmin/users/[id]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               headersList.get('x-real-ip') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    const sessionResult = await verifySession(ip, userAgent);
    if (!sessionResult.valid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Validate user exists
    const existing = await queryOne<UserRecord>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;
    const updatedFields: string[] = [];

    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(body.name);
      updatedFields.push('name');
    }
    if (body.role !== undefined) {
      if (!VALID_ROLES.includes(body.role)) {
        return NextResponse.json(
          { success: false, error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
          { status: 400 }
        );
      }
      updates.push(`role = $${paramIndex++}`);
      values.push(body.role);
      updatedFields.push('role');
    }
    if (body.enterprise_id !== undefined) {
      updates.push(`enterprise_id = $${paramIndex++}`);
      values.push(body.enterprise_id);
      updatedFields.push('enterprise_id');
    }
    if (body.workspace_id !== undefined) {
      updates.push(`workspace_id = $${paramIndex++}`);
      values.push(body.workspace_id);
      updatedFields.push('workspace_id');
    }
    if (body.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(body.is_active);
      updatedFields.push('is_active');
    }
    if (body.is_demo !== undefined) {
      updates.push(`is_demo = $${paramIndex++}`);
      values.push(body.is_demo);
      updatedFields.push('is_demo');
    }
    if (body.demo_type !== undefined) {
      updates.push(`demo_type = $${paramIndex++}`);
      values.push(body.demo_type);
      updatedFields.push('demo_type');
    }
    if (body.password !== undefined) {
      const passwordHash = await bcrypt.hash(body.password, 12);
      updates.push(`password_hash = $${paramIndex++}`);
      values.push(passwordHash);
      updatedFields.push('password');
    }

    if (updates.length === 0) {
      return NextResponse.json({
        success: true,
        data: existing,
      });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const updated = await queryOne<UserRecord>(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    // Emit event with target context (S347)
    const ctx = createSuperAdminContextWithTarget({
      enterprise_id: updated?.enterprise_id || existing.enterprise_id,
      workspace_id: updated?.workspace_id || existing.workspace_id,
    });
    const eventType = updatedFields.includes('role') ? 'USER_ROLE_CHANGED' : 'USER_UPDATED';
    await emitBusinessEvent(ctx, {
      event_type: eventType,
      entity_type: 'USER',
      entity_id: id,
      metadata: {
        updated_fields: updatedFields,
        old_role: existing.role,
        new_role: body.role || existing.role,
        actor_email: sessionResult.session?.email,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('[SuperAdmin] PATCH /api/superadmin/users/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/superadmin/users/[id]
 * Soft delete (sets is_active = false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               headersList.get('x-real-ip') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    const sessionResult = await verifySession(ip, userAgent);
    if (!sessionResult.valid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const existing = await queryOne<UserRecord>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Soft delete
    const deleted = await queryOne<UserRecord>(
      `UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );

    // Emit event with target context (S347)
    const ctx = createSuperAdminContextWithTarget({
      enterprise_id: existing.enterprise_id,
      workspace_id: existing.workspace_id,
    });
    await emitBusinessEvent(ctx, {
      event_type: 'USER_DELETED',
      entity_type: 'USER',
      entity_id: id,
      metadata: {
        email: existing.email,
        role: existing.role,
        actor_email: sessionResult.session?.email,
      },
    });

    return NextResponse.json({
      success: true,
      data: deleted,
    });
  } catch (error) {
    console.error('[SuperAdmin] DELETE /api/superadmin/users/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
