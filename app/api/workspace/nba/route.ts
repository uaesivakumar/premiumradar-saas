/**
 * NBA API Endpoint
 *
 * S361: Context-aware NBA
 * Behavior Contract B012: NBA adapts to context
 *
 * GET /api/workspace/nba - Get the current NBA for the user
 * POST /api/workspace/nba/:id/complete - Mark NBA as complete
 * POST /api/workspace/nba/:id/dismiss - Dismiss the NBA
 * POST /api/workspace/nba/:id/defer - Defer the NBA for later
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, injectSecureTenantContext } from '@/lib/middleware/auth-gate';
import { nbaEngine, NBAContext } from '@/lib/workspace/nba-engine';
import { recordNBAInteraction } from '@/lib/events/event-consumer';
import { logger } from '@/lib/logging/structured-logger';

/**
 * GET /api/workspace/nba
 * Get the single Next Best Action for the current user
 */
export async function GET(request: NextRequest) {
  // Require authentication
  const auth = await requireAuth();
  if (!auth.success) {
    return auth.response;
  }

  const { session } = auth;
  const searchParams = request.nextUrl.searchParams;

  try {
    // Build context from session and query params
    const context: NBAContext = {
      tenantId: session.tenantId,
      userId: session.user.id,
      workspaceId: searchParams.get('workspaceId') || undefined,
      currentLeadId: searchParams.get('leadId') || undefined,
      currentTime: new Date(),
      userActivity: (searchParams.get('activity') as NBAContext['userActivity']) || 'active',
    };

    // Get the NBA
    const result = await nbaEngine.getNBA(context);

    return NextResponse.json({
      success: true,
      data: result.nba,
      meta: {
        candidatesEvaluated: result.candidatesEvaluated,
        selectionReason: result.selectionReason,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('NBA fetch failed', {
      tenantId: session.tenantId,
      userId: session.user.id,
      error: errorMessage,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get NBA',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspace/nba
 * Record NBA interaction (complete, dismiss, defer)
 */
export async function POST(request: NextRequest) {
  // Require authentication
  const auth = await requireAuth();
  if (!auth.success) {
    return auth.response;
  }

  const { session } = auth;

  try {
    const body = await request.json();
    const { nbaId, action, leadId, nbaType, metadata } = body;

    if (!nbaId || !action) {
      return NextResponse.json(
        { success: false, error: 'nbaId and action are required' },
        { status: 400 }
      );
    }

    if (!['complete', 'dismiss', 'defer'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'action must be one of: complete, dismiss, defer' },
        { status: 400 }
      );
    }

    // Map action to outcome
    const outcomeMap: Record<string, 'completed' | 'dismissed' | 'deferred'> = {
      complete: 'completed',
      dismiss: 'dismissed',
      defer: 'deferred',
    };

    // Record the outcome
    await nbaEngine.markCompleted(
      session.tenantId,
      session.user.id,
      nbaId,
      outcomeMap[action]
    );

    // Emit event for learning loop
    const accepted = action === 'complete';
    await recordNBAInteraction(
      session.tenantId,
      session.user.id,
      nbaId,
      accepted,
      {
        leadId,
        nbaType,
        reason: metadata?.reason,
      }
    );

    logger.info('NBA interaction recorded', {
      tenantId: session.tenantId,
      userId: session.user.id,
      nbaId,
      action,
      outcome: outcomeMap[action],
    });

    return NextResponse.json({
      success: true,
      data: {
        nbaId,
        action,
        outcome: outcomeMap[action],
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('NBA interaction failed', {
      tenantId: session.tenantId,
      userId: session.user.id,
      error: errorMessage,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to record NBA interaction',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
