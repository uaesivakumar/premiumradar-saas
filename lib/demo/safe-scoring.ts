/**
 * Safe Demo Scoring Module
 *
 * Generate demo scores that are clearly marked as estimates.
 */

import type { DemoScoreResult, DemoAnalysisResult } from './types';
import { generateFakeDomain } from './fake-data';

// ============================================================
// DEMO DISCLAIMER
// ============================================================

export const DEMO_DISCLAIMER =
  'This is a demo score for illustrative purposes only. Actual domain values may vary significantly. Book a demo for accurate valuations.';

export const DEMO_ANALYSIS_DISCLAIMER =
  'This analysis is generated for demo purposes. Real analyses include verified data from multiple sources. Book a demo for comprehensive domain analysis.';

// ============================================================
// SAFE SCORING
// ============================================================

/**
 * Generate a safe demo score for a domain
 * Uses randomized but realistic-looking scores with clear demo markers
 */
export function generateDemoScore(domain: string): DemoScoreResult {
  // Generate consistent scores based on domain characteristics
  const seed = hashDomain(domain);
  const random = seededRandom(seed);

  // Generate scores with some variance but consistent for same domain
  const quality = Math.round(50 + random() * 40);
  const traffic = Math.round(40 + random() * 45);
  const liquidity = Math.round(45 + random() * 40);
  const endUser = Math.round(35 + random() * 50);

  // Composite is weighted average
  const composite = Math.round(
    quality * 0.30 + traffic * 0.25 + liquidity * 0.20 + endUser * 0.25
  );

  // Determine tier
  let tier: DemoScoreResult['tier'];
  if (composite >= 75) tier = 'excellent';
  else if (composite >= 60) tier = 'good';
  else if (composite >= 45) tier = 'fair';
  else tier = 'poor';

  return {
    domain,
    scores: {
      quality,
      traffic,
      liquidity,
      endUser,
      composite,
    },
    tier,
    isDemo: true,
    disclaimer: DEMO_DISCLAIMER,
  };
}

/**
 * Generate a batch of demo scores
 */
export function generateDemoScores(domains: string[]): DemoScoreResult[] {
  return domains.map(generateDemoScore);
}

/**
 * Generate a demo analysis for a domain
 */
export function generateDemoAnalysis(domain: string): DemoAnalysisResult {
  const score = generateDemoScore(domain);
  const seed = hashDomain(domain);
  const random = seededRandom(seed);

  // Generate strengths based on high scores
  const strengths: string[] = [];
  if (score.scores.quality >= 70) {
    strengths.push('Strong brand potential - memorable and easy to spell');
  }
  if (score.scores.traffic >= 65) {
    strengths.push('Existing traffic indicates market interest');
  }
  if (score.scores.liquidity >= 60) {
    strengths.push('Active marketplace with comparable sales');
  }
  if (domain.endsWith('.com')) {
    strengths.push('Premium .com TLD - highest perceived value');
  }
  if (domain.length <= 8) {
    strengths.push('Short domain length - easier to remember');
  }

  // Add generic strengths if needed
  if (strengths.length < 2) {
    strengths.push('No trademark conflicts detected');
    strengths.push('Clean registration history');
  }

  // Generate weaknesses based on low scores
  const weaknesses: string[] = [];
  if (score.scores.quality < 50) {
    weaknesses.push('Domain name may be difficult to brand');
  }
  if (score.scores.traffic < 40) {
    weaknesses.push('Limited organic traffic currently');
  }
  if (!domain.endsWith('.com')) {
    weaknesses.push('Non-.com TLD may have lower perceived value');
  }
  if (domain.includes('-')) {
    weaknesses.push('Hyphenated domains typically sell for less');
  }
  if (domain.match(/\d/)) {
    weaknesses.push('Numbers in domain can reduce memorability');
  }

  // Add generic weakness if needed
  if (weaknesses.length === 0) {
    weaknesses.push('Competitive vertical may require larger marketing investment');
  }

  // Generate opportunities
  const opportunities = [
    'Potential for SEO ranking with targeted content',
    'Could be developed as a lead generation site',
    'Suitable for a specific industry vertical',
    'May appreciate with market growth',
  ];

  // Calculate recommended price (demo estimate)
  const basePrice = score.scores.composite * 150;
  const multiplier = 0.8 + random() * 0.4;
  const recommendedPrice = Math.round(basePrice * multiplier / 100) * 100;

  // Generate summary
  const summary = generateSummary(domain, score.tier, score.scores.composite);

  return {
    domain,
    summary,
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 3),
    opportunities: opportunities.slice(0, 3),
    recommendedPrice,
    isDemo: true,
    disclaimer: DEMO_ANALYSIS_DISCLAIMER,
  };
}

/**
 * Generate summary text
 */
function generateSummary(domain: string, tier: DemoScoreResult['tier'], score: number): string {
  const summaries: Record<DemoScoreResult['tier'], string[]> = {
    excellent: [
      `${domain} demonstrates exceptional potential with strong metrics across all categories.`,
      `A premium domain with ${score}/100 composite score, suitable for enterprise branding.`,
    ],
    good: [
      `${domain} shows solid fundamentals with room for growth through development.`,
      `Scoring ${score}/100, this domain offers good value for business applications.`,
    ],
    fair: [
      `${domain} is a serviceable domain with moderate scores in key metrics.`,
      `At ${score}/100, this domain may suit niche applications or development projects.`,
    ],
    poor: [
      `${domain} has limited immediate value but may suit specific use cases.`,
      `With a ${score}/100 score, this domain is priced for budget-conscious buyers.`,
    ],
  };

  return summaries[tier][Math.floor(Math.random() * summaries[tier].length)];
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Simple hash function for domain strings
 */
function hashDomain(domain: string): number {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    const char = domain.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Seeded random number generator for consistent results
 */
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

/**
 * Generate comparison between two domains (demo mode)
 */
export function generateDemoComparison(
  domain1: string,
  domain2: string
): {
  domain1: DemoScoreResult;
  domain2: DemoScoreResult;
  winner: string;
  comparison: Array<{
    metric: string;
    domain1Value: number;
    domain2Value: number;
    winner: 1 | 2 | 'tie';
  }>;
  isDemo: true;
} {
  const score1 = generateDemoScore(domain1);
  const score2 = generateDemoScore(domain2);

  const metrics: Array<{ name: string; key: keyof DemoScoreResult['scores'] }> = [
    { name: 'Quality', key: 'quality' },
    { name: 'Traffic', key: 'traffic' },
    { name: 'Liquidity', key: 'liquidity' },
    { name: 'End-User Potential', key: 'endUser' },
    { name: 'Overall', key: 'composite' },
  ];

  const comparison = metrics.map(({ name, key }) => {
    const v1 = score1.scores[key];
    const v2 = score2.scores[key];
    const diff = Math.abs(v1 - v2);

    let winner: 1 | 2 | 'tie' = 'tie';
    if (diff > 5) {
      winner = v1 > v2 ? 1 : 2;
    }

    return {
      metric: name,
      domain1Value: v1,
      domain2Value: v2,
      winner,
    };
  });

  const winner =
    score1.scores.composite > score2.scores.composite + 5
      ? domain1
      : score2.scores.composite > score1.scores.composite + 5
        ? domain2
        : 'tie';

  return {
    domain1: score1,
    domain2: score2,
    winner,
    comparison,
    isDemo: true,
  };
}

/**
 * Format demo price for display
 */
export function formatDemoPrice(price: number): string {
  return `~$${price.toLocaleString()} (demo estimate)`;
}
