/**
 * Enrichment Search API Route
 *
 * Provides real data from Apollo + SERP via the enrichment engine.
 * Uses vertical config for signal types, scoring, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchAndEnrich, enrichSingleEntity } from '@/lib/integrations/enrichment-engine';

export const dynamic = 'force-dynamic';

/**
 * POST /api/enrichment/search
 * Search and enrich entities based on vertical config
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      vertical,
      subVertical,
      region,
      regions,
      industries,
      minHeadcount,
      maxHeadcount,
      minScore,
      limit,
    } = body;

    // Validate required fields
    if (!vertical || !subVertical || !region) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: vertical, subVertical, region',
        },
        { status: 400 }
      );
    }

    const result = await searchAndEnrich({
      vertical,
      subVertical,
      region,
      regions,
      industries,
      minHeadcount,
      maxHeadcount,
      minScore,
      limit: limit || 10,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Enrichment API] Search error:', error);

    // Check for known error types
    if (error instanceof Error) {
      if (error.message.includes('VERTICAL_NOT_CONFIGURED')) {
        return NextResponse.json(
          {
            success: false,
            error: 'VERTICAL_NOT_CONFIGURED',
            message: 'Coming Soon — We\'re expanding to your industry! Request early access.',
          },
          { status: 404 }
        );
      }

      if (error.message.includes('not configured')) {
        return NextResponse.json(
          {
            success: false,
            error: 'INTEGRATION_NOT_CONFIGURED',
            message: 'API integration not configured. Add API key in Super Admin → Integrations.',
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search and enrich',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/enrichment/search
 * Enrich a single entity by name or domain
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const entity = searchParams.get('entity');
    const vertical = searchParams.get('vertical');
    const subVertical = searchParams.get('subVertical');
    const region = searchParams.get('region');

    if (!entity || !vertical || !subVertical || !region) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required params: entity, vertical, subVertical, region',
        },
        { status: 400 }
      );
    }

    const result = await enrichSingleEntity(entity, vertical, subVertical, region);

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: 'ENTITY_NOT_FOUND',
          message: `Could not find or enrich entity: ${entity}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Enrichment API] Enrich error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to enrich entity',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
