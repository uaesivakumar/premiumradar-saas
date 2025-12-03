'use client';

/**
 * IntelligenceTimeSeries Component
 * Sprint S56-S62: Intelligence Suite
 *
 * Displays time series chart with multiple metrics and anomaly markers.
 */

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import type { TimeSeriesChartData } from '@/lib/intelligence-suite/transformers';

interface IntelligenceTimeSeriesProps {
  data: TimeSeriesChartData;
  title?: string;
  className?: string;
}

export function IntelligenceTimeSeries({
  data,
  title = 'Metrics Over Time',
  className,
}: IntelligenceTimeSeriesProps) {
  const [selectedSeries, setSelectedSeries] = useState<string[]>(
    data.series.map((s) => s.id)
  );
  const [hoveredPoint, setHoveredPoint] = useState<{
    seriesId: string;
    x: number;
    y: number;
    displayX: number;
    displayY: number;
  } | null>(null);

  const toggleSeries = (seriesId: string) => {
    setSelectedSeries((prev) =>
      prev.includes(seriesId)
        ? prev.filter((id) => id !== seriesId)
        : [...prev, seriesId]
    );
  };

  const visibleSeries = data.series.filter((s) => selectedSeries.includes(s.id));

  // Calculate chart dimensions
  const chartWidth = 600;
  const chartHeight = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Scales
  const xScale = useMemo(() => {
    const [min, max] = data.xDomain;
    return (value: number) =>
      ((value - min) / (max - min)) * innerWidth + padding.left;
  }, [data.xDomain, innerWidth, padding.left]);

  const yScale = useMemo(() => {
    const [min, max] = data.yDomain;
    return (value: number) =>
      chartHeight - padding.bottom - ((value - min) / (max - min)) * innerHeight;
  }, [data.yDomain, chartHeight, innerHeight, padding.bottom]);

  // Generate path for each series
  const generatePath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.x)} ${yScale(p.y)}`)
      .join(' ');
  };

  // Y-axis ticks
  const yTicks = useMemo(() => {
    const [min, max] = data.yDomain;
    const step = (max - min) / 4;
    return Array.from({ length: 5 }, (_, i) => min + step * i);
  }, [data.yDomain]);

  // X-axis ticks (dates)
  const xTicks = useMemo(() => {
    const [min, max] = data.xDomain;
    const count = 5;
    const step = (max - min) / (count - 1);
    return Array.from({ length: count }, (_, i) => min + step * i);
  }, [data.xDomain]);

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700', className)}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>

          {/* Legend / Toggle */}
          <div className="flex items-center gap-2">
            {data.series.map((series) => (
              <button
                key={series.id}
                onClick={() => toggleSeries(series.id)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded text-xs transition-opacity',
                  selectedSeries.includes(series.id)
                    ? 'opacity-100'
                    : 'opacity-40'
                )}
              >
                <span
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: series.color }}
                />
                <span className="text-gray-600 dark:text-gray-400">
                  {series.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4">
        <svg
          width="100%"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="overflow-visible"
        >
          {/* Grid lines */}
          {yTicks.map((tick) => (
            <line
              key={`grid-${tick}`}
              x1={padding.left}
              y1={yScale(tick)}
              x2={chartWidth - padding.right}
              y2={yScale(tick)}
              className="stroke-gray-200 dark:stroke-gray-700"
              strokeDasharray="4"
            />
          ))}

          {/* Y-axis */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={chartHeight - padding.bottom}
            className="stroke-gray-300 dark:stroke-gray-600"
          />

          {/* Y-axis labels */}
          {yTicks.map((tick) => (
            <text
              key={`y-${tick}`}
              x={padding.left - 8}
              y={yScale(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-gray-500 text-xs"
            >
              {formatNumber(tick)}
            </text>
          ))}

          {/* X-axis */}
          <line
            x1={padding.left}
            y1={chartHeight - padding.bottom}
            x2={chartWidth - padding.right}
            y2={chartHeight - padding.bottom}
            className="stroke-gray-300 dark:stroke-gray-600"
          />

          {/* X-axis labels */}
          {xTicks.map((tick) => (
            <text
              key={`x-${tick}`}
              x={xScale(tick)}
              y={chartHeight - padding.bottom + 20}
              textAnchor="middle"
              className="fill-gray-500 text-xs"
            >
              {formatDate(tick)}
            </text>
          ))}

          {/* Series lines */}
          {visibleSeries.map((series) => (
            <g key={series.id}>
              <path
                d={generatePath(series.data)}
                fill="none"
                stroke={series.color}
                strokeWidth={2}
                className="transition-opacity"
              />

              {/* Data points */}
              {series.data.map((point, i) => (
                <circle
                  key={`${series.id}-${i}`}
                  cx={xScale(point.x)}
                  cy={yScale(point.y)}
                  r={hoveredPoint?.seriesId === series.id && hoveredPoint.x === point.x ? 6 : 3}
                  fill={series.color}
                  className="cursor-pointer transition-all"
                  onMouseEnter={() =>
                    setHoveredPoint({
                      seriesId: series.id,
                      x: point.x,
                      y: point.y,
                      displayX: xScale(point.x),
                      displayY: yScale(point.y),
                    })
                  }
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
            </g>
          ))}

          {/* Anomaly markers */}
          {data.annotations
            .filter((a) => a.type === 'anomaly')
            .map((annotation, i) => (
              <g key={`anomaly-${i}`}>
                <line
                  x1={xScale(annotation.x)}
                  y1={padding.top}
                  x2={xScale(annotation.x)}
                  y2={chartHeight - padding.bottom}
                  className="stroke-red-400"
                  strokeDasharray="4"
                />
                <text
                  x={xScale(annotation.x)}
                  y={padding.top - 5}
                  textAnchor="middle"
                  className="fill-red-500 text-xs"
                >
                  ⚠
                </text>
              </g>
            ))}
        </svg>

        {/* Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none z-50"
            style={{
              left: hoveredPoint.displayX,
              top: hoveredPoint.displayY - 30,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-medium">{formatDate(hoveredPoint.x)}</div>
            <div>{formatNumber(hoveredPoint.y)}</div>
          </div>
        )}
      </div>

      {/* Anomalies List */}
      {data.annotations.filter((a) => a.type === 'anomaly').length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20">
          <h4 className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
            Anomalies Detected
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.annotations
              .filter((a) => a.type === 'anomaly')
              .map((a, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 bg-red-100 dark:bg-red-800/40 text-red-700 dark:text-red-300 rounded"
                >
                  {formatDate(a.x)}: {a.label}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(0);
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default IntelligenceTimeSeries;
