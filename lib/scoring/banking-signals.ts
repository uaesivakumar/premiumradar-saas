/**
 * Banking-Specific Signals & KPIs
 *
 * Industry-specific data points and indicators for the banking vertical.
 * Includes digital transformation, regulatory, competitive, and market signals.
 */

import type { BankingSignal, BankingCompanyProfile, IndustryAdjustments } from './types';

/**
 * Banking Industry Adjustments for Q/T/L/E Scoring
 */
export const BANKING_ADJUSTMENTS: IndustryAdjustments = {
  banking: {
    qualitySignals: [
      'digital-maturity-score',
      'regulatory-compliance-status',
      'technology-stack-modernity',
      'customer-base-size',
      'branch-network-density',
    ],
    timingSignals: [
      'core-banking-renewal-cycle',
      'regulatory-deadline-approaching',
      'competitor-launch-detected',
      'budget-cycle-alignment',
      'leadership-change',
    ],
    baseWeight: 1.15, // Banking gets 15% boost due to high-value deals
  },
  fintech: {
    qualitySignals: [
      'funding-stage',
      'growth-rate',
      'technology-innovation-score',
      'partnership-network',
    ],
    timingSignals: [
      'funding-round-announced',
      'product-launch-imminent',
      'regulatory-approval-pending',
    ],
    baseWeight: 1.10,
  },
};

/**
 * Banking-Specific KPI Definitions
 */
export const BANKING_KPIS = {
  // Digital Transformation KPIs
  digitalMaturity: {
    id: 'digital-maturity-score',
    name: 'Digital Maturity Score',
    category: 'quality' as const,
    description: 'Assessment of digital capabilities and transformation progress',
    weight: 0.25,
    thresholds: {
      leader: 80,
      fastFollower: 60,
      mainstream: 40,
      laggard: 0,
    },
  },

  // Regulatory KPIs
  regulatoryCompliance: {
    id: 'regulatory-compliance-status',
    name: 'Regulatory Compliance Status',
    category: 'quality' as const,
    description: 'Current regulatory standing and compliance trajectory',
    weight: 0.20,
    thresholds: {
      compliant: 90,
      transitioning: 60,
      atRisk: 30,
    },
  },

  // Technology KPIs
  coreBankingAge: {
    id: 'core-banking-system-age',
    name: 'Core Banking System Age',
    category: 'timing' as const,
    description: 'Age of current core banking system (older = higher timing score)',
    weight: 0.30,
    thresholds: {
      legacy: 15, // 15+ years
      aging: 10,
      modern: 5,
      new: 0,
    },
  },

  // Market KPIs
  marketPosition: {
    id: 'market-position-rank',
    name: 'Market Position Rank',
    category: 'quality' as const,
    description: 'Relative market position in their segment',
    weight: 0.15,
    thresholds: {
      leader: 1,
      challenger: 5,
      follower: 10,
    },
  },

  // Competitive KPIs
  competitorAdoption: {
    id: 'competitor-tech-adoption',
    name: 'Competitor Technology Adoption',
    category: 'timing' as const,
    description: 'Whether competitors have adopted similar solutions',
    weight: 0.25,
    thresholds: {
      widespread: 80, // Most competitors have it
      emerging: 50,
      early: 20,
      none: 0,
    },
  },
};

/**
 * Signal Factory for Banking Vertical
 */
export function createBankingSignal(
  params: Partial<BankingSignal> & Pick<BankingSignal, 'id' | 'name' | 'category' | 'value'>
): BankingSignal {
  return {
    weight: 0.5,
    impact: 'positive',
    source: 'manual',
    timestamp: new Date(),
    description: '',
    bankingCategory: 'market',
    urgencyLevel: 'medium',
    ...params,
  };
}

/**
 * Pre-defined Banking Signals Library
 */
export const BANKING_SIGNAL_LIBRARY: Record<string, Omit<BankingSignal, 'value' | 'timestamp'>> = {
  // Digital Transformation Signals
  digitalBankingLaunch: {
    id: 'digital-banking-launch',
    name: 'Digital Banking Platform Launch',
    category: 'timing',
    weight: 0.8,
    impact: 'positive',
    source: 'news',
    description: 'Recently launched or planning digital banking platform',
    bankingCategory: 'digital-transformation',
    urgencyLevel: 'high',
  },

  legacyModernization: {
    id: 'legacy-modernization-initiative',
    name: 'Legacy Modernization Initiative',
    category: 'timing',
    weight: 0.9,
    impact: 'positive',
    source: 'news',
    description: 'Announced legacy system modernization project',
    bankingCategory: 'digital-transformation',
    urgencyLevel: 'critical',
  },

  cloudMigration: {
    id: 'cloud-migration-program',
    name: 'Cloud Migration Program',
    category: 'timing',
    weight: 0.7,
    impact: 'positive',
    source: 'news',
    description: 'Active cloud migration or cloud-first strategy announced',
    bankingCategory: 'technology',
    urgencyLevel: 'high',
  },

  // Regulatory Signals
  regulatoryDeadline: {
    id: 'regulatory-deadline-approaching',
    name: 'Regulatory Deadline Approaching',
    category: 'timing',
    weight: 0.95,
    impact: 'positive',
    source: 'regulatory',
    description: 'Compliance deadline within 12 months',
    bankingCategory: 'regulatory',
    urgencyLevel: 'critical',
  },

  openBankingCompliance: {
    id: 'open-banking-compliance',
    name: 'Open Banking Compliance',
    category: 'quality',
    weight: 0.6,
    impact: 'positive',
    source: 'regulatory',
    description: 'Open banking API compliance status',
    bankingCategory: 'regulatory',
    urgencyLevel: 'medium',
  },

  // Competitive Signals
  competitorWin: {
    id: 'competitor-deal-lost',
    name: 'Lost Deal to Competitor',
    category: 'likelihood',
    weight: 0.7,
    impact: 'negative',
    source: 'crm',
    description: 'Previously lost deal - may be reconsidering',
    bankingCategory: 'competitive',
    urgencyLevel: 'medium',
  },

  competitorProduct: {
    id: 'competitor-product-launch',
    name: 'Competitor Product Launch',
    category: 'timing',
    weight: 0.6,
    impact: 'positive',
    source: 'news',
    description: 'Competitor launched similar product - pressure to respond',
    bankingCategory: 'competitive',
    urgencyLevel: 'high',
  },

  // Market Signals
  marketExpansion: {
    id: 'market-expansion-announced',
    name: 'Market Expansion Announced',
    category: 'timing',
    weight: 0.75,
    impact: 'positive',
    source: 'news',
    description: 'Expanding into new markets or segments',
    bankingCategory: 'market',
    urgencyLevel: 'high',
  },

  leadershipChange: {
    id: 'c-level-change',
    name: 'C-Level Leadership Change',
    category: 'timing',
    weight: 0.85,
    impact: 'positive',
    source: 'news',
    description: 'New CTO, CIO, or CDO appointed',
    bankingCategory: 'market',
    urgencyLevel: 'critical',
  },

  budgetApproval: {
    id: 'budget-cycle-q4',
    name: 'Budget Planning Cycle',
    category: 'timing',
    weight: 0.7,
    impact: 'positive',
    source: 'calendar',
    description: 'Entering annual budget planning period',
    bankingCategory: 'market',
    urgencyLevel: 'high',
  },

  // Engagement Signals
  websiteVisit: {
    id: 'website-visit-high-intent',
    name: 'High-Intent Website Visit',
    category: 'engagement',
    weight: 0.6,
    impact: 'positive',
    source: 'analytics',
    description: 'Visited pricing or demo pages',
    bankingCategory: 'market',
    urgencyLevel: 'medium',
  },

  contentDownload: {
    id: 'whitepaper-download',
    name: 'Content Download',
    category: 'engagement',
    weight: 0.5,
    impact: 'positive',
    source: 'marketing',
    description: 'Downloaded banking-specific content',
    bankingCategory: 'market',
    urgencyLevel: 'low',
  },

  eventAttendance: {
    id: 'banking-event-attended',
    name: 'Banking Event Attendance',
    category: 'engagement',
    weight: 0.7,
    impact: 'positive',
    source: 'events',
    description: 'Attended banking industry event or webinar',
    bankingCategory: 'market',
    urgencyLevel: 'medium',
  },
};

/**
 * Calculate banking-specific score adjustments
 */
export function applyBankingAdjustments(
  profile: BankingCompanyProfile,
  baseScore: number
): { adjustedScore: number; reasons: string[] } {
  let adjustedScore = baseScore;
  const reasons: string[] = [];

  // Tier adjustment
  switch (profile.bankingTier) {
    case 'tier1':
      adjustedScore *= 1.2;
      reasons.push('Tier 1 bank - high strategic value');
      break;
    case 'tier2':
      adjustedScore *= 1.1;
      reasons.push('Tier 2 bank - strong growth potential');
      break;
    case 'challenger':
      adjustedScore *= 1.15;
      reasons.push('Challenger bank - technology-forward, fast decisions');
      break;
    case 'fintech':
      adjustedScore *= 1.1;
      reasons.push('Fintech - agile procurement, innovation focus');
      break;
  }

  // Digital maturity adjustment
  if (profile.digitalMaturity === 'laggard') {
    adjustedScore *= 1.25;
    reasons.push('Digital laggard - high transformation urgency');
  } else if (profile.digitalMaturity === 'leader') {
    adjustedScore *= 0.9;
    reasons.push('Digital leader - may have existing solutions');
  }

  // Regulatory pressure adjustment
  if (profile.regulatoryStatus === 'at-risk') {
    adjustedScore *= 1.3;
    reasons.push('Regulatory pressure - urgent compliance need');
  }

  return {
    adjustedScore: Math.min(100, Math.round(adjustedScore)),
    reasons,
  };
}
