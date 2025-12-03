/**
 * Discovery Types
 *
 * Type definitions for discovery, signals, company profiles,
 * and enrichment functionality.
 */

// ============================================================
// SIGNAL TYPES
// ============================================================

export type SignalType =
  | 'traffic'
  | 'seo'
  | 'social'
  | 'brand'
  | 'market'
  | 'technical'
  | 'financial'
  | 'legal';

export type SignalStrength = 'strong' | 'moderate' | 'weak' | 'neutral' | 'negative';

export interface Signal {
  id: string;
  type: SignalType;
  name: string;
  description: string;
  strength: SignalStrength;
  value: number; // 0-100
  rawValue: string | number;
  source: string;
  confidence: number; // 0-1
  timestamp: Date;
  trend?: 'up' | 'down' | 'stable';
  metadata?: Record<string, unknown>;
}

export interface SignalGroup {
  type: SignalType;
  label: string;
  icon: string;
  signals: Signal[];
  aggregateScore: number;
  aggregateStrength: SignalStrength;
}

export interface SignalSummary {
  domainId: string;
  domain: string;
  totalSignals: number;
  strongSignals: number;
  weakSignals: number;
  negativeSignals: number;
  overallScore: number;
  groups: SignalGroup[];
  lastUpdated: Date;
}

// ============================================================
// COMPANY PROFILE TYPES
// ============================================================

export interface CompanyProfile {
  id: string;
  name: string;
  domain: string;
  description: string;
  industry: string;
  subIndustry?: string;
  foundedYear?: number;
  employeeCount?: EmployeeRange;
  revenue?: RevenueRange;
  fundingStage?: FundingStage;
  totalFunding?: number;
  headquarters: Location;
  socialProfiles: SocialProfiles;
  technologies: string[];
  keywords: string[];
  competitors: string[];
  lastUpdated: Date;
  dataQuality: DataQuality;
}

export type EmployeeRange =
  | '1-10'
  | '11-50'
  | '51-200'
  | '201-500'
  | '501-1000'
  | '1001-5000'
  | '5000+';

export type RevenueRange =
  | 'pre-revenue'
  | '<1M'
  | '1M-10M'
  | '10M-50M'
  | '50M-100M'
  | '100M-500M'
  | '500M-1B'
  | '1B+';

export type FundingStage =
  | 'bootstrapped'
  | 'pre-seed'
  | 'seed'
  | 'series-a'
  | 'series-b'
  | 'series-c'
  | 'series-d+'
  | 'public'
  | 'acquired';

export interface Location {
  city?: string;
  state?: string;
  country: string;
  region?: string;
}

export interface SocialProfiles {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  crunchbase?: string;
}

export interface DataQuality {
  score: number; // 0-100
  completeness: number; // 0-1
  freshness: number; // 0-1
  accuracy: number; // 0-1
  sources: string[];
}

// ============================================================
// ENRICHMENT TYPES
// ============================================================

export type EnrichmentSource =
  | 'whois'
  | 'dns'
  | 'ssl'
  | 'traffic'
  | 'seo'
  | 'social'
  | 'company'
  | 'market';

export type EnrichmentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'partial';

export interface EnrichmentRequest {
  domainId: string;
  domain: string;
  sources: EnrichmentSource[];
  priority: 'low' | 'normal' | 'high';
  callback?: string;
}

export interface EnrichmentResult {
  domainId: string;
  domain: string;
  status: EnrichmentStatus;
  sources: EnrichmentSourceResult[];
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  error?: string;
}

export interface EnrichmentSourceResult {
  source: EnrichmentSource;
  status: EnrichmentStatus;
  data: Record<string, unknown>;
  error?: string;
  duration: number;
}

export interface EnrichmentJob {
  id: string;
  requests: EnrichmentRequest[];
  status: EnrichmentStatus;
  progress: number; // 0-100
  completedCount: number;
  totalCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// DISCOVERY TYPES
// ============================================================

export type DiscoveryMode = 'keyword' | 'similar' | 'competitor' | 'trending' | 'expiring';

export interface DiscoveryQuery {
  mode: DiscoveryMode;
  query: string;
  filters: DiscoveryFilters;
  limit: number;
  offset: number;
}

export interface DiscoveryFilters {
  tlds?: string[];
  minLength?: number;
  maxLength?: number;
  minPrice?: number;
  maxPrice?: number;
  minScore?: number;
  excludeHyphens?: boolean;
  excludeNumbers?: boolean;
  vertical?: string;
  registrar?: string[];
  expiringWithin?: number; // days
}

export interface DiscoveryResult {
  id: string;
  domain: string;
  tld: string;
  length: number;
  available: boolean;
  price?: number;
  scores: DomainScores;
  signals: Signal[];
  company?: CompanyProfile;
  matchReason: string;
  matchScore: number;
  vertical?: string;
}

export interface DomainScores {
  quality: number;
  traffic: number;
  liquidity: number;
  endUser: number;
  composite: number;
}

export interface DiscoveryResponse {
  query: DiscoveryQuery;
  results: DiscoveryResult[];
  totalCount: number;
  hasMore: boolean;
  processingTime: number;
  suggestions: string[];
}

// ============================================================
// SAVED SEARCH TYPES
// ============================================================

export interface SavedSearch {
  id: string;
  name: string;
  query: DiscoveryQuery;
  alertEnabled: boolean;
  alertFrequency?: 'instant' | 'daily' | 'weekly';
  lastRun?: Date;
  resultCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// WATCHLIST TYPES
// ============================================================

export interface WatchlistItem {
  id: string;
  domain: string;
  addedAt: Date;
  notes?: string;
  alerts: WatchlistAlert[];
  lastChecked: Date;
  currentPrice?: number;
  priceHistory: PricePoint[];
}

export interface WatchlistAlert {
  type: 'price_drop' | 'expiring' | 'status_change' | 'score_change';
  threshold?: number;
  enabled: boolean;
}

export interface PricePoint {
  price: number;
  timestamp: Date;
  source: string;
}

// ============================================================
// S55: DISCOVERY UI TYPES
// ============================================================

import type { VerticalId } from '../dashboard/types';

// Discovery Item for UI List
export interface DiscoveryListItem {
  id: string;
  objectId: string;
  company: CompanyBasicInfo;
  score: DiscoveryScoreBreakdown;
  evidence: EvidenceMetricsSummary;
  signalsSummary: SignalMetrics;
  freshness: FreshnessStatus;
  rank: number;
  discoveredAt: Date;
  lastUpdated: Date;
}

export interface CompanyBasicInfo {
  id: string;
  name: string;
  domain: string;
  logo?: string;
  industry: string;
  sector?: string;
  size: CompanySizeCategory;
  location: CompanyLocationInfo;
  description?: string;
}

export type CompanySizeCategory = 'startup' | 'small' | 'medium' | 'large' | 'enterprise';

export interface CompanyLocationInfo {
  city?: string;
  country: string;
  region?: string;
}

export interface DiscoveryScoreBreakdown {
  total: number;
  quality: number;
  timing: number;
  likelihood: number;
  engagement: number;
  confidence: number;
}

export interface EvidenceMetricsSummary {
  totalCount: number;
  providerCount: number;
  freshCount: number;
  staleCount: number;
  lastCollected: Date;
}

export interface SignalMetrics {
  positive: number;
  negative: number;
  neutral: number;
  topSignals: string[];
}

export type FreshnessStatus = 'fresh' | 'recent' | 'stale' | 'unknown';

// Evidence Summary Panel
export interface EvidencePanelData {
  objectId: string;
  totalEvidence: number;
  providers: ProviderData[];
  categories: CategoryData[];
  timeline: TimelineEntry[];
  freshnessBreakdown: FreshnessData;
  confidence: number;
  lastUpdated: Date;
}

export interface ProviderData {
  provider: string;
  count: number;
  freshness: FreshnessStatus;
  lastFetched: Date;
  confidence: number;
}

export interface CategoryData {
  category: string;
  count: number;
  avgConfidence: number;
}

export interface TimelineEntry {
  date: Date;
  count: number;
  providers: string[];
}

export interface FreshnessData {
  fresh: number;
  recent: number;
  stale: number;
  unknown: number;
}

export interface EvidenceTableItem {
  id: string;
  type: string;
  category: string;
  provider: string;
  title: string;
  content: string;
  confidence: number;
  timestamp: Date;
  source: string;
  metadata?: Record<string, unknown>;
}

// Signal Impact Panel
export interface SignalImpactData {
  id: string;
  type: string;
  category: SignalImpactCategory;
  name: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  scoreContribution: number;
  confidence: number;
  source: string;
  timestamp: Date;
}

export type SignalImpactCategory =
  | 'industry'
  | 'intent'
  | 'financial'
  | 'growth'
  | 'timing'
  | 'engagement'
  | 'risk';

export interface SignalImpactPanelData {
  objectId: string;
  signals: SignalImpactData[];
  totalPositive: number;
  totalNegative: number;
  netImpact: number;
  topPositive: SignalImpactData[];
  topNegative: SignalImpactData[];
  byCategory: Record<SignalImpactCategory, SignalImpactData[]>;
}

// Object Graph Mini
export interface ObjectGraphMiniData {
  objectId: string;
  objectType: string;
  label: string;
  neighbors: GraphNeighborNode[];
  edges: GraphEdgeData[];
  metadata: Record<string, unknown>;
}

export interface GraphNeighborNode {
  id: string;
  type: string;
  label: string;
  relationship: string;
  strength: number;
}

export interface GraphEdgeData {
  source: string;
  target: string;
  type: string;
  weight: number;
  label?: string;
}

// Score Breakdown Panel
export interface ScoreBreakdownData {
  objectId: string;
  totalScore: number;
  components: ScoreComponentData[];
  weights: ScoreWeightsData;
  explanation: string;
  factors: ScoreFactorData[];
  confidence: number;
  calculatedAt: Date;
}

export interface ScoreComponentData {
  id: string;
  name: string;
  value: number;
  weight: number;
  contribution: number;
  description: string;
  color: string;
}

export interface ScoreWeightsData {
  quality: number;
  timing: number;
  likelihood: number;
  engagement: number;
}

export interface ScoreFactorData {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  magnitude: number;
  description: string;
}

// Company Profile Card
export interface CompanyProfileCardData {
  objectId: string;
  company: CompanyBasicInfo;
  profile: CompanyProfileDetails;
  intelligence: CompanyIntelligenceData;
  verticalContext: VerticalContextData;
  osState: OSObjectStateData;
}

export interface CompanyProfileDetails {
  summary: string;
  founded?: number;
  employees?: number;
  revenue?: string;
  funding?: string;
  website: string;
  linkedin?: string;
  twitter?: string;
  technologies?: string[];
  keywords?: string[];
}

export interface CompanyIntelligenceData {
  score: DiscoveryScoreBreakdown;
  topSignals: SignalImpactData[];
  topEvidence: EvidenceTableItem[];
  recentActivity: ActivityEntry[];
  recommendations: string[];
}

export interface ActivityEntry {
  id: string;
  type: string;
  title: string;
  timestamp: Date;
  source: string;
}

export interface VerticalContextData {
  vertical: VerticalId;
  subVertical?: string;
  relevanceScore: number;
  applicableSignals: string[];
  verticalInsights: string[];
}

export interface OSObjectStateData {
  objectId: string;
  state: 'active' | 'stale' | 'archived';
  lastProcessed: Date;
  processingQueue: string[];
  enrichmentStatus: Record<string, 'pending' | 'complete' | 'failed'>;
}

// Discovery UI Filters
export interface DiscoveryUIFilter {
  vertical?: VerticalId;
  territory?: string;
  industries?: string[];
  companySizes?: CompanySizeCategory[];
  scoreRange?: { min: number; max: number };
  signals?: string[];
  freshness?: FreshnessStatus[];
  dateRange?: DiscoveryDateRange;
  searchQuery?: string;
  sortBy?: DiscoverySortOption;
  sortOrder?: 'asc' | 'desc';
}

export interface DiscoveryDateRange {
  start: Date;
  end: Date;
  preset?: '7d' | '30d' | '90d' | 'custom';
}

export type DiscoverySortOption =
  | 'score'
  | 'freshness'
  | 'evidence'
  | 'signals'
  | 'discovered'
  | 'name';

// Discovery Stats
export interface DiscoveryStatsData {
  total: number;
  qualified: number;
  newThisWeek: number;
  avgScore: number;
  byIndustry: IndustryStatCount[];
  bySize: SizeStatCount[];
  byFreshness: FreshnessStatCount[];
  byScoreRange: ScoreRangeStatCount[];
}

export interface IndustryStatCount {
  industry: string;
  count: number;
  avgScore: number;
}

export interface SizeStatCount {
  size: CompanySizeCategory;
  count: number;
  avgScore: number;
}

export interface FreshnessStatCount {
  freshness: FreshnessStatus;
  count: number;
}

export interface ScoreRangeStatCount {
  range: string;
  min: number;
  max: number;
  count: number;
}

// Vertical Discovery Config
export interface VerticalDiscoveryConfigData {
  vertical: VerticalId;
  name: string;
  icon: string;
  color: string;
  defaultFilters: Partial<DiscoveryUIFilter>;
  relevantSignals: string[];
  relevantIndustries: string[];
  scoreWeights: ScoreWeightsData;
  displayFields: string[];
}

// API Response Types
export interface DiscoveryListAPIResponse {
  success: boolean;
  data?: {
    items: DiscoveryListItem[];
    total: number;
    page: number;
    pageSize: number;
    stats: DiscoveryStatsData;
    filters: DiscoveryUIFilter;
  };
  error?: string;
}

export interface CompanyProfileAPIResponse {
  success: boolean;
  data?: CompanyProfileCardData;
  error?: string;
}

export interface EvidenceSummaryAPIResponse {
  success: boolean;
  data?: EvidencePanelData;
  error?: string;
}

export interface SignalImpactAPIResponse {
  success: boolean;
  data?: SignalImpactPanelData;
  error?: string;
}

export interface ScoreBreakdownAPIResponse {
  success: boolean;
  data?: ScoreBreakdownData;
  error?: string;
}

export interface ObjectGraphAPIResponse {
  success: boolean;
  data?: ObjectGraphMiniData;
  error?: string;
}
