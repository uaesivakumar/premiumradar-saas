/**
 * Runtime Signals Hook
 * Sprint S271: Runtime Intelligence Feed
 * Feature F2: Signal Data Subscription
 *
 * Provides polling-based data subscription for live signals.
 * Uses SWR for caching and revalidation.
 *
 * Architecture: Read-only, derived data only
 */

import useSWR from 'swr';
import { useCallback, useMemo } from 'react';
import type { RuntimeSignal } from '@/components/workspace/RuntimeSignalCard';

// =============================================================================
// Types
// =============================================================================

export interface RuntimeSignalsFilter {
  types?: string[];
  priorities?: ('critical' | 'high' | 'medium' | 'low')[];
  regions?: string[];
  minConfidence?: number;
  since?: string; // ISO timestamp
  limit?: number;
}

export interface RuntimeSignalsSort {
  field: 'timestamp' | 'priority' | 'confidence' | 'company';
  direction: 'asc' | 'desc';
}

export interface RuntimeSignalsResponse {
  signals: RuntimeSignal[];
  total: number;
  hasMore: boolean;
  lastUpdated: string;
}

interface UseRuntimeSignalsOptions {
  vertical: string;
  subVertical: string;
  regions: string[];
  filter?: RuntimeSignalsFilter;
  sort?: RuntimeSignalsSort;
  refreshInterval?: number; // ms, default 30000 (30s)
  enabled?: boolean;
}

interface UseRuntimeSignalsResult {
  signals: RuntimeSignal[];
  total: number;
  hasMore: boolean;
  lastUpdated: string | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refresh: () => void;
}

// =============================================================================
// Fetcher
// =============================================================================

async function fetchRuntimeSignals(
  url: string
): Promise<RuntimeSignalsResponse> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch signals: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Unknown error');
  }

  // Transform API response to RuntimeSignal format
  const signals: RuntimeSignal[] = (data.data?.recentActivity || []).map(
    (item: {
      id: string;
      signalType: string;
      action: string;
      companyName: string;
      timestamp: string;
      score?: number;
    }) => ({
      id: item.id,
      type: item.signalType,
      title: item.action,
      description: '',
      companyName: item.companyName,
      priority: getPriorityFromScore(item.score),
      confidence: item.score ? item.score / 100 : 0.5,
      source: 'Intelligence Engine',
      timestamp: item.timestamp,
    })
  );

  return {
    signals,
    total: data.data?.signals?.total || signals.length,
    hasMore: signals.length >= 10,
    lastUpdated: data.data?.lastUpdated || new Date().toISOString(),
  };
}

function getPriorityFromScore(score?: number): RuntimeSignal['priority'] {
  if (!score) return 'medium';
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

// =============================================================================
// Hook
// =============================================================================

export function useRuntimeSignals(
  options: UseRuntimeSignalsOptions
): UseRuntimeSignalsResult {
  const {
    vertical,
    subVertical,
    regions,
    filter,
    sort,
    refreshInterval = 30000,
    enabled = true,
  } = options;

  // Build URL with query params
  const url = useMemo(() => {
    const params = new URLSearchParams({
      vertical,
      subVertical,
      regions: regions.join(','),
    });

    if (filter?.types?.length) {
      params.set('types', filter.types.join(','));
    }
    if (filter?.priorities?.length) {
      params.set('priorities', filter.priorities.join(','));
    }
    if (filter?.minConfidence) {
      params.set('minConfidence', filter.minConfidence.toString());
    }
    if (filter?.since) {
      params.set('since', filter.since);
    }
    if (filter?.limit) {
      params.set('limit', filter.limit.toString());
    }
    if (sort) {
      params.set('sortField', sort.field);
      params.set('sortDir', sort.direction);
    }

    return `/api/dashboard/stats?${params.toString()}`;
  }, [vertical, subVertical, regions, filter, sort]);

  // SWR for caching and revalidation
  const { data, error, isLoading, mutate } = useSWR<RuntimeSignalsResponse>(
    enabled ? url : null,
    fetchRuntimeSignals,
    {
      refreshInterval,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // Dedupe requests within 5s
    }
  );

  // Manual refresh function
  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);

  // Apply client-side sorting if needed
  const sortedSignals = useMemo(() => {
    if (!data?.signals) return [];
    if (!sort) return data.signals;

    return [...data.signals].sort((a, b) => {
      let comparison = 0;

      switch (sort.field) {
        case 'timestamp':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'confidence':
          comparison = a.confidence - b.confidence;
          break;
        case 'company':
          comparison = a.companyName.localeCompare(b.companyName);
          break;
      }

      return sort.direction === 'desc' ? -comparison : comparison;
    });
  }, [data?.signals, sort]);

  // Apply client-side filtering if API doesn't support all filters
  const filteredSignals = useMemo(() => {
    let result = sortedSignals;

    if (filter?.types?.length) {
      result = result.filter((s) => filter.types!.includes(s.type));
    }
    if (filter?.priorities?.length) {
      result = result.filter((s) => filter.priorities!.includes(s.priority));
    }
    if (filter?.minConfidence) {
      result = result.filter((s) => s.confidence >= filter.minConfidence!);
    }

    return result;
  }, [sortedSignals, filter]);

  return {
    signals: filteredSignals,
    total: data?.total || 0,
    hasMore: data?.hasMore || false,
    lastUpdated: data?.lastUpdated || null,
    isLoading,
    isError: !!error,
    error: error || null,
    refresh,
  };
}

// =============================================================================
// Signal Type Options (for filter UI)
// =============================================================================

export const SIGNAL_TYPE_OPTIONS = [
  { value: 'hiring-expansion', label: 'Hiring Expansion' },
  { value: 'headcount-jump', label: 'Headcount Jump' },
  { value: 'office-opening', label: 'Office Opening' },
  { value: 'market-entry', label: 'Market Entry' },
  { value: 'funding-round', label: 'Funding Round' },
  { value: 'project-award', label: 'Project Award' },
  { value: 'subsidiary-creation', label: 'Subsidiary Created' },
  { value: 'leadership-hiring', label: 'Leadership Hire' },
];

export const PRIORITY_OPTIONS = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export default useRuntimeSignals;
