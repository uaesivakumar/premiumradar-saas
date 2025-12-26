/**
 * Opportunity Blockers Component
 * Sprint S272: Opportunity Strength Scoring
 * Feature F1: Blockers List Component
 *
 * Displays factors blocking opportunity success:
 * - Deterministic blockers from scoring engine
 * - Severity levels
 * - Clear, explainable factors
 *
 * Architecture: Read-only, derived data only, no LLM opinions
 */

'use client';

import React from 'react';
import {
  AlertTriangle,
  Clock,
  XCircle,
  AlertCircle,
  Shield,
  TrendingDown,
  Users,
  Building2,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface Blocker {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: number; // Score reduction (negative number)
  source: string;
  detectedAt: string;
}

interface OpportunityBlockersProps {
  blockers: Blocker[];
  isLoading?: boolean;
  maxDisplay?: number;
  onBlockerClick?: (blocker: Blocker) => void;
}

// =============================================================================
// Blocker Type Configuration
// =============================================================================

const BLOCKER_TYPE_CONFIG: Record<string, { icon: typeof AlertTriangle; color: string }> = {
  'recent-switch': { icon: Clock, color: 'text-amber-600' },
  'competitor-lock': { icon: Shield, color: 'text-red-600' },
  'budget-freeze': { icon: XCircle, color: 'text-red-600' },
  'downsizing': { icon: TrendingDown, color: 'text-orange-600' },
  'leadership-change': { icon: Users, color: 'text-yellow-600' },
  'merger-pending': { icon: Building2, color: 'text-purple-600' },
  'contract-active': { icon: Shield, color: 'text-blue-600' },
};

const DEFAULT_BLOCKER_CONFIG = { icon: AlertTriangle, color: 'text-neutral-600' };

const SEVERITY_CONFIG: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700',
  },
  high: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    badge: 'bg-orange-100 text-orange-700',
  },
  medium: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    badge: 'bg-yellow-100 text-yellow-700',
  },
  low: {
    bg: 'bg-neutral-50',
    border: 'border-neutral-200',
    text: 'text-neutral-600',
    badge: 'bg-neutral-100 text-neutral-600',
  },
};

// =============================================================================
// Component
// =============================================================================

export function OpportunityBlockers({
  blockers,
  isLoading = false,
  maxDisplay = 5,
  onBlockerClick,
}: OpportunityBlockersProps) {
  if (isLoading) {
    return <BlockersSkeleton count={3} />;
  }

  if (blockers.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 mx-auto mb-3 flex items-center justify-center">
            <Shield className="w-6 h-6 text-emerald-600" />
          </div>
          <h4 className="font-medium text-neutral-900 mb-1">No Blockers Detected</h4>
          <p className="text-sm text-neutral-500">
            This opportunity has no blocking factors identified.
          </p>
        </div>
      </div>
    );
  }

  // Sort by severity
  const sortedBlockers = [...blockers].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });

  const displayedBlockers = sortedBlockers.slice(0, maxDisplay);
  const totalImpact = blockers.reduce((sum, b) => sum + b.impact, 0);

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <h3 className="font-semibold text-neutral-900">Blockers</h3>
          <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
            {blockers.length}
          </span>
        </div>
        <div className="text-sm font-medium text-red-600">
          {totalImpact} pts impact
        </div>
      </div>

      {/* Blockers List */}
      <div className="divide-y divide-neutral-100">
        {displayedBlockers.map((blocker) => (
          <BlockerRow
            key={blocker.id}
            blocker={blocker}
            onClick={onBlockerClick ? () => onBlockerClick(blocker) : undefined}
          />
        ))}
      </div>

      {/* Show More */}
      {blockers.length > maxDisplay && (
        <div className="px-4 py-2 bg-neutral-50 text-center">
          <button className="text-xs text-violet-600 hover:text-violet-800 font-medium">
            View all {blockers.length} blockers
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Blocker Row
// =============================================================================

function BlockerRow({
  blocker,
  onClick,
}: {
  blocker: Blocker;
  onClick?: () => void;
}) {
  const typeConfig = BLOCKER_TYPE_CONFIG[blocker.type] || DEFAULT_BLOCKER_CONFIG;
  const severityConfig = SEVERITY_CONFIG[blocker.severity];
  const Icon = typeConfig.icon;

  return (
    <div
      onClick={onClick}
      className={`
        px-4 py-3 ${severityConfig.bg} ${onClick ? 'cursor-pointer hover:bg-opacity-75' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${typeConfig.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-neutral-900">{blocker.title}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${severityConfig.badge}`}>
              {blocker.severity}
            </span>
          </div>
          <p className="text-xs text-neutral-600 line-clamp-2">{blocker.description}</p>
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-neutral-500">
            <span>Impact: {blocker.impact} pts</span>
            <span>Source: {blocker.source}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Skeleton
// =============================================================================

function BlockersSkeleton({ count }: { count: number }) {
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

export default OpportunityBlockers;
