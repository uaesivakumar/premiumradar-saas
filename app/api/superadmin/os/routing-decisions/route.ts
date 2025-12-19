/**
 * Super Admin OS Routing Decisions API
 * S232: Model Radar - Routing Decision Viewer
 *
 * Proxies to UPR OS /api/os/routing-decisions
 * Read-only endpoint for visibility into routing behavior.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/superadmin/security';
import { osClient } from '@/lib/os/os-client';

async function verifyAuth(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return verifySession(ip, userAgent);
}

/**
 * GET /api/superadmin/os/routing-decisions
 *
 * Query params:
 * - capability_key: Filter by capability
 * - persona_id: Filter by persona
 * - deviations_only: Only show decisions with replay issues
 * - limit: Max results (default 50)
 * - offset: Pagination offset
 */
export async function GET(request: NextRequest) {
  const session = await verifyAuth(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);

    interface RoutingDecisionsResponse {
      data: Record<string, unknown>[];
      total: number;
      limit: number;
      offset: number;
    }

    const result = await osClient.request<RoutingDecisionsResponse>('/api/os/routing-decisions', {
      params: {
        capability_key: searchParams.get('capability_key') || undefined,
        persona_id: searchParams.get('persona_id') || undefined,
        deviations_only: searchParams.get('deviations_only') || undefined,
        limit: searchParams.get('limit') || '50',
        offset: searchParams.get('offset') || '0',
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data?.data ?? [],
      total: result.data?.total ?? 0,
      limit: result.data?.limit ?? 50,
      offset: result.data?.offset ?? 0,
    });
  } catch (error) {
    console.error('[SuperAdmin:RoutingDecisions] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch routing decisions' },
      { status: 500 }
    );
  }
}
