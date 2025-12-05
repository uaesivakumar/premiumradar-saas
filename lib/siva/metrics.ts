/**
 * SIVA Metrics Service
 *
 * Logs and queries AI/API call metrics for the SIVA Intelligence Dashboard.
 * Provides Bloomberg-style monitoring of SIVA's performance over time.
 */

import { query, queryOne, insert } from '@/lib/db/client';

// =============================================================================
// TYPES
// =============================================================================

export type SivaProvider = 'openai' | 'apollo' | 'serp';

export interface SivaMetricInput {
  provider: SivaProvider;
  operation: string;
  integrationId?: string;
  tenantId?: string;
  userId?: string;
  vertical?: string;
  subVertical?: string;
  requestType?: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  costCents?: number;
  responseTimeMs?: number;
  success?: boolean;
  errorCode?: string;
  errorMessage?: string;
  qualityScore?: number;
  accuracyScore?: number;
  userFeedback?: number;
  requestSummary?: string;
  responseSummary?: string;
  metadata?: Record<string, unknown>;
}

export interface SivaMetric {
  id: string;
  createdAt: Date;
  provider: SivaProvider;
  operation: string;
  integrationId?: string;
  tenantId?: string;
  userId?: string;
  vertical?: string;
  subVertical?: string;
  requestType?: string;
  model?: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costCents: number;
  responseTimeMs?: number;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  qualityScore?: number;
  accuracyScore?: number;
  userFeedback?: number;
  requestSummary?: string;
  responseSummary?: string;
  metadata: Record<string, unknown>;
}

export interface SivaDailyStats {
  date: string;
  provider: SivaProvider;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostCents: number;
  avgResponseTimeMs: number;
  p95ResponseTimeMs: number;
  avgQualityScore: number | null;
  avgAccuracyScore: number | null;
  avgUserFeedback: number | null;
}

export interface SivaHealthMetrics {
  overall: {
    healthScore: number;
    trend: 'improving' | 'stable' | 'declining';
    trendPercent: number;
  };
  quality: {
    current: number;
    previous: number;
    history: Array<{ date: string; value: number }>;
  };
  accuracy: {
    current: number;
    previous: number;
    history: Array<{ date: string; value: number }>;
  };
  responseTime: {
    avgMs: number;
    p95Ms: number;
    history: Array<{ date: string; value: number }>;
  };
  tokens: {
    todayInput: number;
    todayOutput: number;
    efficiency: number;
    history: Array<{ date: string; input: number; output: number }>;
  };
  costs: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    byProvider: {
      openai: number;
      apollo: number;
      serp: number;
    };
    history: Array<{ date: string; amount: number }>;
  };
  interactions: {
    today: number;
    successful: number;
    failed: number;
    avgSatisfaction: number;
  };
}

// =============================================================================
// LOGGING FUNCTIONS
// =============================================================================

/**
 * Log a SIVA metric (API call)
 */
export async function logSivaMetric(input: SivaMetricInput): Promise<string | null> {
  try {
    const totalTokens = (input.inputTokens || 0) + (input.outputTokens || 0);

    const result = await insert<{ id: string }>(`
      INSERT INTO siva_metrics (
        provider, operation, integration_id, tenant_id, user_id,
        vertical, sub_vertical, request_type, model,
        input_tokens, output_tokens, total_tokens, cost_cents,
        response_time_ms, success, error_code, error_message,
        quality_score, accuracy_score, user_feedback,
        request_summary, response_summary, metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
      )
      RETURNING id
    `, [
      input.provider,
      input.operation,
      input.integrationId || null,
      input.tenantId || null,
      input.userId || null,
      input.vertical || null,
      input.subVertical || null,
      input.requestType || null,
      input.model || null,
      input.inputTokens || 0,
      input.outputTokens || 0,
      totalTokens,
      input.costCents || 0,
      input.responseTimeMs || null,
      input.success !== false, // Default to true
      input.errorCode || null,
      input.errorMessage || null,
      input.qualityScore || null,
      input.accuracyScore || null,
      input.userFeedback || null,
      input.requestSummary || null,
      input.responseSummary || null,
      JSON.stringify(input.metadata || {}),
    ]);

    return result.id;
  } catch (error) {
    console.error('[SIVA Metrics] Failed to log metric:', error);
    return null;
  }
}

/**
 * Helper to calculate cost in cents for OpenAI calls
 * GPT-4o: $5/1M input, $15/1M output
 * GPT-4o-mini: $0.15/1M input, $0.60/1M output
 */
export function calculateOpenAICost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 5, output: 15 },           // $ per 1M tokens
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4-turbo': { input: 10, output: 30 },
    'gpt-4': { input: 30, output: 60 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
  };

  const rates = pricing[model] || pricing['gpt-4o-mini'];
  const inputCost = (inputTokens / 1_000_000) * rates.input;
  const outputCost = (outputTokens / 1_000_000) * rates.output;

  // Return cost in cents
  return Math.round((inputCost + outputCost) * 100);
}

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

/**
 * Get daily statistics for a date range
 */
export async function getDailyStats(days: number = 30): Promise<SivaDailyStats[]> {
  try {
    const rows = await query<{
      date: Date;
      provider: SivaProvider;
      total_calls: string;
      successful_calls: string;
      failed_calls: string;
      total_input_tokens: string;
      total_output_tokens: string;
      total_cost_cents: string;
      avg_response_time_ms: string;
      p95_response_time_ms: string;
      avg_quality_score: string | null;
      avg_accuracy_score: string | null;
      avg_user_feedback: string | null;
    }>(`
      SELECT * FROM siva_daily_stats
      WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY date DESC, provider
    `);

    return rows.map(row => ({
      date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date),
      provider: row.provider,
      totalCalls: parseInt(row.total_calls) || 0,
      successfulCalls: parseInt(row.successful_calls) || 0,
      failedCalls: parseInt(row.failed_calls) || 0,
      totalInputTokens: parseInt(row.total_input_tokens) || 0,
      totalOutputTokens: parseInt(row.total_output_tokens) || 0,
      totalCostCents: parseInt(row.total_cost_cents) || 0,
      avgResponseTimeMs: parseFloat(row.avg_response_time_ms) || 0,
      p95ResponseTimeMs: parseFloat(row.p95_response_time_ms) || 0,
      avgQualityScore: row.avg_quality_score ? parseFloat(row.avg_quality_score) : null,
      avgAccuracyScore: row.avg_accuracy_score ? parseFloat(row.avg_accuracy_score) : null,
      avgUserFeedback: row.avg_user_feedback ? parseFloat(row.avg_user_feedback) : null,
    }));
  } catch (error) {
    console.log('[SIVA Metrics] Daily stats query failed, table may not exist:', error);
    return [];
  }
}

/**
 * Get aggregated health metrics for the SIVA dashboard
 */
export async function getSivaHealthMetrics(days: number = 30): Promise<SivaHealthMetrics> {
  try {
    // Get daily stats
    const dailyStats = await getDailyStats(days);

    // Get today's stats
    const todayStats = await queryOne<{
      total_calls: string;
      successful_calls: string;
      failed_calls: string;
      total_input_tokens: string;
      total_output_tokens: string;
      total_cost_cents: string;
      avg_response_time_ms: string;
      p95_response_time_ms: string;
      avg_quality_score: string | null;
      avg_accuracy_score: string | null;
      avg_user_feedback: string | null;
    }>(`
      SELECT
        COUNT(*) as total_calls,
        COUNT(*) FILTER (WHERE success = true) as successful_calls,
        COUNT(*) FILTER (WHERE success = false) as failed_calls,
        COALESCE(SUM(input_tokens), 0) as total_input_tokens,
        COALESCE(SUM(output_tokens), 0) as total_output_tokens,
        COALESCE(SUM(cost_cents), 0) as total_cost_cents,
        COALESCE(AVG(response_time_ms), 0) as avg_response_time_ms,
        COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms), 0) as p95_response_time_ms,
        AVG(quality_score) FILTER (WHERE quality_score IS NOT NULL) as avg_quality_score,
        AVG(accuracy_score) FILTER (WHERE accuracy_score IS NOT NULL) as avg_accuracy_score,
        AVG(user_feedback) FILTER (WHERE user_feedback IS NOT NULL) as avg_user_feedback
      FROM siva_metrics
      WHERE DATE(created_at) = CURRENT_DATE
    `);

    // Get this week's cost
    const weekStats = await queryOne<{ total_cost_cents: string }>(`
      SELECT COALESCE(SUM(cost_cents), 0) as total_cost_cents
      FROM siva_metrics
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    `);

    // Get this month's cost
    const monthStats = await queryOne<{ total_cost_cents: string }>(`
      SELECT COALESCE(SUM(cost_cents), 0) as total_cost_cents
      FROM siva_metrics
      WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `);

    // Get costs by provider this month
    const providerCosts = await query<{ provider: SivaProvider; total_cost_cents: string }>(`
      SELECT provider, COALESCE(SUM(cost_cents), 0) as total_cost_cents
      FROM siva_metrics
      WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY provider
    `);

    // Calculate health score (weighted average of success rate, quality, and response time)
    const successRate = todayStats
      ? (parseInt(todayStats.successful_calls) / Math.max(1, parseInt(todayStats.total_calls))) * 100
      : 100;
    const qualityScore = todayStats?.avg_quality_score ? parseFloat(todayStats.avg_quality_score) : 80;
    const responseTimeScore = todayStats
      ? Math.max(0, 100 - (parseFloat(todayStats.avg_response_time_ms) / 50)) // Penalize slow responses
      : 80;

    const healthScore = Math.round(
      successRate * 0.4 +
      qualityScore * 0.4 +
      responseTimeScore * 0.2
    );

    // Calculate trend by comparing last 7 days to previous 7 days
    const recentDays = dailyStats.slice(0, 7);
    const previousDays = dailyStats.slice(7, 14);

    const recentAvgQuality = recentDays.length > 0
      ? recentDays.reduce((sum, d) => sum + (d.avgQualityScore || 80), 0) / recentDays.length
      : 80;
    const previousAvgQuality = previousDays.length > 0
      ? previousDays.reduce((sum, d) => sum + (d.avgQualityScore || 80), 0) / previousDays.length
      : 80;

    const trendPercent = previousAvgQuality > 0
      ? ((recentAvgQuality - previousAvgQuality) / previousAvgQuality) * 100
      : 0;

    const trend: 'improving' | 'stable' | 'declining' =
      trendPercent > 2 ? 'improving' :
      trendPercent < -2 ? 'declining' : 'stable';

    // Build history arrays by aggregating daily stats
    const qualityHistory: Array<{ date: string; value: number }> = [];
    const accuracyHistory: Array<{ date: string; value: number }> = [];
    const responseTimeHistory: Array<{ date: string; value: number }> = [];
    const tokenHistory: Array<{ date: string; input: number; output: number }> = [];
    const costHistory: Array<{ date: string; amount: number }> = [];

    // Group by date and aggregate
    const dateMap = new Map<string, SivaDailyStats[]>();
    dailyStats.forEach(stat => {
      const existing = dateMap.get(stat.date) || [];
      existing.push(stat);
      dateMap.set(stat.date, existing);
    });

    Array.from(dateMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-30)
      .forEach(([date, stats]) => {
        const totalCalls = stats.reduce((sum, s) => sum + s.totalCalls, 0);
        const avgQuality = stats.reduce((sum, s) => sum + (s.avgQualityScore || 80) * s.totalCalls, 0) / Math.max(1, totalCalls);
        const avgAccuracy = stats.reduce((sum, s) => sum + (s.avgAccuracyScore || 85) * s.totalCalls, 0) / Math.max(1, totalCalls);
        const avgResponseTime = stats.reduce((sum, s) => sum + s.avgResponseTimeMs * s.totalCalls, 0) / Math.max(1, totalCalls);
        const totalInput = stats.reduce((sum, s) => sum + s.totalInputTokens, 0);
        const totalOutput = stats.reduce((sum, s) => sum + s.totalOutputTokens, 0);
        const totalCost = stats.reduce((sum, s) => sum + s.totalCostCents, 0) / 100; // Convert to dollars

        qualityHistory.push({ date, value: avgQuality });
        accuracyHistory.push({ date, value: avgAccuracy });
        responseTimeHistory.push({ date, value: avgResponseTime });
        tokenHistory.push({ date, input: totalInput, output: totalOutput });
        costHistory.push({ date, amount: totalCost });
      });

    // Fill in missing days with defaults for consistent chart display
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      if (!qualityHistory.find(h => h.date === dateStr)) {
        qualityHistory.push({ date: dateStr, value: 80 });
        accuracyHistory.push({ date: dateStr, value: 85 });
        responseTimeHistory.push({ date: dateStr, value: 2000 });
        tokenHistory.push({ date: dateStr, input: 0, output: 0 });
        costHistory.push({ date: dateStr, amount: 0 });
      }
    }

    // Sort histories by date
    qualityHistory.sort((a, b) => a.date.localeCompare(b.date));
    accuracyHistory.sort((a, b) => a.date.localeCompare(b.date));
    responseTimeHistory.sort((a, b) => a.date.localeCompare(b.date));
    tokenHistory.sort((a, b) => a.date.localeCompare(b.date));
    costHistory.sort((a, b) => a.date.localeCompare(b.date));

    // Build provider costs object
    const providerCostMap: Record<string, number> = {};
    providerCosts.forEach(pc => {
      providerCostMap[pc.provider] = parseInt(pc.total_cost_cents) / 100;
    });

    return {
      overall: {
        healthScore: Math.min(100, Math.max(0, healthScore)),
        trend,
        trendPercent: Math.round(trendPercent * 10) / 10,
      },
      quality: {
        current: qualityHistory.length > 0 ? qualityHistory[qualityHistory.length - 1].value : 80,
        previous: qualityHistory.length > 1 ? qualityHistory[qualityHistory.length - 2].value : 80,
        history: qualityHistory,
      },
      accuracy: {
        current: accuracyHistory.length > 0 ? accuracyHistory[accuracyHistory.length - 1].value : 85,
        previous: accuracyHistory.length > 1 ? accuracyHistory[accuracyHistory.length - 2].value : 85,
        history: accuracyHistory,
      },
      responseTime: {
        avgMs: todayStats ? parseFloat(todayStats.avg_response_time_ms) : 2000,
        p95Ms: todayStats ? parseFloat(todayStats.p95_response_time_ms) : 3500,
        history: responseTimeHistory,
      },
      tokens: {
        todayInput: todayStats ? parseInt(todayStats.total_input_tokens) : 0,
        todayOutput: todayStats ? parseInt(todayStats.total_output_tokens) : 0,
        efficiency: todayStats && parseInt(todayStats.total_input_tokens) > 0
          ? parseInt(todayStats.total_output_tokens) / parseInt(todayStats.total_input_tokens)
          : 0.4,
        history: tokenHistory,
      },
      costs: {
        today: todayStats ? parseInt(todayStats.total_cost_cents) / 100 : 0,
        thisWeek: weekStats ? parseInt(weekStats.total_cost_cents) / 100 : 0,
        thisMonth: monthStats ? parseInt(monthStats.total_cost_cents) / 100 : 0,
        byProvider: {
          openai: providerCostMap['openai'] || 0,
          apollo: providerCostMap['apollo'] || 0,
          serp: providerCostMap['serp'] || 0,
        },
        history: costHistory,
      },
      interactions: {
        today: todayStats ? parseInt(todayStats.total_calls) : 0,
        successful: todayStats ? parseInt(todayStats.successful_calls) : 0,
        failed: todayStats ? parseInt(todayStats.failed_calls) : 0,
        avgSatisfaction: todayStats?.avg_user_feedback ? parseFloat(todayStats.avg_user_feedback) : 4.0,
      },
    };
  } catch (error) {
    console.error('[SIVA Metrics] Failed to get health metrics:', error);

    // Return default values if database query fails
    const defaultHistory = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return { date: date.toISOString().split('T')[0], value: 80 };
    });

    return {
      overall: { healthScore: 80, trend: 'stable', trendPercent: 0 },
      quality: { current: 80, previous: 80, history: defaultHistory },
      accuracy: { current: 85, previous: 85, history: defaultHistory },
      responseTime: { avgMs: 2000, p95Ms: 3500, history: defaultHistory },
      tokens: {
        todayInput: 0,
        todayOutput: 0,
        efficiency: 0.4,
        history: defaultHistory.map(h => ({ date: h.date, input: 0, output: 0 })),
      },
      costs: {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        byProvider: { openai: 0, apollo: 0, serp: 0 },
        history: defaultHistory.map(h => ({ date: h.date, amount: 0 })),
      },
      interactions: { today: 0, successful: 0, failed: 0, avgSatisfaction: 4.0 },
    };
  }
}
