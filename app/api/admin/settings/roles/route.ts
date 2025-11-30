/**
 * Roles API
 * Sprint S54: Admin Panel
 *
 * GET /api/admin/settings/roles - List roles
 * POST /api/admin/settings/roles - Create role
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTenantSettingsService } from '@/lib/admin/tenant-settings';
import { getServerSession } from '@/lib/auth/session';
import { RoleSchema } from '@/lib/admin/tenant-settings/types';
import { z } from 'zod';

const CreateRoleSchema = RoleSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id || !session?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.permissions?.includes('team:roles')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const service = createTenantSettingsService(session.tenantId, session.user.id);
    const roles = await service.getRoles();

    return NextResponse.json({ success: true, data: roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id || !session?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.permissions?.includes('team:roles')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = CreateRoleSchema.parse(body);

    const service = createTenantSettingsService(session.tenantId, session.user.id);
    const role = await service.createRole(validated);

    return NextResponse.json({ success: true, data: role }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating role:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create role' },
      { status: 500 }
    );
  }
}
