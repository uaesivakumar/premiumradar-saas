/**
 * Journey Run Details API
 * Sprint S50: Journey Execution Viewer
 *
 * GET /api/journeys/:journeyId/runs/:runId
 * Returns full execution details for a specific run
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getRunDetails,
  getAIUsageMetrics,
  getRunById,
} from '@/lib/journey-runs/repository';

// Temporary tenant extraction (will be replaced with proper auth in later sprint)
function getTenantId(request: NextRequest): string {
  return request.headers.get('x-tenant-id') || 'default-tenant';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ journeyId: string; runId: string }> }
) {
  try {
    const { journeyId, runId } = await params;
    const tenantId = getTenantId(request);

    // Parse query params for selective loading
    const { searchParams } = new URL(request.url);
    const includeAILogs = searchParams.get('include_ai_logs') !== 'false';
    const includeContextSnapshots = searchParams.get('include_context') !== 'false';
    const includeOSCalls = searchParams.get('include_os_calls') !== 'false';

    // Verify the run belongs to the journey
    const run = await getRunById(runId, tenantId);
    if (!run) {
      return NextResponse.json(
        { success: false, error: 'Run not found' },
        { status: 404 }
      );
    }

    if (run.journeyId !== journeyId) {
      return NextResponse.json(
        { success: false, error: 'Run does not belong to this journey' },
        { status: 400 }
      );
    }

    // Get full details
    const details = await getRunDetails(runId, tenantId);
    if (!details) {
      return NextResponse.json(
        { success: false, error: 'Failed to load run details' },
        { status: 500 }
      );
    }

    // Get AI usage metrics
    const aiUsage = await getAIUsageMetrics(runId);

    // Build response with optional exclusions
    const response: Record<string, unknown> = {
      run: details.run,
      steps: details.steps,
      errors: details.errors,
      checkpoints: details.checkpoints,
      transitions: details.transitions,
      aiUsage,
    };

    if (includeAILogs) {
      response.aiLogs = details.aiLogs;
    }

    if (includeContextSnapshots) {
      response.contextSnapshots = details.contextSnapshots;
    }

    if (includeOSCalls) {
      response.osCalls = details.osCalls;
    }

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('[API /journeys/[journeyId]/runs/[runId]] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch run details',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
