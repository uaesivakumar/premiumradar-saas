/**
 * S341: Super Admin - Enterprise CRUD (Admin Plane v1.1)
 * Individual enterprise operations: GET, PATCH, DELETE
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifySession } from '@/lib/superadmin/security';
import {
  getEnterpriseById,
  updateEnterprise,
  deleteEnterprise,
  type UpdateEnterpriseInput
} from '@/lib/db/enterprises';
import { emitBusinessEvent } from '@/lib/events/event-emitter';
import { getResolvedContext, type ResolvedContext } from '@/lib/auth/session/session-context';

// Helper to create super admin context for event emission
function createSuperAdminContext(email: string): ResolvedContext {
  return {
    user_id: '00000000-0000-0000-0000-000000000001', // Super admin sentinel
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
 * GET /api/superadmin/enterprises/[id]
 * Get enterprise by ID
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
    const enterprise = await getEnterpriseById(id);

    if (!enterprise) {
      return NextResponse.json(
        { success: false, error: 'Enterprise not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: enterprise,
    });
  } catch (error) {
    console.error('[SuperAdmin] GET /api/superadmin/enterprises/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch enterprise' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/superadmin/enterprises/[id]
 * Update enterprise
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

    // Validate enterprise exists
    const existing = await getEnterpriseById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Enterprise not found' },
        { status: 404 }
      );
    }

    // Build update input (only allowed fields)
    const updateInput: UpdateEnterpriseInput = {};
    if (body.name !== undefined) updateInput.name = body.name;
    if (body.region !== undefined) updateInput.region = body.region;
    if (body.status !== undefined) updateInput.status = body.status;
    if (body.domain !== undefined) updateInput.domain = body.domain;
    if (body.industry !== undefined) updateInput.industry = body.industry;
    if (body.plan !== undefined) updateInput.plan = body.plan;
    if (body.max_users !== undefined) updateInput.max_users = body.max_users;
    if (body.max_workspaces !== undefined) updateInput.max_workspaces = body.max_workspaces;
    if (body.max_discoveries_per_month !== undefined) updateInput.max_discoveries_per_month = body.max_discoveries_per_month;

    const updated = await updateEnterprise(id, updateInput);

    // Emit business event
    const ctx = createSuperAdminContext(sessionResult.session?.email || 'unknown');
    await emitBusinessEvent(ctx, {
      event_type: 'ENTERPRISE_UPDATED',
      entity_type: 'ENTERPRISE',
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
    console.error('[SuperAdmin] PATCH /api/superadmin/enterprises/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update enterprise' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/superadmin/enterprises/[id]
 * Soft delete enterprise (sets status to DELETED)
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

    // Validate enterprise exists
    const existing = await getEnterpriseById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Enterprise not found' },
        { status: 404 }
      );
    }

    // Soft delete
    const deleted = await deleteEnterprise(id);

    // Emit business event
    const ctx = createSuperAdminContext(sessionResult.session?.email || 'unknown');
    await emitBusinessEvent(ctx, {
      event_type: 'ENTERPRISE_DELETED',
      entity_type: 'ENTERPRISE',
      entity_id: id,
      metadata: {
        enterprise_name: existing.name,
        actor_email: sessionResult.session?.email,
      },
    });

    return NextResponse.json({
      success: true,
      data: deleted,
    });
  } catch (error) {
    console.error('[SuperAdmin] DELETE /api/superadmin/enterprises/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete enterprise' },
      { status: 500 }
    );
  }
}
