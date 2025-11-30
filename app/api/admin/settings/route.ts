/**
 * Admin Settings API
 * Sprint S54: Admin Panel (Tenant-Level Controls)
 *
 * GET /api/admin/settings - Get tenant settings
 * PATCH /api/admin/settings - Update tenant settings section
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTenantSettingsService } from '@/lib/admin/tenant-settings';
import { getServerSession } from '@/lib/auth/session';
import { z } from 'zod';

const UpdateSettingsSchema = z.object({
  section: z.enum([
    'general',
    'features',
    'verticals',
    'regions',
    'team',
    'workspace',
    'outreach',
    'enrichment',
    'billing',
  ]),
  data: z.record(z.string(), z.unknown()),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id || !session?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission
    if (!session.user.permissions?.includes('settings:view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const service = createTenantSettingsService(session.tenantId, session.user.id);
    const settings = await service.getSettingsOrCreate();

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id || !session?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission
    if (!session.user.permissions?.includes('settings:edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = UpdateSettingsSchema.parse(body);

    const service = createTenantSettingsService(session.tenantId, session.user.id);
    const updated = await service.updateSection(validated.section, validated.data);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
