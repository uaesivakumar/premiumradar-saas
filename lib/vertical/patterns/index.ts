/**
 * Vertical Intelligence Patterns - Sprint P3
 * Deep Vertical Intelligence Packs
 *
 * BANKING ONLY - Other verticals are UI placeholders.
 * Pattern-matching rules that identify high-value opportunities
 * based on combinations of sales trigger signals.
 */

import type { Vertical } from '../../intelligence/context/types';
import type { SignalMatch } from '../scoring';

// =============================================================================
// TYPES
// =============================================================================

export interface IntelligencePattern {
  id: string;
  name: string;
  description: string;
  vertical: Vertical;
  priority: 'critical' | 'high' | 'medium' | 'low';
  requiredSignals: string[]; // Signal IDs that MUST be present
  optionalSignals: string[]; // Signal IDs that boost the pattern
  minSignalCount: number;
  maxAgedays: number; // Pattern only valid if signals within this window
  insight: string; // What this pattern means for the sales rep
  suggestedAction: string; // Recommended action
  scoreBoost: number; // Additional score boost when pattern matches
}

export interface PatternMatch {
  pattern: IntelligencePattern;
  matchedSignals: SignalMatch[];
  matchStrength: number; // 0-1, how well signals match the pattern
  insight: string;
  suggestedAction: string;
  detectedAt: Date;
}

// =============================================================================
// BANKING PATTERNS (Sales Trigger Based)
// =============================================================================

export const BANKING_PATTERNS: IntelligencePattern[] = [
  {
    id: 'bank-expansion-payroll',
    name: 'Expansion + Payroll Opportunity',
    description: 'Company expanding rapidly and likely needs payroll banking',
    vertical: 'banking',
    priority: 'critical',
    requiredSignals: ['bank-hiring-expansion', 'bank-headcount-jump'],
    optionalSignals: ['bank-office-opening', 'bank-market-entry', 'bank-funding-round'],
    minSignalCount: 2,
    maxAgedays: 60,
    insight: 'This company is growing fast and will need payroll banking for new employees. They may be outgrowing their current banking setup.',
    suggestedAction: 'Reach out with employee banking solution highlighting onboarding speed and WPS compliance.',
    scoreBoost: 15,
  },
  {
    id: 'bank-new-market-entry',
    name: 'New Market Banking Need',
    description: 'Company entering UAE market and needs local banking',
    vertical: 'banking',
    priority: 'critical',
    requiredSignals: ['bank-market-entry'],
    optionalSignals: ['bank-subsidiary-creation', 'bank-office-opening', 'bank-license-application'],
    minSignalCount: 1,
    maxAgedays: 90,
    insight: 'Company entering UAE market will need local banking relationships, regulatory compliance support, and cross-border capabilities.',
    suggestedAction: 'Lead with regional expertise and regulatory compliance capabilities.',
    scoreBoost: 18,
  },
  {
    id: 'bank-leadership-change',
    name: 'New CFO/Treasury Leadership',
    description: 'New financial leadership likely to review banking relationships',
    vertical: 'banking',
    priority: 'high',
    requiredSignals: ['bank-cxo-change'],
    optionalSignals: ['bank-strategy-announcement', 'bank-funding-round'],
    minSignalCount: 1,
    maxAgedays: 90,
    insight: 'New financial leadership often reviews and consolidates banking relationships. Prime time to introduce your services.',
    suggestedAction: 'Request introductory meeting with new CFO/Treasury leader within 30 days of their start.',
    scoreBoost: 10,
  },
  {
    id: 'bank-funding-growth',
    name: 'Post-Funding Growth Phase',
    description: 'Recently funded company with growth capital to deploy',
    vertical: 'banking',
    priority: 'high',
    requiredSignals: ['bank-funding-round'],
    optionalSignals: ['bank-hiring-expansion', 'bank-headcount-jump', 'bank-office-opening'],
    minSignalCount: 2,
    maxAgedays: 120,
    insight: 'Freshly funded companies are expanding and need sophisticated banking to manage new capital and growing operations.',
    suggestedAction: 'Emphasize treasury management, foreign exchange, and growth-stage banking expertise.',
    scoreBoost: 14,
  },
  {
    id: 'bank-project-award',
    name: 'Major Project Award',
    description: 'Company won significant contract requiring cash flow support',
    vertical: 'banking',
    priority: 'high',
    requiredSignals: ['bank-project-award'],
    optionalSignals: ['bank-hiring-expansion', 'bank-office-opening'],
    minSignalCount: 1,
    maxAgedays: 60,
    insight: 'Major project wins create cash flow and working capital needs. Company may need trade finance or credit facilities.',
    suggestedAction: 'Lead with working capital solutions and project financing expertise.',
    scoreBoost: 12,
  },
];

// =============================================================================
// PATTERN ACCESS FUNCTIONS
// =============================================================================

/**
 * Get all patterns for a vertical
 * Currently only Banking is active
 */
export function getPatternsForVertical(vertical: Vertical): IntelligencePattern[] {
  switch (vertical) {
    case 'banking':
      return BANKING_PATTERNS;
    // Other verticals are UI placeholders
    case 'insurance':
    case 'real-estate':
    case 'recruitment':
    case 'saas-sales':
    default:
      return [];
  }
}

/**
 * Get pattern by ID (Banking patterns only)
 */
export function getPatternById(id: string): IntelligencePattern | undefined {
  return BANKING_PATTERNS.find(p => p.id === id);
}

/**
 * Get patterns by priority for a vertical
 */
export function getPatternsByPriority(
  vertical: Vertical,
  priority: IntelligencePattern['priority']
): IntelligencePattern[] {
  return getPatternsForVertical(vertical).filter(p => p.priority === priority);
}

// =============================================================================
// PATTERN MATCHING ENGINE
// =============================================================================

/**
 * Match signals against patterns for a vertical
 */
export function matchPatterns(
  vertical: Vertical,
  signals: SignalMatch[]
): PatternMatch[] {
  const patterns = getPatternsForVertical(vertical);
  const matches: PatternMatch[] = [];

  for (const pattern of patterns) {
    const match = matchSinglePattern(pattern, signals);
    if (match) {
      matches.push(match);
    }
  }

  // Sort by match strength descending
  return matches.sort((a, b) => b.matchStrength - a.matchStrength);
}

/**
 * Match signals against a single pattern
 */
function matchSinglePattern(
  pattern: IntelligencePattern,
  signals: SignalMatch[]
): PatternMatch | null {
  const signalIds = signals.map(s => s.signal.id);
  const matchedSignalIds: string[] = [];

  // Check required signals
  for (const requiredId of pattern.requiredSignals) {
    if (!signalIds.includes(requiredId)) {
      return null; // Missing required signal
    }
    matchedSignalIds.push(requiredId);
  }

  // Check optional signals
  for (const optionalId of pattern.optionalSignals) {
    if (signalIds.includes(optionalId)) {
      matchedSignalIds.push(optionalId);
    }
  }

  // Check minimum signal count
  if (matchedSignalIds.length < pattern.minSignalCount) {
    return null;
  }

  // Check signal age
  const matchedSignals = signals.filter(s =>
    matchedSignalIds.includes(s.signal.id)
  );
  const maxAge = pattern.maxAgedays * 24 * 60 * 60 * 1000;
  const allWithinAge = matchedSignals.every(
    s => Date.now() - s.detectedAt.getTime() <= maxAge
  );
  if (!allWithinAge) {
    return null;
  }

  // Calculate match strength
  const optionalCount = pattern.optionalSignals.length;
  const matchedOptional = matchedSignalIds.filter(id =>
    pattern.optionalSignals.includes(id)
  ).length;

  const requiredWeight = 0.6;
  const optionalWeight = 0.4;

  const matchStrength =
    requiredWeight +
    (optionalCount > 0
      ? optionalWeight * (matchedOptional / optionalCount)
      : optionalWeight);

  return {
    pattern,
    matchedSignals,
    matchStrength,
    insight: pattern.insight,
    suggestedAction: pattern.suggestedAction,
    detectedAt: new Date(),
  };
}

/**
 * Get top pattern matches for a vertical
 */
export function getTopPatternMatches(
  vertical: Vertical,
  signals: SignalMatch[],
  limit: number = 3
): PatternMatch[] {
  return matchPatterns(vertical, signals).slice(0, limit);
}

// =============================================================================
// METADATA
// =============================================================================

export const PATTERN_LIBRARY_METADATA = {
  version: '1.0.0',
  lastUpdated: '2024-12-03',
  totalPatterns: BANKING_PATTERNS.length,
  activeVerticals: ['banking'],
  placeholderVerticals: ['insurance', 'real-estate', 'recruitment', 'saas-sales'],
} as const;
