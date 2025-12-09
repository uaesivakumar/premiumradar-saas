/**
 * Score Engine - Sprint S140
 *
 * CRITICAL ARCHITECTURE CONSTRAINT:
 * QTLE visualization must EXACTLY match reasoning chain.
 *
 * This engine computes and explains QTLE (Quality, Timing, Likelihood, Engagement) scores.
 * All calculations are bound to:
 * - Score Engine
 * - Evidence Engine
 * - Pack rules
 * - SalesContext reasoning
 *
 * The engine ensures score consistency across all SIVA surfaces.
 */

import type { Vertical, SubVertical } from './context/types';
import { SignalEngine, SignalInstance, createSignalEngine } from './signal-engine';

// =============================================================================
// Types
// =============================================================================

export interface QTLEScore {
  quality: number;       // 0-100: Data quality and completeness
  timing: number;        // 0-100: Signal freshness and timing relevance
  likelihood: number;    // 0-100: Probability of conversion
  engagement: number;    // 0-100: Engagement potential
  composite: number;     // 0-100: Weighted composite score
}

export interface QTLEBreakdown {
  score: QTLEScore;
  factors: ScoreFactor[];
  evidence: ScoreEvidence[];
  reasoning: string;
  confidence: number;
  lastUpdated: Date;
}

export interface ScoreFactor {
  id: string;
  name: string;
  dimension: 'quality' | 'timing' | 'likelihood' | 'engagement';
  contribution: number;  // -100 to +100
  weight: number;        // 0-1
  description: string;
  source: string;
}

export interface ScoreEvidence {
  id: string;
  type: 'signal' | 'enrichment' | 'behavior' | 'historical';
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  strength: number;      // 0-100
  timestamp: Date;
  relatedFactors: string[];
}

export interface ScoringConfig {
  weights: {
    quality: number;
    timing: number;
    likelihood: number;
    engagement: number;
  };
  thresholds: {
    hot: number;         // Score >= hot is "Hot" lead
    warm: number;        // Score >= warm is "Warm" lead
    cold: number;        // Score < cold is "Cold" lead
  };
  factors: FactorDefinition[];
}

export interface FactorDefinition {
  id: string;
  name: string;
  dimension: ScoreFactor['dimension'];
  baseWeight: number;
  verticalMultiplier: Record<Vertical, number>;
  subVerticalMultiplier?: Record<SubVertical, number>;
}

// =============================================================================
// Default Scoring Configuration
// =============================================================================

const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  weights: {
    quality: 0.25,
    timing: 0.30,
    likelihood: 0.25,
    engagement: 0.20,
  },
  thresholds: {
    hot: 80,
    warm: 50,
    cold: 30,
  },
  factors: [
    {
      id: 'data_completeness',
      name: 'Data Completeness',
      dimension: 'quality',
      baseWeight: 0.4,
      verticalMultiplier: {
        'banking': 1.2,
        'insurance': 1.1,
        'real-estate': 1.0,
        'recruitment': 0.9,
        'saas-sales': 1.0,
      },
    },
    {
      id: 'source_reliability',
      name: 'Source Reliability',
      dimension: 'quality',
      baseWeight: 0.3,
      verticalMultiplier: {
        'banking': 1.3,
        'insurance': 1.2,
        'real-estate': 1.0,
        'recruitment': 1.0,
        'saas-sales': 1.1,
      },
    },
    {
      id: 'enrichment_depth',
      name: 'Enrichment Depth',
      dimension: 'quality',
      baseWeight: 0.3,
      verticalMultiplier: {
        'banking': 1.1,
        'insurance': 1.0,
        'real-estate': 0.9,
        'recruitment': 1.2,
        'saas-sales': 1.1,
      },
    },
    {
      id: 'signal_recency',
      name: 'Signal Recency',
      dimension: 'timing',
      baseWeight: 0.5,
      verticalMultiplier: {
        'banking': 1.0,
        'insurance': 0.9,
        'real-estate': 1.1,
        'recruitment': 1.3,
        'saas-sales': 1.0,
      },
    },
    {
      id: 'actionable_window',
      name: 'Actionable Window',
      dimension: 'timing',
      baseWeight: 0.3,
      verticalMultiplier: {
        'banking': 1.0,
        'insurance': 1.0,
        'real-estate': 1.2,
        'recruitment': 1.4,
        'saas-sales': 1.0,
      },
    },
    {
      id: 'market_timing',
      name: 'Market Timing',
      dimension: 'timing',
      baseWeight: 0.2,
      verticalMultiplier: {
        'banking': 1.1,
        'insurance': 0.9,
        'real-estate': 1.3,
        'recruitment': 0.8,
        'saas-sales': 1.0,
      },
    },
    {
      id: 'intent_signals',
      name: 'Intent Signals',
      dimension: 'likelihood',
      baseWeight: 0.4,
      verticalMultiplier: {
        'banking': 1.2,
        'insurance': 1.0,
        'real-estate': 1.1,
        'recruitment': 1.3,
        'saas-sales': 1.4,
      },
    },
    {
      id: 'historical_conversion',
      name: 'Historical Conversion',
      dimension: 'likelihood',
      baseWeight: 0.3,
      verticalMultiplier: {
        'banking': 1.3,
        'insurance': 1.2,
        'real-estate': 1.0,
        'recruitment': 0.9,
        'saas-sales': 1.1,
      },
    },
    {
      id: 'fit_score',
      name: 'ICP Fit Score',
      dimension: 'likelihood',
      baseWeight: 0.3,
      verticalMultiplier: {
        'banking': 1.1,
        'insurance': 1.0,
        'real-estate': 1.0,
        'recruitment': 1.1,
        'saas-sales': 1.2,
      },
    },
    {
      id: 'engagement_history',
      name: 'Engagement History',
      dimension: 'engagement',
      baseWeight: 0.4,
      verticalMultiplier: {
        'banking': 1.0,
        'insurance': 1.1,
        'real-estate': 1.2,
        'recruitment': 0.9,
        'saas-sales': 1.3,
      },
    },
    {
      id: 'responsiveness',
      name: 'Responsiveness',
      dimension: 'engagement',
      baseWeight: 0.3,
      verticalMultiplier: {
        'banking': 1.0,
        'insurance': 1.0,
        'real-estate': 1.1,
        'recruitment': 1.2,
        'saas-sales': 1.0,
      },
    },
    {
      id: 'relationship_strength',
      name: 'Relationship Strength',
      dimension: 'engagement',
      baseWeight: 0.3,
      verticalMultiplier: {
        'banking': 1.3,
        'insurance': 1.2,
        'real-estate': 1.1,
        'recruitment': 0.8,
        'saas-sales': 0.9,
      },
    },
  ],
};

// =============================================================================
// Score Engine Class
// =============================================================================

export class ScoreEngine {
  private config: ScoringConfig;
  private signalEngine: SignalEngine;
  private vertical: Vertical;
  private subVertical: SubVertical;

  constructor(vertical: Vertical, subVertical: SubVertical, config?: Partial<ScoringConfig>) {
    this.vertical = vertical;
    this.subVertical = subVertical;
    this.config = { ...DEFAULT_SCORING_CONFIG, ...config };
    this.signalEngine = createSignalEngine(vertical, subVertical);
  }

  /**
   * Calculate QTLE score for an entity
   */
  calculateScore(entityData: EntityScoreInput): QTLEBreakdown {
    const factors = this.calculateFactors(entityData);
    const score = this.computeQTLEFromFactors(factors);
    const evidence = this.collectEvidence(entityData, factors);
    const reasoning = this.generateReasoning(score, factors, evidence);

    return {
      score,
      factors,
      evidence,
      reasoning,
      confidence: this.calculateConfidence(factors, evidence),
      lastUpdated: new Date(),
    };
  }

  /**
   * Calculate individual scoring factors
   */
  private calculateFactors(entityData: EntityScoreInput): ScoreFactor[] {
    const factors: ScoreFactor[] = [];

    for (const factorDef of this.config.factors) {
      const verticalMultiplier = factorDef.verticalMultiplier[this.vertical] || 1;
      const subVerticalMultiplier = factorDef.subVerticalMultiplier?.[this.subVertical] || 1;
      const weight = factorDef.baseWeight * verticalMultiplier * subVerticalMultiplier;

      const { contribution, description, source } = this.evaluateFactor(factorDef, entityData);

      factors.push({
        id: factorDef.id,
        name: factorDef.name,
        dimension: factorDef.dimension,
        contribution,
        weight,
        description,
        source,
      });
    }

    return factors;
  }

  /**
   * Evaluate a specific factor
   */
  private evaluateFactor(
    factorDef: FactorDefinition,
    entityData: EntityScoreInput
  ): { contribution: number; description: string; source: string } {
    switch (factorDef.id) {
      case 'data_completeness':
        return this.evaluateDataCompleteness(entityData);

      case 'source_reliability':
        return this.evaluateSourceReliability(entityData);

      case 'enrichment_depth':
        return this.evaluateEnrichmentDepth(entityData);

      case 'signal_recency':
        return this.evaluateSignalRecency(entityData);

      case 'actionable_window':
        return this.evaluateActionableWindow(entityData);

      case 'market_timing':
        return this.evaluateMarketTiming(entityData);

      case 'intent_signals':
        return this.evaluateIntentSignals(entityData);

      case 'historical_conversion':
        return this.evaluateHistoricalConversion(entityData);

      case 'fit_score':
        return this.evaluateFitScore(entityData);

      case 'engagement_history':
        return this.evaluateEngagementHistory(entityData);

      case 'responsiveness':
        return this.evaluateResponsiveness(entityData);

      case 'relationship_strength':
        return this.evaluateRelationshipStrength(entityData);

      default:
        return { contribution: 50, description: 'Default evaluation', source: 'system' };
    }
  }

  // =============================================================================
  // Factor Evaluation Methods
  // =============================================================================

  private evaluateDataCompleteness(data: EntityScoreInput): { contribution: number; description: string; source: string } {
    const fields = [
      data.companyName,
      data.industry,
      data.size,
      data.location,
      data.contacts?.length,
      data.enrichmentData,
    ];
    const filledFields = fields.filter(Boolean).length;
    const completeness = (filledFields / fields.length) * 100;

    return {
      contribution: completeness,
      description: `${filledFields}/${fields.length} key data fields populated`,
      source: 'data_analysis',
    };
  }

  private evaluateSourceReliability(data: EntityScoreInput): { contribution: number; description: string; source: string } {
    const reliableSources = ['linkedin', 'company_website', 'news', 'filings'];
    const sourcesPresent = data.sources?.filter(s => reliableSources.includes(s)) || [];
    const reliability = Math.min(100, (sourcesPresent.length / 2) * 100);

    return {
      contribution: reliability,
      description: `${sourcesPresent.length} verified sources`,
      source: 'source_verification',
    };
  }

  private evaluateEnrichmentDepth(data: EntityScoreInput): { contribution: number; description: string; source: string } {
    const enrichmentFields = data.enrichmentData ? Object.keys(data.enrichmentData).length : 0;
    const depth = Math.min(100, enrichmentFields * 10);

    return {
      contribution: depth,
      description: `${enrichmentFields} enrichment data points`,
      source: 'enrichment_service',
    };
  }

  private evaluateSignalRecency(data: EntityScoreInput): { contribution: number; description: string; source: string } {
    if (!data.signals || data.signals.length === 0) {
      return { contribution: 20, description: 'No recent signals', source: 'signal_engine' };
    }

    const mostRecent = data.signals.reduce((latest, signal) => {
      const signalDate = new Date(signal.detectedAt);
      return signalDate > latest ? signalDate : latest;
    }, new Date(0));

    const daysSince = (Date.now() - mostRecent.getTime()) / (1000 * 60 * 60 * 24);

    let recency: number;
    if (daysSince <= 7) recency = 100;
    else if (daysSince <= 14) recency = 85;
    else if (daysSince <= 30) recency = 70;
    else if (daysSince <= 60) recency = 50;
    else recency = 30;

    return {
      contribution: recency,
      description: `Most recent signal: ${Math.round(daysSince)} days ago`,
      source: 'signal_engine',
    };
  }

  private evaluateActionableWindow(data: EntityScoreInput): { contribution: number; description: string; source: string } {
    if (!data.signals || data.signals.length === 0) {
      return { contribution: 50, description: 'No signals to evaluate', source: 'signal_engine' };
    }

    // Calculate average actionable window remaining
    const activeSignals = data.signals.filter(s => new Date(s.expiresAt) > new Date());
    const avgDaysRemaining = activeSignals.reduce((sum, signal) => {
      const daysRemaining = (new Date(signal.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return sum + Math.max(0, daysRemaining);
    }, 0) / Math.max(1, activeSignals.length);

    const windowScore = Math.min(100, avgDaysRemaining * 3);

    return {
      contribution: windowScore,
      description: `${activeSignals.length} active signals, avg ${Math.round(avgDaysRemaining)} days remaining`,
      source: 'signal_engine',
    };
  }

  private evaluateMarketTiming(data: EntityScoreInput): { contribution: number; description: string; source: string } {
    // This would typically use market data - simplified for now
    const quarter = Math.ceil((new Date().getMonth() + 1) / 3);
    const isQ1 = quarter === 1; // Q1 typically high activity

    const baseScore = isQ1 ? 80 : 60;
    const marketBonus = data.marketConditions?.favorable ? 20 : 0;

    return {
      contribution: Math.min(100, baseScore + marketBonus),
      description: `Q${quarter} market conditions`,
      source: 'market_analysis',
    };
  }

  private evaluateIntentSignals(data: EntityScoreInput): { contribution: number; description: string; source: string } {
    if (!data.signals || data.signals.length === 0) {
      return { contribution: 30, description: 'No intent signals detected', source: 'signal_engine' };
    }

    // Weight signals by Pack priority
    const totalWeight = data.signals.reduce((sum, signal) => {
      return sum + this.signalEngine.getPriorityWeight(signal.type);
    }, 0);

    const avgWeight = totalWeight / data.signals.length;
    const intentScore = Math.min(100, avgWeight * 100);

    return {
      contribution: intentScore,
      description: `${data.signals.length} signals, avg importance: ${(avgWeight * 100).toFixed(0)}%`,
      source: 'signal_engine',
    };
  }

  private evaluateHistoricalConversion(data: EntityScoreInput): { contribution: number; description: string; source: string } {
    // Use industry/size benchmarks if no historical data
    const industryConversionRates: Record<string, number> = {
      'technology': 15,
      'finance': 12,
      'healthcare': 10,
      'retail': 8,
      'manufacturing': 9,
    };

    const industryRate = industryConversionRates[data.industry?.toLowerCase() || ''] || 10;
    const sizeMultiplier = data.size === 'enterprise' ? 1.2 : data.size === 'smb' ? 0.8 : 1.0;

    const historicalScore = Math.min(100, industryRate * sizeMultiplier * 5);

    return {
      contribution: historicalScore,
      description: `Industry benchmark: ${industryRate}% conversion rate`,
      source: 'historical_data',
    };
  }

  private evaluateFitScore(data: EntityScoreInput): { contribution: number; description: string; source: string } {
    let fitScore = 50; // Base score
    let reasons: string[] = [];

    // Industry fit
    const targetIndustries = this.getTargetIndustries();
    if (data.industry && targetIndustries.includes(data.industry.toLowerCase())) {
      fitScore += 20;
      reasons.push('target industry');
    }

    // Size fit
    const targetSizes = this.getTargetSizes();
    if (data.size && targetSizes.includes(data.size)) {
      fitScore += 15;
      reasons.push('target size');
    }

    // Location fit
    if (data.location && ['UAE', 'Dubai', 'Abu Dhabi'].some(l => data.location?.includes(l))) {
      fitScore += 15;
      reasons.push('target location');
    }

    return {
      contribution: Math.min(100, fitScore),
      description: reasons.length > 0 ? `Matches: ${reasons.join(', ')}` : 'Partial ICP fit',
      source: 'icp_analysis',
    };
  }

  private evaluateEngagementHistory(data: EntityScoreInput): { contribution: number; description: string; source: string } {
    const interactions = data.engagementHistory?.interactions || 0;
    const emailOpens = data.engagementHistory?.emailOpens || 0;
    const meetings = data.engagementHistory?.meetings || 0;

    const engagementScore = Math.min(100,
      interactions * 5 +
      emailOpens * 10 +
      meetings * 25
    );

    return {
      contribution: engagementScore,
      description: `${interactions} interactions, ${emailOpens} email opens, ${meetings} meetings`,
      source: 'crm_data',
    };
  }

  private evaluateResponsiveness(data: EntityScoreInput): { contribution: number; description: string; source: string } {
    const avgResponseTime = data.engagementHistory?.avgResponseTime || 72; // hours
    let responsivenessScore: number;

    if (avgResponseTime <= 4) responsivenessScore = 100;
    else if (avgResponseTime <= 12) responsivenessScore = 85;
    else if (avgResponseTime <= 24) responsivenessScore = 70;
    else if (avgResponseTime <= 48) responsivenessScore = 55;
    else responsivenessScore = 40;

    return {
      contribution: responsivenessScore,
      description: `Avg response time: ${avgResponseTime}h`,
      source: 'engagement_analysis',
    };
  }

  private evaluateRelationshipStrength(data: EntityScoreInput): { contribution: number; description: string; source: string } {
    const existingRelationship = data.existingRelationship;
    const referralSource = data.referralSource;

    let strength = 40; // Base score
    if (existingRelationship) strength += 30;
    if (referralSource) strength += 20;

    return {
      contribution: Math.min(100, strength),
      description: existingRelationship ? 'Existing relationship' : 'New prospect',
      source: 'relationship_data',
    };
  }

  // =============================================================================
  // Score Computation
  // =============================================================================

  private computeQTLEFromFactors(factors: ScoreFactor[]): QTLEScore {
    const dimensionScores: Record<ScoreFactor['dimension'], { total: number; weight: number }> = {
      quality: { total: 0, weight: 0 },
      timing: { total: 0, weight: 0 },
      likelihood: { total: 0, weight: 0 },
      engagement: { total: 0, weight: 0 },
    };

    // Aggregate by dimension
    for (const factor of factors) {
      dimensionScores[factor.dimension].total += factor.contribution * factor.weight;
      dimensionScores[factor.dimension].weight += factor.weight;
    }

    // Calculate dimension scores
    const quality = dimensionScores.quality.weight > 0
      ? dimensionScores.quality.total / dimensionScores.quality.weight
      : 50;
    const timing = dimensionScores.timing.weight > 0
      ? dimensionScores.timing.total / dimensionScores.timing.weight
      : 50;
    const likelihood = dimensionScores.likelihood.weight > 0
      ? dimensionScores.likelihood.total / dimensionScores.likelihood.weight
      : 50;
    const engagement = dimensionScores.engagement.weight > 0
      ? dimensionScores.engagement.total / dimensionScores.engagement.weight
      : 50;

    // Compute weighted composite
    const composite = (
      quality * this.config.weights.quality +
      timing * this.config.weights.timing +
      likelihood * this.config.weights.likelihood +
      engagement * this.config.weights.engagement
    );

    return {
      quality: Math.round(quality),
      timing: Math.round(timing),
      likelihood: Math.round(likelihood),
      engagement: Math.round(engagement),
      composite: Math.round(composite),
    };
  }

  // =============================================================================
  // Evidence Collection
  // =============================================================================

  private collectEvidence(entityData: EntityScoreInput, factors: ScoreFactor[]): ScoreEvidence[] {
    const evidence: ScoreEvidence[] = [];

    // Signal-based evidence
    if (entityData.signals) {
      for (const signal of entityData.signals.slice(0, 5)) { // Top 5 signals
        evidence.push({
          id: `signal-${signal.id}`,
          type: 'signal',
          description: `${signal.type}: ${signal.title}`,
          impact: signal.confidence > 0.7 ? 'positive' : signal.confidence > 0.4 ? 'neutral' : 'negative',
          strength: signal.confidence * 100,
          timestamp: new Date(signal.detectedAt),
          relatedFactors: ['signal_recency', 'intent_signals'],
        });
      }
    }

    // Enrichment-based evidence
    if (entityData.enrichmentData) {
      evidence.push({
        id: 'enrichment-data',
        type: 'enrichment',
        description: `${Object.keys(entityData.enrichmentData).length} enrichment data points available`,
        impact: 'positive',
        strength: Math.min(100, Object.keys(entityData.enrichmentData).length * 10),
        timestamp: new Date(),
        relatedFactors: ['enrichment_depth', 'data_completeness'],
      });
    }

    // Behavior-based evidence
    if (entityData.engagementHistory) {
      const { meetings = 0, emailOpens = 0 } = entityData.engagementHistory;
      if (meetings > 0 || emailOpens > 0) {
        evidence.push({
          id: 'engagement-evidence',
          type: 'behavior',
          description: `${meetings} meetings, ${emailOpens} email engagements recorded`,
          impact: meetings > 0 ? 'positive' : 'neutral',
          strength: Math.min(100, meetings * 25 + emailOpens * 10),
          timestamp: new Date(),
          relatedFactors: ['engagement_history', 'responsiveness'],
        });
      }
    }

    return evidence;
  }

  // =============================================================================
  // Reasoning Generation
  // =============================================================================

  private generateReasoning(score: QTLEScore, factors: ScoreFactor[], evidence: ScoreEvidence[]): string {
    const parts: string[] = [];

    // Overall assessment
    const grade = this.getScoreGrade(score.composite);
    parts.push(`This prospect is rated as **${grade}** with a composite score of ${score.composite}/100.`);

    // Strongest dimension
    const dimensions = [
      { name: 'Quality', score: score.quality },
      { name: 'Timing', score: score.timing },
      { name: 'Likelihood', score: score.likelihood },
      { name: 'Engagement', score: score.engagement },
    ].sort((a, b) => b.score - a.score);

    parts.push(`Strongest dimension: **${dimensions[0].name}** (${dimensions[0].score}/100).`);

    // Top contributing factors
    const topFactors = factors
      .filter(f => f.contribution > 70)
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 3);

    if (topFactors.length > 0) {
      parts.push(`Key strengths: ${topFactors.map(f => f.name).join(', ')}.`);
    }

    // Areas for improvement
    const weakFactors = factors
      .filter(f => f.contribution < 40)
      .sort((a, b) => a.contribution - b.contribution)
      .slice(0, 2);

    if (weakFactors.length > 0) {
      parts.push(`Areas to improve: ${weakFactors.map(f => f.name).join(', ')}.`);
    }

    // Signal summary
    const signalEvidence = evidence.filter(e => e.type === 'signal');
    if (signalEvidence.length > 0) {
      parts.push(`Based on ${signalEvidence.length} active signals.`);
    }

    return parts.join(' ');
  }

  private getScoreGrade(composite: number): string {
    if (composite >= this.config.thresholds.hot) return 'HOT';
    if (composite >= this.config.thresholds.warm) return 'WARM';
    return 'COLD';
  }

  private calculateConfidence(factors: ScoreFactor[], evidence: ScoreEvidence[]): number {
    // Confidence based on data quality and evidence strength
    const avgFactorWeight = factors.reduce((sum, f) => sum + f.weight, 0) / factors.length;
    const avgEvidenceStrength = evidence.length > 0
      ? evidence.reduce((sum, e) => sum + e.strength, 0) / evidence.length
      : 50;

    return Math.round((avgFactorWeight * 50 + avgEvidenceStrength * 0.5));
  }

  // =============================================================================
  // Helper Methods
  // =============================================================================

  private getTargetIndustries(): string[] {
    const industryMap: Record<Vertical, string[]> = {
      'banking': ['technology', 'finance', 'healthcare', 'retail', 'manufacturing', 'energy'],
      'insurance': ['technology', 'finance', 'healthcare', 'retail', 'manufacturing'],
      'real-estate': ['technology', 'finance', 'professional_services'],
      'recruitment': ['technology', 'finance', 'healthcare', 'retail'],
      'saas-sales': ['technology', 'finance', 'healthcare', 'professional_services'],
    };
    return industryMap[this.vertical] || [];
  }

  private getTargetSizes(): string[] {
    const sizeMap: Record<SubVertical, string[]> = {
      'employee-banking': ['smb', 'mid-market', 'enterprise'],
      'corporate-banking': ['mid-market', 'enterprise', 'large-enterprise'],
      'sme-banking': ['startup', 'smb'],
      'retail-banking': ['individual'],
      'wealth-management': ['hnwi'],
      'life-insurance': ['individual'],
      'group-insurance': ['smb', 'mid-market', 'enterprise'],
      'health-insurance': ['individual', 'smb'],
      'commercial-insurance': ['smb', 'mid-market', 'enterprise'],
      'residential-sales': ['individual', 'family'],
      'commercial-leasing': ['smb', 'mid-market', 'enterprise'],
      'property-management': ['individual', 'smb'],
      'executive-search': ['mid-market', 'enterprise'],
      'tech-recruitment': ['startup', 'smb', 'mid-market'],
      'mass-recruitment': ['mid-market', 'enterprise'],
      'enterprise-sales': ['enterprise', 'large-enterprise'],
      'mid-market-sales': ['mid-market'],
      'smb-sales': ['startup', 'smb'],
    };
    return sizeMap[this.subVertical] || [];
  }

  /**
   * Get scoring configuration for UI display
   */
  getConfig(): ScoringConfig {
    return this.config;
  }

  /**
   * Get thresholds for lead classification
   */
  getThresholds(): ScoringConfig['thresholds'] {
    return this.config.thresholds;
  }
}

// =============================================================================
// Input Types
// =============================================================================

export interface EntityScoreInput {
  id: string;
  companyName: string;
  industry?: string;
  size?: 'startup' | 'smb' | 'mid-market' | 'enterprise' | 'large-enterprise' | 'individual' | 'family' | 'hnwi';
  location?: string;
  contacts?: { name: string; role: string; email?: string }[];
  sources?: string[];
  signals?: SignalInstance[];
  enrichmentData?: Record<string, unknown>;
  engagementHistory?: {
    interactions: number;
    emailOpens: number;
    meetings: number;
    avgResponseTime: number; // hours
  };
  marketConditions?: {
    favorable: boolean;
  };
  existingRelationship?: boolean;
  referralSource?: string;
}

// =============================================================================
// Factory Function
// =============================================================================

export function createScoreEngine(vertical: Vertical, subVertical: SubVertical): ScoreEngine {
  return new ScoreEngine(vertical, subVertical);
}

export default ScoreEngine;
