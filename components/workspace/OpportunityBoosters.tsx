/**
 * Opportunity Boosters Component
 * Sprint S272: Opportunity Strength Scoring
 * Feature F6: Boosters List Component
 *
 * Displays factors boosting opportunity success:
 * - Deterministic boosters from scoring engine
 * - Strength levels
 * - Clear, explainable factors
 *
 * Architecture: Read-only, derived data only, no LLM opinions
 */

'use client';

import React from 'react';
import {
  Zap,
  TrendingUp,
  Clock,
  Users,
  Star,
  Target,
  Award,
  DollarSign,
  Building2,
  Rocket,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface Booster {
  id: string;
  type: string;
  strength: 'strong' | 'moderate' | 'mild';
  title: string;
  description: string;
  impact: number; // Score boost (positive number)
  source: string;
  detectedAt: string;
}

interface OpportunityBoostersProps {
  boosters: Booster[];
  isLoading?: boolean;
  maxDisplay?: number;
  onBoosterClick?: (booster: Booster) => void;
}

// =============================================================================
// Booster Type Configuration
// =============================================================================

const BOOSTER_TYPE_CONFIG: Record<string, { icon: typeof Zap; color: string }> = {
  'rapid-growth': { icon: TrendingUp, color: 'text-emerald-600' },
  'hiring-surge': { icon: Users, color: 'text-blue-600' },
  'funding-recent': { icon: DollarSign, color: 'text-amber-600' },
  'expansion-announced': { icon: Building2, color: 'text-violet-600' },
  'new-leadership': { icon: Star, color: 'text-pink-600' },
  'market-entry': { icon: Rocket, color: 'text-cyan-600' },
  'project-won': { icon: Award, color: 'text-orange-600' },
  'timing-optimal': { icon: Clock, color: 'text-green-600' },
  'decision-maker-access': { icon: Target, color: 'text-indigo-600' },
};

const DEFAULT_BOOSTER_CONFIG = { icon: Zap, color: 'text-neutral-600' };

const STRENGTH_CONFIG: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  strong: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  moderate: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
  },
  mild: {
    bg: 'bg-neutral-50',
    border: 'border-neutral-200',
    text: 'text-neutral-600',
    badge: 'bg-neutral-100 text-neutral-600',
  },
};

// =============================================================================
// Component
// =============================================================================

export function OpportunityBoosters({
  boosters,
  isLoading = false,
  maxDisplay = 5,
  onBoosterClick,
}: OpportunityBoostersProps) {
  if (isLoading) {
    return <BoostersSkeleton count={3} />;
  }

  if (boosters.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-neutral-100 mx-auto mb-3 flex items-center justify-center">
            <Zap className="w-6 h-6 text-neutral-400" />
          </div>
          <h4 className="font-medium text-neutral-900 mb-1">No Boosters Detected</h4>
          <p className="text-sm text-neutral-500">
            No positive signals identified for this opportunity yet.
          </p>
        </div>
      </div>
    );
  }

  // Sort by strength
  const sortedBoosters = [...boosters].sort((a, b) => {
    const order = { strong: 0, moderate: 1, mild: 2 };
    return order[a.strength] - order[b.strength];
  });

  const displayedBoosters = sortedBoosters.slice(0, maxDisplay);
  const totalImpact = boosters.reduce((sum, b) => sum + b.impact, 0);

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-500" />
          <h3 className="font-semibold text-neutral-900">Boosters</h3>
          <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
            {boosters.length}
          </span>
        </div>
        <div className="text-sm font-medium text-emerald-600">
          +{totalImpact} pts impact
        </div>
      </div>

      {/* Boosters List */}
      <div className="divide-y divide-neutral-100">
        {displayedBoosters.map((booster) => (
          <BoosterRow
            key={booster.id}
            booster={booster}
            onClick={onBoosterClick ? () => onBoosterClick(booster) : undefined}
          />
        ))}
      </div>

      {/* Show More */}
      {boosters.length > maxDisplay && (
        <div className="px-4 py-2 bg-neutral-50 text-center">
          <button className="text-xs text-violet-600 hover:text-violet-800 font-medium">
            View all {boosters.length} boosters
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Booster Row
// =============================================================================

function BoosterRow({
  booster,
  onClick,
}: {
  booster: Booster;
  onClick?: () => void;
}) {
  const typeConfig = BOOSTER_TYPE_CONFIG[booster.type] || DEFAULT_BOOSTER_CONFIG;
  const strengthConfig = STRENGTH_CONFIG[booster.strength];
  const Icon = typeConfig.icon;

  return (
    <div
      onClick={onClick}
      className={`
        px-4 py-3 ${strengthConfig.bg} ${onClick ? 'cursor-pointer hover:bg-opacity-75' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${typeConfig.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-neutral-900">{booster.title}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${strengthConfig.badge}`}>
              {booster.strength}
            </span>
          </div>
          <p className="text-xs text-neutral-600 line-clamp-2">{booster.description}</p>
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-neutral-500">
            <span className="text-emerald-600">+{booster.impact} pts</span>
            <span>Source: {booster.source}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Skeleton
// =============================================================================

function BoostersSkeleton({ count }: { count: number }) {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 animate-pulse">
      <div className="px-4 py-3 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div className="w-24 h-5 bg-neutral-200 rounded" />
          <div className="w-16 h-4 bg-neutral-200 rounded" />
        </div>
      </div>
      <div className="divide-y divide-neutral-100">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 bg-neutral-200 rounded" />
              <div className="flex-1">
                <div className="w-40 h-4 bg-neutral-200 rounded mb-1" />
                <div className="w-full h-3 bg-neutral-200 rounded mb-1" />
                <div className="w-24 h-2 bg-neutral-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OpportunityBoosters;
