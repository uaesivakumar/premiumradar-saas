/**
 * Sales Context Provider
 *
 * Provides and manages the Sales Context for the entire application.
 * This context sits ABOVE the SIVA Intelligence Layer and filters
 * all intelligence operations.
 *
 * Hierarchy: Vertical → Sub-Vertical → Region
 *
 * IMPORTANT: This is about the SALESPERSON's context, NOT target company industries.
 */

import type {
  SalesContext,
  SalesConfig,
  Vertical,
  SubVertical,
  RegionContext,
  ContextFilter,
  SalesSignal,
  SalesSignalType,
  SignalMatchPredicate,
  DEFAULT_SALES_CONTEXT,
} from './types';

// =============================================================================
// Context Creation
// =============================================================================

/**
 * Create a new SalesContext
 */
export function createSalesContext(
  options: {
    userId: string;
    vertical: Vertical;
    subVertical: SubVertical;
    region: RegionContext;
    salesConfig?: Partial<SalesConfig>;
  }
): SalesContext {
  const now = new Date();

  return {
    id: `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId: options.userId,
    vertical: options.vertical,
    subVertical: options.subVertical,
    region: options.region,
    salesConfig: {
      targetCompanySize: options.salesConfig?.targetCompanySize || ['mid-market', 'enterprise'],
      hiringSensitivity: options.salesConfig?.hiringSensitivity || 'high',
      expansionSensitivity: options.salesConfig?.expansionSensitivity || 'medium',
      fundingSensitivity: options.salesConfig?.fundingSensitivity || 'medium',
      productKPIs: options.salesConfig?.productKPIs || [],
      ...options.salesConfig,
    },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update an existing SalesContext
 */
export function updateSalesContext(
  context: SalesContext,
  updates: Partial<Omit<SalesContext, 'id' | 'createdAt'>>
): SalesContext {
  return {
    ...context,
    ...updates,
    salesConfig: {
      ...context.salesConfig,
      ...(updates.salesConfig || {}),
    },
    updatedAt: new Date(),
  };
}

// =============================================================================
// Context Filtering
// =============================================================================

/**
 * Create a filter from SalesContext for querying
 */
export function createContextFilter(context: SalesContext): ContextFilter {
  return {
    vertical: context.vertical,
    subVertical: context.subVertical,
    country: context.region.country,
    city: context.region.city,
    territory: context.region.territory,
    companySizes: context.salesConfig.targetCompanySize,
    minConfidence: 0.6,
  };
}

/**
 * Check if a signal matches the sales context
 */
export function signalMatchesContext(
  signal: SalesSignal,
  context: SalesContext
): boolean {
  // Region must match
  if (signal.region.country !== context.region.country) {
    return false;
  }

  // City filter (if specified in context)
  if (context.region.city && signal.region.city) {
    if (signal.region.city !== context.region.city) {
      return false;
    }
  }

  // Territory filter (if specified)
  if (context.region.territory && signal.region.territory) {
    if (signal.region.territory !== context.region.territory) {
      return false;
    }
  }

  // Check relevance threshold based on signal type sensitivity
  const sensitivity = getSignalSensitivity(signal.type, context);
  const minRelevance = sensitivityToThreshold(sensitivity);

  if (signal.relevance < minRelevance) {
    return false;
  }

  return true;
}

/**
 * Filter signals by sales context
 */
export function filterSignalsByContext(
  signals: SalesSignal[],
  context: SalesContext
): SalesSignal[] {
  return signals.filter(signal => signalMatchesContext(signal, context));
}

// =============================================================================
// Signal Relevance
// =============================================================================

/**
 * Get the sensitivity setting for a signal type
 */
function getSignalSensitivity(
  signalType: SalesSignalType,
  context: SalesContext
): 'low' | 'medium' | 'high' {
  const { salesConfig } = context;

  switch (signalType) {
    case 'hiring-expansion':
    case 'headcount-jump':
      return salesConfig.hiringSensitivity;

    case 'office-opening':
    case 'market-entry':
    case 'expansion-announcement':
    case 'subsidiary-creation':
      return salesConfig.expansionSensitivity;

    case 'funding-round':
      return salesConfig.fundingSensitivity;

    default:
      return 'medium';
  }
}

/**
 * Convert sensitivity to relevance threshold
 */
function sensitivityToThreshold(sensitivity: 'low' | 'medium' | 'high'): number {
  switch (sensitivity) {
    case 'high':
      return 0.3; // Show more signals (lower threshold)
    case 'medium':
      return 0.5;
    case 'low':
      return 0.7; // Show fewer signals (higher threshold)
  }
}

// =============================================================================
// Sub-Vertical Signal Mapping
// =============================================================================

/**
 * Get relevant signal types for a sub-vertical
 */
export function getRelevantSignalsForSubVertical(
  subVertical: SubVertical
): SalesSignalType[] {
  const signalMap: Record<SubVertical, SalesSignalType[]> = {
    // Banking
    'employee-banking': [
      'hiring-expansion',
      'headcount-jump',
      'office-opening',
      'subsidiary-creation',
      'market-entry',
    ],
    'corporate-banking': [
      'funding-round',
      'merger-acquisition',
      'expansion-announcement',
      'project-award',
    ],
    'sme-banking': [
      'funding-round',
      'hiring-expansion',
      'office-opening',
      'expansion-announcement',
    ],
    'retail-banking': [
      'market-entry',
      'expansion-announcement',
      'office-opening',
    ],
    'wealth-management': [
      'leadership-hiring',
      'merger-acquisition',
      'funding-round',
    ],

    // Insurance
    'group-insurance': [
      'hiring-expansion',
      'headcount-jump',
      'subsidiary-creation',
    ],
    'commercial-insurance': [
      'expansion-announcement',
      'project-award',
      'office-opening',
    ],
    'retail-insurance': [
      'market-entry',
      'expansion-announcement',
    ],

    // Real Estate
    'commercial-leasing': [
      'office-opening',
      'expansion-announcement',
      'market-entry',
      'hiring-expansion',
    ],
    'residential-sales': [
      'leadership-hiring',
      'hiring-expansion',
    ],
    'development-sales': [
      'project-award',
      'funding-round',
    ],

    // SaaS
    'enterprise-sales': [
      'funding-round',
      'hiring-expansion',
      'leadership-hiring',
      'expansion-announcement',
    ],
    'mid-market-sales': [
      'funding-round',
      'hiring-expansion',
      'office-opening',
    ],
    'smb-sales': [
      'funding-round',
      'hiring-expansion',
    ],
  };

  return signalMap[subVertical] || [];
}

/**
 * Score a signal's relevance to a sub-vertical
 */
export function scoreSignalRelevance(
  signal: SalesSignal,
  context: SalesContext
): number {
  const relevantSignals = getRelevantSignalsForSubVertical(context.subVertical);

  // Base relevance from signal
  let score = signal.relevance;

  // Boost if signal type is highly relevant to sub-vertical
  if (relevantSignals.includes(signal.type)) {
    const position = relevantSignals.indexOf(signal.type);
    const boost = (relevantSignals.length - position) / relevantSignals.length;
    score = score * (1 + boost * 0.3);
  } else {
    // Penalize if not directly relevant
    score = score * 0.7;
  }

  // Cap at 1.0
  return Math.min(score, 1.0);
}

// =============================================================================
// Context Serialization
// =============================================================================

/**
 * Serialize context for storage/transmission
 */
export function serializeSalesContext(context: SalesContext): string {
  return JSON.stringify({
    ...context,
    createdAt: context.createdAt.toISOString(),
    updatedAt: context.updatedAt.toISOString(),
  });
}

/**
 * Deserialize context from storage
 */
export function deserializeSalesContext(json: string): SalesContext {
  const parsed = JSON.parse(json);
  return {
    ...parsed,
    createdAt: new Date(parsed.createdAt),
    updatedAt: new Date(parsed.updatedAt),
  };
}

// =============================================================================
// Context Validation
// =============================================================================

/**
 * Validate that a sub-vertical belongs to a vertical
 */
export function isValidSubVertical(
  vertical: Vertical,
  subVertical: SubVertical
): boolean {
  const validCombinations: Record<Vertical, SubVertical[]> = {
    'banking': [
      'employee-banking',
      'corporate-banking',
      'sme-banking',
      'retail-banking',
      'wealth-management',
    ],
    'insurance': [
      'group-insurance',
      'commercial-insurance',
      'retail-insurance',
    ],
    'real-estate': [
      'commercial-leasing',
      'residential-sales',
      'development-sales',
    ],
    'saas-sales': [
      'enterprise-sales',
      'mid-market-sales',
      'smb-sales',
    ],
  };

  return validCombinations[vertical]?.includes(subVertical) || false;
}

/**
 * Get available sub-verticals for a vertical
 */
export function getSubVerticalsForVertical(vertical: Vertical): SubVertical[] {
  const mapping: Record<Vertical, SubVertical[]> = {
    'banking': [
      'employee-banking',
      'corporate-banking',
      'sme-banking',
      'retail-banking',
      'wealth-management',
    ],
    'insurance': [
      'group-insurance',
      'commercial-insurance',
      'retail-insurance',
    ],
    'real-estate': [
      'commercial-leasing',
      'residential-sales',
      'development-sales',
    ],
    'saas-sales': [
      'enterprise-sales',
      'mid-market-sales',
      'smb-sales',
    ],
  };

  return mapping[vertical] || [];
}

// =============================================================================
// Display Helpers
// =============================================================================

/**
 * Get human-readable name for vertical
 */
export function getVerticalDisplayName(vertical: Vertical): string {
  const names: Record<Vertical, string> = {
    'banking': 'Banking',
    'insurance': 'Insurance',
    'real-estate': 'Real Estate',
    'saas-sales': 'SaaS Sales',
  };
  return names[vertical] || vertical;
}

/**
 * Get human-readable name for sub-vertical
 */
export function getSubVerticalDisplayName(subVertical: SubVertical): string {
  const names: Record<SubVertical, string> = {
    'employee-banking': 'Employee Banking',
    'corporate-banking': 'Corporate Banking',
    'sme-banking': 'SME Banking',
    'retail-banking': 'Retail Banking',
    'wealth-management': 'Wealth Management',
    'group-insurance': 'Group Insurance',
    'commercial-insurance': 'Commercial Insurance',
    'retail-insurance': 'Retail Insurance',
    'commercial-leasing': 'Commercial Leasing',
    'residential-sales': 'Residential Sales',
    'development-sales': 'Development Sales',
    'enterprise-sales': 'Enterprise Sales',
    'mid-market-sales': 'Mid-Market Sales',
    'smb-sales': 'SMB Sales',
  };
  return names[subVertical] || subVertical;
}

/**
 * Get human-readable signal type name
 */
export function getSignalTypeDisplayName(signalType: SalesSignalType): string {
  const names: Record<SalesSignalType, string> = {
    'hiring-expansion': 'Hiring Expansion',
    'office-opening': 'Office Opening',
    'market-entry': 'Market Entry',
    'project-award': 'Project Award',
    'headcount-jump': 'Headcount Jump',
    'subsidiary-creation': 'Subsidiary Creation',
    'leadership-hiring': 'Leadership Hiring',
    'funding-round': 'Funding Round',
    'merger-acquisition': 'M&A Activity',
    'expansion-announcement': 'Expansion Announcement',
  };
  return names[signalType] || signalType;
}
