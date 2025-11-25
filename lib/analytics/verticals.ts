/**
 * Vertical Popularity Module
 *
 * Track and analyze domain vertical/category popularity.
 */

import { create } from 'zustand';
import type { VerticalMetrics, VerticalPopularityData, DateRange } from './types';

// ============================================================
// VERTICAL STORE
// ============================================================

interface VerticalState {
  data: VerticalPopularityData | null;
  selectedVertical: string | null;
  dateRange: DateRange;
  loading: boolean;
  error: string | null;
}

interface VerticalStore extends VerticalState {
  // Data management
  loadData: (data: VerticalPopularityData) => void;
  clearData: () => void;

  // Selection
  selectVertical: (vertical: string | null) => void;
  setDateRange: (range: DateRange) => void;

  // Analysis
  getTopVerticals: (limit?: number) => VerticalMetrics[];
  getTrendingVerticals: () => VerticalMetrics[];
  getVerticalByName: (name: string) => VerticalMetrics | undefined;

  // Loading state
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useVerticalStore = create<VerticalStore>((set, get) => ({
  data: null,
  selectedVertical: null,
  dateRange: '30d',
  loading: false,
  error: null,

  loadData: (data) => set({ data, loading: false, error: null }),
  clearData: () => set({ data: null }),

  selectVertical: (vertical) => set({ selectedVertical: vertical }),
  setDateRange: (dateRange) => set({ dateRange }),

  getTopVerticals: (limit = 10) => {
    const { data } = get();
    if (!data) return [];
    return [...data.verticals]
      .sort((a, b) => b.searchCount - a.searchCount)
      .slice(0, limit);
  },

  getTrendingVerticals: () => {
    const { data } = get();
    if (!data) return [];
    return data.verticals
      .filter((v) => v.trend === 'rising')
      .sort((a, b) => b.trendPercentage - a.trendPercentage);
  },

  getVerticalByName: (name) => {
    const { data } = get();
    if (!data) return undefined;
    return data.verticals.find(
      (v) => v.vertical.toLowerCase() === name.toLowerCase()
    );
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

// ============================================================
// VERTICAL HELPERS
// ============================================================

/**
 * Predefined vertical categories
 */
export const VERTICALS = [
  { id: 'tech', name: 'Technology', icon: '💻', color: 'blue' },
  { id: 'finance', name: 'Finance', icon: '💰', color: 'green' },
  { id: 'health', name: 'Health', icon: '🏥', color: 'red' },
  { id: 'ecommerce', name: 'E-Commerce', icon: '🛒', color: 'purple' },
  { id: 'education', name: 'Education', icon: '📚', color: 'yellow' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: 'pink' },
  { id: 'travel', name: 'Travel', icon: '✈️', color: 'cyan' },
  { id: 'food', name: 'Food & Beverage', icon: '🍔', color: 'orange' },
  { id: 'realestate', name: 'Real Estate', icon: '🏠', color: 'teal' },
  { id: 'automotive', name: 'Automotive', icon: '🚗', color: 'gray' },
  { id: 'fashion', name: 'Fashion', icon: '👗', color: 'indigo' },
  { id: 'sports', name: 'Sports', icon: '⚽', color: 'lime' },
  { id: 'gaming', name: 'Gaming', icon: '🎮', color: 'violet' },
  { id: 'saas', name: 'SaaS', icon: '☁️', color: 'sky' },
  { id: 'crypto', name: 'Crypto', icon: '🪙', color: 'amber' },
  { id: 'ai', name: 'AI & ML', icon: '🤖', color: 'emerald' },
] as const;

/**
 * Get vertical info by ID
 */
export function getVerticalInfo(id: string): {
  name: string;
  icon: string;
  color: string;
} {
  const vertical = VERTICALS.find((v) => v.id === id);
  return vertical || { name: id, icon: '📁', color: 'gray' };
}

/**
 * Calculate vertical share percentages
 */
export function calculateVerticalShares(
  data: VerticalPopularityData
): Array<{ vertical: string; share: number }> {
  const total = data.totalSearches;
  if (total === 0) return [];

  return data.verticals.map((v) => ({
    vertical: v.vertical,
    share: Math.round((v.searchCount / total) * 1000) / 10,
  }));
}

/**
 * Get trend display info
 */
export function getTrendInfo(trend: 'rising' | 'falling' | 'stable'): {
  label: string;
  icon: string;
  color: string;
} {
  const info = {
    rising: { label: 'Rising', icon: '📈', color: 'green' },
    falling: { label: 'Falling', icon: '📉', color: 'red' },
    stable: { label: 'Stable', icon: '➡️', color: 'gray' },
  };
  return info[trend];
}

/**
 * Calculate vertical health score
 */
export function calculateVerticalHealth(metrics: VerticalMetrics): {
  score: number;
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  factors: string[];
} {
  let score = 50; // Base score
  const factors: string[] = [];

  // Search activity factor
  if (metrics.searchCount > 1000) {
    score += 15;
    factors.push('High search volume');
  } else if (metrics.searchCount > 500) {
    score += 10;
    factors.push('Moderate search volume');
  }

  // View-to-search ratio
  const viewRatio = metrics.viewCount / Math.max(metrics.searchCount, 1);
  if (viewRatio > 0.5) {
    score += 10;
    factors.push('Good engagement rate');
  }

  // Purchase conversion
  const conversionRate = metrics.purchaseCount / Math.max(metrics.viewCount, 1);
  if (conversionRate > 0.05) {
    score += 15;
    factors.push('Strong conversion rate');
  } else if (conversionRate > 0.02) {
    score += 10;
    factors.push('Decent conversion rate');
  }

  // Trend factor
  if (metrics.trend === 'rising') {
    score += 10;
    factors.push('Trending upward');
  } else if (metrics.trend === 'falling') {
    score -= 10;
    factors.push('Declining interest');
  }

  // Price health
  const priceSpread = (metrics.priceRange.max - metrics.priceRange.min) / metrics.averagePrice;
  if (priceSpread < 2) {
    score += 5;
    factors.push('Stable pricing');
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine rating
  let rating: 'excellent' | 'good' | 'fair' | 'poor';
  if (score >= 80) rating = 'excellent';
  else if (score >= 60) rating = 'good';
  else if (score >= 40) rating = 'fair';
  else rating = 'poor';

  return { score, rating, factors };
}

/**
 * Compare two verticals
 */
export function compareVerticals(
  a: VerticalMetrics,
  b: VerticalMetrics
): {
  winner: 'a' | 'b' | 'tie';
  comparison: {
    metric: string;
    aValue: number;
    bValue: number;
    winner: 'a' | 'b' | 'tie';
  }[];
} {
  const comparison: {
    metric: string;
    aValue: number;
    bValue: number;
    winner: 'a' | 'b' | 'tie';
  }[] = [];

  const metrics = [
    { name: 'Search Count', aVal: a.searchCount, bVal: b.searchCount },
    { name: 'View Count', aVal: a.viewCount, bVal: b.viewCount },
    { name: 'Purchase Count', aVal: a.purchaseCount, bVal: b.purchaseCount },
    { name: 'Average Price', aVal: a.averagePrice, bVal: b.averagePrice },
    { name: 'Trend %', aVal: a.trendPercentage, bVal: b.trendPercentage },
  ];

  let aWins = 0;
  let bWins = 0;

  metrics.forEach(({ name, aVal, bVal }) => {
    let winner: 'a' | 'b' | 'tie' = 'tie';
    const diff = Math.abs(aVal - bVal) / Math.max(aVal, bVal, 1);

    if (diff > 0.1) {
      winner = aVal > bVal ? 'a' : 'b';
      if (winner === 'a') aWins++;
      else bWins++;
    }

    comparison.push({
      metric: name,
      aValue: aVal,
      bValue: bVal,
      winner,
    });
  });

  const overall: 'a' | 'b' | 'tie' =
    aWins > bWins ? 'a' : bWins > aWins ? 'b' : 'tie';

  return { winner: overall, comparison };
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
  if (price >= 1000) return `$${(price / 1000).toFixed(1)}K`;
  return `$${price.toFixed(0)}`;
}

/**
 * Calculate market size estimate
 */
export function estimateMarketSize(metrics: VerticalMetrics): {
  estimatedSize: number;
  confidence: 'high' | 'medium' | 'low';
} {
  // Rough estimate based on available data
  const estimatedSize = metrics.purchaseCount * metrics.averagePrice * 12; // Annualized

  // Confidence based on data volume
  let confidence: 'high' | 'medium' | 'low';
  if (metrics.purchaseCount > 100 && metrics.searchCount > 1000) {
    confidence = 'high';
  } else if (metrics.purchaseCount > 20 || metrics.searchCount > 200) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return { estimatedSize, confidence };
}

/**
 * Get vertical recommendations
 */
export function getVerticalRecommendations(
  data: VerticalPopularityData,
  budget?: number
): VerticalMetrics[] {
  let candidates = [...data.verticals];

  // Filter by budget if provided
  if (budget) {
    candidates = candidates.filter((v) => v.medianPrice <= budget);
  }

  // Score and sort by opportunity
  return candidates
    .map((v) => ({
      ...v,
      opportunityScore:
        (v.trend === 'rising' ? 2 : v.trend === 'stable' ? 1 : 0) +
        (v.searchCount / Math.max(...data.verticals.map((x) => x.searchCount))) * 2 +
        (v.purchaseCount / Math.max(...data.verticals.map((x) => x.purchaseCount), 1)),
    }))
    .sort((a, b) => (b as any).opportunityScore - (a as any).opportunityScore)
    .slice(0, 5);
}

/**
 * Export vertical data to CSV
 */
export function exportVerticalsToCSV(data: VerticalPopularityData): string {
  const headers = [
    'Vertical',
    'Searches',
    'Views',
    'Purchases',
    'Avg Price',
    'Median Price',
    'Min Price',
    'Max Price',
    'Trend',
    'Trend %',
  ];

  const rows = data.verticals.map((v) => [
    v.vertical,
    v.searchCount.toString(),
    v.viewCount.toString(),
    v.purchaseCount.toString(),
    formatPrice(v.averagePrice),
    formatPrice(v.medianPrice),
    formatPrice(v.priceRange.min),
    formatPrice(v.priceRange.max),
    v.trend,
    `${v.trendPercentage}%`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
