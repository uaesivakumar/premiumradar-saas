/**
 * Discovery Engine
 *
 * User-facing discovery module for finding and exploring domains.
 */

import { create } from 'zustand';
import type {
  DiscoveryMode,
  DiscoveryQuery,
  DiscoveryFilters,
  DiscoveryResult,
  DiscoveryResponse,
  SavedSearch,
  WatchlistItem,
} from './types';

// ============================================================
// DISCOVERY MODE CONFIG
// ============================================================

export const DISCOVERY_MODE_CONFIG: Record<
  DiscoveryMode,
  { label: string; icon: string; description: string }
> = {
  keyword: {
    label: 'Keyword Search',
    icon: '🔤',
    description: 'Find domains containing specific keywords',
  },
  similar: {
    label: 'Similar Domains',
    icon: '🔄',
    description: 'Find domains similar to a reference domain',
  },
  competitor: {
    label: 'Competitor Analysis',
    icon: '🎯',
    description: 'Discover competitor domains in a vertical',
  },
  trending: {
    label: 'Trending Domains',
    icon: '📈',
    description: 'See what domains are gaining traction',
  },
  expiring: {
    label: 'Expiring Soon',
    icon: '⏰',
    description: 'Find valuable domains about to expire',
  },
};

// ============================================================
// DISCOVERY STORE
// ============================================================

interface DiscoveryStore {
  query: DiscoveryQuery | null;
  results: DiscoveryResult[];
  totalCount: number;
  hasMore: boolean;
  isSearching: boolean;
  error: string | null;
  suggestions: string[];

  // Saved searches
  savedSearches: SavedSearch[];

  // Watchlist
  watchlist: WatchlistItem[];

  // Actions
  search: (query: DiscoveryQuery) => Promise<DiscoveryResponse>;
  loadMore: () => Promise<void>;
  clearResults: () => void;

  // Saved search actions
  saveSearch: (name: string, query: DiscoveryQuery) => SavedSearch;
  deleteSavedSearch: (id: string) => void;
  runSavedSearch: (id: string) => Promise<DiscoveryResponse>;

  // Watchlist actions
  addToWatchlist: (domain: string, notes?: string) => WatchlistItem;
  removeFromWatchlist: (id: string) => void;
  updateWatchlistNotes: (id: string, notes: string) => void;
  isInWatchlist: (domain: string) => boolean;
}

export const useDiscoveryStore = create<DiscoveryStore>((set, get) => ({
  query: null,
  results: [],
  totalCount: 0,
  hasMore: false,
  isSearching: false,
  error: null,
  suggestions: [],
  savedSearches: [],
  watchlist: [],

  search: async (query) => {
    set({ isSearching: true, error: null, query });

    try {
      const response = await executeDiscoverySearch(query);

      set({
        results: response.results,
        totalCount: response.totalCount,
        hasMore: response.hasMore,
        suggestions: response.suggestions,
        isSearching: false,
      });

      return response;
    } catch (error) {
      set({ error: 'Search failed', isSearching: false });
      throw error;
    }
  },

  loadMore: async () => {
    const { query, results } = get();
    if (!query) return;

    const nextQuery = { ...query, offset: results.length };
    const response = await executeDiscoverySearch(nextQuery);

    set((state) => ({
      results: [...state.results, ...response.results],
      hasMore: response.hasMore,
    }));
  },

  clearResults: () => {
    set({
      query: null,
      results: [],
      totalCount: 0,
      hasMore: false,
      suggestions: [],
    });
  },

  saveSearch: (name, query) => {
    const savedSearch: SavedSearch = {
      id: `search_${Date.now()}`,
      name,
      query,
      alertEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      savedSearches: [...state.savedSearches, savedSearch],
    }));

    return savedSearch;
  },

  deleteSavedSearch: (id) => {
    set((state) => ({
      savedSearches: state.savedSearches.filter((s) => s.id !== id),
    }));
  },

  runSavedSearch: async (id) => {
    const search = get().savedSearches.find((s) => s.id === id);
    if (!search) throw new Error('Saved search not found');

    const response = await get().search(search.query);

    set((state) => ({
      savedSearches: state.savedSearches.map((s) =>
        s.id === id
          ? { ...s, lastRun: new Date(), resultCount: response.totalCount }
          : s
      ),
    }));

    return response;
  },

  addToWatchlist: (domain, notes) => {
    const item: WatchlistItem = {
      id: `watch_${Date.now()}`,
      domain,
      addedAt: new Date(),
      notes,
      alerts: [
        { type: 'price_drop', threshold: 20, enabled: true },
        { type: 'expiring', threshold: 30, enabled: true },
        { type: 'status_change', enabled: true },
      ],
      lastChecked: new Date(),
      priceHistory: [],
    };

    set((state) => ({
      watchlist: [...state.watchlist, item],
    }));

    return item;
  },

  removeFromWatchlist: (id) => {
    set((state) => ({
      watchlist: state.watchlist.filter((w) => w.id !== id),
    }));
  },

  updateWatchlistNotes: (id, notes) => {
    set((state) => ({
      watchlist: state.watchlist.map((w) =>
        w.id === id ? { ...w, notes } : w
      ),
    }));
  },

  isInWatchlist: (domain) => {
    return get().watchlist.some((w) => w.domain === domain);
  },
}));

// ============================================================
// DISCOVERY SEARCH API
// ============================================================

async function executeDiscoverySearch(query: DiscoveryQuery): Promise<DiscoveryResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));

  const results = generateMockResults(query);
  const filtered = applyFilters(results, query.filters);
  const paginated = filtered.slice(query.offset, query.offset + query.limit);

  return {
    query,
    results: paginated,
    totalCount: filtered.length,
    hasMore: query.offset + query.limit < filtered.length,
    processingTime: Math.floor(Math.random() * 500) + 100,
    suggestions: generateSuggestions(query.query),
  };
}

// ============================================================
// DISCOVERY HELPERS
// ============================================================

/**
 * Build discovery query with defaults
 */
export function buildDiscoveryQuery(
  mode: DiscoveryMode,
  searchQuery: string,
  filters?: Partial<DiscoveryFilters>
): DiscoveryQuery {
  return {
    mode,
    query: searchQuery,
    filters: {
      tlds: filters?.tlds,
      minLength: filters?.minLength,
      maxLength: filters?.maxLength,
      minPrice: filters?.minPrice,
      maxPrice: filters?.maxPrice,
      minScore: filters?.minScore,
      excludeHyphens: filters?.excludeHyphens ?? true,
      excludeNumbers: filters?.excludeNumbers ?? false,
      vertical: filters?.vertical,
      registrar: filters?.registrar,
      expiringWithin: filters?.expiringWithin,
    },
    limit: 20,
    offset: 0,
  };
}

/**
 * Get filter summary text
 */
export function getFilterSummary(filters: DiscoveryFilters): string {
  const parts: string[] = [];

  if (filters.tlds?.length) {
    parts.push(`TLDs: ${filters.tlds.join(', ')}`);
  }
  if (filters.minPrice || filters.maxPrice) {
    const min = filters.minPrice ? `$${filters.minPrice}` : '$0';
    const max = filters.maxPrice ? `$${filters.maxPrice}` : 'unlimited';
    parts.push(`Price: ${min} - ${max}`);
  }
  if (filters.minScore) {
    parts.push(`Min score: ${filters.minScore}`);
  }
  if (filters.excludeHyphens) {
    parts.push('No hyphens');
  }
  if (filters.vertical) {
    parts.push(`Vertical: ${filters.vertical}`);
  }

  return parts.length > 0 ? parts.join(' • ') : 'No filters applied';
}

/**
 * Sort results by criteria
 */
export function sortResults(
  results: DiscoveryResult[],
  sortBy: 'score' | 'price' | 'length' | 'match',
  direction: 'asc' | 'desc' = 'desc'
): DiscoveryResult[] {
  const sorted = [...results].sort((a, b) => {
    let aVal: number, bVal: number;

    switch (sortBy) {
      case 'score':
        aVal = a.scores.composite;
        bVal = b.scores.composite;
        break;
      case 'price':
        aVal = a.price ?? 0;
        bVal = b.price ?? 0;
        break;
      case 'length':
        aVal = a.length;
        bVal = b.length;
        break;
      case 'match':
        aVal = a.matchScore;
        bVal = b.matchScore;
        break;
      default:
        return 0;
    }

    return direction === 'asc' ? aVal - bVal : bVal - aVal;
  });

  return sorted;
}

/**
 * Format match reason for display
 */
export function formatMatchReason(reason: string): string {
  const reasons: Record<string, string> = {
    keyword_exact: 'Exact keyword match',
    keyword_partial: 'Partial keyword match',
    similar_pattern: 'Similar naming pattern',
    competitor_vertical: 'Same vertical as competitor',
    trending_category: 'Trending in category',
    expiring_valuable: 'High-value expiring domain',
  };
  return reasons[reason] || reason;
}

// ============================================================
// FILTER FUNCTIONS
// ============================================================

function applyFilters(
  results: DiscoveryResult[],
  filters: DiscoveryFilters
): DiscoveryResult[] {
  return results.filter((result) => {
    // TLD filter
    if (filters.tlds?.length && !filters.tlds.includes(result.tld)) {
      return false;
    }

    // Length filters
    if (filters.minLength && result.length < filters.minLength) {
      return false;
    }
    if (filters.maxLength && result.length > filters.maxLength) {
      return false;
    }

    // Price filters
    if (filters.minPrice && (result.price ?? 0) < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice && (result.price ?? Infinity) > filters.maxPrice) {
      return false;
    }

    // Score filter
    if (filters.minScore && result.scores.composite < filters.minScore) {
      return false;
    }

    // Hyphen filter
    if (filters.excludeHyphens && result.domain.includes('-')) {
      return false;
    }

    // Number filter
    if (filters.excludeNumbers && /\d/.test(result.domain)) {
      return false;
    }

    // Vertical filter
    if (filters.vertical && result.vertical !== filters.vertical) {
      return false;
    }

    return true;
  });
}

// ============================================================
// MOCK DATA GENERATORS
// ============================================================

function generateMockResults(query: DiscoveryQuery): DiscoveryResult[] {
  const count = 30 + Math.floor(Math.random() * 70);
  const results: DiscoveryResult[] = [];

  const tlds = ['.com', '.io', '.net', '.co', '.ai', '.tech'];
  const verticals = ['Technology', 'Finance', 'Healthcare', 'E-Commerce'];

  for (let i = 0; i < count; i++) {
    const baseName = generateDomainName(query.query, query.mode);
    const tld = tlds[Math.floor(Math.random() * tlds.length)];
    const domain = baseName + tld;

    results.push({
      id: `result_${i}`,
      domain,
      tld,
      length: baseName.length,
      available: Math.random() > 0.3,
      price: Math.random() > 0.5 ? Math.floor(Math.random() * 50000) + 500 : undefined,
      scores: {
        quality: 50 + Math.floor(Math.random() * 45),
        traffic: 30 + Math.floor(Math.random() * 60),
        liquidity: 40 + Math.floor(Math.random() * 50),
        endUser: 35 + Math.floor(Math.random() * 55),
        composite: 45 + Math.floor(Math.random() * 45),
      },
      signals: [],
      matchReason: getMatchReason(query.mode),
      matchScore: 60 + Math.floor(Math.random() * 35),
      vertical: verticals[Math.floor(Math.random() * verticals.length)],
    });
  }

  return results;
}

function generateDomainName(queryText: string, mode: DiscoveryMode): string {
  const prefixes = ['get', 'my', 'the', 'go', 'try', 'use', 'pro'];
  const suffixes = ['hq', 'app', 'hub', 'lab', 'io', 'ai', 'ly'];
  const baseWord = queryText.toLowerCase().replace(/[^a-z]/g, '') || 'domain';

  switch (mode) {
    case 'keyword':
      return Math.random() > 0.5
        ? prefixes[Math.floor(Math.random() * prefixes.length)] + baseWord
        : baseWord + suffixes[Math.floor(Math.random() * suffixes.length)];
    case 'similar':
      return baseWord.slice(0, -1) + String.fromCharCode(97 + Math.floor(Math.random() * 26));
    case 'competitor':
      return baseWord + 'rival';
    case 'trending':
      return 'trending' + baseWord;
    case 'expiring':
      return baseWord + Math.floor(Math.random() * 100);
    default:
      return baseWord;
  }
}

function getMatchReason(mode: DiscoveryMode): string {
  const reasons: Record<DiscoveryMode, string[]> = {
    keyword: ['keyword_exact', 'keyword_partial'],
    similar: ['similar_pattern'],
    competitor: ['competitor_vertical'],
    trending: ['trending_category'],
    expiring: ['expiring_valuable'],
  };
  const modeReasons = reasons[mode];
  return modeReasons[Math.floor(Math.random() * modeReasons.length)];
}

function generateSuggestions(query: string): string[] {
  const base = query.toLowerCase();
  return [
    `${base} premium`,
    `best ${base}`,
    `${base} pro`,
    `${base} ai`,
    `${base} cloud`,
  ].slice(0, 3);
}
