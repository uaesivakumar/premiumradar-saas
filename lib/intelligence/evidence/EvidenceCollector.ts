/**
 * Evidence Collector - S44
 *
 * Gathers evidence from multiple sources for a target entity.
 * Provides the raw material for reasoning and justification.
 *
 * IMPORTANT: Evidence collection is filtered by Sales Context.
 *
 * Signal types are SALES ACTIVITY signals, NOT industry analysis:
 * - hiring-expansion: Company is hiring = needs banking/payroll products
 * - office-opening: New office = new accounts opportunity
 * - market-entry: Entering region = needs local services
 * - funding-round: Capital event = banking relationship opportunity
 * - expansion: Growth signals = sales opportunity
 * - partnership: Strategic moves = potential needs
 *
 * The signal templates below are for UAE Banking as the primary implementation.
 * Other verticals (Insurance, Real Estate, SaaS) will reuse these same
 * signal types but with different relevance weighting via SalesContextProvider.
 */

import type {
  Evidence,
  EvidenceCollection,
  EvidenceSourceType,
} from './types';

// =============================================================================
// Evidence Templates (Banking/UAE Focus)
// =============================================================================

/**
 * Signal evidence templates for UAE banking sector
 */
const SIGNAL_TEMPLATES: Record<string, Partial<Evidence>[]> = {
  'digital transformation': [
    {
      type: 'signal',
      title: 'Digital Banking Initiative',
      content: 'Company has announced major digital transformation program',
      confidence: 0.85,
      relevance: 0.9,
    },
    {
      type: 'technology',
      title: 'Cloud Migration',
      content: 'Moving core banking systems to cloud infrastructure',
      confidence: 0.8,
      relevance: 0.85,
    },
  ],
  'expansion': [
    {
      type: 'signal',
      title: 'Market Expansion',
      content: 'Opening new branches or entering new markets',
      confidence: 0.8,
      relevance: 0.85,
    },
    {
      type: 'news',
      title: 'Growth Announcement',
      content: 'Press release announcing expansion plans',
      confidence: 0.75,
      relevance: 0.8,
    },
  ],
  'hiring': [
    {
      type: 'signal',
      title: 'Talent Acquisition',
      content: 'Active hiring in technology and digital roles',
      confidence: 0.85,
      relevance: 0.8,
    },
    {
      type: 'leadership',
      title: 'Executive Hire',
      content: 'New C-level or senior executive appointment',
      confidence: 0.9,
      relevance: 0.85,
    },
  ],
  'partnership': [
    {
      type: 'news',
      title: 'Strategic Partnership',
      content: 'New partnership announced with technology provider',
      confidence: 0.85,
      relevance: 0.85,
    },
  ],
  'funding': [
    {
      type: 'financial',
      title: 'Investment Round',
      content: 'Recent funding or investment announcement',
      confidence: 0.9,
      relevance: 0.9,
    },
  ],
};

/**
 * Company-specific evidence for known UAE banks
 */
const COMPANY_EVIDENCE: Record<string, Partial<Evidence>[]> = {
  'Emirates NBD': [
    {
      type: 'profile',
      title: 'Leading UAE Bank',
      content: 'Emirates NBD is one of the largest banking groups in the Middle East with a strong focus on digital innovation.',
      confidence: 0.95,
      relevance: 0.9,
    },
    {
      type: 'signal',
      title: 'Digital Transformation Leader',
      content: 'Invested heavily in AI and digital banking capabilities through Liv digital bank.',
      confidence: 0.9,
      relevance: 0.95,
    },
    {
      type: 'financial',
      title: 'Strong Financial Position',
      content: 'Consistent revenue growth and market leadership in UAE retail banking.',
      confidence: 0.9,
      relevance: 0.85,
    },
  ],
  'First Abu Dhabi Bank': [
    {
      type: 'profile',
      title: 'Largest UAE Bank by Assets',
      content: 'FAB is the largest bank in the UAE and one of the world\'s largest and safest financial institutions.',
      confidence: 0.95,
      relevance: 0.9,
    },
    {
      type: 'signal',
      title: 'International Expansion',
      content: 'Active expansion into international markets including Egypt, Saudi Arabia.',
      confidence: 0.85,
      relevance: 0.85,
    },
  ],
  'ADCB': [
    {
      type: 'profile',
      title: 'Major UAE Bank',
      content: 'Abu Dhabi Commercial Bank is a leading financial services group in the UAE.',
      confidence: 0.95,
      relevance: 0.9,
    },
    {
      type: 'technology',
      title: 'Digital Innovation',
      content: 'Launched ADCB Hayyak for digital account opening and banking.',
      confidence: 0.85,
      relevance: 0.9,
    },
  ],
  'Mashreq': [
    {
      type: 'profile',
      title: 'Digital Pioneer',
      content: 'One of the leading financial institutions in the UAE with strong digital capabilities.',
      confidence: 0.9,
      relevance: 0.9,
    },
    {
      type: 'signal',
      title: 'Mashreq Neo',
      content: 'Launched Mashreq Neo, a fully digital banking platform.',
      confidence: 0.9,
      relevance: 0.95,
    },
  ],
  'Dubai Islamic Bank': [
    {
      type: 'profile',
      title: 'Largest Islamic Bank in UAE',
      content: 'DIB is the largest Islamic bank in the UAE and a pioneer in Islamic banking.',
      confidence: 0.95,
      relevance: 0.9,
    },
    {
      type: 'signal',
      title: 'Sharia-Compliant Innovation',
      content: 'Leading in Islamic fintech and digital Sharia-compliant products.',
      confidence: 0.85,
      relevance: 0.85,
    },
  ],
};

// =============================================================================
// Evidence Collection Functions
// =============================================================================

/**
 * Collect evidence for a target entity
 */
export function collectEvidence(
  target: string,
  targetType: 'company' | 'sector' | 'region' = 'company',
  signals: string[] = []
): EvidenceCollection {
  const evidence: Evidence[] = [];
  const sources = new Set<string>();

  // Collect company-specific evidence
  if (targetType === 'company') {
    const companyEvidence = getCompanyEvidence(target);
    evidence.push(...companyEvidence);
    companyEvidence.forEach(e => sources.add(e.source));
  }

  // Collect signal-based evidence
  for (const signal of signals) {
    const signalEvidence = getSignalEvidence(signal, target);
    evidence.push(...signalEvidence);
    signalEvidence.forEach(e => sources.add(e.source));
  }

  // Add general market context if no specific evidence
  if (evidence.length === 0) {
    evidence.push(createGenericEvidence(target, targetType));
  }

  // Calculate average confidence
  const avgConfidence = evidence.length > 0
    ? evidence.reduce((sum, e) => sum + e.confidence, 0) / evidence.length
    : 0.5;

  return {
    target,
    targetType,
    evidence,
    totalCount: evidence.length,
    averageConfidence: avgConfidence,
    collectedAt: new Date(),
    sources: Array.from(sources),
  };
}

/**
 * Get company-specific evidence
 */
function getCompanyEvidence(company: string): Evidence[] {
  const evidence: Evidence[] = [];

  // Check for known company
  for (const [knownCompany, templates] of Object.entries(COMPANY_EVIDENCE)) {
    if (company.toLowerCase().includes(knownCompany.toLowerCase()) ||
        knownCompany.toLowerCase().includes(company.toLowerCase())) {
      for (const template of templates) {
        evidence.push(createEvidence(template, company, 'Company Database'));
      }
      break;
    }
  }

  return evidence;
}

/**
 * Get signal-based evidence
 */
function getSignalEvidence(signal: string, target: string): Evidence[] {
  const evidence: Evidence[] = [];

  // Check for matching signal templates
  for (const [signalKey, templates] of Object.entries(SIGNAL_TEMPLATES)) {
    if (signal.toLowerCase().includes(signalKey) ||
        signalKey.includes(signal.toLowerCase())) {
      for (const template of templates) {
        evidence.push(createEvidence(
          {
            ...template,
            content: `${target}: ${template.content}`,
          },
          target,
          'Signal Detection'
        ));
      }
    }
  }

  return evidence;
}

/**
 * Create an evidence object from template
 */
function createEvidence(
  template: Partial<Evidence>,
  target: string,
  source: string
): Evidence {
  return {
    id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: template.type || 'profile',
    source,
    title: template.title || `Evidence for ${target}`,
    content: template.content || `Information about ${target}`,
    confidence: template.confidence || 0.7,
    relevance: template.relevance || 0.7,
    timestamp: new Date(),
    metadata: template.metadata || {},
  };
}

/**
 * Create generic evidence when no specific data available
 */
function createGenericEvidence(
  target: string,
  targetType: 'company' | 'sector' | 'region'
): Evidence {
  const descriptions: Record<string, string> = {
    company: `${target} is a business entity in the market. Limited specific information available.`,
    sector: `The ${target} sector is an active industry segment.`,
    region: `${target} is a geographic region with business activity.`,
  };

  return {
    id: `ev-generic-${Date.now()}`,
    type: 'profile',
    source: 'General Knowledge',
    title: `${targetType.charAt(0).toUpperCase() + targetType.slice(1)} Profile`,
    content: descriptions[targetType],
    confidence: 0.5,
    relevance: 0.6,
    timestamp: new Date(),
    metadata: { isGeneric: true },
  };
}

/**
 * Collect evidence for multiple targets
 */
export function collectBulkEvidence(
  targets: string[],
  targetType: 'company' | 'sector' | 'region' = 'company',
  signals: string[] = []
): Map<string, EvidenceCollection> {
  const results = new Map<string, EvidenceCollection>();

  for (const target of targets) {
    results.set(target, collectEvidence(target, targetType, signals));
  }

  return results;
}

/**
 * Filter evidence by confidence threshold
 */
export function filterByConfidence(
  collection: EvidenceCollection,
  minConfidence: number = 0.6
): EvidenceCollection {
  const filtered = collection.evidence.filter(e => e.confidence >= minConfidence);

  return {
    ...collection,
    evidence: filtered,
    totalCount: filtered.length,
    averageConfidence: filtered.length > 0
      ? filtered.reduce((sum, e) => sum + e.confidence, 0) / filtered.length
      : 0,
  };
}

/**
 * Filter evidence by type
 */
export function filterByType(
  collection: EvidenceCollection,
  types: EvidenceSourceType[]
): EvidenceCollection {
  const filtered = collection.evidence.filter(e => types.includes(e.type));

  return {
    ...collection,
    evidence: filtered,
    totalCount: filtered.length,
  };
}

/**
 * Get top N evidence by relevance
 */
export function getTopEvidence(
  collection: EvidenceCollection,
  n: number = 5
): Evidence[] {
  return [...collection.evidence]
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, n);
}
