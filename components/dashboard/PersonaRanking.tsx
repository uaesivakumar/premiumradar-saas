/**
 * Persona Ranking Component
 * Sprint S54: Vertical Dashboards
 *
 * Displays ranked personas by performance metrics.
 */

import React from 'react';
import type { PersonaPerformance } from '../../lib/dashboard';

interface PersonaRankingProps {
  personas: PersonaPerformance[];
  loading?: boolean;
  maxDisplay?: number;
}

export function PersonaRanking({
  personas,
  loading = false,
  maxDisplay = 5,
}: PersonaRankingProps) {
  if (loading) {
    return <RankingSkeleton count={maxDisplay} />;
  }

  if (personas.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No persona data available
      </div>
    );
  }

  const displayedPersonas = personas.slice(0, maxDisplay);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Persona Ranking</h3>

      <div className="space-y-3">
        {displayedPersonas.map((persona) => (
          <PersonaCard key={persona.personaId} persona={persona} />
        ))}
      </div>

      {personas.length > maxDisplay && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800">
            View all {personas.length} personas
          </button>
        </div>
      )}
    </div>
  );
}

interface PersonaCardProps {
  persona: PersonaPerformance;
}

function PersonaCard({ persona }: PersonaCardProps) {
  const trendIcon = {
    improving: '📈',
    declining: '📉',
    stable: '➡️',
  }[persona.trend];

  const trendColor = {
    improving: 'text-green-600',
    declining: 'text-red-600',
    stable: 'text-gray-500',
  }[persona.trend];

  const rankBadge = getRankBadge(persona.rank);

  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-shrink-0 w-8 text-center">
        {rankBadge}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 truncate">{persona.personaName}</span>
          <span className="text-xs px-2 py-0.5 bg-gray-200 rounded-full text-gray-600">
            {persona.personaType}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          <span>Response: {persona.metrics.responseRate.toFixed(1)}%</span>
          <span>Convert: {persona.metrics.conversionRate.toFixed(1)}%</span>
          {persona.metrics.avgDealSize > 0 && (
            <span>${formatNumber(persona.metrics.avgDealSize)}</span>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 flex items-center gap-2">
        <span className={`text-sm ${trendColor}`}>{trendIcon}</span>
        <div className="text-right">
          <div className="text-sm font-semibold text-gray-900">
            {persona.metrics.qualityScore.toFixed(0)}
          </div>
          <div className="text-xs text-gray-500">score</div>
        </div>
      </div>
    </div>
  );
}

function getRankBadge(rank: number): React.ReactNode {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return <span className="text-lg font-bold text-gray-400">#{rank}</span>;
}

function RankingSkeleton({ count }: { count: number }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="w-32 h-6 bg-gray-200 rounded mb-4" />
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="w-32 h-4 bg-gray-200 rounded mb-1" />
              <div className="w-24 h-3 bg-gray-200 rounded" />
            </div>
            <div className="w-12 h-8 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function formatNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
}

export default PersonaRanking;
