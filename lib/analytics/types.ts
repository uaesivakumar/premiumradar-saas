/**
 * Analytics Types
 *
 * Core types for analytics, tracking, and metrics visualization.
 */

// ============================================================
// CHART TYPES (Mixpanel/PostHog Style)
// ============================================================

export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'donut' | 'stacked';
export type TimeGranularity = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
export type DateRange = '7d' | '14d' | '30d' | '90d' | '1y' | 'all' | 'custom';

export interface ChartDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
  metadata?: Record<string, unknown>;
}

export interface ChartSeries {
  id: string;
  name: string;
  color: string;
  data: ChartDataPoint[];
  visible?: boolean;
}

export interface ChartConfig {
  type: ChartType;
  title: string;
  description?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  granularity: TimeGranularity;
  dateRange: DateRange;
  customDateRange?: { start: Date; end: Date };
  showLegend?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  stacked?: boolean;
  normalized?: boolean;
  annotations?: ChartAnnotation[];
}

export interface ChartAnnotation {
  type: 'line' | 'point' | 'range';
  label: string;
  timestamp?: Date;
  range?: { start: Date; end: Date };
  color?: string;
}

// ============================================================
// RETENTION METRICS
// ============================================================

export interface RetentionCohort {
  cohortDate: Date;
  cohortSize: number;
  retentionByPeriod: number[]; // Percentage retained at each period
  label?: string;
}

export interface RetentionData {
  cohorts: RetentionCohort[];
  periodType: 'day' | 'week' | 'month';
  periods: number;
  averageRetention: number[];
  medianRetention: number[];
}

export interface RetentionConfig {
  periodType: 'day' | 'week' | 'month';
  periods: number;
  cohortFilter?: string;
  showPercentages?: boolean;
  colorScale?: 'green' | 'blue' | 'purple';
}

// ============================================================
// FUNNEL ANALYTICS
// ============================================================

export interface FunnelStep {
  id: string;
  name: string;
  count: number;
  conversionRate: number; // Percentage from previous step
  dropoffRate: number; // Percentage that dropped off
  averageTime?: number; // Average time in this step (ms)
}

export interface FunnelData {
  id: string;
  name: string;
  steps: FunnelStep[];
  totalConversion: number;
  dateRange: DateRange;
  totalUsers: number;
}

export interface FunnelConfig {
  steps: string[];
  dateRange: DateRange;
  segmentBy?: string;
  showAverageTime?: boolean;
  showDropoff?: boolean;
}

// ============================================================
// HEATMAPS
// ============================================================

export type HeatmapType = 'click' | 'scroll' | 'attention' | 'movement';

export interface HeatmapPoint {
  x: number;
  y: number;
  value: number;
  elementId?: string;
  elementType?: string;
}

export interface HeatmapData {
  type: HeatmapType;
  pageUrl: string;
  points: HeatmapPoint[];
  totalInteractions: number;
  sessionCount: number;
  dateRange: DateRange;
  viewport: { width: number; height: number };
}

export interface HeatmapConfig {
  type: HeatmapType;
  opacity: number;
  radius: number;
  colorScale: string[];
  minValue?: number;
  maxValue?: number;
}

// ============================================================
// AI USAGE TRACKING
// ============================================================

export type AIModel = 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo' | 'claude-3-opus' | 'claude-3-sonnet' | 'claude-3-haiku';
export type AIFeature = 'valuation' | 'comparison' | 'outreach' | 'analysis' | 'naming' | 'chat';

export interface AIUsageEvent {
  id: string;
  timestamp: Date;
  userId: string;
  feature: AIFeature;
  model: AIModel;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
  cached: boolean;
  cost: number;
  success: boolean;
  errorType?: string;
}

export interface AIUsageSummary {
  feature: AIFeature;
  totalCalls: number;
  totalTokens: number;
  totalCost: number;
  averageLatency: number;
  cacheHitRate: number;
  errorRate: number;
  tokensByModel: Record<AIModel, number>;
}

export interface TokenInference {
  feature: AIFeature;
  averageInputTokens: number;
  averageOutputTokens: number;
  p50Tokens: number;
  p90Tokens: number;
  p99Tokens: number;
  trend: 'up' | 'down' | 'stable';
}

// ============================================================
// ERROR EVENTS
// ============================================================

export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info';
export type ErrorCategory = 'api' | 'validation' | 'auth' | 'network' | 'ui' | 'unknown';

export interface ErrorEvent {
  id: string;
  timestamp: Date;
  severity: ErrorSeverity;
  category: ErrorCategory;
  message: string;
  stack?: string;
  userId?: string;
  sessionId?: string;
  pageUrl?: string;
  metadata?: Record<string, unknown>;
  fingerprint: string; // For grouping similar errors
  count: number; // Occurrence count
}

export interface ErrorGroup {
  fingerprint: string;
  message: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  affectedUsers: number;
  status: 'new' | 'investigating' | 'resolved' | 'ignored';
  assignee?: string;
  events: ErrorEvent[];
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByCategory: Record<ErrorCategory, number>;
  errorRate: number; // Errors per 1000 sessions
  trend: 'up' | 'down' | 'stable';
  topErrors: ErrorGroup[];
}

// ============================================================
// VERTICAL POPULARITY
// ============================================================

export interface VerticalMetrics {
  vertical: string;
  searchCount: number;
  viewCount: number;
  purchaseCount: number;
  averagePrice: number;
  medianPrice: number;
  priceRange: { min: number; max: number };
  topDomains: string[];
  trend: 'rising' | 'falling' | 'stable';
  trendPercentage: number;
}

export interface VerticalPopularityData {
  dateRange: DateRange;
  verticals: VerticalMetrics[];
  totalSearches: number;
  totalViews: number;
  totalPurchases: number;
}

// ============================================================
// ANALYTICS STATE
// ============================================================

export interface AnalyticsFilters {
  dateRange: DateRange;
  customDateRange?: { start: Date; end: Date };
  userId?: string;
  vertical?: string;
  feature?: AIFeature;
  errorSeverity?: ErrorSeverity;
}

export interface AnalyticsState {
  filters: AnalyticsFilters;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}
