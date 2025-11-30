/**
 * Usage Dashboard API
 * Sprint S57: Billing, Plans & Feature Flags
 *
 * GET /api/billing/usage - Get usage summary with alerts
 * POST /api/billing/usage/acknowledge - Acknowledge an alert
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUsageSummary } from '@/lib/billing/metered-usage';
import {
  getUsageWithAlerts,
  acknowledgeAlert,
  checkUsageAndAlert,
} from '@/lib/billing/overage-alerts';
import type { PlanTier } from '@/lib/billing/types';

const AcknowledgeSchema = z.object({
  alertId: z.string(),
  userId: z.string(),
});

/**
 * GET - Get usage summary with alerts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const tier = (searchParams.get('tier') as PlanTier) || 'free';

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'workspaceId required' },
        { status: 400 }
      );
    }

    // Get usage summary
    const summary = getUsageSummary(workspaceId, tier);

    // Check for alerts
    const { usage, alerts } = getUsageWithAlerts(workspaceId, tier);

    return NextResponse.json({
      success: true,
      data: {
        period: summary.period,
        usage,
        alerts,
        tier,
      },
    });
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get usage data' },
      { status: 500 }
    );
  }
}

/**
 * POST - Acknowledge an alert
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'acknowledge') {
      const parsed = AcknowledgeSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid request', details: parsed.error.issues },
          { status: 400 }
        );
      }

      const { alertId, userId } = parsed.data;
      const workspaceId = body.workspaceId;

      if (!workspaceId) {
        return NextResponse.json(
          { success: false, error: 'workspaceId required' },
          { status: 400 }
        );
      }

      const alert = acknowledgeAlert(workspaceId, alertId, userId);

      if (!alert) {
        return NextResponse.json(
          { success: false, error: 'Alert not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: alert,
      });
    }

    if (action === 'check') {
      const workspaceId = body.workspaceId;
      const tier = (body.tier as PlanTier) || 'free';

      if (!workspaceId) {
        return NextResponse.json(
          { success: false, error: 'workspaceId required' },
          { status: 400 }
        );
      }

      const result = checkUsageAndAlert(workspaceId, tier);

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
