/**
 * Sales Context Provider
 *
 * Provides and manages the Sales Context for the entire application.
 * This context sits ABOVE the SIVA Intelligence Layer and filters
 * all intelligence operations.
 *
 * CRITICAL ARCHITECTURE:
 * - SaaS Frontend ONLY selects: vertical/sub-vertical/region
 * - UPR OS DECIDES: which signals, how reasoning, how routing
 * - SalesContextProvider LOADS rules from OS, applies to SIVA
 *
 * Hierarchy: Vertical → Sub-Vertical → Region
 *
 * DIFFERENT VERTICALS TARGET DIFFERENT ENTITIES:
 * - Banking: targets COMPANIES (hiring signals relevant)
 * - Insurance: targets INDIVIDUALS (life events relevant)
 * - Real Estate: targets FAMILIES (rental expiry relevant)
 * - Recruitment: targets CANDIDATES (job postings relevant)
 *
 * HIRING SIGNALS ARE ONLY FOR BANKING.
 */

import type {
  SalesContext,
  SalesConfig,
  Vertical,
  SubVertical,
  RegionContext,
  ContextFilter,
  SalesSignal,
  VerticalConfig,
  RadarTarget,
} from './types';
import {
  VERTICAL_RADAR_TARGETS,
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
    verticalConfig?: VerticalConfig;
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
      signalSensitivities: options.salesConfig?.signalSensitivities || {},
      productKPIs: options.salesConfig?.productKPIs || [],
      ...options.salesConfig,
    },
    verticalConfig: options.verticalConfig,
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

/**
 * Apply OS configuration to a context
 */
export function applyVerticalConfig(
  context: SalesContext,
  config: VerticalConfig
): SalesContext {
  return {
    ...context,
    verticalConfig: config,
    updatedAt: new Date(),
  };
}

// =============================================================================
// Radar Target Helpers
// =============================================================================

/**
 * Get the radar target for a vertical
 */
export function getRadarTarget(vertical: Vertical): RadarTarget {
  return VERTICAL_RADAR_TARGETS[vertical];
}

/**
 * Check if a vertical targets companies (vs individuals/families)
 */
export function targetsCompanies(vertical: Vertical): boolean {
  const target = getRadarTarget(vertical);
  return target === 'companies';
}

/**
 * Check if hiring signals are relevant for this vertical
 * HIRING SIGNALS ARE ONLY FOR BANKING (and SaaS sales)
 */
export function hiringSignalsRelevant(vertical: Vertical): boolean {
  return vertical === 'banking' || vertical === 'saas-sales';
}

// =============================================================================
// Signal Filtering (OS-Configured)
// =============================================================================

/**
 * Get allowed signal types for a context
 * Returns from verticalConfig if loaded, otherwise returns empty array
 *
 * IMPORTANT: verticalConfig must be loaded from the API before calling this.
 * If no config is loaded, returns empty array and logs warning.
 */
export function getAllowedSignalTypes(context: SalesContext): string[] {
  // If vertical config is loaded, use it
  if (context.verticalConfig) {
    // Find sub-vertical specific signals
    const subVerticalConfig = context.verticalConfig.subVerticals.find(
      sv => sv.id === context.subVertical
    );
    if (subVerticalConfig) {
      return subVerticalConfig.relevantSignalTypes;
    }
    // Fall back to vertical-level allowed signals
    return context.verticalConfig.allowedSignalTypes;
  }

  // No config loaded - vertical not configured
  console.warn(
    `[SalesContext] No config loaded for ${context.vertical}/${context.subVertical}/${context.region.country}. ` +
    `Fetch config from /api/admin/vertical-config first.`
  );
  return [];
}

/**
 * Check if a signal type is allowed for this context
 */
export function isSignalTypeAllowed(
  signalType: string,
  context: SalesContext
): boolean {
  const allowedTypes = getAllowedSignalTypes(context);
  return allowedTypes.includes(signalType);
}

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
    allowedSignalTypes: getAllowedSignalTypes(context),
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
  // 1. Check if signal type is allowed for this vertical
  if (!isSignalTypeAllowed(signal.type, context)) {
    return false;
  }

  // 2. Region must match
  if (signal.region.country !== context.region.country) {
    return false;
  }

  // 3. City filter (if specified in context)
  if (context.region.city && signal.region.city) {
    if (signal.region.city !== context.region.city) {
      return false;
    }
  }

  // 4. Territory filter (if specified)
  if (context.region.territory && signal.region.territory) {
    if (signal.region.territory !== context.region.territory) {
      return false;
    }
  }

  // 5. Check confidence threshold
  const sensitivity = context.salesConfig.signalSensitivities[signal.type] || 'medium';
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
// Signal Relevance (OS-Configured)
// =============================================================================

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

/**
 * Score a signal's relevance to context
 * Uses OS config if available
 */
export function scoreSignalRelevance(
  signal: SalesSignal,
  context: SalesContext
): number {
  // Base relevance from signal
  let score = signal.relevance;

  // Check if signal type is allowed
  if (!isSignalTypeAllowed(signal.type, context)) {
    return 0; // Not relevant at all
  }

  // Boost based on sub-vertical relevance (from OS config)
  if (context.verticalConfig) {
    const subVerticalConfig = context.verticalConfig.subVerticals.find(
      sv => sv.id === context.subVertical
    );
    if (subVerticalConfig) {
      const relevantTypes = subVerticalConfig.relevantSignalTypes;
      if (relevantTypes.includes(signal.type)) {
        const position = relevantTypes.indexOf(signal.type);
        const boost = (relevantTypes.length - position) / relevantTypes.length;
        score = score * (1 + boost * 0.3);
      }
    }
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
 * NOTE: This will eventually be loaded from OS config
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
      'life-insurance',
      'group-insurance',
      'health-insurance',
      'commercial-insurance',
    ],
    'real-estate': [
      'residential-sales',
      'commercial-leasing',
      'property-management',
    ],
    'recruitment': [
      'executive-search',
      'tech-recruitment',
      'mass-recruitment',
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
 * NOTE: This will eventually be loaded from OS config
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
      'life-insurance',
      'group-insurance',
      'health-insurance',
      'commercial-insurance',
    ],
    'real-estate': [
      'residential-sales',
      'commercial-leasing',
      'property-management',
    ],
    'recruitment': [
      'executive-search',
      'tech-recruitment',
      'mass-recruitment',
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
    'recruitment': 'Recruitment',
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
    'life-insurance': 'Life Insurance',
    'group-insurance': 'Group Insurance',
    'health-insurance': 'Health Insurance',
    'commercial-insurance': 'Commercial Insurance',
    'residential-sales': 'Residential Sales',
    'commercial-leasing': 'Commercial Leasing',
    'property-management': 'Property Management',
    'executive-search': 'Executive Search',
    'tech-recruitment': 'Tech Recruitment',
    'mass-recruitment': 'Mass Recruitment',
    'enterprise-sales': 'Enterprise Sales',
    'mid-market-sales': 'Mid-Market Sales',
    'smb-sales': 'SMB Sales',
  };
  return names[subVertical] || subVertical;
}

/**
 * Get human-readable radar target description
 */
export function getRadarTargetDescription(vertical: Vertical): string {
  const target = getRadarTarget(vertical);
  const descriptions: Record<RadarTarget, string> = {
    'companies': 'Companies and businesses',
    'individuals': 'Individual people',
    'families': 'Families and home buyers',
    'candidates': 'Job candidates and employers',
  };
  return descriptions[target];
}
