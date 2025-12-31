/**
 * S343: Super Admin - Demo Lifecycle (Admin Plane v1.1)
 * Demo extension and conversion operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifySession } from '@/lib/superadmin/security';
import { queryOne, query } from '@/lib/db/client';
import { getEnterpriseById, updateEnterprise } from '@/lib/db/enterprises';
import { emitBusinessEvent } from '@/lib/events/event-emitter';
import type { ResolvedContext } from '@/lib/auth/session/session-context';

function createSuperAdminContext(): ResolvedContext {
  return {
    user_id: '00000000-0000-0000-0000-000000000001',
    role: 'SUPER_ADMIN',
    enterprise_id: null,
    workspace_id: null,
    sub_vertical_id: null,
    region_code: null,
    is_demo: false,
    demo_type: null,
  };
}

/**
 * GET /api/superadmin/demos/[id]
 * Get demo details
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
    const demo = await queryOne<{
      enterprise_id: string;
      name: string;
      type: string;
      demo_expires_at: Date | null;
      plan: string;
      status: string;
      created_at: Date;
    }>(
      `SELECT enterprise_id, name, type, demo_expires_at, plan, status, created_at
       FROM enterprises WHERE enterprise_id = $1`,
      [id]
    );

    if (!demo) {
      return NextResponse.json(
        { success: false, error: 'Demo not found' },
        { status: 404 }
      );
    }

    if (demo.type !== 'DEMO') {
      return NextResponse.json(
        { success: false, error: 'Enterprise is not a demo' },
        { status: 400 }
      );
    }

    // Get users
    const users = await query<{ id: string; email: string; role: string }>(
      `SELECT id, email, role FROM users WHERE enterprise_id = $1`,
      [id]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...demo,
        users,
        is_expired: demo.demo_expires_at ? new Date(demo.demo_expires_at) < new Date() : false,
        days_remaining: demo.demo_expires_at
          ? Math.ceil((new Date(demo.demo_expires_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
          : null,
      },
    });
  } catch (error) {
    console.error('[SuperAdmin] GET /api/superadmin/demos/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch demo' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/superadmin/demos/[id]
 * Extend demo or convert to real
 *
 * Actions:
 * - { action: 'extend', days: 14 } - Extend demo by N days
 * - { action: 'convert', plan: 'starter' } - Convert to real enterprise
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

    const enterprise = await getEnterpriseById(id);
    if (!enterprise) {
      return NextResponse.json(
        { success: false, error: 'Demo not found' },
        { status: 404 }
      );
    }

    if (enterprise.type !== 'DEMO') {
      return NextResponse.json(
        { success: false, error: 'Enterprise is not a demo' },
        { status: 400 }
      );
    }

    const ctx = createSuperAdminContext();

    if (body.action === 'extend') {
      // Extend demo
      const days = body.days || 14;
      const currentExpiry = enterprise.demo_expires_at || new Date();
      const newExpiry = new Date(Math.max(Date.now(), currentExpiry.getTime()) + days * 24 * 60 * 60 * 1000);

      const updated = await updateEnterprise(id, {
        demo_expires_at: newExpiry,
      });

      await emitBusinessEvent(ctx, {
        event_type: 'DEMO_EXTENDED',
        entity_type: 'ENTERPRISE',
        entity_id: id,
        metadata: {
          enterprise_name: enterprise.name,
          days_extended: days,
          old_expiry: enterprise.demo_expires_at?.toISOString(),
          new_expiry: newExpiry.toISOString(),
          actor_email: sessionResult.session?.email,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          ...updated,
          action: 'extended',
          days_added: days,
          new_expiry: newExpiry,
        },
      });

    } else if (body.action === 'convert') {
      // Convert to real enterprise
      const plan = body.plan || 'starter';
      const maxUsers = body.max_users || 10;
      const maxWorkspaces = body.max_workspaces || 3;

      const updated = await updateEnterprise(id, {
        // Remove DEMO type - becomes REAL
        status: 'ACTIVE',
        plan,
        max_users: maxUsers,
        max_workspaces: maxWorkspaces,
        demo_expires_at: undefined, // Clear expiry
      });

      // Update enterprise type directly (not in updateEnterprise)
      await queryOne(
        `UPDATE enterprises SET type = 'REAL', demo_expires_at = NULL WHERE enterprise_id = $1`,
        [id]
      );

      // Update all users to non-demo
      await query(
        `UPDATE users SET is_demo = false, demo_type = NULL WHERE enterprise_id = $1`,
        [id]
      );

      await emitBusinessEvent(ctx, {
        event_type: 'DEMO_CONVERTED',
        entity_type: 'ENTERPRISE',
        entity_id: id,
        metadata: {
          enterprise_name: enterprise.name,
          new_plan: plan,
          actor_email: sessionResult.session?.email,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          ...updated,
          type: 'REAL',
          action: 'converted',
          new_plan: plan,
        },
      });

    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "extend" or "convert"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[SuperAdmin] PATCH /api/superadmin/demos/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update demo' },
      { status: 500 }
    );
  }
}
