/**
 * Dashboard Hooks
 * Sprint S54: Vertical Dashboards
 *
 * React hooks for dashboard data management.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  VerticalId,
  VerticalConfig,
  DateRange,
  DashboardState,
  KPIBlock,
  OutreachFunnel,
  PersonaPerformance,
  HeatmapData,
  TrendSeries,
  IntelligenceSignal,
  DiscoveryStats,
  OutreachStats,
  AutonomousMetrics,
} from './types';
import {
  getVerticalConfig,
  getAllVerticals,
  isValidVertical,
  fetchFullDashboard,
  fetchKPIs,
  fetchFunnelData,
  fetchPersonaPerformance,
  fetchHeatmapData,
  fetchTrendData,
  fetchIntelligenceSignals,
  fetchDiscoveryStats,
  fetchOutreachStats,
  fetchAutonomousMetrics,
  FullDashboardData,
} from './fetchers';

// =============================================================================
// USE DASHBOARD
// =============================================================================

export interface UseDashboardOptions {
  territory?: string;
  dateRange?: DateRange;
  autoRefresh?: boolean;
  refreshInterval?: number; // seconds
}

export interface UseDashboardReturn {
  data: FullDashboardData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useDashboard(
  vertical: VerticalId,
  options: UseDashboardOptions = {}
): UseDashboardReturn {
  const {
    territory,
    dateRange,
    autoRefresh = false,
    refreshInterval = 60,
  } = options;

  const [data, setData] = useState<FullDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFullDashboard(
        vertical,
        territory,
        dateRange,
        { signal: abortControllerRef.current.signal }
      );

      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Ignore aborted requests
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [vertical, territory, dateRange]);

  // Initial fetch
  useEffect(() => {
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      fetchData();
    }, refreshInterval * 1000);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, fetchData]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchData,
    lastUpdated,
  };
}

// =============================================================================
// USE VERTICAL CONFIG
// =============================================================================

export interface UseVerticalConfigReturn {
  config: VerticalConfig | null;
  allVerticals: VerticalConfig[];
  isValid: (id: string) => boolean;
  error: string | null;
}

export function useVerticalConfig(vertical?: VerticalId): UseVerticalConfigReturn {
  const [config, setConfig] = useState<VerticalConfig | null>(null);
  const [allVerticals, setAllVerticals] = useState<VerticalConfig[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setAllVerticals(getAllVerticals());

      if (vertical) {
        setConfig(getVerticalConfig(vertical));
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vertical config');
      setConfig(null);
    }
  }, [vertical]);

  const isValid = useCallback((id: string) => isValidVertical(id), []);

  return {
    config,
    allVerticals,
    isValid,
    error,
  };
}

// =============================================================================
// USE DASHBOARD REFRESH
// =============================================================================

export interface UseDashboardRefreshReturn {
  isRefreshing: boolean;
  lastRefresh: Date | null;
  nextRefresh: Date | null;
  refresh: () => void;
  pause: () => void;
  resume: () => void;
  isPaused: boolean;
}

export function useDashboardRefresh(
  intervalSeconds: number,
  onRefresh: () => Promise<void>
): UseDashboardRefreshReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [nextRefresh, setNextRefresh] = useState<Date | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const doRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      setLastRefresh(new Date());
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  const scheduleNext = useCallback(() => {
    if (isPaused) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setNextRefresh(new Date(Date.now() + intervalSeconds * 1000));

    intervalRef.current = setInterval(() => {
      doRefresh();
      setNextRefresh(new Date(Date.now() + intervalSeconds * 1000));
    }, intervalSeconds * 1000);
  }, [intervalSeconds, isPaused, doRefresh]);

  useEffect(() => {
    scheduleNext();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [scheduleNext]);

  const refresh = useCallback(() => {
    doRefresh();
    scheduleNext();
  }, [doRefresh, scheduleNext]);

  const pause = useCallback(() => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setNextRefresh(null);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
    scheduleNext();
  }, [scheduleNext]);

  return {
    isRefreshing,
    lastRefresh,
    nextRefresh,
    refresh,
    pause,
    resume,
    isPaused,
  };
}

// =============================================================================
// USE DASHBOARD ERROR HANDLING
// =============================================================================

export interface DashboardError {
  id: string;
  message: string;
  code?: string;
  timestamp: Date;
  retryable: boolean;
}

export interface UseDashboardErrorHandlingReturn {
  errors: DashboardError[];
  addError: (message: string, code?: string, retryable?: boolean) => void;
  clearError: (id: string) => void;
  clearAllErrors: () => void;
  hasErrors: boolean;
  latestError: DashboardError | null;
}

export function useDashboardErrorHandling(): UseDashboardErrorHandlingReturn {
  const [errors, setErrors] = useState<DashboardError[]>([]);

  const addError = useCallback((message: string, code?: string, retryable: boolean = true) => {
    const newError: DashboardError = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      code,
      timestamp: new Date(),
      retryable,
    };

    setErrors((prev) => [...prev, newError]);

    // Auto-clear after 30 seconds for retryable errors
    if (retryable) {
      setTimeout(() => {
        setErrors((prev) => prev.filter((e) => e.id !== newError.id));
      }, 30000);
    }
  }, []);

  const clearError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return {
    errors,
    addError,
    clearError,
    clearAllErrors,
    hasErrors: errors.length > 0,
    latestError: errors.length > 0 ? errors[errors.length - 1] : null,
  };
}

// =============================================================================
// INDIVIDUAL WIDGET HOOKS
// =============================================================================

export function useKPIs(
  vertical: VerticalId,
  territory?: string,
  dateRange?: DateRange
) {
  const [data, setData] = useState<KPIBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const result = await fetchKPIs(vertical, territory, dateRange);
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch KPIs');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [vertical, territory, dateRange]);

  return { data, isLoading, error };
}

export function useFunnel(
  vertical: VerticalId,
  territory?: string,
  dateRange?: DateRange
) {
  const [data, setData] = useState<OutreachFunnel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const result = await fetchFunnelData(vertical, territory, dateRange);
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch funnel');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [vertical, territory, dateRange]);

  return { data, isLoading, error };
}

export function usePersonas(vertical?: VerticalId) {
  const [data, setData] = useState<PersonaPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const result = await fetchPersonaPerformance(vertical);
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch personas');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [vertical]);

  return { data, isLoading, error };
}

export function useHeatmap(
  vertical: VerticalId,
  type: 'time-of-day' | 'persona' | 'industry' = 'time-of-day'
) {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const result = await fetchHeatmapData(vertical, type);
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch heatmap');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [vertical, type]);

  return { data, isLoading, error };
}

export function useTrends(
  vertical: VerticalId,
  metrics: string[],
  dateRange?: DateRange
) {
  const [data, setData] = useState<TrendSeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const result = await fetchTrendData(vertical, metrics, dateRange);
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch trends');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [vertical, metrics, dateRange]);

  return { data, isLoading, error };
}

export function useSignals(vertical: VerticalId, limit: number = 20) {
  const [data, setData] = useState<IntelligenceSignal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const result = await fetchIntelligenceSignals(vertical, limit);
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch signals');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [vertical, limit]);

  return { data, isLoading, error };
}

export function useDiscovery(
  vertical: VerticalId,
  territory?: string,
  dateRange?: DateRange
) {
  const [data, setData] = useState<DiscoveryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const result = await fetchDiscoveryStats(vertical, territory, dateRange);
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch discovery stats');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [vertical, territory, dateRange]);

  return { data, isLoading, error };
}

export function useOutreach(
  vertical: VerticalId,
  territory?: string,
  dateRange?: DateRange
) {
  const [data, setData] = useState<OutreachStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const result = await fetchOutreachStats(vertical, territory, dateRange);
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch outreach stats');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [vertical, territory, dateRange]);

  return { data, isLoading, error };
}

export function useAutonomous() {
  const [data, setData] = useState<AutonomousMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const result = await fetchAutonomousMetrics();
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch autonomous metrics');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { data, isLoading, error };
}
