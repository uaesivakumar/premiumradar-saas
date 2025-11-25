/**
 * Signal Viewer
 *
 * View and analyze signals/indicators for domains.
 */

import { create } from 'zustand';
import type {
  Signal,
  SignalGroup,
  SignalSummary,
  SignalType,
  SignalStrength,
} from './types';

// ============================================================
// SIGNAL DEFINITIONS
// ============================================================

export const SIGNAL_TYPE_CONFIG: Record<
  SignalType,
  { label: string; icon: string; color: string }
> = {
  traffic: { label: 'Traffic', icon: '📊', color: 'blue' },
  seo: { label: 'SEO', icon: '🔍', color: 'green' },
  social: { label: 'Social', icon: '📱', color: 'purple' },
  brand: { label: 'Brand', icon: '🏷️', color: 'orange' },
  market: { label: 'Market', icon: '💹', color: 'cyan' },
  technical: { label: 'Technical', icon: '⚙️', color: 'gray' },
  financial: { label: 'Financial', icon: '💰', color: 'yellow' },
  legal: { label: 'Legal', icon: '⚖️', color: 'red' },
};

export const SIGNAL_STRENGTH_CONFIG: Record<
  SignalStrength,
  { label: string; color: string; weight: number }
> = {
  strong: { label: 'Strong', color: 'green', weight: 1.0 },
  moderate: { label: 'Moderate', color: 'blue', weight: 0.7 },
  weak: { label: 'Weak', color: 'yellow', weight: 0.4 },
  neutral: { label: 'Neutral', color: 'gray', weight: 0.2 },
  negative: { label: 'Negative', color: 'red', weight: -0.5 },
};

// ============================================================
// SIGNAL STORE
// ============================================================

interface SignalStore {
  signals: Map<string, SignalSummary>;
  isLoading: boolean;
  error: string | null;

  loadSignals: (domainId: string) => Promise<SignalSummary>;
  getSignals: (domainId: string) => SignalSummary | undefined;
  refreshSignals: (domainId: string) => Promise<void>;
  clearSignals: (domainId: string) => void;
}

export const useSignalStore = create<SignalStore>((set, get) => ({
  signals: new Map(),
  isLoading: false,
  error: null,

  loadSignals: async (domainId) => {
    set({ isLoading: true, error: null });
    try {
      // In production, this would call the API
      const summary = await fetchSignals(domainId);

      set((state) => ({
        signals: new Map(state.signals).set(domainId, summary),
        isLoading: false,
      }));

      return summary;
    } catch (error) {
      set({ error: 'Failed to load signals', isLoading: false });
      throw error;
    }
  },

  getSignals: (domainId) => {
    return get().signals.get(domainId);
  },

  refreshSignals: async (domainId) => {
    await get().loadSignals(domainId);
  },

  clearSignals: (domainId) => {
    set((state) => {
      const signals = new Map(state.signals);
      signals.delete(domainId);
      return { signals };
    });
  },
}));

// ============================================================
// SIGNAL API
// ============================================================

/**
 * Fetch signals for a domain
 */
async function fetchSignals(domainId: string): Promise<SignalSummary> {
  // In production, this would call the API
  // For now, generate mock signals
  return generateMockSignalSummary(domainId);
}

/**
 * Calculate overall signal score
 */
export function calculateSignalScore(signals: Signal[]): number {
  if (signals.length === 0) return 0;

  let totalWeight = 0;
  let weightedSum = 0;

  for (const signal of signals) {
    const strengthWeight = SIGNAL_STRENGTH_CONFIG[signal.strength].weight;
    const confidenceWeight = signal.confidence;
    const weight = strengthWeight * confidenceWeight;

    weightedSum += signal.value * weight;
    totalWeight += Math.abs(weight);
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

/**
 * Determine signal strength from value
 */
export function determineStrength(value: number): SignalStrength {
  if (value >= 80) return 'strong';
  if (value >= 60) return 'moderate';
  if (value >= 40) return 'weak';
  if (value >= 20) return 'neutral';
  return 'negative';
}

/**
 * Group signals by type
 */
export function groupSignals(signals: Signal[]): SignalGroup[] {
  const groups = new Map<SignalType, Signal[]>();

  for (const signal of signals) {
    const existing = groups.get(signal.type) || [];
    groups.set(signal.type, [...existing, signal]);
  }

  return Array.from(groups.entries()).map(([type, typeSignals]) => {
    const config = SIGNAL_TYPE_CONFIG[type];
    const aggregateScore = calculateSignalScore(typeSignals);

    return {
      type,
      label: config.label,
      icon: config.icon,
      signals: typeSignals,
      aggregateScore,
      aggregateStrength: determineStrength(aggregateScore),
    };
  });
}

/**
 * Get top signals by strength
 */
export function getTopSignals(signals: Signal[], limit: number = 5): Signal[] {
  return [...signals]
    .sort((a, b) => {
      const aWeight = SIGNAL_STRENGTH_CONFIG[a.strength].weight * a.value;
      const bWeight = SIGNAL_STRENGTH_CONFIG[b.strength].weight * b.value;
      return bWeight - aWeight;
    })
    .slice(0, limit);
}

/**
 * Get negative signals (concerns)
 */
export function getNegativeSignals(signals: Signal[]): Signal[] {
  return signals.filter((s) => s.strength === 'negative' || s.value < 30);
}

/**
 * Format signal value for display
 */
export function formatSignalValue(signal: Signal): string {
  if (typeof signal.rawValue === 'number') {
    if (signal.type === 'traffic') {
      return formatNumber(signal.rawValue);
    }
    if (signal.type === 'financial') {
      return formatCurrency(signal.rawValue);
    }
    return signal.rawValue.toLocaleString();
  }
  return String(signal.rawValue);
}

// ============================================================
// MOCK DATA GENERATORS
// ============================================================

function generateMockSignalSummary(domainId: string): SignalSummary {
  const signals = generateMockSignals();
  const groups = groupSignals(signals);

  return {
    domainId,
    domain: `example-${domainId.slice(-4)}.com`,
    totalSignals: signals.length,
    strongSignals: signals.filter((s) => s.strength === 'strong').length,
    weakSignals: signals.filter((s) => s.strength === 'weak').length,
    negativeSignals: signals.filter((s) => s.strength === 'negative').length,
    overallScore: calculateSignalScore(signals),
    groups,
    lastUpdated: new Date(),
  };
}

function generateMockSignals(): Signal[] {
  const signalTemplates: Array<Omit<Signal, 'id' | 'timestamp' | 'confidence'>> = [
    // Traffic signals
    {
      type: 'traffic',
      name: 'Monthly Visitors',
      description: 'Estimated monthly unique visitors',
      strength: 'strong',
      value: 85,
      rawValue: 125000,
      source: 'SimilarWeb',
      trend: 'up',
    },
    {
      type: 'traffic',
      name: 'Bounce Rate',
      description: 'Percentage of single-page visits',
      strength: 'moderate',
      value: 65,
      rawValue: '35%',
      source: 'SimilarWeb',
      trend: 'stable',
    },
    // SEO signals
    {
      type: 'seo',
      name: 'Domain Authority',
      description: 'Moz Domain Authority score',
      strength: 'strong',
      value: 78,
      rawValue: 78,
      source: 'Moz',
    },
    {
      type: 'seo',
      name: 'Backlinks',
      description: 'Total number of backlinks',
      strength: 'moderate',
      value: 62,
      rawValue: 15420,
      source: 'Ahrefs',
      trend: 'up',
    },
    // Social signals
    {
      type: 'social',
      name: 'Social Mentions',
      description: 'Monthly brand mentions',
      strength: 'moderate',
      value: 55,
      rawValue: 2340,
      source: 'BrandWatch',
      trend: 'up',
    },
    // Brand signals
    {
      type: 'brand',
      name: 'Brand Search Volume',
      description: 'Monthly branded searches',
      strength: 'strong',
      value: 82,
      rawValue: 8900,
      source: 'Google Trends',
      trend: 'up',
    },
    {
      type: 'brand',
      name: 'Trademark Status',
      description: 'Trademark registration status',
      strength: 'neutral',
      value: 50,
      rawValue: 'No conflicts found',
      source: 'USPTO',
    },
    // Market signals
    {
      type: 'market',
      name: 'Comparable Sales',
      description: 'Recent sales of similar domains',
      strength: 'moderate',
      value: 68,
      rawValue: '$45,000 avg',
      source: 'NameBio',
    },
    // Technical signals
    {
      type: 'technical',
      name: 'SSL Certificate',
      description: 'SSL certificate status',
      strength: 'strong',
      value: 95,
      rawValue: 'Valid',
      source: 'SSL Labs',
    },
    {
      type: 'technical',
      name: 'DNS Health',
      description: 'DNS configuration health',
      strength: 'strong',
      value: 90,
      rawValue: 'Healthy',
      source: 'DNSChecker',
    },
    // Financial signals
    {
      type: 'financial',
      name: 'Estimated Value',
      description: 'AI-estimated domain value',
      strength: 'moderate',
      value: 70,
      rawValue: 75000,
      source: 'PremiumRadar AI',
    },
    // Legal signals
    {
      type: 'legal',
      name: 'UDRP History',
      description: 'Domain dispute history',
      strength: 'strong',
      value: 100,
      rawValue: 'No disputes',
      source: 'WIPO',
    },
  ];

  return signalTemplates.map((template, i) => ({
    ...template,
    id: `signal_${i + 1}`,
    timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    confidence: 0.7 + Math.random() * 0.3,
  }));
}

// ============================================================
// HELPERS
// ============================================================

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

function formatCurrency(num: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Get signal type color
 */
export function getSignalTypeColor(type: SignalType): string {
  return SIGNAL_TYPE_CONFIG[type].color;
}

/**
 * Get signal strength color
 */
export function getSignalStrengthColor(strength: SignalStrength): string {
  return SIGNAL_STRENGTH_CONFIG[strength].color;
}
