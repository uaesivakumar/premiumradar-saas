/**
 * Outreach Cadences API
 * Sprint S54: Admin Panel
 *
 * GET /api/admin/settings/cadences - List cadences
 * POST /api/admin/settings/cadences - Create cadence
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTenantSettingsService } from '@/lib/admin/tenant-settings';
import { getServerSession } from '@/lib/auth/session';
import { OutreachCadenceSchema } from '@/lib/admin/tenant-settings/types';
import { z } from 'zod';

const CreateCadenceSchema = OutreachCadenceSchema.omit({
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

    if (!session.user.permissions?.includes('outreach:sequences')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const service = createTenantSettingsService(session.tenantId, session.user.id);
    const cadences = await service.getOutreachCadences();

    return NextResponse.json({ success: true, data: cadences });
  } catch (error) {
    console.error('Error fetching cadences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cadences' },
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

    if (!session.user.permissions?.includes('outreach:sequences')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = CreateCadenceSchema.parse({
      ...body,
      createdBy: session.user.id,
    });

    const service = createTenantSettingsService(session.tenantId, session.user.id);
    const cadence = await service.createOutreachCadence(validated);

    return NextResponse.json({ success: true, data: cadence }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating cadence:', error);
    return NextResponse.json(
      { error: 'Failed to create cadence' },
      { status: 500 }
    );
  }
}
