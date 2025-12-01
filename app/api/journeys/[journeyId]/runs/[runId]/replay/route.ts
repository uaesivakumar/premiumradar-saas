/**
 * Journey Run Replay API (STUB)
 * Sprint S50: Journey Execution Viewer
 *
 * POST /api/journeys/:journeyId/runs/:runId/replay
 *
 * STUB ONLY - Actual replay implementation in S52
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ journeyId: string; runId: string }> }
) {
  const { journeyId, runId } = await params;

  // Log the replay request for debugging
  console.log(`[API /journeys/${journeyId}/runs/${runId}/replay] Replay requested (STUB)`);

  // Return stub response
  return NextResponse.json({
    ok: true,
    message: 'Replay not implemented in S50. Coming in S52.',
    journeyId,
    runId,
    stub: true,
  });
}
