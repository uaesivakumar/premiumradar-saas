/**
 * AI Usage Dashboard Component
 *
 * Track AI model usage, tokens, and costs.
 */

'use client';

import {
  useAIUsageStore,
  getFeatureInfo,
  getModelInfo,
  formatCost,
  formatTokens,
  getLatencyRating,
  getCostBreakdown,
  type AIUsageSummary,
  type AIFeature,
  type AIModel,
} from '@/lib/analytics';

interface AIUsageDashboardProps {
  summaries: Map<AIFeature, AIUsageSummary>;
  dateRange?: string;
}

export function AIUsageDashboard({ summaries, dateRange = '30d' }: AIUsageDashboardProps) {
  const costBreakdown = getCostBreakdown(summaries);
  const summaryArray = Array.from(summaries.values());

  // Calculate totals
  const totals = summaryArray.reduce(
    (acc, s) => ({
      calls: acc.calls + s.totalCalls,
      tokens: acc.tokens + s.totalTokens,
      cost: acc.cost + s.totalCost,
      latency: acc.latency + s.averageLatency * s.totalCalls,
    }),
    { calls: 0, tokens: 0, cost: 0, latency: 0 }
  );

  const avgLatency = totals.calls > 0 ? totals.latency / totals.calls : 0;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard
          label="Total Calls"
          value={totals.calls.toLocaleString()}
          icon="📊"
        />
        <SummaryCard
          label="Total Tokens"
          value={formatTokens(totals.tokens)}
          icon="🔢"
        />
        <SummaryCard
          label="Total Cost"
          value={formatCost(totals.cost)}
          icon="💰"
        />
        <SummaryCard
          label="Avg Latency"
          value={`${avgLatency.toFixed(0)}ms`}
          icon="⚡"
          badge={getLatencyRating(avgLatency)}
        />
      </div>

      {/* Usage by feature */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Usage by Feature</h3>
          <p className="text-sm text-gray-500">AI calls breakdown by feature</p>
        </div>

        <div className="divide-y divide-gray-100">
          {summaryArray.map((summary) => {
            const info = getFeatureInfo(summary.feature);
            const percentage = totals.calls > 0
              ? (summary.totalCalls / totals.calls) * 100
              : 0;

            return (
              <div
                key={summary.feature}
                className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50"
              >
                {/* Feature info */}
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  {info.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{info.label}</div>
                  <div className="text-sm text-gray-500">{info.description}</div>
                </div>

                {/* Metrics */}
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {summary.totalCalls.toLocaleString()} calls
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTokens(summary.totalTokens)} tokens
                  </div>
                </div>

                {/* Cost */}
                <div className="w-24 text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCost(summary.totalCost)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {percentage.toFixed(1)}%
                  </div>
                </div>

                {/* Bar */}
                <div className="w-32">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-${info.color}-500 rounded-full`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Usage by model */}
      <div className="grid grid-cols-2 gap-6">
        <ModelBreakdown summaries={summaryArray} />
        <PerformanceMetrics summaries={summaryArray} />
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  badge,
}: {
  label: string;
  value: string;
  icon: string;
  badge?: { label: string; color: string };
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        {badge && (
          <span
            className={`text-xs px-2 py-1 rounded-full bg-${badge.color}-100 text-${badge.color}-700`}
          >
            {badge.label}
          </span>
        )}
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  );
}

function ModelBreakdown({ summaries }: { summaries: AIUsageSummary[] }) {
  // Aggregate tokens by model
  const modelTotals: Record<AIModel, number> = {
    'gpt-4': 0,
    'gpt-4-turbo': 0,
    'gpt-3.5-turbo': 0,
    'claude-3-opus': 0,
    'claude-3-sonnet': 0,
    'claude-3-haiku': 0,
  };

  summaries.forEach((s) => {
    Object.entries(s.tokensByModel).forEach(([model, tokens]) => {
      modelTotals[model as AIModel] += tokens;
    });
  });

  const totalTokens = Object.values(modelTotals).reduce((a, b) => a + b, 0);
  const sortedModels = Object.entries(modelTotals)
    .filter(([, tokens]) => tokens > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Token Usage by Model</h3>
      </div>

      <div className="p-6 space-y-4">
        {sortedModels.map(([model, tokens]) => {
          const info = getModelInfo(model as AIModel);
          const percentage = totalTokens > 0 ? (tokens / totalTokens) * 100 : 0;

          return (
            <div key={model}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      info.provider === 'OpenAI'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {info.provider}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {info.label}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {formatTokens(tokens)} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    info.provider === 'OpenAI' ? 'bg-green-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}

        {sortedModels.length === 0 && (
          <p className="text-center text-gray-500">No AI usage data</p>
        )}
      </div>
    </div>
  );
}

function PerformanceMetrics({ summaries }: { summaries: AIUsageSummary[] }) {
  // Calculate average metrics
  const totalCalls = summaries.reduce((sum, s) => sum + s.totalCalls, 0);

  const avgCacheHitRate = totalCalls > 0
    ? summaries.reduce((sum, s) => sum + s.cacheHitRate * s.totalCalls, 0) / totalCalls
    : 0;

  const avgErrorRate = totalCalls > 0
    ? summaries.reduce((sum, s) => sum + s.errorRate * s.totalCalls, 0) / totalCalls
    : 0;

  const avgLatency = totalCalls > 0
    ? summaries.reduce((sum, s) => sum + s.averageLatency * s.totalCalls, 0) / totalCalls
    : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Performance Metrics</h3>
      </div>

      <div className="p-6 space-y-6">
        {/* Cache hit rate */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Cache Hit Rate</span>
            <span
              className={`text-sm font-medium ${
                avgCacheHitRate >= 50
                  ? 'text-green-600'
                  : avgCacheHitRate >= 25
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}
            >
              {avgCacheHitRate.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                avgCacheHitRate >= 50
                  ? 'bg-green-500'
                  : avgCacheHitRate >= 25
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${avgCacheHitRate}%` }}
            />
          </div>
        </div>

        {/* Error rate */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Error Rate</span>
            <span
              className={`text-sm font-medium ${
                avgErrorRate <= 1
                  ? 'text-green-600'
                  : avgErrorRate <= 5
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}
            >
              {avgErrorRate.toFixed(2)}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                avgErrorRate <= 1
                  ? 'bg-green-500'
                  : avgErrorRate <= 5
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(avgErrorRate * 10, 100)}%` }}
            />
          </div>
        </div>

        {/* Average latency */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Average Latency</span>
            <span className="text-sm font-medium text-gray-900">
              {avgLatency.toFixed(0)}ms
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {(['Excellent', 'Good', 'Fair', 'Slow'] as const).map((rating) => {
              const latencyInfo = getLatencyRating(avgLatency);
              const isActive = latencyInfo.label === rating;
              return (
                <span
                  key={rating}
                  className={`px-2 py-1 rounded ${
                    isActive
                      ? `bg-${latencyInfo.color}-100 text-${latencyInfo.color}-700`
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {rating}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact AI usage card
export function AIUsageCard({
  summary,
}: {
  summary: AIUsageSummary;
}) {
  const info = getFeatureInfo(summary.feature);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl">
          {info.icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{info.label}</h3>
          <p className="text-sm text-gray-500">{summary.totalCalls} calls</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xl font-bold text-gray-900">
            {formatTokens(summary.totalTokens)}
          </div>
          <div className="text-xs text-gray-500">Tokens</div>
        </div>
        <div>
          <div className="text-xl font-bold text-gray-900">
            {formatCost(summary.totalCost)}
          </div>
          <div className="text-xs text-gray-500">Cost</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
        <span className="text-gray-500">
          {summary.averageLatency.toFixed(0)}ms avg
        </span>
        <span
          className={`${
            summary.errorRate < 1 ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {summary.errorRate.toFixed(1)}% errors
        </span>
      </div>
    </div>
  );
}
