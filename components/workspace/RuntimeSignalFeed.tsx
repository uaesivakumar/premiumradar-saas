/**
 * Runtime Signal Feed Component
 * Sprint S271: Runtime Intelligence Feed
 * Features F3, F4, F5: Live Feed, Filtering & Sorting, Empty/Loading States
 *
 * Complete live signal feed with:
 * - Real-time signal display
 * - Filtering by type, priority, time
 * - Sorting by timestamp, priority, confidence
 * - Empty state and loading UX
 * - Auto-refresh indicator
 *
 * Architecture: Read-only, derived data only
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  RefreshCw,
  Filter,
  Clock,
  ArrowUpDown,
  X,
  Inbox,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  RuntimeSignalCard,
  RuntimeSignalCardSkeleton,
  type RuntimeSignal,
} from './RuntimeSignalCard';
import {
  useRuntimeSignals,
  SIGNAL_TYPE_OPTIONS,
  PRIORITY_OPTIONS,
  type RuntimeSignalsFilter,
  type RuntimeSignalsSort,
} from '@/lib/workspace/useRuntimeSignals';

// =============================================================================
// Types
// =============================================================================

interface RuntimeSignalFeedProps {
  vertical: string;
  subVertical: string;
  regions: string[];
  title?: string;
  maxDisplay?: number;
  compact?: boolean;
  showFilters?: boolean;
  onSignalSelect?: (signal: RuntimeSignal) => void;
}

// =============================================================================
// Component
// =============================================================================

export function RuntimeSignalFeed({
  vertical,
  subVertical,
  regions,
  title = 'Live Intelligence Feed',
  maxDisplay = 10,
  compact = false,
  showFilters = true,
  onSignalSelect,
}: RuntimeSignalFeedProps) {
  // Filter state
  const [filter, setFilter] = useState<RuntimeSignalsFilter>({
    limit: maxDisplay,
  });
  const [sort, setSort] = useState<RuntimeSignalsSort>({
    field: 'timestamp',
    direction: 'desc',
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Fetch signals
  const {
    signals,
    total,
    lastUpdated,
    isLoading,
    isError,
    error,
    refresh,
  } = useRuntimeSignals({
    vertical,
    subVertical,
    regions,
    filter,
    sort,
    refreshInterval: 30000, // 30s
    enabled: true,
  });

  // Filter handlers
  const handleTypeFilter = useCallback((types: string[]) => {
    setFilter((prev) => ({ ...prev, types: types.length > 0 ? types : undefined }));
  }, []);

  const handlePriorityFilter = useCallback((priorities: RuntimeSignal['priority'][]) => {
    setFilter((prev) => ({ ...prev, priorities: priorities.length > 0 ? priorities : undefined }));
  }, []);

  const handleTimeFilter = useCallback((since: string | undefined) => {
    setFilter((prev) => ({ ...prev, since }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilter({ limit: maxDisplay });
  }, [maxDisplay]);

  const handleSort = useCallback((field: RuntimeSignalsSort['field']) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  }, []);

  // Check if any filters are active
  const hasActiveFilters = !!(
    filter.types?.length ||
    filter.priorities?.length ||
    filter.since
  );

  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-neutral-900">{title}</h3>
            {total > 0 && (
              <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                {total} signals
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Last Updated Indicator */}
            {lastUpdated && (
              <div className="flex items-center gap-1 text-xs text-neutral-400">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>Updated {formatTimeAgo(lastUpdated)}</span>
              </div>
            )}

            {/* Refresh Button */}
            <button
              onClick={refresh}
              disabled={isLoading}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Filter Toggle */}
            {showFilters && (
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className={`
                  p-1.5 rounded transition-colors
                  ${showFilterPanel || hasActiveFilters
                    ? 'text-violet-600 bg-violet-50'
                    : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'}
                `}
                title="Filters"
              >
                <Filter className="w-4 h-4" />
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-violet-500 rounded-full" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        {showFilterPanel && (
          <FilterPanel
            filter={filter}
            sort={sort}
            onTypeFilter={handleTypeFilter}
            onPriorityFilter={handlePriorityFilter}
            onTimeFilter={handleTimeFilter}
            onSort={handleSort}
            onClear={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {isError ? (
          <ErrorState message={error?.message} onRetry={refresh} />
        ) : isLoading ? (
          <LoadingState count={5} compact={compact} />
        ) : signals.length === 0 ? (
          <EmptyState hasFilters={hasActiveFilters} onClearFilters={clearFilters} />
        ) : (
          <div className={`space-y-${compact ? '2' : '3'}`}>
            {signals.slice(0, maxDisplay).map((signal) => (
              <RuntimeSignalCard
                key={signal.id}
                signal={signal}
                compact={compact}
                onSelect={onSignalSelect}
              />
            ))}
          </div>
        )}

        {/* Load More */}
        {signals.length > maxDisplay && (
          <div className="mt-4 text-center">
            <button className="text-sm text-violet-600 hover:text-violet-800 font-medium">
              View all {total} signals
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Filter Panel
// =============================================================================

interface FilterPanelProps {
  filter: RuntimeSignalsFilter;
  sort: RuntimeSignalsSort;
  onTypeFilter: (types: string[]) => void;
  onPriorityFilter: (priorities: RuntimeSignal['priority'][]) => void;
  onTimeFilter: (since: string | undefined) => void;
  onSort: (field: RuntimeSignalsSort['field']) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

function FilterPanel({
  filter,
  sort,
  onTypeFilter,
  onPriorityFilter,
  onTimeFilter,
  onSort,
  onClear,
  hasActiveFilters,
}: FilterPanelProps) {
  return (
    <div className="mt-3 pt-3 border-t border-neutral-100">
      {/* Signal Type Chips */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-neutral-500">Signal Type</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SIGNAL_TYPE_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              active={filter.types?.includes(option.value) || false}
              onClick={() => {
                const current = filter.types || [];
                const next = current.includes(option.value)
                  ? current.filter((t) => t !== option.value)
                  : [...current, option.value];
                onTypeFilter(next);
              }}
            />
          ))}
        </div>
      </div>

      {/* Priority Chips */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-neutral-500">Priority</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRIORITY_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              active={filter.priorities?.includes(option.value as RuntimeSignal['priority']) || false}
              onClick={() => {
                const current = filter.priorities || [];
                const next = current.includes(option.value as RuntimeSignal['priority'])
                  ? current.filter((p) => p !== option.value)
                  : [...current, option.value as RuntimeSignal['priority']];
                onPriorityFilter(next);
              }}
              color={
                option.value === 'critical' ? 'red' :
                option.value === 'high' ? 'orange' :
                option.value === 'medium' ? 'yellow' : 'gray'
              }
            />
          ))}
        </div>
      </div>

      {/* Time Range */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-3 h-3 text-neutral-400" />
          <span className="text-xs font-medium text-neutral-500">Time Range</span>
        </div>
        <div className="flex gap-1.5">
          <FilterChip
            label="All Time"
            active={!filter.since}
            onClick={() => onTimeFilter(undefined)}
          />
          <FilterChip
            label="Last 24h"
            active={filter.since === getTimeAgo(24)}
            onClick={() => onTimeFilter(getTimeAgo(24))}
          />
          <FilterChip
            label="Last 7d"
            active={filter.since === getTimeAgo(168)}
            onClick={() => onTimeFilter(getTimeAgo(168))}
          />
          <FilterChip
            label="Last 30d"
            active={filter.since === getTimeAgo(720)}
            onClick={() => onTimeFilter(getTimeAgo(720))}
          />
        </div>
      </div>

      {/* Sort Options */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <ArrowUpDown className="w-3 h-3 text-neutral-400" />
          <span className="text-xs font-medium text-neutral-500">Sort By</span>
        </div>
        <div className="flex gap-1.5">
          <SortChip
            label="Time"
            field="timestamp"
            currentSort={sort}
            onClick={() => onSort('timestamp')}
          />
          <SortChip
            label="Priority"
            field="priority"
            currentSort={sort}
            onClick={() => onSort('priority')}
          />
          <SortChip
            label="Confidence"
            field="confidence"
            currentSort={sort}
            onClick={() => onSort('confidence')}
          />
          <SortChip
            label="Company"
            field="company"
            currentSort={sort}
            onClick={() => onSort('company')}
          />
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="text-xs text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          Clear all filters
        </button>
      )}
    </div>
  );
}

// =============================================================================
// Filter/Sort Chips
// =============================================================================

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: 'red' | 'orange' | 'yellow' | 'gray';
}

function FilterChip({ label, active, onClick, color }: FilterChipProps) {
  const colorMap = {
    red: 'bg-red-100 text-red-700 border-red-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    gray: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  };

  return (
    <button
      onClick={onClick}
      className={`
        px-2 py-1 text-xs rounded-md border transition-colors
        ${active
          ? color ? colorMap[color] : 'bg-violet-100 text-violet-700 border-violet-200'
          : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'}
      `}
    >
      {label}
    </button>
  );
}

interface SortChipProps {
  label: string;
  field: RuntimeSignalsSort['field'];
  currentSort: RuntimeSignalsSort;
  onClick: () => void;
}

function SortChip({ label, field, currentSort, onClick }: SortChipProps) {
  const isActive = currentSort.field === field;

  return (
    <button
      onClick={onClick}
      className={`
        px-2 py-1 text-xs rounded-md border transition-colors flex items-center gap-1
        ${isActive
          ? 'bg-violet-100 text-violet-700 border-violet-200'
          : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'}
      `}
    >
      {label}
      {isActive && (
        <span className="text-[10px]">
          {currentSort.direction === 'desc' ? '↓' : '↑'}
        </span>
      )}
    </button>
  );
}

// =============================================================================
// States
// =============================================================================

function LoadingState({ count, compact }: { count: number; compact: boolean }) {
  return (
    <div className={`space-y-${compact ? '2' : '3'}`}>
      {Array.from({ length: count }).map((_, i) => (
        <RuntimeSignalCardSkeleton key={i} compact={compact} />
      ))}
    </div>
  );
}

function EmptyState({
  hasFilters,
  onClearFilters,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
}) {
  return (
    <div className="py-12 text-center">
      <Inbox className="w-12 h-12 mx-auto text-neutral-300 mb-4" />
      <h4 className="text-neutral-900 font-medium mb-1">
        {hasFilters ? 'No matching signals' : 'No signals yet'}
      </h4>
      <p className="text-sm text-neutral-500 mb-4">
        {hasFilters
          ? 'Try adjusting your filters to see more results.'
          : 'Intelligence signals will appear here as they are detected.'}
      </p>
      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="text-sm text-violet-600 hover:text-violet-800 font-medium"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <div className="py-12 text-center">
      <AlertCircle className="w-12 h-12 mx-auto text-red-300 mb-4" />
      <h4 className="text-neutral-900 font-medium mb-1">Failed to load signals</h4>
      <p className="text-sm text-neutral-500 mb-4">
        {message || 'Something went wrong. Please try again.'}
      </p>
      <button
        onClick={onRetry}
        className="text-sm text-violet-600 hover:text-violet-800 font-medium"
      >
        Retry
      </button>
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
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  return `${Math.floor(diffMins / 60)}h ago`;
}

function getTimeAgo(hours: number): string {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
}

export default RuntimeSignalFeed;
