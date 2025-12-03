/**
 * Intelligence Suite Hooks
 * Sprint S56-S62: PremiumRadar Intelligence Suite
 *
 * React hooks for intelligence data fetching and state management.
 * All hooks follow SWR/React Query patterns for caching and revalidation.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  VerticalId,
  IntelligenceTimeRange,
  PersonaPerformanceData,
  JourneyPerformanceData,
  ScoreBreakdownFullData,
  IntelligenceSignalData,
  PatternDetection,
  AutonomousIntelligence,
  EvidenceCorrelation,
  OutcomeCorrelation,
  TimeSeriesMetrics,
  CorrelationMatrix,
  CorrelationResult,
  CompositeIntelligenceScore,
  IntelligenceGraphData,
  AuditEntry,
  AuditFilter,
  AuditSummary,
  Workspace,
} from './types';

import {
  fetchPersonaPerformance,
  fetchJourneyPerformance,
  fetchScoreBreakdown,
  fetchIntelligenceSignals,
  fetchPatternDetections,
  fetchAutonomousMetrics,
  fetchOutcomeCorrelations,
  fetchEvidenceCorrelations,
  fetchTimeSeriesMetrics,
  fetchCorrelationMatrix,
  fetchCompositeIntelligenceScore,
  fetchIntelligenceGraph,
  fetchAuditLogs,
  fetchAuditSummary,
  fetchWorkspace,
  fetchUserWorkspaces,
  fetchFullIntelligenceData,
} from './fetchers';

import {
  buildPersonaRanking,
  buildJourneyDropoffMap,
  buildSignalWeights,
  buildPatternClusters,
  buildCorrelationMatrix as transformCorrelationMatrix,
  buildTimeSeriesChart,
  buildCompositeIntelligenceScore as transformCompositeScore,
  buildGraphVisualization,
  buildScoreExplanation,
  buildAuditTimeline,
  type PersonaRankingResult,
  type JourneyDropoffMap,
  type SignalWeightsResult,
  type PatternClustersResult,
  type CorrelationMatrixUI,
  type TimeSeriesChartData,
  type CompositeScoreUI,
  type GraphVisualizationData,
  type ScoreExplanationUI,
  type AuditTimelineData,
} from './transformers';

// =============================================================================
// COMMON HOOK TYPES
// =============================================================================

interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface PaginatedState<T> extends AsyncState<T[]> {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  setPage: (page: number) => void;
}

// =============================================================================
// useIntelligence - Main Intelligence Hook (S56)
// =============================================================================

interface UseIntelligenceOptions {
  vertical: VerticalId;
  timeRange?: IntelligenceTimeRange;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseIntelligenceResult {
  // Data
  personas: PersonaPerformanceData[];
  journeys: JourneyPerformanceData[];
  signals: IntelligenceSignalData[];
  patterns: PatternDetection[];
  autonomous: AutonomousIntelligence | null;
  timeSeries: TimeSeriesMetrics[];
  compositeScore: CompositeIntelligenceScore | null;

  // State
  isLoading: boolean;
  error: string | null;

  // Actions
  refetch: () => Promise<void>;
  setTimeRange: (range: IntelligenceTimeRange) => void;
}

export function useIntelligence(options: UseIntelligenceOptions): UseIntelligenceResult {
  const { vertical, timeRange: initialTimeRange = '30d', autoRefresh = false, refreshInterval = 60000 } = options;

  const [timeRange, setTimeRange] = useState<IntelligenceTimeRange>(initialTimeRange);
  const [personas, setPersonas] = useState<PersonaPerformanceData[]>([]);
  const [journeys, setJourneys] = useState<JourneyPerformanceData[]>([]);
  const [signals, setSignals] = useState<IntelligenceSignalData[]>([]);
  const [patterns, setPatterns] = useState<PatternDetection[]>([]);
  const [autonomous, setAutonomous] = useState<AutonomousIntelligence | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesMetrics[]>([]);
  const [compositeScore, setCompositeScore] = useState<CompositeIntelligenceScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchFullIntelligenceData(vertical, timeRange);
      setPersonas(data.personas);
      setJourneys(data.journeys);
      setSignals(data.signals);
      setPatterns(data.patterns);
      setAutonomous(data.autonomous);
      setTimeSeries(data.timeSeries);
      setCompositeScore(data.compositeScore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch intelligence data');
    } finally {
      setIsLoading(false);
    }
  }, [vertical, timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  return {
    personas,
    journeys,
    signals,
    patterns,
    autonomous,
    timeSeries,
    compositeScore,
    isLoading,
    error,
    refetch: fetchData,
    setTimeRange,
  };
}

// =============================================================================
// usePersonaInsights - Persona Performance Hook (S56)
// =============================================================================

interface UsePersonaInsightsOptions {
  vertical?: VerticalId;
  timeRange?: IntelligenceTimeRange;
  sortBy?: keyof PersonaPerformanceData['metrics'];
}

interface UsePersonaInsightsResult extends AsyncState<PersonaRankingResult> {
  personas: PersonaPerformanceData[];
  setSortBy: (sortBy: keyof PersonaPerformanceData['metrics']) => void;
}

export function usePersonaInsights(options: UsePersonaInsightsOptions = {}): UsePersonaInsightsResult {
  const { vertical, timeRange = '30d', sortBy: initialSortBy = 'qualityScore' } = options;

  const [sortBy, setSortBy] = useState<keyof PersonaPerformanceData['metrics']>(initialSortBy);
  const [rawData, setRawData] = useState<PersonaPerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchPersonaPerformance(vertical, timeRange);
      setRawData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch persona data');
    } finally {
      setIsLoading(false);
    }
  }, [vertical, timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const data = useMemo(() => {
    return rawData.length ? buildPersonaRanking(rawData, sortBy) : null;
  }, [rawData, sortBy]);

  return {
    data,
    personas: rawData,
    isLoading,
    error,
    refetch: fetchData,
    setSortBy,
  };
}

// =============================================================================
// useJourneyInsights - Journey Performance Hook (S56)
// =============================================================================

interface UseJourneyInsightsOptions {
  vertical?: VerticalId;
  timeRange?: IntelligenceTimeRange;
}

interface UseJourneyInsightsResult extends AsyncState<JourneyDropoffMap[]> {
  journeys: JourneyPerformanceData[];
  getJourneyById: (id: string) => JourneyDropoffMap | undefined;
}

export function useJourneyInsights(options: UseJourneyInsightsOptions = {}): UseJourneyInsightsResult {
  const { vertical, timeRange = '30d' } = options;

  const [rawData, setRawData] = useState<JourneyPerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchJourneyPerformance(vertical, timeRange);
      setRawData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch journey data');
    } finally {
      setIsLoading(false);
    }
  }, [vertical, timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const data = useMemo(() => {
    return rawData.map(buildJourneyDropoffMap);
  }, [rawData]);

  const getJourneyById = useCallback(
    (id: string) => data.find((j) => j.journeyId === id),
    [data]
  );

  return {
    data,
    journeys: rawData,
    isLoading,
    error,
    refetch: fetchData,
    getJourneyById,
  };
}

// =============================================================================
// useScoreInsights - Score Breakdown Hook (S61)
// =============================================================================

interface UseScoreInsightsOptions {
  objectId: string;
}

export function useScoreInsights(options: UseScoreInsightsOptions): AsyncState<ScoreExplanationUI> {
  const { objectId } = options;

  const [rawData, setRawData] = useState<ScoreBreakdownFullData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!objectId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchScoreBreakdown(objectId);
      setRawData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch score breakdown');
    } finally {
      setIsLoading(false);
    }
  }, [objectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const data = useMemo(() => {
    return rawData ? buildScoreExplanation(rawData) : null;
  }, [rawData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

// =============================================================================
// useSignalCorrelations - Signal Analysis Hook (S62)
// =============================================================================

interface UseSignalCorrelationsOptions {
  vertical: VerticalId;
  limit?: number;
}

interface UseSignalCorrelationsResult extends AsyncState<SignalWeightsResult> {
  rawSignals: IntelligenceSignalData[];
  correlations: CorrelationResult[];
  matrix: CorrelationMatrixUI | null;
}

export function useSignalCorrelations(options: UseSignalCorrelationsOptions): UseSignalCorrelationsResult {
  const { vertical, limit = 50 } = options;

  const [signals, setSignals] = useState<IntelligenceSignalData[]>([]);
  const [matrixData, setMatrixData] = useState<CorrelationMatrix | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [signalsData, matrixResult] = await Promise.all([
        fetchIntelligenceSignals(vertical, limit),
        fetchCorrelationMatrix(vertical, 'signal'),
      ]);
      setSignals(signalsData);
      setMatrixData(matrixResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch signal correlations');
    } finally {
      setIsLoading(false);
    }
  }, [vertical, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const data = useMemo(() => {
    return signals.length ? buildSignalWeights(signals) : null;
  }, [signals]);

  const matrix = useMemo(() => {
    return matrixData ? transformCorrelationMatrix(matrixData) : null;
  }, [matrixData]);

  // Build correlation results from matrix cells
  const correlations = useMemo<CorrelationResult[]>(() => {
    if (!matrixData) return [];
    return matrixData.cells.map((cell) => ({
      signalA: cell.x,
      signalB: cell.y,
      correlation: cell.correlation,
      significance: cell.significance,
      sampleSize: cell.sampleSize,
    }));
  }, [matrixData]);

  return {
    data,
    rawSignals: signals,
    correlations,
    matrix,
    isLoading,
    error,
    refetch: fetchData,
  };
}

// =============================================================================
// usePatternExplorer - Pattern Detection Hook (S62)
// =============================================================================

interface UsePatternExplorerOptions {
  vertical: VerticalId;
}

interface UsePatternExplorerResult extends AsyncState<PatternClustersResult> {
  patterns: PatternDetection[];
}

export function usePatternExplorer(options: UsePatternExplorerOptions): UsePatternExplorerResult {
  const { vertical } = options;

  const [rawPatterns, setRawPatterns] = useState<PatternDetection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchPatternDetections(vertical);
      setRawPatterns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patterns');
    } finally {
      setIsLoading(false);
    }
  }, [vertical]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const data = useMemo(() => {
    return buildPatternClusters(rawPatterns);
  }, [rawPatterns]);

  return {
    data,
    patterns: rawPatterns,
    isLoading,
    error,
    refetch: fetchData,
  };
}

// =============================================================================
// useAutonomousInsights - Autonomous Metrics Hook (S58)
// =============================================================================

interface UseAutonomousInsightsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useAutonomousInsights(options: UseAutonomousInsightsOptions = {}): AsyncState<AutonomousIntelligence> {
  const { autoRefresh = true, refreshInterval = 30000 } = options;

  const [data, setData] = useState<AutonomousIntelligence | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchAutonomousMetrics();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch autonomous metrics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

// =============================================================================
// useIntelligenceGraph - Graph Visualization Hook (S60)
// =============================================================================

interface UseIntelligenceGraphOptions {
  vertical: VerticalId;
  depth?: number;
}

export function useIntelligenceGraph(options: UseIntelligenceGraphOptions): AsyncState<GraphVisualizationData> {
  const { vertical, depth = 2 } = options;

  const [rawData, setRawData] = useState<IntelligenceGraphData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchIntelligenceGraph(vertical, depth);
      setRawData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch intelligence graph');
    } finally {
      setIsLoading(false);
    }
  }, [vertical, depth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const data = useMemo(() => {
    return rawData ? buildGraphVisualization(rawData) : null;
  }, [rawData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

// =============================================================================
// useTimeSeries - Time Series Hook (S56)
// =============================================================================

interface UseTimeSeriesOptions {
  vertical: VerticalId;
  metrics: string[];
  timeRange?: IntelligenceTimeRange;
  granularity?: 'hour' | 'day' | 'week' | 'month';
}

export function useTimeSeries(options: UseTimeSeriesOptions): AsyncState<TimeSeriesChartData> {
  const { vertical, metrics, timeRange = '30d', granularity = 'day' } = options;

  const [rawData, setRawData] = useState<TimeSeriesMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchTimeSeriesMetrics(vertical, metrics, timeRange, granularity);
      setRawData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch time series');
    } finally {
      setIsLoading(false);
    }
  }, [vertical, metrics, timeRange, granularity]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const data = useMemo(() => {
    return rawData.length ? buildTimeSeriesChart(rawData) : null;
  }, [rawData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

// =============================================================================
// useCompositeScore - Composite Intelligence Score Hook (S56)
// =============================================================================

interface UseCompositeScoreOptions {
  vertical: VerticalId;
}

export function useCompositeScore(options: UseCompositeScoreOptions): AsyncState<CompositeScoreUI> {
  const { vertical } = options;

  const [rawData, setRawData] = useState<CompositeIntelligenceScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchCompositeIntelligenceScore(vertical);
      setRawData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch composite score');
    } finally {
      setIsLoading(false);
    }
  }, [vertical]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const data = useMemo(() => {
    return rawData ? transformCompositeScore(rawData) : null;
  }, [rawData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

// =============================================================================
// useAuditLogs - Audit Log Hook (S59)
// =============================================================================

interface UseAuditLogsOptions {
  filter?: AuditFilter;
  pageSize?: number;
}

interface UseAuditLogsResult extends PaginatedState<AuditEntry> {
  timeline: AuditTimelineData | null;
  summary: AuditSummary | null;
}

export function useAuditLogs(options: UseAuditLogsOptions = {}): UseAuditLogsResult {
  const { filter = {}, pageSize = 50 } = options;

  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [logsResult, summaryResult] = await Promise.all([
        fetchAuditLogs(filter, page, pageSize),
        fetchAuditSummary(filter),
      ]);
      setEntries(logsResult.entries);
      setTotal(logsResult.total);
      setSummary(summaryResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
    } finally {
      setIsLoading(false);
    }
  }, [filter, page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const loadMore = useCallback(async () => {
    if (entries.length >= total) return;

    try {
      const result = await fetchAuditLogs(filter, page + 1, pageSize);
      setEntries((prev) => [...prev, ...result.entries]);
      setPage((p) => p + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more');
    }
  }, [filter, page, pageSize, entries.length, total]);

  const timeline = useMemo(() => {
    return entries.length ? buildAuditTimeline(entries) : null;
  }, [entries]);

  return {
    data: entries,
    timeline,
    summary,
    page,
    pageSize,
    total,
    hasMore: entries.length < total,
    isLoading,
    error,
    refetch: fetchData,
    loadMore,
    setPage,
  };
}

// =============================================================================
// useWorkspaces - Workspace Hook (S57)
// =============================================================================

interface UseWorkspacesOptions {
  userId: string;
}

interface UseWorkspacesResult extends AsyncState<Workspace[]> {
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace) => void;
}

export function useWorkspaces(options: UseWorkspacesOptions): UseWorkspacesResult {
  const { userId } = options;

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchUserWorkspaces(userId);
      setWorkspaces(result);
      if (result.length && !currentWorkspace) {
        setCurrentWorkspace(result[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workspaces');
    } finally {
      setIsLoading(false);
    }
  }, [userId, currentWorkspace]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data: workspaces,
    currentWorkspace,
    setCurrentWorkspace,
    isLoading,
    error,
    refetch: fetchData,
  };
}
