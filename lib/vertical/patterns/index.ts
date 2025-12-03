/**
 * Vertical Intelligence Patterns - Sprint P3
 * Deep Vertical Intelligence Packs
 *
 * Pattern-matching rules that identify high-value opportunities
 * based on combinations of signals. Each vertical has unique patterns.
 */

import type { Vertical } from '../../intelligence/context/types';
import type { DeepSignal } from '../signals';
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
// BANKING PATTERNS
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
    id: 'bank-digital-transformation',
    name: 'Digital Transformation Initiative',
    description: 'Company investing heavily in digital banking capabilities',
    vertical: 'banking',
    priority: 'high',
    requiredSignals: ['bank-digital-transformation'],
    optionalSignals: ['bank-core-banking-renewal', 'bank-fintech-partnership', 'bank-open-banking-api'],
    minSignalCount: 2,
    maxAgedays: 90,
    insight: 'Company is modernizing their operations and likely open to new banking partnerships that support digital-first workflows.',
    suggestedAction: 'Position digital banking features and API integrations as key differentiators.',
    scoreBoost: 12,
  },
  {
    id: 'bank-new-market-entry',
    name: 'New Market Banking Need',
    description: 'Company entering new market and needs local banking',
    vertical: 'banking',
    priority: 'critical',
    requiredSignals: ['bank-market-entry'],
    optionalSignals: ['bank-subsidiary-creation', 'bank-office-opening', 'bank-license-application'],
    minSignalCount: 1,
    maxAgedays: 90,
    insight: 'Company entering new market will need local banking relationships, regulatory compliance support, and cross-border capabilities.',
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
];

// =============================================================================
// INSURANCE PATTERNS
// =============================================================================

export const INSURANCE_PATTERNS: IntelligencePattern[] = [
  {
    id: 'ins-new-family-coverage',
    name: 'Growing Family Protection Need',
    description: 'Individual with growing family needs comprehensive coverage',
    vertical: 'insurance',
    priority: 'critical',
    requiredSignals: ['ins-new-parent'],
    optionalSignals: ['ins-marriage', 'ins-home-purchase', 'ins-salary-increase'],
    minSignalCount: 1,
    maxAgedays: 120,
    insight: 'New parents are highly receptive to life insurance and often underestimate their coverage needs. Critical window for protection planning.',
    suggestedAction: 'Lead with family protection messaging and income replacement calculations.',
    scoreBoost: 20,
  },
  {
    id: 'ins-life-transition-bundle',
    name: 'Major Life Transition',
    description: 'Individual experiencing multiple life changes simultaneously',
    vertical: 'insurance',
    priority: 'critical',
    requiredSignals: ['ins-marriage'],
    optionalSignals: ['ins-home-purchase', 'ins-job-change', 'ins-salary-increase'],
    minSignalCount: 2,
    maxAgedays: 90,
    insight: 'Multiple life transitions indicate comprehensive insurance review is needed. Bundle opportunity.',
    suggestedAction: 'Offer comprehensive coverage review addressing all life changes at once.',
    scoreBoost: 18,
  },
  {
    id: 'ins-wealth-protection',
    name: 'High Net Worth Protection',
    description: 'Affluent individual needing sophisticated coverage',
    vertical: 'insurance',
    priority: 'high',
    requiredSignals: ['ins-high-net-worth'],
    optionalSignals: ['ins-luxury-purchase', 'ins-home-purchase', 'ins-self-employed'],
    minSignalCount: 2,
    maxAgedays: 180,
    insight: 'High net worth individuals need specialized coverage including umbrella policies, wealth transfer, and asset protection.',
    suggestedAction: 'Position premium products and wealth management integration.',
    scoreBoost: 15,
  },
  {
    id: 'ins-policy-shopping',
    name: 'Active Policy Shopping',
    description: 'Individual actively comparing insurance options',
    vertical: 'insurance',
    priority: 'critical',
    requiredSignals: ['ins-comparison-shopping'],
    optionalSignals: ['ins-policy-expiring', 'ins-rate-increase', 'ins-quote-request'],
    minSignalCount: 1,
    maxAgedays: 30,
    insight: 'Individual is actively in buying mode. Short window before they commit to a competitor.',
    suggestedAction: 'Immediate outreach with competitive quote. Speed is critical.',
    scoreBoost: 22,
  },
  {
    id: 'ins-group-benefits-opp',
    name: 'Group Benefits Opportunity',
    description: 'Company expanding and needs group insurance review',
    vertical: 'insurance',
    priority: 'high',
    requiredSignals: ['ins-group-expansion'],
    optionalSignals: ['ins-benefits-rfp', 'ins-hr-change', 'ins-contract-expiry'],
    minSignalCount: 1,
    maxAgedays: 90,
    insight: 'Growing company needs to scale benefits program. Opportunity for group life, health, and disability coverage.',
    suggestedAction: 'Engage HR/Benefits team with scalable group solutions.',
    scoreBoost: 16,
  },
];

// =============================================================================
// REAL ESTATE PATTERNS
// =============================================================================

export const REAL_ESTATE_PATTERNS: IntelligencePattern[] = [
  {
    id: 're-relocation-buyer',
    name: 'Relocation Buyer',
    description: 'Individual relocating for job with urgent housing need',
    vertical: 'real-estate',
    priority: 'critical',
    requiredSignals: ['re-job-relocation'],
    optionalSignals: ['re-corporate-transfer', 're-mortgage-preapproval', 're-lease-expiring'],
    minSignalCount: 1,
    maxAgedays: 60,
    insight: 'Relocation buyers are motivated and often have compressed timelines. May have relocation benefits.',
    suggestedAction: 'Offer relocation specialist services and immediate property tours.',
    scoreBoost: 20,
  },
  {
    id: 're-first-time-buyer',
    name: 'First-Time Buyer Ready',
    description: 'Renter showing strong first-time buyer signals',
    vertical: 'real-estate',
    priority: 'high',
    requiredSignals: ['re-first-time-buyer'],
    optionalSignals: ['re-lease-expiring', 're-mortgage-preapproval', 're-rent-increase'],
    minSignalCount: 2,
    maxAgedays: 90,
    insight: 'First-time buyers need guidance and education. Opportunity to build long-term relationship.',
    suggestedAction: 'Invite to first-time buyer seminar or schedule educational consultation.',
    scoreBoost: 15,
  },
  {
    id: 're-upgrade-buyer',
    name: 'Upgrade Buyer',
    description: 'Current homeowner looking to upgrade',
    vertical: 'real-estate',
    priority: 'high',
    requiredSignals: ['re-family-growth'],
    optionalSignals: ['re-equity-rich', 're-property-search', 're-mortgage-preapproval'],
    minSignalCount: 2,
    maxAgedays: 120,
    insight: 'Growing family with equity in current home. Motivated to upgrade but may need to sell first.',
    suggestedAction: 'Offer buy-before-sell program or bridge financing options.',
    scoreBoost: 16,
  },
  {
    id: 're-investor-portfolio',
    name: 'Active Investor',
    description: 'Real estate investor actively expanding portfolio',
    vertical: 'real-estate',
    priority: 'high',
    requiredSignals: ['re-investor-interest'],
    optionalSignals: ['re-portfolio-expansion', 're-1031-exchange'],
    minSignalCount: 1,
    maxAgedays: 90,
    insight: 'Investor looking for opportunities. May have specific criteria and move quickly on good deals.',
    suggestedAction: 'Add to investor list and send matching off-market opportunities.',
    scoreBoost: 14,
  },
  {
    id: 're-commercial-expansion',
    name: 'Business Space Expansion',
    description: 'Business needing additional commercial space',
    vertical: 'real-estate',
    priority: 'high',
    requiredSignals: ['re-business-expansion'],
    optionalSignals: ['re-commercial-lease-expiry', 're-new-business'],
    minSignalCount: 1,
    maxAgedays: 90,
    insight: 'Growing business needs space. May need help navigating commercial lease terms.',
    suggestedAction: 'Schedule needs assessment and present matching commercial properties.',
    scoreBoost: 15,
  },
  {
    id: 're-expired-listing',
    name: 'Failed Listing Opportunity',
    description: 'Property failed to sell and may need new representation',
    vertical: 'real-estate',
    priority: 'critical',
    requiredSignals: ['re-listing-withdrawn'],
    optionalSignals: ['re-fsbo-expired'],
    minSignalCount: 1,
    maxAgedays: 60,
    insight: 'Seller frustrated with failed sale. Receptive to new approach and marketing strategy.',
    suggestedAction: 'Present specific marketing plan addressing why previous listing failed.',
    scoreBoost: 18,
  },
];

// =============================================================================
// RECRUITMENT PATTERNS
// =============================================================================

export const RECRUITMENT_PATTERNS: IntelligencePattern[] = [
  {
    id: 'rec-passive-star',
    name: 'Passive Star Candidate',
    description: 'Highly qualified passive candidate showing openness signals',
    vertical: 'recruitment',
    priority: 'critical',
    requiredSignals: ['rec-passive-candidate', 'rec-top-performer'],
    optionalSignals: ['rec-rare-skill', 'rec-competitor-talent', 'rec-profile-refresh'],
    minSignalCount: 2,
    maxAgedays: 60,
    insight: 'High-performing passive candidate showing subtle signs of openness. Rare opportunity to engage.',
    suggestedAction: 'Personalized outreach highlighting specific growth opportunities and culture fit.',
    scoreBoost: 20,
  },
  {
    id: 'rec-urgent-backfill',
    name: 'Urgent Backfill Need',
    description: 'Company with urgent need to fill critical role',
    vertical: 'recruitment',
    priority: 'critical',
    requiredSignals: ['rec-executive-departure'],
    optionalSignals: ['rec-urgent-hire', 'rec-backfill-posting', 'rec-team-exodus'],
    minSignalCount: 1,
    maxAgedays: 30,
    insight: 'Critical vacancy creating business impact. Company likely to move fast and may pay premium.',
    suggestedAction: 'Present shortlist of immediately available candidates within 48 hours.',
    scoreBoost: 22,
  },
  {
    id: 'rec-growth-hiring',
    name: 'Growth Phase Hiring',
    description: 'Company in growth phase with multiple hiring needs',
    vertical: 'recruitment',
    priority: 'high',
    requiredSignals: ['rec-mass-hiring'],
    optionalSignals: ['rec-funding-round', 'rec-new-office', 'rec-contract-win'],
    minSignalCount: 2,
    maxAgedays: 90,
    insight: 'Company scaling rapidly. Opportunity for volume placements and potential retainer relationship.',
    suggestedAction: 'Propose retained search or RPO arrangement for ongoing hiring needs.',
    scoreBoost: 18,
  },
  {
    id: 'rec-available-talent',
    name: 'Recently Available Talent',
    description: 'Strong candidate recently became available',
    vertical: 'recruitment',
    priority: 'high',
    requiredSignals: ['rec-recent-layoff'],
    optionalSignals: ['rec-open-to-work', 'rec-skill-match', 'rec-top-performer'],
    minSignalCount: 2,
    maxAgedays: 45,
    insight: 'Quality candidate available due to circumstances beyond their control. May have competing offers soon.',
    suggestedAction: 'Fast-track to relevant open positions before market absorbs them.',
    scoreBoost: 16,
  },
  {
    id: 'rec-referral-opportunity',
    name: 'Referral Network Hit',
    description: 'Candidate connected to existing employee network',
    vertical: 'recruitment',
    priority: 'high',
    requiredSignals: ['rec-referral-available', 'rec-skill-match'],
    optionalSignals: ['rec-inmail-responsive', 'rec-content-engaged'],
    minSignalCount: 2,
    maxAgedays: 90,
    insight: 'Strong candidate with referral connection. Higher conversion rate and cultural fit likelihood.',
    suggestedAction: 'Engage through referral channel for warm introduction.',
    scoreBoost: 15,
  },
];

// =============================================================================
// SAAS SALES PATTERNS
// =============================================================================

export const SAAS_SALES_PATTERNS: IntelligencePattern[] = [
  {
    id: 'saas-trial-to-paid',
    name: 'Trial Conversion Opportunity',
    description: 'Trial user showing strong adoption signals',
    vertical: 'saas-sales',
    priority: 'critical',
    requiredSignals: ['saas-trial-signup'],
    optionalSignals: ['saas-multi-stakeholder', 'saas-content-engaged', 'saas-champion-identified'],
    minSignalCount: 2,
    maxAgedays: 30,
    insight: 'Trial showing strong usage patterns. Multiple stakeholders engaged indicates enterprise opportunity.',
    suggestedAction: 'Schedule success review call and present enterprise upgrade path.',
    scoreBoost: 20,
  },
  {
    id: 'saas-competitor-displacement',
    name: 'Competitor Displacement',
    description: 'Company showing signs of leaving competitor',
    vertical: 'saas-sales',
    priority: 'critical',
    requiredSignals: ['saas-competitor-churning'],
    optionalSignals: ['saas-product-research', 'saas-competitor-research', 'saas-contract-expiry'],
    minSignalCount: 1,
    maxAgedays: 60,
    insight: 'Competitor customer evaluating alternatives. Window to displace before they renew or choose another.',
    suggestedAction: 'Lead with migration support and competitive differentiation.',
    scoreBoost: 22,
  },
  {
    id: 'saas-funded-growth',
    name: 'Post-Funding Tech Investment',
    description: 'Recently funded company investing in tech stack',
    vertical: 'saas-sales',
    priority: 'high',
    requiredSignals: ['saas-funding-round'],
    optionalSignals: ['saas-engineering-growth', 'saas-new-cto', 'saas-tech-stack-change'],
    minSignalCount: 2,
    maxAgedays: 120,
    insight: 'Funded company building out tech stack. Budget available and urgency to deploy capital.',
    suggestedAction: 'Position as growth partner and emphasize ROI/time-to-value.',
    scoreBoost: 18,
  },
  {
    id: 'saas-icp-buying-signals',
    name: 'ICP with Active Intent',
    description: 'Ideal customer profile company showing buying intent',
    vertical: 'saas-sales',
    priority: 'critical',
    requiredSignals: ['saas-icp-match', 'saas-product-research'],
    optionalSignals: ['saas-website-traffic', 'saas-rfp-issued', 'saas-budget-cycle'],
    minSignalCount: 2,
    maxAgedays: 45,
    insight: 'Perfect-fit company actively researching. Highest conversion probability segment.',
    suggestedAction: 'Prioritize for executive outreach and custom demo.',
    scoreBoost: 20,
  },
  {
    id: 'saas-tech-modernization',
    name: 'Tech Stack Modernization',
    description: 'Company modernizing technology infrastructure',
    vertical: 'saas-sales',
    priority: 'high',
    requiredSignals: ['saas-legacy-modernization'],
    optionalSignals: ['saas-tech-stack-change', 'saas-new-cto', 'saas-engineering-growth'],
    minSignalCount: 2,
    maxAgedays: 120,
    insight: 'Company investing in modernization. Open to new solutions that integrate with modern stack.',
    suggestedAction: 'Emphasize modern architecture, APIs, and integration capabilities.',
    scoreBoost: 15,
  },
  {
    id: 'saas-expansion-opportunity',
    name: 'Existing Customer Expansion',
    description: 'Existing customer showing expansion signals',
    vertical: 'saas-sales',
    priority: 'high',
    requiredSignals: ['saas-headcount-jump'],
    optionalSignals: ['saas-funding-round', 'saas-new-office', 'saas-sales-team-growth'],
    minSignalCount: 2,
    maxAgedays: 90,
    insight: 'Existing customer growing rapidly. Opportunity to expand seat count and upsell additional products.',
    suggestedAction: 'Schedule QBR to discuss growth alignment and expansion options.',
    scoreBoost: 16,
  },
];

// =============================================================================
// PATTERN ACCESS FUNCTIONS
// =============================================================================

/**
 * Get all patterns for a vertical
 */
export function getPatternsForVertical(vertical: Vertical): IntelligencePattern[] {
  switch (vertical) {
    case 'banking':
      return BANKING_PATTERNS;
    case 'insurance':
      return INSURANCE_PATTERNS;
    case 'real-estate':
      return REAL_ESTATE_PATTERNS;
    case 'recruitment':
      return RECRUITMENT_PATTERNS;
    case 'saas-sales':
      return SAAS_SALES_PATTERNS;
    default:
      return [];
  }
}

/**
 * Get pattern by ID across all verticals
 */
export function getPatternById(id: string): IntelligencePattern | undefined {
  const allPatterns = [
    ...BANKING_PATTERNS,
    ...INSURANCE_PATTERNS,
    ...REAL_ESTATE_PATTERNS,
    ...RECRUITMENT_PATTERNS,
    ...SAAS_SALES_PATTERNS,
  ];
  return allPatterns.find(p => p.id === id);
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
  const requiredCount = pattern.requiredSignals.length;
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
  totalPatterns:
    BANKING_PATTERNS.length +
    INSURANCE_PATTERNS.length +
    REAL_ESTATE_PATTERNS.length +
    RECRUITMENT_PATTERNS.length +
    SAAS_SALES_PATTERNS.length,
  verticals: ['banking', 'insurance', 'real-estate', 'recruitment', 'saas-sales'],
} as const;
