/**
 * Intelligence Suite Transformers
 * Sprint S56-S62: PremiumRadar Intelligence Suite
 *
 * Data transformation functions for intelligence layer.
 * All transformations are DETERMINISTIC and pure functions.
 *
 * These functions convert raw OS data into UI-ready formats.
 */

import type {
  PersonaPerformanceData,
  PersonaRanking,
  JourneyPerformanceData,
  JourneyStagePerformance,
  DropoffData,
  ScoreBreakdownFullData,
  ScoreComponent,
  ScoreFactor,
  IntelligenceSignalData,
  SignalCategory,
  PatternDetection,
  PatternType,
  CorrelationMatrix,
  CorrelationCell,
  TimeSeriesMetrics,
  TimeSeriesSummary,
  CompositeIntelligenceScore,
  IntelligenceGraphData,
  GraphNode,
  GraphEdge,
  AuditEntry,
  AuditSummary,
} from './types';

// =============================================================================
// PERSONA TRANSFORMERS
// =============================================================================

export interface PersonaRankingResult {
  personas: PersonaPerformanceData[];
  topPerformers: PersonaPerformanceData[];
  bottomPerformers: PersonaPerformanceData[];
  averageMetrics: {
    responseRate: number;
    conversionRate: number;
    qualityScore: number;
  };
}

export function buildPersonaRanking(
  personas: PersonaPerformanceData[],
  sortBy: keyof PersonaPerformanceData['metrics'] = 'qualityScore'
): PersonaRankingResult {
  if (!personas.length) {
    return {
      personas: [],
      topPerformers: [],
      bottomPerformers: [],
      averageMetrics: { responseRate: 0, conversionRate: 0, qualityScore: 0 },
    };
  }

  // Sort personas by selected metric
  const sorted = [...personas].sort(
    (a, b) => b.metrics[sortBy] - a.metrics[sortBy]
  );

  // Assign rankings
  const ranked = sorted.map((persona, index) => ({
    ...persona,
    ranking: {
      ...persona.ranking,
      overall: index + 1,
      totalPersonas: personas.length,
    },
  }));

  // Calculate averages
  const avgResponseRate = personas.reduce((sum, p) => sum + p.metrics.responseRate, 0) / personas.length;
  const avgConversionRate = personas.reduce((sum, p) => sum + p.metrics.conversionRate, 0) / personas.length;
  const avgQualityScore = personas.reduce((sum, p) => sum + p.metrics.qualityScore, 0) / personas.length;

  return {
    personas: ranked,
    topPerformers: ranked.slice(0, 3),
    bottomPerformers: ranked.slice(-3).reverse(),
    averageMetrics: {
      responseRate: avgResponseRate,
      conversionRate: avgConversionRate,
      qualityScore: avgQualityScore,
    },
  };
}

// =============================================================================
// JOURNEY TRANSFORMERS
// =============================================================================

export interface JourneyDropoffMap {
  journeyId: string;
  journeyName: string;
  stages: JourneyStagePerformance[];
  dropoffs: DropoffData[];
  bottlenecks: JourneyStagePerformance[];
  healthScore: number;
  recommendations: string[];
}

export function buildJourneyDropoffMap(journey: JourneyPerformanceData): JourneyDropoffMap {
  const { stages, dropoffAnalysis } = journey;

  // Identify bottlenecks (stages with conversion < 70% or marked as bottleneck)
  const bottlenecks = stages.filter(
    (stage) => stage.bottleneck || stage.conversionRate < 0.7
  );

  // Calculate health score (0-100)
  const avgConversion = stages.reduce((sum, s) => sum + s.conversionRate, 0) / stages.length;
  const healthScore = Math.round(avgConversion * 100);

  // Generate recommendations
  const recommendations: string[] = [];

  if (bottlenecks.length > 0) {
    recommendations.push(`Focus on improving ${bottlenecks[0].stageName} stage - highest dropoff point`);
  }

  const slowestStage = [...stages].sort((a, b) => b.avgTimeInStage - a.avgTimeInStage)[0];
  if (slowestStage && slowestStage.avgTimeInStage > 24) {
    recommendations.push(`Reduce time in "${slowestStage.stageName}" stage (currently ${Math.round(slowestStage.avgTimeInStage)}h avg)`);
  }

  if (journey.metrics.dropoffRate > 0.3) {
    recommendations.push('Consider adding re-engagement touchpoints for dropped leads');
  }

  return {
    journeyId: journey.journeyId,
    journeyName: journey.journeyName,
    stages,
    dropoffs: dropoffAnalysis,
    bottlenecks,
    healthScore,
    recommendations,
  };
}

// =============================================================================
// SIGNAL TRANSFORMERS
// =============================================================================

export interface SignalWeightsResult {
  byCategory: Record<SignalCategory, {
    signals: IntelligenceSignalData[];
    totalWeight: number;
    avgConfidence: number;
    netImpact: number;
  }>;
  topPositive: IntelligenceSignalData[];
  topNegative: IntelligenceSignalData[];
  totalWeight: number;
  netImpact: number;
}

export function buildSignalWeights(signals: IntelligenceSignalData[]): SignalWeightsResult {
  const categories: SignalCategory[] = [
    'industry', 'intent', 'financial', 'growth', 'timing',
    'engagement', 'risk', 'competitive', 'technology', 'regulatory'
  ];

  const byCategory: SignalWeightsResult['byCategory'] = {} as SignalWeightsResult['byCategory'];

  // Group signals by category
  for (const category of categories) {
    const categorySignals = signals.filter((s) => s.category === category);
    const totalWeight = categorySignals.reduce((sum, s) => sum + s.weight, 0);
    const avgConfidence = categorySignals.length
      ? categorySignals.reduce((sum, s) => sum + s.confidence, 0) / categorySignals.length
      : 0;
    const netImpact = categorySignals.reduce((sum, s) => {
      const multiplier = s.impact === 'positive' ? 1 : s.impact === 'negative' ? -1 : 0;
      return sum + s.scoreContribution * multiplier;
    }, 0);

    byCategory[category] = {
      signals: categorySignals,
      totalWeight,
      avgConfidence,
      netImpact,
    };
  }

  // Get top positive and negative signals
  const positiveSignals = signals
    .filter((s) => s.impact === 'positive')
    .sort((a, b) => b.scoreContribution - a.scoreContribution);

  const negativeSignals = signals
    .filter((s) => s.impact === 'negative')
    .sort((a, b) => b.scoreContribution - a.scoreContribution);

  const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0);
  const netImpact = signals.reduce((sum, s) => {
    const multiplier = s.impact === 'positive' ? 1 : s.impact === 'negative' ? -1 : 0;
    return sum + s.scoreContribution * multiplier;
  }, 0);

  return {
    byCategory,
    topPositive: positiveSignals.slice(0, 5),
    topNegative: negativeSignals.slice(0, 5),
    totalWeight,
    netImpact,
  };
}

// =============================================================================
// PATTERN TRANSFORMERS
// =============================================================================

export interface PatternClustersResult {
  byType: Record<PatternType, PatternDetection[]>;
  highImpact: PatternDetection[];
  actionable: PatternDetection[];
  totalPatterns: number;
  avgConfidence: number;
}

export function buildPatternClusters(patterns: PatternDetection[]): PatternClustersResult {
  const patternTypes: PatternType[] = [
    'success-pattern', 'failure-pattern', 'conversion-pattern',
    'engagement-pattern', 'timing-pattern', 'segment-pattern', 'anomaly'
  ];

  const byType: PatternClustersResult['byType'] = {} as PatternClustersResult['byType'];

  for (const type of patternTypes) {
    byType[type] = patterns.filter((p) => p.patternType === type);
  }

  const highImpact = patterns.filter((p) => p.impact === 'high');
  const actionable = patterns.filter((p) => p.recommendations.length > 0);

  const avgConfidence = patterns.length
    ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
    : 0;

  return {
    byType,
    highImpact,
    actionable,
    totalPatterns: patterns.length,
    avgConfidence,
  };
}

// =============================================================================
// CORRELATION TRANSFORMERS
// =============================================================================

export interface CorrelationMatrixUI {
  matrix: CorrelationCell[][];
  dimensions: string[];
  heatmapData: { x: string; y: string; value: number }[];
  strongPositive: { x: string; y: string; correlation: number }[];
  strongNegative: { x: string; y: string; correlation: number }[];
}

export function buildCorrelationMatrix(correlation: CorrelationMatrix): CorrelationMatrixUI {
  const { dimensions, cells } = correlation;

  // Build 2D matrix
  const matrix: CorrelationCell[][] = dimensions.map((xDim) =>
    dimensions.map((yDim) => {
      const cell = cells.find((c) => c.x === xDim && c.y === yDim);
      return cell || { x: xDim, y: yDim, correlation: 0, significance: 0, sampleSize: 0 };
    })
  );

  // Convert to heatmap format
  const heatmapData = cells.map((cell) => ({
    x: cell.x,
    y: cell.y,
    value: cell.correlation,
  }));

  // Find strong correlations
  const strongPositive = cells
    .filter((c) => c.correlation > 0.7 && c.x !== c.y)
    .sort((a, b) => b.correlation - a.correlation)
    .slice(0, 10);

  const strongNegative = cells
    .filter((c) => c.correlation < -0.5 && c.x !== c.y)
    .sort((a, b) => a.correlation - b.correlation)
    .slice(0, 10);

  return {
    matrix,
    dimensions,
    heatmapData,
    strongPositive,
    strongNegative,
  };
}

// =============================================================================
// TIME SERIES TRANSFORMERS
// =============================================================================

export interface TimeSeriesChartData {
  series: {
    id: string;
    name: string;
    data: { x: number; y: number }[];
    color: string;
  }[];
  xDomain: [number, number];
  yDomain: [number, number];
  annotations: {
    x: number;
    label: string;
    type: 'anomaly' | 'milestone';
  }[];
}

const METRIC_COLORS: Record<string, string> = {
  leads: '#3b82f6',
  conversions: '#10b981',
  engagement: '#f59e0b',
  response_rate: '#8b5cf6',
  quality: '#ec4899',
};

export function buildTimeSeriesChart(metrics: TimeSeriesMetrics[]): TimeSeriesChartData {
  const series = metrics.map((metric) => ({
    id: metric.metricId,
    name: metric.metricName,
    data: metric.dataPoints.map((dp) => ({
      x: new Date(dp.timestamp).getTime(),
      y: dp.value,
    })),
    color: METRIC_COLORS[metric.metricId] || '#6b7280',
  }));

  // Calculate domains
  const allX = series.flatMap((s) => s.data.map((d) => d.x));
  const allY = series.flatMap((s) => s.data.map((d) => d.y));

  const xDomain: [number, number] = [Math.min(...allX), Math.max(...allX)];
  const yDomain: [number, number] = [0, Math.max(...allY) * 1.1]; // 10% padding

  // Build annotations from anomalies
  const annotations = metrics.flatMap((metric) =>
    metric.anomalies.map((anomaly) => ({
      x: new Date(anomaly.timestamp).getTime(),
      label: `${metric.metricName}: ${anomaly.severity}`,
      type: 'anomaly' as const,
    }))
  );

  return {
    series,
    xDomain,
    yDomain,
    annotations,
  };
}

// =============================================================================
// COMPOSITE SCORE TRANSFORMERS
// =============================================================================

export interface CompositeScoreUI {
  totalScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  components: {
    id: string;
    name: string;
    score: number;
    contribution: number;
    trend: 'up' | 'down' | 'stable';
    color: string;
  }[];
  gaugeData: { value: number; max: number; color: string };
  comparison: {
    benchmark: string;
    yourScore: number;
    benchmarkScore: number;
    status: 'above' | 'below' | 'at';
  }[];
}

const COMPONENT_COLORS: Record<string, string> = {
  persona_effectiveness: '#3b82f6',
  journey_completion: '#10b981',
  signal_quality: '#f59e0b',
  automation_rate: '#8b5cf6',
  data_freshness: '#ec4899',
};

export function buildCompositeIntelligenceScore(
  score: CompositeIntelligenceScore
): CompositeScoreUI {
  // Calculate grade
  const grade = getGrade(score.totalScore);

  // Transform components
  const components = score.components.map((comp) => ({
    id: comp.id,
    name: comp.name,
    score: comp.score,
    contribution: comp.contribution,
    trend: comp.trend,
    color: COMPONENT_COLORS[comp.id] || '#6b7280',
  }));

  // Gauge data
  const gaugeColor = getScoreColor(score.totalScore);

  // Benchmark comparison
  const comparison = score.benchmarks.map((b) => ({
    benchmark: b.name,
    yourScore: score.totalScore,
    benchmarkScore: b.value,
    status: b.comparison,
  }));

  return {
    totalScore: score.totalScore,
    grade,
    components,
    gaugeData: { value: score.totalScore, max: 100, color: gaugeColor },
    comparison,
  };
}

function getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

// =============================================================================
// GRAPH TRANSFORMERS
// =============================================================================

export interface GraphVisualizationData {
  nodes: {
    id: string;
    label: string;
    type: string;
    size: number;
    color: string;
    x?: number;
    y?: number;
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    weight: number;
    label?: string;
  }[];
  clusters: {
    id: string;
    name: string;
    nodes: string[];
    color: string;
  }[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    avgDegree: number;
    density: number;
  };
}

const NODE_COLORS: Record<string, string> = {
  company: '#3b82f6',
  signal: '#f59e0b',
  evidence: '#10b981',
  persona: '#8b5cf6',
  journey: '#ec4899',
  pattern: '#6366f1',
};

const CLUSTER_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
  '#6366f1', '#14b8a6', '#f97316', '#a855f7', '#f43f5e',
];

export function buildGraphVisualization(graph: IntelligenceGraphData): GraphVisualizationData {
  // Transform nodes
  const nodes = graph.nodes.map((node) => ({
    id: node.id,
    label: node.label,
    type: node.type,
    size: Math.max(10, Math.min(50, node.value * 5)),
    color: NODE_COLORS[node.type] || '#6b7280',
    x: node.position?.x,
    y: node.position?.y,
  }));

  // Transform edges
  const edges = graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    weight: edge.weight,
    label: edge.label,
  }));

  // Transform clusters
  const clusters = graph.clusters.map((cluster, index) => ({
    id: cluster.id,
    name: cluster.name,
    nodes: cluster.nodes,
    color: CLUSTER_COLORS[index % CLUSTER_COLORS.length],
  }));

  // Calculate stats
  const avgDegree = graph.nodes.length
    ? (graph.edges.length * 2) / graph.nodes.length
    : 0;

  return {
    nodes,
    edges,
    clusters,
    stats: {
      totalNodes: graph.metadata.totalNodes,
      totalEdges: graph.metadata.totalEdges,
      avgDegree,
      density: graph.metadata.density,
    },
  };
}

// =============================================================================
// SCORE EXPLANATION TRANSFORMERS (S61)
// =============================================================================

export interface ScoreExplanationUI {
  totalScore: number;
  scoreGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  components: {
    id: string;
    name: string;
    shortName: string;
    value: number;
    weight: number;
    contribution: number;
    color: string;
    icon: string;
  }[];
  factors: {
    positive: ScoreFactor[];
    negative: ScoreFactor[];
    neutral: ScoreFactor[];
  };
  explanation: {
    summary: string;
    naturalLanguage: string;
    keyDrivers: string[];
    keyRisks: string[];
    recommendations: string[];
  };
  history: {
    data: { date: number; score: number }[];
    trend: 'up' | 'down' | 'stable';
    change: number;
  };
}

const COMPONENT_ICONS: Record<string, string> = {
  quality: '⭐',
  timing: '⏰',
  likelihood: '📈',
  engagement: '💬',
};

export function buildScoreExplanation(score: ScoreBreakdownFullData): ScoreExplanationUI {
  const grade = getGrade(score.totalScore);

  // Transform components
  const components = score.components.map((comp) => ({
    id: comp.id,
    name: comp.name,
    shortName: comp.shortName,
    value: comp.value,
    weight: comp.weight,
    contribution: comp.contribution,
    color: comp.color,
    icon: comp.icon || COMPONENT_ICONS[comp.id] || '📊',
  }));

  // Group factors
  const positive = score.factors.filter((f) => f.impact === 'positive');
  const negative = score.factors.filter((f) => f.impact === 'negative');
  const neutral = score.factors.filter((f) => f.impact === 'neutral');

  // Transform history
  const historyData = score.history.map((h) => ({
    date: new Date(h.date).getTime(),
    score: h.score,
  }));

  const trend = score.history.length >= 2
    ? score.history[score.history.length - 1].score > score.history[0].score
      ? 'up'
      : score.history[score.history.length - 1].score < score.history[0].score
        ? 'down'
        : 'stable'
    : 'stable';

  const change = score.history.length >= 2
    ? score.history[score.history.length - 1].score - score.history[0].score
    : 0;

  return {
    totalScore: score.totalScore,
    scoreGrade: grade,
    components,
    factors: { positive, negative, neutral },
    explanation: score.explanation,
    history: {
      data: historyData,
      trend: trend as 'up' | 'down' | 'stable',
      change,
    },
  };
}

// =============================================================================
// AUDIT TRANSFORMERS (S59)
// =============================================================================

export interface AuditTimelineData {
  entries: {
    id: string;
    timestamp: Date;
    user: string;
    action: string;
    resource: string;
    details: string;
    severity: 'info' | 'warning' | 'critical';
  }[];
  groupedByDay: Record<string, AuditEntry[]>;
  stats: {
    totalToday: number;
    totalThisWeek: number;
    mostActiveUser: string;
    mostCommonAction: string;
  };
}

export function buildAuditTimeline(entries: AuditEntry[]): AuditTimelineData {
  const transformed = entries.map((entry) => ({
    id: entry.id,
    timestamp: new Date(entry.timestamp),
    user: entry.userName,
    action: entry.action,
    resource: `${entry.resourceType}/${entry.resourceId}`,
    details: entry.details.description,
    severity: getSeverity(entry.action),
  }));

  // Group by day
  const groupedByDay: Record<string, AuditEntry[]> = {};
  for (const entry of entries) {
    const day = new Date(entry.timestamp).toISOString().split('T')[0];
    if (!groupedByDay[day]) groupedByDay[day] = [];
    groupedByDay[day].push(entry);
  }

  // Calculate stats
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const totalToday = groupedByDay[today]?.length || 0;
  const totalThisWeek = entries.filter((e) => new Date(e.timestamp) >= weekAgo).length;

  // Most active user
  const userCounts: Record<string, number> = {};
  for (const entry of entries) {
    userCounts[entry.userName] = (userCounts[entry.userName] || 0) + 1;
  }
  const mostActiveUser = Object.entries(userCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Most common action
  const actionCounts: Record<string, number> = {};
  for (const entry of entries) {
    actionCounts[entry.action] = (actionCounts[entry.action] || 0) + 1;
  }
  const mostCommonAction = Object.entries(actionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  return {
    entries: transformed,
    groupedByDay,
    stats: {
      totalToday,
      totalThisWeek,
      mostActiveUser,
      mostCommonAction,
    },
  };
}

function getSeverity(action: string): 'info' | 'warning' | 'critical' {
  if (['delete', 'config_change'].includes(action)) return 'critical';
  if (['update', 'execute', 'approve', 'reject'].includes(action)) return 'warning';
  return 'info';
}
