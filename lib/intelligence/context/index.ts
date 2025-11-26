/**
 * Sales Context Module
 *
 * Provides the Vertical → Sub-Vertical → Region context layer
 * that sits above SIVA Intelligence.
 *
 * ARCHITECTURE:
 * - SaaS Frontend ONLY selects: vertical/sub-vertical/region
 * - UPR OS DECIDES: which signals, how reasoning, how routing
 * - This module LOADS rules from OS, applies to SIVA wrappers
 *
 * DIFFERENT VERTICALS TARGET DIFFERENT ENTITIES:
 * - Banking → Companies
 * - Insurance → Individuals
 * - Real Estate → Families
 * - Recruitment → Candidates
 *
 * HIRING SIGNALS ARE ONLY FOR BANKING.
 */

// Types
export type {
  Vertical,
  SubVertical,
  BankingSubVertical,
  InsuranceSubVertical,
  RealEstateSubVertical,
  RecruitmentSubVertical,
  SaaSSubVertical,
  RadarTarget,
  RegionContext,
  SalesContext,
  SalesConfig,
  IndividualCriteria,
  CompanySize,
  SignalSensitivity,
  ProductKPI,
  SalesSignalType,
  SalesSignal,
  ContextFilter,
  SignalMatchPredicate,
  // OS Config types
  VerticalConfig,
  SubVerticalConfig,
  ScoringFactorConfig,
  PlaybookConfig,
  RegionConfig,
  KPITemplate,
} from './types';

export {
  DEFAULT_SALES_CONTEXT,
  DEFAULT_BANKING_CONFIG,
  VERTICAL_RADAR_TARGETS,
} from './types';

// Provider functions
export {
  // Context creation
  createSalesContext,
  updateSalesContext,
  applyVerticalConfig,

  // Radar target helpers
  getRadarTarget,
  targetsCompanies,
  hiringSignalsRelevant,

  // Filtering (OS-configured)
  getAllowedSignalTypes,
  isSignalTypeAllowed,
  createContextFilter,
  signalMatchesContext,
  filterSignalsByContext,

  // Signal relevance
  scoreSignalRelevance,

  // Serialization
  serializeSalesContext,
  deserializeSalesContext,

  // Validation
  isValidSubVertical,
  getSubVerticalsForVertical,

  // Display helpers
  getVerticalDisplayName,
  getSubVerticalDisplayName,
  getRadarTargetDescription,
} from './SalesContextProvider';
