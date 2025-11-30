/**
 * Tone Presets API
 * Sprint S54: Admin Panel
 *
 * GET /api/admin/settings/tones - List tone presets
 * POST /api/admin/settings/tones - Create tone preset
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTenantSettingsService } from '@/lib/admin/tenant-settings';
import { getServerSession } from '@/lib/auth/session';
import { TonePresetSchema } from '@/lib/admin/tenant-settings/types';
import { z } from 'zod';

const CreateTonePresetSchema = TonePresetSchema.omit({
  id: true,
  tenantId: true,
  isSystem: true,
  createdAt: true,
  updatedAt: true,
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id || !session?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = createTenantSettingsService(session.tenantId, session.user.id);
    const presets = await service.getTonePresets();

    return NextResponse.json({ success: true, data: presets });
  } catch (error) {
    console.error('Error fetching tone presets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tone presets' },
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

    if (!session.user.permissions?.includes('settings:edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = CreateTonePresetSchema.parse(body);

    const service = createTenantSettingsService(session.tenantId, session.user.id);
    const preset = await service.createTonePreset(validated);

    return NextResponse.json({ success: true, data: preset }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating tone preset:', error);
    return NextResponse.json(
      { error: 'Failed to create tone preset' },
      { status: 500 }
    );
  }
}
