/**
 * API Cost Tracking Service
 *
 * Aggregates and tracks costs from all API providers:
 * - OpenAI (token-based pricing)
 * - Apollo (subscription-based, usage tracking)
 * - SERP (credit-based pricing)
 *
 * Pulls data from siva_metrics table and api_integrations.
 */

import { query, queryOne } from '@/lib/db/client';

// =============================================================================
// TYPES
// =============================================================================

export interface APICostSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  lastMonth: number;
  byProvider: {
    openai: ProviderCost;
    apollo: ProviderCost;
    serp: ProviderCost;
  };
  history: Array<{ date: string; openai: number; apollo: number; serp: number; total: number }>;
  topOperations: Array<{
    operation: string;
    provider: string;
    callCount: number;
    totalCost: number;
    avgCostPerCall: number;
  }>;
}

export interface ProviderCost {
  today: number;
  thisWeek: number;
  thisMonth: number;
  lastMonth: number;
  callCount: number;
  tokenUsage?: { input: number; output: number };
  estimatedMonthlyBurn?: number;
}

// =============================================================================
// PRICING CONFIGURATION
// =============================================================================

/**
 * Apollo pricing (subscription-based)
 * Estimate cost per API call based on plan
 */
const APOLLO_ESTIMATED_COST_PER_CALL = 0.01; // $0.01 per call estimate

/**
 * SERP pricing (credit-based)
 * Each search costs ~$0.005 (based on $50 for 10,000 credits)
 */
const SERP_COST_PER_SEARCH = 0.005;

// =============================================================================
// COST AGGREGATION
// =============================================================================

/**
 * Get comprehensive API cost summary
 */
export async function getAPICostSummary(days: number = 30): Promise<APICostSummary> {
  try {
    // Get OpenAI costs from siva_metrics (actual token costs)
    const openaiCosts = await getOpenAICosts();

    // Get Apollo usage and estimate costs
    const apolloCosts = await getApolloCosts();

    // Get SERP usage and estimate costs
    const serpCosts = await getSerpCosts();

    // Get daily history
    const history = await getDailyCostHistory(days);

    // Get top operations by cost
    const topOperations = await getTopOperationsByCost();

    // Calculate totals
    const today = openaiCosts.today + apolloCosts.today + serpCosts.today;
    const thisWeek = openaiCosts.thisWeek + apolloCosts.thisWeek + serpCosts.thisWeek;
    const thisMonth = openaiCosts.thisMonth + apolloCosts.thisMonth + serpCosts.thisMonth;
    const lastMonth = openaiCosts.lastMonth + apolloCosts.lastMonth + serpCosts.lastMonth;

    return {
      today,
      thisWeek,
      thisMonth,
      lastMonth,
      byProvider: {
        openai: openaiCosts,
        apollo: apolloCosts,
        serp: serpCosts,
      },
      history,
      topOperations,
    };
  } catch (error) {
    console.error('[API Costs] Failed to get summary:', error);

    // Return empty summary
    return {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      lastMonth: 0,
      byProvider: {
        openai: { today: 0, thisWeek: 0, thisMonth: 0, lastMonth: 0, callCount: 0 },
        apollo: { today: 0, thisWeek: 0, thisMonth: 0, lastMonth: 0, callCount: 0 },
        serp: { today: 0, thisWeek: 0, thisMonth: 0, lastMonth: 0, callCount: 0 },
      },
      history: [],
      topOperations: [],
    };
  }
}

/**
 * Get OpenAI costs from siva_metrics (actual costs stored per call)
 */
async function getOpenAICosts(): Promise<ProviderCost> {
  try {
    // Today's costs
    const today = await queryOne<{
      total_cost: string;
      call_count: string;
      input_tokens: string;
      output_tokens: string;
    }>(`
      SELECT
        COALESCE(SUM(cost_cents), 0) / 100.0 as total_cost,
        COUNT(*) as call_count,
        COALESCE(SUM(input_tokens), 0) as input_tokens,
        COALESCE(SUM(output_tokens), 0) as output_tokens
      FROM siva_metrics
      WHERE provider = 'openai' AND DATE(created_at) = CURRENT_DATE
    `);

    // This week
    const week = await queryOne<{ total_cost: string; call_count: string }>(`
      SELECT
        COALESCE(SUM(cost_cents), 0) / 100.0 as total_cost,
        COUNT(*) as call_count
      FROM siva_metrics
      WHERE provider = 'openai' AND created_at >= CURRENT_DATE - INTERVAL '7 days'
    `);

    // This month
    const month = await queryOne<{ total_cost: string; call_count: string }>(`
      SELECT
        COALESCE(SUM(cost_cents), 0) / 100.0 as total_cost,
        COUNT(*) as call_count
      FROM siva_metrics
      WHERE provider = 'openai' AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `);

    // Last month
    const lastMonth = await queryOne<{ total_cost: string }>(`
      SELECT COALESCE(SUM(cost_cents), 0) / 100.0 as total_cost
      FROM siva_metrics
      WHERE provider = 'openai'
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND created_at < DATE_TRUNC('month', CURRENT_DATE)
    `);

    const monthCost = parseFloat(month?.total_cost || '0');
    const dayOfMonth = new Date().getDate();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const estimatedMonthlyBurn = (monthCost / dayOfMonth) * daysInMonth;

    return {
      today: parseFloat(today?.total_cost || '0'),
      thisWeek: parseFloat(week?.total_cost || '0'),
      thisMonth: monthCost,
      lastMonth: parseFloat(lastMonth?.total_cost || '0'),
      callCount: parseInt(month?.call_count || '0'),
      tokenUsage: {
        input: parseInt(today?.input_tokens || '0'),
        output: parseInt(today?.output_tokens || '0'),
      },
      estimatedMonthlyBurn,
    };
  } catch (error) {
    console.log('[API Costs] OpenAI costs query failed:', error);
    return { today: 0, thisWeek: 0, thisMonth: 0, lastMonth: 0, callCount: 0 };
  }
}

/**
 * Get Apollo costs (estimated based on call count)
 */
async function getApolloCosts(): Promise<ProviderCost> {
  try {
    // Today's calls
    const today = await queryOne<{ call_count: string }>(`
      SELECT COUNT(*) as call_count
      FROM siva_metrics
      WHERE provider = 'apollo' AND DATE(created_at) = CURRENT_DATE
    `);

    // This week
    const week = await queryOne<{ call_count: string }>(`
      SELECT COUNT(*) as call_count
      FROM siva_metrics
      WHERE provider = 'apollo' AND created_at >= CURRENT_DATE - INTERVAL '7 days'
    `);

    // This month
    const month = await queryOne<{ call_count: string }>(`
      SELECT COUNT(*) as call_count
      FROM siva_metrics
      WHERE provider = 'apollo' AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `);

    // Last month
    const lastMonth = await queryOne<{ call_count: string }>(`
      SELECT COUNT(*) as call_count
      FROM siva_metrics
      WHERE provider = 'apollo'
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND created_at < DATE_TRUNC('month', CURRENT_DATE)
    `);

    const todayCalls = parseInt(today?.call_count || '0');
    const weekCalls = parseInt(week?.call_count || '0');
    const monthCalls = parseInt(month?.call_count || '0');
    const lastMonthCalls = parseInt(lastMonth?.call_count || '0');

    return {
      today: todayCalls * APOLLO_ESTIMATED_COST_PER_CALL,
      thisWeek: weekCalls * APOLLO_ESTIMATED_COST_PER_CALL,
      thisMonth: monthCalls * APOLLO_ESTIMATED_COST_PER_CALL,
      lastMonth: lastMonthCalls * APOLLO_ESTIMATED_COST_PER_CALL,
      callCount: monthCalls,
    };
  } catch (error) {
    console.log('[API Costs] Apollo costs query failed:', error);
    return { today: 0, thisWeek: 0, thisMonth: 0, lastMonth: 0, callCount: 0 };
  }
}

/**
 * Get SERP costs (estimated based on search count)
 */
async function getSerpCosts(): Promise<ProviderCost> {
  try {
    // Today's searches
    const today = await queryOne<{ call_count: string }>(`
      SELECT COUNT(*) as call_count
      FROM siva_metrics
      WHERE provider = 'serp' AND DATE(created_at) = CURRENT_DATE
    `);

    // This week
    const week = await queryOne<{ call_count: string }>(`
      SELECT COUNT(*) as call_count
      FROM siva_metrics
      WHERE provider = 'serp' AND created_at >= CURRENT_DATE - INTERVAL '7 days'
    `);

    // This month
    const month = await queryOne<{ call_count: string }>(`
      SELECT COUNT(*) as call_count
      FROM siva_metrics
      WHERE provider = 'serp' AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `);

    // Last month
    const lastMonth = await queryOne<{ call_count: string }>(`
      SELECT COUNT(*) as call_count
      FROM siva_metrics
      WHERE provider = 'serp'
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND created_at < DATE_TRUNC('month', CURRENT_DATE)
    `);

    const todayCalls = parseInt(today?.call_count || '0');
    const weekCalls = parseInt(week?.call_count || '0');
    const monthCalls = parseInt(month?.call_count || '0');
    const lastMonthCalls = parseInt(lastMonth?.call_count || '0');

    return {
      today: todayCalls * SERP_COST_PER_SEARCH,
      thisWeek: weekCalls * SERP_COST_PER_SEARCH,
      thisMonth: monthCalls * SERP_COST_PER_SEARCH,
      lastMonth: lastMonthCalls * SERP_COST_PER_SEARCH,
      callCount: monthCalls,
    };
  } catch (error) {
    console.log('[API Costs] SERP costs query failed:', error);
    return { today: 0, thisWeek: 0, thisMonth: 0, lastMonth: 0, callCount: 0 };
  }
}

/**
 * Get daily cost history by provider
 */
async function getDailyCostHistory(days: number): Promise<Array<{
  date: string;
  openai: number;
  apollo: number;
  serp: number;
  total: number;
}>> {
  try {
    const rows = await query<{
      date: Date;
      provider: string;
      cost: string;
      calls: string;
    }>(`
      SELECT
        DATE(created_at) as date,
        provider,
        CASE
          WHEN provider = 'openai' THEN COALESCE(SUM(cost_cents), 0) / 100.0
          WHEN provider = 'apollo' THEN COUNT(*) * ${APOLLO_ESTIMATED_COST_PER_CALL}
          WHEN provider = 'serp' THEN COUNT(*) * ${SERP_COST_PER_SEARCH}
          ELSE 0
        END as cost,
        COUNT(*) as calls
      FROM siva_metrics
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(created_at), provider
      ORDER BY date ASC
    `);

    // Build date map
    const dateMap = new Map<string, { openai: number; apollo: number; serp: number }>();

    rows.forEach(row => {
      const dateStr = row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date);

      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { openai: 0, apollo: 0, serp: 0 });
      }

      const entry = dateMap.get(dateStr)!;
      const cost = parseFloat(row.cost) || 0;

      if (row.provider === 'openai') entry.openai = cost;
      else if (row.provider === 'apollo') entry.apollo = cost;
      else if (row.provider === 'serp') entry.serp = cost;
    });

    // Fill missing dates
    const result: Array<{ date: string; openai: number; apollo: number; serp: number; total: number }> = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const entry = dateMap.get(dateStr) || { openai: 0, apollo: 0, serp: 0 };
      result.push({
        date: dateStr,
        ...entry,
        total: entry.openai + entry.apollo + entry.serp,
      });
    }

    return result;
  } catch (error) {
    console.log('[API Costs] History query failed:', error);
    return [];
  }
}

/**
 * Get top operations by cost
 */
async function getTopOperationsByCost(): Promise<Array<{
  operation: string;
  provider: string;
  callCount: number;
  totalCost: number;
  avgCostPerCall: number;
}>> {
  try {
    const rows = await query<{
      operation: string;
      provider: string;
      call_count: string;
      total_cost: string;
    }>(`
      SELECT
        operation,
        provider,
        COUNT(*) as call_count,
        CASE
          WHEN provider = 'openai' THEN COALESCE(SUM(cost_cents), 0) / 100.0
          WHEN provider = 'apollo' THEN COUNT(*) * ${APOLLO_ESTIMATED_COST_PER_CALL}
          WHEN provider = 'serp' THEN COUNT(*) * ${SERP_COST_PER_SEARCH}
          ELSE 0
        END as total_cost
      FROM siva_metrics
      WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY operation, provider
      ORDER BY total_cost DESC
      LIMIT 10
    `);

    return rows.map(row => {
      const callCount = parseInt(row.call_count) || 0;
      const totalCost = parseFloat(row.total_cost) || 0;

      return {
        operation: row.operation,
        provider: row.provider,
        callCount,
        totalCost,
        avgCostPerCall: callCount > 0 ? totalCost / callCount : 0,
      };
    });
  } catch (error) {
    console.log('[API Costs] Top operations query failed:', error);
    return [];
  }
}
