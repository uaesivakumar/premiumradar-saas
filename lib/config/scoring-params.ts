/**
 * Global Scoring Parameters
 *
 * Configuration for the Q/T/L/E scoring system including
 * weights, thresholds, and modifiers.
 */

import { create } from 'zustand';
import type { ScoringParameters, ScoringParametersUpdate } from './types';

// ============================================================
// DEFAULT SCORING PARAMETERS
// ============================================================

export const DEFAULT_SCORING_PARAMS: ScoringParameters = {
  // Quality Score Weights (sum to 1.0)
  qualityWeights: {
    length: 0.25,
    memorability: 0.25,
    pronunciation: 0.2,
    typoResistance: 0.15,
    brandability: 0.15,
  },

  // Traffic Score Weights
  trafficWeights: {
    searchVolume: 0.35,
    clickThroughRate: 0.25,
    competitionLevel: 0.2,
    trendDirection: 0.2,
  },

  // Liquidity Score Weights
  liquidityWeights: {
    recentSales: 0.3,
    marketDepth: 0.25,
    priceStability: 0.25,
    demandIndicators: 0.2,
  },

  // End-User Value Weights
  endUserWeights: {
    industryRelevance: 0.3,
    commercialIntent: 0.3,
    geographicRelevance: 0.2,
    legalClearance: 0.2,
  },

  // Thresholds
  thresholds: {
    highQuality: 80,
    mediumQuality: 50,
    highTraffic: 75,
    mediumTraffic: 40,
    highLiquidity: 70,
    mediumLiquidity: 35,
  },

  // Modifiers
  modifiers: {
    premiumTldBonus: 10,
    shortLengthBonus: 15,
    keywordMatchBonus: 8,
    newTldPenalty: -5,
    hyphenPenalty: -10,
    numberPenalty: -8,
  },
};

// ============================================================
// SCORING PARAMETERS STORE
// ============================================================

interface ScoringParamsStore {
  params: ScoringParameters;
  history: ScoringParamsHistory[];
  isLoading: boolean;
  error: string | null;
  isDirty: boolean;

  loadParams: () => Promise<void>;
  updateParam: (update: ScoringParametersUpdate) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  validateWeights: (category: keyof ScoringParameters) => ValidationResult;
  calculateScore: (
    category: 'quality' | 'traffic' | 'liquidity' | 'endUser',
    values: Record<string, number>
  ) => number;
}

interface ScoringParamsHistory {
  id: string;
  category: keyof ScoringParameters;
  key: string;
  previousValue: number;
  newValue: number;
  changedBy: string;
  changedAt: Date;
  reason: string;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  sum?: number;
}

export const useScoringParamsStore = create<ScoringParamsStore>((set, get) => ({
  params: DEFAULT_SCORING_PARAMS,
  history: [],
  isLoading: false,
  error: null,
  isDirty: false,

  loadParams: async () => {
    set({ isLoading: true, error: null });
    try {
      // In production, this would fetch from API
      await new Promise((resolve) => setTimeout(resolve, 100));
      set({ params: DEFAULT_SCORING_PARAMS, isLoading: false, isDirty: false });
    } catch (error) {
      set({ error: 'Failed to load scoring parameters', isLoading: false });
    }
  },

  updateParam: async (update) => {
    const { params, history } = get();

    const category = params[update.category];
    if (typeof category !== 'object') {
      throw new Error(`Invalid category: ${update.category}`);
    }

    const currentValue = (category as Record<string, number>)[update.key];
    if (currentValue === undefined) {
      throw new Error(`Invalid key: ${update.key} in category ${update.category}`);
    }

    // Create new params object
    const newParams = {
      ...params,
      [update.category]: {
        ...category,
        [update.key]: update.value,
      },
    };

    // Validate weights if it's a weight category
    if (update.category.includes('Weights')) {
      const validation = validateWeightsInternal(newParams[update.category] as Record<string, number>);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
    }

    // Create history entry
    const historyEntry: ScoringParamsHistory = {
      id: `hist_${Date.now()}`,
      category: update.category,
      key: update.key,
      previousValue: currentValue,
      newValue: update.value,
      changedBy: 'admin', // Would come from auth context
      changedAt: new Date(),
      reason: update.reason,
    };

    set({
      params: newParams,
      history: [historyEntry, ...history],
      isDirty: true,
    });

    console.log('[SCORING PARAMS UPDATE]', update);
  },

  resetToDefaults: async () => {
    const { history } = get();

    const historyEntry: ScoringParamsHistory = {
      id: `hist_${Date.now()}`,
      category: 'qualityWeights',
      key: 'all',
      previousValue: 0,
      newValue: 0,
      changedBy: 'admin',
      changedAt: new Date(),
      reason: 'Reset to defaults',
    };

    set({
      params: DEFAULT_SCORING_PARAMS,
      history: [historyEntry, ...history],
      isDirty: true,
    });
  },

  validateWeights: (category) => {
    const { params } = get();
    const weights = params[category];

    if (typeof weights !== 'object') {
      return { valid: false, error: 'Invalid category' };
    }

    return validateWeightsInternal(weights as Record<string, number>);
  },

  calculateScore: (category, values) => {
    const { params } = get();

    let weights: Record<string, number>;
    switch (category) {
      case 'quality':
        weights = params.qualityWeights;
        break;
      case 'traffic':
        weights = params.trafficWeights;
        break;
      case 'liquidity':
        weights = params.liquidityWeights;
        break;
      case 'endUser':
        weights = params.endUserWeights;
        break;
      default:
        return 0;
    }

    let score = 0;
    for (const [key, weight] of Object.entries(weights)) {
      const value = values[key] || 0;
      score += value * weight;
    }

    return Math.round(score);
  },
}));

// ============================================================
// VALIDATION
// ============================================================

function validateWeightsInternal(weights: Record<string, number>): ValidationResult {
  const values = Object.values(weights);
  const sum = values.reduce((a, b) => a + b, 0);

  // Allow small floating point errors
  if (Math.abs(sum - 1.0) > 0.01) {
    return {
      valid: false,
      error: `Weights must sum to 1.0 (current sum: ${sum.toFixed(2)})`,
      sum,
    };
  }

  // Check individual values
  for (const [key, value] of Object.entries(weights)) {
    if (value < 0 || value > 1) {
      return {
        valid: false,
        error: `Weight "${key}" must be between 0 and 1`,
      };
    }
  }

  return { valid: true, sum };
}

// ============================================================
// PARAMETER DEFINITIONS
// ============================================================

export interface ParamCategory {
  id: keyof ScoringParameters;
  title: string;
  description: string;
  icon: string;
  isWeights: boolean;
  params: ParamDefinition[];
}

export interface ParamDefinition {
  key: string;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

export const PARAM_CATEGORIES: ParamCategory[] = [
  {
    id: 'qualityWeights',
    title: 'Quality Score Weights',
    description: 'Weights for calculating domain quality score (must sum to 1.0)',
    icon: '⭐',
    isWeights: true,
    params: [
      { key: 'length', label: 'Length', description: 'Impact of domain length', min: 0, max: 1, step: 0.05 },
      { key: 'memorability', label: 'Memorability', description: 'How easy to remember', min: 0, max: 1, step: 0.05 },
      { key: 'pronunciation', label: 'Pronunciation', description: 'Ease of pronunciation', min: 0, max: 1, step: 0.05 },
      { key: 'typoResistance', label: 'Typo Resistance', description: 'Resistance to typos', min: 0, max: 1, step: 0.05 },
      { key: 'brandability', label: 'Brandability', description: 'Brand potential', min: 0, max: 1, step: 0.05 },
    ],
  },
  {
    id: 'trafficWeights',
    title: 'Traffic Score Weights',
    description: 'Weights for calculating traffic potential (must sum to 1.0)',
    icon: '📈',
    isWeights: true,
    params: [
      { key: 'searchVolume', label: 'Search Volume', description: 'Keyword search volume', min: 0, max: 1, step: 0.05 },
      { key: 'clickThroughRate', label: 'Click-Through Rate', description: 'Expected CTR', min: 0, max: 1, step: 0.05 },
      { key: 'competitionLevel', label: 'Competition Level', description: 'Market competition', min: 0, max: 1, step: 0.05 },
      { key: 'trendDirection', label: 'Trend Direction', description: 'Search trend', min: 0, max: 1, step: 0.05 },
    ],
  },
  {
    id: 'liquidityWeights',
    title: 'Liquidity Score Weights',
    description: 'Weights for calculating market liquidity (must sum to 1.0)',
    icon: '💧',
    isWeights: true,
    params: [
      { key: 'recentSales', label: 'Recent Sales', description: 'Volume of recent sales', min: 0, max: 1, step: 0.05 },
      { key: 'marketDepth', label: 'Market Depth', description: 'Buyer/seller depth', min: 0, max: 1, step: 0.05 },
      { key: 'priceStability', label: 'Price Stability', description: 'Price consistency', min: 0, max: 1, step: 0.05 },
      { key: 'demandIndicators', label: 'Demand Indicators', description: 'Demand signals', min: 0, max: 1, step: 0.05 },
    ],
  },
  {
    id: 'endUserWeights',
    title: 'End-User Value Weights',
    description: 'Weights for calculating end-user value (must sum to 1.0)',
    icon: '👤',
    isWeights: true,
    params: [
      { key: 'industryRelevance', label: 'Industry Relevance', description: 'Industry fit', min: 0, max: 1, step: 0.05 },
      { key: 'commercialIntent', label: 'Commercial Intent', description: 'Purchase intent', min: 0, max: 1, step: 0.05 },
      { key: 'geographicRelevance', label: 'Geographic Relevance', description: 'Location fit', min: 0, max: 1, step: 0.05 },
      { key: 'legalClearance', label: 'Legal Clearance', description: 'Trademark safety', min: 0, max: 1, step: 0.05 },
    ],
  },
  {
    id: 'thresholds',
    title: 'Score Thresholds',
    description: 'Thresholds for categorizing scores as high, medium, or low',
    icon: '📊',
    isWeights: false,
    params: [
      { key: 'highQuality', label: 'High Quality', description: 'Threshold for high quality', min: 0, max: 100, step: 5 },
      { key: 'mediumQuality', label: 'Medium Quality', description: 'Threshold for medium quality', min: 0, max: 100, step: 5 },
      { key: 'highTraffic', label: 'High Traffic', description: 'Threshold for high traffic', min: 0, max: 100, step: 5 },
      { key: 'mediumTraffic', label: 'Medium Traffic', description: 'Threshold for medium traffic', min: 0, max: 100, step: 5 },
      { key: 'highLiquidity', label: 'High Liquidity', description: 'Threshold for high liquidity', min: 0, max: 100, step: 5 },
      { key: 'mediumLiquidity', label: 'Medium Liquidity', description: 'Threshold for medium liquidity', min: 0, max: 100, step: 5 },
    ],
  },
  {
    id: 'modifiers',
    title: 'Score Modifiers',
    description: 'Bonuses and penalties applied to base scores',
    icon: '⚡',
    isWeights: false,
    params: [
      { key: 'premiumTldBonus', label: 'Premium TLD Bonus', description: 'Bonus for .com, .net, etc.', min: -50, max: 50, step: 1 },
      { key: 'shortLengthBonus', label: 'Short Length Bonus', description: 'Bonus for short domains', min: -50, max: 50, step: 1 },
      { key: 'keywordMatchBonus', label: 'Keyword Match Bonus', description: 'Bonus for keyword match', min: -50, max: 50, step: 1 },
      { key: 'newTldPenalty', label: 'New TLD Penalty', description: 'Penalty for new TLDs', min: -50, max: 50, step: 1 },
      { key: 'hyphenPenalty', label: 'Hyphen Penalty', description: 'Penalty for hyphens', min: -50, max: 50, step: 1 },
      { key: 'numberPenalty', label: 'Number Penalty', description: 'Penalty for numbers', min: -50, max: 50, step: 1 },
    ],
  },
];

// ============================================================
// HELPERS
// ============================================================

/**
 * Get parameter definition by category and key
 */
export function getParamDefinition(category: keyof ScoringParameters, key: string): ParamDefinition | undefined {
  const cat = PARAM_CATEGORIES.find((c) => c.id === category);
  return cat?.params.find((p) => p.key === key);
}

/**
 * Calculate composite score from all categories
 */
export function calculateCompositeScore(
  quality: number,
  traffic: number,
  liquidity: number,
  endUser: number
): number {
  // Default composite weights
  const weights = {
    quality: 0.25,
    traffic: 0.25,
    liquidity: 0.25,
    endUser: 0.25,
  };

  return Math.round(
    quality * weights.quality +
      traffic * weights.traffic +
      liquidity * weights.liquidity +
      endUser * weights.endUser
  );
}

/**
 * Get score category based on thresholds
 */
export function getScoreCategory(
  score: number,
  type: 'quality' | 'traffic' | 'liquidity',
  thresholds: ScoringParameters['thresholds']
): 'high' | 'medium' | 'low' {
  const highKey = `high${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof typeof thresholds;
  const mediumKey = `medium${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof typeof thresholds;

  if (score >= thresholds[highKey]) return 'high';
  if (score >= thresholds[mediumKey]) return 'medium';
  return 'low';
}

/**
 * Get score category color
 */
export function getScoreCategoryColor(category: 'high' | 'medium' | 'low'): string {
  const colors = {
    high: 'green',
    medium: 'yellow',
    low: 'red',
  };
  return colors[category];
}
