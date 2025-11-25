/**
 * Discovery Module
 *
 * Domain discovery, signals, company profiles, and enrichment.
 */

// Types
export type {
  // Signal types
  SignalType,
  SignalStrength,
  Signal,
  SignalGroup,
  SignalSummary,
  // Company types
  CompanyProfile,
  EmployeeRange,
  RevenueRange,
  FundingStage,
  Location,
  SocialProfiles,
  DataQuality,
  // Enrichment types
  EnrichmentSource,
  EnrichmentStatus,
  EnrichmentRequest,
  EnrichmentResult,
  EnrichmentSourceResult,
  EnrichmentJob,
  // Discovery types
  DiscoveryMode,
  DiscoveryQuery,
  DiscoveryFilters,
  DiscoveryResult,
  DomainScores,
  DiscoveryResponse,
  SavedSearch,
  WatchlistItem,
  WatchlistAlert,
  PricePoint,
} from './types';

// Signals
export {
  SIGNAL_TYPE_CONFIG,
  SIGNAL_STRENGTH_CONFIG,
  useSignalStore,
  calculateSignalScore,
  determineStrength,
  groupSignals,
  getTopSignals,
  getNegativeSignals,
  formatSignalValue,
  getSignalTypeColor,
  getSignalStrengthColor,
} from './signals';

// Company Profiles
export {
  useCompanyProfileStore,
  enrichCompanyProfile,
  getEmployeeRangeLabel,
  getRevenueRangeLabel,
  getFundingStageLabel,
  getFundingStageColor,
  calculateDataQuality,
  getCompanySizeCategory,
  formatLocation,
  getSocialProfileUrl,
} from './company-profiles';

// Enrichment
export {
  ENRICHMENT_SOURCE_CONFIG,
  useEnrichmentStore,
  enrichDomain,
  getRecommendedSources,
  estimateEnrichmentTime,
  getSourceStatusColor,
  calculateEnrichmentCompleteness,
  mergeEnrichmentData,
} from './enrichment';

// Discovery Engine
export {
  DISCOVERY_MODE_CONFIG,
  useDiscoveryStore,
  buildDiscoveryQuery,
  getFilterSummary,
  sortResults,
  formatMatchReason,
} from './discovery-engine';
