/**
 * Runtime Signal Card Component
 * Sprint S271: Runtime Intelligence Feed
 * Feature F1: Signal Card Rendering
 *
 * Displays a single intelligence signal with:
 * - Signal type icon and color coding
 * - Priority indicator
 * - Timestamp with relative time
 * - Source clarity
 * - Confidence score
 *
 * Architecture: Read-only, derived data only
 */

'use client';

import React from 'react';
import {
  TrendingUp,
  Users,
  Building2,
  Globe,
  DollarSign,
  Briefcase,
  Award,
  UserPlus,
  Clock,
  MapPin,
  AlertCircle,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface RuntimeSignal {
  id: string;
  type: string;
  title: string;
  description: string;
  companyName: string;
  companyId?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  confidence: number; // 0-1
  source: string;
  timestamp: string;
  region?: string;
  metadata?: Record<string, unknown>;
}

interface RuntimeSignalCardProps {
  signal: RuntimeSignal;
  compact?: boolean;
  onSelect?: (signal: RuntimeSignal) => void;
}

// =============================================================================
// Signal Type Configuration
// =============================================================================

const SIGNAL_TYPE_CONFIG: Record<string, {
  icon: typeof TrendingUp;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}> = {
  'hiring-expansion': {
    icon: Users,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    label: 'Hiring Expansion',
  },
  'headcount-jump': {
    icon: TrendingUp,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    label: 'Headcount Jump',
  },
  'office-opening': {
    icon: Building2,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    label: 'Office Opening',
  },
  'market-entry': {
    icon: Globe,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    label: 'Market Entry',
  },
  'funding-round': {
    icon: DollarSign,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    label: 'Funding Round',
  },
  'project-award': {
    icon: Award,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    label: 'Project Award',
  },
  'subsidiary-creation': {
    icon: Briefcase,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    label: 'Subsidiary Created',
  },
  'leadership-hiring': {
    icon: UserPlus,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    label: 'Leadership Hire',
  },
};

const DEFAULT_CONFIG = {
  icon: AlertCircle,
  color: 'text-neutral-600',
  bgColor: 'bg-neutral-50',
  borderColor: 'border-neutral-200',
  label: 'Signal',
};

const PRIORITY_CONFIG: Record<string, { color: string; bg: string }> = {
  critical: { color: 'text-red-700', bg: 'bg-red-100' },
  high: { color: 'text-orange-700', bg: 'bg-orange-100' },
  medium: { color: 'text-yellow-700', bg: 'bg-yellow-100' },
  low: { color: 'text-neutral-600', bg: 'bg-neutral-100' },
};

// =============================================================================
// Component
// =============================================================================

export function RuntimeSignalCard({
  signal,
  compact = false,
  onSelect,
}: RuntimeSignalCardProps) {
  const config = SIGNAL_TYPE_CONFIG[signal.type] || DEFAULT_CONFIG;
  const priorityConfig = PRIORITY_CONFIG[signal.priority] || PRIORITY_CONFIG.medium;
  const Icon = config.icon;

  const handleClick = () => {
    if (onSelect) {
      onSelect(signal);
    }
  };

  if (compact) {
    return (
      <div
        onClick={handleClick}
        className={`
          flex items-center gap-3 p-3 rounded-lg border transition-colors
          ${config.bgColor} ${config.borderColor}
          ${onSelect ? 'cursor-pointer hover:shadow-sm' : ''}
        `}
      >
        <Icon className={`w-4 h-4 ${config.color} flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-900 truncate">
              {signal.companyName}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${priorityConfig.bg} ${priorityConfig.color}`}>
              {signal.priority}
            </span>
          </div>
          <p className="text-xs text-neutral-500 truncate">{signal.title}</p>
        </div>
        <span className="text-[10px] text-neutral-400 flex-shrink-0">
          {formatTimeAgo(signal.timestamp)}
        </span>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`
        rounded-lg border transition-all
        ${config.bgColor} ${config.borderColor}
        ${onSelect ? 'cursor-pointer hover:shadow-md hover:scale-[1.01]' : ''}
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-neutral-200/50">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg bg-white/50 ${config.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-medium ${config.color}`}>
                {config.label}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${priorityConfig.bg} ${priorityConfig.color}`}>
                {signal.priority}
              </span>
            </div>
            <h4 className="font-semibold text-neutral-900">{signal.companyName}</h4>
            <p className="text-sm text-neutral-700 mt-1">{signal.title}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      {signal.description && (
        <div className="px-4 py-3 border-b border-neutral-200/50">
          <p className="text-sm text-neutral-600 line-clamp-2">{signal.description}</p>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2.5 flex items-center justify-between text-xs text-neutral-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatTimeAgo(signal.timestamp)}</span>
          </div>
          {signal.region && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{signal.region}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-neutral-400">Source: {signal.source}</span>
          <span className={`
            px-1.5 py-0.5 rounded
            ${signal.confidence >= 0.8 ? 'bg-emerald-100 text-emerald-700' :
              signal.confidence >= 0.5 ? 'bg-yellow-100 text-yellow-700' :
              'bg-neutral-100 text-neutral-600'}
          `}>
            {Math.round(signal.confidence * 100)}% conf
          </span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Skeleton
// =============================================================================

export function RuntimeSignalCardSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 bg-neutral-50 animate-pulse">
        <div className="w-4 h-4 bg-neutral-200 rounded" />
        <div className="flex-1">
          <div className="w-32 h-4 bg-neutral-200 rounded mb-1" />
          <div className="w-24 h-3 bg-neutral-200 rounded" />
        </div>
        <div className="w-12 h-3 bg-neutral-200 rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 animate-pulse">
      <div className="p-4 border-b border-neutral-200/50">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-neutral-200 rounded-lg" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-20 h-3 bg-neutral-200 rounded" />
              <div className="w-12 h-3 bg-neutral-200 rounded" />
            </div>
            <div className="w-40 h-5 bg-neutral-200 rounded mb-1" />
            <div className="w-56 h-4 bg-neutral-200 rounded" />
          </div>
        </div>
      </div>
      <div className="px-4 py-3 border-b border-neutral-200/50">
        <div className="w-full h-4 bg-neutral-200 rounded mb-1" />
        <div className="w-3/4 h-4 bg-neutral-200 rounded" />
      </div>
      <div className="px-4 py-2.5 flex items-center justify-between">
        <div className="w-24 h-3 bg-neutral-200 rounded" />
        <div className="w-20 h-3 bg-neutral-200 rounded" />
      </div>
    </div>
  );
}

// =============================================================================
// Utilities
// =============================================================================

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default RuntimeSignalCard;
