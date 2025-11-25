/**
 * Q/T/L/E Scoring Module
 *
 * Export all scoring functionality for the banking vertical.
 */

// Core Engine
export { QTLEEngine, qtleEngine } from './qtle-engine';

// Types
export type {
  QTLEScore,
  Signal,
  CompanyProfile,
  ScoringConfig,
  CategoryWeights,
  GradeThresholds,
  RegionalMultipliers,
  IndustryAdjustments,
  BankingSignal,
  BankingCompanyProfile,
} from './types';

// Banking Signals
export {
  BANKING_ADJUSTMENTS,
  BANKING_KPIS,
  BANKING_SIGNAL_LIBRARY,
  createBankingSignal,
  applyBankingAdjustments,
} from './banking-signals';

// Regional Weighting
export {
  GCC_REGIONAL_MULTIPLIERS,
  UAE_TIMING_SIGNALS,
  UAE_B2B_BANKING_ADJUSTMENTS,
  calculateRegionalTimingBoost,
  getRegionalContext,
} from './regional-weights';
