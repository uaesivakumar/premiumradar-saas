'use client';

/**
 * PersonaEffectiveness Component
 * Sprint S56-S62: Intelligence Suite
 *
 * Displays persona performance rankings and insights.
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import type { PersonaPerformanceData, PersonaMetrics } from '@/lib/intelligence-suite/types';

interface PersonaEffectivenessProps {
  personas: PersonaPerformanceData[];
  onPersonaClick?: (personaId: string) => void;
  className?: string;
}

type SortKey = keyof PersonaMetrics;

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'qualityScore', label: 'Quality' },
  { key: 'conversionRate', label: 'Conversion' },
  { key: 'responseRate', label: 'Response' },
  { key: 'successRate', label: 'Success' },
];

export function PersonaEffectiveness({
  personas,
  onPersonaClick,
  className,
}: PersonaEffectivenessProps) {
  const [sortBy, setSortBy] = useState<SortKey>('qualityScore');

  const sortedPersonas = [...personas].sort(
    (a, b) => b.metrics[sortBy] - a.metrics[sortBy]
  );

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700', className)}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Persona Effectiveness
          </h3>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                Sort by {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {sortedPersonas.map((persona, index) => (
          <PersonaRow
            key={persona.personaId}
            persona={persona}
            rank={index + 1}
            onClick={() => onPersonaClick?.(persona.personaId)}
          />
        ))}

        {sortedPersonas.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No persona data available
          </div>
        )}
      </div>
    </div>
  );
}

interface PersonaRowProps {
  persona: PersonaPerformanceData;
  rank: number;
  onClick?: () => void;
}

function PersonaRow({ persona, rank, onClick }: PersonaRowProps) {
  const { personaName, personaType, metrics, ranking, insights } = persona;

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800';
    if (rank === 2) return 'bg-gray-100 text-gray-800';
    if (rank === 3) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-50 text-gray-600';
  };

  const getTrendIcon = (movement: 'up' | 'down' | 'stable') => {
    switch (movement) {
      case 'up':
        return <span className="text-green-500">↑</span>;
      case 'down':
        return <span className="text-red-500">↓</span>;
      default:
        return <span className="text-gray-400">→</span>;
    }
  };

  return (
    <div
      className={cn(
        'p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        {/* Rank Badge */}
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
            getRankBadgeColor(rank)
          )}
        >
          {rank}
        </div>

        {/* Avatar Placeholder */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
          {personaName.charAt(0)}
        </div>

        {/* Persona Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900 dark:text-white truncate">
              {personaName}
            </h4>
            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
              {personaType}
            </span>
            {getTrendIcon(ranking.movement)}
          </div>

          {/* Metrics Row */}
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span>
              Quality: <strong>{metrics.qualityScore.toFixed(0)}</strong>
            </span>
            <span>
              Conv: <strong>{(metrics.conversionRate * 100).toFixed(1)}%</strong>
            </span>
            <span>
              Response: <strong>{(metrics.responseRate * 100).toFixed(1)}%</strong>
            </span>
          </div>
        </div>

        {/* Score */}
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {metrics.qualityScore.toFixed(0)}
          </div>
          <div className="text-xs text-gray-500">Score</div>
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="mt-3 ml-12 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
          {insights.slice(0, 2).map((insight) => (
            <div
              key={insight.id}
              className={cn(
                'text-xs py-1',
                insight.type === 'strength' && 'text-green-600',
                insight.type === 'weakness' && 'text-red-600',
                insight.type === 'opportunity' && 'text-blue-600',
                insight.type === 'recommendation' && 'text-purple-600'
              )}
            >
              {insight.type === 'strength' && '✓ '}
              {insight.type === 'weakness' && '! '}
              {insight.type === 'opportunity' && '→ '}
              {insight.type === 'recommendation' && '★ '}
              {insight.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PersonaEffectiveness;
