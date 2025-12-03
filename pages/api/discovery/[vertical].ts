/**
 * Discovery API Route
 * Sprint S55: Discovery UI
 *
 * GET /api/discovery/[vertical]
 * SaaS→OS adapter for discovery data.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { isValidVertical, type VerticalId } from '../../../lib/dashboard';
import type {
  DiscoveryListAPIResponse,
  DiscoveryUIFilter,
  DiscoveryDateRange,
} from '../../../lib/discovery';
import { fetchDiscoveryList } from '../../../lib/discovery';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DiscoveryListAPIResponse>
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

    // Parse query parameters
    const territory = typeof req.query.territory === 'string' ? req.query.territory : undefined;
    const page = typeof req.query.page === 'string' ? parseInt(req.query.page, 10) : 1;
    const pageSize = typeof req.query.pageSize === 'string' ? parseInt(req.query.pageSize, 10) : 20;

    // Parse filters
    const filters: Partial<DiscoveryUIFilter> = {};

    if (typeof req.query.q === 'string') {
      filters.searchQuery = req.query.q;
    }

    if (typeof req.query.industries === 'string') {
      filters.industries = req.query.industries.split(',');
    }

    if (typeof req.query.sizes === 'string') {
      filters.companySizes = req.query.sizes.split(',') as any[];
    }

    if (typeof req.query.minScore === 'string' && typeof req.query.maxScore === 'string') {
      filters.scoreRange = {
        min: parseInt(req.query.minScore, 10),
        max: parseInt(req.query.maxScore, 10),
      };
    }

    if (typeof req.query.signals === 'string') {
      filters.signals = req.query.signals.split(',');
    }

    if (typeof req.query.freshness === 'string') {
      filters.freshness = req.query.freshness.split(',') as any[];
    }

    if (typeof req.query.sortBy === 'string') {
      filters.sortBy = req.query.sortBy as any;
    }

    if (typeof req.query.sortOrder === 'string') {
      filters.sortOrder = req.query.sortOrder as 'asc' | 'desc';
    }

    // Parse date range
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
        filters.dateRange = {
          start: startDate,
          end: now,
          preset: preset as '7d' | '30d' | '90d',
        };
      }
    } else if (start && end && typeof start === 'string' && typeof end === 'string') {
      filters.dateRange = {
        start: new Date(start),
        end: new Date(end),
        preset: 'custom',
      };
    }

    if (territory) {
      filters.territory = territory;
    }

    // Fetch from OS
    const response = await fetchDiscoveryList(verticalId, filters, page, pageSize);

    if (!response.success) {
      return res.status(500).json(response);
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Discovery API error:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
