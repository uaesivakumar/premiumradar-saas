/**
 * Q/T/L/E Scoring Engine
 *
 * Core algorithm to convert signals to actionable scores.
 * Quality/Timing/Likelihood/Engagement scoring for B2B sales intelligence.
 */

import type {
  QTLEScore,
  Signal,
  CompanyProfile,
  ScoringConfig,
  CategoryWeights,
  GradeThresholds,
} from './types';

// Default configuration
const DEFAULT_WEIGHTS: CategoryWeights = {
  quality: 0.30,
  timing: 0.25,
  likelihood: 0.25,
  engagement: 0.20,
};

const DEFAULT_THRESHOLDS: GradeThresholds = {
  A: 85,
  B: 70,
  C: 55,
  D: 40,
};

export class QTLEEngine {
  private config: ScoringConfig;

  constructor(config?: Partial<ScoringConfig>) {
    this.config = {
      weights: config?.weights || DEFAULT_WEIGHTS,
      thresholds: config?.thresholds || DEFAULT_THRESHOLDS,
      regionalMultipliers: config?.regionalMultipliers || {},
      industryAdjustments: config?.industryAdjustments || {},
    };
  }

  /**
   * Calculate Q/T/L/E score for a company profile
   */
  calculateScore(profile: CompanyProfile): QTLEScore {
    const signals = profile.signals;

    // Group signals by category
    const grouped = this.groupSignalsByCategory(signals);

    // Calculate category scores
    const quality = this.calculateCategoryScore(grouped.quality);
    const timing = this.calculateCategoryScore(grouped.timing);
    const likelihood = this.calculateCategoryScore(grouped.likelihood);
    const engagement = this.calculateCategoryScore(grouped.engagement);

    // Apply regional multipliers
    const regionalBoost = this.getRegionalBoost(profile.region);
    const adjustedQuality = Math.min(100, quality * regionalBoost.qualityBoost);
    const adjustedTiming = Math.min(100, timing * regionalBoost.timingBoost);

    // Apply industry adjustments
    const industryMultiplier = this.getIndustryMultiplier(profile.industry);

    // Calculate composite score
    const weights = this.config.weights;
    const composite = Math.round(
      (adjustedQuality * weights.quality +
        adjustedTiming * weights.timing +
        likelihood * weights.likelihood +
        engagement * weights.engagement) *
        industryMultiplier
    );

    // Determine grade
    const grade = this.calculateGrade(composite);

    // Calculate confidence based on signal coverage
    const confidence = this.calculateConfidence(signals);

    return {
      quality: Math.round(adjustedQuality),
      timing: Math.round(adjustedTiming),
      likelihood: Math.round(likelihood),
      engagement: Math.round(engagement),
      composite: Math.min(100, composite),
      grade,
      confidence,
    };
  }

  /**
   * Group signals by their category
   */
  private groupSignalsByCategory(signals: Signal[]): Record<string, Signal[]> {
    return signals.reduce(
      (acc, signal) => {
        if (!acc[signal.category]) {
          acc[signal.category] = [];
        }
        acc[signal.category].push(signal);
        return acc;
      },
      { quality: [], timing: [], likelihood: [], engagement: [] } as Record<string, Signal[]>
    );
  }

  /**
   * Calculate score for a single category
   */
  private calculateCategoryScore(signals: Signal[]): number {
    if (signals.length === 0) return 50; // Neutral score when no data

    let totalWeight = 0;
    let weightedSum = 0;

    for (const signal of signals) {
      const impactMultiplier = signal.impact === 'positive' ? 1 : signal.impact === 'negative' ? -1 : 0;
      const contribution = signal.value * signal.weight * impactMultiplier;
      weightedSum += contribution;
      totalWeight += signal.weight;
    }

    // Normalize to 0-100 scale
    const rawScore = totalWeight > 0 ? (weightedSum / totalWeight + 50) : 50;
    return Math.max(0, Math.min(100, rawScore));
  }

  /**
   * Get regional boost multipliers
   */
  private getRegionalBoost(region: string): { qualityBoost: number; timingBoost: number } {
    const multipliers = this.config.regionalMultipliers[region];
    return multipliers || { qualityBoost: 1.0, timingBoost: 1.0 };
  }

  /**
   * Get industry multiplier
   */
  private getIndustryMultiplier(industry: string): number {
    const adjustment = this.config.industryAdjustments[industry];
    return adjustment?.baseWeight || 1.0;
  }

  /**
   * Calculate grade from composite score
   */
  private calculateGrade(score: number): QTLEScore['grade'] {
    const { A, B, C, D } = this.config.thresholds;
    if (score >= A) return 'A';
    if (score >= B) return 'B';
    if (score >= C) return 'C';
    if (score >= D) return 'D';
    return 'F';
  }

  /**
   * Calculate confidence based on signal coverage and recency
   */
  private calculateConfidence(signals: Signal[]): number {
    if (signals.length === 0) return 0;

    // Base confidence on number of signals (more signals = higher confidence)
    const signalCountFactor = Math.min(1, signals.length / 10) * 40;

    // Category coverage factor
    const categories = new Set(signals.map((s) => s.category));
    const coverageFactor = (categories.size / 4) * 30;

    // Recency factor (newer signals = higher confidence)
    const now = new Date();
    const avgAge =
      signals.reduce((sum, s) => {
        const age = (now.getTime() - new Date(s.timestamp).getTime()) / (1000 * 60 * 60 * 24);
        return sum + Math.min(age, 90); // Cap at 90 days
      }, 0) / signals.length;
    const recencyFactor = Math.max(0, 30 - (avgAge / 90) * 30);

    return Math.round(signalCountFactor + coverageFactor + recencyFactor);
  }

  /**
   * Get scoring explanation for a profile
   */
  getExplanation(profile: CompanyProfile, score: QTLEScore): string[] {
    const explanations: string[] = [];

    // Quality explanation
    if (score.quality >= 80) {
      explanations.push('Strong profile match with ideal customer characteristics');
    } else if (score.quality < 50) {
      explanations.push('Limited alignment with target customer profile');
    }

    // Timing explanation
    if (score.timing >= 80) {
      explanations.push('Optimal timing signals detected - high urgency to act');
    } else if (score.timing < 50) {
      explanations.push('No immediate timing triggers - consider nurturing');
    }

    // Likelihood explanation
    if (score.likelihood >= 80) {
      explanations.push('High conversion probability based on behavioral signals');
    } else if (score.likelihood < 50) {
      explanations.push('Conversion signals weak - qualification needed');
    }

    // Engagement explanation
    if (score.engagement >= 80) {
      explanations.push('Actively engaged with your brand and content');
    } else if (score.engagement < 50) {
      explanations.push('Low engagement - awareness building recommended');
    }

    return explanations;
  }
}

// Singleton instance with default config
export const qtleEngine = new QTLEEngine();
