/**
 * Intelligence Suite Types
 * Sprint S56-S62: PremiumRadar Intelligence Suite
 *
 * Type definitions for the comprehensive intelligence layer including:
 * - Intelligence Explorer (S56)
 * - Persona Effectiveness (S56)
 * - Journey Optimization (S56)
 * - Score Explanation Engine (S61)
 * - Signal Correlation (S62)
 * - Pattern Detection (S62)
 * - Autonomous Metrics (S58)
 * - Audit Layer (S59)
 * - Intelligence Graph (S60)
 *
 * ARCHITECTURE: SaaS-only, READ-ONLY from OS backend.
 * All data is fetched from UPR OS via API calls.
 */

import type { VerticalId } from '../dashboard/types';

// Re-export VerticalId for use by other modules
export type { VerticalId };

// =============================================================================
// INTELLIGENCE CORE TYPES
// =============================================================================

export type IntelligenceTimeRange = '7d' | '30d' | '90d' | 'custom';

export interface IntelligenceContext {
  vertical: VerticalId;
  subVertical?: string;
  territory?: string;
  timeRange: IntelligenceTimeRange;
  customRange?: {
    start: Date;
    end: Date;
  };
}

export interface IntelligenceScore {
  value: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  percentile: number;
}

// =============================================================================
// PERSONA PERFORMANCE (S56)
// =============================================================================

export interface PersonaPerformanceData {
  personaId: string;
  personaName: string;
  personaType: 'sales' | 'marketing' | 'support' | 'executive';
  avatar?: string;
  metrics: PersonaMetrics;
  trends: PersonaTrends;
  ranking: PersonaRanking;
  insights: PersonaInsight[];
  lastActive: Date;
}

export interface PersonaMetrics {
  totalOutreach: number;
  responseRate: number;
  conversionRate: number;
  avgDealSize: number;
  avgCycleTime: number;
  qualityScore: number;
  engagementScore: number;
  successRate: number;
}

export interface PersonaTrends {
  outreach: TrendData[];
  responseRate: TrendData[];
  conversion: TrendData[];
  quality: TrendData[];
}

export interface TrendData {
  date: Date;
  value: number;
}

export interface PersonaRanking {
  overall: number;
  totalPersonas: number;
  byMetric: Record<string, number>;
  movement: 'up' | 'down' | 'stable';
  movementAmount: number;
}

export interface PersonaInsight {
  id: string;
  type: 'strength' | 'weakness' | 'opportunity' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
}

// =============================================================================
// JOURNEY PERFORMANCE (S56)
// =============================================================================

export interface JourneyPerformanceData {
  journeyId: string;
  journeyName: string;
  journeyType: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  metrics: JourneyMetrics;
  stages: JourneyStagePerformance[];
  dropoffAnalysis: DropoffData[];
  optimizations: JourneyOptimization[];
  lastUpdated: Date;
}

export interface JourneyMetrics {
  totalEntered: number;
  completionRate: number;
  avgDuration: number;
  conversionRate: number;
  dropoffRate: number;
  reEngagementRate: number;
  qualityScore: number;
}

export interface JourneyStagePerformance {
  stageId: string;
  stageName: string;
  stageType: string;
  order: number;
  entered: number;
  completed: number;
  dropped: number;
  avgTimeInStage: number;
  conversionRate: number;
  bottleneck: boolean;
}

export interface DropoffData {
  fromStage: string;
  toStage: string;
  count: number;
  percentage: number;
  reasons: DropoffReason[];
}

export interface DropoffReason {
  reason: string;
  count: number;
  percentage: number;
}

export interface JourneyOptimization {
  id: string;
  type: 'timing' | 'content' | 'targeting' | 'channel' | 'sequence';
  title: string;
  description: string;
  potentialImpact: number;
  effort: 'low' | 'medium' | 'high';
  priority: number;
  affectedStages: string[];
}

// =============================================================================
// SCORE BREAKDOWN (S61)
// =============================================================================

export interface ScoreBreakdownFullData {
  objectId: string;
  totalScore: number;
  components: ScoreComponent[];
  weights: ScoreWeights;
  factors: ScoreFactor[];
  explanation: ScoreExplanation;
  history: ScoreHistory[];
  confidence: number;
  calculatedAt: Date;
}

export interface ScoreComponent {
  id: string;
  name: string;
  shortName: string;
  value: number;
  weight: number;
  contribution: number;
  description: string;
  color: string;
  icon: string;
  subComponents?: ScoreSubComponent[];
}

export interface ScoreSubComponent {
  id: string;
  name: string;
  value: number;
  weight: number;
  contribution: number;
}

export interface ScoreWeights {
  quality: number;
  timing: number;
  likelihood: number;
  engagement: number;
  custom?: Record<string, number>;
}

export interface ScoreFactor {
  id: string;
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  magnitude: number;
  description: string;
  evidence?: string;
  source?: string;
}

export interface ScoreExplanation {
  summary: string;
  keyDrivers: string[];
  keyRisks: string[];
  recommendations: string[];
  naturalLanguage: string;
}

export interface ScoreHistory {
  date: Date;
  score: number;
  change: number;
  reason?: string;
}

// =============================================================================
// SIGNAL INTELLIGENCE (S62)
// =============================================================================

export interface IntelligenceSignalData {
  id: string;
  type: string;
  category: SignalCategory;
  subcategory?: string;
  name: string;
  description: string;
  strength: 'strong' | 'moderate' | 'weak';
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
  weight: number;
  scoreContribution: number;
  source: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  related?: RelatedSignal[];
}

export type SignalCategory =
  | 'industry'
  | 'intent'
  | 'financial'
  | 'growth'
  | 'timing'
  | 'engagement'
  | 'risk'
  | 'competitive'
  | 'technology'
  | 'regulatory';

export interface RelatedSignal {
  signalId: string;
  relationship: 'correlated' | 'caused-by' | 'leads-to' | 'contradicts';
  strength: number;
}

// =============================================================================
// PATTERN DETECTION (S62)
// =============================================================================

export interface PatternDetection {
  id: string;
  patternType: PatternType;
  name: string;
  description: string;
  confidence: number;
  frequency: number;
  impact: 'high' | 'medium' | 'low';
  members: PatternMember[];
  characteristics: PatternCharacteristic[];
  recommendations: string[];
  discoveredAt: Date;
}

export type PatternType =
  | 'success-pattern'
  | 'failure-pattern'
  | 'conversion-pattern'
  | 'engagement-pattern'
  | 'timing-pattern'
  | 'segment-pattern'
  | 'anomaly';

export interface PatternMember {
  objectId: string;
  objectType: string;
  label: string;
  contribution: number;
}

export interface PatternCharacteristic {
  attribute: string;
  value: string | number;
  prevalence: number;
  significance: number;
}

// =============================================================================
// CORRELATION MATRIX (S62)
// =============================================================================

export interface CorrelationResult {
  signalA: string;
  signalB: string;
  correlation: number;
  significance: number;
  sampleSize?: number;
}

export interface CorrelationMatrix {
  id: string;
  type: 'signal' | 'evidence' | 'outcome';
  dimensions: string[];
  cells: CorrelationCell[];
  insights: CorrelationInsight[];
  generatedAt: Date;
}

export interface CorrelationCell {
  x: string;
  y: string;
  correlation: number;
  significance: number;
  sampleSize: number;
}

export interface CorrelationInsight {
  id: string;
  type: 'strong-positive' | 'strong-negative' | 'unexpected' | 'missing';
  title: string;
  description: string;
  variables: string[];
  correlation: number;
  actionable: boolean;
}

// =============================================================================
// AUTONOMOUS METRICS (S58)
// =============================================================================

export interface AutonomousIntelligence {
  status: AutonomousStatus;
  metrics: AutonomousMetricsData;
  activities: AutonomousActivity[];
  checkpoints: AutonomousCheckpoint[];
  costs: AutonomousCosts;
  performance: AutonomousPerformance;
  lastUpdated: Date;
}

export interface AutonomousStatus {
  enabled: boolean;
  mode: 'full' | 'supervised' | 'paused' | 'killed';
  killSwitch: KillSwitchState;
  healthScore: number;
}

export interface KillSwitchState {
  active: boolean;
  triggeredAt?: Date;
  triggeredBy?: string;
  reason?: string;
  canResume: boolean;
}

export interface AutonomousMetricsData {
  totalActions: number;
  successRate: number;
  avgLatency: number;
  errorRate: number;
  automationRate: number;
  costSavings: number;
  timeSaved: number;
  byActionType: ActionTypeMetric[];
}

export interface ActionTypeMetric {
  type: string;
  count: number;
  successRate: number;
  avgDuration: number;
  costPerAction: number;
}

export interface AutonomousActivity {
  id: string;
  type: string;
  action: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  result?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface AutonomousCheckpoint {
  id: string;
  type: 'approval-required' | 'threshold-exceeded' | 'anomaly-detected' | 'scheduled';
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  createdAt: Date;
  expiresAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  context: Record<string, unknown>;
}

export interface AutonomousCosts {
  totalCost: number;
  costByType: CostBreakdown[];
  tokenUsage: TokenUsage;
  projectedMonthly: number;
  budgetRemaining: number;
  budgetUtilization: number;
}

export interface CostBreakdown {
  type: string;
  cost: number;
  percentage: number;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costPerToken: number;
}

export interface AutonomousPerformance {
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  throughput: number;
  errorRateByType: Record<string, number>;
  anomalies: PerformanceAnomaly[];
}

export interface PerformanceAnomaly {
  id: string;
  type: 'latency-spike' | 'error-spike' | 'cost-spike' | 'throughput-drop';
  severity: 'critical' | 'warning' | 'info';
  detectedAt: Date;
  description: string;
  impact: string;
  resolved: boolean;
  resolvedAt?: Date;
}

// =============================================================================
// AUDIT LAYER (S59)
// =============================================================================

export interface AuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId: string;
  resourceName?: string;
  details: AuditDetails;
  metadata: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'execute'
  | 'approve'
  | 'reject'
  | 'export'
  | 'import'
  | 'login'
  | 'logout'
  | 'config_change';

export type AuditResourceType =
  | 'journey'
  | 'persona'
  | 'object'
  | 'signal'
  | 'evidence'
  | 'outreach'
  | 'autonomous'
  | 'config'
  | 'user'
  | 'workspace'
  | 'api_key';

export interface AuditDetails {
  description: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  changes?: AuditChange[];
  promptVersion?: string;
  aiModel?: string;
}

export interface AuditChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface AuditFilter {
  userId?: string;
  action?: AuditAction[];
  resourceType?: AuditResourceType[];
  resourceId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

export interface AuditSummary {
  totalEntries: number;
  byAction: Record<AuditAction, number>;
  byResourceType: Record<AuditResourceType, number>;
  byUser: { userId: string; userName: string; count: number }[];
  recentActivity: AuditEntry[];
}

// =============================================================================
// EVIDENCE CORRELATION (S56)
// =============================================================================

export interface EvidenceCorrelation {
  objectId: string;
  totalEvidence: number;
  providers: EvidenceProviderStats[];
  categories: EvidenceCategoryStats[];
  correlations: EvidenceCorrelationItem[];
  timeline: EvidenceTimelinePoint[];
  confidence: number;
  freshness: 'fresh' | 'recent' | 'stale';
}

export interface EvidenceProviderStats {
  provider: string;
  count: number;
  avgConfidence: number;
  lastFetched: Date;
  reliability: number;
}

export interface EvidenceCategoryStats {
  category: string;
  count: number;
  avgConfidence: number;
  topSources: string[];
}

export interface EvidenceCorrelationItem {
  evidenceA: string;
  evidenceB: string;
  correlation: number;
  type: 'supports' | 'contradicts' | 'related';
  description: string;
}

export interface EvidenceTimelinePoint {
  date: Date;
  count: number;
  providers: string[];
  significance: number;
}

// =============================================================================
// OUTCOME CORRELATION (S56)
// =============================================================================

export interface OutcomeCorrelation {
  outcomeType: string;
  totalSamples: number;
  correlatedFactors: CorrelatedFactor[];
  predictions: OutcomePrediction[];
  accuracy: number;
  lastUpdated: Date;
}

export interface CorrelatedFactor {
  factor: string;
  correlation: number;
  significance: number;
  direction: 'positive' | 'negative';
  sampleSize: number;
}

export interface OutcomePrediction {
  objectId: string;
  probability: number;
  confidence: number;
  keyFactors: string[];
  timeframe?: string;
}

// =============================================================================
// TIME SERIES METRICS (S56)
// =============================================================================

export interface TimeSeriesMetrics {
  metricId: string;
  metricName: string;
  timeRange: IntelligenceTimeRange;
  granularity: 'hour' | 'day' | 'week' | 'month';
  dataPoints: TimeSeriesPoint[];
  summary: TimeSeriesSummary;
  anomalies: TimeSeriesAnomaly[];
}

export interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
  predicted?: number;
  confidence?: number;
}

export interface TimeSeriesSummary {
  min: number;
  max: number;
  avg: number;
  median: number;
  stdDev: number;
  trend: 'up' | 'down' | 'stable';
  trendStrength: number;
}

export interface TimeSeriesAnomaly {
  timestamp: Date;
  value: number;
  expected: number;
  deviation: number;
  severity: 'critical' | 'warning' | 'info';
}

// =============================================================================
// COMPOSITE INTELLIGENCE SCORE (S56)
// =============================================================================

export interface CompositeIntelligenceScore {
  vertical: VerticalId;
  totalScore: number;
  components: CompositeComponent[];
  benchmarks: Benchmark[];
  recommendations: IntelligenceRecommendation[];
  calculatedAt: Date;
}

export interface CompositeComponent {
  id: string;
  name: string;
  score: number;
  weight: number;
  contribution: number;
  trend: 'up' | 'down' | 'stable';
  percentile: number;
}

export interface Benchmark {
  name: string;
  value: number;
  comparison: 'above' | 'below' | 'at';
  percentile: number;
}

export interface IntelligenceRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  priority: number;
}

// =============================================================================
// INTELLIGENCE GRAPH (S60)
// =============================================================================

export interface IntelligenceGraphData {
  id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: GraphCluster[];
  metadata: GraphMetadata;
}

export interface GraphNode {
  id: string;
  type: 'company' | 'signal' | 'evidence' | 'persona' | 'journey' | 'pattern';
  label: string;
  value: number;
  metadata: Record<string, unknown>;
  position?: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  weight: number;
  label?: string;
  metadata?: Record<string, unknown>;
}

export interface GraphCluster {
  id: string;
  name: string;
  nodes: string[];
  centroid?: { x: number; y: number };
  characteristics: string[];
}

export interface GraphMetadata {
  totalNodes: number;
  totalEdges: number;
  clusters: number;
  density: number;
  generatedAt: Date;
}

// UI-ready graph visualization structure
export interface GraphVisualization {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: GraphCluster[];
}

// =============================================================================
// WORKSPACES & PERMISSIONS (S57)
// =============================================================================

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: WorkspaceMember[];
  settings: WorkspaceSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  userId: string;
  userName: string;
  email: string;
  role: WorkspaceRole;
  joinedAt: Date;
  lastActive?: Date;
}

export type WorkspaceRole = 'owner' | 'manager' | 'analyst' | 'viewer';

export interface WorkspaceSettings {
  vertical: VerticalId;
  territory?: string;
  features: WorkspaceFeatureFlags;
  limits: WorkspaceLimits;
}

export interface WorkspaceFeatureFlags {
  discovery: boolean;
  intelligence: boolean;
  journeys: boolean;
  autonomous: boolean;
  audit: boolean;
}

export interface WorkspaceLimits {
  maxMembers: number;
  maxObjects: number;
  maxJourneys: number;
  apiCallsPerMonth: number;
}

export interface WorkspacePermission {
  resource: 'discovery' | 'intelligence' | 'journeys' | 'autonomous' | 'settings' | 'members';
  actions: ('read' | 'write' | 'delete' | 'admin')[];
}

export const ROLE_PERMISSIONS: Record<WorkspaceRole, WorkspacePermission[]> = {
  owner: [
    { resource: 'discovery', actions: ['read', 'write', 'delete', 'admin'] },
    { resource: 'intelligence', actions: ['read', 'write', 'delete', 'admin'] },
    { resource: 'journeys', actions: ['read', 'write', 'delete', 'admin'] },
    { resource: 'autonomous', actions: ['read', 'write', 'delete', 'admin'] },
    { resource: 'settings', actions: ['read', 'write', 'delete', 'admin'] },
    { resource: 'members', actions: ['read', 'write', 'delete', 'admin'] },
  ],
  manager: [
    { resource: 'discovery', actions: ['read', 'write', 'delete'] },
    { resource: 'intelligence', actions: ['read', 'write', 'delete'] },
    { resource: 'journeys', actions: ['read', 'write', 'delete'] },
    { resource: 'autonomous', actions: ['read', 'write'] },
    { resource: 'settings', actions: ['read', 'write'] },
    { resource: 'members', actions: ['read', 'write'] },
  ],
  analyst: [
    { resource: 'discovery', actions: ['read', 'write'] },
    { resource: 'intelligence', actions: ['read', 'write'] },
    { resource: 'journeys', actions: ['read', 'write'] },
    { resource: 'autonomous', actions: ['read'] },
    { resource: 'settings', actions: ['read'] },
    { resource: 'members', actions: ['read'] },
  ],
  viewer: [
    { resource: 'discovery', actions: ['read'] },
    { resource: 'intelligence', actions: ['read'] },
    { resource: 'journeys', actions: ['read'] },
    { resource: 'autonomous', actions: ['read'] },
    { resource: 'settings', actions: ['read'] },
    { resource: 'members', actions: ['read'] },
  ],
};

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface IntelligenceAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export type PersonaPerformanceAPIResponse = IntelligenceAPIResponse<PersonaPerformanceData[]>;
export type JourneyPerformanceAPIResponse = IntelligenceAPIResponse<JourneyPerformanceData[]>;
export type ScoreBreakdownAPIResponse = IntelligenceAPIResponse<ScoreBreakdownFullData>;
export type SignalIntelligenceAPIResponse = IntelligenceAPIResponse<IntelligenceSignalData[]>;
export type PatternDetectionAPIResponse = IntelligenceAPIResponse<PatternDetection[]>;
export type AutonomousIntelligenceAPIResponse = IntelligenceAPIResponse<AutonomousIntelligence>;
export type EvidenceCorrelationAPIResponse = IntelligenceAPIResponse<EvidenceCorrelation>;
export type OutcomeCorrelationAPIResponse = IntelligenceAPIResponse<OutcomeCorrelation[]>;
export type TimeSeriesAPIResponse = IntelligenceAPIResponse<TimeSeriesMetrics[]>;
export type CorrelationMatrixAPIResponse = IntelligenceAPIResponse<CorrelationMatrix>;
export type CompositeScoreAPIResponse = IntelligenceAPIResponse<CompositeIntelligenceScore>;
export type IntelligenceGraphAPIResponse = IntelligenceAPIResponse<IntelligenceGraphData>;
export type AuditAPIResponse = IntelligenceAPIResponse<{ entries: AuditEntry[]; total: number; summary: AuditSummary }>;
export type WorkspaceAPIResponse = IntelligenceAPIResponse<Workspace>;
