/**
 * S341: Super Admin - Workspaces API (Admin Plane v1.1)
 * List and create workspaces
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifySession } from '@/lib/superadmin/security';
import { query } from '@/lib/db/client';
import { createWorkspace, type CreateWorkspaceInput } from '@/lib/db/workspaces';
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
 * GET /api/superadmin/workspaces
 * List all workspaces with filtering
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

    const { searchParams } = new URL(request.url);
    const enterpriseId = searchParams.get('enterprise_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let whereClause = 'WHERE 1=1';
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (enterpriseId) {
      whereClause += ` AND w.enterprise_id = $${paramIndex++}`;
      params.push(enterpriseId);
    }

    if (status) {
      whereClause += ` AND w.status = $${paramIndex++}`;
      params.push(status);
    }

    const workspaces = await query<{
      workspace_id: string;
      enterprise_id: string;
      enterprise_name: string;
      name: string;
      sub_vertical_id: string;
      sub_vertical_name: string | null;
      status: string;
      is_default: boolean;
      user_count: string;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT
        w.workspace_id,
        w.enterprise_id,
        e.name as enterprise_name,
        w.name,
        w.sub_vertical_id,
        sv.name as sub_vertical_name,
        w.status,
        w.is_default,
        (SELECT COUNT(*) FROM users u WHERE u.workspace_id = w.workspace_id) as user_count,
        w.created_at,
        w.updated_at
      FROM workspaces w
      LEFT JOIN enterprises e ON w.enterprise_id = e.enterprise_id
      LEFT JOIN os_sub_verticals sv ON w.sub_vertical_id = sv.id
      ${whereClause}
      ORDER BY w.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, limit, offset]
    );

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM workspaces w ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0]?.count || '0');

    return NextResponse.json({
      success: true,
      data: {
        workspaces: workspaces.map(w => ({
          ...w,
          user_count: parseInt(w.user_count),
        })),
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('[SuperAdmin] GET /api/superadmin/workspaces error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workspaces' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/superadmin/workspaces
 * Create a new workspace
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

    // Validate required fields
    if (!body.enterprise_id) {
      return NextResponse.json(
        { success: false, error: 'enterprise_id is required' },
        { status: 400 }
      );
    }
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'name is required' },
        { status: 400 }
      );
    }
    if (!body.sub_vertical_id) {
      return NextResponse.json(
        { success: false, error: 'sub_vertical_id is required' },
        { status: 400 }
      );
    }

    const input: CreateWorkspaceInput = {
      enterprise_id: body.enterprise_id,
      name: body.name,
      sub_vertical_id: body.sub_vertical_id,
      slug: body.slug,
      is_default: body.is_default || false,
      settings: body.settings,
    };

    const workspace = await createWorkspace(input);

    // Emit business event
    const ctx = createSuperAdminContext();
    await emitBusinessEvent(ctx, {
      event_type: 'WORKSPACE_CREATED',
      entity_type: 'WORKSPACE',
      entity_id: workspace.workspace_id,
      metadata: {
        workspace_name: workspace.name,
        enterprise_id: workspace.enterprise_id,
        sub_vertical_id: workspace.sub_vertical_id,
        actor_email: sessionResult.session?.email,
      },
    });

    return NextResponse.json({
      success: true,
      data: workspace,
    }, { status: 201 });
  } catch (error) {
    console.error('[SuperAdmin] POST /api/superadmin/workspaces error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create workspace' },
      { status: 500 }
    );
  }
}
