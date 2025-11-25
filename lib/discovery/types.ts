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
