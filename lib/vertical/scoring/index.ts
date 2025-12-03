/**
 * Vertical Scoring Engines - Sprint P3
 * Deep Vertical Intelligence Packs
 *
 * Scoring engines that calculate opportunity scores using vertical-specific
 * signals, weights, and boosts. Each vertical has unique scoring logic.
 */

import type { Vertical } from '../../intelligence/context/types';
import {
  getSignalsForVertical,
  getScoringConfigForVertical,
  type DeepSignal,
} from '../signals';

// =============================================================================
// TYPES
// =============================================================================

export interface SignalMatch {
  signalId: string;
  signal: DeepSignal;
  confidence: number;
  detectedAt: Date;
  sourceData?: Record<string, unknown>;
}

export interface ScoringInput {
  vertical: Vertical;
  signals: SignalMatch[];
  companyData?: CompanyContext;
  individualData?: IndividualContext;
}

export interface CompanyContext {
  name: string;
  industry?: string;
  employeeCount?: number;
  revenue?: number;
  fundingStage?: string;
  techStack?: string[];
  location?: string;
}

export interface IndividualContext {
  name: string;
  title?: string;
  company?: string;
  income?: number;
  age?: number;
  lifeStage?: string;
  location?: string;
}

export interface ScoringResult {
  vertical: Vertical;
  overallScore: number;
  grade: 'hot' | 'warm' | 'cold';
  categoryScores: Record<string, number>;
  appliedBoosts: string[];
  signalContributions: SignalContribution[];
  confidence: number;
  calculatedAt: Date;
}

export interface SignalContribution {
  signalId: string;
  signalName: string;
  weight: number;
  contribution: number;
  category: string;
}

// =============================================================================
// BASE SCORING ENGINE
// =============================================================================

export class VerticalScoringEngine {
  private vertical: Vertical;

  constructor(vertical: Vertical) {
    this.vertical = vertical;
  }

  /**
   * Calculate opportunity score based on matched signals
   */
  calculate(input: ScoringInput): ScoringResult {
    const config = getScoringConfigForVertical(this.vertical);
    if (!config) {
      return this.emptyResult();
    }

    // Calculate category scores
    const categoryScores = this.calculateCategoryScores(input.signals);

    // Apply weights to get base score
    let baseScore = this.applyWeights(categoryScores, config.weights);

    // Apply boosts
    const { boostedScore, appliedBoosts } = this.applyBoosts(
      baseScore,
      input.signals,
      config.boosts
    );

    // Calculate confidence
    const confidence = this.calculateConfidence(input.signals);

    // Determine grade
    const grade = this.determineGrade(boostedScore, config.thresholds);

    // Get signal contributions
    const signalContributions = this.getSignalContributions(input.signals);

    return {
      vertical: this.vertical,
      overallScore: Math.round(Math.min(100, Math.max(0, boostedScore))),
      grade,
      categoryScores,
      appliedBoosts,
      signalContributions,
      confidence: Math.round(confidence * 100) / 100,
      calculatedAt: new Date(),
    };
  }

  /**
   * Calculate scores by category
   */
  private calculateCategoryScores(signals: SignalMatch[]): Record<string, number> {
    const categories: Record<string, { total: number; count: number }> = {};

    for (const match of signals) {
      const category = match.signal.category;
      if (!categories[category]) {
        categories[category] = { total: 0, count: 0 };
      }

      // Weight by signal weight and confidence
      const contribution = match.signal.weight * match.confidence;
      categories[category].total += contribution;
      categories[category].count += 1;
    }

    // Normalize to 0-100 scale
    const result: Record<string, number> = {};
    for (const [category, data] of Object.entries(categories)) {
      if (data.count > 0) {
        result[category] = Math.min(100, (data.total / data.count) * 100);
      }
    }

    return result;
  }

  /**
   * Apply vertical-specific weights
   */
  private applyWeights(
    categoryScores: Record<string, number>,
    weights: Record<string, number>
  ): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const [category, weight] of Object.entries(weights)) {
      const score = categoryScores[category] || 0;
      totalScore += score * weight;
      totalWeight += weight;
    }

    if (totalWeight === 0) return 0;
    return totalScore / totalWeight;
  }

  /**
   * Apply boosts based on signal patterns
   */
  private applyBoosts(
    baseScore: number,
    signals: SignalMatch[],
    boosts: Record<string, number>
  ): { boostedScore: number; appliedBoosts: string[] } {
    let boostedScore = baseScore;
    const appliedBoosts: string[] = [];

    // Multi-signal boost
    if (signals.length >= 3 && boosts.multiSignal) {
      boostedScore *= boosts.multiSignal;
      appliedBoosts.push('multiSignal');
    }

    // Recent activity boost (within 7 days)
    const recentSignals = signals.filter(
      s => Date.now() - s.detectedAt.getTime() < 7 * 24 * 60 * 60 * 1000
    );
    if (recentSignals.length > 0 && boosts.recentActivity) {
      boostedScore *= boosts.recentActivity;
      appliedBoosts.push('recentActivity');
    }

    // High confidence boost
    const highConfidenceSignals = signals.filter(s => s.confidence >= 0.8);
    if (highConfidenceSignals.length >= 2 && boosts.highConfidence) {
      boostedScore *= boosts.highConfidence;
      appliedBoosts.push('highConfidence');
    }

    // Vertical-specific boosts
    const verticalBoosts = this.getVerticalSpecificBoosts(signals, boosts);
    for (const boost of verticalBoosts) {
      boostedScore *= boost.multiplier;
      appliedBoosts.push(boost.name);
    }

    return { boostedScore, appliedBoosts };
  }

  /**
   * Get vertical-specific boosts based on signal patterns
   */
  private getVerticalSpecificBoosts(
    signals: SignalMatch[],
    boosts: Record<string, number>
  ): Array<{ name: string; multiplier: number }> {
    const result: Array<{ name: string; multiplier: number }> = [];

    switch (this.vertical) {
      case 'insurance': {
        // Life event boost for insurance
        const lifeEventSignals = signals.filter(
          s => s.signal.subcategory === 'life-event'
        );
        if (lifeEventSignals.length > 0 && boosts.lifeEvent) {
          result.push({ name: 'lifeEvent', multiplier: boosts.lifeEvent });
        }
        break;
      }
      case 'real-estate': {
        // Urgent timing boost for real estate
        const urgentSignals = signals.filter(
          s =>
            s.signal.id === 're-lease-expiring' ||
            s.signal.id === 're-1031-exchange'
        );
        if (urgentSignals.length > 0 && boosts.urgentTiming) {
          result.push({ name: 'urgentTiming', multiplier: boosts.urgentTiming });
        }
        break;
      }
      case 'recruitment': {
        // Urgent need boost for recruitment
        const urgentSignals = signals.filter(
          s =>
            s.signal.id === 'rec-urgent-hire' ||
            s.signal.id === 'rec-offer-pending'
        );
        if (urgentSignals.length > 0 && boosts.urgentNeed) {
          result.push({ name: 'urgentNeed', multiplier: boosts.urgentNeed });
        }
        // Referral boost
        const referralSignals = signals.filter(
          s => s.signal.id === 'rec-referral-available'
        );
        if (referralSignals.length > 0 && boosts.referral) {
          result.push({ name: 'referral', multiplier: boosts.referral });
        }
        break;
      }
      case 'saas-sales': {
        // Trial signup boost
        const trialSignals = signals.filter(
          s => s.signal.id === 'saas-trial-signup'
        );
        if (trialSignals.length > 0 && boosts.trialSignup) {
          result.push({ name: 'trialSignup', multiplier: boosts.trialSignup });
        }
        // Recent funding boost
        const fundingSignals = signals.filter(
          s =>
            s.signal.id === 'saas-funding-round' &&
            Date.now() - s.detectedAt.getTime() < 90 * 24 * 60 * 60 * 1000
        );
        if (fundingSignals.length > 0 && boosts.fundingRecent) {
          result.push({ name: 'fundingRecent', multiplier: boosts.fundingRecent });
        }
        break;
      }
    }

    return result;
  }

  /**
   * Calculate overall confidence in the score
   */
  private calculateConfidence(signals: SignalMatch[]): number {
    if (signals.length === 0) return 0;

    // Average confidence across all signals
    const avgConfidence =
      signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;

    // Boost for signal diversity
    const uniqueCategories = new Set(signals.map(s => s.signal.category)).size;
    const diversityBoost = Math.min(1.2, 1 + uniqueCategories * 0.05);

    // Boost for signal count
    const countBoost = Math.min(1.15, 1 + signals.length * 0.02);

    return Math.min(1, avgConfidence * diversityBoost * countBoost);
  }

  /**
   * Determine grade based on score and thresholds
   */
  private determineGrade(
    score: number,
    thresholds: { hot: number; warm: number; cold: number }
  ): 'hot' | 'warm' | 'cold' {
    if (score >= thresholds.hot) return 'hot';
    if (score >= thresholds.warm) return 'warm';
    return 'cold';
  }

  /**
   * Get individual signal contributions to the score
   */
  private getSignalContributions(signals: SignalMatch[]): SignalContribution[] {
    return signals.map(match => ({
      signalId: match.signal.id,
      signalName: match.signal.name,
      weight: match.signal.weight,
      contribution: match.signal.weight * match.confidence * 100,
      category: match.signal.category,
    }));
  }

  /**
   * Return empty result when no config found
   */
  private emptyResult(): ScoringResult {
    return {
      vertical: this.vertical,
      overallScore: 0,
      grade: 'cold',
      categoryScores: {},
      appliedBoosts: [],
      signalContributions: [],
      confidence: 0,
      calculatedAt: new Date(),
    };
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create scoring engine for a specific vertical
 */
export function createScoringEngine(vertical: Vertical): VerticalScoringEngine {
  return new VerticalScoringEngine(vertical);
}

/**
 * Quick score calculation without creating engine instance
 */
export function calculateScore(input: ScoringInput): ScoringResult {
  const engine = new VerticalScoringEngine(input.vertical);
  return engine.calculate(input);
}

/**
 * Compare scores across verticals for same entity
 */
export function compareVerticalScores(
  signals: SignalMatch[],
  verticals: Vertical[] = ['banking', 'insurance', 'real-estate', 'recruitment', 'saas-sales']
): Record<Vertical, ScoringResult> {
  const results: Record<string, ScoringResult> = {};

  for (const vertical of verticals) {
    const engine = new VerticalScoringEngine(vertical);
    results[vertical] = engine.calculate({ vertical, signals });
  }

  return results as Record<Vertical, ScoringResult>;
}

// =============================================================================
// VERTICAL-SPECIFIC SCORING HELPERS
// =============================================================================

/**
 * Banking-specific: Calculate employee banking opportunity score
 */
export function calculateEmployeeBankingScore(
  signals: SignalMatch[],
  companyData: CompanyContext
): ScoringResult {
  const engine = new VerticalScoringEngine('banking');
  const result = engine.calculate({
    vertical: 'banking',
    signals,
    companyData,
  });

  // Additional employee banking adjustments
  if (companyData.employeeCount) {
    const employeeMultiplier =
      companyData.employeeCount > 500 ? 1.2 :
      companyData.employeeCount > 100 ? 1.1 : 1.0;

    result.overallScore = Math.round(
      Math.min(100, result.overallScore * employeeMultiplier)
    );
  }

  return result;
}

/**
 * Insurance-specific: Calculate life insurance opportunity score
 */
export function calculateLifeInsuranceScore(
  signals: SignalMatch[],
  individualData: IndividualContext
): ScoringResult {
  const engine = new VerticalScoringEngine('insurance');
  const result = engine.calculate({
    vertical: 'insurance',
    signals,
    individualData,
  });

  // Additional life insurance adjustments based on life stage
  if (individualData.lifeStage) {
    const stageMultipliers: Record<string, number> = {
      'new-family': 1.25,
      'established-family': 1.15,
      'pre-retirement': 1.20,
      'young-professional': 1.10,
    };
    const multiplier = stageMultipliers[individualData.lifeStage] || 1.0;
    result.overallScore = Math.round(
      Math.min(100, result.overallScore * multiplier)
    );
  }

  return result;
}

/**
 * SaaS-specific: Calculate enterprise opportunity score
 */
export function calculateEnterpriseScore(
  signals: SignalMatch[],
  companyData: CompanyContext
): ScoringResult {
  const engine = new VerticalScoringEngine('saas-sales');
  const result = engine.calculate({
    vertical: 'saas-sales',
    signals,
    companyData,
  });

  // Additional enterprise adjustments
  if (companyData.fundingStage) {
    const fundingMultipliers: Record<string, number> = {
      'series-c': 1.25,
      'series-b': 1.20,
      'series-a': 1.15,
      'seed': 1.05,
    };
    const multiplier = fundingMultipliers[companyData.fundingStage] || 1.0;
    result.overallScore = Math.round(
      Math.min(100, result.overallScore * multiplier)
    );
  }

  return result;
}
