/**
 * Contact Scorer - S396
 *
 * QTLE scoring for individual contacts (not companies).
 * Scores contacts based on role fit, seniority, and data quality.
 *
 * QTLE for Contacts:
 * - Quality: Data completeness (email, phone, LinkedIn)
 * - Timing: Role relevance to current need
 * - Likelihood: Decision maker probability (TIER-AWARE)
 * - Engagement: Reachability score
 *
 * PERSONA-BASED CONTACT PRIORITY:
 * Uses ContactPriorityRules from persona to determine which contacts
 * are most relevant based on company size. Different company sizes
 * require different decision makers:
 * - Small (<50): Founder, COO (direct access)
 * - Mid (50-500): HR Director, HR Manager (sweet spot)
 * - Large (500+): Payroll Manager, Benefits Coordinator (operational)
 */

import type { ScoredContact } from './enrichment-session';

// =============================================================================
// TYPES
// =============================================================================

interface NormalizedContact {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  email?: string;
  linkedinUrl?: string;
  phone?: string;
  seniority?: string;
  departments?: string[];
  sourceProvider: string;
  sourceId: string;
}

/**
 * Contact Priority Tier (from persona)
 * Defines which titles to target based on company size
 */
interface ContactPriorityTier {
  size_min?: number;
  size_max?: number;
  titles: string[];
  priority: number; // Lower = higher priority (1 = best)
  reason: string;
}

/**
 * Contact Priority Rules (from persona)
 */
interface ContactPriorityRules {
  tiers: ContactPriorityTier[];
  boost_conditions?: {
    condition: string;
    add_titles: string[];
  }[];
}

/**
 * Company context for tier matching
 */
interface CompanyContext {
  headcount?: number;
  hiringVelocity?: number;
  industry?: string;
}

interface ScoringContext {
  subVertical: string;
  targetRoles: string[];
  targetSeniorities: string[];
  company?: CompanyContext;
  priorityRules?: ContactPriorityRules;
}

// =============================================================================
// EB PERSONA CONTACT PRIORITY RULES (DEFAULT)
// =============================================================================

/**
 * Employee Banking persona contact priority rules
 * Source: SIVA_MULTI_VERTICAL_ARCHITECTURE.md
 *
 * These rules define which contacts to target based on company size.
 * For EB, the logic is:
 * - Small companies: Owner/Founder makes banking decisions directly
 * - Mid-size: HR Director/Manager handles payroll relationships
 * - Large: Payroll/Benefits coordinators are operational contacts
 */
const EB_CONTACT_PRIORITY_RULES: ContactPriorityRules = {
  tiers: [
    {
      size_max: 50,
      titles: ['founder', 'ceo', 'coo', 'owner', 'managing director', 'md', 'general manager'],
      priority: 1,
      reason: 'Small company = direct decision maker',
    },
    {
      size_min: 50,
      size_max: 500,
      titles: ['hr director', 'head of hr', 'hr manager', 'human resources director', 'chief people officer', 'cpo', 'chro', 'vp hr', 'vp human resources'],
      priority: 1,
      reason: 'Sweet spot - HR leader owns payroll decisions',
    },
    {
      size_min: 500,
      titles: ['payroll manager', 'payroll director', 'benefits manager', 'benefits coordinator', 'compensation manager', 'head of payroll', 'hr operations manager'],
      priority: 1,
      reason: 'Large company - operational contact for payroll',
    },
  ],
  boost_conditions: [
    {
      condition: 'hiring_velocity > 10',
      add_titles: ['head of talent acquisition', 'talent acquisition director', 'recruitment director', 'hr ops manager'],
    },
  ],
};

// =============================================================================
// TIER MATCHING
// =============================================================================

/**
 * Find the matching tier for a company based on headcount
 */
function findMatchingTier(
  headcount: number | undefined,
  rules: ContactPriorityRules
): ContactPriorityTier | null {
  if (headcount === undefined) {
    // Default to mid-size if no headcount data (most common case)
    return rules.tiers.find(t => t.size_min === 50 && t.size_max === 500) || null;
  }

  for (const tier of rules.tiers) {
    const minOk = tier.size_min === undefined || headcount >= tier.size_min;
    const maxOk = tier.size_max === undefined || headcount <= tier.size_max;
    if (minOk && maxOk) {
      return tier;
    }
  }

  return null;
}

/**
 * Get effective target titles based on company context
 * Applies boost conditions (e.g., high hiring velocity adds recruiting titles)
 */
function getEffectiveTargetTitles(
  tier: ContactPriorityTier,
  company: CompanyContext | undefined,
  rules: ContactPriorityRules
): string[] {
  const titles = [...tier.titles];

  // Apply boost conditions
  if (rules.boost_conditions && company) {
    for (const boost of rules.boost_conditions) {
      // Parse simple conditions like "hiring_velocity > 10"
      if (boost.condition.includes('hiring_velocity')) {
        const threshold = parseInt(boost.condition.match(/\d+/)?.[0] || '10');
        if (company.hiringVelocity && company.hiringVelocity > threshold) {
          titles.push(...boost.add_titles);
        }
      }
    }
  }

  return titles;
}

/**
 * Check if a contact's title matches any target title
 * Returns match score: 100 for exact, 80 for partial, 0 for no match
 */
function matchTitleToTargets(contactTitle: string, targetTitles: string[]): number {
  const lowerTitle = contactTitle.toLowerCase();

  // Exact match (title contains full target title)
  for (const target of targetTitles) {
    if (lowerTitle.includes(target.toLowerCase())) {
      return 100;
    }
  }

  // Partial match (any word overlap)
  const titleWords = lowerTitle.split(/\s+/);
  for (const target of targetTitles) {
    const targetWords = target.toLowerCase().split(/\s+/);
    const hasOverlap = targetWords.some(tw =>
      titleWords.some(cw => cw === tw && tw.length > 2)
    );
    if (hasOverlap) {
      return 60;
    }
  }

  return 0;
}

// =============================================================================
// ROLE CLASSIFICATION
// =============================================================================

const DECISION_MAKER_TITLES = [
  'ceo', 'cfo', 'coo', 'cto', 'cpo', 'chro', 'cmo',
  'chief', 'president', 'founder', 'owner', 'partner',
  'vp', 'vice president', 'svp', 'evp',
  'director', 'head of', 'group head',
];

const INFLUENCER_TITLES = [
  'manager', 'senior manager', 'lead', 'principal',
  'team lead', 'supervisor',
];

const HR_ROLES = [
  'hr', 'human resources', 'people', 'talent', 'recruitment',
  'compensation', 'benefits', 'payroll', 'workforce',
];

const FINANCE_ROLES = [
  'finance', 'treasury', 'accounting', 'controller',
  'financial', 'budget', 'audit',
];

/**
 * Classify contact role based on title
 */
function classifyRole(title: string): ScoredContact['role'] {
  const lowerTitle = title.toLowerCase();

  // Check for decision maker signals
  const isDecisionMaker = DECISION_MAKER_TITLES.some(t => lowerTitle.includes(t));
  if (isDecisionMaker) return 'decision_maker';

  // Check for influencer signals
  const isInfluencer = INFLUENCER_TITLES.some(t => lowerTitle.includes(t));
  if (isInfluencer) return 'influencer';

  // Check for champion (HR/Finance specific roles)
  const isHRFinance = [...HR_ROLES, ...FINANCE_ROLES].some(t => lowerTitle.includes(t));
  if (isHRFinance) return 'champion';

  return 'end_user';
}

/**
 * Classify seniority level
 */
function classifySeniority(title: string, providerSeniority?: string): ScoredContact['seniority'] {
  const lowerTitle = title.toLowerCase();

  // C-suite
  if (/^c[a-z]o|chief|president|founder|owner/.test(lowerTitle)) {
    return 'c_suite';
  }

  // VP level
  if (/vp|vice president|svp|evp/.test(lowerTitle)) {
    return 'vp';
  }

  // Director level
  if (/director|head of|group head/.test(lowerTitle)) {
    return 'director';
  }

  // Manager level
  if (/manager|lead|supervisor/.test(lowerTitle)) {
    return 'manager';
  }

  // Use provider seniority as fallback
  if (providerSeniority) {
    const mapped: Record<string, ScoredContact['seniority']> = {
      'c_suite': 'c_suite',
      'vp': 'vp',
      'director': 'director',
      'manager': 'manager',
      'owner': 'c_suite',
      'partner': 'c_suite',
    };
    return mapped[providerSeniority] || 'individual';
  }

  return 'individual';
}

/**
 * Detect department from title
 */
function detectDepartment(title: string, departments?: string[]): string {
  const lowerTitle = title.toLowerCase();

  if (HR_ROLES.some(r => lowerTitle.includes(r))) return 'Human Resources';
  if (FINANCE_ROLES.some(r => lowerTitle.includes(r))) return 'Finance';
  if (/sales|business development|account/.test(lowerTitle)) return 'Sales';
  if (/marketing|brand|communications/.test(lowerTitle)) return 'Marketing';
  if (/operations|ops/.test(lowerTitle)) return 'Operations';
  if (/tech|engineering|development|it/.test(lowerTitle)) return 'Technology';

  return departments?.[0] || 'General';
}

// =============================================================================
// QTLE SCORING
// =============================================================================

/**
 * Calculate Quality score (data completeness)
 */
function scoreQuality(contact: NormalizedContact): number {
  let score = 0;

  // Name completeness
  if (contact.firstName && contact.lastName) score += 20;
  else if (contact.firstName || contact.lastName) score += 10;

  // Title present
  if (contact.title) score += 20;

  // Contact methods
  if (contact.email) score += 25;
  if (contact.linkedinUrl) score += 20;
  if (contact.phone) score += 15;

  return Math.min(score, 100);
}

/**
 * Calculate Timing score (role relevance)
 */
function scoreTiming(contact: NormalizedContact, context: ScoringContext): number {
  const lowerTitle = contact.title?.toLowerCase() || '';
  let score = 50; // Base score

  // Check if role matches target roles
  const roleMatch = context.targetRoles.some(role =>
    lowerTitle.includes(role.toLowerCase())
  );
  if (roleMatch) score += 30;

  // Check seniority match
  const seniorityMatch = context.targetSeniorities.some(sen => {
    if (sen === 'c_suite') return /chief|ceo|cfo|coo|cto/.test(lowerTitle);
    if (sen === 'vp') return /vp|vice president/.test(lowerTitle);
    if (sen === 'director') return /director|head/.test(lowerTitle);
    return false;
  });
  if (seniorityMatch) score += 20;

  return Math.min(score, 100);
}

/**
 * Calculate Likelihood score (conversion probability)
 *
 * TIER-AWARE: Contacts matching the target tier get significant boost.
 * This is the KEY differentiator - persona-based contact priority.
 */
function scoreLikelihood(
  contact: NormalizedContact,
  role: ScoredContact['role'],
  seniority: ScoredContact['seniority'],
  tierMatchScore: number = 0
): number {
  let score = 20; // Base score (lowered to make tier match more impactful)

  // TIER MATCH BONUS (Primary factor for EB)
  // Contacts matching the target tier for company size get huge boost
  if (tierMatchScore >= 100) {
    score += 50; // Perfect match - this is THE person to contact
  } else if (tierMatchScore >= 60) {
    score += 30; // Partial match - related role
  }

  // Decision makers still get boost but less dominant
  if (role === 'decision_maker') score += 15;
  else if (role === 'influencer') score += 10;
  else if (role === 'champion') score += 5;

  // Seniority is contextual - high seniority not always better
  // For large companies, operational contacts (manager level) are preferred
  if (tierMatchScore >= 60) {
    // Already matched tier - seniority is appropriate
    score += 5;
  } else {
    // Not matched - use seniority as fallback
    if (seniority === 'c_suite') score += 10;
    else if (seniority === 'vp') score += 8;
    else if (seniority === 'director') score += 5;
  }

  // Email available = higher reachability
  if (contact.email) score += 10;

  return Math.min(score, 100);
}

/**
 * Calculate Engagement score (reachability)
 */
function scoreEngagement(contact: NormalizedContact): number {
  let score = 20; // Base score

  // Multiple contact methods = higher engagement potential
  if (contact.email) score += 30;
  if (contact.linkedinUrl) score += 25;
  if (contact.phone) score += 25;

  return Math.min(score, 100);
}

/**
 * Generate "Why recommended" explanation
 * Now tier-aware: explains why this contact is right for THIS company
 */
function generateWhyRecommended(
  contact: NormalizedContact,
  role: ScoredContact['role'],
  seniority: ScoredContact['seniority'],
  department: string,
  context: ScoringContext,
  tierMatchScore: number = 0,
  matchingTier?: ContactPriorityTier | null
): string {
  const reasons: string[] = [];

  // TIER MATCH REASON (Primary - persona-based)
  if (tierMatchScore >= 100 && matchingTier) {
    // Perfect match - explain why
    reasons.push(matchingTier.reason);
  } else if (tierMatchScore >= 60 && matchingTier) {
    // Partial match
    reasons.push(`Related to target role: ${matchingTier.reason}`);
  }

  // Department relevance (only if not already explained by tier)
  if (tierMatchScore < 60) {
    if (department === 'Human Resources' && context.subVertical.includes('employee')) {
      reasons.push('HR leader - primary contact for payroll/benefits');
    } else if (department === 'Finance') {
      reasons.push('Finance leader - key for treasury/banking decisions');
    }
  }

  // Role-based reason (fallback)
  if (reasons.length === 0) {
    if (role === 'decision_maker') {
      reasons.push('Decision maker with budget authority');
    } else if (role === 'influencer') {
      reasons.push('Key influencer in purchasing process');
    }
  }

  // Seniority reason (only if no tier match)
  if (tierMatchScore < 60 && reasons.length < 2) {
    if (seniority === 'c_suite') {
      reasons.push('C-suite executive');
    } else if (seniority === 'vp' || seniority === 'director') {
      reasons.push(`${seniority === 'vp' ? 'VP' : 'Director'}-level authority`);
    }
  }

  // Contact availability
  if (reasons.length < 2 && contact.email && contact.linkedinUrl) {
    reasons.push('Multiple contact channels available');
  }

  return reasons.slice(0, 2).join('. ') + '.';
}

/**
 * Determine confidence level
 * Tier-matched contacts with email get high confidence
 */
function determineConfidence(
  qtleScore: number,
  role: ScoredContact['role'],
  hasEmail: boolean,
  tierMatchScore: number = 0
): ScoredContact['confidence'] {
  // Tier match is now the primary confidence factor
  if (tierMatchScore >= 100 && hasEmail) {
    return 'high'; // Perfect tier match with email = high confidence
  }
  if (tierMatchScore >= 60 && hasEmail) {
    return 'high'; // Partial tier match with email = high confidence
  }
  if (qtleScore >= 75 && hasEmail) {
    return 'high';
  }
  if (qtleScore >= 50 || tierMatchScore >= 60) {
    return 'medium';
  }
  return 'low';
}

// =============================================================================
// MAIN SCORING FUNCTION
// =============================================================================

/**
 * Score and rank contacts using QTLE with Persona-Based Contact Priority
 *
 * KEY INSIGHT: The "best" contact varies by company size.
 * - For a 30-person startup: CEO/Founder is the decision maker
 * - For a 200-person company: HR Director owns payroll decisions
 * - For a 1000-person enterprise: Payroll Manager is the operational contact
 *
 * This function uses ContactPriorityRules to score contacts appropriately.
 */
export function scoreContacts(
  normalizedContacts: NormalizedContact[],
  sessionId: string,
  context: ScoringContext
): ScoredContact[] {
  console.log('[ContactScorer] Scoring', normalizedContacts.length, 'contacts');

  // Get priority rules (use EB default if not provided)
  const priorityRules = context.priorityRules || EB_CONTACT_PRIORITY_RULES;

  // Find the matching tier for this company
  const matchingTier = findMatchingTier(context.company?.headcount, priorityRules);
  const targetTitles = matchingTier
    ? getEffectiveTargetTitles(matchingTier, context.company, priorityRules)
    : [];

  console.log('[ContactScorer] Company context:', {
    headcount: context.company?.headcount,
    hiringVelocity: context.company?.hiringVelocity,
    matchingTier: matchingTier?.reason,
    targetTitles: targetTitles.slice(0, 5),
  });

  const scored: ScoredContact[] = normalizedContacts.map(contact => {
    // Classify role and seniority
    const role = classifyRole(contact.title);
    const seniority = classifySeniority(contact.title, contact.seniority);
    const department = detectDepartment(contact.title, contact.departments);

    // Calculate tier match score (KEY for persona-based ranking)
    const tierMatchScore = matchTitleToTargets(contact.title, targetTitles);

    // Calculate QTLE scores (with tier match passed to Likelihood)
    const quality = scoreQuality(contact);
    const timing = scoreTiming(contact, context);
    const likelihood = scoreLikelihood(contact, role, seniority, tierMatchScore);
    const engagement = scoreEngagement(contact);

    // Weighted composite (QTLE weights for contacts)
    const qtleScore = Math.round(
      quality * 0.15 +      // Quality: 15% (reduced)
      timing * 0.20 +       // Timing: 20% (reduced)
      likelihood * 0.45 +   // Likelihood: 45% (INCREASED - tier match is key)
      engagement * 0.20     // Engagement: 20%
    );

    return {
      id: `sc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sessionId,
      firstName: contact.firstName,
      lastName: contact.lastName,
      fullName: `${contact.firstName} ${contact.lastName}`.trim(),
      title: contact.title,
      email: contact.email,
      linkedinUrl: contact.linkedinUrl,
      phone: contact.phone,
      role,
      seniority,
      department,
      qtleScore,
      scoreBreakdown: { quality, timing, likelihood, engagement },
      priority: 'tertiary' as const, // Will be set after ranking
      priorityRank: 0,
      tierMatchScore, // Track for debugging
      whyRecommended: generateWhyRecommended(
        contact, role, seniority, department, context, tierMatchScore, matchingTier
      ),
      confidence: determineConfidence(qtleScore, role, !!contact.email, tierMatchScore),
      sourceProvider: contact.sourceProvider,
      sourceId: contact.sourceId,
    };
  });

  // Sort by QTLE score descending
  scored.sort((a, b) => b.qtleScore - a.qtleScore);

  // Assign priority based on tier match AND rank
  // Primary: Top tier-matched contacts (the RIGHT people)
  // Secondary: Other good contacts
  // Tertiary: Rest
  let primaryCount = 0;
  scored.forEach((contact, index) => {
    contact.priorityRank = index + 1;

    // Get tier match score (stored on contact)
    const tierMatch = (contact as any).tierMatchScore || 0;

    if (tierMatch >= 60 && primaryCount < 3) {
      // Tier-matched contacts are PRIMARY (up to 3)
      contact.priority = 'primary';
      primaryCount++;
    } else if (index < 5 || tierMatch >= 60) {
      // Top 5 or any tier-matched contact is SECONDARY
      contact.priority = 'secondary';
    } else {
      contact.priority = 'tertiary';
    }

    // Clean up temporary field
    delete (contact as any).tierMatchScore;
  });

  console.log('[ContactScorer] Scored contacts:', scored.map(c => ({
    name: c.fullName,
    title: c.title,
    score: c.qtleScore,
    priority: c.priority,
    likelihood: c.scoreBreakdown.likelihood,
  })));

  return scored;
}

// =============================================================================
// CONTEXT BUILDERS
// =============================================================================

/**
 * Get scoring context for Employee Banking
 */
export function getEBScoringContext(company?: CompanyContext): ScoringContext {
  return {
    subVertical: 'employee-banking',
    targetRoles: [
      'hr', 'human resources', 'people', 'talent',
      'payroll', 'compensation', 'benefits',
      'finance', 'cfo', 'treasury',
    ],
    targetSeniorities: ['c_suite', 'vp', 'director'],
    company,
    priorityRules: EB_CONTACT_PRIORITY_RULES,
  };
}

/**
 * Get scoring context for Corporate Banking
 */
export function getCBScoringContext(company?: CompanyContext): ScoringContext {
  return {
    subVertical: 'corporate-banking',
    targetRoles: [
      'cfo', 'finance', 'treasury', 'controller',
      'financial', 'accounting',
    ],
    targetSeniorities: ['c_suite', 'vp', 'director'],
    company,
    // CB has different priority rules - target CFO/Treasury for all sizes
    priorityRules: {
      tiers: [
        {
          titles: ['cfo', 'chief financial officer', 'vp finance', 'finance director', 'head of finance', 'treasurer', 'head of treasury'],
          priority: 1,
          reason: 'Finance leader for corporate banking decisions',
        },
      ],
    },
  };
}

/**
 * Get scoring context by sub-vertical
 */
export function getScoringContext(subVertical: string, company?: CompanyContext): ScoringContext {
  switch (subVertical) {
    case 'employee-banking':
      return getEBScoringContext(company);
    case 'corporate-banking':
      return getCBScoringContext(company);
    default:
      return getEBScoringContext(company); // Default to EB
  }
}
