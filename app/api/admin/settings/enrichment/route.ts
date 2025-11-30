/**
 * Enrichment Pipelines API
 * Sprint S54: Admin Panel
 *
 * GET /api/admin/settings/enrichment - List enrichment pipelines
 * POST /api/admin/settings/enrichment - Create enrichment pipeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTenantSettingsService } from '@/lib/admin/tenant-settings';
import { getServerSession } from '@/lib/auth/session';
import { EnrichmentPipelineSchema } from '@/lib/admin/tenant-settings/types';
import { z } from 'zod';

const CreatePipelineSchema = EnrichmentPipelineSchema.omit({
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

    if (!session.user.permissions?.includes('settings:view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const service = createTenantSettingsService(session.tenantId, session.user.id);
    const pipelines = await service.getEnrichmentPipelines();

    return NextResponse.json({ success: true, data: pipelines });
  } catch (error) {
    console.error('Error fetching enrichment pipelines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrichment pipelines' },
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
    const validated = CreatePipelineSchema.parse({
      ...body,
      createdBy: session.user.id,
    });

    const service = createTenantSettingsService(session.tenantId, session.user.id);
    const pipeline = await service.createEnrichmentPipeline(validated);

    return NextResponse.json({ success: true, data: pipeline }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating enrichment pipeline:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create pipeline' },
      { status: 500 }
    );
  }
}
