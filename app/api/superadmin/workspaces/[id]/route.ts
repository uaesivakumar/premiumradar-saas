/**
 * S341: Super Admin - Workspace CRUD (Admin Plane v1.1)
 * Individual workspace operations: GET, PATCH, DELETE
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifySession } from '@/lib/superadmin/security';
import {
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  type UpdateWorkspaceInput
} from '@/lib/db/workspaces';
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
 * GET /api/superadmin/workspaces/[id]
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
    const workspace = await getWorkspaceById(id);

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: 'Workspace not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: workspace,
    });
  } catch (error) {
    console.error('[SuperAdmin] GET /api/superadmin/workspaces/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workspace' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/superadmin/workspaces/[id]
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

    const existing = await getWorkspaceById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Workspace not found' },
        { status: 404 }
      );
    }

    const updateInput: UpdateWorkspaceInput = {};
    if (body.name !== undefined) updateInput.name = body.name;
    if (body.sub_vertical_id !== undefined) updateInput.sub_vertical_id = body.sub_vertical_id;
    if (body.slug !== undefined) updateInput.slug = body.slug;
    if (body.is_default !== undefined) updateInput.is_default = body.is_default;
    if (body.settings !== undefined) updateInput.settings = body.settings;
    if (body.status !== undefined) updateInput.status = body.status;

    const updated = await updateWorkspace(id, updateInput);

    const ctx = createSuperAdminContext();
    await emitBusinessEvent(ctx, {
      event_type: 'WORKSPACE_UPDATED',
      entity_type: 'WORKSPACE',
      entity_id: id,
      metadata: {
        updated_fields: Object.keys(updateInput),
        actor_email: sessionResult.session?.email,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('[SuperAdmin] PATCH /api/superadmin/workspaces/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update workspace' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/superadmin/workspaces/[id]
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

    const existing = await getWorkspaceById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Workspace not found' },
        { status: 404 }
      );
    }

    const deleted = await deleteWorkspace(id);

    const ctx = createSuperAdminContext();
    await emitBusinessEvent(ctx, {
      event_type: 'WORKSPACE_DELETED',
      entity_type: 'WORKSPACE',
      entity_id: id,
      metadata: {
        workspace_name: existing.name,
        enterprise_id: existing.enterprise_id,
        actor_email: sessionResult.session?.email,
      },
    });

    return NextResponse.json({
      success: true,
      data: deleted,
    });
  } catch (error) {
    console.error('[SuperAdmin] DELETE /api/superadmin/workspaces/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete workspace' },
      { status: 500 }
    );
  }
}
