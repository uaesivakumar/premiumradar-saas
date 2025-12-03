/**
 * Vertical Intelligence Library - Sprint P3
 * Deep Vertical Intelligence Packs
 *
 * Central export for all vertical-specific intelligence modules.
 * Provides unified access to signals, scoring, patterns, personas, and prompts.
 */

// =============================================================================
// RE-EXPORTS
// =============================================================================

// Signals
export * from './signals';

// Scoring
export * from './scoring';

// Patterns
export * from './patterns';

// Personas
export * from './personas';

// Prompts
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
 * Analyze signals and return complete intelligence output
 */
export interface IntelligenceOutput {
  score: ScoringResult;
  patternMatches: ReturnType<typeof matchPatterns>;
  persona: ReturnType<typeof getDeepPersona>;
  sivaPrompt: string;
}

export function analyzeWithIntelligence(
  vertical: Vertical,
  signals: SignalMatch[],
  task: string = 'Analyze this opportunity'
): IntelligenceOutput {
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
  verticals: ['banking', 'insurance', 'real-estate', 'recruitment', 'saas-sales'] as Vertical[],
  features: [
    'Deep signal libraries (25-35 signals per vertical)',
    'Vertical-specific scoring engines',
    'Pattern matching for opportunity identification',
    'Deep persona packs with industry knowledge',
    'SIVA expert prompt packs',
    'Intelligence dashboard components',
  ],
} as const;
