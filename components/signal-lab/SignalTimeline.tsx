'use client';

/**
 * SignalTimeline Component
 * Sprint S62: Signal Correlation & Pattern Explorer
 *
 * Displays signals on a timeline to visualize temporal patterns.
 */

import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import type { IntelligenceSignalData } from '@/lib/intelligence-suite/types';

interface SignalTimelineProps {
  signals: IntelligenceSignalData[];
  onSignalClick?: (signal: IntelligenceSignalData) => void;
  className?: string;
}

export function SignalTimeline({
  signals,
  onSignalClick,
  className,
}: SignalTimelineProps) {
  const [hoveredSignal, setHoveredSignal] = useState<string | null>(null);

  // Sort signals by timestamp
  const sortedSignals = useMemo(() => {
    return [...signals].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [signals]);

  // Get date range
  const dateRange = useMemo(() => {
    if (sortedSignals.length === 0) return { start: new Date(), end: new Date() };
    return {
      start: new Date(sortedSignals[0].timestamp),
      end: new Date(sortedSignals[sortedSignals.length - 1].timestamp),
    };
  }, [sortedSignals]);

  // Calculate position for each signal
  const getPosition = (timestamp: string) => {
    const time = new Date(timestamp).getTime();
    const start = dateRange.start.getTime();
    const end = dateRange.end.getTime();
    const range = end - start || 1;
    return ((time - start) / range) * 100;
  };

  const getSignalColor = (type: string) => {
    const colors: Record<string, string> = {
      'hiring-expansion': 'bg-green-500',
      'headcount-jump': 'bg-blue-500',
      'funding-round': 'bg-purple-500',
      'market-entry': 'bg-orange-500',
      'office-opening': 'bg-yellow-500',
      'project-award': 'bg-pink-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  // Group signals by type for the legend
  const signalsByType = useMemo(() => {
    const grouped: Record<string, number> = {};
    signals.forEach((s) => {
      grouped[s.type] = (grouped[s.type] || 0) + 1;
    });
    return grouped;
  }, [signals]);

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Signal Timeline
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {sortedSignals.length} signals from{' '}
          {dateRange.start.toLocaleDateString()} to{' '}
          {dateRange.end.toLocaleDateString()}
        </p>
      </div>

      <div className="p-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-4">
          {Object.entries(signalsByType).map(([type, count]) => (
            <div key={type} className="flex items-center gap-1.5 text-sm">
              <div className={cn('w-3 h-3 rounded-full', getSignalColor(type))} />
              <span className="text-gray-600 dark:text-gray-400">
                {type} ({count})
              </span>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="relative h-24 bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-hidden">
          {/* Grid lines */}
          <div className="absolute inset-0 flex justify-between px-4">
            {[0, 25, 50, 75, 100].map((pos) => (
              <div
                key={pos}
                className="h-full w-px bg-gray-200 dark:bg-gray-600"
              />
            ))}
          </div>

          {/* Timeline track */}
          <div className="absolute left-4 right-4 top-1/2 transform -translate-y-1/2 h-1 bg-gray-300 dark:bg-gray-600 rounded" />

          {/* Signal markers */}
          {sortedSignals.map((signal) => {
            const position = getPosition(String(signal.timestamp));
            const isHovered = hoveredSignal === signal.id;

            return (
              <div
                key={signal.id}
                className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2"
                style={{ left: `calc(${position}% * 0.92 + 4%)` }}
                onMouseEnter={() => setHoveredSignal(signal.id)}
                onMouseLeave={() => setHoveredSignal(null)}
                onClick={() => onSignalClick?.(signal)}
              >
                <div
                  className={cn(
                    'w-4 h-4 rounded-full cursor-pointer transition-all',
                    getSignalColor(signal.type),
                    isHovered && 'w-6 h-6 ring-2 ring-white dark:ring-gray-800'
                  )}
                />
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
                    <div className="font-medium">{signal.type}</div>
                    <div className="opacity-75">
                      {new Date(signal.timestamp).toLocaleDateString()}
                    </div>
                    <div className="opacity-75">
                      Strength: {signal.strength}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {sortedSignals.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              No signals to display
            </div>
          )}
        </div>

        {/* Date labels */}
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{dateRange.start.toLocaleDateString()}</span>
          <span>{dateRange.end.toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

export default SignalTimeline;
