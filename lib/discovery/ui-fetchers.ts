/**
 * Discovery UI Fetchers
 * Sprint S55: Discovery UI
 *
 * Data fetching functions for Discovery UI - reads from UPR OS API.
 * All fetchers are READ-ONLY.
 */

import type { VerticalId } from '../dashboard/types';
import type {
  DiscoveryListItem,
  DiscoveryUIFilter,
  DiscoveryStatsData,
  DiscoveryDateRange,
  CompanyProfileCardData,
  EvidencePanelData,
  SignalImpactPanelData,
  ScoreBreakdownData,
  ObjectGraphMiniData,
  DiscoveryListAPIResponse,
  CompanyProfileAPIResponse,
  EvidenceSummaryAPIResponse,
  SignalImpactAPIResponse,
  ScoreBreakdownAPIResponse,
  ObjectGraphAPIResponse,
} from './types';

// =============================================================================
// CONFIGURATION
// =============================================================================

const OS_BASE_URL = process.env.NEXT_PUBLIC_OS_URL || 'https://upr-os.sivakumar.ai';
const API_TIMEOUT = 15000; // 15 seconds

interface FetchOptions {
  timeout?: number;
  signal?: AbortSignal;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function fetchFromOS<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    options.timeout || API_TIMEOUT
  );

  try {
    const response = await fetch(`${OS_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: options.signal || controller.signal,
    });

    if (!response.ok) {
      throw new Error(`OS API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildDateRangeParams(dateRange?: DiscoveryDateRange): string {
  if (!dateRange) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return `start=${start.toISOString()}&end=${end.toISOString()}`;
  }
  return `start=${dateRange.start.toISOString()}&end=${dateRange.end.toISOString()}`;
}

function buildFilterParams(filters: DiscoveryUIFilter): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.vertical) params.set('vertical', filters.vertical);
  if (filters.territory) params.set('territory', filters.territory);
  if (filters.industries?.length) params.set('industries', filters.industries.join(','));
  if (filters.companySizes?.length) params.set('sizes', filters.companySizes.join(','));
  if (filters.scoreRange) {
    params.set('minScore', filters.scoreRange.min.toString());
    params.set('maxScore', filters.scoreRange.max.toString());
  }
  if (filters.signals?.length) params.set('signals', filters.signals.join(','));
  if (filters.freshness?.length) params.set('freshness', filters.freshness.join(','));
  if (filters.searchQuery) params.set('q', filters.searchQuery);
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

  return params;
}

// =============================================================================
// DISCOVERY LIST
// =============================================================================

export async function fetchDiscoveryList(
  vertical: VerticalId,
  filters: Partial<DiscoveryUIFilter> = {},
  page: number = 1,
  pageSize: number = 20,
  options?: FetchOptions
): Promise<DiscoveryListAPIResponse> {
  const params = buildFilterParams({ vertical, ...filters });
  params.set('page', page.toString());
  params.set('pageSize', pageSize.toString());

  if (filters.dateRange) {
    const dateParams = buildDateRangeParams(filters.dateRange);
    dateParams.split('&').forEach(p => {
      const [key, value] = p.split('=');
      params.set(key, value);
    });
  }

  try {
    const response = await fetchFromOS<{
      success: boolean;
      data: {
        items: DiscoveryListItem[];
        total: number;
        page: number;
        pageSize: number;
        stats: DiscoveryStatsData;
      };
    }>(`/api/os/discovery/list?${params.toString()}`, options);

    return {
      success: true,
      data: {
        ...response.data,
        filters: { vertical, ...filters },
      },
    };
  } catch (error) {
    console.warn('Failed to fetch discovery list from OS, using fallback:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch discovery list',
      data: generateFallbackDiscoveryList(vertical),
    };
  }
}

function generateFallbackDiscoveryList(vertical: VerticalId): {
  items: DiscoveryListItem[];
  total: number;
  page: number;
  pageSize: number;
  stats: DiscoveryStatsData;
  filters: DiscoveryUIFilter;
} {
  return {
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    stats: {
      total: 0,
      qualified: 0,
      newThisWeek: 0,
      avgScore: 0,
      byIndustry: [],
      bySize: [],
      byFreshness: [],
      byScoreRange: [],
    },
    filters: { vertical },
  };
}

// =============================================================================
// EVIDENCE SUMMARY
// =============================================================================

export async function fetchEvidenceSummary(
  objectId: string,
  options?: FetchOptions
): Promise<EvidenceSummaryAPIResponse> {
  try {
    const response = await fetchFromOS<{
      success: boolean;
      data: EvidencePanelData;
    }>(`/api/os/evidence/summary?objectId=${objectId}`, options);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.warn('Failed to fetch evidence summary from OS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch evidence summary',
    };
  }
}

// =============================================================================
// OBJECT GRAPH MINI
// =============================================================================

export async function fetchObjectGraphMini(
  objectId: string,
  options?: FetchOptions
): Promise<ObjectGraphAPIResponse> {
  try {
    const response = await fetchFromOS<{
      success: boolean;
      data: ObjectGraphMiniData;
    }>(`/api/os/objects/graph?objectId=${objectId}&mini=true`, options);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.warn('Failed to fetch object graph from OS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch object graph',
    };
  }
}

// =============================================================================
// SIGNAL IMPACTS
// =============================================================================

export async function fetchSignalImpacts(
  objectId: string,
  options?: FetchOptions
): Promise<SignalImpactAPIResponse> {
  try {
    const response = await fetchFromOS<{
      success: boolean;
      data: SignalImpactPanelData;
    }>(`/api/os/objects/signals?objectId=${objectId}`, options);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.warn('Failed to fetch signal impacts from OS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch signal impacts',
    };
  }
}

// =============================================================================
// SCORE BREAKDOWN
// =============================================================================

export async function fetchScoreBreakdown(
  objectId: string,
  options?: FetchOptions
): Promise<ScoreBreakdownAPIResponse> {
  try {
    const response = await fetchFromOS<{
      success: boolean;
      data: ScoreBreakdownData;
    }>(`/api/os/objects/score?objectId=${objectId}`, options);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.warn('Failed to fetch score breakdown from OS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch score breakdown',
    };
  }
}

// =============================================================================
// COMPANY PROFILE
// =============================================================================

export async function fetchCompanyProfile(
  objectId: string,
  options?: FetchOptions
): Promise<CompanyProfileAPIResponse> {
  try {
    const response = await fetchFromOS<{
      success: boolean;
      data: CompanyProfileCardData;
    }>(`/api/os/objects/profile?objectId=${objectId}`, options);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.warn('Failed to fetch company profile from OS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch company profile',
    };
  }
}

// =============================================================================
// FULL DISCOVERY DATA (PARALLEL FETCH)
// =============================================================================

export interface FullDiscoveryData {
  profile: CompanyProfileCardData | null;
  evidence: EvidencePanelData | null;
  signals: SignalImpactPanelData | null;
  score: ScoreBreakdownData | null;
  graph: ObjectGraphMiniData | null;
}

export async function fetchFullDiscoveryData(
  objectId: string,
  options?: FetchOptions
): Promise<FullDiscoveryData> {
  const [profile, evidence, signals, score, graph] = await Promise.all([
    fetchCompanyProfile(objectId, options).then(r => r.data || null),
    fetchEvidenceSummary(objectId, options).then(r => r.data || null),
    fetchSignalImpacts(objectId, options).then(r => r.data || null),
    fetchScoreBreakdown(objectId, options).then(r => r.data || null),
    fetchObjectGraphMini(objectId, options).then(r => r.data || null),
  ]);

  return { profile, evidence, signals, score, graph };
}
