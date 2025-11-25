/**
 * Funnel Chart Component
 *
 * Conversion funnel visualization.
 */

'use client';

import {
  getFunnelStepColor,
  getFunnelStepWidth,
  formatDuration,
  getFunnelSummary,
  type FunnelData,
  type FunnelStep,
} from '@/lib/analytics';

interface FunnelChartProps {
  data: FunnelData;
  showDropoff?: boolean;
  showAverageTime?: boolean;
}

export function FunnelChart({
  data,
  showDropoff = true,
  showAverageTime = true,
}: FunnelChartProps) {
  const summary = getFunnelSummary(data);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{data.name}</h3>
            <p className="text-sm text-gray-500">
              {data.totalUsers.toLocaleString()} users • {data.steps.length} steps
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {data.totalConversion.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">Total Conversion</div>
            </div>
          </div>
        </div>
      </div>

      {/* Funnel visualization */}
      <div className="p-6">
        <div className="space-y-3">
          {data.steps.map((step, index) => (
            <FunnelStepRow
              key={step.id}
              step={step}
              index={index}
              totalSteps={data.steps.length}
              width={getFunnelStepWidth(index, data.steps)}
              isFirst={index === 0}
              isLast={index === data.steps.length - 1}
              showDropoff={showDropoff}
              showAverageTime={showAverageTime}
            />
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-gray-500 uppercase">Avg Conversion</div>
            <div className="mt-1 text-lg font-semibold text-gray-900">
              {summary.averageConversion.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">Biggest Dropoff</div>
            <div className="mt-1 text-lg font-semibold text-red-600">
              {summary.biggestDropoff
                ? `${summary.biggestDropoff.step} (${summary.biggestDropoff.rate.toFixed(0)}%)`
                : 'None'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">Bottleneck</div>
            <div className="mt-1 text-lg font-semibold text-orange-600">
              {summary.bottleneck || 'None'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FunnelStepRow({
  step,
  index,
  totalSteps,
  width,
  isFirst,
  isLast,
  showDropoff,
  showAverageTime,
}: {
  step: FunnelStep;
  index: number;
  totalSteps: number;
  width: number;
  isFirst: boolean;
  isLast: boolean;
  showDropoff: boolean;
  showAverageTime: boolean;
}) {
  return (
    <div className="relative">
      {/* Step bar */}
      <div className="flex items-center gap-4">
        {/* Step number */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            isFirst
              ? 'bg-blue-100 text-blue-700'
              : isLast
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
          }`}
        >
          {index + 1}
        </div>

        {/* Funnel bar */}
        <div className="flex-1 relative">
          <div
            className={`h-12 rounded-lg transition-all duration-300 ${getFunnelStepColor(
              step.conversionRate
            )}`}
            style={{ width: `${width}%` }}
          >
            <div className="absolute inset-0 flex items-center justify-between px-4">
              <span className="text-white font-medium truncate">{step.name}</span>
              <span className="text-white text-sm">
                {step.count.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="w-32 text-right">
          <div className="text-sm font-medium text-gray-900">
            {step.conversionRate.toFixed(1)}%
          </div>
          {showAverageTime && step.averageTime && (
            <div className="text-xs text-gray-500">
              {formatDuration(step.averageTime)}
            </div>
          )}
        </div>
      </div>

      {/* Dropoff indicator */}
      {showDropoff && !isFirst && step.dropoffRate > 0 && (
        <div className="absolute left-12 -top-1 flex items-center gap-1">
          <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-red-400" />
          <span className="text-xs text-red-500 font-medium">
            -{step.dropoffRate.toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
}

// Compact funnel card for dashboards
export function FunnelCard({ data }: { data: FunnelData }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{data.name}</h3>
        <span className="text-sm text-gray-500">
          {data.totalUsers.toLocaleString()} users
        </span>
      </div>

      {/* Mini funnel */}
      <div className="space-y-2">
        {data.steps.map((step, index) => {
          const width = getFunnelStepWidth(index, data.steps);
          return (
            <div key={step.id} className="flex items-center gap-2">
              <div
                className={`h-6 rounded ${getFunnelStepColor(step.conversionRate)}`}
                style={{ width: `${width}%` }}
              />
              <span className="text-xs text-gray-500 w-12 text-right">
                {step.conversionRate.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-sm text-gray-500">Total Conversion</span>
        <span className="text-lg font-bold text-green-600">
          {data.totalConversion.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

// Horizontal funnel for compact views
export function HorizontalFunnel({ data }: { data: FunnelData }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">{data.name}</h3>

      <div className="flex items-stretch gap-1">
        {data.steps.map((step, index) => {
          const isLast = index === data.steps.length - 1;
          return (
            <div
              key={step.id}
              className="flex-1 relative group"
              style={{ minWidth: '80px' }}
            >
              {/* Step */}
              <div
                className={`h-16 flex items-center justify-center ${getFunnelStepColor(
                  step.conversionRate
                )} ${index === 0 ? 'rounded-l-lg' : ''} ${isLast ? 'rounded-r-lg' : ''}`}
              >
                <div className="text-center">
                  <div className="text-white text-xs font-medium truncate px-1">
                    {step.name}
                  </div>
                  <div className="text-white/80 text-xs">
                    {step.conversionRate.toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Arrow connector */}
              {!isLast && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                  <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200">
                    <span className="text-gray-400 text-xs">→</span>
                  </div>
                </div>
              )}

              {/* Hover tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                  {step.count.toLocaleString()} users
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-center">
        <span className="text-sm text-gray-500">Total: </span>
        <span className="text-sm font-bold text-green-600">
          {data.totalConversion.toFixed(1)}% conversion
        </span>
      </div>
    </div>
  );
}
