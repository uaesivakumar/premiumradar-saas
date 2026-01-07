/**
 * Similarity Detector
 *
 * S355: Historical Action Recall
 * Behavior Contract B006: Historical recall advisory shown
 *
 * Detects similarity between current action and past actions.
 * Uses multiple similarity metrics to find related actions.
 */

import { createHash } from 'crypto';

export interface SimilarityScore {
  score: number; // 0-1, where 1 is exact match
  matchType: 'exact' | 'high' | 'medium' | 'low' | 'none';
  matchedFields: string[];
}

/**
 * Calculate similarity between two strings using Jaccard similarity
 */
export function stringSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;

  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();

  if (aLower === bLower) return 1;

  // Tokenize into words
  const aWords = new Set(aLower.split(/\s+/).filter(w => w.length > 2));
  const bWords = new Set(bLower.split(/\s+/).filter(w => w.length > 2));

  if (aWords.size === 0 || bWords.size === 0) return 0;

  // Calculate Jaccard similarity
  const intersection = new Set([...aWords].filter(x => bWords.has(x)));
  const union = new Set([...aWords, ...bWords]);

  return intersection.size / union.size;
}

/**
 * Calculate domain similarity (handles www prefix, etc.)
 */
export function domainSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;

  const normalizeA = a.toLowerCase().replace(/^www\./, '').trim();
  const normalizeB = b.toLowerCase().replace(/^www\./, '').trim();

  if (normalizeA === normalizeB) return 1;

  // Check if one contains the other
  if (normalizeA.includes(normalizeB) || normalizeB.includes(normalizeA)) {
    return 0.8;
  }

  return 0;
}

/**
 * Calculate overall similarity between two action contexts
 */
export function calculateSimilarity(
  current: Record<string, unknown>,
  past: Record<string, unknown>
): SimilarityScore {
  const matchedFields: string[] = [];
  let totalScore = 0;
  let weightSum = 0;

  // Weight different fields differently
  const fieldWeights: Record<string, number> = {
    entityId: 10,      // Exact match is very significant
    companyDomain: 8,  // Domain match is significant
    companyName: 6,    // Name match is important
    query: 4,          // Query similarity matters
    vertical: 3,       // Same vertical is relevant
    region: 2,         // Same region is relevant
  };

  for (const [field, weight] of Object.entries(fieldWeights)) {
    const currentVal = current[field];
    const pastVal = past[field];

    if (currentVal === undefined || pastVal === undefined) {
      continue;
    }

    weightSum += weight;

    let fieldScore = 0;

    if (typeof currentVal === 'string' && typeof pastVal === 'string') {
      if (field === 'entityId' && currentVal === pastVal) {
        fieldScore = 1;
      } else if (field === 'companyDomain') {
        fieldScore = domainSimilarity(currentVal, pastVal);
      } else {
        fieldScore = stringSimilarity(currentVal, pastVal);
      }
    } else if (currentVal === pastVal) {
      fieldScore = 1;
    }

    if (fieldScore > 0.5) {
      matchedFields.push(field);
    }

    totalScore += fieldScore * weight;
  }

  const normalizedScore = weightSum > 0 ? totalScore / weightSum : 0;

  // Determine match type
  let matchType: SimilarityScore['matchType'];
  if (normalizedScore >= 0.95) {
    matchType = 'exact';
  } else if (normalizedScore >= 0.7) {
    matchType = 'high';
  } else if (normalizedScore >= 0.4) {
    matchType = 'medium';
  } else if (normalizedScore >= 0.2) {
    matchType = 'low';
  } else {
    matchType = 'none';
  }

  return {
    score: normalizedScore,
    matchType,
    matchedFields,
  };
}

/**
 * Generate a fuzzy hash that can detect near-duplicates
 */
export function generateFuzzyHash(
  actionType: string,
  context: Record<string, unknown>
): string {
  // Extract key fields and normalize them
  const normalized: string[] = [actionType];

  if (context.companyName && typeof context.companyName === 'string') {
    normalized.push(context.companyName.toLowerCase().trim());
  }

  if (context.companyDomain && typeof context.companyDomain === 'string') {
    normalized.push(context.companyDomain.toLowerCase().replace(/^www\./, '').trim());
  }

  if (context.entityId && typeof context.entityId === 'string') {
    normalized.push(context.entityId);
  }

  if (context.vertical && typeof context.vertical === 'string') {
    normalized.push(context.vertical.toLowerCase());
  }

  // Create a hash of the normalized values
  const payload = normalized.sort().join('|');
  return createHash('md5').update(payload).digest('hex').substring(0, 16);
}

/**
 * Check if two actions are similar enough to warrant a warning
 */
export function shouldWarn(
  current: Record<string, unknown>,
  past: Record<string, unknown>,
  threshold: number = 0.6
): boolean {
  const similarity = calculateSimilarity(current, past);
  return similarity.score >= threshold;
}
