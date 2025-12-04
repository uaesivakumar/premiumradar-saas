/**
 * Vertical Signal Libraries - Index
 * Sprint P3: Deep Vertical Intelligence Packs
 *
 * BANKING ONLY - Other verticals are UI placeholders.
 * Signals represent SALES OPPORTUNITY TRIGGERS from OS.
 */

import type { Vertical } from '../../intelligence/context/types';

// Re-export banking signals
export * from './banking';

// Import for unified access
import { BANKING_SIGNALS, BANKING_SCORING_CONFIG, type DeepSignal } from './banking';

// =============================================================================
// UNIFIED ACCESS
// =============================================================================

/**
 * Get all signals for a specific vertical
 * Currently only Banking is active - other verticals return empty array
 */
export function getSignalsForVertical(vertical: Vertical): DeepSignal[] {
  switch (vertical) {
    case 'banking':
      return BANKING_SIGNALS;
    // Other verticals are UI placeholders - no backend signals
    case 'insurance':
    case 'real-estate':
    case 'recruitment':
    case 'saas-sales':
    default:
      return [];
  }
}

/**
 * Get scoring configuration for a specific vertical
 * Currently only Banking is active
 */
export function getScoringConfigForVertical(vertical: Vertical) {
  switch (vertical) {
    case 'banking':
      return BANKING_SCORING_CONFIG;
    default:
      return null;
  }
}

/**
 * Get signal by ID (Banking signals only)
 */
export function getSignalById(id: string): DeepSignal | undefined {
  return BANKING_SIGNALS.find(s => s.id === id);
}

/**
 * Get signals by category (Banking only)
 */
export function getSignalsByCategory(category: DeepSignal['category']): DeepSignal[] {
  return BANKING_SIGNALS.filter(s => s.category === category);
}

/**
 * Get total signal count per vertical
 */
export function getSignalCounts(): Record<Vertical, number> {
  return {
    'banking': BANKING_SIGNALS.length,
    // Other verticals have no active signals
    'insurance': 0,
    'real-estate': 0,
    'recruitment': 0,
    'saas-sales': 0,
  };
}

/**
 * Vertical signal library metadata
 */
export const SIGNAL_LIBRARY_METADATA = {
  version: '1.0.0',
  lastUpdated: '2024-12-03',
  totalSignals: BANKING_SIGNALS.length,
  activeVerticals: ['banking'] as Vertical[],
  placeholderVerticals: ['insurance', 'real-estate', 'recruitment', 'saas-sales'] as Vertical[],
} as const;
