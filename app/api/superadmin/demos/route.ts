/**
 * S343: Super Admin - Demo System API (Admin Plane v1.1)
 * 1-click demo creation, extension, and conversion
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifySession } from '@/lib/superadmin/security';
import { query, queryOne, insert, transaction } from '@/lib/db/client';
import { createEnterprise } from '@/lib/db/enterprises';
import { createDefaultWorkspace } from '@/lib/db/workspaces';
import { emitBusinessEvent } from '@/lib/events/event-emitter';
import type { ResolvedContext } from '@/lib/auth/session/session-context';
import bcrypt from 'bcryptjs';
import { getOrCreateTenantFromEnterprise, warnTenantIdUsage } from '@/lib/db/tenant-bridge';

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
 * GET /api/superadmin/demos
 * List all demo enterprises
 */
export async function GET(request: NextRequest) {
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

    const demos = await query<{
      enterprise_id: string;
      name: string;
      demo_expires_at: Date | null;
      days_remaining: number | null;
      is_expired: boolean;
      user_count: string;
      admin_email: string | null;
      created_at: Date;
    }>(
      `SELECT
        e.enterprise_id,
        e.name,
        e.demo_expires_at,
        CASE
          WHEN e.demo_expires_at IS NULL THEN NULL
          ELSE EXTRACT(DAY FROM e.demo_expires_at - NOW())::int
        END as days_remaining,
        CASE
          WHEN e.demo_expires_at IS NULL THEN false
          ELSE e.demo_expires_at < NOW()
        END as is_expired,
        (SELECT COUNT(*) FROM users WHERE enterprise_id = e.enterprise_id) as user_count,
        (SELECT email FROM users WHERE enterprise_id = e.enterprise_id AND role = 'ENTERPRISE_ADMIN' LIMIT 1) as admin_email,
        e.created_at
      FROM enterprises e
      WHERE e.type = 'DEMO'
      ORDER BY e.created_at DESC`
    );

    return NextResponse.json({
      success: true,
      data: {
        demos: demos.map(d => ({
          ...d,
          user_count: parseInt(d.user_count),
        })),
        total: demos.length,
        stats: {
          active: demos.filter(d => !d.is_expired).length,
          expired: demos.filter(d => d.is_expired).length,
        },
      },
    });
  } catch (error) {
    console.error('[SuperAdmin] GET /api/superadmin/demos error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch demos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/superadmin/demos
 * 1-click demo creation: Creates enterprise + workspace + admin user
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();

    // Required: admin email
    if (!body.admin_email) {
      return NextResponse.json(
        { success: false, error: 'admin_email is required' },
        { status: 400 }
      );
    }

    // Required: sub_vertical_id for workspace
    if (!body.sub_vertical_id) {
      return NextResponse.json(
        { success: false, error: 'sub_vertical_id is required' },
        { status: 400 }
      );
    }

    // Demo parameters
    const enterpriseName = body.enterprise_name || `Demo ${Date.now()}`;
    const demoDays = body.demo_days || 30;
    const demoExpiresAt = new Date(Date.now() + demoDays * 24 * 60 * 60 * 1000);
    const adminPassword = body.admin_password || generateTempPassword();

    // Create enterprise
    const enterprise = await createEnterprise({
      name: enterpriseName,
      type: 'DEMO',
      region: body.region || 'UAE',
      plan: 'free',
      max_users: body.max_users || 5,
      max_workspaces: 1,
      demo_expires_at: demoExpiresAt,
    });

    // Create default workspace
    const workspace = await createDefaultWorkspace(
      enterprise.enterprise_id,
      body.sub_vertical_id,
      'Default Workspace'
    );

    // Create admin user (with legacy tenant_id for DB constraint)
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    warnTenantIdUsage('superadmin/demos POST - legacy constraint');
    const tenantId = await getOrCreateTenantFromEnterprise(enterprise.enterprise_id);
    const adminUser = await insert<{
      id: string;
      email: string;
      role: string;
    }>(
      `INSERT INTO users (
        email, password_hash, name, role,
        enterprise_id, workspace_id, is_demo, demo_type, tenant_id
      )
      VALUES ($1, $2, $3, 'ENTERPRISE_ADMIN', $4, $5, true, 'ENTERPRISE', $6)
      RETURNING id, email, role`,
      [
        body.admin_email,
        passwordHash,
        body.admin_name || 'Demo Admin',
        enterprise.enterprise_id,
        workspace.workspace_id,
        tenantId,
      ]
    );

    // Emit business event
    const ctx = createSuperAdminContext();
    await emitBusinessEvent(ctx, {
      event_type: 'DEMO_STARTED',
      entity_type: 'ENTERPRISE',
      entity_id: enterprise.enterprise_id,
      metadata: {
        enterprise_name: enterprise.name,
        admin_email: body.admin_email,
        demo_days: demoDays,
        expires_at: demoExpiresAt.toISOString(),
        actor_email: sessionResult.session?.email,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        enterprise,
        workspace,
        admin_user: adminUser,
        temp_password: adminPassword, // Only shown once
        expires_at: demoExpiresAt,
        days_remaining: demoDays,
      },
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('[SuperAdmin] POST /api/superadmin/demos error:', error);

    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json(
        { success: false, error: 'Admin email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create demo' },
      { status: 500 }
    );
  }
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
