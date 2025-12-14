/**
 * Scores API - VS12
 *
 * Fetches REAL scored entities from database.
 * NO mock data - returns empty array if no data exists.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// =============================================================================
// Types
// =============================================================================

interface ScoreRecord {
  id: string;
  company_id: string;
  company_name: string;
  quality_score: number;
  timing_score: number;
  likelihood_score: number;
  engagement_score: number;
  composite_score: number;
  score_breakdown: Record<string, number>;
  signal_count: number;
  region: string;
  created_at: string;
  // From companies join
  industry?: string;
  city?: string;
  headcount?: number;
  headcount_growth?: number;
}

// =============================================================================
// GET - Fetch Scores
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vertical = searchParams.get('vertical') || 'banking';
    const subVertical = searchParams.get('subVertical') || 'employee-banking';
    const regionsParam = searchParams.get('regions');
    const regions = regionsParam ? regionsParam.split(',') : ['UAE'];
    const limit = parseInt(searchParams.get('limit') || '50');

    const pool = getPool();

    // Fetch scores with company data
    const result = await pool.query(`
      SELECT
        s.id,
        s.company_id,
        s.company_name,
        s.quality_score,
        s.timing_score,
        s.likelihood_score,
        s.engagement_score,
        s.composite_score,
        s.score_breakdown,
        s.signal_count,
        s.region,
        s.created_at,
        c.industry,
        c.city,
        c.headcount,
        c.headcount_growth
      FROM scores s
      LEFT JOIN companies c ON s.company_id = c.id
      WHERE s.vertical = $1
        AND s.sub_vertical = $2
        AND s.region = ANY($3)
      ORDER BY s.composite_score DESC
      LIMIT $4
    `, [vertical, subVertical, regions, limit]);

    // Transform to API response format
    const scores = result.rows.map((row: ScoreRecord) => ({
      id: row.id,
      companyId: row.company_id,
      companyName: row.company_name,
      industry: row.industry || 'Unknown',
      city: row.city || row.region || 'UAE',
      headcount: row.headcount || 0,
      headcountGrowth: row.headcount_growth || 0,
      score: {
        quality: row.quality_score,
        timing: row.timing_score,
        likelihood: row.likelihood_score,
        engagement: row.engagement_score,
        composite: row.composite_score,
      },
      scoreBreakdown: row.score_breakdown || {},
      signalCount: row.signal_count || 0,
      createdAt: row.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: {
        scores,
        total: scores.length,
        vertical,
        subVertical,
        regions,
      },
    });
  } catch (error) {
    console.error('[Scores API] Error:', error);

    // Return empty data - NO mock fallback
    return NextResponse.json({
      success: true,
      data: {
        scores: [],
        total: 0,
        message: 'No scores data available. Run discovery and scoring to populate.',
      },
    });
  }
}
