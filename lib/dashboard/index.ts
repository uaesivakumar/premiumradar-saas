/**
 * Dashboard Module
 * Sprint S54: Vertical Dashboards
 *
 * Barrel exports for the dashboard data layer.
 */

// Types
export type {
  VerticalId,
  VerticalConfig,
  SubVertical,
  VerticalDashConfig,
  WidgetConfig,
  WidgetType,
  DateRange,
  KPIBlock,
  TrendPoint,
  TrendSeries,
  FunnelStage,
  OutreachFunnel,
  HeatmapCell,
  HeatmapData,
  PersonaPerformance,
  IntelligenceSignal,
  DiscoveryStats,
  IndustryBreakdown,
  SizeBreakdown,
  RegionBreakdown,
  SignalBreakdown,
  OutreachStats,
  ChannelBreakdown,
  DayBreakdown,
  TimeBreakdown,
  AutonomousMetrics,
  ActionTypeBreakdown,
  DashboardWidget,
  DashboardState,
  DashboardAPIResponse,
} from './types';

// Constants
export { VERTICAL_CONFIGS } from './types';

// Fetchers
export {
  getVerticalConfig,
  getAllVerticals,
  isValidVertical,
  fetchDiscoveryStats,
  fetchOutreachStats,
  fetchPersonaPerformance,
  fetchIntelligenceSignals,
  fetchAutonomousMetrics,
  fetchFunnelData,
  fetchKPIs,
  fetchHeatmapData,
  fetchTrendData,
  fetchFullDashboard,
} from './fetchers';

export type { FullDashboardData } from './fetchers';

// Transformers
export {
  convertOSMetricsToWidgets,
  buildFunnel,
  buildCustomFunnel,
  buildPersonaRanking,
  buildHeatmap,
  buildTimeOfDayHeatmap,
  buildTrendLine,
  buildMultipleTrendLines,
  aggregateTrendByPeriod,
  transformSignals,
  wrapInWidget,
} from './transformers';

export type {
  OSMetricsResponse,
  FunnelInput,
  PersonaInput,
  HeatmapInput,
  TrendInput,
  RawSignal,
} from './transformers';

// Hooks
export {
  useDashboard,
  useVerticalConfig,
  useDashboardRefresh,
  useDashboardErrorHandling,
  useKPIs,
  useFunnel,
  usePersonas,
  useHeatmap,
  useTrends,
  useSignals,
  useDiscovery,
  useOutreach,
  useAutonomous,
} from './hooks';

export type {
  UseDashboardOptions,
  UseDashboardReturn,
  UseVerticalConfigReturn,
  UseDashboardRefreshReturn,
  DashboardError,
  UseDashboardErrorHandlingReturn,
} from './hooks';
