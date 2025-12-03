/**
 * Dashboard Fetchers
 * Sprint S54: Vertical Dashboards
 *
 * Data fetching functions for dashboard intelligence.
 * All fetchers are READ-ONLY from UPR OS backend.
 */

import type {
  VerticalId,
  VerticalConfig,
  DiscoveryStats,
  OutreachStats,
  PersonaPerformance,
  IntelligenceSignal,
  AutonomousMetrics,
  KPIBlock,
  OutreachFunnel,
  HeatmapData,
  TrendSeries,
  DateRange,
} from './types';
import { VERTICAL_CONFIGS } from './types';

// =============================================================================
// CONFIGURATION
// =============================================================================

const OS_BASE_URL = process.env.NEXT_PUBLIC_OS_URL || 'https://upr-os.sivakumar.ai';
const API_TIMEOUT = 10000; // 10 seconds

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

function buildDateRangeParams(dateRange?: DateRange): string {
  if (!dateRange) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return `start=${start.toISOString()}&end=${end.toISOString()}`;
  }
  return `start=${dateRange.start.toISOString()}&end=${dateRange.end.toISOString()}`;
}

// =============================================================================
// VERTICAL CONFIG
// =============================================================================

export function getVerticalConfig(vertical: VerticalId): VerticalConfig {
  const config = VERTICAL_CONFIGS[vertical];
  if (!config) {
    throw new Error(`Unknown vertical: ${vertical}`);
  }
  return config;
}

export function getAllVerticals(): VerticalConfig[] {
  return Object.values(VERTICAL_CONFIGS);
}

export function isValidVertical(vertical: string): vertical is VerticalId {
  return vertical in VERTICAL_CONFIGS;
}

// =============================================================================
// DISCOVERY STATS
// =============================================================================

export async function fetchDiscoveryStats(
  vertical: VerticalId,
  territory?: string,
  dateRange?: DateRange,
  options?: FetchOptions
): Promise<DiscoveryStats> {
  const params = new URLSearchParams();
  params.set('vertical', vertical);
  if (territory) params.set('territory', territory);
  params.set(buildDateRangeParams(dateRange).split('&')[0].split('=')[0],
             buildDateRangeParams(dateRange).split('&')[0].split('=')[1]);

  try {
    const response = await fetchFromOS<{
      success: boolean;
      data: DiscoveryStats;
    }>(`/api/discovery/stats?${params.toString()}`, options);

    return response.data;
  } catch (error) {
    // Return fallback data if OS is unavailable
    console.warn('Failed to fetch discovery stats from OS, using fallback:', error);
    return generateFallbackDiscoveryStats(vertical);
  }
}

function generateFallbackDiscoveryStats(vertical: VerticalId): DiscoveryStats {
  return {
    totalCompanies: 0,
    newThisWeek: 0,
    qualifiedLeads: 0,
    avgQualityScore: 0,
    byIndustry: [],
    bySize: [],
    byRegion: [],
    topSignals: [],
  };
}

// =============================================================================
// OUTREACH STATS
// =============================================================================

export async function fetchOutreachStats(
  vertical: VerticalId,
  territory?: string,
  dateRange?: DateRange,
  options?: FetchOptions
): Promise<OutreachStats> {
  const params = new URLSearchParams();
  params.set('vertical', vertical);
  if (territory) params.set('territory', territory);

  try {
    const response = await fetchFromOS<{
      success: boolean;
      data: OutreachStats;
    }>(`/api/outreach/stats?${params.toString()}`, options);

    return response.data;
  } catch (error) {
    console.warn('Failed to fetch outreach stats from OS, using fallback:', error);
    return generateFallbackOutreachStats();
  }
}

function generateFallbackOutreachStats(): OutreachStats {
  return {
    totalSent: 0,
    delivered: 0,
    opened: 0,
    replied: 0,
    converted: 0,
    avgResponseTime: 0,
    bestPerformingTemplate: 'N/A',
    byChannel: [],
    byDayOfWeek: [],
    byTimeOfDay: [],
  };
}

// =============================================================================
// PERSONA PERFORMANCE
// =============================================================================

export async function fetchPersonaPerformance(
  vertical?: VerticalId,
  options?: FetchOptions
): Promise<PersonaPerformance[]> {
  const params = new URLSearchParams();
  if (vertical) params.set('vertical', vertical);

  try {
    const response = await fetchFromOS<{
      success: boolean;
      data: PersonaPerformance[];
    }>(`/api/personas/performance?${params.toString()}`, options);

    return response.data;
  } catch (error) {
    console.warn('Failed to fetch persona performance from OS, using fallback:', error);
    return [];
  }
}

// =============================================================================
// INTELLIGENCE SIGNALS
// =============================================================================

export async function fetchIntelligenceSignals(
  vertical: VerticalId,
  limit: number = 20,
  options?: FetchOptions
): Promise<IntelligenceSignal[]> {
  const params = new URLSearchParams();
  params.set('vertical', vertical);
  params.set('limit', limit.toString());

  try {
    const response = await fetchFromOS<{
      success: boolean;
      data: IntelligenceSignal[];
    }>(`/api/intelligence/signals?${params.toString()}`, options);

    return response.data;
  } catch (error) {
    console.warn('Failed to fetch intelligence signals from OS, using fallback:', error);
    return [];
  }
}

// =============================================================================
// AUTONOMOUS METRICS
// =============================================================================

export async function fetchAutonomousMetrics(
  options?: FetchOptions
): Promise<AutonomousMetrics> {
  try {
    const response = await fetchFromOS<{
      success: boolean;
      data: AutonomousMetrics;
    }>('/api/autonomous/metrics', options);

    return response.data;
  } catch (error) {
    console.warn('Failed to fetch autonomous metrics from OS, using fallback:', error);
    return generateFallbackAutonomousMetrics();
  }
}

function generateFallbackAutonomousMetrics(): AutonomousMetrics {
  return {
    totalActions: 0,
    successRate: 0,
    avgLatency: 0,
    costSavings: 0,
    automationRate: 0,
    byActionType: [],
    errorRate: 0,
    lastUpdated: new Date(),
  };
}

// =============================================================================
// FUNNEL DATA
// =============================================================================

export async function fetchFunnelData(
  vertical: VerticalId,
  territory?: string,
  dateRange?: DateRange,
  options?: FetchOptions
): Promise<OutreachFunnel> {
  const params = new URLSearchParams();
  params.set('vertical', vertical);
  if (territory) params.set('territory', territory);

  try {
    const response = await fetchFromOS<{
      success: boolean;
      data: OutreachFunnel;
    }>(`/api/pipeline/funnel?${params.toString()}`, options);

    return response.data;
  } catch (error) {
    console.warn('Failed to fetch funnel data from OS, using fallback:', error);
    return generateFallbackFunnel();
  }
}

function generateFallbackFunnel(): OutreachFunnel {
  return {
    stages: [
      { id: 'discovered', name: 'Discovered', count: 0, color: '#3b82f6' },
      { id: 'contacted', name: 'Contacted', count: 0, color: '#8b5cf6' },
      { id: 'responded', name: 'Responded', count: 0, color: '#f59e0b' },
      { id: 'qualified', name: 'Qualified', count: 0, color: '#10b981' },
      { id: 'converted', name: 'Converted', count: 0, color: '#22c55e' },
    ],
    totalLeads: 0,
    totalConverted: 0,
    overallConversionRate: 0,
    avgCycleTime: 0,
  };
}

// =============================================================================
// KPI DATA
// =============================================================================

export async function fetchKPIs(
  vertical: VerticalId,
  territory?: string,
  dateRange?: DateRange,
  options?: FetchOptions
): Promise<KPIBlock[]> {
  const params = new URLSearchParams();
  params.set('vertical', vertical);
  if (territory) params.set('territory', territory);

  try {
    const response = await fetchFromOS<{
      success: boolean;
      data: KPIBlock[];
    }>(`/api/metrics/kpis?${params.toString()}`, options);

    return response.data;
  } catch (error) {
    console.warn('Failed to fetch KPIs from OS, using fallback:', error);
    return generateFallbackKPIs(vertical);
  }
}

function generateFallbackKPIs(vertical: VerticalId): KPIBlock[] {
  return [
    {
      id: 'total-leads',
      label: 'Total Leads',
      value: 0,
      change: 0,
      changeDirection: 'neutral',
      icon: '📊',
    },
    {
      id: 'qualified-leads',
      label: 'Qualified',
      value: 0,
      change: 0,
      changeDirection: 'neutral',
      icon: '✅',
    },
    {
      id: 'response-rate',
      label: 'Response Rate',
      value: 0,
      unit: '%',
      change: 0,
      changeDirection: 'neutral',
      icon: '📨',
    },
    {
      id: 'conversion-rate',
      label: 'Conversion Rate',
      value: 0,
      unit: '%',
      change: 0,
      changeDirection: 'neutral',
      icon: '🎯',
    },
  ];
}

// =============================================================================
// HEATMAP DATA
// =============================================================================

export async function fetchHeatmapData(
  vertical: VerticalId,
  type: 'time-of-day' | 'persona' | 'industry' = 'time-of-day',
  options?: FetchOptions
): Promise<HeatmapData> {
  const params = new URLSearchParams();
  params.set('vertical', vertical);
  params.set('type', type);

  try {
    const response = await fetchFromOS<{
      success: boolean;
      data: HeatmapData;
    }>(`/api/analytics/heatmap?${params.toString()}`, options);

    return response.data;
  } catch (error) {
    console.warn('Failed to fetch heatmap data from OS, using fallback:', error);
    return generateFallbackHeatmap(type);
  }
}

function generateFallbackHeatmap(type: string): HeatmapData {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM'];

  return {
    id: `heatmap-${type}`,
    title: 'Response Rate by Time',
    xLabels: hours,
    yLabels: days,
    cells: [],
    minValue: 0,
    maxValue: 100,
    colorScale: 'green',
  };
}

// =============================================================================
// TREND DATA
// =============================================================================

export async function fetchTrendData(
  vertical: VerticalId,
  metrics: string[],
  dateRange?: DateRange,
  options?: FetchOptions
): Promise<TrendSeries[]> {
  const params = new URLSearchParams();
  params.set('vertical', vertical);
  params.set('metrics', metrics.join(','));

  try {
    const response = await fetchFromOS<{
      success: boolean;
      data: TrendSeries[];
    }>(`/api/analytics/trends?${params.toString()}`, options);

    return response.data;
  } catch (error) {
    console.warn('Failed to fetch trend data from OS, using fallback:', error);
    return [];
  }
}

// =============================================================================
// FULL DASHBOARD DATA
// =============================================================================

export interface FullDashboardData {
  kpis: KPIBlock[];
  funnel: OutreachFunnel;
  personas: PersonaPerformance[];
  heatmap: HeatmapData;
  trends: TrendSeries[];
  signals: IntelligenceSignal[];
  discovery: DiscoveryStats;
  outreach: OutreachStats;
  autonomous: AutonomousMetrics;
}

export async function fetchFullDashboard(
  vertical: VerticalId,
  territory?: string,
  dateRange?: DateRange,
  options?: FetchOptions
): Promise<FullDashboardData> {
  // Fetch all data in parallel for performance
  const [
    kpis,
    funnel,
    personas,
    heatmap,
    trends,
    signals,
    discovery,
    outreach,
    autonomous,
  ] = await Promise.all([
    fetchKPIs(vertical, territory, dateRange, options),
    fetchFunnelData(vertical, territory, dateRange, options),
    fetchPersonaPerformance(vertical, options),
    fetchHeatmapData(vertical, 'time-of-day', options),
    fetchTrendData(vertical, ['leads', 'conversions', 'response-rate'], dateRange, options),
    fetchIntelligenceSignals(vertical, 10, options),
    fetchDiscoveryStats(vertical, territory, dateRange, options),
    fetchOutreachStats(vertical, territory, dateRange, options),
    fetchAutonomousMetrics(options),
  ]);

  return {
    kpis,
    funnel,
    personas,
    heatmap,
    trends,
    signals,
    discovery,
    outreach,
    autonomous,
  };
}
