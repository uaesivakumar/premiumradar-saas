/**
 * Intelligence Suite
 * Sprint S56-S62: PremiumRadar Intelligence Suite
 *
 * Comprehensive intelligence layer for enterprise-ready sales enablement.
 *
 * Components:
 * - S56: Intelligence Explorer (Persona, Journey, Score, Signal, Time Series)
 * - S57: Permissions & Workspaces
 * - S58: Autonomous Safety UI
 * - S59: Audit Layer UI
 * - S60: Intelligence Graph
 * - S61: Score Explanation Engine
 * - S62: Signal Correlation & Pattern Explorer
 *
 * ARCHITECTURE:
 * - SaaS-only (this repo)
 * - READ-ONLY from UPR OS backend
 * - No autonomous actions (viewing only)
 * - Graceful degradation if OS data is partial
 * - Deterministic transforms
 * - Zero OS mutations
 */

// =============================================================================
// TYPES
// =============================================================================

export type {
  // Core types
  IntelligenceTimeRange,
  IntelligenceContext,
  IntelligenceScore,

  // Persona types (S56)
  PersonaPerformanceData,
  PersonaMetrics,
  PersonaTrends,
  TrendData,
  PersonaRanking,
  PersonaInsight,

  // Journey types (S56)
  JourneyPerformanceData,
  JourneyMetrics,
  JourneyStagePerformance,
  DropoffData,
  DropoffReason,
  JourneyOptimization,

  // Score types (S61)
  ScoreBreakdownFullData,
  ScoreComponent,
  ScoreSubComponent,
  ScoreWeights,
  ScoreFactor,
  ScoreExplanation,
  ScoreHistory,

  // Signal types (S62)
  IntelligenceSignalData,
  SignalCategory,
  RelatedSignal,

  // Pattern types (S62)
  PatternDetection,
  PatternType,
  PatternMember,
  PatternCharacteristic,

  // Correlation types (S62)
  CorrelationMatrix,
  CorrelationCell,
  CorrelationInsight,

  // Autonomous types (S58)
  AutonomousIntelligence,
  AutonomousStatus,
  KillSwitchState,
  AutonomousMetricsData,
  ActionTypeMetric,
  AutonomousActivity,
  AutonomousCheckpoint,
  AutonomousCosts,
  CostBreakdown,
  TokenUsage,
  AutonomousPerformance,
  PerformanceAnomaly,

  // Audit types (S59)
  AuditEntry,
  AuditAction,
  AuditResourceType,
  AuditDetails,
  AuditChange,
  AuditFilter,
  AuditSummary,

  // Evidence types (S56)
  EvidenceCorrelation,
  EvidenceProviderStats,
  EvidenceCategoryStats,
  EvidenceCorrelationItem,
  EvidenceTimelinePoint,

  // Outcome types (S56)
  OutcomeCorrelation,
  CorrelatedFactor,
  OutcomePrediction,

  // Time series types (S56)
  TimeSeriesMetrics,
  TimeSeriesPoint,
  TimeSeriesSummary,
  TimeSeriesAnomaly,

  // Composite score types (S56)
  CompositeIntelligenceScore,
  CompositeComponent,
  Benchmark,
  IntelligenceRecommendation,

  // Graph types (S60)
  IntelligenceGraphData,
  GraphNode,
  GraphEdge,
  GraphCluster,
  GraphMetadata,

  // Workspace types (S57)
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
  WorkspaceSettings,
  WorkspaceFeatureFlags,
  WorkspaceLimits,
  WorkspacePermission,

  // API response types
  IntelligenceAPIResponse,
  PersonaPerformanceAPIResponse,
  JourneyPerformanceAPIResponse,
  ScoreBreakdownAPIResponse,
  SignalIntelligenceAPIResponse,
  PatternDetectionAPIResponse,
  AutonomousIntelligenceAPIResponse,
  EvidenceCorrelationAPIResponse,
  OutcomeCorrelationAPIResponse,
  TimeSeriesAPIResponse,
  CorrelationMatrixAPIResponse,
  CompositeScoreAPIResponse,
  IntelligenceGraphAPIResponse,
  AuditAPIResponse,
  WorkspaceAPIResponse,
} from './types';

// Role permissions constant
export { ROLE_PERMISSIONS } from './types';

// =============================================================================
// FETCHERS
// =============================================================================

export {
  // Persona fetchers
  fetchPersonaPerformance,

  // Journey fetchers
  fetchJourneyPerformance,

  // Score fetchers
  fetchScoreBreakdown,

  // Signal fetchers
  fetchIntelligenceSignals,

  // Pattern fetchers
  fetchPatternDetections,

  // Autonomous fetchers
  fetchAutonomousMetrics,

  // Correlation fetchers
  fetchOutcomeCorrelations,
  fetchEvidenceCorrelations,
  fetchCorrelationMatrix,

  // Time series fetchers
  fetchTimeSeriesMetrics,

  // Composite score fetchers
  fetchCompositeIntelligenceScore,

  // Graph fetchers
  fetchIntelligenceGraph,

  // Audit fetchers
  fetchAuditLogs,
  fetchAuditSummary,

  // Workspace fetchers
  fetchWorkspace,
  fetchUserWorkspaces,

  // Full data fetcher
  fetchFullIntelligenceData,
  type FullIntelligenceData,
} from './fetchers';

// =============================================================================
// TRANSFORMERS
// =============================================================================

export {
  // Persona transformers
  buildPersonaRanking,
  type PersonaRankingResult,

  // Journey transformers
  buildJourneyDropoffMap,
  type JourneyDropoffMap,

  // Signal transformers
  buildSignalWeights,
  type SignalWeightsResult,

  // Pattern transformers
  buildPatternClusters,
  type PatternClustersResult,

  // Correlation transformers
  buildCorrelationMatrix,
  type CorrelationMatrixUI,

  // Time series transformers
  buildTimeSeriesChart,
  type TimeSeriesChartData,

  // Composite score transformers
  buildCompositeIntelligenceScore,
  type CompositeScoreUI,

  // Graph transformers
  buildGraphVisualization,
  type GraphVisualizationData,

  // Score explanation transformers
  buildScoreExplanation,
  type ScoreExplanationUI,

  // Audit transformers
  buildAuditTimeline,
  type AuditTimelineData,
} from './transformers';

// =============================================================================
// HOOKS
// =============================================================================

export {
  // Main intelligence hook
  useIntelligence,

  // Persona hooks
  usePersonaInsights,

  // Journey hooks
  useJourneyInsights,

  // Score hooks
  useScoreInsights,

  // Signal hooks
  useSignalCorrelations,

  // Pattern hooks
  usePatternExplorer,

  // Autonomous hooks
  useAutonomousInsights,

  // Graph hooks
  useIntelligenceGraph,

  // Time series hooks
  useTimeSeries,

  // Composite score hooks
  useCompositeScore,

  // Audit hooks
  useAuditLogs,

  // Workspace hooks
  useWorkspaces,
} from './hooks';
