/**
 * S311-S315: AI Integration Module
 * Part of User & Enterprise Management Program v1.1
 * Phase E - AI & BTE Integration
 *
 * Central export for all AI-related services.
 */

// Enterprise Context (S311-S312)
export {
  getEnterpriseAIContext,
  requireEnterpriseAIContext,
  getSIVAContext,
  canPerformAIOperation,
  storeEnterpriseEvidencePack,
  getEnterpriseEvidencePacks,
  addEnterpriseDiscoveryFilter,
  addEnterpriseRankingFilter,
  enterpriseAIContext,
} from './enterprise-context';

export type {
  EnterpriseAIContext,
  EnterpriseContextOptions,
} from './enterprise-context';

// Enterprise SIVA (S312-S314)
export {
  enterpriseScore,
  enterpriseRank,
  enterpriseScoreAndRank,
  enterpriseGetInsights,
  enterpriseGetDashboardInsights,
  enterpriseSiva,
} from './enterprise-siva';

export type {
  EnterpriseScoreRequest,
  EnterpriseRankRequest,
  EnterpriseScoreResult,
  EnterpriseRankResult,
} from './enterprise-siva';
