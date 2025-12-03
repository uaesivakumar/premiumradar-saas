/**
 * Intelligence Signal List Component
 * Sprint S54: Vertical Dashboards
 *
 * Displays a list of intelligence signals with filtering.
 */

import React, { useState, useMemo } from 'react';
import type { IntelligenceSignal } from '../../lib/dashboard';

interface IntelligenceSignalListProps {
  signals: IntelligenceSignal[];
  loading?: boolean;
  maxDisplay?: number;
  showFilters?: boolean;
}

export function IntelligenceSignalList({
  signals,
  loading = false,
  maxDisplay = 10,
  showFilters = true,
}: IntelligenceSignalListProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredSignals = useMemo(() => {
    return signals.filter((signal) => {
      if (categoryFilter !== 'all' && signal.category !== categoryFilter) return false;
      if (priorityFilter !== 'all' && signal.priority !== priorityFilter) return false;
      return true;
    });
  }, [signals, categoryFilter, priorityFilter]);

  const displayedSignals = filteredSignals.slice(0, maxDisplay);

  if (loading) {
    return <SignalListSkeleton count={5} />;
  }

  if (signals.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No intelligence signals available
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Intelligence Signals</h3>
        <span className="text-sm text-gray-500">{filteredSignals.length} signals</span>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          <FilterChip
            label="All"
            active={categoryFilter === 'all'}
            onClick={() => setCategoryFilter('all')}
          />
          <FilterChip
            label="Opportunity"
            active={categoryFilter === 'opportunity'}
            onClick={() => setCategoryFilter('opportunity')}
            color="green"
          />
          <FilterChip
            label="Risk"
            active={categoryFilter === 'risk'}
            onClick={() => setCategoryFilter('risk')}
            color="red"
          />
          <FilterChip
            label="Insight"
            active={categoryFilter === 'insight'}
            onClick={() => setCategoryFilter('insight')}
            color="blue"
          />
          <FilterChip
            label="Action"
            active={categoryFilter === 'action'}
            onClick={() => setCategoryFilter('action')}
            color="orange"
          />
        </div>
      )}

      <div className="space-y-3">
        {displayedSignals.map((signal) => (
          <SignalCard key={signal.id} signal={signal} />
        ))}
      </div>

      {filteredSignals.length > maxDisplay && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800">
            View all {filteredSignals.length} signals
          </button>
        </div>
      )}
    </div>
  );
}

interface SignalCardProps {
  signal: IntelligenceSignal;
}

function SignalCard({ signal }: SignalCardProps) {
  const categoryStyles = {
    opportunity: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: '💡' },
    risk: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: '⚠️' },
    insight: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: '🔍' },
    action: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: '⚡' },
  };

  const priorityStyles = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-gray-100 text-gray-800',
  };

  const style = categoryStyles[signal.category];

  return (
    <div className={`p-4 rounded-lg border ${style.bg} ${style.border}`}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{style.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-medium ${style.text}`}>{signal.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${priorityStyles[signal.priority]}`}>
              {signal.priority}
            </span>
            {signal.actionable && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Actionable
              </span>
            )}
          </div>
          {signal.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{signal.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>Confidence: {(signal.confidence * 100).toFixed(0)}%</span>
            <span>Source: {signal.source}</span>
            <span>{formatTimeAgo(signal.timestamp)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: 'green' | 'red' | 'blue' | 'orange';
}

function FilterChip({ label, active, onClick, color }: FilterChipProps) {
  const colorStyles = {
    green: 'bg-green-100 text-green-800 border-green-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
  };

  const baseStyle = active
    ? color
      ? colorStyles[color]
      : 'bg-gray-900 text-white border-gray-900'
    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50';

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-sm rounded-full border transition-colors ${baseStyle}`}
    >
      {label}
    </button>
  );
}

function SignalListSkeleton({ count }: { count: number }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-40 h-6 bg-gray-200 rounded" />
        <div className="w-16 h-4 bg-gray-200 rounded" />
      </div>
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-20 h-6 bg-gray-200 rounded-full" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded" />
              <div className="flex-1">
                <div className="w-48 h-4 bg-gray-200 rounded mb-2" />
                <div className="w-full h-3 bg-gray-200 rounded mb-2" />
                <div className="w-32 h-3 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default IntelligenceSignalList;
