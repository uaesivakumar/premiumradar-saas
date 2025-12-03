/**
 * Metrics Trend Component
 * Sprint S54: Vertical Dashboards
 *
 * Displays trend lines for various metrics over time.
 */

import React, { useMemo } from 'react';
import type { TrendSeries, TrendPoint } from '../../lib/dashboard';

interface MetricsTrendProps {
  trends: TrendSeries[];
  loading?: boolean;
  height?: number;
  showLegend?: boolean;
}

export function MetricsTrend({
  trends,
  loading = false,
  height = 200,
  showLegend = true,
}: MetricsTrendProps) {
  if (loading) {
    return <TrendSkeleton height={height} />;
  }

  if (trends.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No trend data available
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>

      <div style={{ height }} className="relative">
        <TrendChart trends={trends} height={height - 40} />
      </div>

      {showLegend && (
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200">
          {trends.map((series) => (
            <div key={series.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: series.color }}
              />
              <span className="text-sm text-gray-600">{series.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface TrendChartProps {
  trends: TrendSeries[];
  height: number;
}

function TrendChart({ trends, height }: TrendChartProps) {
  const { allPoints, minValue, maxValue, dateRange } = useMemo(() => {
    const all: Array<TrendPoint & { seriesId: string; color: string }> = [];
    let min = Infinity;
    let max = -Infinity;
    let minDate = new Date();
    let maxDate = new Date(0);

    trends.forEach((series) => {
      series.data.forEach((point) => {
        all.push({ ...point, seriesId: series.id, color: series.color });
        min = Math.min(min, point.value);
        max = Math.max(max, point.value);
        const d = new Date(point.date);
        if (d < minDate) minDate = d;
        if (d > maxDate) maxDate = d;
      });
    });

    return {
      allPoints: all,
      minValue: min === Infinity ? 0 : min,
      maxValue: max === -Infinity ? 100 : max,
      dateRange: { start: minDate, end: maxDate },
    };
  }, [trends]);

  const padding = { top: 10, right: 10, bottom: 30, left: 40 };
  const chartWidth = 600; // Will be scaled by viewBox
  const chartHeight = height;

  const xScale = (date: Date): number => {
    const range = dateRange.end.getTime() - dateRange.start.getTime() || 1;
    const percent = (new Date(date).getTime() - dateRange.start.getTime()) / range;
    return padding.left + percent * (chartWidth - padding.left - padding.right);
  };

  const yScale = (value: number): number => {
    const range = maxValue - minValue || 1;
    const percent = (value - minValue) / range;
    return chartHeight - padding.bottom - percent * (chartHeight - padding.top - padding.bottom);
  };

  // Generate path for each series
  const paths = trends.map((series) => {
    const sortedData = [...series.data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const d = sortedData
      .map((point, i) => {
        const x = xScale(new Date(point.date));
        const y = yScale(point.value);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    return { id: series.id, color: series.color, d, type: series.type };
  });

  // Generate Y-axis ticks
  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const range = maxValue - minValue;
    const step = range / 4;
    for (let i = 0; i <= 4; i++) {
      ticks.push(minValue + step * i);
    }
    return ticks;
  }, [minValue, maxValue]);

  return (
    <svg
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Grid lines */}
      {yTicks.map((tick) => (
        <g key={tick}>
          <line
            x1={padding.left}
            y1={yScale(tick)}
            x2={chartWidth - padding.right}
            y2={yScale(tick)}
            stroke="#e5e7eb"
            strokeDasharray="4,4"
          />
          <text
            x={padding.left - 8}
            y={yScale(tick)}
            textAnchor="end"
            dominantBaseline="middle"
            className="text-xs fill-gray-500"
            fontSize="10"
          >
            {formatTick(tick)}
          </text>
        </g>
      ))}

      {/* X-axis labels */}
      <text
        x={padding.left}
        y={chartHeight - 5}
        textAnchor="start"
        className="text-xs fill-gray-500"
        fontSize="10"
      >
        {formatDate(dateRange.start)}
      </text>
      <text
        x={chartWidth - padding.right}
        y={chartHeight - 5}
        textAnchor="end"
        className="text-xs fill-gray-500"
        fontSize="10"
      >
        {formatDate(dateRange.end)}
      </text>

      {/* Trend lines */}
      {paths.map((path) => (
        <g key={path.id}>
          {path.type === 'area' && (
            <path
              d={`${path.d} L ${chartWidth - padding.right} ${chartHeight - padding.bottom} L ${padding.left} ${chartHeight - padding.bottom} Z`}
              fill={path.color}
              fillOpacity={0.1}
            />
          )}
          <path
            d={path.d}
            fill="none"
            stroke={path.color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ))}

      {/* Data points */}
      {trends.map((series) =>
        series.data.map((point, i) => (
          <circle
            key={`${series.id}-${i}`}
            cx={xScale(new Date(point.date))}
            cy={yScale(point.value)}
            r={3}
            fill={series.color}
            className="cursor-pointer hover:r-4 transition-all"
          >
            <title>
              {formatDate(new Date(point.date))}: {point.value.toFixed(1)}
            </title>
          </circle>
        ))
      )}
    </svg>
  );
}

function TrendSkeleton({ height }: { height: number }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="w-40 h-6 bg-gray-200 rounded mb-4" />
      <div style={{ height }} className="bg-gray-100 rounded" />
      <div className="flex gap-4 mt-4 pt-4 border-t border-gray-200">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-200 rounded-full" />
            <div className="w-16 h-4 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function formatTick(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toFixed(0);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default MetricsTrend;
