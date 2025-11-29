/**
 * Industry Detector - Sprint S48 Features 2 & 10
 * Detect industry from domain using OS enrichment API
 * Calculate industry confidence score
 *
 * Flow: domain → API route → OS enrichment → industry → vertical suggestion
 *
 * NOTE: This module is client-safe. Server-side OS calls are made via API routes.
 */

import {
  IndustryDetection,
  IndustrySource,
  INDUSTRY_TO_VERTICAL,
  CONFIDENCE_THRESHOLDS,
} from './types';
import { VerticalId } from '@/lib/stores/onboarding-store';

/**
 * Map raw industry string to known vertical
 */
export function mapIndustryToVertical(industry: string): VerticalId | null {
  if (!industry) return null;

  const lower = industry.toLowerCase().trim();

  // Direct match
  if (INDUSTRY_TO_VERTICAL[lower]) {
    return INDUSTRY_TO_VERTICAL[lower];
  }

  // Partial match
  for (const [key, vertical] of Object.entries(INDUSTRY_TO_VERTICAL)) {
    if (lower.includes(key) || key.includes(lower)) {
      return vertical;
    }
  }

  return null;
}

/**
 * Calculate confidence score from multiple sources
 * Higher score = more reliable detection
 */
export function calculateConfidenceScore(sources: IndustrySource[]): number {
  if (!sources.length) return 0;

  // Weighted average based on source reliability
  const sourceWeights: Record<string, number> = {
    'apollo': 0.9,
    'clearbit': 0.9,
    'crunchbase': 0.85,
    'linkedin': 0.8,
    'zoominfo': 0.85,
    'google': 0.6,
    'website': 0.5,
    'heuristic': 0.3,
  };

  let totalWeight = 0;
  let weightedSum = 0;

  for (const source of sources) {
    const weight = sourceWeights[source.name.toLowerCase()] || 0.5;
    weightedSum += source.confidence * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 0;

  return Math.round(weightedSum / totalWeight);
}

/**
 * Get consensus industry from multiple sources
 */
function getConsensusIndustry(sources: IndustrySource[]): string | null {
  if (!sources.length) return null;

  // Count industry occurrences weighted by confidence
  const industryScores = new Map<string, number>();

  for (const source of sources) {
    const lower = source.industry.toLowerCase();
    const current = industryScores.get(lower) || 0;
    industryScores.set(lower, current + source.confidence);
  }

  // Get highest scoring industry
  let bestIndustry: string | null = null;
  let bestScore = 0;

  for (const [industry, score] of industryScores.entries()) {
    if (score > bestScore) {
      bestScore = score;
      bestIndustry = industry;
    }
  }

  return bestIndustry;
}

/**
 * Detect industry from domain using OS enrichment via API route
 * This is the main function to call during onboarding
 *
 * NOTE: Uses /api/identity/detect-industry API route (server-side) to avoid
 * importing server-only libraries in client components.
 */
export async function detectIndustryFromDomain(domain: string): Promise<IndustryDetection> {
  const result: IndustryDetection = {
    domain,
    detectedIndustry: null,
    suggestedVertical: null,
    confidenceScore: 0,
    sources: [],
    detectedAt: new Date().toISOString(),
  };

  if (!domain) return result;

  try {
    // Call the API route for industry detection (server-side)
    const response = await fetch('/api/identity/detect-industry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain }),
    });

    if (response.ok) {
      const data = await response.json();

      if (data.success && data.detection) {
        return data.detection;
      }
    }
  } catch (error) {
    console.error('[Industry Detector] API call failed:', error);
    // Continue with fallback heuristic
  }

  // Fallback: Use domain-based heuristics if API failed
  const heuristicResult = detectIndustryFromDomainHeuristic(domain);
  if (heuristicResult) {
    result.sources.push({
      name: 'heuristic',
      industry: heuristicResult,
      confidence: 30,
    });
    result.detectedIndustry = heuristicResult;
  }

  // Calculate confidence and map to vertical
  result.confidenceScore = calculateConfidenceScore(result.sources);
  result.suggestedVertical = result.detectedIndustry
    ? mapIndustryToVertical(result.detectedIndustry)
    : null;

  return result;
}

/**
 * Fallback: Detect industry from domain keywords
 * Low confidence - only used when enrichment fails
 */
function detectIndustryFromDomainHeuristic(domain: string): string | null {
  const lower = domain.toLowerCase();

  // Banking keywords
  if (lower.includes('bank') || lower.includes('credit') || lower.includes('finance')) {
    return 'banking';
  }

  // Insurance keywords
  if (lower.includes('insurance') || lower.includes('insure') || lower.includes('assurance')) {
    return 'insurance';
  }

  // Real estate keywords
  if (lower.includes('realty') || lower.includes('property') || lower.includes('estate') ||
      lower.includes('homes') || lower.includes('housing')) {
    return 'real estate';
  }

  // FinTech keywords
  if (lower.includes('pay') || lower.includes('wallet') || lower.includes('fintech')) {
    return 'fintech';
  }

  // Consulting keywords
  if (lower.includes('consult') || lower.includes('advisory') || lower.includes('partners')) {
    return 'consulting';
  }

  return null;
}

/**
 * Check if confidence is high enough for auto-suggestion
 */
export function shouldAutoSuggestVertical(detection: IndustryDetection): boolean {
  return (
    detection.suggestedVertical !== null &&
    detection.confidenceScore >= CONFIDENCE_THRESHOLDS.MEDIUM
  );
}

/**
 * Get confidence level label
 */
export function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' | 'none' {
  if (score >= CONFIDENCE_THRESHOLDS.HIGH) return 'high';
  if (score >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'medium';
  if (score >= CONFIDENCE_THRESHOLDS.LOW) return 'low';
  return 'none';
}

/**
 * Get human-readable confidence message
 */
export function getConfidenceMessage(detection: IndustryDetection): string {
  const level = getConfidenceLevel(detection.confidenceScore);

  switch (level) {
    case 'high':
      return `We're confident you work in ${detection.detectedIndustry}`;
    case 'medium':
      return `Based on your email, you might work in ${detection.detectedIndustry}`;
    case 'low':
      return `We detected some signals suggesting ${detection.detectedIndustry}`;
    default:
      return 'Please select your industry manually';
  }
}

export default {
  detectIndustryFromDomain,
  mapIndustryToVertical,
  calculateConfidenceScore,
  shouldAutoSuggestVertical,
  getConfidenceLevel,
  getConfidenceMessage,
};
