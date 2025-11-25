/**
 * Ranking Module
 *
 * Domain ranking engine with explanations.
 */

// Types
export type {
  RankedDomain,
  RankingScores,
  RankingExplanation,
  ExplanationFactor,
  ScoreBreakdown,
  BreakdownFactor,
  DomainComparison,
  RankingSignal,
  RankingMetadata,
  RankingList,
  RankingSortOption,
  RankingFilters,
  RankingConfig,
  CategoryWeights,
  ScoreThresholds,
  ScoreModifiers,
  RankingViewMode,
  RankingDisplayConfig,
  RankChangeIndicator,
  RankingSnapshot,
  RankingTrend,
} from './types';

// Ranking Engine
export {
  DEFAULT_RANKING_CONFIG,
  useRankingStore,
  calculateCompositeScore,
  applyModifiers,
  calculateConfidence,
  getScoreTier,
  getTierColor,
  getRankChangeIndicator,
  formatScore,
  getCategoryIcon,
  getCategoryLabel,
} from './ranking-engine';

// Explanations
export {
  generateExplanation,
  generateSummary,
  generateTopFactors,
  generateDetailedBreakdown,
  generateComparisons,
  generateRecommendations,
  formatFactorImpact,
  getImpactColor,
  getBreakdownChartData,
  summarizeBreakdown,
} from './explanations';
