/**
 * Analytics Module
 *
 * Exports all analytics functionality.
 */

// Types
export type {
  ChartType,
  TimeGranularity,
  DateRange,
  ChartDataPoint,
  ChartSeries,
  ChartConfig,
  ChartAnnotation,
  RetentionCohort,
  RetentionData,
  RetentionConfig,
  FunnelStep,
  FunnelData,
  FunnelConfig,
  HeatmapType,
  HeatmapPoint,
  HeatmapData,
  HeatmapConfig,
  AIModel,
  AIFeature,
  AIUsageEvent,
  AIUsageSummary,
  TokenInference,
  ErrorSeverity,
  ErrorCategory,
  ErrorEvent,
  ErrorGroup,
  ErrorMetrics,
  VerticalMetrics,
  VerticalPopularityData,
  AnalyticsFilters,
  AnalyticsState,
} from './types';

// Charts
export {
  useChartStore,
  CHART_COLORS,
  getDateRangeBoundaries,
  getDefaultGranularity,
  formatTimestamp,
  generateTimeBuckets,
  calculateSeriesStats,
  createChartConfig,
  createSeries,
  normalizeSeriesData,
  createAnnotation,
  exportChartToCSV,
} from './charts';

// Retention
export {
  useRetentionStore,
  calculateRetention,
  getRetentionColor,
  formatPeriodLabel,
  getRetentionSummary,
  exportRetentionToCSV,
} from './retention';

// Funnel
export {
  useFunnelStore,
  calculateFunnel,
  getFunnelStepColor,
  getFunnelStepWidth,
  formatDuration,
  getFunnelSummary,
  compareFunnels,
  FUNNEL_TEMPLATES,
  exportFunnelToCSV,
} from './funnel';

// AI Usage
export {
  useAIUsageStore,
  MODEL_PRICING,
  calculateCost,
  getFeatureInfo,
  getModelInfo,
  analyzeUsageTrend,
  getCostBreakdown,
  formatCost,
  formatTokens,
  getLatencyRating,
  exportAIUsageToCSV,
} from './ai-usage';

// Errors
export {
  useErrorStore,
  getSeverityInfo,
  getCategoryInfo,
  getStatusInfo,
  calculateErrorRateChange,
  formatRelativeTime,
  calculateImpactScore,
  suggestCategory,
  exportErrorsToCSV,
} from './errors';

// Heatmaps
export {
  useHeatmapStore,
  getHeatmapTypeInfo,
  HEATMAP_COLOR_SCALES,
  calculateIntensity,
  getColorForIntensity,
  normalizePoints,
  generateScrollDepthData,
  calculateAttentionZones,
  getTopClickedElements,
  calculateClickDensity,
  exportHeatmapData,
} from './heatmaps';

// Verticals
export {
  useVerticalStore,
  VERTICALS,
  getVerticalInfo,
  calculateVerticalShares,
  getTrendInfo,
  calculateVerticalHealth,
  compareVerticals,
  formatPrice,
  estimateMarketSize,
  getVerticalRecommendations,
  exportVerticalsToCSV,
} from './verticals';
