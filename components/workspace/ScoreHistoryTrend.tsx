/**
 * Score History Trend Component
 * Sprint S272: Opportunity Strength Scoring
 * Feature F5: Score History Trend
 *
 * Mini trend visualization showing score over time:
 * - Sparkline chart
 * - Trend direction indicator
 * - Date range selector
 *
 * Architecture: Read-only, derived data only
 */

'use client';

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface ScoreDataPoint {
  date: string;
  score: number;
}

interface ScoreHistoryTrendProps {
  data: ScoreDataPoint[];
  isLoading?: boolean;
  height?: number;
  showLabels?: boolean;
  dateRange?: '7d' | '30d' | '90d';
}

// =============================================================================
// Component
// =============================================================================

export function ScoreHistoryTrend({
  data,
  isLoading = false,
  height = 60,
  showLabels = true,
}: ScoreHistoryTrendProps) {
  // Calculate trend
  const trend = useMemo(() => {
    if (data.length < 2) return { direction: 'stable' as const, delta: 0 };

    const recent = data.slice(-7); // Last 7 data points
    const first = recent[0]?.score || 0;
    const last = recent[recent.length - 1]?.score || 0;
    const delta = last - first;

    if (delta > 5) return { direction: 'up' as const, delta };
    if (delta < -5) return { direction: 'down' as const, delta };
    return { direction: 'stable' as const, delta };
  }, [data]);

  // Calculate sparkline points
  const sparklinePoints = useMemo(() => {
    if (data.length === 0) return '';

    const minScore = Math.min(...data.map((d) => d.score));
    const maxScore = Math.max(...data.map((d) => d.score));
    const range = maxScore - minScore || 1;

    const padding = 4;
    const width = 200 - padding * 2;
    const chartHeight = height - padding * 2;

    return data
      .map((point, i) => {
        const x = padding + (i / (data.length - 1)) * width;
        const y = padding + chartHeight - ((point.score - minScore) / range) * chartHeight;
        return `${x},${y}`;
      })
      .join(' ');
  }, [data, height]);

  // Get current and previous score
  const currentScore = data[data.length - 1]?.score || 0;
  const previousScore = data[data.length - 2]?.score || currentScore;

  if (isLoading) {
    return <TrendSkeleton height={height} />;
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-neutral-700">Score Trend</h4>
        </div>
        <div className="text-center py-4 text-sm text-neutral-500">
          No historical data available
        </div>
      </div>
    );
  }

  const TrendIcon = trend.direction === 'up' ? TrendingUp :
                    trend.direction === 'down' ? TrendingDown : Minus;

  const trendColor = trend.direction === 'up' ? 'text-emerald-600' :
                     trend.direction === 'down' ? 'text-red-600' : 'text-neutral-400';

  const lineColor = trend.direction === 'up' ? 'stroke-emerald-500' :
                    trend.direction === 'down' ? 'stroke-red-500' : 'stroke-blue-500';

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-neutral-700">Score Trend</h4>
        <div className={`flex items-center gap-1 ${trendColor}`}>
          <TrendIcon className="w-4 h-4" />
          <span className="text-sm font-medium">
            {trend.delta > 0 ? '+' : ''}{trend.delta.toFixed(0)}
          </span>
        </div>
      </div>

      {/* Sparkline */}
      <div className="relative" style={{ height }}>
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 200 ${height}`}
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          {/* Gradient fill */}
          <defs>
            <linearGradient id="trendGradient" x1="0" x2="0" y1="0" y2="1">
              <stop
                offset="0%"
                className={
                  trend.direction === 'up' ? 'text-emerald-200' :
                  trend.direction === 'down' ? 'text-red-200' : 'text-blue-200'
                }
                stopColor="currentColor"
                stopOpacity="0.3"
              />
              <stop
                offset="100%"
                stopColor="currentColor"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <polygon
            points={`4,${height - 4} ${sparklinePoints} 196,${height - 4}`}
            fill="url(#trendGradient)"
          />

          {/* Line */}
          <polyline
            points={sparklinePoints}
            fill="none"
            className={lineColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* End dot */}
          {data.length > 0 && (
            <circle
              cx={196}
              cy={
                4 +
                (height - 8) -
                ((currentScore - Math.min(...data.map((d) => d.score))) /
                  (Math.max(...data.map((d) => d.score)) - Math.min(...data.map((d) => d.score)) || 1)) *
                  (height - 8)
              }
              r="4"
              className={`${lineColor.replace('stroke-', 'fill-')}`}
            />
          )}
        </svg>
      </div>

      {/* Labels */}
      {showLabels && (
        <div className="flex items-center justify-between mt-2 text-xs text-neutral-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(data[0]?.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neutral-400">Current:</span>
            <span className="font-medium text-neutral-900">{currentScore}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Skeleton
// =============================================================================

function TrendSkeleton({ height }: { height: number }) {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="w-20 h-4 bg-neutral-200 rounded" />
        <div className="w-12 h-4 bg-neutral-200 rounded" />
      </div>
      <div className="bg-neutral-100 rounded" style={{ height }} />
      <div className="flex items-center justify-between mt-2">
        <div className="w-16 h-3 bg-neutral-200 rounded" />
        <div className="w-20 h-3 bg-neutral-200 rounded" />
      </div>
    </div>
  );
}

// =============================================================================
// Utilities
// =============================================================================

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default ScoreHistoryTrend;
