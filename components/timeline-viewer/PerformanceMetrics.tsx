/**
 * Performance Metrics Panel
 * Sprint S51: Timeline Viewer
 *
 * Step-by-step timing breakdown, bottleneck identification, and cost attribution.
 */
'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import type { TimelinePerformanceMetrics, StepPerformanceMetrics } from '@/lib/timeline-viewer';
import { formatDuration, formatCost, formatTokens } from '@/lib/timeline-viewer';

interface PerformanceMetricsPanelProps {
  metrics: TimelinePerformanceMetrics;
  onStepSelect?: (stepId: string) => void;
  selectedStepId?: string | null;
}

type SortKey = 'duration' | 'tokens' | 'cost' | 'percent';
type ViewMode = 'list' | 'chart';

export function PerformanceMetricsPanel({
  metrics,
  onStepSelect,
  selectedStepId,
}: PerformanceMetricsPanelProps) {
  const [sortKey, setSortKey] = useState<SortKey>('duration');
  const [sortAsc, setSortAsc] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showByType, setShowByType] = useState(false);

  // Sort steps
  const sortedSteps = useMemo(() => {
    const sorted = [...metrics.steps].sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'duration':
          comparison = a.durationMs - b.durationMs;
          break;
        case 'tokens':
          comparison = a.tokensUsed - b.tokensUsed;
          break;
        case 'cost':
          comparison = a.costMicros - b.costMicros;
          break;
        case 'percent':
          comparison = a.percentOfTotal - b.percentOfTotal;
          break;
      }
      return sortAsc ? comparison : -comparison;
    });
    return sorted;
  }, [metrics.steps, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Performance Metrics</h3>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-2 py-1 text-xs rounded-lg transition-colors',
                viewMode === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              )}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={cn(
                'px-2 py-1 text-xs rounded-lg transition-colors',
                viewMode === 'chart' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              )}
            >
              Chart
            </button>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <SummaryCard
          label="Total Duration"
          value={formatDuration(metrics.totalDurationMs)}
          subtext={`Avg: ${formatDuration(metrics.avgStepDurationMs)}`}
        />
        <SummaryCard
          label="Total Tokens"
          value={formatTokens(metrics.totalTokens)}
          subtext={`${Object.keys(metrics.tokensByModel).length} models`}
        />
        <SummaryCard
          label="Total Cost"
          value={formatCost(metrics.totalCostMicros)}
          subtext={`Avg: ${formatCost(metrics.totalCostMicros / (metrics.steps.length || 1))}/step`}
        />
        <SummaryCard
          label="Bottlenecks"
          value={metrics.bottlenecks.length.toString()}
          subtext={metrics.bottlenecks.length > 0 ? 'Steps identified' : 'None found'}
          highlight={metrics.bottlenecks.length > 0}
        />
      </div>

      {/* Percentile breakdown */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-500 mb-2">Step Duration Percentiles</div>
        <div className="flex items-center gap-4">
          <PercentileBar
            label="Median"
            value={metrics.medianStepDurationMs}
            max={metrics.p95StepDurationMs}
          />
          <PercentileBar
            label="P95"
            value={metrics.p95StepDurationMs}
            max={metrics.p95StepDurationMs}
            highlight
          />
        </div>
      </div>

      {/* By step type toggle */}
      <div className="mb-3">
        <button
          onClick={() => setShowByType(!showByType)}
          className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
        >
          <svg className={cn('w-4 h-4 transition-transform', showByType && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {showByType ? 'Hide' : 'Show'} breakdown by step type
        </button>

        {showByType && (
          <div className="mt-3 space-y-2">
            {Object.entries(metrics.byStepType).map(([type, stats]) => (
              <div key={type} className="flex items-center gap-3 text-xs">
                <span className="w-24 font-medium text-gray-700">{type}</span>
                <div className="flex-grow bg-gray-100 rounded-full h-2 relative">
                  <div
                    className="absolute top-0 left-0 h-full bg-primary-400 rounded-full"
                    style={{ width: `${(stats.totalDurationMs / metrics.totalDurationMs) * 100}%` }}
                  />
                </div>
                <span className="w-16 text-right text-gray-500">{stats.count} steps</span>
                <span className="w-20 text-right font-mono">{formatDuration(stats.avgDurationMs)} avg</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottlenecks section */}
      {metrics.bottlenecks.length > 0 && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="text-xs font-semibold text-orange-700 mb-2">
            ⚠️ Bottlenecks Detected ({metrics.bottlenecks.length})
          </div>
          <div className="space-y-1">
            {metrics.bottlenecks.slice(0, 3).map(step => (
              <div
                key={step.stepId}
                className="flex items-center justify-between text-xs cursor-pointer hover:bg-orange-100 rounded p-1"
                onClick={() => onStepSelect?.(step.stepId)}
              >
                <span className="text-gray-700 truncate">{step.stepName}</span>
                <span className="font-mono text-orange-600">{formatDuration(step.durationMs)}</span>
              </div>
            ))}
            {metrics.bottlenecks.length > 3 && (
              <div className="text-xs text-orange-500 text-center">
                +{metrics.bottlenecks.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step list or chart */}
      {viewMode === 'list' ? (
        <StepList
          steps={sortedSteps}
          sortKey={sortKey}
          sortAsc={sortAsc}
          onSort={handleSort}
          onStepSelect={onStepSelect}
          selectedStepId={selectedStepId}
          totalDuration={metrics.totalDurationMs}
        />
      ) : (
        <StepChart
          steps={sortedSteps}
          totalDuration={metrics.totalDurationMs}
          onStepSelect={onStepSelect}
          selectedStepId={selectedStepId}
        />
      )}

      {/* Model breakdown */}
      {Object.keys(metrics.tokensByModel).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-xs font-semibold text-gray-500 mb-2">Token Usage by Model</div>
          <div className="space-y-2">
            {Object.entries(metrics.tokensByModel).map(([model, tokens]) => (
              <div key={model} className="flex items-center gap-2 text-xs">
                <span className="w-32 truncate text-gray-700">{model}</span>
                <div className="flex-grow bg-gray-100 rounded-full h-2 relative">
                  <div
                    className="absolute top-0 left-0 h-full bg-purple-400 rounded-full"
                    style={{ width: `${(tokens / metrics.totalTokens) * 100}%` }}
                  />
                </div>
                <span className="w-16 text-right font-mono">{formatTokens(tokens)}</span>
                <span className="w-20 text-right text-gray-500">
                  {formatCost(metrics.costByModel[model] || 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Summary card component
function SummaryCard({
  label,
  value,
  subtext,
  highlight,
}: {
  label: string;
  value: string;
  subtext: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      'p-3 rounded-lg',
      highlight ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
    )}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className={cn(
        'text-lg font-semibold',
        highlight ? 'text-orange-600' : 'text-gray-900'
      )}>{value}</div>
      <div className="text-xs text-gray-400">{subtext}</div>
    </div>
  );
}

// Percentile bar component
function PercentileBar({
  label,
  value,
  max,
  highlight,
}: {
  label: string;
  value: number;
  max: number;
  highlight?: boolean;
}) {
  const percent = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className="flex-grow">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className={highlight ? 'text-orange-600 font-medium' : 'text-gray-500'}>
          {label}
        </span>
        <span className="font-mono">{formatDuration(value)}</span>
      </div>
      <div className="bg-gray-200 rounded-full h-2">
        <div
          className={cn(
            'h-full rounded-full',
            highlight ? 'bg-orange-400' : 'bg-primary-400'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

// Step list component
function StepList({
  steps,
  sortKey,
  sortAsc,
  onSort,
  onStepSelect,
  selectedStepId,
  totalDuration,
}: {
  steps: StepPerformanceMetrics[];
  sortKey: SortKey;
  sortAsc: boolean;
  onSort: (key: SortKey) => void;
  onStepSelect?: (stepId: string) => void;
  selectedStepId?: string | null;
  totalDuration: number;
}) {
  return (
    <div className="overflow-auto max-h-64">
      <table className="w-full text-xs">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="text-left py-2 px-2 font-medium text-gray-500">Step</th>
            <SortableHeader
              label="Duration"
              sortKey="duration"
              currentKey={sortKey}
              ascending={sortAsc}
              onClick={onSort}
            />
            <SortableHeader
              label="% Total"
              sortKey="percent"
              currentKey={sortKey}
              ascending={sortAsc}
              onClick={onSort}
            />
            <SortableHeader
              label="Tokens"
              sortKey="tokens"
              currentKey={sortKey}
              ascending={sortAsc}
              onClick={onSort}
            />
            <SortableHeader
              label="Cost"
              sortKey="cost"
              currentKey={sortKey}
              ascending={sortAsc}
              onClick={onSort}
            />
          </tr>
        </thead>
        <tbody>
          {steps.map(step => (
            <tr
              key={step.stepId}
              className={cn(
                'border-b border-gray-100 cursor-pointer',
                selectedStepId === step.stepId && 'bg-primary-50',
                step.isBottleneck && 'bg-orange-50',
                !selectedStepId && 'hover:bg-gray-50'
              )}
              onClick={() => onStepSelect?.(step.stepId)}
            >
              <td className="py-2 px-2">
                <div className="flex items-center gap-1">
                  {step.isBottleneck && <span className="text-orange-500">⚠️</span>}
                  <span className="truncate max-w-32">{step.stepName}</span>
                </div>
                <div className="text-gray-400">{step.stepType}</div>
              </td>
              <td className="py-2 px-2 text-right font-mono">
                {formatDuration(step.durationMs)}
              </td>
              <td className="py-2 px-2 text-right">
                <div className="flex items-center gap-1 justify-end">
                  <div className="w-12 bg-gray-100 rounded-full h-1.5">
                    <div
                      className="h-full bg-primary-400 rounded-full"
                      style={{ width: `${step.percentOfTotal}%` }}
                    />
                  </div>
                  <span className="w-10 text-right">{step.percentOfTotal.toFixed(1)}%</span>
                </div>
              </td>
              <td className="py-2 px-2 text-right font-mono text-gray-600">
                {step.tokensUsed > 0 ? formatTokens(step.tokensUsed) : '-'}
              </td>
              <td className="py-2 px-2 text-right font-mono text-gray-600">
                {step.costMicros > 0 ? formatCost(step.costMicros) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Sortable header component
function SortableHeader({
  label,
  sortKey,
  currentKey,
  ascending,
  onClick,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  ascending: boolean;
  onClick: (key: SortKey) => void;
}) {
  const isActive = sortKey === currentKey;

  return (
    <th
      className="text-right py-2 px-2 font-medium text-gray-500 cursor-pointer hover:text-gray-700"
      onClick={() => onClick(sortKey)}
    >
      <div className="flex items-center justify-end gap-1">
        {label}
        {isActive && (
          <svg className={cn('w-3 h-3', ascending && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>
    </th>
  );
}

// Step chart component (horizontal bar chart)
function StepChart({
  steps,
  totalDuration,
  onStepSelect,
  selectedStepId,
}: {
  steps: StepPerformanceMetrics[];
  totalDuration: number;
  onStepSelect?: (stepId: string) => void;
  selectedStepId?: string | null;
}) {
  const maxDuration = Math.max(...steps.map(s => s.durationMs));

  return (
    <div className="space-y-1.5 max-h-64 overflow-auto">
      {steps.map(step => (
        <div
          key={step.stepId}
          className={cn(
            'flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors',
            selectedStepId === step.stepId && 'bg-primary-50',
            step.isBottleneck && 'bg-orange-50',
            !selectedStepId && 'hover:bg-gray-50'
          )}
          onClick={() => onStepSelect?.(step.stepId)}
        >
          <div className="w-24 truncate text-xs text-gray-700">{step.stepName}</div>
          <div className="flex-grow">
            <div className="bg-gray-100 rounded-full h-4 relative">
              <div
                className={cn(
                  'absolute top-0 left-0 h-full rounded-full transition-all',
                  step.isBottleneck ? 'bg-orange-400' : 'bg-primary-400'
                )}
                style={{ width: `${(step.durationMs / maxDuration) * 100}%` }}
              />
              {step.isBottleneck && (
                <span className="absolute right-1 top-0.5 text-[10px] text-orange-600">⚠️</span>
              )}
            </div>
          </div>
          <div className="w-16 text-right text-xs font-mono">{formatDuration(step.durationMs)}</div>
        </div>
      ))}
    </div>
  );
}

export default PerformanceMetricsPanel;
