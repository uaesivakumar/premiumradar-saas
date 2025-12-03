/**
 * Discovery UI Hooks
 * Sprint S55: Discovery UI
 *
 * React hooks for Discovery UI data management.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { VerticalId } from '../dashboard/types';
import type {
  DiscoveryListItem,
  DiscoveryUIFilter,
  DiscoveryStatsData,
  CompanyProfileCardData,
  EvidencePanelData,
  SignalImpactPanelData,
  ScoreBreakdownData,
  ObjectGraphMiniData,
  DiscoverySortOption,
  FreshnessStatus,
  CompanySizeCategory,
} from './types';
import {
  fetchDiscoveryList,
  fetchCompanyProfile,
  fetchEvidenceSummary,
  fetchSignalImpacts,
  fetchScoreBreakdown,
  fetchObjectGraphMini,
  fetchFullDiscoveryData,
  FullDiscoveryData,
} from './ui-fetchers';

// =============================================================================
// USE DISCOVERY LIST
// =============================================================================

export interface UseDiscoveryListOptions {
  filters?: Partial<DiscoveryUIFilter>;
  page?: number;
  pageSize?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseDiscoveryListReturn {
  items: DiscoveryListItem[];
  total: number;
  stats: DiscoveryStatsData | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  totalPages: number;
  refresh: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

export function useDiscoveryList(
  vertical: VerticalId,
  options: UseDiscoveryListOptions = {}
): UseDiscoveryListReturn {
  const {
    filters = {},
    page: initialPage = 1,
    pageSize: initialPageSize = 20,
    autoRefresh = false,
    refreshInterval = 60,
  } = options;

  const [items, setItems] = useState<DiscoveryListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<DiscoveryStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchDiscoveryList(
        vertical,
        filters,
        page,
        pageSize,
        { signal: abortControllerRef.current.signal }
      );

      if (response.success && response.data) {
        setItems(response.data.items);
        setTotal(response.data.total);
        setStats(response.data.stats);
      } else {
        setError(response.error || 'Failed to fetch discovery list');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to fetch discovery list');
    } finally {
      setIsLoading(false);
    }
  }, [vertical, filters, page, pageSize]);

  useEffect(() => {
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(fetchData, refreshInterval * 1000);
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, fetchData]);

  const totalPages = Math.ceil(total / pageSize);

  return {
    items,
    total,
    stats,
    isLoading,
    error,
    page,
    pageSize,
    totalPages,
    refresh: fetchData,
    setPage,
    setPageSize,
  };
}

// =============================================================================
// USE DISCOVERY FILTERS
// =============================================================================

export interface UseDiscoveryFiltersReturn {
  filters: DiscoveryUIFilter;
  setVertical: (vertical: VerticalId) => void;
  setTerritory: (territory: string | undefined) => void;
  setIndustries: (industries: string[]) => void;
  setCompanySizes: (sizes: CompanySizeCategory[]) => void;
  setScoreRange: (range: { min: number; max: number } | undefined) => void;
  setSignals: (signals: string[]) => void;
  setFreshness: (freshness: FreshnessStatus[]) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: DiscoverySortOption) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

export function useDiscoveryFilters(
  initialVertical: VerticalId = 'banking'
): UseDiscoveryFiltersReturn {
  const [filters, setFilters] = useState<DiscoveryUIFilter>({
    vertical: initialVertical,
    sortBy: 'score',
    sortOrder: 'desc',
  });

  const setVertical = useCallback((vertical: VerticalId) => {
    setFilters((prev) => ({ ...prev, vertical }));
  }, []);

  const setTerritory = useCallback((territory: string | undefined) => {
    setFilters((prev) => ({ ...prev, territory }));
  }, []);

  const setIndustries = useCallback((industries: string[]) => {
    setFilters((prev) => ({ ...prev, industries: industries.length > 0 ? industries : undefined }));
  }, []);

  const setCompanySizes = useCallback((companySizes: CompanySizeCategory[]) => {
    setFilters((prev) => ({ ...prev, companySizes: companySizes.length > 0 ? companySizes : undefined }));
  }, []);

  const setScoreRange = useCallback((scoreRange: { min: number; max: number } | undefined) => {
    setFilters((prev) => ({ ...prev, scoreRange }));
  }, []);

  const setSignals = useCallback((signals: string[]) => {
    setFilters((prev) => ({ ...prev, signals: signals.length > 0 ? signals : undefined }));
  }, []);

  const setFreshness = useCallback((freshness: FreshnessStatus[]) => {
    setFilters((prev) => ({ ...prev, freshness: freshness.length > 0 ? freshness : undefined }));
  }, []);

  const setSearchQuery = useCallback((searchQuery: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: searchQuery || undefined }));
  }, []);

  const setSortBy = useCallback((sortBy: DiscoverySortOption) => {
    setFilters((prev) => ({ ...prev, sortBy }));
  }, []);

  const setSortOrder = useCallback((sortOrder: 'asc' | 'desc') => {
    setFilters((prev) => ({ ...prev, sortOrder }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      vertical: initialVertical,
      sortBy: 'score',
      sortOrder: 'desc',
    });
  }, [initialVertical]);

  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.territory ||
      filters.industries?.length ||
      filters.companySizes?.length ||
      filters.scoreRange ||
      filters.signals?.length ||
      filters.freshness?.length ||
      filters.searchQuery ||
      filters.dateRange
    );
  }, [filters]);

  return {
    filters,
    setVertical,
    setTerritory,
    setIndustries,
    setCompanySizes,
    setScoreRange,
    setSignals,
    setFreshness,
    setSearchQuery,
    setSortBy,
    setSortOrder,
    resetFilters,
    hasActiveFilters,
  };
}

// =============================================================================
// USE COMPANY PROFILE
// =============================================================================

export interface UseCompanyProfileReturn {
  profile: CompanyProfileCardData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCompanyProfile(objectId: string | null): UseCompanyProfileReturn {
  const [profile, setProfile] = useState<CompanyProfileCardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!objectId) {
      setProfile(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchCompanyProfile(objectId);
      if (response.success && response.data) {
        setProfile(response.data);
      } else {
        setError(response.error || 'Failed to fetch company profile');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch company profile');
    } finally {
      setIsLoading(false);
    }
  }, [objectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { profile, isLoading, error, refresh: fetchData };
}

// =============================================================================
// USE EVIDENCE SUMMARY
// =============================================================================

export interface UseEvidenceSummaryReturn {
  evidence: EvidencePanelData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useEvidenceSummary(objectId: string | null): UseEvidenceSummaryReturn {
  const [evidence, setEvidence] = useState<EvidencePanelData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!objectId) {
      setEvidence(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchEvidenceSummary(objectId);
      if (response.success && response.data) {
        setEvidence(response.data);
      } else {
        setError(response.error || 'Failed to fetch evidence');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch evidence');
    } finally {
      setIsLoading(false);
    }
  }, [objectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { evidence, isLoading, error, refresh: fetchData };
}

// =============================================================================
// USE SIGNAL IMPACTS
// =============================================================================

export interface UseSignalImpactsReturn {
  signals: SignalImpactPanelData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useSignalImpacts(objectId: string | null): UseSignalImpactsReturn {
  const [signals, setSignals] = useState<SignalImpactPanelData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!objectId) {
      setSignals(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchSignalImpacts(objectId);
      if (response.success && response.data) {
        setSignals(response.data);
      } else {
        setError(response.error || 'Failed to fetch signals');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch signals');
    } finally {
      setIsLoading(false);
    }
  }, [objectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { signals, isLoading, error, refresh: fetchData };
}

// =============================================================================
// USE SCORE BREAKDOWN
// =============================================================================

export interface UseScoreBreakdownReturn {
  breakdown: ScoreBreakdownData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useScoreBreakdown(objectId: string | null): UseScoreBreakdownReturn {
  const [breakdown, setBreakdown] = useState<ScoreBreakdownData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!objectId) {
      setBreakdown(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchScoreBreakdown(objectId);
      if (response.success && response.data) {
        setBreakdown(response.data);
      } else {
        setError(response.error || 'Failed to fetch score breakdown');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch score breakdown');
    } finally {
      setIsLoading(false);
    }
  }, [objectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { breakdown, isLoading, error, refresh: fetchData };
}

// =============================================================================
// USE OBJECT GRAPH MINI
// =============================================================================

export interface UseObjectGraphMiniReturn {
  graph: ObjectGraphMiniData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useObjectGraphMini(objectId: string | null): UseObjectGraphMiniReturn {
  const [graph, setGraph] = useState<ObjectGraphMiniData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!objectId) {
      setGraph(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchObjectGraphMini(objectId);
      if (response.success && response.data) {
        setGraph(response.data);
      } else {
        setError(response.error || 'Failed to fetch object graph');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch object graph');
    } finally {
      setIsLoading(false);
    }
  }, [objectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { graph, isLoading, error, refresh: fetchData };
}

// =============================================================================
// USE FULL DISCOVERY DATA (COMBINED)
// =============================================================================

export interface UseFullDiscoveryDataReturn {
  data: FullDiscoveryData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useFullDiscoveryData(objectId: string | null): UseFullDiscoveryDataReturn {
  const [data, setData] = useState<FullDiscoveryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!objectId) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFullDiscoveryData(objectId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch discovery data');
    } finally {
      setIsLoading(false);
    }
  }, [objectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refresh: fetchData };
}

// =============================================================================
// USE SELECTED COMPANY (STATE MANAGEMENT)
// =============================================================================

export interface UseSelectedCompanyReturn {
  selectedId: string | null;
  select: (objectId: string) => void;
  deselect: () => void;
  isSelected: (objectId: string) => boolean;
}

export function useSelectedCompany(): UseSelectedCompanyReturn {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const select = useCallback((objectId: string) => {
    setSelectedId(objectId);
  }, []);

  const deselect = useCallback(() => {
    setSelectedId(null);
  }, []);

  const isSelected = useCallback(
    (objectId: string) => selectedId === objectId,
    [selectedId]
  );

  return { selectedId, select, deselect, isSelected };
}
