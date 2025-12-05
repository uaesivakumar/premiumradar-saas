/**
 * SIVA Metrics API
 *
 * GET /api/superadmin/siva/metrics - Get SIVA health metrics
 *
 * Returns Bloomberg-style health metrics for the SIVA Intelligence Dashboard:
 * - Overall health score with trend
 * - Quality and accuracy metrics
 * - Response times
 * - Token usage and efficiency
 * - Costs by provider
 * - Recent interactions
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifySession } from '@/lib/superadmin/security';
import { getSivaHealthMetrics, type SivaHealthMetrics } from '@/lib/siva/metrics';

/**
 * GET - Fetch SIVA health metrics
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

    // Fetch SIVA health metrics
    const metrics: SivaHealthMetrics = await getSivaHealthMetrics(days);

    return NextResponse.json({
      success: true,
      data: metrics,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[SIVA Metrics API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch SIVA metrics' },
      { status: 500 }
    );
  }
}
