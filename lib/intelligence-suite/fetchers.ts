/**
 * Intelligence Suite Fetchers
 * Sprint S56-S62: PremiumRadar Intelligence Suite
 *
 * Data fetching functions for intelligence layer.
 * All fetchers are READ-ONLY from UPR OS backend.
 *
 * ARCHITECTURE:
 * - SaaS fetches from OS via API
 * - No direct database access
 * - Graceful degradation with fallbacks
 */

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
  CompositeIntelligenceScore,
  IntelligenceGraphData,
  AuditEntry,
  AuditFilter,
  AuditSummary,
  Workspace,
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

function buildTimeRangeParams(timeRange: IntelligenceTimeRange, customRange?: { start: Date; end: Date }): string {
  if (timeRange === 'custom' && customRange) {
    return `start=${customRange.start.toISOString()}&end=${customRange.end.toISOString()}`;
  }

  const end = new Date();
  const start = new Date();

  switch (timeRange) {
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    case '90d':
      start.setDate(start.getDate() - 90);
      break;
  }

  return `start=${start.toISOString()}&end=${end.toISOString()}`;
}

// =============================================================================
// PERSONA PERFORMANCE FETCHER (S56)
// =============================================================================

export async function fetchPersonaPerformance(
  vertical?: VerticalId,
  timeRange: IntelligenceTimeRange = '30d',
  options?: FetchOptions
): Promise<PersonaPerformanceData[]> {
  const params = new URLSearchParams();
  if (vertical) params.set('vertical', vertical);
  params.set('timeRange', timeRange);

  try {
    const response = await fetchFromOS<{
      success: boolean;
      data: PersonaPerformanceData[];
    }>(`/api/intelligence/personas/performance?${params.toString()}`, options);

    return response.data || [];
  } catch (error) {
    console.warn('Failed to fetch persona performance from OS, using fallback:', error);
    return generateFallbackPersonaPerformance();
  }
}

function generateFallbackPersonaPerformance(): PersonaPerformanceData[] {
  return [
    {
      personaId: 'demo-persona-1',
      personaName: 'Sales Executive',
      personaType: 'sales',
      metrics: {
        totalOutreach: 0,
        responseRate: 0,
        conversionRate: 0,
        avgDealSize: 0,
        avgCycleTime: 0,
        qualityScore: 0,
        engagementScore: 0,
        successRate: 0,
      },
      trends: {
        outreach: [],
        responseRate: [],
        conversion: [],
        quality: [],
      },
      ranking: {
        overall: 1,
        totalPersonas: 1,
        byMetric: {},
        movement: 'stable',
        movementAmount: 0,
      },
      insights: [],
      lastActive: new Date(),
    },
  ];
}

// =============================================================================
// JOURNEY PERFORMANCE FETCHER (S56)
// =============================================================================

export async function fetchJourneyPerformance(
  vertical?: VerticalId,
  timeRange: IntelligenceTimeRange = '30d',
  options?: FetchOptions
): Promise<JourneyPerformanceData[]> {
  const params = new URLSearchParams();
  if (vertical) params.set('vertical', vertical);
  params.set('timeRange', timeRange);

  try {
    const response = await fetchFromOS<{
      success: boolean;
      data: JourneyPerformanceData[];
    }>(`/api/intelligence/journeys/performance?${params.toString()}`, options);

    return response.data || [];
  } catch (error) {
    console.warn('Failed to fetch journey performance from OS, using fallback:', error);
    return [];
  }
}

// =============================================================================
// SCORE BREAKDOWN FETCHER (S61)
// =============================================================================

export async function fetchScoreBreakdown(
  objectId: string,
  options?: FetchOptions
): Promise<ScoreBreakdownFullData | null> {
  try {
    const response = await fetchFromOS<{
      success: boolean;
      data: ScoreBreakdownFullData;
    }>(`/api/intelligence/scores/${objectId}/breakdown`, options);

    return response.data || null;
  } catch (error) {
    console.warn('Failed to fetch score breakdown from OS:', error);
    return null;
  }
}

// =============================================================================
// INTELLIGENCE SIGNALS FETCHER (S56)
// =============================================================================

export async function fetchIntelligenceSignals(
  vertical: VerticalId,
  limit: number = 50,
  options?: FetchOptions
): Promise<IntelligenceSignalData[]> {
  const params = new URLSearchParams();
  params.set('vertical', vertical);
  params.set('limit', limit.toString());

  try {
    const response = await fetchFromOS<{
      success: boolean;
      data: IntelligenceSignalData[];
    }>(`/api/intelligence/signals?${params.toString()}`, options);

    return response.data || [];
  } catch (error) {
    console.warn('Failed to fetch intelligence signals from OS, using fallback:', error);
    return [];
  }
}

// =============================================================================
// PATTERN DETECTION FETCHER (S62)
// =============================================================================

export async function fetchPatternDetections(
  vertical: VerticalId,
  options?: FetchOptions
): Promise<PatternDetection[]> {
  const params = new URLSearchParams();
  params.set('vertical', vertical);

  try {
    const response = await fetchFromOS<{
      success: boolean;
      data: PatternDetection[];
    }>(`/api/intelligence/patterns?${params.toString()}`, options);

    return response.data || [];
  } catch (error) {
    console.warn('Failed to fetch pattern detections from OS, using fallback:', error);
    return [];
  }
}

// =============================================================================
// AUTONOMOUS METRICS FETCHER (S58)
// =============================================================================

export async function fetchAutonomousMetrics(
  options?: FetchOptions
): Promise<AutonomousIntelligence> {
  try {
    const response = await fetchFromOS<{
      success: boolean;
      data: AutonomousIntelligence;
    }>('/api/autonomous/intelligence', options);

    return response.data;
  } catch (error) {
    console.warn('Failed to fetch autonomous metrics from OS, using fallback:', error);
    return generateFallbackAutonomousMetrics();
  }
}

function generateFallbackAutonomousMetrics(): AutonomousIntelligence {
  return {
    status: {
      enabled: false,
      mode: 'paused',
      killSwitch: {
        active: false,
        canResume: true,
      },
      healthScore: 0,
    },
    metrics: {
      totalActions: 0,
      successRate: 0,
      avgLatency: 0,
      errorRate: 0,
      automationRate: 0,
      costSavings: 0,
      timeSaved: 0,
      byActionType: [],
    },
    activities: [],
    checkpoints: [],
    costs: {
      totalCost: 0,
      costByType: [],
      tokenUsage: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        costPerToken: 0,
      },
      projectedMonthly: 0,
      budgetRemaining: 0,
      budgetUtilization: 0,
    },
    performance: {
      latencyP50: 0,
      latencyP95: 0,
      latencyP99: 0,
      throughput: 0,
      errorRateByType: {},
      anomalies: [],
    },
    lastUpdated: new Date(),
  };
}

// =============================================================================
// OUTCOME CORRELATIONS FETCHER (S56)
// =============================================================================

export async function fetchOutcomeCorrelations(
  vertical: VerticalId,
  outcomeType?: string,
  options?: FetchOptions
): Promise<OutcomeCorrelation[]> {
  const params = new URLSearchParams();
  params.set('vertical', vertical);
  if (outcomeType) params.set('outcomeType', outcomeType);

  try {
    const response = await fetchFromOS<{
      success: boolean;
      data: OutcomeCorrelation[];
    }>(`/api/intelligence/correlations/outcomes?${params.toString()}`, options);

    return response.data || [];
  } catch (error) {
    console.warn('Failed to fetch outcome correlations from OS, using fallback:', error);
    return [];
  }
}

// =============================================================================
// EVIDENCE CORRELATIONS FETCHER (S56)
// =============================================================================

export async function fetchEvidenceCorrelations(
  objectId: string,
  options?: FetchOptions
): Promise<EvidenceCorrelation | null> {
  try {
    const response = await fetchFromOS<{
      success: boolean;
      data: EvidenceCorrelation;
    }>(`/api/intelligence/correlations/evidence/${objectId}`, options);

    return response.data || null;
  } catch (error) {
    console.warn('Failed to fetch evidence correlations from OS:', error);
    return null;
  }
}

// =============================================================================
// TIME SERIES METRICS FETCHER (S56)
// =============================================================================

export async function fetchTimeSeriesMetrics(
  vertical: VerticalId,
  metrics: string[],
  timeRange: IntelligenceTimeRange = '30d',
  granularity: 'hour' | 'day' | 'week' | 'month' = 'day',
  options?: FetchOptions
): Promise<TimeSeriesMetrics[]> {
  const params = new URLSearchParams();
  params.set('vertical', vertical);
  params.set('metrics', metrics.join(','));
  params.set('timeRange', timeRange);
  params.set('granularity', granularity);

  try {
    const response = await fetchFromOS<{
      success: boolean;
      data: TimeSeriesMetrics[];
    }>(`/api/intelligence/timeseries?${params.toString()}`, options);

    return response.data || [];
  } catch (error) {
    console.warn('Failed to fetch time series metrics from OS, using fallback:', error);
    return [];
  }
}

// =============================================================================
// CORRELATION MATRIX FETCHER (S62)
// =============================================================================

export async function fetchCorrelationMatrix(
  vertical: VerticalId,
  type: 'signal' | 'evidence' | 'outcome' = 'signal',
  options?: FetchOptions
): Promise<CorrelationMatrix | null> {
  const params = new URLSearchParams();
  params.set('vertical', vertical);
  params.set('type', type);

  try {
    const response = await fetchFromOS<{
      success: boolean;
      data: CorrelationMatrix;
    }>(`/api/intelligence/correlations/matrix?${params.toString()}`, options);

    return response.data || null;
  } catch (error) {
    console.warn('Failed to fetch correlation matrix from OS:', error);
    return null;
  }
}

// =============================================================================
// COMPOSITE INTELLIGENCE SCORE FETCHER (S56)
// =============================================================================

export async function fetchCompositeIntelligenceScore(
  vertical: VerticalId,
  options?: FetchOptions
): Promise<CompositeIntelligenceScore | null> {
  const params = new URLSearchParams();
  params.set('vertical', vertical);

  try {
    const response = await fetchFromOS<{
      success: boolean;
      data: CompositeIntelligenceScore;
    }>(`/api/intelligence/composite?${params.toString()}`, options);

    return response.data || null;
  } catch (error) {
    console.warn('Failed to fetch composite score from OS:', error);
    return null;
  }
}

// =============================================================================
// INTELLIGENCE GRAPH FETCHER (S60)
// =============================================================================

export async function fetchIntelligenceGraph(
  vertical: VerticalId,
  depth: number = 2,
  options?: FetchOptions
): Promise<IntelligenceGraphData | null> {
  const params = new URLSearchParams();
  params.set('vertical', vertical);
  params.set('depth', depth.toString());

  try {
    const response = await fetchFromOS<{
      success: boolean;
      data: IntelligenceGraphData;
    }>(`/api/intelligence/graph?${params.toString()}`, options);

    return response.data || null;
  } catch (error) {
    console.warn('Failed to fetch intelligence graph from OS:', error);
    return generateFallbackGraphData();
  }
}

function generateFallbackGraphData(): IntelligenceGraphData {
  return {
    id: 'fallback-graph',
    nodes: [],
    edges: [],
    clusters: [],
    metadata: {
      totalNodes: 0,
      totalEdges: 0,
      clusters: 0,
      density: 0,
      generatedAt: new Date(),
    },
  };
}

// =============================================================================
// AUDIT LOG FETCHER (S59)
// =============================================================================

export async function fetchAuditLogs(
  filter: AuditFilter,
  page: number = 1,
  pageSize: number = 50,
  options?: FetchOptions
): Promise<{ entries: AuditEntry[]; total: number }> {
  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('pageSize', pageSize.toString());

  if (filter.userId) params.set('userId', filter.userId);
  if (filter.action) params.set('action', filter.action.join(','));
  if (filter.resourceType) params.set('resourceType', filter.resourceType.join(','));
  if (filter.resourceId) params.set('resourceId', filter.resourceId);
  if (filter.searchQuery) params.set('search', filter.searchQuery);
  if (filter.dateRange) {
    params.set('start', filter.dateRange.start.toISOString());
    params.set('end', filter.dateRange.end.toISOString());
  }

  try {
    const response = await fetchFromOS<{
      success: boolean;
      data: { entries: AuditEntry[]; total: number };
    }>(`/api/audit/logs?${params.toString()}`, options);

    return response.data || { entries: [], total: 0 };
  } catch (error) {
    console.warn('Failed to fetch audit logs from OS, using fallback:', error);
    return { entries: [], total: 0 };
  }
}

export async function fetchAuditSummary(
  filter?: AuditFilter,
  options?: FetchOptions
): Promise<AuditSummary> {
  const params = new URLSearchParams();
  if (filter?.dateRange) {
    params.set('start', filter.dateRange.start.toISOString());
    params.set('end', filter.dateRange.end.toISOString());
  }

  try {
    const response = await fetchFromOS<{
      success: boolean;
      data: AuditSummary;
    }>(`/api/audit/summary?${params.toString()}`, options);

    return response.data;
  } catch (error) {
    console.warn('Failed to fetch audit summary from OS, using fallback:', error);
    return {
      totalEntries: 0,
      byAction: {} as Record<string, number>,
      byResourceType: {} as Record<string, number>,
      byUser: [],
      recentActivity: [],
    };
  }
}

// =============================================================================
// WORKSPACE FETCHER (S57)
// =============================================================================

export async function fetchWorkspace(
  workspaceId: string,
  options?: FetchOptions
): Promise<Workspace | null> {
  try {
    const response = await fetchFromOS<{
      success: boolean;
      data: Workspace;
    }>(`/api/workspaces/${workspaceId}`, options);

    return response.data || null;
  } catch (error) {
    console.warn('Failed to fetch workspace from OS:', error);
    return null;
  }
}

export async function fetchUserWorkspaces(
  userId: string,
  options?: FetchOptions
): Promise<Workspace[]> {
  const params = new URLSearchParams();
  params.set('userId', userId);

  try {
    const response = await fetchFromOS<{
      success: boolean;
      data: Workspace[];
    }>(`/api/workspaces?${params.toString()}`, options);

    return response.data || [];
  } catch (error) {
    console.warn('Failed to fetch user workspaces from OS, using fallback:', error);
    return [];
  }
}

// =============================================================================
// FULL INTELLIGENCE DATA FETCHER
// =============================================================================

export interface FullIntelligenceData {
  personas: PersonaPerformanceData[];
  journeys: JourneyPerformanceData[];
  signals: IntelligenceSignalData[];
  patterns: PatternDetection[];
  autonomous: AutonomousIntelligence;
  timeSeries: TimeSeriesMetrics[];
  compositeScore: CompositeIntelligenceScore | null;
}

export async function fetchFullIntelligenceData(
  vertical: VerticalId,
  timeRange: IntelligenceTimeRange = '30d',
  options?: FetchOptions
): Promise<FullIntelligenceData> {
  // Fetch all data in parallel for performance
  const [
    personas,
    journeys,
    signals,
    patterns,
    autonomous,
    timeSeries,
    compositeScore,
  ] = await Promise.all([
    fetchPersonaPerformance(vertical, timeRange, options),
    fetchJourneyPerformance(vertical, timeRange, options),
    fetchIntelligenceSignals(vertical, 50, options),
    fetchPatternDetections(vertical, options),
    fetchAutonomousMetrics(options),
    fetchTimeSeriesMetrics(vertical, ['leads', 'conversions', 'engagement'], timeRange, 'day', options),
    fetchCompositeIntelligenceScore(vertical, options),
  ]);

  return {
    personas,
    journeys,
    signals,
    patterns,
    autonomous,
    timeSeries,
    compositeScore,
  };
}
