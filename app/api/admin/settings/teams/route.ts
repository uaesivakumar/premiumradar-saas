/**
 * Teams API
 * Sprint S54: Admin Panel
 *
 * GET /api/admin/settings/teams - List teams
 * POST /api/admin/settings/teams - Create team
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTenantSettingsService } from '@/lib/admin/tenant-settings';
import { getServerSession } from '@/lib/auth/session';
import { TeamSchema } from '@/lib/admin/tenant-settings/types';
import { z } from 'zod';

const CreateTeamSchema = TeamSchema.omit({
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

    if (!session.user.permissions?.includes('team:view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const service = createTenantSettingsService(session.tenantId, session.user.id);
    const teams = await service.getTeams();

    return NextResponse.json({ success: true, data: teams });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
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

    if (!session.user.permissions?.includes('team:manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = CreateTeamSchema.parse(body);

    const service = createTenantSettingsService(session.tenantId, session.user.id);
    const team = await service.createTeam(validated);

    return NextResponse.json({ success: true, data: team }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create team' },
      { status: 500 }
    );
  }
}
