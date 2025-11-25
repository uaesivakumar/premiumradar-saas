/**
 * Regional Weighting System
 *
 * UAE/GCC market-specific adjustments for Q/T/L/E scoring.
 * Accounts for regional business practices, market maturity, and cultural factors.
 */

import type { RegionalMultipliers } from './types';

/**
 * GCC Regional Multipliers
 *
 * These multipliers adjust scoring based on regional characteristics:
 * - qualityBoost: Market size and enterprise density
 * - timingBoost: Urgency factors (Vision 2030, regulatory push)
 * - marketMaturity: How established the B2B tech market is
 */
export const GCC_REGIONAL_MULTIPLIERS: RegionalMultipliers = {
  // United Arab Emirates
  UAE: {
    qualityBoost: 1.25,      // High enterprise density, international HQs
    timingBoost: 1.30,       // Vision 2031, aggressive digital transformation
    marketMaturity: 0.95,    // Very mature market
  },
  'UAE-Dubai': {
    qualityBoost: 1.30,      // Financial hub, highest enterprise concentration
    timingBoost: 1.35,       // DIFC regulations, fintech push
    marketMaturity: 1.0,     // Most mature in region
  },
  'UAE-AbuDhabi': {
    qualityBoost: 1.25,      // Government entities, sovereign wealth
    timingBoost: 1.25,       // Hub71, government digitization
    marketMaturity: 0.90,
  },

  // Saudi Arabia
  'KSA': {
    qualityBoost: 1.35,      // Largest market by population and spending
    timingBoost: 1.40,       // Vision 2030, massive transformation
    marketMaturity: 0.85,    // Rapidly maturing
  },
  'KSA-Riyadh': {
    qualityBoost: 1.40,      // Capital, government HQ
    timingBoost: 1.45,       // Highest urgency in region
    marketMaturity: 0.90,
  },

  // Qatar
  'Qatar': {
    qualityBoost: 1.20,      // Small but wealthy market
    timingBoost: 1.15,       // Post-World Cup momentum
    marketMaturity: 0.80,
  },

  // Bahrain
  'Bahrain': {
    qualityBoost: 1.15,      // Regional banking hub
    timingBoost: 1.20,       // Fintech regulations, sandbox
    marketMaturity: 0.85,
  },

  // Kuwait
  'Kuwait': {
    qualityBoost: 1.10,      // Established market
    timingBoost: 1.05,       // Slower transformation pace
    marketMaturity: 0.75,
  },

  // Oman
  'Oman': {
    qualityBoost: 1.05,      // Smaller enterprise market
    timingBoost: 1.10,       // Vision 2040 push
    marketMaturity: 0.70,
  },

  // Default for unspecified regions
  'DEFAULT': {
    qualityBoost: 1.0,
    timingBoost: 1.0,
    marketMaturity: 1.0,
  },
};

/**
 * UAE-Specific Banking Timing Signals
 */
export const UAE_TIMING_SIGNALS = {
  // Regulatory Timelines
  CBUAE_OPEN_BANKING: {
    name: 'CBUAE Open Banking Deadline',
    deadline: new Date('2025-06-01'),
    urgencyMultiplier: 1.5,
    description: 'Central Bank UAE open banking framework compliance',
  },
  FATF_COMPLIANCE: {
    name: 'FATF Compliance Review',
    deadline: new Date('2025-03-01'),
    urgencyMultiplier: 1.4,
    description: 'Anti-money laundering compliance review',
  },

  // Government Initiatives
  UAE_PASS_INTEGRATION: {
    name: 'UAE Pass Integration',
    deadline: new Date('2025-12-31'),
    urgencyMultiplier: 1.2,
    description: 'Digital identity integration requirement',
  },

  // Budget Cycles
  Q4_BUDGET_PLANNING: {
    name: 'Q4 Budget Planning',
    months: [9, 10, 11], // Oct-Dec
    urgencyMultiplier: 1.3,
    description: 'Annual budget planning period',
  },
  Q1_BUDGET_RELEASE: {
    name: 'Q1 Budget Release',
    months: [0, 1, 2], // Jan-Mar
    urgencyMultiplier: 1.25,
    description: 'New fiscal year budget available',
  },
};

/**
 * Calculate regional timing boost based on current date and deadlines
 */
export function calculateRegionalTimingBoost(region: string): number {
  const baseMultiplier = GCC_REGIONAL_MULTIPLIERS[region]?.timingBoost || 1.0;

  // Check for UAE-specific deadline urgency
  if (region.startsWith('UAE')) {
    const now = new Date();
    let urgencyBoost = 0;

    // Check regulatory deadlines
    for (const signal of Object.values(UAE_TIMING_SIGNALS)) {
      if ('deadline' in signal) {
        const daysUntilDeadline = Math.floor(
          (signal.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilDeadline > 0 && daysUntilDeadline <= 180) {
          // Within 6 months of deadline
          urgencyBoost = Math.max(urgencyBoost, (signal.urgencyMultiplier - 1) * (1 - daysUntilDeadline / 180));
        }
      }

      // Check budget cycle months
      if ('months' in signal && signal.months.includes(now.getMonth())) {
        urgencyBoost = Math.max(urgencyBoost, signal.urgencyMultiplier - 1);
      }
    }

    return baseMultiplier + urgencyBoost;
  }

  return baseMultiplier;
}

/**
 * Get regional context for scoring explanation
 */
export function getRegionalContext(region: string): string[] {
  const context: string[] = [];
  const multipliers = GCC_REGIONAL_MULTIPLIERS[region];

  if (!multipliers) {
    return ['Standard regional weighting applied'];
  }

  if (multipliers.qualityBoost > 1.2) {
    context.push(`${region}: High enterprise density market`);
  }

  if (multipliers.timingBoost > 1.2) {
    context.push(`${region}: Active digital transformation initiatives`);
  }

  if (region.startsWith('UAE') || region.startsWith('KSA')) {
    context.push('GCC Vision programs driving technology investment');
  }

  if (region === 'UAE-Dubai' || region === 'Bahrain') {
    context.push('Regional banking/fintech hub with favorable regulations');
  }

  return context;
}

/**
 * B2B Adjustment factors for banking in UAE
 */
export const UAE_B2B_BANKING_ADJUSTMENTS = {
  // Company size multipliers (banking context)
  companySize: {
    enterprise: 1.3,       // Large banks, government
    'mid-market': 1.2,     // Regional banks
    smb: 1.0,              // Smaller financial institutions
    startup: 0.9,          // Fintechs (lower deal size)
  },

  // Decision-making speed by entity type
  decisionSpeed: {
    privateBank: 0.8,      // Faster decisions
    governmentBank: 1.5,   // Longer cycles
    internationalBank: 1.0, // Standard
    fintech: 0.6,          // Fastest
  },

  // Typical deal cycle length (months)
  dealCycle: {
    tier1Bank: 12,
    tier2Bank: 9,
    challengerBank: 6,
    fintech: 3,
  },
};
