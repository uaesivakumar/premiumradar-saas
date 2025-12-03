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

// =============================================================================
// S55: DISCOVERY UI EXPORTS
// =============================================================================

// S55 Types
export type {
  // Discovery Item
  DiscoveryListItem,
  CompanyBasicInfo,
  CompanySizeCategory,
  CompanyLocationInfo,
  DiscoveryScoreBreakdown,
  EvidenceMetricsSummary,
  SignalMetrics,
  FreshnessStatus,
  // Evidence Panel
  EvidencePanelData,
  ProviderData,
  CategoryData,
  TimelineEntry,
  FreshnessData,
  EvidenceTableItem,
  // Signal Impact Panel
  SignalImpactData,
  SignalImpactCategory,
  SignalImpactPanelData,
  // Object Graph Mini
  ObjectGraphMiniData,
  GraphNeighborNode,
  GraphEdgeData,
  // Score Breakdown
  ScoreBreakdownData,
  ScoreComponentData,
  ScoreWeightsData,
  ScoreFactorData,
  // Company Profile Card
  CompanyProfileCardData,
  CompanyProfileDetails,
  CompanyIntelligenceData,
  ActivityEntry,
  VerticalContextData,
  OSObjectStateData,
  // Filters
  DiscoveryUIFilter,
  DiscoveryDateRange,
  DiscoverySortOption,
  // Stats
  DiscoveryStatsData,
  IndustryStatCount,
  SizeStatCount,
  FreshnessStatCount,
  ScoreRangeStatCount,
  // Config
  VerticalDiscoveryConfigData,
  // API Responses
  DiscoveryListAPIResponse,
  CompanyProfileAPIResponse,
  EvidenceSummaryAPIResponse,
  SignalImpactAPIResponse,
  ScoreBreakdownAPIResponse,
  ObjectGraphAPIResponse,
} from './types';

// S55 Fetchers
export {
  fetchDiscoveryList,
  fetchEvidenceSummary,
  fetchObjectGraphMini,
  fetchSignalImpacts,
  fetchScoreBreakdown,
  fetchCompanyProfile,
  fetchFullDiscoveryData,
} from './ui-fetchers';

export type { FullDiscoveryData } from './ui-fetchers';

// S55 Transformers
export {
  transformDiscoveryResponse,
  buildEvidenceSummary,
  buildSignalList,
  buildGraphMini,
  buildScoreBreakdown,
  buildCompanyProfileCard,
} from './ui-transformers';

export type {
  OSDiscoveryResponse,
  OSEvidenceResponse,
  OSSignalResponse,
  OSGraphResponse,
  OSScoreResponse,
  OSProfileResponse,
} from './ui-transformers';

// S55 Hooks
export {
  useDiscoveryList,
  useDiscoveryFilters,
  useCompanyProfile,
  useEvidenceSummary,
  useSignalImpacts,
  useScoreBreakdown,
  useObjectGraphMini,
  useFullDiscoveryData,
  useSelectedCompany,
} from './ui-hooks';

export type {
  UseDiscoveryListOptions,
  UseDiscoveryListReturn,
  UseDiscoveryFiltersReturn,
  UseCompanyProfileReturn,
  UseEvidenceSummaryReturn,
  UseSignalImpactsReturn,
  UseScoreBreakdownReturn,
  UseObjectGraphMiniReturn,
  UseFullDiscoveryDataReturn,
  UseSelectedCompanyReturn,
} from './ui-hooks';
