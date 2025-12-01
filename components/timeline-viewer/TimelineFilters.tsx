/**
 * Timeline Filters Component
 * Sprint S51: Timeline Viewer
 *
 * Filter and search controls for the timeline.
 */
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import type { TimelineFilters as Filters, StepTypeFilter, StepStatusFilter, TimelineItem } from '@/lib/timeline-viewer';

interface TimelineFiltersProps {
  filters: Filters;
  onFilterChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onReset: () => void;
  searchResults: TimelineItem[];
  searchIndex: number;
  onNextResult: () => void;
  onPrevResult: () => void;
  totalItems: number;
  filteredCount: number;
}

const STEP_TYPE_OPTIONS: { value: StepTypeFilter; label: string; icon: string }[] = [
  { value: 'all', label: 'All Types', icon: '🔲' },
  { value: 'ai', label: 'AI Steps', icon: '🤖' },
  { value: 'action', label: 'Actions', icon: '⚡' },
  { value: 'decision', label: 'Decisions', icon: '🔀' },
  { value: 'enrichment', label: 'Enrichment', icon: '📊' },
  { value: 'checkpoint', label: 'Checkpoints', icon: '✋' },
];

const STATUS_OPTIONS: { value: StepStatusFilter; label: string; color: string }[] = [
  { value: 'all', label: 'All Status', color: 'bg-gray-400' },
  { value: 'success', label: 'Success', color: 'bg-green-400' },
  { value: 'error', label: 'Error', color: 'bg-red-400' },
  { value: 'running', label: 'Running', color: 'bg-blue-400' },
  { value: 'waiting', label: 'Waiting', color: 'bg-yellow-400' },
  { value: 'skipped', label: 'Skipped', color: 'bg-gray-300' },
];

export function TimelineFilters({
  filters,
  onFilterChange,
  onReset,
  searchResults,
  searchIndex,
  onNextResult,
  onPrevResult,
  totalItems,
  filteredCount,
}: TimelineFiltersProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        searchInputRef.current?.blur();
        onFilterChange('searchQuery', '');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onFilterChange]);

  // Handle search input
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange('searchQuery', e.target.value);
  }, [onFilterChange]);

  // Handle search navigation
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onPrevResult();
      } else {
        onNextResult();
      }
    }
  }, [onNextResult, onPrevResult]);

  const hasActiveFilters =
    filters.stepType !== 'all' ||
    filters.stepStatus !== 'all' ||
    filters.searchQuery !== '' ||
    filters.showOnlyBottlenecks ||
    filters.showOnlyAI ||
    filters.showOnlyErrors;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Search bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search steps... (⌘F)"
          value={filters.searchQuery}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
          className={cn(
            'w-full pl-10 pr-24 py-2 text-sm border border-gray-200 rounded-lg',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
          )}
        />
        {/* Search results count and navigation */}
        {filters.searchQuery && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
            {searchResults.length > 0 ? (
              <>
                <span className="text-xs text-gray-500">
                  {searchIndex + 1}/{searchResults.length}
                </span>
                <button
                  onClick={onPrevResult}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Previous (Shift+Enter)"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={onNextResult}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Next (Enter)"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </>
            ) : (
              <span className="text-xs text-gray-400">No results</span>
            )}
            <button
              onClick={() => onFilterChange('searchQuery', '')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Quick filters */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {/* Step type dropdown */}
        <select
          value={filters.stepType}
          onChange={(e) => onFilterChange('stepType', e.target.value as StepTypeFilter)}
          className={cn(
            'text-sm border rounded-lg px-3 py-1.5',
            filters.stepType !== 'all'
              ? 'border-primary-300 bg-primary-50 text-primary-700'
              : 'border-gray-200 text-gray-600'
          )}
        >
          {STEP_TYPE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.icon} {opt.label}
            </option>
          ))}
        </select>

        {/* Status dropdown */}
        <select
          value={filters.stepStatus}
          onChange={(e) => onFilterChange('stepStatus', e.target.value as StepStatusFilter)}
          className={cn(
            'text-sm border rounded-lg px-3 py-1.5',
            filters.stepStatus !== 'all'
              ? 'border-primary-300 bg-primary-50 text-primary-700'
              : 'border-gray-200 text-gray-600'
          )}
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Quick toggle buttons */}
        <div className="flex items-center gap-1 ml-2">
          <QuickFilterButton
            active={filters.showOnlyBottlenecks}
            onClick={() => onFilterChange('showOnlyBottlenecks', !filters.showOnlyBottlenecks)}
            label="Bottlenecks"
            icon="⚠️"
          />
          <QuickFilterButton
            active={filters.showOnlyAI}
            onClick={() => onFilterChange('showOnlyAI', !filters.showOnlyAI)}
            label="AI Only"
            icon="🤖"
          />
          <QuickFilterButton
            active={filters.showOnlyErrors}
            onClick={() => onFilterChange('showOnlyErrors', !filters.showOnlyErrors)}
            label="Errors"
            icon="❌"
          />
        </div>

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            'ml-auto text-xs flex items-center gap-1',
            showAdvanced ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <svg className={cn('w-4 h-4 transition-transform', showAdvanced && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          Advanced
        </button>

        {/* Reset button */}
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>
        )}
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          <div className="text-xs text-gray-500 font-medium uppercase">Time Range</div>
          <div className="flex items-center gap-2">
            <input
              type="datetime-local"
              className="text-sm border border-gray-200 rounded px-2 py-1"
              onChange={(e) => onFilterChange('timeRange', {
                ...filters.timeRange,
                start: e.target.value ? new Date(e.target.value) : null,
              })}
            />
            <span className="text-gray-400">to</span>
            <input
              type="datetime-local"
              className="text-sm border border-gray-200 rounded px-2 py-1"
              onChange={(e) => onFilterChange('timeRange', {
                ...filters.timeRange,
                end: e.target.value ? new Date(e.target.value) : null,
              })}
            />
          </div>
        </div>
      )}

      {/* Filter summary */}
      <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
        <span>
          Showing {filteredCount} of {totalItems} steps
        </span>
        {hasActiveFilters && (
          <span className="text-primary-600">
            Filters active
          </span>
        )}
      </div>
    </div>
  );
}

// Quick filter toggle button
function QuickFilterButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-xs px-2 py-1 rounded-full transition-colors flex items-center gap-1',
        active
          ? 'bg-primary-100 text-primary-700 border border-primary-300'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
      )}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

export default TimelineFilters;
