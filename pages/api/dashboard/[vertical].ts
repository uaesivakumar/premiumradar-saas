/**
 * Dashboard API Route
 * Sprint S54: Vertical Dashboards
 *
 * GET /api/dashboard/[vertical]
 * Fetches dashboard data for a specific vertical.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  isValidVertical,
  fetchFullDashboard,
  getVerticalConfig,
  type VerticalId,
  type DashboardAPIResponse,
  type DateRange,
} from '../../../lib/dashboard';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DashboardAPIResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { vertical } = req.query;

    // Validate vertical parameter
    if (!vertical || typeof vertical !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid vertical parameter',
      });
    }

    if (!isValidVertical(vertical)) {
      return res.status(400).json({
        success: false,
        error: `Invalid vertical: ${vertical}. Valid verticals: banking, real-estate, consulting, technology, energy, healthcare`,
      });
    }

    const verticalId = vertical as VerticalId;

    // Parse optional query parameters
    const territory = typeof req.query.territory === 'string' ? req.query.territory : undefined;

    // Parse date range
    let dateRange: DateRange | undefined;
    const { start, end, preset } = req.query;

    if (preset && typeof preset === 'string') {
      const now = new Date();
      const presetDays: Record<string, number> = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
      };

      if (preset in presetDays) {
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - presetDays[preset]);
        dateRange = {
          start: startDate,
          end: now,
          preset: preset as '7d' | '30d' | '90d',
        };
      }
    } else if (start && end && typeof start === 'string' && typeof end === 'string') {
      dateRange = {
        start: new Date(start),
        end: new Date(end),
        preset: 'custom',
      };
    }

    // Fetch dashboard data
    const dashboardData = await fetchFullDashboard(verticalId, territory, dateRange);

    // Return successful response
    return res.status(200).json({
      success: true,
      data: {
        vertical: verticalId,
        territory,
        dateRange: dateRange || {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date(),
          preset: '30d',
        },
        kpis: dashboardData.kpis,
        funnel: dashboardData.funnel,
        personas: dashboardData.personas,
        heatmap: dashboardData.heatmap,
        trends: dashboardData.trends,
        signals: dashboardData.signals,
        discovery: dashboardData.discovery,
        outreach: dashboardData.outreach,
        autonomous: dashboardData.autonomous,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Dashboard API error:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
