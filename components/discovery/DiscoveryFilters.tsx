/**
 * Discovery Filters Component
 * Sprint S55: Discovery UI
 *
 * Filter panel for discovery list.
 */

import React, { useState } from 'react';
import type { VerticalId } from '../../lib/dashboard';
import type {
  DiscoveryUIFilter,
  DiscoverySortOption,
  FreshnessStatus,
  CompanySizeCategory,
} from '../../lib/discovery';

interface DiscoveryFiltersProps {
  filters: DiscoveryUIFilter;
  onVerticalChange: (vertical: VerticalId) => void;
  onTerritoryChange: (territory: string | undefined) => void;
  onIndustriesChange: (industries: string[]) => void;
  onSizesChange: (sizes: CompanySizeCategory[]) => void;
  onScoreRangeChange: (range: { min: number; max: number } | undefined) => void;
  onFreshnessChange: (freshness: FreshnessStatus[]) => void;
  onSearchChange: (query: string) => void;
  onSortByChange: (sortBy: DiscoverySortOption) => void;
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

/**
 * P2 VERTICALISATION: Updated to use official Vertical types
 */
const VERTICALS: { id: VerticalId; name: string; icon: string }[] = [
  { id: 'banking', name: 'Banking', icon: '🏦' },
  { id: 'insurance', name: 'Insurance', icon: '🛡️' },
  { id: 'real-estate', name: 'Real Estate', icon: '🏠' },
  { id: 'recruitment', name: 'Recruitment', icon: '👤' },
  { id: 'saas-sales', name: 'SaaS Sales', icon: '💻' },
];

const SIZES: { id: CompanySizeCategory; label: string }[] = [
  { id: 'startup', label: 'Startup' },
  { id: 'small', label: 'Small' },
  { id: 'medium', label: 'Medium' },
  { id: 'large', label: 'Large' },
  { id: 'enterprise', label: 'Enterprise' },
];

const FRESHNESS_OPTIONS: { id: FreshnessStatus; label: string; color: string }[] = [
  { id: 'fresh', label: 'Fresh', color: 'bg-green-100 text-green-700' },
  { id: 'recent', label: 'Recent', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'stale', label: 'Stale', color: 'bg-gray-100 text-gray-600' },
];

const SORT_OPTIONS: { id: DiscoverySortOption; label: string }[] = [
  { id: 'score', label: 'Score' },
  { id: 'freshness', label: 'Freshness' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'signals', label: 'Signals' },
  { id: 'discovered', label: 'Discovered' },
  { id: 'name', label: 'Name' },
];

export function DiscoveryFilters({
  filters,
  onVerticalChange,
  onTerritoryChange,
  onIndustriesChange,
  onSizesChange,
  onScoreRangeChange,
  onFreshnessChange,
  onSearchChange,
  onSortByChange,
  onSortOrderChange,
  onReset,
  hasActiveFilters,
}: DiscoveryFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.searchQuery || '');
  const [minScore, setMinScore] = useState(filters.scoreRange?.min?.toString() || '');
  const [maxScore, setMaxScore] = useState(filters.scoreRange?.max?.toString() || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchInput);
  };

  const handleScoreRangeApply = () => {
    const min = minScore ? parseInt(minScore, 10) : undefined;
    const max = maxScore ? parseInt(maxScore, 10) : undefined;
    if (min !== undefined && max !== undefined) {
      onScoreRangeChange({ min, max });
    } else {
      onScoreRangeChange(undefined);
    }
  };

  const toggleSize = (size: CompanySizeCategory) => {
    const current = filters.companySizes || [];
    if (current.includes(size)) {
      onSizesChange(current.filter((s) => s !== size));
    } else {
      onSizesChange([...current, size]);
    }
  };

  const toggleFreshness = (status: FreshnessStatus) => {
    const current = filters.freshness || [];
    if (current.includes(status)) {
      onFreshnessChange(current.filter((f) => f !== status));
    } else {
      onFreshnessChange([...current, status]);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search companies..."
            className="w-full px-4 py-2 border border-gray-200 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
          >
            🔍
          </button>
        </div>
      </form>

      {/* Vertical Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Vertical</label>
        <div className="flex flex-wrap gap-2">
          {VERTICALS.map((v) => (
            <button
              key={v.id}
              onClick={() => onVerticalChange(v.id)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filters.vertical === v.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {v.icon} {v.name}
            </button>
          ))}
        </div>
      </div>

      {/* Company Size */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s.id}
              onClick={() => toggleSize(s.id)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filters.companySizes?.includes(s.id)
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Freshness */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Freshness</label>
        <div className="flex flex-wrap gap-2">
          {FRESHNESS_OPTIONS.map((f) => (
            <button
              key={f.id}
              onClick={() => toggleFreshness(f.id)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filters.freshness?.includes(f.id)
                  ? f.color + ' border border-current'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Score Range */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Score Range</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            placeholder="Min"
            min={0}
            max={100}
            className="w-20 px-2 py-1 border border-gray-200 rounded text-sm"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
            placeholder="Max"
            min={0}
            max={100}
            className="w-20 px-2 py-1 border border-gray-200 rounded text-sm"
          />
          <button
            onClick={handleScoreRangeApply}
            className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Sort */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
        <div className="flex items-center gap-2">
          <select
            value={filters.sortBy || 'score'}
            onChange={(e) => onSortByChange(e.target.value as DiscoverySortOption)}
            className="flex-1 px-3 py-1.5 border border-gray-200 rounded text-sm"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => onSortOrderChange(filters.sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-1.5 border border-gray-200 rounded text-sm hover:bg-gray-50"
            title={filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {filters.sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Reset */}
      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
}

export default DiscoveryFilters;
