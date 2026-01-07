/**
 * Distribution API Endpoint
 *
 * S364: Distribution API
 * Behavior Contract B013-B014: Fair distribution with transparency
 *
 * POST /api/workspace/distribution - Distribute a lead
 * GET /api/workspace/distribution/stats - Get distribution stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth-gate';
import { leadDistributor, DEFAULT_DISTRIBUTION_CONFIG } from '@/lib/workspace/lead-distributor';
import { logger } from '@/lib/logging/structured-logger';

/**
 * POST /api/workspace/distribution
 * Distribute a lead to a team member
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
    const { lead, config } = body;

    if (!lead || !lead.id) {
      return NextResponse.json(
        { success: false, error: 'lead object with id is required' },
        { status: 400 }
      );
    }

    // Merge config with defaults
    const distributionConfig = {
      ...DEFAULT_DISTRIBUTION_CONFIG,
      ...config,
    };

    // Distribute the lead
    const result = await leadDistributor.distributeLead(
      session.tenantId,
      lead,
      distributionConfig
    );

    return NextResponse.json({
      success: result.success,
      data: {
        leadId: result.leadId,
        assignedTo: result.assignedTo,
        explanation: result.explanation,
        factors: result.factors,
        alternatives: result.alternativeCandidates,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Distribution API failed', {
      tenantId: session.tenantId,
      error: errorMessage,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to distribute lead',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workspace/distribution
 * Get distribution statistics
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
    // Parse time range
    const sinceParam = searchParams.get('since');
    const since = sinceParam
      ? new Date(sinceParam)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days

    // Get distribution stats
    const stats = await leadDistributor.getDistributionStats(session.tenantId, since);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Distribution stats API failed', {
      tenantId: session.tenantId,
      error: errorMessage,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get distribution stats',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
