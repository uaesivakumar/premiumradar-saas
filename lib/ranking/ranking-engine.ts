/**
 * Ranking Engine
 *
 * Core ranking logic and calculations.
 */

import { create } from 'zustand';
import type {
  RankedDomain,
  RankingScores,
  RankingList,
  RankingSortOption,
  RankingFilters,
  RankingConfig,
  CategoryWeights,
  RankingMetadata,
  RankingSignal,
  RankChangeIndicator,
  RankingDisplayConfig,
  RankingViewMode,
} from './types';
import { generateExplanation } from './explanations';

// ============================================================
// DEFAULT CONFIG
// ============================================================

export const DEFAULT_RANKING_CONFIG: RankingConfig = {
  weights: {
    quality: 0.30,
    traffic: 0.25,
    liquidity: 0.20,
    endUser: 0.25,
  },
  thresholds: {
    excellent: 85,
    good: 70,
    fair: 50,
    poor: 30,
  },
  modifiers: {
    premiumTldBonus: 10,
    shortLengthBonus: 15,
    hyphenPenalty: -15,
    numberPenalty: -10,
    exactMatchBonus: 20,
    brandableBonus: 15,
  },
};

// ============================================================
// RANKING STORE
// ============================================================

interface RankingStore {
  lists: Map<string, RankingList>;
  activeListId: string | null;
  config: RankingConfig;
  displayConfig: RankingDisplayConfig;
  isLoading: boolean;
  error: string | null;

  // List actions
  createList: (name: string, description?: string) => RankingList;
  deleteList: (id: string) => void;
  getList: (id: string) => RankingList | undefined;
  setActiveList: (id: string | null) => void;

  // Domain actions
  addDomain: (listId: string, domain: Partial<RankedDomain>) => void;
  removeDomain: (listId: string, domainId: string) => void;
  rankDomains: (listId: string) => RankedDomain[];

  // Config actions
  updateWeights: (weights: Partial<CategoryWeights>) => void;
  updateConfig: (config: Partial<RankingConfig>) => void;

  // Display actions
  setViewMode: (mode: RankingViewMode) => void;
  setDisplayConfig: (config: Partial<RankingDisplayConfig>) => void;

  // Filter actions
  setFilters: (listId: string, filters: RankingFilters) => void;
  setSortBy: (listId: string, sortBy: RankingSortOption) => void;
}

export const useRankingStore = create<RankingStore>((set, get) => ({
  lists: new Map(),
  activeListId: null,
  config: DEFAULT_RANKING_CONFIG,
  displayConfig: {
    viewMode: 'cards',
    showExplanations: true,
    showSignals: true,
    showComparisons: false,
    highlightChanges: true,
    pageSize: 20,
  },
  isLoading: false,
  error: null,

  createList: (name, description) => {
    const id = `list_${Date.now()}`;
    const list: RankingList = {
      id,
      name,
      description,
      domains: [],
      sortBy: 'composite',
      filters: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      lists: new Map(state.lists).set(id, list),
      activeListId: id,
    }));

    return list;
  },

  deleteList: (id) => {
    set((state) => {
      const lists = new Map(state.lists);
      lists.delete(id);
      return {
        lists,
        activeListId: state.activeListId === id ? null : state.activeListId,
      };
    });
  },

  getList: (id) => {
    return get().lists.get(id);
  },

  setActiveList: (id) => {
    set({ activeListId: id });
  },

  addDomain: (listId, domainData) => {
    set((state) => {
      const lists = new Map(state.lists);
      const list = lists.get(listId);
      if (!list) return state;

      const domain = createRankedDomain(domainData, state.config);
      const updatedList = {
        ...list,
        domains: [...list.domains, domain],
        updatedAt: new Date(),
      };

      lists.set(listId, updatedList);
      return { lists };
    });
  },

  removeDomain: (listId, domainId) => {
    set((state) => {
      const lists = new Map(state.lists);
      const list = lists.get(listId);
      if (!list) return state;

      const updatedList = {
        ...list,
        domains: list.domains.filter((d) => d.id !== domainId),
        updatedAt: new Date(),
      };

      lists.set(listId, updatedList);
      return { lists };
    });
  },

  rankDomains: (listId) => {
    const state = get();
    const list = state.lists.get(listId);
    if (!list) return [];

    const filtered = applyFilters(list.domains, list.filters);
    const sorted = sortDomains(filtered, list.sortBy);

    // Assign ranks
    const ranked = sorted.map((domain, index) => ({
      ...domain,
      previousRank: domain.rank,
      rank: index + 1,
    }));

    // Update list
    set((s) => {
      const lists = new Map(s.lists);
      lists.set(listId, { ...list, domains: ranked, updatedAt: new Date() });
      return { lists };
    });

    return ranked;
  },

  updateWeights: (weights) => {
    set((state) => ({
      config: {
        ...state.config,
        weights: { ...state.config.weights, ...weights },
      },
    }));
  },

  updateConfig: (config) => {
    set((state) => ({
      config: { ...state.config, ...config },
    }));
  },

  setViewMode: (mode) => {
    set((state) => ({
      displayConfig: { ...state.displayConfig, viewMode: mode },
    }));
  },

  setDisplayConfig: (config) => {
    set((state) => ({
      displayConfig: { ...state.displayConfig, ...config },
    }));
  },

  setFilters: (listId, filters) => {
    set((state) => {
      const lists = new Map(state.lists);
      const list = lists.get(listId);
      if (!list) return state;

      lists.set(listId, { ...list, filters, updatedAt: new Date() });
      return { lists };
    });
  },

  setSortBy: (listId, sortBy) => {
    set((state) => {
      const lists = new Map(state.lists);
      const list = lists.get(listId);
      if (!list) return state;

      lists.set(listId, { ...list, sortBy, updatedAt: new Date() });
      return { lists };
    });
  },
}));

// ============================================================
// RANKING CALCULATIONS
// ============================================================

/**
 * Calculate composite score from individual scores
 */
export function calculateCompositeScore(
  scores: Omit<RankingScores, 'composite' | 'confidence'>,
  weights: CategoryWeights
): number {
  const weighted =
    scores.quality * weights.quality +
    scores.traffic * weights.traffic +
    scores.liquidity * weights.liquidity +
    scores.endUser * weights.endUser;

  return Math.round(weighted);
}

/**
 * Apply modifiers to base score
 */
export function applyModifiers(
  baseScore: number,
  metadata: RankingMetadata,
  config: RankingConfig
): number {
  let score = baseScore;
  const { modifiers } = config;

  // Premium TLD bonus
  if (['.com', '.io', '.ai'].includes(metadata.tld)) {
    score += modifiers.premiumTldBonus;
  }

  // Short length bonus (5 chars or less)
  if (metadata.length <= 5) {
    score += modifiers.shortLengthBonus;
  }

  // Penalties
  if (metadata.hasHyphens) {
    score += modifiers.hyphenPenalty;
  }
  if (metadata.hasNumbers) {
    score += modifiers.numberPenalty;
  }

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate confidence level
 */
export function calculateConfidence(signals: RankingSignal[]): number {
  if (signals.length === 0) return 0.5;

  const highCount = signals.filter((s) => s.importance === 'high').length;
  const mediumCount = signals.filter((s) => s.importance === 'medium').length;

  const signalScore = (highCount * 0.3 + mediumCount * 0.2) / signals.length;
  return Math.min(1, 0.5 + signalScore);
}

// ============================================================
// RANKING HELPERS
// ============================================================

/**
 * Get score tier label
 */
export function getScoreTier(
  score: number,
  thresholds = DEFAULT_RANKING_CONFIG.thresholds
): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score >= thresholds.excellent) return 'excellent';
  if (score >= thresholds.good) return 'good';
  if (score >= thresholds.fair) return 'fair';
  return 'poor';
}

/**
 * Get tier color
 */
export function getTierColor(tier: 'excellent' | 'good' | 'fair' | 'poor'): string {
  const colors = {
    excellent: 'green',
    good: 'blue',
    fair: 'yellow',
    poor: 'red',
  };
  return colors[tier];
}

/**
 * Get rank change indicator
 */
export function getRankChangeIndicator(
  currentRank: number,
  previousRank?: number
): RankChangeIndicator {
  if (previousRank === undefined) {
    return { direction: 'new', amount: 0, color: 'purple', icon: '🆕' };
  }

  const diff = previousRank - currentRank;

  if (diff > 0) {
    return { direction: 'up', amount: diff, color: 'green', icon: '↑' };
  }
  if (diff < 0) {
    return { direction: 'down', amount: Math.abs(diff), color: 'red', icon: '↓' };
  }
  return { direction: 'stable', amount: 0, color: 'gray', icon: '→' };
}

/**
 * Format score for display
 */
export function formatScore(score: number): string {
  return score.toFixed(0);
}

/**
 * Get category icon
 */
export function getCategoryIcon(
  category: 'quality' | 'traffic' | 'liquidity' | 'endUser'
): string {
  const icons = {
    quality: '⭐',
    traffic: '📊',
    liquidity: '💧',
    endUser: '👤',
  };
  return icons[category];
}

/**
 * Get category label
 */
export function getCategoryLabel(
  category: 'quality' | 'traffic' | 'liquidity' | 'endUser'
): string {
  const labels = {
    quality: 'Quality',
    traffic: 'Traffic',
    liquidity: 'Liquidity',
    endUser: 'End-User Value',
  };
  return labels[category];
}

// ============================================================
// FILTER & SORT FUNCTIONS
// ============================================================

function applyFilters(
  domains: RankedDomain[],
  filters: RankingFilters
): RankedDomain[] {
  return domains.filter((domain) => {
    if (filters.minScore && domain.scores.composite < filters.minScore) {
      return false;
    }
    if (filters.maxScore && domain.scores.composite > filters.maxScore) {
      return false;
    }
    if (filters.verticals?.length && !filters.verticals.includes(domain.metadata.vertical || '')) {
      return false;
    }
    if (filters.tlds?.length && !filters.tlds.includes(domain.metadata.tld)) {
      return false;
    }
    if (filters.minLength && domain.metadata.length < filters.minLength) {
      return false;
    }
    if (filters.maxLength && domain.metadata.length > filters.maxLength) {
      return false;
    }
    if (filters.excludeNumbers && domain.metadata.hasNumbers) {
      return false;
    }
    if (filters.excludeHyphens && domain.metadata.hasHyphens) {
      return false;
    }
    if (filters.showAvailableOnly && !domain.metadata.available) {
      return false;
    }
    return true;
  });
}

function sortDomains(
  domains: RankedDomain[],
  sortBy: RankingSortOption
): RankedDomain[] {
  return [...domains].sort((a, b) => {
    switch (sortBy) {
      case 'composite':
        return b.scores.composite - a.scores.composite;
      case 'quality':
        return b.scores.quality - a.scores.quality;
      case 'traffic':
        return b.scores.traffic - a.scores.traffic;
      case 'liquidity':
        return b.scores.liquidity - a.scores.liquidity;
      case 'endUser':
        return b.scores.endUser - a.scores.endUser;
      case 'rank':
        return a.rank - b.rank;
      case 'change':
        const aChange = (a.previousRank ?? a.rank) - a.rank;
        const bChange = (b.previousRank ?? b.rank) - b.rank;
        return bChange - aChange;
      default:
        return 0;
    }
  });
}

// ============================================================
// DOMAIN CREATION
// ============================================================

function createRankedDomain(
  data: Partial<RankedDomain>,
  config: RankingConfig
): RankedDomain {
  const domain = data.domain || 'example.com';
  const tld = '.' + domain.split('.').pop();

  const metadata: RankingMetadata = data.metadata || {
    tld,
    length: domain.split('.')[0].length,
    hasNumbers: /\d/.test(domain),
    hasHyphens: domain.includes('-'),
    available: true,
  };

  const baseScores = data.scores || generateMockScores();
  const composite = calculateCompositeScore(baseScores, config.weights);
  const finalComposite = applyModifiers(composite, metadata, config);

  const signals = data.signals || generateMockSignals();
  const confidence = calculateConfidence(signals);

  const scores: RankingScores = {
    ...baseScores,
    composite: finalComposite,
    confidence,
  };

  const explanation = generateExplanation(domain, scores, metadata, signals);

  return {
    id: data.id || `domain_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    domain,
    rank: data.rank || 0,
    previousRank: data.previousRank,
    scores,
    explanation,
    signals,
    metadata,
    lastUpdated: new Date(),
  };
}

function generateMockScores(): Omit<RankingScores, 'composite' | 'confidence'> {
  return {
    quality: 50 + Math.floor(Math.random() * 45),
    traffic: 30 + Math.floor(Math.random() * 60),
    liquidity: 40 + Math.floor(Math.random() * 50),
    endUser: 35 + Math.floor(Math.random() * 55),
  };
}

function generateMockSignals(): RankingSignal[] {
  return [
    {
      type: 'traffic',
      name: 'Monthly Visitors',
      value: 80,
      trend: 'up',
      importance: 'high',
    },
    {
      type: 'seo',
      name: 'Domain Authority',
      value: 65,
      trend: 'stable',
      importance: 'medium',
    },
    {
      type: 'brand',
      name: 'Brand Mentions',
      value: 45,
      trend: 'up',
      importance: 'medium',
    },
  ];
}
