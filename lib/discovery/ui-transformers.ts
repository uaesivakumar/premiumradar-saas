/**
 * Discovery UI Transformers
 * Sprint S55: Discovery UI
 *
 * Transform OS data into Discovery UI-ready formats.
 */

import type {
  DiscoveryListItem,
  DiscoveryScoreBreakdown,
  EvidencePanelData,
  EvidenceTableItem,
  SignalImpactPanelData,
  SignalImpactData,
  SignalImpactCategory,
  ScoreBreakdownData,
  ScoreComponentData,
  ScoreFactorData,
  ObjectGraphMiniData,
  GraphNeighborNode,
  GraphEdgeData,
  CompanyProfileCardData,
  FreshnessStatus,
  CompanySizeCategory,
  ProviderData,
  CategoryData,
  DiscoveryStatsData,
} from './types';

// =============================================================================
// DISCOVERY LIST TRANSFORMERS
// =============================================================================

export interface OSDiscoveryResponse {
  objects: Array<{
    id: string;
    objectId: string;
    company: {
      name: string;
      domain: string;
      logo?: string;
      industry: string;
      sector?: string;
      size?: string;
      location?: { city?: string; country: string; region?: string };
      description?: string;
    };
    scores: {
      total: number;
      components: Record<string, number>;
      confidence: number;
    };
    evidence: {
      count: number;
      providers: number;
      fresh: number;
      stale: number;
      lastCollected: string;
    };
    signals: {
      positive: number;
      negative: number;
      neutral: number;
      top: string[];
    };
    freshness: string;
    rank: number;
    discoveredAt: string;
    lastUpdated: string;
  }>;
  total: number;
  stats: Record<string, unknown>;
}

export function transformDiscoveryResponse(response: OSDiscoveryResponse): {
  items: DiscoveryListItem[];
  total: number;
  stats: DiscoveryStatsData;
} {
  const items: DiscoveryListItem[] = response.objects.map((obj) => ({
    id: obj.id,
    objectId: obj.objectId,
    company: {
      id: obj.objectId,
      name: obj.company.name,
      domain: obj.company.domain,
      logo: obj.company.logo,
      industry: obj.company.industry,
      sector: obj.company.sector,
      size: mapCompanySize(obj.company.size),
      location: obj.company.location || { country: 'Unknown' },
      description: obj.company.description,
    },
    score: {
      total: obj.scores.total,
      quality: obj.scores.components.quality || 0,
      timing: obj.scores.components.timing || 0,
      likelihood: obj.scores.components.likelihood || 0,
      engagement: obj.scores.components.engagement || 0,
      confidence: obj.scores.confidence,
    },
    evidence: {
      totalCount: obj.evidence.count,
      providerCount: obj.evidence.providers,
      freshCount: obj.evidence.fresh,
      staleCount: obj.evidence.stale,
      lastCollected: new Date(obj.evidence.lastCollected),
    },
    signalsSummary: {
      positive: obj.signals.positive,
      negative: obj.signals.negative,
      neutral: obj.signals.neutral,
      topSignals: obj.signals.top,
    },
    freshness: mapFreshness(obj.freshness),
    rank: obj.rank,
    discoveredAt: new Date(obj.discoveredAt),
    lastUpdated: new Date(obj.lastUpdated),
  }));

  return {
    items,
    total: response.total,
    stats: transformStats(response.stats, items),
  };
}

function mapCompanySize(size?: string): CompanySizeCategory {
  const sizeMap: Record<string, CompanySizeCategory> = {
    '1-10': 'startup',
    '11-50': 'small',
    '51-200': 'small',
    '201-500': 'medium',
    '501-1000': 'medium',
    '1001-5000': 'large',
    '5000+': 'enterprise',
    startup: 'startup',
    small: 'small',
    medium: 'medium',
    large: 'large',
    enterprise: 'enterprise',
  };
  return sizeMap[size || ''] || 'medium';
}

function mapFreshness(freshness: string): FreshnessStatus {
  const map: Record<string, FreshnessStatus> = {
    fresh: 'fresh',
    recent: 'recent',
    stale: 'stale',
    unknown: 'unknown',
  };
  return map[freshness] || 'unknown';
}

function transformStats(
  stats: Record<string, unknown>,
  items: DiscoveryListItem[]
): DiscoveryStatsData {
  // Calculate stats from items if not provided
  const total = items.length;
  const qualified = items.filter((i) => i.score.total >= 70).length;
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const newThisWeek = items.filter((i) => i.discoveredAt >= weekAgo).length;
  const avgScore = total > 0 ? items.reduce((sum, i) => sum + i.score.total, 0) / total : 0;

  // Group by industry
  const industryGroups = new Map<string, { count: number; totalScore: number }>();
  items.forEach((item) => {
    const ind = item.company.industry;
    const group = industryGroups.get(ind) || { count: 0, totalScore: 0 };
    group.count++;
    group.totalScore += item.score.total;
    industryGroups.set(ind, group);
  });

  const byIndustry = Array.from(industryGroups.entries()).map(([industry, g]) => ({
    industry,
    count: g.count,
    avgScore: g.count > 0 ? g.totalScore / g.count : 0,
  }));

  // Group by size
  const sizeGroups = new Map<CompanySizeCategory, { count: number; totalScore: number }>();
  items.forEach((item) => {
    const size = item.company.size;
    const group = sizeGroups.get(size) || { count: 0, totalScore: 0 };
    group.count++;
    group.totalScore += item.score.total;
    sizeGroups.set(size, group);
  });

  const bySize = Array.from(sizeGroups.entries()).map(([size, g]) => ({
    size,
    count: g.count,
    avgScore: g.count > 0 ? g.totalScore / g.count : 0,
  }));

  // Group by freshness
  const freshnessGroups = new Map<FreshnessStatus, number>();
  items.forEach((item) => {
    freshnessGroups.set(item.freshness, (freshnessGroups.get(item.freshness) || 0) + 1);
  });

  const byFreshness = Array.from(freshnessGroups.entries()).map(([freshness, count]) => ({
    freshness,
    count,
  }));

  // Group by score range
  const scoreRanges = [
    { range: '90-100', min: 90, max: 100 },
    { range: '80-89', min: 80, max: 89 },
    { range: '70-79', min: 70, max: 79 },
    { range: '60-69', min: 60, max: 69 },
    { range: 'Below 60', min: 0, max: 59 },
  ];

  const byScoreRange = scoreRanges.map((r) => ({
    ...r,
    count: items.filter((i) => i.score.total >= r.min && i.score.total <= r.max).length,
  }));

  return {
    total,
    qualified,
    newThisWeek,
    avgScore: Math.round(avgScore * 100) / 100,
    byIndustry,
    bySize,
    byFreshness,
    byScoreRange,
  };
}

// =============================================================================
// EVIDENCE TRANSFORMERS
// =============================================================================

export interface OSEvidenceResponse {
  objectId: string;
  evidence: Array<{
    id: string;
    type: string;
    category: string;
    provider: string;
    title: string;
    content: string;
    confidence: number;
    timestamp: string;
    source: string;
    metadata?: Record<string, unknown>;
  }>;
  providers: Array<{
    name: string;
    count: number;
    lastFetched: string;
    confidence: number;
  }>;
  lastUpdated: string;
}

export function buildEvidenceSummary(response: OSEvidenceResponse): EvidencePanelData {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Calculate freshness for each provider
  const providers: ProviderData[] = response.providers.map((p) => {
    const lastFetched = new Date(p.lastFetched);
    let freshness: FreshnessStatus = 'unknown';
    if (lastFetched >= dayAgo) freshness = 'fresh';
    else if (lastFetched >= weekAgo) freshness = 'recent';
    else freshness = 'stale';

    return {
      provider: p.name,
      count: p.count,
      freshness,
      lastFetched,
      confidence: p.confidence,
    };
  });

  // Group by category
  const categoryMap = new Map<string, { count: number; totalConfidence: number }>();
  response.evidence.forEach((e) => {
    const cat = categoryMap.get(e.category) || { count: 0, totalConfidence: 0 };
    cat.count++;
    cat.totalConfidence += e.confidence;
    categoryMap.set(e.category, cat);
  });

  const categories: CategoryData[] = Array.from(categoryMap.entries()).map(([category, c]) => ({
    category,
    count: c.count,
    avgConfidence: c.count > 0 ? c.totalConfidence / c.count : 0,
  }));

  // Build timeline (group by day)
  const timelineMap = new Map<string, { count: number; providers: Set<string> }>();
  response.evidence.forEach((e) => {
    const dateKey = new Date(e.timestamp).toISOString().split('T')[0];
    const entry = timelineMap.get(dateKey) || { count: 0, providers: new Set() };
    entry.count++;
    entry.providers.add(e.provider);
    timelineMap.set(dateKey, entry);
  });

  const timeline = Array.from(timelineMap.entries())
    .map(([date, t]) => ({
      date: new Date(date),
      count: t.count,
      providers: Array.from(t.providers),
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  // Calculate freshness breakdown
  const fresh = response.evidence.filter((e) => new Date(e.timestamp) >= dayAgo).length;
  const recent = response.evidence.filter(
    (e) => new Date(e.timestamp) < dayAgo && new Date(e.timestamp) >= weekAgo
  ).length;
  const stale = response.evidence.filter((e) => new Date(e.timestamp) < weekAgo).length;

  // Calculate overall confidence
  const totalConfidence = response.evidence.reduce((sum, e) => sum + e.confidence, 0);
  const avgConfidence = response.evidence.length > 0 ? totalConfidence / response.evidence.length : 0;

  return {
    objectId: response.objectId,
    totalEvidence: response.evidence.length,
    providers,
    categories,
    timeline,
    freshnessBreakdown: {
      fresh,
      recent,
      stale,
      unknown: 0,
    },
    confidence: avgConfidence,
    lastUpdated: new Date(response.lastUpdated),
  };
}

// =============================================================================
// SIGNAL TRANSFORMERS
// =============================================================================

export interface OSSignalResponse {
  objectId: string;
  signals: Array<{
    id: string;
    type: string;
    category: string;
    name: string;
    description: string;
    impact: string;
    weight: number;
    scoreContribution: number;
    confidence: number;
    source: string;
    timestamp: string;
  }>;
}

export function buildSignalList(response: OSSignalResponse): SignalImpactPanelData {
  const signals: SignalImpactData[] = response.signals.map((s) => ({
    id: s.id,
    type: s.type,
    category: mapSignalCategory(s.category),
    name: s.name,
    description: s.description,
    impact: mapImpact(s.impact),
    weight: s.weight,
    scoreContribution: s.scoreContribution,
    confidence: s.confidence,
    source: s.source,
    timestamp: new Date(s.timestamp),
  }));

  const positive = signals.filter((s) => s.impact === 'positive');
  const negative = signals.filter((s) => s.impact === 'negative');

  const totalPositive = positive.reduce((sum, s) => sum + s.scoreContribution, 0);
  const totalNegative = negative.reduce((sum, s) => sum + Math.abs(s.scoreContribution), 0);

  // Group by category
  const byCategory: Record<SignalImpactCategory, SignalImpactData[]> = {
    industry: [],
    intent: [],
    financial: [],
    growth: [],
    timing: [],
    engagement: [],
    risk: [],
  };

  signals.forEach((s) => {
    byCategory[s.category].push(s);
  });

  return {
    objectId: response.objectId,
    signals,
    totalPositive,
    totalNegative,
    netImpact: totalPositive - totalNegative,
    topPositive: positive.sort((a, b) => b.scoreContribution - a.scoreContribution).slice(0, 5),
    topNegative: negative.sort((a, b) => a.scoreContribution - b.scoreContribution).slice(0, 5),
    byCategory,
  };
}

function mapSignalCategory(category: string): SignalImpactCategory {
  const map: Record<string, SignalImpactCategory> = {
    industry: 'industry',
    intent: 'intent',
    financial: 'financial',
    growth: 'growth',
    timing: 'timing',
    engagement: 'engagement',
    risk: 'risk',
  };
  return map[category] || 'industry';
}

function mapImpact(impact: string): 'positive' | 'negative' | 'neutral' {
  if (impact === 'positive' || impact === 'negative' || impact === 'neutral') {
    return impact;
  }
  return 'neutral';
}

// =============================================================================
// GRAPH TRANSFORMERS
// =============================================================================

export interface OSGraphResponse {
  objectId: string;
  objectType: string;
  label: string;
  neighbors: Array<{
    id: string;
    type: string;
    label: string;
    relationship: string;
    strength: number;
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: string;
    weight: number;
    label?: string;
  }>;
  metadata: Record<string, unknown>;
}

export function buildGraphMini(response: OSGraphResponse): ObjectGraphMiniData {
  return {
    objectId: response.objectId,
    objectType: response.objectType,
    label: response.label,
    neighbors: response.neighbors.map((n) => ({
      id: n.id,
      type: n.type,
      label: n.label,
      relationship: n.relationship,
      strength: n.strength,
    })),
    edges: response.edges.map((e) => ({
      source: e.source,
      target: e.target,
      type: e.type,
      weight: e.weight,
      label: e.label,
    })),
    metadata: response.metadata,
  };
}

// =============================================================================
// SCORE TRANSFORMERS
// =============================================================================

export interface OSScoreResponse {
  objectId: string;
  totalScore: number;
  components: Array<{
    id: string;
    name: string;
    value: number;
    weight: number;
    description: string;
  }>;
  weights: {
    quality: number;
    timing: number;
    likelihood: number;
    engagement: number;
  };
  explanation: string;
  factors: Array<{
    factor: string;
    impact: string;
    magnitude: number;
    description: string;
  }>;
  confidence: number;
  calculatedAt: string;
}

const SCORE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export function buildScoreBreakdown(response: OSScoreResponse): ScoreBreakdownData {
  const components: ScoreComponentData[] = response.components.map((c, i) => ({
    id: c.id,
    name: c.name,
    value: c.value,
    weight: c.weight,
    contribution: c.value * c.weight,
    description: c.description,
    color: SCORE_COLORS[i % SCORE_COLORS.length],
  }));

  const factors: ScoreFactorData[] = response.factors.map((f) => ({
    factor: f.factor,
    impact: mapImpact(f.impact),
    magnitude: f.magnitude,
    description: f.description,
  }));

  return {
    objectId: response.objectId,
    totalScore: response.totalScore,
    components,
    weights: response.weights,
    explanation: response.explanation,
    factors,
    confidence: response.confidence,
    calculatedAt: new Date(response.calculatedAt),
  };
}

// =============================================================================
// COMPANY PROFILE TRANSFORMERS
// =============================================================================

export interface OSProfileResponse {
  objectId: string;
  company: {
    id: string;
    name: string;
    domain: string;
    logo?: string;
    industry: string;
    sector?: string;
    size?: string;
    location?: { city?: string; country: string; region?: string };
    description?: string;
  };
  profile: {
    summary: string;
    founded?: number;
    employees?: number;
    revenue?: string;
    funding?: string;
    website: string;
    linkedin?: string;
    twitter?: string;
    technologies?: string[];
    keywords?: string[];
  };
  intelligence: {
    score: {
      total: number;
      components: Record<string, number>;
      confidence: number;
    };
    topSignals: Array<{
      id: string;
      type: string;
      category: string;
      name: string;
      description: string;
      impact: string;
      weight: number;
      scoreContribution: number;
      confidence: number;
      source: string;
      timestamp: string;
    }>;
    topEvidence: Array<{
      id: string;
      type: string;
      category: string;
      provider: string;
      title: string;
      content: string;
      confidence: number;
      timestamp: string;
      source: string;
    }>;
    recentActivity: Array<{
      id: string;
      type: string;
      title: string;
      timestamp: string;
      source: string;
    }>;
    recommendations: string[];
  };
  verticalContext: {
    vertical: string;
    subVertical?: string;
    relevanceScore: number;
    applicableSignals: string[];
    verticalInsights: string[];
  };
  osState: {
    state: string;
    lastProcessed: string;
    processingQueue: string[];
    enrichmentStatus: Record<string, string>;
  };
}

export function buildCompanyProfileCard(response: OSProfileResponse): CompanyProfileCardData {
  return {
    objectId: response.objectId,
    company: {
      id: response.company.id,
      name: response.company.name,
      domain: response.company.domain,
      logo: response.company.logo,
      industry: response.company.industry,
      sector: response.company.sector,
      size: mapCompanySize(response.company.size),
      location: response.company.location || { country: 'Unknown' },
      description: response.company.description,
    },
    profile: {
      summary: response.profile.summary,
      founded: response.profile.founded,
      employees: response.profile.employees,
      revenue: response.profile.revenue,
      funding: response.profile.funding,
      website: response.profile.website,
      linkedin: response.profile.linkedin,
      twitter: response.profile.twitter,
      technologies: response.profile.technologies,
      keywords: response.profile.keywords,
    },
    intelligence: {
      score: {
        total: response.intelligence.score.total,
        quality: response.intelligence.score.components.quality || 0,
        timing: response.intelligence.score.components.timing || 0,
        likelihood: response.intelligence.score.components.likelihood || 0,
        engagement: response.intelligence.score.components.engagement || 0,
        confidence: response.intelligence.score.confidence,
      },
      topSignals: response.intelligence.topSignals.map((s) => ({
        id: s.id,
        type: s.type,
        category: mapSignalCategory(s.category),
        name: s.name,
        description: s.description,
        impact: mapImpact(s.impact),
        weight: s.weight,
        scoreContribution: s.scoreContribution,
        confidence: s.confidence,
        source: s.source,
        timestamp: new Date(s.timestamp),
      })),
      topEvidence: response.intelligence.topEvidence.map((e) => ({
        id: e.id,
        type: e.type,
        category: e.category,
        provider: e.provider,
        title: e.title,
        content: e.content,
        confidence: e.confidence,
        timestamp: new Date(e.timestamp),
        source: e.source,
      })),
      recentActivity: response.intelligence.recentActivity.map((a) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        timestamp: new Date(a.timestamp),
        source: a.source,
      })),
      recommendations: response.intelligence.recommendations,
    },
    verticalContext: {
      vertical: response.verticalContext.vertical as any,
      subVertical: response.verticalContext.subVertical,
      relevanceScore: response.verticalContext.relevanceScore,
      applicableSignals: response.verticalContext.applicableSignals,
      verticalInsights: response.verticalContext.verticalInsights,
    },
    osState: {
      objectId: response.objectId,
      state: response.osState.state as 'active' | 'stale' | 'archived',
      lastProcessed: new Date(response.osState.lastProcessed),
      processingQueue: response.osState.processingQueue,
      enrichmentStatus: response.osState.enrichmentStatus as Record<string, 'pending' | 'complete' | 'failed'>,
    },
  };
}
