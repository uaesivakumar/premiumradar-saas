/**
 * Contact Scorer - S396
 *
 * QTLE scoring for individual contacts (not companies).
 * Scores contacts based on role fit, seniority, and data quality.
 *
 * QTLE for Contacts:
 * - Quality: Data completeness (email, phone, LinkedIn)
 * - Timing: Role relevance to current need
 * - Likelihood: Decision maker probability
 * - Engagement: Reachability score
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

interface ScoringContext {
  subVertical: string;
  targetRoles: string[];
  targetSeniorities: string[];
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
 */
function scoreLikelihood(
  contact: NormalizedContact,
  role: ScoredContact['role'],
  seniority: ScoredContact['seniority']
): number {
  let score = 30; // Base score

  // Decision makers have highest likelihood
  if (role === 'decision_maker') score += 40;
  else if (role === 'influencer') score += 25;
  else if (role === 'champion') score += 15;

  // Higher seniority = higher likelihood
  if (seniority === 'c_suite') score += 20;
  else if (seniority === 'vp') score += 15;
  else if (seniority === 'director') score += 10;

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
 */
function generateWhyRecommended(
  contact: NormalizedContact,
  role: ScoredContact['role'],
  seniority: ScoredContact['seniority'],
  department: string,
  context: ScoringContext
): string {
  const reasons: string[] = [];

  // Role-based reason
  if (role === 'decision_maker') {
    reasons.push('Decision maker with budget authority');
  } else if (role === 'influencer') {
    reasons.push('Key influencer in purchasing process');
  }

  // Department relevance
  if (department === 'Human Resources' && context.subVertical.includes('employee')) {
    reasons.push('HR leader - primary contact for payroll/benefits');
  } else if (department === 'Finance') {
    reasons.push('Finance leader - key for treasury/banking decisions');
  }

  // Seniority reason
  if (seniority === 'c_suite') {
    reasons.push('C-suite executive');
  } else if (seniority === 'vp' || seniority === 'director') {
    reasons.push(`${seniority === 'vp' ? 'VP' : 'Director'}-level authority`);
  }

  // Contact availability
  if (contact.email && contact.linkedinUrl) {
    reasons.push('Multiple contact channels available');
  }

  return reasons.slice(0, 2).join('. ') + '.';
}

/**
 * Determine confidence level
 */
function determineConfidence(
  qtleScore: number,
  role: ScoredContact['role'],
  hasEmail: boolean
): ScoredContact['confidence'] {
  if (qtleScore >= 75 && role === 'decision_maker' && hasEmail) {
    return 'high';
  }
  if (qtleScore >= 50 || (role === 'decision_maker' && hasEmail)) {
    return 'medium';
  }
  return 'low';
}

// =============================================================================
// MAIN SCORING FUNCTION
// =============================================================================

/**
 * Score and rank contacts using QTLE
 */
export function scoreContacts(
  normalizedContacts: NormalizedContact[],
  sessionId: string,
  context: ScoringContext
): ScoredContact[] {
  console.log('[ContactScorer] Scoring', normalizedContacts.length, 'contacts');

  const scored: ScoredContact[] = normalizedContacts.map(contact => {
    // Classify role and seniority
    const role = classifyRole(contact.title);
    const seniority = classifySeniority(contact.title, contact.seniority);
    const department = detectDepartment(contact.title, contact.departments);

    // Calculate QTLE scores
    const quality = scoreQuality(contact);
    const timing = scoreTiming(contact, context);
    const likelihood = scoreLikelihood(contact, role, seniority);
    const engagement = scoreEngagement(contact);

    // Weighted composite (QTLE weights for contacts)
    const qtleScore = Math.round(
      quality * 0.20 +      // Quality: 20%
      timing * 0.25 +       // Timing: 25%
      likelihood * 0.35 +   // Likelihood: 35%
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
      whyRecommended: generateWhyRecommended(contact, role, seniority, department, context),
      confidence: determineConfidence(qtleScore, role, !!contact.email),
      sourceProvider: contact.sourceProvider,
      sourceId: contact.sourceId,
    };
  });

  // Sort by QTLE score descending
  scored.sort((a, b) => b.qtleScore - a.qtleScore);

  // Assign priority ranks
  scored.forEach((contact, index) => {
    contact.priorityRank = index + 1;

    if (index < 3 && contact.role === 'decision_maker') {
      contact.priority = 'primary';
    } else if (index < 5 || contact.role === 'decision_maker') {
      contact.priority = 'secondary';
    } else {
      contact.priority = 'tertiary';
    }
  });

  console.log('[ContactScorer] Scored contacts:', scored.map(c => ({
    name: c.fullName,
    title: c.title,
    score: c.qtleScore,
    priority: c.priority,
  })));

  return scored;
}

// =============================================================================
// CONTEXT BUILDERS
// =============================================================================

/**
 * Get scoring context for Employee Banking
 */
export function getEBScoringContext(): ScoringContext {
  return {
    subVertical: 'employee-banking',
    targetRoles: [
      'hr', 'human resources', 'people', 'talent',
      'payroll', 'compensation', 'benefits',
      'finance', 'cfo', 'treasury',
    ],
    targetSeniorities: ['c_suite', 'vp', 'director'],
  };
}

/**
 * Get scoring context for Corporate Banking
 */
export function getCBScoringContext(): ScoringContext {
  return {
    subVertical: 'corporate-banking',
    targetRoles: [
      'cfo', 'finance', 'treasury', 'controller',
      'financial', 'accounting',
    ],
    targetSeniorities: ['c_suite', 'vp', 'director'],
  };
}

/**
 * Get scoring context by sub-vertical
 */
export function getScoringContext(subVertical: string): ScoringContext {
  switch (subVertical) {
    case 'employee-banking':
      return getEBScoringContext();
    case 'corporate-banking':
      return getCBScoringContext();
    default:
      return getEBScoringContext(); // Default to EB
  }
}
