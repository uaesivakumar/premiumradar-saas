'use client';

/**
 * Context-Aware Discovery Filters - EB Journey Phase 4
 *
 * Wraps discovery filters with SalesContext awareness:
 * - Default to user's selected regions
 * - Show only signals relevant to sub-vertical (from VerticalConfig API)
 * - Display context badge at top
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Filter, X, Lock, Building2, Users, Zap, TrendingUp, Loader2 } from 'lucide-react';
import { useSalesContext } from '@/lib/intelligence/hooks/useSalesContext';
import { useVerticalConfig, type SignalConfig } from '@/lib/intelligence/hooks/useVerticalConfig';
import { REGION_DISPLAY_NAMES } from '@/lib/intelligence/context/SalesContextProvider';

export interface ContextFilters {
  // Region filtering (defaults to user's regions)
  regions: string[];
  useContextRegions: boolean; // If true, use SalesContext regions

  // Signal type filtering (based on sub-vertical)
  signalTypes: string[];

  // Score filtering
  minScore: number;
  maxScore: number;

  // Company filtering
  companySizes: string[];
  bankingTiers: string[];

  // Sort
  sortBy: 'score' | 'signals' | 'freshness' | 'name';
  sortOrder: 'asc' | 'desc';

  // Search
  searchQuery: string;
}

interface ContextAwareFiltersProps {
  filters: ContextFilters;
  onFiltersChange: (filters: ContextFilters) => void;
  totalResults: number;
  className?: string;
}

// Icon mapping for signal types
const SIGNAL_ICONS: Record<string, React.ReactNode> = {
  'hiring-expansion': <Users className="w-3.5 h-3.5" />,
  'office-opening': <Building2 className="w-3.5 h-3.5" />,
  'headcount-jump': <TrendingUp className="w-3.5 h-3.5" />,
  'subsidiary-creation': <Building2 className="w-3.5 h-3.5" />,
  'market-entry': <Zap className="w-3.5 h-3.5" />,
  'leadership-hiring': <Users className="w-3.5 h-3.5" />,
  'funding-round': <TrendingUp className="w-3.5 h-3.5" />,
  'merger-acquisition': <Building2 className="w-3.5 h-3.5" />,
  'expansion-announcement': <Zap className="w-3.5 h-3.5" />,
  'project-award': <Zap className="w-3.5 h-3.5" />,
};

// Signal type for display
interface SignalTypeOption {
  id: string;
  label: string;
  description?: string;
  relevance?: number;
  icon: React.ReactNode;
}

// Fallback signals if VerticalConfig not available
const FALLBACK_SIGNAL_TYPES: Omit<SignalTypeOption, 'icon'>[] = [
  { id: 'hiring-expansion', label: 'Hiring Expansion', description: 'Company is actively hiring' },
  { id: 'office-opening', label: 'Office Opening', description: 'New office location' },
  { id: 'headcount-jump', label: 'Headcount Jump', description: 'Significant employee increase' },
  { id: 'subsidiary-creation', label: 'New Subsidiary', description: 'New business entity created' },
  { id: 'market-entry', label: 'Market Entry', description: 'Entering new market/region' },
];

// Company sizes
const COMPANY_SIZES = [
  { id: 'startup', label: 'Startup (1-50)' },
  { id: 'smb', label: 'SMB (51-200)' },
  { id: 'mid-market', label: 'Mid-Market (201-1000)' },
  { id: 'enterprise', label: 'Enterprise (1000+)' },
];

// Banking tiers (for Employee Banking)
const BANKING_TIERS = [
  { id: 'tier1', label: 'Tier 1 (Large Corps)' },
  { id: 'tier2', label: 'Tier 2 (Growing)' },
  { id: 'tier3', label: 'Tier 3 (SMEs)' },
  { id: 'government', label: 'Government' },
  { id: 'mnc', label: 'MNC Subsidiary' },
];

export function ContextAwareFilters({
  filters,
  onFiltersChange,
  totalResults,
  className = '',
}: ContextAwareFiltersProps) {
  const {
    regions: contextRegions,
    subVerticalName,
    regionsDisplay,
    isLocked,
  } = useSalesContext();

  // Fetch signal types from VerticalConfig API
  const {
    signalConfigs,
    isLoading: isConfigLoading,
    isConfigured,
  } = useVerticalConfig();

  const [isExpanded, setIsExpanded] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.searchQuery);

  // Build signal types from VerticalConfig or fallback
  const signalTypes: SignalTypeOption[] = useMemo(() => {
    if (signalConfigs.length > 0) {
      return signalConfigs.map((config: SignalConfig): SignalTypeOption => ({
        id: config.type,
        label: config.name,
        description: config.description,
        relevance: config.relevance,
        icon: SIGNAL_ICONS[config.type] || <Zap className="w-3.5 h-3.5" />,
      }));
    }
    return FALLBACK_SIGNAL_TYPES.map((s): SignalTypeOption => ({
      ...s,
      icon: SIGNAL_ICONS[s.id] || <Zap className="w-3.5 h-3.5" />,
    }));
  }, [signalConfigs]);

  // Get effective regions (context regions or custom selection)
  const effectiveRegions = filters.useContextRegions ? contextRegions : filters.regions;

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (!filters.useContextRegions && filters.regions.length > 0) count++;
    if (filters.signalTypes.length > 0) count++;
    if (filters.minScore > 0 || filters.maxScore < 100) count++;
    if (filters.companySizes.length > 0) count++;
    if (filters.bankingTiers.length > 0) count++;
    if (filters.searchQuery) count++;
    return count;
  }, [filters]);

  // Toggle region selection
  const toggleRegion = (region: string) => {
    const current = filters.regions;
    const updated = current.includes(region)
      ? current.filter(r => r !== region)
      : [...current, region];
    onFiltersChange({ ...filters, regions: updated, useContextRegions: false });
  };

  // Toggle signal type
  const toggleSignalType = (signalType: string) => {
    const current = filters.signalTypes;
    const updated = current.includes(signalType)
      ? current.filter(s => s !== signalType)
      : [...current, signalType];
    onFiltersChange({ ...filters, signalTypes: updated });
  };

  // Toggle company size
  const toggleCompanySize = (size: string) => {
    const current = filters.companySizes;
    const updated = current.includes(size)
      ? current.filter(s => s !== size)
      : [...current, size];
    onFiltersChange({ ...filters, companySizes: updated });
  };

  // Toggle banking tier
  const toggleBankingTier = (tier: string) => {
    const current = filters.bankingTiers;
    const updated = current.includes(tier)
      ? current.filter(t => t !== tier)
      : [...current, tier];
    onFiltersChange({ ...filters, bankingTiers: updated });
  };

  // Reset to context regions
  const resetToContextRegions = () => {
    onFiltersChange({ ...filters, regions: [], useContextRegions: true });
  };

  // Handle search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, searchQuery: searchInput });
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchInput('');
    onFiltersChange({
      regions: [],
      useContextRegions: true,
      signalTypes: [],
      minScore: 0,
      maxScore: 100,
      companySizes: [],
      bankingTiers: [],
      sortBy: 'score',
      sortOrder: 'desc',
      searchQuery: '',
    });
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>
      {/* Context Header */}
      <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">
                {subVerticalName} Discovery
              </p>
              <p className="text-xs text-blue-600">
                Showing companies in {regionsDisplay}
                {isLocked && <Lock className="w-3 h-3 inline ml-1" />}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-blue-900">{totalResults}</p>
            <p className="text-xs text-blue-600">companies found</p>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="p-4 flex items-center gap-4 flex-wrap">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px]">
          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search companies..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  onFiltersChange({ ...filters, searchQuery: '' });
                }}
                className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {/* Region Quick Toggle */}
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <div className="flex gap-1">
            {contextRegions.map((region) => (
              <button
                key={region}
                onClick={() => toggleRegion(region)}
                className={`px-2 py-1 text-xs rounded-full transition-colors ${
                  effectiveRegions.includes(region)
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {REGION_DISPLAY_NAMES[region] || region}
              </button>
            ))}
          </div>
        </div>

        {/* Expand Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Expanded Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-gray-100"
          >
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Signal Types (from VerticalConfig or fallback) */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  Signal Types
                  {isConfigLoading && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
                </h4>
                <div className="space-y-2">
                  {signalTypes.map((signal) => (
                    <label
                      key={signal.id}
                      className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded"
                      title={signal.description}
                    >
                      <input
                        type="checkbox"
                        checked={filters.signalTypes.includes(signal.id)}
                        onChange={() => toggleSignalType(signal.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-500">{signal.icon}</span>
                      <span className="text-gray-600">{signal.label}</span>
                      {signal.relevance !== undefined && (
                        <span className="ml-auto text-xs text-gray-400">
                          {Math.round(signal.relevance * 100)}%
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                {!isConfigured && !isConfigLoading && (
                  <p className="text-xs text-amber-600 mt-2">
                    Using default signals (vertical config not found)
                  </p>
                )}
              </div>

              {/* Company Size */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Company Size</h4>
                <div className="space-y-2">
                  {COMPANY_SIZES.map((size) => (
                    <label
                      key={size.id}
                      className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={filters.companySizes.includes(size.id)}
                        onChange={() => toggleCompanySize(size.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-600">{size.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Banking Tier */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Target Tier</h4>
                <div className="space-y-2">
                  {BANKING_TIERS.map((tier) => (
                    <label
                      key={tier.id}
                      className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={filters.bankingTiers.includes(tier.id)}
                        onChange={() => toggleBankingTier(tier.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-600">{tier.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Score Range & Sort */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Score & Sort</h4>

                {/* Score Range */}
                <div className="mb-4">
                  <label className="text-xs text-gray-500 mb-1 block">Score Range</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={filters.minScore}
                      onChange={(e) => onFiltersChange({ ...filters, minScore: parseInt(e.target.value) || 0 })}
                      className="w-16 px-2 py-1 border border-gray-200 rounded text-sm"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={filters.maxScore}
                      onChange={(e) => onFiltersChange({ ...filters, maxScore: parseInt(e.target.value) || 100 })}
                      className="w-16 px-2 py-1 border border-gray-200 rounded text-sm"
                    />
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Sort By</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={filters.sortBy}
                      onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value as ContextFilters['sortBy'] })}
                      className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm"
                    >
                      <option value="score">Score</option>
                      <option value="signals">Signals</option>
                      <option value="freshness">Freshness</option>
                      <option value="name">Name</option>
                    </select>
                    <button
                      onClick={() => onFiltersChange({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                      className="px-2 py-1.5 border border-gray-200 rounded text-sm hover:bg-gray-50"
                    >
                      {filters.sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <div className="px-4 pb-4 flex items-center justify-between">
              <button
                onClick={resetToContextRegions}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Reset to my territory
              </button>
              {activeFilterCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Create default filters based on SalesContext
 */
export function createDefaultContextFilters(): ContextFilters {
  return {
    regions: [],
    useContextRegions: true, // Use context regions by default
    signalTypes: [],
    minScore: 0,
    maxScore: 100,
    companySizes: [],
    bankingTiers: [],
    sortBy: 'score',
    sortOrder: 'desc',
    searchQuery: '',
  };
}

export default ContextAwareFilters;
