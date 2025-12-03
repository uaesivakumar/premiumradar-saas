'use client';

/**
 * CorrelationHeatmap Component
 * Sprint S62: Signal Correlation & Pattern Explorer
 *
 * Displays signal correlations as a heatmap matrix.
 */

import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import type { CorrelationResult, IntelligenceSignalData } from '@/lib/intelligence-suite/types';

interface CorrelationHeatmapProps {
  correlations: CorrelationResult[];
  signals: IntelligenceSignalData[];
  onCellClick?: (signalA: string, signalB: string) => void;
  className?: string;
}

export function CorrelationHeatmap({
  correlations,
  signals,
  onCellClick,
  className,
}: CorrelationHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{ a: string; b: string } | null>(null);

  // Build correlation matrix
  const { matrix, signalTypes } = useMemo(() => {
    // Get unique signal types
    const types = Array.from(new Set(signals.map((s) => s.type)));

    // Build lookup for correlations by signal type pairs
    const corrByType: Record<string, number> = {};
    correlations.forEach((c) => {
      const signalA = signals.find((s) => s.id === c.signalA);
      const signalB = signals.find((s) => s.id === c.signalB);
      if (signalA && signalB) {
        const key = `${signalA.type}|${signalB.type}`;
        const reverseKey = `${signalB.type}|${signalA.type}`;
        corrByType[key] = c.correlation;
        corrByType[reverseKey] = c.correlation;
      }
    });

    // Build matrix
    const mat: number[][] = [];
    types.forEach((typeA, i) => {
      mat[i] = [];
      types.forEach((typeB, j) => {
        if (i === j) {
          mat[i][j] = 1; // Self-correlation is 1
        } else {
          const key = `${typeA}|${typeB}`;
          mat[i][j] = corrByType[key] ?? 0;
        }
      });
    });

    return { matrix: mat, signalTypes: types };
  }, [correlations, signals]);

  const getCellColor = (value: number) => {
    // Map correlation (-1 to 1) to color
    if (value >= 0.8) return 'bg-green-600';
    if (value >= 0.6) return 'bg-green-500';
    if (value >= 0.4) return 'bg-green-400';
    if (value >= 0.2) return 'bg-green-300';
    if (value >= 0) return 'bg-gray-200 dark:bg-gray-600';
    if (value >= -0.2) return 'bg-red-300';
    if (value >= -0.4) return 'bg-red-400';
    if (value >= -0.6) return 'bg-red-500';
    return 'bg-red-600';
  };

  if (signalTypes.length === 0) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500',
          className
        )}
      >
        No signal data available for heatmap
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Correlation Heatmap
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Signal type correlations ({signalTypes.length} types)
        </p>
      </div>

      <div className="p-4 overflow-x-auto">
        <div className="inline-block">
          {/* Column headers */}
          <div className="flex ml-24">
            {signalTypes.map((type) => (
              <div
                key={type}
                className="w-16 h-20 flex items-end justify-center pb-2"
              >
                <span
                  className="text-xs text-gray-600 dark:text-gray-400 transform -rotate-45 origin-bottom-left whitespace-nowrap"
                  style={{ width: 80 }}
                >
                  {type.replace(/-/g, ' ')}
                </span>
              </div>
            ))}
          </div>

          {/* Rows */}
          {signalTypes.map((typeA, i) => (
            <div key={typeA} className="flex items-center">
              {/* Row header */}
              <div className="w-24 pr-2 text-right">
                <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {typeA.replace(/-/g, ' ')}
                </span>
              </div>

              {/* Cells */}
              {signalTypes.map((typeB, j) => {
                const value = matrix[i][j];
                const isHovered =
                  hoveredCell?.a === typeA && hoveredCell?.b === typeB;

                return (
                  <div
                    key={typeB}
                    className={cn(
                      'w-16 h-10 flex items-center justify-center cursor-pointer transition-all',
                      getCellColor(value),
                      isHovered && 'ring-2 ring-blue-500 z-10'
                    )}
                    onMouseEnter={() => setHoveredCell({ a: typeA, b: typeB })}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => onCellClick?.(typeA, typeB)}
                  >
                    <span
                      className={cn(
                        'text-xs font-medium',
                        value >= 0.4 || value <= -0.4
                          ? 'text-white'
                          : 'text-gray-700 dark:text-gray-300'
                      )}
                    >
                      {value.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Color Scale Legend */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="text-xs text-gray-500">-1</span>
          <div className="flex">
            <div className="w-6 h-4 bg-red-600" />
            <div className="w-6 h-4 bg-red-400" />
            <div className="w-6 h-4 bg-red-300" />
            <div className="w-6 h-4 bg-gray-200 dark:bg-gray-600" />
            <div className="w-6 h-4 bg-green-300" />
            <div className="w-6 h-4 bg-green-400" />
            <div className="w-6 h-4 bg-green-600" />
          </div>
          <span className="text-xs text-gray-500">+1</span>
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredCell && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="text-sm text-gray-900 dark:text-white">
            <span className="font-medium">{hoveredCell.a.replace(/-/g, ' ')}</span>
            <span className="text-gray-500 mx-2">→</span>
            <span className="font-medium">{hoveredCell.b.replace(/-/g, ' ')}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Correlation:{' '}
            {matrix[signalTypes.indexOf(hoveredCell.a)][
              signalTypes.indexOf(hoveredCell.b)
            ].toFixed(3)}
          </div>
        </div>
      )}
    </div>
  );
}

export default CorrelationHeatmap;
