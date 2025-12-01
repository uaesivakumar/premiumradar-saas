/**
 * Journey Runs React Hooks
 * Sprint S50: Journey Execution Viewer
 *
 * TanStack Query hooks for fetching journey run data.
 */
'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import type {
  JourneyRunSummary,
  JourneyRunDetails,
  JourneyRunAILog,
  AIUsageMetrics,
  JourneyIntelligenceSummary,
  JourneyRunStatus,
  JourneyRunTrigger,
} from './types';
import type { JourneyRunStats } from './repository';

// =============================================================================
// API FETCHERS
// =============================================================================

interface ListRunsParams {
  journeyId: string;
  page?: number;
  limit?: number;
  status?: JourneyRunStatus;
  triggeredBy?: JourneyRunTrigger;
  startedAfter?: Date;
  startedBefore?: Date;
  includeStats?: boolean;
}

interface ListRunsResponse {
  success: boolean;
  data: {
    runs: JourneyRunSummary[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      hasMore: boolean;
      totalPages: number;
    };
    stats?: JourneyRunStats;
  };
  error?: string;
}

async function fetchJourneyRuns(params: ListRunsParams): Promise<ListRunsResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.status) searchParams.set('status', params.status);
  if (params.triggeredBy) searchParams.set('triggered_by', params.triggeredBy);
  if (params.startedAfter) searchParams.set('started_after', params.startedAfter.toISOString());
  if (params.startedBefore) searchParams.set('started_before', params.startedBefore.toISOString());
  if (params.includeStats) searchParams.set('include_stats', 'true');

  const response = await fetch(
    `/api/journeys/${params.journeyId}/runs?${searchParams.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch runs: ${response.statusText}`);
  }

  return response.json();
}

interface RunDetailsResponse {
  success: boolean;
  data: {
    run: JourneyRunDetails['run'];
    steps: JourneyRunDetails['steps'];
    aiLogs?: JourneyRunDetails['aiLogs'];
    contextSnapshots?: JourneyRunDetails['contextSnapshots'];
    errors: JourneyRunDetails['errors'];
    checkpoints: JourneyRunDetails['checkpoints'];
    transitions: JourneyRunDetails['transitions'];
    osCalls?: JourneyRunDetails['osCalls'];
    aiUsage: AIUsageMetrics;
  };
  error?: string;
}

async function fetchRunDetails(
  journeyId: string,
  runId: string,
  options?: {
    includeAILogs?: boolean;
    includeContext?: boolean;
    includeOSCalls?: boolean;
  }
): Promise<RunDetailsResponse> {
  const searchParams = new URLSearchParams();

  if (options?.includeAILogs === false) searchParams.set('include_ai_logs', 'false');
  if (options?.includeContext === false) searchParams.set('include_context', 'false');
  if (options?.includeOSCalls === false) searchParams.set('include_os_calls', 'false');

  const response = await fetch(
    `/api/journeys/${journeyId}/runs/${runId}?${searchParams.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch run details: ${response.statusText}`);
  }

  return response.json();
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to fetch paginated journey runs
 */
export function useJourneyRuns(
  journeyId: string,
  options?: {
    page?: number;
    limit?: number;
    status?: JourneyRunStatus;
    triggeredBy?: JourneyRunTrigger;
    startedAfter?: Date;
    startedBefore?: Date;
    includeStats?: boolean;
    enabled?: boolean;
  }
) {
  const {
    page = 1,
    limit = 20,
    status,
    triggeredBy,
    startedAfter,
    startedBefore,
    includeStats = false,
    enabled = true,
  } = options || {};

  return useQuery({
    queryKey: [
      'journey-runs',
      journeyId,
      page,
      limit,
      status,
      triggeredBy,
      startedAfter?.toISOString(),
      startedBefore?.toISOString(),
      includeStats,
    ],
    queryFn: () =>
      fetchJourneyRuns({
        journeyId,
        page,
        limit,
        status,
        triggeredBy,
        startedAfter,
        startedBefore,
        includeStats,
      }),
    enabled: enabled && !!journeyId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refresh every minute for running journeys
  });
}

/**
 * Hook to fetch infinite scrolling journey runs
 */
export function useInfiniteJourneyRuns(
  journeyId: string,
  options?: {
    limit?: number;
    status?: JourneyRunStatus;
    triggeredBy?: JourneyRunTrigger;
    enabled?: boolean;
  }
) {
  const { limit = 20, status, triggeredBy, enabled = true } = options || {};

  return useInfiniteQuery({
    queryKey: ['journey-runs-infinite', journeyId, limit, status, triggeredBy],
    queryFn: ({ pageParam = 1 }) =>
      fetchJourneyRuns({
        journeyId,
        page: pageParam,
        limit,
        status,
        triggeredBy,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.data.pagination.hasMore) {
        return lastPage.data.pagination.page + 1;
      }
      return undefined;
    },
    enabled: enabled && !!journeyId,
    staleTime: 30000,
  });
}

/**
 * Hook to fetch full run details
 */
export function useJourneyRunDetails(
  journeyId: string,
  runId: string,
  options?: {
    includeAILogs?: boolean;
    includeContext?: boolean;
    includeOSCalls?: boolean;
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  const {
    includeAILogs = true,
    includeContext = true,
    includeOSCalls = true,
    enabled = true,
    refetchInterval,
  } = options || {};

  return useQuery({
    queryKey: [
      'journey-run-details',
      journeyId,
      runId,
      includeAILogs,
      includeContext,
      includeOSCalls,
    ],
    queryFn: () =>
      fetchRunDetails(journeyId, runId, {
        includeAILogs,
        includeContext,
        includeOSCalls,
      }),
    enabled: enabled && !!journeyId && !!runId,
    staleTime: 10000, // 10 seconds for run details
    refetchInterval, // Allow custom polling for running journeys
  });
}

/**
 * Hook to fetch AI step logs for a run
 */
export function useAIStepLogs(
  journeyId: string,
  runId: string,
  options?: { enabled?: boolean }
) {
  const { enabled = true } = options || {};

  return useQuery({
    queryKey: ['journey-run-ai-logs', journeyId, runId],
    queryFn: async (): Promise<JourneyRunAILog[]> => {
      const response = await fetchRunDetails(journeyId, runId, {
        includeAILogs: true,
        includeContext: false,
        includeOSCalls: false,
      });
      return response.data.aiLogs || [];
    },
    enabled: enabled && !!journeyId && !!runId,
    staleTime: 30000,
  });
}

/**
 * Hook to fetch OS intelligence summary for a journey
 *
 * NOTE: This calls OS S71 APIs via the SaaS proxy
 * Read-only access - does not affect execution
 */
export function useJourneyIntelSummary(
  journeyId: string,
  options?: { enabled?: boolean }
) {
  const { enabled = true } = options || {};

  return useQuery({
    queryKey: ['journey-intel-summary', journeyId],
    queryFn: async (): Promise<JourneyIntelligenceSummary> => {
      // Call OS S71 Intelligence API via SaaS proxy
      const response = await fetch(`/api/os/intelligence/journey/${journeyId}`);

      if (!response.ok) {
        // Return mock data if OS API is not available
        console.warn('[useJourneyIntelSummary] OS API not available, using defaults');
        return {
          priority: 0,
          patterns: [],
          personaEffectiveness: 0,
          journeyHealth: 0,
          recommendations: [],
        };
      }

      const data = await response.json();
      return data.data || {
        priority: 0,
        patterns: [],
        personaEffectiveness: 0,
        journeyHealth: 0,
        recommendations: [],
      };
    },
    enabled: enabled && !!journeyId,
    staleTime: 300000, // 5 minutes for intelligence data
    retry: 1, // Only retry once for OS calls
  });
}

/**
 * Hook to trigger a replay (stub - returns mock response)
 */
export function useReplayRun() {
  return {
    replay: async (journeyId: string, runId: string) => {
      const response = await fetch(
        `/api/journeys/${journeyId}/runs/${runId}/replay`,
        { method: 'POST' }
      );
      return response.json();
    },
    isStub: true,
  };
}

// =============================================================================
// QUERY KEY HELPERS
// =============================================================================

export const journeyRunQueryKeys = {
  all: ['journey-runs'] as const,
  lists: () => [...journeyRunQueryKeys.all, 'list'] as const,
  list: (journeyId: string, filters?: Record<string, unknown>) =>
    [...journeyRunQueryKeys.lists(), journeyId, filters] as const,
  details: () => [...journeyRunQueryKeys.all, 'detail'] as const,
  detail: (journeyId: string, runId: string) =>
    [...journeyRunQueryKeys.details(), journeyId, runId] as const,
  aiLogs: (journeyId: string, runId: string) =>
    [...journeyRunQueryKeys.detail(journeyId, runId), 'ai-logs'] as const,
  intel: (journeyId: string) =>
    [...journeyRunQueryKeys.all, 'intel', journeyId] as const,
};
