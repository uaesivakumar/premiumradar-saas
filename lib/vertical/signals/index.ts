/**
 * Vertical Signal Libraries - Index
 * Sprint P3: Deep Vertical Intelligence Packs
 *
 * Central export for all vertical-specific signal libraries.
 * Each vertical has 25-35 premium-grade signals with scoring configurations.
 */

import type { Vertical } from '../../intelligence/context/types';

// Re-export all signal libraries
export * from './banking';
export * from './insurance';
export * from './real-estate';
export * from './recruitment';
export * from './saas-sales';

// Import for unified access
import { BANKING_SIGNALS, BANKING_SCORING_CONFIG, type DeepSignal } from './banking';
import { INSURANCE_SIGNALS, INSURANCE_SCORING_CONFIG } from './insurance';
import { REAL_ESTATE_SIGNALS, REAL_ESTATE_SCORING_CONFIG } from './real-estate';
import { RECRUITMENT_SIGNALS, RECRUITMENT_SCORING_CONFIG } from './recruitment';
import { SAAS_SALES_SIGNALS, SAAS_SALES_SCORING_CONFIG } from './saas-sales';

// =============================================================================
// UNIFIED ACCESS
// =============================================================================

/**
 * Get all signals for a specific vertical
 */
export function getSignalsForVertical(vertical: Vertical): DeepSignal[] {
  switch (vertical) {
    case 'banking':
      return BANKING_SIGNALS;
    case 'insurance':
      return INSURANCE_SIGNALS;
    case 'real-estate':
      return REAL_ESTATE_SIGNALS;
    case 'recruitment':
      return RECRUITMENT_SIGNALS;
    case 'saas-sales':
      return SAAS_SALES_SIGNALS;
    default:
      return [];
  }
}

/**
 * Get scoring configuration for a specific vertical
 */
export function getScoringConfigForVertical(vertical: Vertical) {
  switch (vertical) {
    case 'banking':
      return BANKING_SCORING_CONFIG;
    case 'insurance':
      return INSURANCE_SCORING_CONFIG;
    case 'real-estate':
      return REAL_ESTATE_SCORING_CONFIG;
    case 'recruitment':
      return RECRUITMENT_SCORING_CONFIG;
    case 'saas-sales':
      return SAAS_SALES_SCORING_CONFIG;
    default:
      return null;
  }
}

/**
 * Get signal by ID across all verticals
 */
export function getSignalById(id: string): DeepSignal | undefined {
  const allSignals = [
    ...BANKING_SIGNALS,
    ...INSURANCE_SIGNALS,
    ...REAL_ESTATE_SIGNALS,
    ...RECRUITMENT_SIGNALS,
    ...SAAS_SALES_SIGNALS,
  ];
  return allSignals.find(s => s.id === id);
}

/**
 * Get signals by category across all verticals
 */
export function getSignalsByCategory(category: DeepSignal['category']): DeepSignal[] {
  const allSignals = [
    ...BANKING_SIGNALS,
    ...INSURANCE_SIGNALS,
    ...REAL_ESTATE_SIGNALS,
    ...RECRUITMENT_SIGNALS,
    ...SAAS_SALES_SIGNALS,
  ];
  return allSignals.filter(s => s.category === category);
}

/**
 * Get total signal count per vertical
 */
export function getSignalCounts(): Record<Vertical, number> {
  return {
    'banking': BANKING_SIGNALS.length,
    'insurance': INSURANCE_SIGNALS.length,
    'real-estate': REAL_ESTATE_SIGNALS.length,
    'recruitment': RECRUITMENT_SIGNALS.length,
    'saas-sales': SAAS_SALES_SIGNALS.length,
  };
}

/**
 * Vertical signal library metadata
 */
export const SIGNAL_LIBRARY_METADATA = {
  version: '1.0.0',
  lastUpdated: '2024-12-03',
  totalSignals:
    BANKING_SIGNALS.length +
    INSURANCE_SIGNALS.length +
    REAL_ESTATE_SIGNALS.length +
    RECRUITMENT_SIGNALS.length +
    SAAS_SALES_SIGNALS.length,
  verticals: ['banking', 'insurance', 'real-estate', 'recruitment', 'saas-sales'] as Vertical[],
} as const;
