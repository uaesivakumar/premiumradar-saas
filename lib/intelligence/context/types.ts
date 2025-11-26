/**
 * Sales Context Types
 *
 * Defines the Vertical → Sub-Vertical → Region hierarchy
 * for sales-contextual intelligence.
 *
 * CRITICAL RULES:
 * 1. Different verticals have DIFFERENT radar targets
 * 2. Hiring signals are ONLY for Banking
 * 3. All vertical rules come from OS, NOT hardcoded here
 * 4. SaaS only selects vertical/sub-vertical/region
 * 5. OS decides which signals apply
 */

// =============================================================================
// Vertical Types (Salesperson's Sector)
// =============================================================================

/**
 * Vertical = The sector the SALESPERSON works in
 *
 * IMPORTANT: Different verticals target different entities:
 * - banking: targets COMPANIES
 * - insurance: targets INDIVIDUALS
 * - real-estate: targets BUYERS/FAMILIES
 * - recruitment: targets CANDIDATES
 * - saas-sales: targets COMPANIES
 */
export type Vertical =
  | 'banking'
  | 'insurance'
  | 'real-estate'
  | 'recruitment'
  | 'saas-sales';

/**
 * What type of entity this vertical targets
 */
export type RadarTarget =
  | 'companies'    // Banking, SaaS
  | 'individuals'  // Insurance
  | 'families'     // Real Estate
  | 'candidates';  // Recruitment

/**
 * Mapping of verticals to their radar targets
 * This is fundamental and does not change per OS config
 */
export const VERTICAL_RADAR_TARGETS: Record<Vertical, RadarTarget> = {
  'banking': 'companies',
  'insurance': 'individuals',
  'real-estate': 'families',
  'recruitment': 'candidates',
  'saas-sales': 'companies',
};

/**
 * Sub-Vertical = The salesperson's functional role within their vertical
 */
export type BankingSubVertical =
  | 'employee-banking'    // Payroll, salary accounts, employee benefits
  | 'corporate-banking'   // Treasury, trade finance, corporate loans
  | 'sme-banking'         // Small business accounts, working capital
  | 'retail-banking'      // Personal accounts, mortgages, cards
  | 'wealth-management';  // Private banking, investments

export type InsuranceSubVertical =
  | 'life-insurance'       // Individual life policies
  | 'group-insurance'      // Employee group health, life
  | 'health-insurance'     // Medical coverage
  | 'commercial-insurance'; // Business insurance

export type RealEstateSubVertical =
  | 'residential-sales'    // Home sales to families
  | 'commercial-leasing'   // Office, retail space
  | 'property-management'; // Rental management

export type RecruitmentSubVertical =
  | 'executive-search'     // C-level recruitment
  | 'tech-recruitment'     // IT/tech roles
  | 'mass-recruitment';    // Volume hiring

export type SaaSSubVertical =
  | 'enterprise-sales'     // Large enterprise deals
  | 'mid-market-sales'     // Mid-sized companies
  | 'smb-sales';           // Small business

export type SubVertical =
  | BankingSubVertical
  | InsuranceSubVertical
  | RealEstateSubVertical
  | RecruitmentSubVertical
  | SaaSSubVertical;

// =============================================================================
// Region Types
// =============================================================================

/**
 * Region hierarchy: Country → City → Territory
 */
export interface RegionContext {
  country: string;        // UAE, India, US
  city?: string;          // Dubai, Chennai, Bangalore
  territory?: string;     // Dubai South, DIFC, Whitefield
}

// =============================================================================
// OS Configuration Types (Plug-and-Play)
// =============================================================================

/**
 * Configuration returned by OS for a vertical
 * This is the AUTHORITATIVE source of rules
 *
 * SaaS NEVER hardcodes these - always fetches from OS
 */
export interface VerticalConfig {
  vertical: Vertical;
  radarTarget: RadarTarget;
  subVerticals: SubVerticalConfig[];
  allowedSignalTypes: string[];  // Which signals apply to this vertical
  scoringFactors: ScoringFactorConfig[];
  playbooks: PlaybookConfig[];
  regions: RegionConfig[];
}

export interface SubVerticalConfig {
  id: SubVertical;
  name: string;
  description: string;
  relevantSignalTypes: string[];  // Subset of vertical's allowed signals
  defaultKPIs: KPITemplate[];
}

export interface ScoringFactorConfig {
  id: string;
  name: string;
  weight: number;
  signals: string[];
}

export interface PlaybookConfig {
  id: string;
  name: string;
  triggers: string[];
  actions: string[];
}

export interface RegionConfig {
  country: string;
  cities: string[];
  territories: string[];
}

export interface KPITemplate {
  product: string;
  defaultTarget: number;
  unit: string;
  period: 'monthly' | 'quarterly' | 'yearly';
}

// =============================================================================
// Sales Context
// =============================================================================

/**
 * Complete Sales Context for a salesperson
 * This context filters ALL intelligence operations
 */
export interface SalesContext {
  // Identity
  id: string;
  userId: string;

  // Vertical hierarchy
  vertical: Vertical;
  subVertical: SubVertical;

  // Geographic scope
  region: RegionContext;

  // Sales parameters
  salesConfig: SalesConfig;

  // OS-loaded configuration (NOT hardcoded)
  verticalConfig?: VerticalConfig;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Sales configuration parameters
 */
export interface SalesConfig {
  // Target entity criteria (varies by vertical)
  targetCompanySize?: CompanySize[];  // For company-targeting verticals
  targetIndividualCriteria?: IndividualCriteria;  // For individual-targeting verticals

  // Signal sensitivity (loaded from OS config)
  signalSensitivities: Record<string, SignalSensitivity>;

  // KPIs
  productKPIs: ProductKPI[];
}

export interface IndividualCriteria {
  ageRange?: { min?: number; max?: number };
  incomeRange?: { min?: number; max?: number; currency: string };
  lifeStage?: string[];  // 'young-professional', 'new-family', 'established', 'retirement'
}

export type CompanySize = 'startup' | 'smb' | 'mid-market' | 'enterprise' | 'large-enterprise';

export type SignalSensitivity = 'low' | 'medium' | 'high';

/**
 * Product-specific KPIs the salesperson is measured on
 */
export interface ProductKPI {
  product: string;
  target: number;
  current: number;
  unit: string;
  period: 'monthly' | 'quarterly' | 'yearly';
}

// =============================================================================
// Signal Types (OS-Configured)
// =============================================================================

/**
 * All possible signal types across all verticals
 * Which ones apply is determined by OS config, NOT hardcoded
 */
export type SalesSignalType =
  // Banking signals (targets: companies)
  | 'hiring-expansion'      // Company is hiring
  | 'office-opening'        // New office location
  | 'market-entry'          // Entering new market
  | 'project-award'         // Won new project
  | 'headcount-jump'        // Significant headcount change
  | 'subsidiary-creation'   // New subsidiary
  | 'leadership-hiring'     // New C-level hire
  | 'funding-round'         // Raised capital
  | 'merger-acquisition'    // M&A activity
  | 'expansion-announcement' // General expansion
  // Insurance signals (targets: individuals)
  | 'life-event'            // Marriage, birth, retirement
  | 'salary-change'         // Promotion, salary increase
  | 'job-change'            // Changed jobs
  | 'family-event'          // New family member
  // Real Estate signals (targets: families/buyers)
  | 'rental-expiry'         // Lease ending
  | 'relocation'            // Moving to new city
  | 'family-growth'         // Need bigger home
  // Recruitment signals (targets: candidates)
  | 'job-posting'           // Company posting jobs
  | 'layoff-announcement'   // Company laying off
  | 'skill-trending';       // Skills in demand

/**
 * A detected sales signal
 */
export interface SalesSignal {
  id: string;
  type: SalesSignalType;
  target: string;  // Company name OR individual name depending on vertical
  title: string;
  description: string;
  confidence: number;
  relevance: number;
  region: RegionContext;
  detectedAt: Date;
  source: string;
  metadata: Record<string, unknown>;
}

// =============================================================================
// Context Filtering
// =============================================================================

/**
 * Filter criteria derived from SalesContext
 */
export interface ContextFilter {
  // Must match
  vertical: Vertical;
  subVertical: SubVertical;
  country: string;

  // Optional refinements
  city?: string;
  territory?: string;
  allowedSignalTypes?: string[];  // From OS config
  minConfidence?: number;
}

/**
 * Predicate function to check if a signal matches context
 */
export type SignalMatchPredicate = (
  signal: SalesSignal,
  context: SalesContext
) => boolean;

// =============================================================================
// Default Values (Banking Only - Other Verticals Need OS Config)
// =============================================================================

/**
 * Default sales context for Banking Employee Banking in UAE
 * This is the ONLY hardcoded default - others require OS config
 */
export const DEFAULT_SALES_CONTEXT: SalesContext = {
  id: 'default',
  userId: 'demo-user',
  vertical: 'banking',
  subVertical: 'employee-banking',
  region: {
    country: 'UAE',
    city: 'Dubai',
  },
  salesConfig: {
    targetCompanySize: ['mid-market', 'enterprise', 'large-enterprise'],
    signalSensitivities: {
      'hiring-expansion': 'high',
      'office-opening': 'medium',
      'market-entry': 'medium',
      'funding-round': 'medium',
    },
    productKPIs: [
      {
        product: 'Payroll Accounts',
        target: 20,
        current: 8,
        unit: 'accounts',
        period: 'quarterly',
      },
      {
        product: 'Employee Benefits',
        target: 500000,
        current: 210000,
        unit: 'AED',
        period: 'quarterly',
      },
    ],
  },
  // No verticalConfig = must be loaded from OS
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Default Banking Vertical Config (temporary until OS provides it)
 * This is a PLACEHOLDER - production should load from OS
 */
export const DEFAULT_BANKING_CONFIG: VerticalConfig = {
  vertical: 'banking',
  radarTarget: 'companies',
  subVerticals: [
    {
      id: 'employee-banking',
      name: 'Employee Banking',
      description: 'Payroll, salary accounts, employee benefits',
      relevantSignalTypes: ['hiring-expansion', 'headcount-jump', 'office-opening', 'subsidiary-creation'],
      defaultKPIs: [
        { product: 'Payroll Accounts', defaultTarget: 20, unit: 'accounts', period: 'quarterly' },
      ],
    },
    {
      id: 'corporate-banking',
      name: 'Corporate Banking',
      description: 'Treasury, trade finance, corporate loans',
      relevantSignalTypes: ['funding-round', 'merger-acquisition', 'expansion-announcement', 'project-award'],
      defaultKPIs: [
        { product: 'Corporate Accounts', defaultTarget: 10, unit: 'accounts', period: 'quarterly' },
      ],
    },
  ],
  allowedSignalTypes: [
    'hiring-expansion',
    'office-opening',
    'market-entry',
    'project-award',
    'headcount-jump',
    'subsidiary-creation',
    'leadership-hiring',
    'funding-round',
    'merger-acquisition',
    'expansion-announcement',
  ],
  scoringFactors: [],
  playbooks: [],
  regions: [
    { country: 'UAE', cities: ['Dubai', 'Abu Dhabi'], territories: [] },
  ],
};
