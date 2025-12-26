/**
 * Opportunity Score Card Component
 * Sprint S272: Opportunity Strength Scoring
 * Feature F4: Opportunity Score Card
 *
 * Displays overall opportunity score with:
 * - Total score visualization
 * - QTLE component breakdown
 * - Quick strength indicator
 *
 * Architecture: Read-only, deterministic scoring, explainable math
 */

'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface OpportunityScore {
  total: number; // 0-100
  quality: number;
  timing: number;
  likelihood: number;
  engagement: number;
  trend?: 'up' | 'down' | 'stable';
  trendDelta?: number;
  lastUpdated?: string;
}

interface OpportunityScoreCardProps {
  score: OpportunityScore | null;
  companyName?: string;
  compact?: boolean;
  showBreakdown?: boolean;
  isLoading?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function OpportunityScoreCard({
  score,
  companyName,
  compact = false,
  showBreakdown = true,
  isLoading = false,
}: OpportunityScoreCardProps) {
  // Handle loading state
  if (isLoading) {
    return <OpportunityScoreCardSkeleton compact={compact} />;
  }

  // Handle null score
  if (!score) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-neutral-100 mx-auto mb-3 flex items-center justify-center">
            <span className="text-2xl font-bold text-neutral-300">?</span>
          </div>
          <h4 className="font-medium text-neutral-900 mb-1">No Score Available</h4>
          <p className="text-sm text-neutral-500">
            Select a company to see opportunity scoring.
          </p>
        </div>
      </div>
    );
  }

  const strength = getStrengthLabel(score.total);
  const TrendIcon = score.trend === 'up' ? TrendingUp :
                    score.trend === 'down' ? TrendingDown : Minus;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200">
        <ScoreCircle score={score.total} size="sm" />
        <div className="flex-1 min-w-0">
          {companyName && (
            <p className="text-sm font-medium text-neutral-900 truncate">{companyName}</p>
          )}
          <p className={`text-xs ${strength.color}`}>{strength.label}</p>
        </div>
        {score.trend && (
          <div className={`flex items-center gap-1 ${getTrendColor(score.trend)}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            {score.trendDelta !== undefined && (
              <span className="text-xs">{score.trendDelta > 0 ? '+' : ''}{score.trendDelta}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-neutral-900">
              {companyName || 'Opportunity Score'}
            </h3>
            <p className={`text-sm ${strength.color}`}>{strength.label}</p>
          </div>
          <div className="flex items-center gap-3">
            {score.trend && (
              <div className={`flex items-center gap-1 ${getTrendColor(score.trend)}`}>
                <TrendIcon className="w-4 h-4" />
                {score.trendDelta !== undefined && (
                  <span className="text-sm font-medium">
                    {score.trendDelta > 0 ? '+' : ''}{score.trendDelta}
                  </span>
                )}
              </div>
            )}
            <ScoreCircle score={score.total} size="lg" />
          </div>
        </div>
      </div>

      {/* QTLE Breakdown */}
      {showBreakdown && (
        <div className="p-4">
          <div className="grid grid-cols-4 gap-3">
            <ScoreComponent label="Quality" value={score.quality} letter="Q" color="violet" />
            <ScoreComponent label="Timing" value={score.timing} letter="T" color="blue" />
            <ScoreComponent label="Likelihood" value={score.likelihood} letter="L" color="emerald" />
            <ScoreComponent label="Engagement" value={score.engagement} letter="E" color="amber" />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 bg-neutral-50 text-xs text-neutral-500">
        {score.lastUpdated ? `Last calculated: ${formatTime(score.lastUpdated)}` : 'Derived from signals'}
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function ScoreCircle({ score, size }: { score: number; size: 'sm' | 'lg' }) {
  const strength = getStrengthLabel(score);
  const sizeClass = size === 'sm' ? 'w-10 h-10 text-lg' : 'w-14 h-14 text-2xl';

  return (
    <div
      className={`
        ${sizeClass} rounded-full flex items-center justify-center font-bold
        ${strength.bg} ${strength.color}
      `}
    >
      {Math.round(score)}
    </div>
  );
}

function ScoreComponent({
  label,
  value,
  letter,
  color,
}: {
  label: string;
  value: number;
  letter: string;
  color: 'violet' | 'blue' | 'emerald' | 'amber';
}) {
  const colorClasses = {
    violet: { bg: 'bg-violet-100', text: 'text-violet-600', bar: 'bg-violet-500' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', bar: 'bg-blue-500' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', bar: 'bg-emerald-500' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600', bar: 'bg-amber-500' },
  };

  const classes = colorClasses[color];

  return (
    <div className="text-center">
      <div
        className={`
          w-8 h-8 rounded-full mx-auto mb-1.5 flex items-center justify-center
          ${classes.bg} ${classes.text} text-sm font-bold
        `}
      >
        {letter}
      </div>
      <div className="text-sm font-semibold text-neutral-900">{Math.round(value)}</div>
      <div className="text-[10px] text-neutral-500">{label}</div>
      <div className="mt-1 h-1 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${classes.bar} transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// Skeleton
// =============================================================================

export function OpportunityScoreCardSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200 animate-pulse">
        <div className="w-10 h-10 rounded-full bg-neutral-200" />
        <div className="flex-1">
          <div className="w-24 h-4 bg-neutral-200 rounded mb-1" />
          <div className="w-16 h-3 bg-neutral-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 animate-pulse">
      <div className="p-4 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="w-32 h-5 bg-neutral-200 rounded mb-2" />
            <div className="w-20 h-4 bg-neutral-200 rounded" />
          </div>
          <div className="w-14 h-14 rounded-full bg-neutral-200" />
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center">
              <div className="w-8 h-8 rounded-full bg-neutral-200 mx-auto mb-1.5" />
              <div className="w-8 h-4 bg-neutral-200 rounded mx-auto mb-1" />
              <div className="w-12 h-3 bg-neutral-200 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Utilities
// =============================================================================

function getStrengthLabel(score: number): { label: string; color: string; bg: string } {
  if (score >= 80) return { label: 'Strong', color: 'text-emerald-600', bg: 'bg-emerald-100' };
  if (score >= 60) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
  if (score >= 40) return { label: 'Fair', color: 'text-amber-600', bg: 'bg-amber-100' };
  return { label: 'Weak', color: 'text-red-600', bg: 'bg-red-100' };
}

function getTrendColor(trend: 'up' | 'down' | 'stable'): string {
  if (trend === 'up') return 'text-emerald-600';
  if (trend === 'down') return 'text-red-600';
  return 'text-neutral-400';
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default OpportunityScoreCard;
