/**
 * Ranking Explanations
 *
 * Generate human-readable explanations for domain rankings.
 */

import type {
  RankingScores,
  RankingMetadata,
  RankingSignal,
  RankingExplanation,
  ExplanationFactor,
  ScoreBreakdown,
  BreakdownFactor,
  DomainComparison,
} from './types';

// ============================================================
// EXPLANATION GENERATION
// ============================================================

/**
 * Generate complete explanation for a ranked domain
 */
export function generateExplanation(
  domain: string,
  scores: RankingScores,
  metadata: RankingMetadata,
  signals: RankingSignal[]
): RankingExplanation {
  return {
    summary: generateSummary(domain, scores, metadata),
    topFactors: generateTopFactors(scores, metadata, signals),
    detailedBreakdown: generateDetailedBreakdown(scores, metadata),
    comparisons: [],
    recommendations: generateRecommendations(scores, metadata),
  };
}

/**
 * Generate summary text
 */
export function generateSummary(
  domain: string,
  scores: RankingScores,
  metadata: RankingMetadata
): string {
  const tier = getScoreTierText(scores.composite);
  const mainStrength = getMainStrength(scores);
  const mainWeakness = getMainWeakness(scores);

  let summary = `${domain} is a ${tier} domain with a composite score of ${scores.composite}/100. `;

  summary += `Its strongest area is ${mainStrength.name.toLowerCase()} (${mainStrength.score}/100)`;

  if (mainWeakness.score < 60) {
    summary += `, while ${mainWeakness.name.toLowerCase()} (${mainWeakness.score}/100) presents room for improvement`;
  }

  summary += '.';

  // Add metadata notes
  if (metadata.length <= 5) {
    summary += ` The short length (${metadata.length} chars) adds premium value.`;
  }
  if (metadata.hasHyphens) {
    summary += ' Note: Contains hyphens which may reduce marketability.';
  }

  return summary;
}

/**
 * Generate top contributing factors
 */
export function generateTopFactors(
  scores: RankingScores,
  metadata: RankingMetadata,
  signals: RankingSignal[]
): ExplanationFactor[] {
  const factors: ExplanationFactor[] = [];

  // Score-based factors
  const categories: Array<{ key: keyof typeof scores; name: string }> = [
    { key: 'quality', name: 'Domain Quality' },
    { key: 'traffic', name: 'Traffic Potential' },
    { key: 'liquidity', name: 'Market Liquidity' },
    { key: 'endUser', name: 'End-User Value' },
  ];

  for (const cat of categories) {
    const score = scores[cat.key] as number;
    if (score >= 70) {
      factors.push({
        id: `factor_${cat.key}_high`,
        name: cat.name,
        impact: 'positive',
        weight: 0.25,
        contribution: score * 0.25,
        description: `Strong ${cat.name.toLowerCase()} score of ${score}/100`,
      });
    } else if (score < 40) {
      factors.push({
        id: `factor_${cat.key}_low`,
        name: cat.name,
        impact: 'negative',
        weight: 0.25,
        contribution: -(100 - score) * 0.1,
        description: `Lower ${cat.name.toLowerCase()} score of ${score}/100`,
      });
    }
  }

  // Metadata factors
  if (metadata.length <= 5) {
    factors.push({
      id: 'factor_short_length',
      name: 'Short Length',
      impact: 'positive',
      weight: 0.15,
      contribution: 15,
      description: `Only ${metadata.length} characters - highly memorable`,
    });
  }

  if (metadata.tld === '.com') {
    factors.push({
      id: 'factor_com_tld',
      name: 'Premium TLD',
      impact: 'positive',
      weight: 0.1,
      contribution: 10,
      description: '.com TLD commands premium value',
    });
  }

  if (metadata.hasHyphens) {
    factors.push({
      id: 'factor_hyphens',
      name: 'Contains Hyphens',
      impact: 'negative',
      weight: 0.15,
      contribution: -15,
      description: 'Hyphens reduce brandability and memorability',
    });
  }

  // Signal-based factors
  for (const signal of signals.filter((s) => s.importance === 'high')) {
    factors.push({
      id: `factor_signal_${signal.type}`,
      name: signal.name,
      impact: signal.value >= 70 ? 'positive' : signal.value < 40 ? 'negative' : 'neutral',
      weight: 0.1,
      contribution: signal.value * 0.1,
      description: `${signal.name}: ${signal.value}/100 (${signal.trend})`,
    });
  }

  // Sort by absolute contribution
  return factors
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 5);
}

/**
 * Generate detailed score breakdown
 */
export function generateDetailedBreakdown(
  scores: RankingScores,
  metadata: RankingMetadata
): ScoreBreakdown[] {
  return [
    {
      category: 'quality',
      score: scores.quality,
      weight: 0.3,
      contribution: scores.quality * 0.3,
      factors: generateQualityFactors(metadata),
    },
    {
      category: 'traffic',
      score: scores.traffic,
      weight: 0.25,
      contribution: scores.traffic * 0.25,
      factors: generateTrafficFactors(scores.traffic),
    },
    {
      category: 'liquidity',
      score: scores.liquidity,
      weight: 0.2,
      contribution: scores.liquidity * 0.2,
      factors: generateLiquidityFactors(scores.liquidity, metadata),
    },
    {
      category: 'endUser',
      score: scores.endUser,
      weight: 0.25,
      contribution: scores.endUser * 0.25,
      factors: generateEndUserFactors(scores.endUser, metadata),
    },
  ];
}

/**
 * Generate comparisons with similar domains
 */
export function generateComparisons(
  domain: string,
  scores: RankingScores,
  similarDomains: Array<{ domain: string; scores: RankingScores }>
): DomainComparison[] {
  return similarDomains.map((similar) => ({
    domain: similar.domain,
    composite: similar.scores.composite,
    difference: scores.composite - similar.scores.composite,
    strengths: getComparisonStrengths(scores, similar.scores),
    weaknesses: getComparisonWeaknesses(scores, similar.scores),
  }));
}

/**
 * Generate actionable recommendations
 */
export function generateRecommendations(
  scores: RankingScores,
  metadata: RankingMetadata
): string[] {
  const recommendations: string[] = [];

  // Low traffic recommendations
  if (scores.traffic < 50) {
    recommendations.push(
      'Consider SEO optimization to improve traffic metrics',
      'Building quality backlinks could boost visibility'
    );
  }

  // Low liquidity recommendations
  if (scores.liquidity < 50) {
    recommendations.push(
      'List on multiple marketplaces to increase exposure',
      'Consider competitive pricing based on comparable sales'
    );
  }

  // Low end-user value recommendations
  if (scores.endUser < 50) {
    recommendations.push(
      'Target specific verticals where the domain has natural fit',
      'Develop a landing page to demonstrate potential'
    );
  }

  // Metadata-based recommendations
  if (metadata.hasHyphens) {
    recommendations.push(
      'Hyphenated domains typically sell for less - price accordingly'
    );
  }

  if (!metadata.available) {
    recommendations.push(
      'Domain is registered - monitor for expiration or make direct offer'
    );
  }

  // General recommendations
  if (scores.composite >= 80) {
    recommendations.push(
      'Strong domain - consider premium pricing strategy',
      'May attract end-user buyers willing to pay premium'
    );
  }

  return recommendations.slice(0, 4);
}

// ============================================================
// EXPLANATION FORMATTING
// ============================================================

/**
 * Format factor impact for display
 */
export function formatFactorImpact(factor: ExplanationFactor): string {
  const sign = factor.contribution >= 0 ? '+' : '';
  return `${sign}${factor.contribution.toFixed(1)} points`;
}

/**
 * Get impact color
 */
export function getImpactColor(impact: 'positive' | 'negative' | 'neutral'): string {
  const colors = {
    positive: 'green',
    negative: 'red',
    neutral: 'gray',
  };
  return colors[impact];
}

/**
 * Get breakdown chart data
 */
export function getBreakdownChartData(breakdown: ScoreBreakdown[]): Array<{
  name: string;
  value: number;
  color: string;
}> {
  const colors = {
    quality: '#10B981',
    traffic: '#3B82F6',
    liquidity: '#8B5CF6',
    endUser: '#F59E0B',
  };

  return breakdown.map((b) => ({
    name: b.category.charAt(0).toUpperCase() + b.category.slice(1),
    value: b.contribution,
    color: colors[b.category],
  }));
}

/**
 * Summarize breakdown for tooltip
 */
export function summarizeBreakdown(breakdown: ScoreBreakdown): string {
  const topFactor = breakdown.factors
    .sort((a, b) => b.score * b.weight - a.score * a.weight)[0];

  return `${breakdown.score}/100 (${(breakdown.weight * 100).toFixed(0)}% weight). Top factor: ${topFactor?.name || 'N/A'}`;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getScoreTierText(score: number): string {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  return 'below average';
}

function getMainStrength(scores: RankingScores): { name: string; score: number } {
  const categories = [
    { name: 'Quality', score: scores.quality },
    { name: 'Traffic', score: scores.traffic },
    { name: 'Liquidity', score: scores.liquidity },
    { name: 'End-User Value', score: scores.endUser },
  ];
  return categories.sort((a, b) => b.score - a.score)[0];
}

function getMainWeakness(scores: RankingScores): { name: string; score: number } {
  const categories = [
    { name: 'Quality', score: scores.quality },
    { name: 'Traffic', score: scores.traffic },
    { name: 'Liquidity', score: scores.liquidity },
    { name: 'End-User Value', score: scores.endUser },
  ];
  return categories.sort((a, b) => a.score - b.score)[0];
}

function generateQualityFactors(metadata: RankingMetadata): BreakdownFactor[] {
  return [
    {
      name: 'Length',
      value: metadata.length,
      score: metadata.length <= 5 ? 95 : metadata.length <= 8 ? 80 : metadata.length <= 12 ? 60 : 40,
      weight: 0.25,
      description: `${metadata.length} characters`,
    },
    {
      name: 'TLD',
      value: metadata.tld,
      score: metadata.tld === '.com' ? 95 : ['.io', '.ai', '.co'].includes(metadata.tld) ? 80 : 60,
      weight: 0.2,
      description: `${metadata.tld} extension`,
    },
    {
      name: 'Clean Format',
      value: !metadata.hasHyphens && !metadata.hasNumbers ? 'Yes' : 'No',
      score: !metadata.hasHyphens && !metadata.hasNumbers ? 90 : 50,
      weight: 0.2,
      description: metadata.hasHyphens ? 'Contains hyphens' : metadata.hasNumbers ? 'Contains numbers' : 'Clean format',
    },
  ];
}

function generateTrafficFactors(trafficScore: number): BreakdownFactor[] {
  return [
    {
      name: 'Organic Traffic',
      value: trafficScore >= 70 ? 'High' : trafficScore >= 40 ? 'Medium' : 'Low',
      score: trafficScore,
      weight: 0.4,
      description: 'Estimated organic search traffic',
    },
    {
      name: 'SEO Authority',
      value: Math.round(trafficScore * 0.8),
      score: Math.round(trafficScore * 0.9),
      weight: 0.3,
      description: 'Domain authority score',
    },
  ];
}

function generateLiquidityFactors(liquidityScore: number, metadata: RankingMetadata): BreakdownFactor[] {
  return [
    {
      name: 'Market Demand',
      value: liquidityScore >= 70 ? 'High' : liquidityScore >= 40 ? 'Medium' : 'Low',
      score: liquidityScore,
      weight: 0.4,
      description: 'Based on comparable sales',
    },
    {
      name: 'TLD Liquidity',
      value: metadata.tld,
      score: metadata.tld === '.com' ? 95 : 70,
      weight: 0.3,
      description: `${metadata.tld} market liquidity`,
    },
  ];
}

function generateEndUserFactors(endUserScore: number, metadata: RankingMetadata): BreakdownFactor[] {
  return [
    {
      name: 'Brand Potential',
      value: endUserScore >= 70 ? 'High' : endUserScore >= 40 ? 'Medium' : 'Low',
      score: endUserScore,
      weight: 0.35,
      description: 'Brandability assessment',
    },
    {
      name: 'Industry Fit',
      value: metadata.vertical || 'General',
      score: metadata.vertical ? 80 : 60,
      weight: 0.25,
      description: 'Vertical market fit',
    },
  ];
}

function getComparisonStrengths(ours: RankingScores, theirs: RankingScores): string[] {
  const strengths: string[] = [];
  if (ours.quality > theirs.quality) strengths.push('Higher quality score');
  if (ours.traffic > theirs.traffic) strengths.push('Better traffic metrics');
  if (ours.liquidity > theirs.liquidity) strengths.push('More liquid market');
  if (ours.endUser > theirs.endUser) strengths.push('Stronger end-user appeal');
  return strengths;
}

function getComparisonWeaknesses(ours: RankingScores, theirs: RankingScores): string[] {
  const weaknesses: string[] = [];
  if (ours.quality < theirs.quality) weaknesses.push('Lower quality score');
  if (ours.traffic < theirs.traffic) weaknesses.push('Less traffic potential');
  if (ours.liquidity < theirs.liquidity) weaknesses.push('Lower market liquidity');
  if (ours.endUser < theirs.endUser) weaknesses.push('Weaker end-user appeal');
  return weaknesses;
}
