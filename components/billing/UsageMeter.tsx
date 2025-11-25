/**
 * Usage Meter
 *
 * Display current usage vs limits with visual progress bars.
 */

'use client';

import type { UsageSummary, UsageMetric } from '@/lib/billing';

interface UsageMeterProps {
  usage: UsageSummary;
}

const METRIC_LABELS: Record<UsageMetric, { label: string; icon: string }> = {
  api_calls: { label: 'API Calls', icon: '🔌' },
  exports: { label: 'Exports', icon: '📤' },
  searches: { label: 'Searches', icon: '🔍' },
  outreach_sent: { label: 'Outreach', icon: '📧' },
  storage_mb: { label: 'Storage', icon: '💾' },
};

export function UsageMeter({ usage }: UsageMeterProps) {
  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatValue = (metric: UsageMetric, value: number): string => {
    if (metric === 'storage_mb') {
      if (value >= 1000) return `${(value / 1000).toFixed(1)} GB`;
      return `${value} MB`;
    }
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const metrics = Object.entries(usage.metrics) as [UsageMetric, number][];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Usage This Period</h3>
        <span className="text-sm text-gray-500">
          {new Date(usage.period.start).toLocaleDateString()} -{' '}
          {new Date(usage.period.end).toLocaleDateString()}
        </span>
      </div>

      <div className="space-y-4">
        {metrics.map(([metric, value]) => {
          const limit = usage.limits[metric];
          const percentage = limit > 0 ? Math.min(100, Math.round((value / limit) * 100)) : 0;
          const info = METRIC_LABELS[metric];

          return (
            <div key={metric}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span>{info.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{info.label}</span>
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-medium text-gray-900">{formatValue(metric, value)}</span>
                  <span className="mx-1">/</span>
                  <span>{formatValue(metric, limit)}</span>
                </div>
              </div>

              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${getProgressColor(
                    percentage
                  )}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {percentage >= 80 && (
                <p className="text-xs text-amber-600 mt-1">
                  {percentage >= 100
                    ? 'Limit reached - upgrade for more'
                    : `${100 - percentage}% remaining`}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
