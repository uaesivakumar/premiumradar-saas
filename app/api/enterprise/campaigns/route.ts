/**
 * S296: Campaign APIs
 * Part of User & Enterprise Management Program v1.1
 * Phase C - Backend & API
 *
 * GET  /api/enterprise/campaigns - List campaigns
 * POST /api/enterprise/campaigns - Create campaign (ENTERPRISE_ADMIN only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import {
  listEnterpriseCampaigns,
  createCampaign,
  getCampaignStats,
  CampaignType,
  CampaignStatus,
} from '@/lib/db/campaigns';
import { hasRequiredRole } from '@/lib/auth/rbac/types';

// ============================================================
// GET /api/enterprise/campaigns - List campaigns
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const enterpriseId = session.enterpriseId;

    if (!enterpriseId) {
      return NextResponse.json(
        { success: false, error: 'No enterprise associated with user' },
        { status: 404 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as CampaignStatus | null;
    const type = searchParams.get('type') as CampaignType | null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const includeStats = searchParams.get('include_stats') === 'true';

    const { campaigns, total } = await listEnterpriseCampaigns(enterpriseId, {
      status: status || undefined,
      type: type || undefined,
      limit,
      offset,
    });

    // Optionally include stats
    let stats = null;
    if (includeStats) {
      stats = await getCampaignStats(enterpriseId);
    }

    return NextResponse.json({
      success: true,
      data: {
        campaigns: campaigns.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          type: c.type,
          status: c.status,
          version: c.version,
          created_at: c.created_at,
          updated_at: c.updated_at,
        })),
        total,
        limit,
        offset,
        ...(stats ? { stats } : {}),
      },
    });
  } catch (error) {
    console.error('[API] GET /api/enterprise/campaigns error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list campaigns' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/enterprise/campaigns - Create campaign
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has ENTERPRISE_ADMIN or higher role
    const userRole = session.user.role as 'SUPER_ADMIN' | 'ENTERPRISE_ADMIN' | 'ENTERPRISE_USER' | 'INDIVIDUAL_USER' | 'TENANT_ADMIN' | 'TENANT_USER' | 'READ_ONLY';
    if (!hasRequiredRole(userRole, 'ENTERPRISE_ADMIN') && !hasRequiredRole(userRole, 'TENANT_ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'ENTERPRISE_ADMIN role required' },
        { status: 403 }
      );
    }

    const enterpriseId = session.enterpriseId;

    if (!enterpriseId) {
      return NextResponse.json(
        { success: false, error: 'No enterprise associated with user' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Campaign name is required' },
        { status: 400 }
      );
    }

    if (!body.type) {
      return NextResponse.json(
        { success: false, error: 'Campaign type is required' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes: CampaignType[] = ['email', 'linkedin', 'multi-channel', 'sms', 'call'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid campaign type' },
        { status: 400 }
      );
    }

    const campaign = await createCampaign({
      enterprise_id: enterpriseId,
      name: body.name,
      description: body.description,
      type: body.type,
      settings: body.settings,
      target_criteria: body.target_criteria,
      created_by: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        campaign: {
          id: campaign.id,
          name: campaign.name,
          description: campaign.description,
          type: campaign.type,
          status: campaign.status,
          version: campaign.version,
          created_at: campaign.created_at,
        },
      },
    });
  } catch (error) {
    console.error('[API] POST /api/enterprise/campaigns error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
