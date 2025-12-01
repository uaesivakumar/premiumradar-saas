/**
 * Journey Runs List API
 * Sprint S50: Journey Execution Viewer
 *
 * GET /api/journeys/:journeyId/runs
 * Returns paginated list of journey runs
 */
import { NextRequest, NextResponse } from 'next/server';
import { listRuns, getJourneyStats } from '@/lib/journey-runs/repository';
import type { JourneyRunStatus, JourneyRunTrigger } from '@/lib/journey-runs/types';

// Temporary tenant extraction (will be replaced with proper auth in later sprint)
function getTenantId(request: NextRequest): string {
  return request.headers.get('x-tenant-id') || 'default-tenant';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ journeyId: string }> }
) {
  try {
    const { journeyId } = await params;
    const tenantId = getTenantId(request);

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = (page - 1) * limit;

    const status = searchParams.get('status') as JourneyRunStatus | null;
    const triggeredBy = searchParams.get('triggered_by') as JourneyRunTrigger | null;
    const startedAfter = searchParams.get('started_after');
    const startedBefore = searchParams.get('started_before');
    const includeStats = searchParams.get('include_stats') === 'true';

    // Fetch runs
    const { runs, total } = await listRuns({
      journeyId,
      tenantId,
      status: status || undefined,
      triggeredBy: triggeredBy || undefined,
      startedAfter: startedAfter ? new Date(startedAfter) : undefined,
      startedBefore: startedBefore ? new Date(startedBefore) : undefined,
      limit,
      offset,
    });

    // Optionally include journey stats
    let stats = null;
    if (includeStats) {
      stats = await getJourneyStats(journeyId, tenantId);
    }

    return NextResponse.json({
      success: true,
      data: {
        runs,
        pagination: {
          total,
          page,
          limit,
          hasMore: offset + runs.length < total,
          totalPages: Math.ceil(total / limit),
        },
        ...(stats && { stats }),
      },
    });
  } catch (error) {
    console.error('[API /journeys/[journeyId]/runs] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch journey runs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
