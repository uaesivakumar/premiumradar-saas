/**
 * Vertical Intelligence Library - Sprint P3
 * Deep Vertical Intelligence Packs
 *
 * BANKING ONLY - Other verticals are UI placeholders.
 * Central export for all vertical-specific intelligence modules.
 */

// =============================================================================
// RE-EXPORTS
// =============================================================================

// Signals (Banking only)
export * from './signals';

// Scoring
export * from './scoring';

// Patterns (Banking only)
export * from './patterns';

// Personas (Banking only)
export * from './personas';

// Prompts (Banking only)
export * from './prompts';

// Content (existing)
export * from './content';

// =============================================================================
// UNIFIED ACCESS
// =============================================================================

import type { Vertical } from '../intelligence/context/types';
import { getSignalsForVertical, getScoringConfigForVertical, SIGNAL_LIBRARY_METADATA } from './signals';
import { createScoringEngine, type ScoringResult, type SignalMatch } from './scoring';
import { getPatternsForVertical, matchPatterns, PATTERN_LIBRARY_METADATA } from './patterns';
import { getDeepPersona, DEEP_PERSONA_METADATA } from './personas';
import { getPromptPack, buildSIVAPrompt, PROMPT_PACK_METADATA } from './prompts';

/**
 * Complete vertical intelligence context
 * Returns null for non-banking verticals
 */
export interface VerticalIntelligenceContext {
  vertical: Vertical;
  signals: ReturnType<typeof getSignalsForVertical>;
  scoringConfig: ReturnType<typeof getScoringConfigForVertical>;
  patterns: ReturnType<typeof getPatternsForVertical>;
  persona: ReturnType<typeof getDeepPersona>;
  promptPack: ReturnType<typeof getPromptPack>;
}

/**
 * Get complete intelligence context for a vertical
 * Currently only returns full context for Banking
 * Other verticals return empty/null values (UI placeholders)
 */
export function getVerticalIntelligence(vertical: Vertical): VerticalIntelligenceContext {
  return {
    vertical,
    signals: getSignalsForVertical(vertical),
    scoringConfig: getScoringConfigForVertical(vertical),
    patterns: getPatternsForVertical(vertical),
    persona: getDeepPersona(vertical),
    promptPack: getPromptPack(vertical),
  };
}

/**
 * Check if a vertical has active backend intelligence
 * Currently only Banking is active
 */
export function isVerticalActive(vertical: Vertical): boolean {
  return vertical === 'banking';
}

/**
 * Analyze signals and return complete intelligence output
 * Only works for Banking vertical
 */
export interface IntelligenceOutput {
  score: ScoringResult;
  patternMatches: ReturnType<typeof matchPatterns>;
  persona: ReturnType<typeof getDeepPersona>;
  sivaPrompt: string | null;
}

export function analyzeWithIntelligence(
  vertical: Vertical,
  signals: SignalMatch[],
  task: string = 'Analyze this opportunity'
): IntelligenceOutput | null {
  // Only Banking has active intelligence
  if (!isVerticalActive(vertical)) {
    return null;
  }

  // Score the signals
  const engine = createScoringEngine(vertical);
  const score = engine.calculate({ vertical, signals });

  // Match patterns
  const patternMatches = matchPatterns(vertical, signals);

  // Get persona
  const persona = getDeepPersona(vertical);

  // Build SIVA prompt
  const sivaPrompt = buildSIVAPrompt(vertical, {
    signals: signals.map(s => s.signal.name),
    task,
  });

  return {
    score,
    patternMatches,
    persona,
    sivaPrompt,
  };
}

// =============================================================================
// LIBRARY METADATA
// =============================================================================

export const VERTICAL_INTELLIGENCE_METADATA = {
  version: '1.0.0',
  lastUpdated: '2024-12-03',
  modules: {
    signals: SIGNAL_LIBRARY_METADATA,
    patterns: PATTERN_LIBRARY_METADATA,
    personas: DEEP_PERSONA_METADATA,
    prompts: PROMPT_PACK_METADATA,
  },
  activeVerticals: ['banking'] as Vertical[],
  placeholderVerticals: ['insurance', 'real-estate', 'recruitment', 'saas-sales'] as Vertical[],
  features: [
    'Banking signal library (sales triggers from OS)',
    'Banking-specific scoring engine',
    'Banking pattern matching for opportunity identification',
    'Banking deep persona with industry knowledge',
    'Banking SIVA prompt pack',
  ],
} as const;
