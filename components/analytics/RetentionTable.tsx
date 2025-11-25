/**
 * Retention Table Component
 *
 * Cohort retention analysis visualization.
 */

'use client';

import {
  useRetentionStore,
  getRetentionColor,
  formatPeriodLabel,
  getRetentionSummary,
  type RetentionData,
} from '@/lib/analytics';

interface RetentionTableProps {
  data: RetentionData;
  colorScale?: 'green' | 'blue' | 'purple';
  showPercentages?: boolean;
}

export function RetentionTable({
  data,
  colorScale = 'green',
  showPercentages = true,
}: RetentionTableProps) {
  const summary = getRetentionSummary(data);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Retention Analysis</h3>
            <p className="text-sm text-gray-500">
              {data.cohorts.length} cohorts over {data.periods} {data.periodType}s
            </p>
          </div>
          <div className="flex items-center gap-4">
            <SummaryBadge
              label="Avg Retention"
              value={`${summary.day1Retention.toFixed(1)}%`}
            />
            <SummaryBadge
              label="Trend"
              value={summary.trend}
              trend={summary.trend}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Cohort
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Users
              </th>
              {Array.from({ length: data.periods + 1 }, (_, i) => (
                <th
                  key={i}
                  className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase"
                >
                  {formatPeriodLabel(i, data.periodType)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.cohorts.map((cohort, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900 font-medium whitespace-nowrap">
                  {cohort.label ||
                    cohort.cohortDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 text-center">
                  {cohort.cohortSize.toLocaleString()}
                </td>
                {cohort.retentionByPeriod.map((retention, colIndex) => (
                  <td key={colIndex} className="px-1 py-1">
                    <div
                      className={`px-2 py-2 text-center text-sm font-medium rounded ${getRetentionColor(
                        retention,
                        colorScale
                      )}`}
                    >
                      {showPercentages ? `${retention.toFixed(0)}%` : retention.toFixed(0)}
                    </div>
                  </td>
                ))}
                {/* Fill empty cells */}
                {Array.from(
                  { length: data.periods + 1 - cohort.retentionByPeriod.length },
                  (_, i) => (
                    <td key={`empty-${i}`} className="px-1 py-1">
                      <div className="px-2 py-2 text-center text-sm text-gray-300">-</div>
                    </td>
                  )
                )}
              </tr>
            ))}

            {/* Average row */}
            <tr className="bg-gray-50 font-medium">
              <td className="px-4 py-3 text-sm text-gray-700">Average</td>
              <td className="px-4 py-3 text-sm text-gray-600 text-center">
                {Math.round(
                  data.cohorts.reduce((sum, c) => sum + c.cohortSize, 0) /
                    data.cohorts.length
                ).toLocaleString()}
              </td>
              {data.averageRetention.map((retention, i) => (
                <td key={i} className="px-1 py-1">
                  <div
                    className={`px-2 py-2 text-center text-sm font-medium rounded ${getRetentionColor(
                      retention,
                      colorScale
                    )}`}
                  >
                    {showPercentages ? `${retention.toFixed(1)}%` : retention.toFixed(1)}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Color scale legend */}
      <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Low</span>
          <div className="flex">
            {[10, 30, 50, 70, 90].map((level) => (
              <div
                key={level}
                className={`w-6 h-4 ${getRetentionColor(level, colorScale).split(' ')[0]}`}
              />
            ))}
          </div>
          <span>High</span>
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-700">
          Export CSV
        </button>
      </div>
    </div>
  );
}

function SummaryBadge({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend?: 'improving' | 'declining' | 'stable';
}) {
  const trendColors = {
    improving: 'text-green-600 bg-green-50',
    declining: 'text-red-600 bg-red-50',
    stable: 'text-gray-600 bg-gray-50',
  };

  const trendIcons = {
    improving: '↑',
    declining: '↓',
    stable: '→',
  };

  return (
    <div className="text-center">
      <div className="text-xs text-gray-500 uppercase">{label}</div>
      <div
        className={`mt-1 px-2 py-1 rounded text-sm font-medium ${
          trend ? trendColors[trend] : 'text-gray-900'
        }`}
      >
        {trend && <span className="mr-1">{trendIcons[trend]}</span>}
        {value}
      </div>
    </div>
  );
}

// Compact retention card for dashboards
export function RetentionCard({ data }: { data: RetentionData }) {
  const summary = getRetentionSummary(data);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Retention</h3>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            summary.trend === 'improving'
              ? 'bg-green-100 text-green-700'
              : summary.trend === 'declining'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-700'
          }`}
        >
          {summary.trend === 'improving'
            ? '↑ Improving'
            : summary.trend === 'declining'
              ? '↓ Declining'
              : '→ Stable'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {summary.day1Retention.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500">Day 1</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {summary.day7Retention.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500">Day 7</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {summary.day30Retention.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500">Day 30</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Avg Cohort Size</span>
          <span className="font-medium text-gray-900">
            {summary.avgCohortSize.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
