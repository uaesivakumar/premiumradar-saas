/**
 * AI Usage Tracking Module
 *
 * Track AI model usage, token consumption, and costs.
 */

import { create } from 'zustand';
import type {
  AIUsageEvent,
  AIUsageSummary,
  TokenInference,
  AIModel,
  AIFeature,
  DateRange,
} from './types';

// ============================================================
// AI USAGE STORE
// ============================================================

interface AIUsageState {
  events: AIUsageEvent[];
  summaries: Map<AIFeature, AIUsageSummary>;
  tokenInferences: Map<AIFeature, TokenInference>;
  dateRange: DateRange;
  loading: boolean;
  error: string | null;
}

interface AIUsageStore extends AIUsageState {
  // Event tracking
  trackEvent: (event: Omit<AIUsageEvent, 'id' | 'timestamp'>) => void;
  loadEvents: (events: AIUsageEvent[]) => void;
  clearEvents: () => void;

  // Analysis
  calculateSummaries: () => void;
  calculateTokenInferences: () => void;

  // Filters
  setDateRange: (range: DateRange) => void;
  getEventsByFeature: (feature: AIFeature) => AIUsageEvent[];
  getEventsByModel: (model: AIModel) => AIUsageEvent[];

  // Loading state
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAIUsageStore = create<AIUsageStore>((set, get) => ({
  events: [],
  summaries: new Map(),
  tokenInferences: new Map(),
  dateRange: '30d',
  loading: false,
  error: null,

  trackEvent: (event) => {
    const newEvent: AIUsageEvent = {
      ...event,
      id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    set((state) => ({
      events: [...state.events, newEvent],
    }));

    // Recalculate summaries
    get().calculateSummaries();
  },

  loadEvents: (events) => {
    set({ events, loading: false });
    get().calculateSummaries();
    get().calculateTokenInferences();
  },

  clearEvents: () => {
    set({ events: [], summaries: new Map(), tokenInferences: new Map() });
  },

  calculateSummaries: () => {
    const { events } = get();
    const summaries = new Map<AIFeature, AIUsageSummary>();

    // Group events by feature
    const byFeature = new Map<AIFeature, AIUsageEvent[]>();
    events.forEach((event) => {
      if (!byFeature.has(event.feature)) {
        byFeature.set(event.feature, []);
      }
      byFeature.get(event.feature)!.push(event);
    });

    // Calculate summary for each feature
    byFeature.forEach((featureEvents, feature) => {
      const totalCalls = featureEvents.length;
      const totalTokens = featureEvents.reduce((sum, e) => sum + e.totalTokens, 0);
      const totalCost = featureEvents.reduce((sum, e) => sum + e.cost, 0);
      const totalLatency = featureEvents.reduce((sum, e) => sum + e.latencyMs, 0);
      const cachedCalls = featureEvents.filter((e) => e.cached).length;
      const errorCalls = featureEvents.filter((e) => !e.success).length;

      const tokensByModel: Record<AIModel, number> = {
        'gpt-4': 0,
        'gpt-4-turbo': 0,
        'gpt-3.5-turbo': 0,
        'claude-3-opus': 0,
        'claude-3-sonnet': 0,
        'claude-3-haiku': 0,
      };

      featureEvents.forEach((e) => {
        tokensByModel[e.model] += e.totalTokens;
      });

      summaries.set(feature, {
        feature,
        totalCalls,
        totalTokens,
        totalCost,
        averageLatency: totalCalls > 0 ? totalLatency / totalCalls : 0,
        cacheHitRate: totalCalls > 0 ? (cachedCalls / totalCalls) * 100 : 0,
        errorRate: totalCalls > 0 ? (errorCalls / totalCalls) * 100 : 0,
        tokensByModel,
      });
    });

    set({ summaries });
  },

  calculateTokenInferences: () => {
    const { events } = get();
    const tokenInferences = new Map<AIFeature, TokenInference>();

    // Group events by feature
    const byFeature = new Map<AIFeature, AIUsageEvent[]>();
    events.forEach((event) => {
      if (!byFeature.has(event.feature)) {
        byFeature.set(event.feature, []);
      }
      byFeature.get(event.feature)!.push(event);
    });

    // Calculate token inferences for each feature
    byFeature.forEach((featureEvents, feature) => {
      const inputTokens = featureEvents.map((e) => e.inputTokens).sort((a, b) => a - b);
      const outputTokens = featureEvents.map((e) => e.outputTokens).sort((a, b) => a - b);
      const totalTokens = featureEvents.map((e) => e.totalTokens).sort((a, b) => a - b);

      const avgInput = inputTokens.reduce((a, b) => a + b, 0) / inputTokens.length;
      const avgOutput = outputTokens.reduce((a, b) => a + b, 0) / outputTokens.length;

      const p50 = totalTokens[Math.floor(totalTokens.length * 0.5)] || 0;
      const p90 = totalTokens[Math.floor(totalTokens.length * 0.9)] || 0;
      const p99 = totalTokens[Math.floor(totalTokens.length * 0.99)] || 0;

      // Calculate trend (compare recent vs older events)
      const midpoint = Math.floor(featureEvents.length / 2);
      const olderAvg = featureEvents.slice(0, midpoint).reduce((sum, e) => sum + e.totalTokens, 0) / midpoint || 0;
      const recentAvg = featureEvents.slice(midpoint).reduce((sum, e) => sum + e.totalTokens, 0) / (featureEvents.length - midpoint) || 0;

      const diff = recentAvg - olderAvg;
      const trend: 'up' | 'down' | 'stable' =
        diff > olderAvg * 0.1 ? 'up' : diff < -olderAvg * 0.1 ? 'down' : 'stable';

      tokenInferences.set(feature, {
        feature,
        averageInputTokens: Math.round(avgInput),
        averageOutputTokens: Math.round(avgOutput),
        p50Tokens: p50,
        p90Tokens: p90,
        p99Tokens: p99,
        trend,
      });
    });

    set({ tokenInferences });
  },

  setDateRange: (dateRange) => set({ dateRange }),

  getEventsByFeature: (feature) => {
    return get().events.filter((e) => e.feature === feature);
  },

  getEventsByModel: (model) => {
    return get().events.filter((e) => e.model === model);
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

// ============================================================
// AI USAGE HELPERS
// ============================================================

/**
 * Model pricing per 1K tokens (approximate)
 */
export const MODEL_PRICING: Record<AIModel, { input: number; output: number }> = {
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'claude-3-opus': { input: 0.015, output: 0.075 },
  'claude-3-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-haiku': { input: 0.00025, output: 0.00125 },
};

/**
 * Calculate cost for token usage
 */
export function calculateCost(
  model: AIModel,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model];
  const inputCost = (inputTokens / 1000) * pricing.input;
  const outputCost = (outputTokens / 1000) * pricing.output;
  return Math.round((inputCost + outputCost) * 10000) / 10000;
}

/**
 * Get feature display info
 */
export function getFeatureInfo(feature: AIFeature): {
  label: string;
  icon: string;
  color: string;
  description: string;
} {
  const info: Record<AIFeature, { label: string; icon: string; color: string; description: string }> = {
    valuation: {
      label: 'Valuation',
      icon: '💰',
      color: 'green',
      description: 'AI-powered domain value estimation',
    },
    comparison: {
      label: 'Comparison',
      icon: '⚖️',
      color: 'blue',
      description: 'Compare multiple domains side-by-side',
    },
    outreach: {
      label: 'Outreach',
      icon: '📤',
      color: 'purple',
      description: 'Generate personalized outreach messages',
    },
    analysis: {
      label: 'Analysis',
      icon: '📊',
      color: 'orange',
      description: 'Deep-dive domain analysis reports',
    },
    naming: {
      label: 'Naming',
      icon: '✨',
      color: 'pink',
      description: 'AI-generated domain name suggestions',
    },
    chat: {
      label: 'Chat',
      icon: '💬',
      color: 'cyan',
      description: 'Interactive domain assistant',
    },
  };
  return info[feature];
}

/**
 * Get model display info
 */
export function getModelInfo(model: AIModel): {
  label: string;
  provider: 'OpenAI' | 'Anthropic';
  tier: 'budget' | 'standard' | 'premium';
} {
  const info: Record<AIModel, { label: string; provider: 'OpenAI' | 'Anthropic'; tier: 'budget' | 'standard' | 'premium' }> = {
    'gpt-4': { label: 'GPT-4', provider: 'OpenAI', tier: 'premium' },
    'gpt-4-turbo': { label: 'GPT-4 Turbo', provider: 'OpenAI', tier: 'standard' },
    'gpt-3.5-turbo': { label: 'GPT-3.5 Turbo', provider: 'OpenAI', tier: 'budget' },
    'claude-3-opus': { label: 'Claude 3 Opus', provider: 'Anthropic', tier: 'premium' },
    'claude-3-sonnet': { label: 'Claude 3 Sonnet', provider: 'Anthropic', tier: 'standard' },
    'claude-3-haiku': { label: 'Claude 3 Haiku', provider: 'Anthropic', tier: 'budget' },
  };
  return info[model];
}

/**
 * Get usage trend analysis
 */
export function analyzeUsageTrend(
  events: AIUsageEvent[],
  metric: 'tokens' | 'cost' | 'calls'
): {
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  projection: number;
} {
  if (events.length < 10) {
    return { trend: 'stable', changePercent: 0, projection: 0 };
  }

  // Sort by timestamp
  const sorted = [...events].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const midpoint = Math.floor(sorted.length / 2);

  const getValue = (e: AIUsageEvent): number => {
    switch (metric) {
      case 'tokens':
        return e.totalTokens;
      case 'cost':
        return e.cost;
      case 'calls':
        return 1;
    }
  };

  const olderSum = sorted.slice(0, midpoint).reduce((sum, e) => sum + getValue(e), 0);
  const recentSum = sorted.slice(midpoint).reduce((sum, e) => sum + getValue(e), 0);

  const changePercent = olderSum > 0
    ? ((recentSum - olderSum) / olderSum) * 100
    : 0;

  const trend: 'up' | 'down' | 'stable' =
    changePercent > 10 ? 'up' : changePercent < -10 ? 'down' : 'stable';

  // Project next period based on recent trend
  const projection = recentSum * (1 + changePercent / 100);

  return {
    trend,
    changePercent: Math.round(changePercent * 10) / 10,
    projection: Math.round(projection),
  };
}

/**
 * Get cost breakdown by model
 */
export function getCostBreakdown(summaries: Map<AIFeature, AIUsageSummary>): {
  byFeature: Record<string, number>;
  byModel: Record<string, number>;
  total: number;
} {
  const byFeature: Record<string, number> = {};
  const byModel: Record<string, number> = {};
  let total = 0;

  summaries.forEach((summary, feature) => {
    byFeature[feature] = summary.totalCost;
    total += summary.totalCost;

    Object.entries(summary.tokensByModel).forEach(([model, tokens]) => {
      const modelInfo = MODEL_PRICING[model as AIModel];
      // Rough estimate assuming 50/50 input/output split
      const cost = (tokens / 1000) * ((modelInfo.input + modelInfo.output) / 2);
      byModel[model] = (byModel[model] || 0) + cost;
    });
  });

  return { byFeature, byModel, total };
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) return `$${(cost * 100).toFixed(2)}¢`;
  if (cost < 1) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(2)}`;
}

/**
 * Format token count for display
 */
export function formatTokens(tokens: number): string {
  if (tokens < 1000) return tokens.toString();
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${(tokens / 1000000).toFixed(2)}M`;
}

/**
 * Get latency rating
 */
export function getLatencyRating(ms: number): {
  label: string;
  color: string;
} {
  if (ms < 500) return { label: 'Excellent', color: 'green' };
  if (ms < 1000) return { label: 'Good', color: 'blue' };
  if (ms < 2000) return { label: 'Fair', color: 'yellow' };
  if (ms < 5000) return { label: 'Slow', color: 'orange' };
  return { label: 'Very Slow', color: 'red' };
}

/**
 * Export AI usage to CSV
 */
export function exportAIUsageToCSV(events: AIUsageEvent[]): string {
  const headers = [
    'Timestamp',
    'Feature',
    'Model',
    'Input Tokens',
    'Output Tokens',
    'Total Tokens',
    'Latency (ms)',
    'Cost',
    'Cached',
    'Success',
  ];

  const rows = events.map((e) => [
    e.timestamp.toISOString(),
    e.feature,
    e.model,
    e.inputTokens.toString(),
    e.outputTokens.toString(),
    e.totalTokens.toString(),
    e.latencyMs.toString(),
    formatCost(e.cost),
    e.cached ? 'Yes' : 'No',
    e.success ? 'Yes' : 'No',
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
