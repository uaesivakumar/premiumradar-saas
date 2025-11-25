/**
 * Ranking Module Types
 *
 * Type definitions for ranking engine, explanations, and UI.
 */

// ============================================================
// RANKING TYPES
// ============================================================

export interface RankedDomain {
  id: string;
  domain: string;
  rank: number;
  previousRank?: number;
  scores: RankingScores;
  explanation: RankingExplanation;
  signals: RankingSignal[];
  metadata: RankingMetadata;
  lastUpdated: Date;
}

export interface RankingScores {
  quality: number;      // Q score (0-100)
  traffic: number;      // T score (0-100)
  liquidity: number;    // L score (0-100)
  endUser: number;      // E score (0-100)
  composite: number;    // Weighted composite (0-100)
  confidence: number;   // Confidence level (0-1)
}

export interface RankingExplanation {
  summary: string;
  topFactors: ExplanationFactor[];
  detailedBreakdown: ScoreBreakdown[];
  comparisons: DomainComparison[];
  recommendations: string[];
}

export interface ExplanationFactor {
  id: string;
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  contribution: number;
  description: string;
}

export interface ScoreBreakdown {
  category: 'quality' | 'traffic' | 'liquidity' | 'endUser';
  score: number;
  weight: number;
  contribution: number;
  factors: BreakdownFactor[];
}

export interface BreakdownFactor {
  name: string;
  value: number | string;
  score: number;
  weight: number;
  description: string;
}

export interface DomainComparison {
  domain: string;
  composite: number;
  difference: number;
  strengths: string[];
  weaknesses: string[];
}

export interface RankingSignal {
  type: string;
  name: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  importance: 'high' | 'medium' | 'low';
}

export interface RankingMetadata {
  vertical?: string;
  tld: string;
  length: number;
  hasNumbers: boolean;
  hasHyphens: boolean;
  estimatedValue?: number;
  available: boolean;
}

// ============================================================
// RANKING LIST TYPES
// ============================================================

export interface RankingList {
  id: string;
  name: string;
  description?: string;
  domains: RankedDomain[];
  sortBy: RankingSortOption;
  filters: RankingFilters;
  createdAt: Date;
  updatedAt: Date;
}

export type RankingSortOption =
  | 'composite'
  | 'quality'
  | 'traffic'
  | 'liquidity'
  | 'endUser'
  | 'rank'
  | 'change';

export interface RankingFilters {
  minScore?: number;
  maxScore?: number;
  verticals?: string[];
  tlds?: string[];
  minLength?: number;
  maxLength?: number;
  excludeNumbers?: boolean;
  excludeHyphens?: boolean;
  showAvailableOnly?: boolean;
}

// ============================================================
// RANKING CONFIG TYPES
// ============================================================

export interface RankingConfig {
  weights: CategoryWeights;
  thresholds: ScoreThresholds;
  modifiers: ScoreModifiers;
}

export interface CategoryWeights {
  quality: number;      // Weight for Q score
  traffic: number;      // Weight for T score
  liquidity: number;    // Weight for L score
  endUser: number;      // Weight for E score
}

export interface ScoreThresholds {
  excellent: number;    // Score >= this is excellent
  good: number;         // Score >= this is good
  fair: number;         // Score >= this is fair
  poor: number;         // Below this is poor
}

export interface ScoreModifiers {
  premiumTldBonus: number;
  shortLengthBonus: number;
  hyphenPenalty: number;
  numberPenalty: number;
  exactMatchBonus: number;
  brandableBonus: number;
}

// ============================================================
// RANKING DISPLAY TYPES
// ============================================================

export type RankingViewMode = 'cards' | 'table' | 'compact';

export interface RankingDisplayConfig {
  viewMode: RankingViewMode;
  showExplanations: boolean;
  showSignals: boolean;
  showComparisons: boolean;
  highlightChanges: boolean;
  pageSize: number;
}

export interface RankChangeIndicator {
  direction: 'up' | 'down' | 'stable' | 'new';
  amount: number;
  color: string;
  icon: string;
}

// ============================================================
// RANKING HISTORY TYPES
// ============================================================

export interface RankingSnapshot {
  id: string;
  timestamp: Date;
  domains: Array<{
    domain: string;
    rank: number;
    composite: number;
  }>;
}

export interface RankingTrend {
  domain: string;
  history: Array<{
    date: Date;
    rank: number;
    composite: number;
  }>;
  trend: 'improving' | 'declining' | 'stable';
  volatility: number;
}
