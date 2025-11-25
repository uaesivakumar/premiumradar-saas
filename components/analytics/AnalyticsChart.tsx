/**
 * Analytics Chart Component
 *
 * Mixpanel/PostHog-style chart display.
 */

'use client';

import { useState } from 'react';
import {
  useChartStore,
  CHART_COLORS,
  calculateSeriesStats,
  formatTimestamp,
  type ChartConfig,
  type ChartSeries,
  type DateRange,
} from '@/lib/analytics';

interface AnalyticsChartProps {
  chartId: string;
  config: ChartConfig;
  series: ChartSeries[];
  height?: number;
  onDateRangeChange?: (range: DateRange) => void;
}

export function AnalyticsChart({
  chartId,
  config,
  series,
  height = 300,
  onDateRangeChange,
}: AnalyticsChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    seriesId: string;
    index: number;
    value: number;
    timestamp: Date;
  } | null>(null);

  const visibleSeries = series.filter((s) => s.visible !== false);

  // Calculate chart bounds
  const allValues = visibleSeries.flatMap((s) => s.data.map((d) => d.value));
  const maxValue = Math.max(...allValues, 1);
  const minValue = Math.min(...allValues, 0);

  // Chart dimensions
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = 800 - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scale functions
  const xScale = (index: number, total: number) =>
    (index / Math.max(total - 1, 1)) * chartWidth;
  const yScale = (value: number) =>
    chartHeight - ((value - minValue) / (maxValue - minValue + 0.001)) * chartHeight;

  // Generate path for line chart
  const generatePath = (data: ChartSeries['data']): string => {
    if (data.length === 0) return '';

    return data
      .map((point, i) => {
        const x = xScale(i, data.length);
        const y = yScale(point.value);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  // Generate area path
  const generateAreaPath = (data: ChartSeries['data']): string => {
    if (data.length === 0) return '';

    const linePath = generatePath(data);
    const lastX = xScale(data.length - 1, data.length);
    return `${linePath} L ${lastX} ${chartHeight} L 0 ${chartHeight} Z`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{config.title}</h3>
          {config.description && (
            <p className="text-sm text-gray-500">{config.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <DateRangeSelector
            value={config.dateRange}
            onChange={(range) => onDateRangeChange?.(range)}
          />
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <svg
          viewBox={`0 0 ${800} ${height}`}
          className="w-full"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {/* Grid lines */}
          {config.showGrid && (
            <g className="text-gray-200">
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                <line
                  key={ratio}
                  x1={padding.left}
                  y1={padding.top + chartHeight * ratio}
                  x2={padding.left + chartWidth}
                  y2={padding.top + chartHeight * ratio}
                  stroke="currentColor"
                  strokeDasharray="4"
                />
              ))}
            </g>
          )}

          {/* Y-axis labels */}
          <g className="text-gray-500 text-xs">
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const value = maxValue - (maxValue - minValue) * ratio;
              return (
                <text
                  key={ratio}
                  x={padding.left - 10}
                  y={padding.top + chartHeight * ratio + 4}
                  textAnchor="end"
                  fill="currentColor"
                >
                  {formatValue(value)}
                </text>
              );
            })}
          </g>

          {/* Chart area */}
          <g transform={`translate(${padding.left}, ${padding.top})`}>
            {/* Render series */}
            {visibleSeries.map((s) => (
              <g key={s.id}>
                {/* Area fill */}
                {config.type === 'area' && (
                  <path
                    d={generateAreaPath(s.data)}
                    fill={s.color}
                    fillOpacity={0.2}
                  />
                )}

                {/* Line */}
                {(config.type === 'line' || config.type === 'area') && (
                  <path
                    d={generatePath(s.data)}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Bars */}
                {config.type === 'bar' &&
                  s.data.map((point, i) => {
                    const barWidth = chartWidth / s.data.length - 4;
                    const barHeight = chartHeight - yScale(point.value);
                    return (
                      <rect
                        key={i}
                        x={xScale(i, s.data.length) - barWidth / 2}
                        y={yScale(point.value)}
                        width={barWidth}
                        height={barHeight}
                        fill={s.color}
                        fillOpacity={0.8}
                        rx={2}
                        onMouseEnter={() =>
                          setHoveredPoint({
                            seriesId: s.id,
                            index: i,
                            value: point.value,
                            timestamp: point.timestamp,
                          })
                        }
                      />
                    );
                  })}

                {/* Data points */}
                {(config.type === 'line' || config.type === 'area') &&
                  s.data.map((point, i) => (
                    <circle
                      key={i}
                      cx={xScale(i, s.data.length)}
                      cy={yScale(point.value)}
                      r={4}
                      fill="white"
                      stroke={s.color}
                      strokeWidth={2}
                      className="cursor-pointer"
                      onMouseEnter={() =>
                        setHoveredPoint({
                          seriesId: s.id,
                          index: i,
                          value: point.value,
                          timestamp: point.timestamp,
                        })
                      }
                    />
                  ))}
              </g>
            ))}

            {/* Tooltip */}
            {hoveredPoint && config.showTooltip && (
              <g
                transform={`translate(${xScale(hoveredPoint.index, visibleSeries[0]?.data.length || 1)}, ${yScale(hoveredPoint.value)})`}
              >
                <rect
                  x={-60}
                  y={-50}
                  width={120}
                  height={40}
                  fill="white"
                  stroke="#e5e7eb"
                  rx={4}
                  className="drop-shadow-sm"
                />
                <text
                  x={0}
                  y={-30}
                  textAnchor="middle"
                  className="text-xs fill-gray-500"
                >
                  {formatTimestamp(hoveredPoint.timestamp, config.granularity)}
                </text>
                <text
                  x={0}
                  y={-15}
                  textAnchor="middle"
                  className="text-sm font-semibold fill-gray-900"
                >
                  {formatValue(hoveredPoint.value)}
                </text>
              </g>
            )}
          </g>

          {/* X-axis labels */}
          <g className="text-gray-500 text-xs">
            {visibleSeries[0]?.data.slice(0, 6).map((point, i) => {
              const total = visibleSeries[0].data.length;
              const labelIndex = Math.floor((i / 5) * (total - 1));
              const dataPoint = visibleSeries[0].data[labelIndex];
              if (!dataPoint) return null;

              return (
                <text
                  key={i}
                  x={padding.left + xScale(labelIndex, total)}
                  y={padding.top + chartHeight + 20}
                  textAnchor="middle"
                  fill="currentColor"
                >
                  {formatTimestamp(dataPoint.timestamp, config.granularity)}
                </text>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Legend */}
      {config.showLegend && series.length > 1 && (
        <div className="px-6 py-3 border-t border-gray-100 flex items-center gap-4 flex-wrap">
          {series.map((s) => {
            const stats = calculateSeriesStats(s.data);
            return (
              <button
                key={s.id}
                className={`flex items-center gap-2 px-2 py-1 rounded ${
                  s.visible === false ? 'opacity-50' : ''
                }`}
                onClick={() => {
                  // Toggle visibility
                }}
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-sm text-gray-700">{s.name}</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatValue(stats.latest)}
                </span>
                <span
                  className={`text-xs ${
                    stats.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stats.changePercent >= 0 ? '+' : ''}
                  {stats.changePercent.toFixed(1)}%
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DateRangeSelector({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
}) {
  const ranges: DateRange[] = ['7d', '14d', '30d', '90d', '1y'];

  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-1">
      {ranges.map((range) => (
        <button
          key={range}
          onClick={() => onChange(range)}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            value === range
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {range}
        </button>
      ))}
    </div>
  );
}

function formatValue(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toFixed(0);
}
