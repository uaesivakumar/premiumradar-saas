'use client';

/**
 * SignalCorrelationMatrix Component
 * Sprint S62: Signal Correlation & Pattern Explorer
 *
 * Displays a heatmap of signal correlations with interactive hover details.
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import type { CorrelationMatrixUI } from '@/lib/intelligence-suite/transformers';

interface SignalCorrelationMatrixProps {
  matrix: CorrelationMatrixUI;
  className?: string;
}

export function SignalCorrelationMatrix({
  matrix,
  className,
}: SignalCorrelationMatrixProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    x: string;
    y: string;
    correlation: number;
  } | null>(null);

  const { dimensions, heatmapData, strongPositive, strongNegative } = matrix;

  const getColorForCorrelation = (value: number): string => {
    if (value > 0.7) return 'bg-green-600';
    if (value > 0.4) return 'bg-green-400';
    if (value > 0.1) return 'bg-green-200';
    if (value > -0.1) return 'bg-gray-200';
    if (value > -0.4) return 'bg-red-200';
    if (value > -0.7) return 'bg-red-400';
    return 'bg-red-600';
  };

  const getTextColorForCorrelation = (value: number): string => {
    if (Math.abs(value) > 0.5) return 'text-white';
    return 'text-gray-800 dark:text-gray-200';
  };

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700', className)}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Signal Correlation Matrix
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Shows relationships between different signal types
        </p>
      </div>

      <div className="p-4 overflow-x-auto">
        {/* Matrix Grid */}
        <div className="inline-block">
          {/* Header Row */}
          <div className="flex">
            <div className="w-24 h-8" /> {/* Empty corner */}
            {dimensions.map((dim) => (
              <div
                key={`header-${dim}`}
                className="w-16 h-8 flex items-center justify-center text-xs font-medium text-gray-500 transform -rotate-45 origin-center"
                style={{ width: '2.5rem' }}
              >
                <span className="truncate">{formatLabel(dim)}</span>
              </div>
            ))}
          </div>

          {/* Matrix Rows */}
          {dimensions.map((rowDim) => (
            <div key={`row-${rowDim}`} className="flex items-center">
              {/* Row Label */}
              <div className="w-24 h-10 flex items-center text-xs font-medium text-gray-600 dark:text-gray-400 pr-2">
                <span className="truncate">{formatLabel(rowDim)}</span>
              </div>

              {/* Cells */}
              {dimensions.map((colDim) => {
                const cellData = heatmapData.find(
                  (c) => c.x === colDim && c.y === rowDim
                );
                const value = cellData?.value || 0;

                return (
                  <div
                    key={`cell-${rowDim}-${colDim}`}
                    className={cn(
                      'w-10 h-10 flex items-center justify-center text-xs font-medium rounded cursor-pointer transition-all hover:ring-2 hover:ring-blue-500',
                      getColorForCorrelation(value),
                      getTextColorForCorrelation(value)
                    )}
                    onMouseEnter={() =>
                      setHoveredCell({ x: colDim, y: rowDim, correlation: value })
                    }
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    {rowDim === colDim ? '1.0' : value.toFixed(1)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs">
          <span className="text-gray-500">Negative</span>
          <div className="flex gap-0.5">
            <div className="w-6 h-4 bg-red-600 rounded-l" />
            <div className="w-6 h-4 bg-red-400" />
            <div className="w-6 h-4 bg-red-200" />
            <div className="w-6 h-4 bg-gray-200" />
            <div className="w-6 h-4 bg-green-200" />
            <div className="w-6 h-4 bg-green-400" />
            <div className="w-6 h-4 bg-green-600 rounded-r" />
          </div>
          <span className="text-gray-500">Positive</span>
        </div>

        {/* Hover Tooltip */}
        {hoveredCell && (
          <div className="fixed bg-gray-900 text-white text-sm px-3 py-2 rounded shadow-lg z-50 pointer-events-none"
            style={{
              transform: 'translate(-50%, -120%)',
            }}
          >
            <div className="font-medium">
              {formatLabel(hoveredCell.x)} × {formatLabel(hoveredCell.y)}
            </div>
            <div className={cn(
              hoveredCell.correlation > 0 ? 'text-green-400' : 'text-red-400'
            )}>
              Correlation: {hoveredCell.correlation.toFixed(3)}
            </div>
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-4">
        {/* Strong Positive */}
        <div>
          <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
            Strong Positive Correlations
          </h4>
          <div className="space-y-1">
            {strongPositive.slice(0, 5).map((item, i) => (
              <div key={i} className="text-xs text-gray-600 dark:text-gray-400">
                {formatLabel(item.x)} ↔ {formatLabel(item.y)}:{' '}
                <span className="text-green-600 font-medium">
                  {item.correlation.toFixed(2)}
                </span>
              </div>
            ))}
            {strongPositive.length === 0 && (
              <p className="text-xs text-gray-500">No strong correlations found</p>
            )}
          </div>
        </div>

        {/* Strong Negative */}
        <div>
          <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">
            Strong Negative Correlations
          </h4>
          <div className="space-y-1">
            {strongNegative.slice(0, 5).map((item, i) => (
              <div key={i} className="text-xs text-gray-600 dark:text-gray-400">
                {formatLabel(item.x)} ↔ {formatLabel(item.y)}:{' '}
                <span className="text-red-600 font-medium">
                  {item.correlation.toFixed(2)}
                </span>
              </div>
            ))}
            {strongNegative.length === 0 && (
              <p className="text-xs text-gray-500">No strong negative correlations</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatLabel(label: string): string {
  return label
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .slice(0, 12);
}

export default SignalCorrelationMatrix;
