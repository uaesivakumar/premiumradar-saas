'use client';

/**
 * PatternExplorer Component
 * Sprint S62: Signal Correlation & Pattern Explorer
 *
 * Displays detected patterns with cluster visualization and recommendations.
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import type { PatternClustersResult } from '@/lib/intelligence-suite/transformers';
import type { PatternDetection, PatternType } from '@/lib/intelligence-suite/types';

interface PatternExplorerProps {
  patterns: PatternClustersResult;
  onPatternClick?: (pattern: PatternDetection) => void;
  className?: string;
}

const PATTERN_TYPE_CONFIG: Record<
  PatternType,
  { label: string; icon: string; color: string }
> = {
  'success-pattern': { label: 'Success', icon: '✓', color: 'bg-green-500' },
  'failure-pattern': { label: 'Failure', icon: '✗', color: 'bg-red-500' },
  'conversion-pattern': { label: 'Conversion', icon: '↗', color: 'bg-blue-500' },
  'engagement-pattern': { label: 'Engagement', icon: '💬', color: 'bg-purple-500' },
  'timing-pattern': { label: 'Timing', icon: '⏰', color: 'bg-yellow-500' },
  'segment-pattern': { label: 'Segment', icon: '👥', color: 'bg-indigo-500' },
  'anomaly': { label: 'Anomaly', icon: '⚠', color: 'bg-orange-500' },
};

export function PatternExplorer({
  patterns,
  onPatternClick,
  className,
}: PatternExplorerProps) {
  const [selectedType, setSelectedType] = useState<PatternType | 'all'>('all');
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);

  const patternTypes = Object.keys(patterns.byType) as PatternType[];
  const displayPatterns =
    selectedType === 'all'
      ? Object.values(patterns.byType).flat()
      : patterns.byType[selectedType];

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700', className)}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Pattern Explorer
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {patterns.totalPatterns} patterns detected •{' '}
              {(patterns.avgConfidence * 100).toFixed(0)}% avg confidence
            </p>
          </div>
        </div>

        {/* Type Filter Tabs */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => setSelectedType('all')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-full transition-colors',
              selectedType === 'all'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400'
            )}
          >
            All ({patterns.totalPatterns})
          </button>
          {patternTypes.map((type) => {
            const config = PATTERN_TYPE_CONFIG[type];
            const count = patterns.byType[type].length;
            if (count === 0) return null;

            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                  selectedType === type
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400'
                )}
              >
                {config.icon} {config.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Pattern List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
        {displayPatterns.map((pattern) => (
          <PatternCard
            key={pattern.id}
            pattern={pattern}
            isExpanded={expandedPattern === pattern.id}
            onToggle={() =>
              setExpandedPattern(
                expandedPattern === pattern.id ? null : pattern.id
              )
            }
            onClick={() => onPatternClick?.(pattern)}
          />
        ))}

        {displayPatterns.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No patterns found for this filter
          </div>
        )}
      </div>

      {/* High Impact Summary */}
      {patterns.highImpact.length > 0 && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
            High Impact Patterns ({patterns.highImpact.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {patterns.highImpact.slice(0, 5).map((p) => (
              <span
                key={p.id}
                className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-800/40 text-yellow-800 dark:text-yellow-200 rounded"
              >
                {p.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface PatternCardProps {
  pattern: PatternDetection;
  isExpanded: boolean;
  onToggle: () => void;
  onClick?: () => void;
}

function PatternCard({ pattern, isExpanded, onToggle, onClick }: PatternCardProps) {
  const config = PATTERN_TYPE_CONFIG[pattern.patternType];

  const impactColors = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    low: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  };

  return (
    <div
      className={cn(
        'p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Type Indicator */}
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm',
            config.color
          )}
        >
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900 dark:text-white truncate">
              {pattern.name}
            </h4>
            <span className={cn('text-xs px-1.5 py-0.5 rounded', impactColors[pattern.impact])}>
              {pattern.impact}
            </span>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {pattern.description}
          </p>

          {/* Metrics Row */}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>
              Confidence: <strong>{(pattern.confidence * 100).toFixed(0)}%</strong>
            </span>
            <span>
              Frequency: <strong>{pattern.frequency}</strong>
            </span>
            <span>
              Members: <strong>{pattern.members.length}</strong>
            </span>
          </div>

          {/* Expandable Details */}
          {isExpanded && (
            <div className="mt-4 space-y-3">
              {/* Characteristics */}
              {pattern.characteristics.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Key Characteristics
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {pattern.characteristics.map((char, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                      >
                        {char.attribute}: {char.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {pattern.recommendations.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Recommendations
                  </h5>
                  <ul className="space-y-1">
                    {pattern.recommendations.map((rec, i) => (
                      <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1">
                        <span className="text-blue-500">→</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Expand Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>
    </div>
  );
}

export default PatternExplorer;
