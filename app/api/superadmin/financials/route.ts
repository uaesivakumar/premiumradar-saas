/**
 * Financials API
 *
 * GET /api/superadmin/financials - Get comprehensive financial summary
 *
 * Returns:
 * - Revenue (MRR, ARR, history)
 * - Expenses (GCP, APIs, other)
 * - Profit margins
 * - Burn rate
 * - Runway projection
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifySession } from '@/lib/superadmin/security';
import { getFinancialSummary } from '@/lib/costs/financials';

/**
 * GET - Fetch financial summary
 */
export async function GET(request: NextRequest) {
  try {
    // Verify super admin session
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               headersList.get('x-real-ip') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    const sessionResult = await verifySession(ip, userAgent);
    if (!sessionResult.valid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get optional days parameter (default 30)
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30', 10);

    // Fetch financial summary
    const summary = await getFinancialSummary(days);

    return NextResponse.json({
      success: true,
      data: summary,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Financials API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch financial data' },
      { status: 500 }
    );
  }
}
