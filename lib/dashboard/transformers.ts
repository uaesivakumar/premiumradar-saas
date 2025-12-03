/**
 * Dashboard Transformers
 * Sprint S54: Vertical Dashboards
 *
 * Transform OS data into dashboard-ready widgets.
 */

import type {
  VerticalId,
  KPIBlock,
  OutreachFunnel,
  FunnelStage,
  PersonaPerformance,
  HeatmapData,
  HeatmapCell,
  TrendSeries,
  TrendPoint,
  DiscoveryStats,
  OutreachStats,
  AutonomousMetrics,
  DashboardWidget,
  IntelligenceSignal,
} from './types';

// =============================================================================
// OS METRICS TO WIDGETS
// =============================================================================

export interface OSMetricsResponse {
  discovery?: {
    total: number;
    qualified: number;
    newThisWeek: number;
    avgScore: number;
  };
  outreach?: {
    sent: number;
    delivered: number;
    opened: number;
    replied: number;
    converted: number;
  };
  performance?: {
    responseRate: number;
    conversionRate: number;
    avgCycleTime: number;
  };
}

export function convertOSMetricsToWidgets(metrics: OSMetricsResponse): KPIBlock[] {
  const widgets: KPIBlock[] = [];

  // Discovery KPIs
  if (metrics.discovery) {
    widgets.push({
      id: 'total-leads',
      label: 'Total Leads',
      value: metrics.discovery.total,
      change: calculateChange(metrics.discovery.newThisWeek, metrics.discovery.total),
      changeDirection: metrics.discovery.newThisWeek > 0 ? 'up' : 'neutral',
      icon: '📊',
      color: '#3b82f6',
    });

    widgets.push({
      id: 'qualified-leads',
      label: 'Qualified Leads',
      value: metrics.discovery.qualified,
      change: calculatePercentage(metrics.discovery.qualified, metrics.discovery.total),
      changeDirection: 'neutral',
      icon: '✅',
      color: '#10b981',
    });

    widgets.push({
      id: 'quality-score',
      label: 'Avg Quality Score',
      value: Math.round(metrics.discovery.avgScore * 100) / 100,
      unit: '/100',
      changeDirection: 'neutral',
      icon: '⭐',
      color: '#f59e0b',
    });
  }

  // Outreach KPIs
  if (metrics.outreach) {
    widgets.push({
      id: 'outreach-sent',
      label: 'Outreach Sent',
      value: metrics.outreach.sent,
      changeDirection: 'neutral',
      icon: '📧',
      color: '#8b5cf6',
    });

    widgets.push({
      id: 'open-rate',
      label: 'Open Rate',
      value: calculatePercentage(metrics.outreach.opened, metrics.outreach.delivered),
      unit: '%',
      changeDirection: 'neutral',
      icon: '👁️',
      color: '#06b6d4',
    });

    widgets.push({
      id: 'reply-rate',
      label: 'Reply Rate',
      value: calculatePercentage(metrics.outreach.replied, metrics.outreach.sent),
      unit: '%',
      changeDirection: 'neutral',
      icon: '💬',
      color: '#22c55e',
    });
  }

  // Performance KPIs
  if (metrics.performance) {
    widgets.push({
      id: 'response-rate',
      label: 'Response Rate',
      value: Math.round(metrics.performance.responseRate * 100) / 100,
      unit: '%',
      changeDirection: metrics.performance.responseRate > 15 ? 'up' : 'down',
      icon: '📈',
      color: '#10b981',
    });

    widgets.push({
      id: 'conversion-rate',
      label: 'Conversion Rate',
      value: Math.round(metrics.performance.conversionRate * 100) / 100,
      unit: '%',
      changeDirection: metrics.performance.conversionRate > 5 ? 'up' : 'down',
      icon: '🎯',
      color: '#22c55e',
    });

    widgets.push({
      id: 'cycle-time',
      label: 'Avg Cycle Time',
      value: Math.round(metrics.performance.avgCycleTime),
      unit: ' days',
      changeDirection: metrics.performance.avgCycleTime < 14 ? 'up' : 'down',
      icon: '⏱️',
      color: '#f59e0b',
    });
  }

  return widgets;
}

// =============================================================================
// FUNNEL BUILDER
// =============================================================================

export interface FunnelInput {
  discovered: number;
  contacted: number;
  responded: number;
  qualified: number;
  converted: number;
  avgCycleTime?: number;
}

export function buildFunnel(input: FunnelInput): OutreachFunnel {
  const stages: FunnelStage[] = [
    {
      id: 'discovered',
      name: 'Discovered',
      count: input.discovered,
      conversionRate: 100,
      color: '#3b82f6',
    },
    {
      id: 'contacted',
      name: 'Contacted',
      count: input.contacted,
      conversionRate: calculatePercentage(input.contacted, input.discovered),
      color: '#8b5cf6',
    },
    {
      id: 'responded',
      name: 'Responded',
      count: input.responded,
      conversionRate: calculatePercentage(input.responded, input.contacted),
      color: '#f59e0b',
    },
    {
      id: 'qualified',
      name: 'Qualified',
      count: input.qualified,
      conversionRate: calculatePercentage(input.qualified, input.responded),
      color: '#10b981',
    },
    {
      id: 'converted',
      name: 'Converted',
      count: input.converted,
      conversionRate: calculatePercentage(input.converted, input.qualified),
      color: '#22c55e',
    },
  ];

  return {
    stages,
    totalLeads: input.discovered,
    totalConverted: input.converted,
    overallConversionRate: calculatePercentage(input.converted, input.discovered),
    avgCycleTime: input.avgCycleTime || 0,
  };
}

export function buildCustomFunnel(
  stageData: Array<{ id: string; name: string; count: number; color?: string }>
): OutreachFunnel {
  const stages: FunnelStage[] = stageData.map((stage, index) => {
    const prevCount = index > 0 ? stageData[index - 1].count : stage.count;
    return {
      id: stage.id,
      name: stage.name,
      count: stage.count,
      conversionRate: calculatePercentage(stage.count, prevCount),
      color: stage.color || getDefaultColor(index),
    };
  });

  const firstStage = stageData[0];
  const lastStage = stageData[stageData.length - 1];

  return {
    stages,
    totalLeads: firstStage?.count || 0,
    totalConverted: lastStage?.count || 0,
    overallConversionRate: calculatePercentage(lastStage?.count || 0, firstStage?.count || 1),
    avgCycleTime: 0,
  };
}

// =============================================================================
// PERSONA RANKING
// =============================================================================

export interface PersonaInput {
  id: string;
  name: string;
  type: string;
  outreach: number;
  responses: number;
  conversions: number;
  avgDealSize?: number;
  avgCycleTime?: number;
  signals?: string[];
}

export function buildPersonaRanking(personas: PersonaInput[]): PersonaPerformance[] {
  // Calculate scores and rank
  const ranked = personas.map((persona) => {
    const responseRate = calculatePercentage(persona.responses, persona.outreach);
    const conversionRate = calculatePercentage(persona.conversions, persona.responses || 1);

    // Quality score = weighted combination
    const qualityScore =
      responseRate * 0.3 +
      conversionRate * 0.4 +
      Math.min((persona.avgDealSize || 0) / 10000, 30) +
      Math.max(0, 30 - (persona.avgCycleTime || 30));

    return {
      personaId: persona.id,
      personaName: persona.name,
      personaType: persona.type,
      metrics: {
        totalOutreach: persona.outreach,
        responseRate,
        conversionRate,
        avgDealSize: persona.avgDealSize || 0,
        avgCycleTime: persona.avgCycleTime || 0,
        qualityScore: Math.round(qualityScore * 100) / 100,
      },
      rank: 0, // Set below
      trend: determineTrend(responseRate, conversionRate),
      topSignals: persona.signals || [],
    };
  });

  // Sort by quality score and assign ranks
  ranked.sort((a, b) => b.metrics.qualityScore - a.metrics.qualityScore);
  ranked.forEach((persona, index) => {
    persona.rank = index + 1;
  });

  return ranked;
}

function determineTrend(
  responseRate: number,
  conversionRate: number
): 'improving' | 'declining' | 'stable' {
  // Simple heuristic - in production, compare to historical data
  if (responseRate > 20 && conversionRate > 10) return 'improving';
  if (responseRate < 10 || conversionRate < 3) return 'declining';
  return 'stable';
}

// =============================================================================
// HEATMAP BUILDER
// =============================================================================

export interface HeatmapInput {
  type: 'time-of-day' | 'persona' | 'industry';
  data: Array<{
    x: string | number;
    y: string | number;
    value: number;
  }>;
  title?: string;
}

export function buildHeatmap(input: HeatmapInput): HeatmapData {
  const xLabels = [...new Set(input.data.map((d) => String(d.x)))];
  const yLabels = [...new Set(input.data.map((d) => String(d.y)))];

  const values = input.data.map((d) => d.value);
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 100);

  const cells: HeatmapCell[] = input.data.map((d) => ({
    x: d.x,
    y: d.y,
    value: d.value,
    label: `${d.value}%`,
  }));

  const colorScales: Record<string, 'green' | 'blue' | 'orange'> = {
    'time-of-day': 'green',
    'persona': 'blue',
    'industry': 'orange',
  };

  return {
    id: `heatmap-${input.type}`,
    title: input.title || getDefaultHeatmapTitle(input.type),
    xLabels,
    yLabels,
    cells,
    minValue,
    maxValue,
    colorScale: colorScales[input.type] || 'green',
  };
}

export function buildTimeOfDayHeatmap(
  data: Array<{ day: string; hour: number; responseRate: number }>
): HeatmapData {
  return buildHeatmap({
    type: 'time-of-day',
    data: data.map((d) => ({
      x: formatHour(d.hour),
      y: d.day,
      value: d.responseRate,
    })),
    title: 'Response Rate by Time of Day',
  });
}

function getDefaultHeatmapTitle(type: string): string {
  switch (type) {
    case 'time-of-day':
      return 'Response Rate by Time';
    case 'persona':
      return 'Performance by Persona';
    case 'industry':
      return 'Engagement by Industry';
    default:
      return 'Heatmap';
  }
}

function formatHour(hour: number): string {
  if (hour === 0) return '12AM';
  if (hour === 12) return '12PM';
  if (hour < 12) return `${hour}AM`;
  return `${hour - 12}PM`;
}

// =============================================================================
// TREND LINE BUILDER
// =============================================================================

export interface TrendInput {
  id: string;
  label: string;
  data: Array<{ date: Date | string; value: number }>;
  color?: string;
  type?: 'line' | 'bar' | 'area';
}

export function buildTrendLine(input: TrendInput): TrendSeries {
  return {
    id: input.id,
    label: input.label,
    data: input.data.map((d) => ({
      date: typeof d.date === 'string' ? new Date(d.date) : d.date,
      value: d.value,
    })),
    color: input.color || getDefaultColor(0),
    type: input.type || 'line',
  };
}

export function buildMultipleTrendLines(inputs: TrendInput[]): TrendSeries[] {
  return inputs.map((input, index) => ({
    id: input.id,
    label: input.label,
    data: input.data.map((d) => ({
      date: typeof d.date === 'string' ? new Date(d.date) : d.date,
      value: d.value,
    })),
    color: input.color || getDefaultColor(index),
    type: input.type || 'line',
  }));
}

export function aggregateTrendByPeriod(
  data: TrendPoint[],
  period: 'day' | 'week' | 'month'
): TrendPoint[] {
  const grouped = new Map<string, { sum: number; count: number }>();

  for (const point of data) {
    const key = getGroupKey(point.date, period);
    const existing = grouped.get(key) || { sum: 0, count: 0 };
    existing.sum += point.value;
    existing.count += 1;
    grouped.set(key, existing);
  }

  return Array.from(grouped.entries()).map(([key, { sum, count }]) => ({
    date: new Date(key),
    value: Math.round((sum / count) * 100) / 100,
  }));
}

function getGroupKey(date: Date, period: string): string {
  const d = new Date(date);
  switch (period) {
    case 'day':
      return d.toISOString().split('T')[0];
    case 'week':
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      return weekStart.toISOString().split('T')[0];
    case 'month':
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    default:
      return d.toISOString().split('T')[0];
  }
}

// =============================================================================
// SIGNAL TRANSFORMER
// =============================================================================

export interface RawSignal {
  id: string;
  type: string;
  title: string;
  description?: string;
  confidence: number;
  timestamp: Date | string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export function transformSignals(rawSignals: RawSignal[]): IntelligenceSignal[] {
  return rawSignals.map((signal) => ({
    id: signal.id,
    type: signal.type,
    category: categorizeSignal(signal.type),
    title: signal.title,
    description: signal.description || '',
    confidence: signal.confidence,
    timestamp: typeof signal.timestamp === 'string' ? new Date(signal.timestamp) : signal.timestamp,
    source: signal.source || 'unknown',
    metadata: signal.metadata,
    actionable: signal.confidence > 0.7,
    priority: determinePriority(signal.confidence, signal.type),
  }));
}

function categorizeSignal(type: string): 'opportunity' | 'risk' | 'insight' | 'action' {
  const opportunityTypes = ['hiring', 'expansion', 'funding', 'project-award', 'market-entry'];
  const riskTypes = ['layoff', 'downsizing', 'bankruptcy', 'leadership-change'];
  const actionTypes = ['contact-request', 'meeting-scheduled', 'demo-requested'];

  if (opportunityTypes.includes(type)) return 'opportunity';
  if (riskTypes.includes(type)) return 'risk';
  if (actionTypes.includes(type)) return 'action';
  return 'insight';
}

function determinePriority(confidence: number, type: string): 'high' | 'medium' | 'low' {
  if (confidence > 0.85) return 'high';
  if (confidence > 0.6) return 'medium';
  return 'low';
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 10000) / 100;
}

function calculateChange(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((current / total) * 10000) / 100;
}

const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
];

function getDefaultColor(index: number): string {
  return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

// =============================================================================
// WIDGET WRAPPER
// =============================================================================

export function wrapInWidget<T>(
  id: string,
  type: string,
  title: string,
  data: T,
  loading: boolean = false,
  error?: string
): DashboardWidget<T> {
  return {
    id,
    type: type as any,
    title,
    data,
    loading,
    error,
    lastUpdated: new Date(),
  };
}
