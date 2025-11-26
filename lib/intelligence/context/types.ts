/**
 * Sales Context Types
 *
 * Defines the Vertical → Sub-Vertical → Region hierarchy
 * for sales-contextual intelligence.
 *
 * IMPORTANT: This is about the SALESPERSON's context, NOT the target company's industry.
 */

// =============================================================================
// Vertical Types (Salesperson's Industry)
// =============================================================================

/**
 * Vertical = The industry the SALESPERSON works in
 * NOT the industry of target companies
 */
export type Vertical =
  | 'banking'
  | 'insurance'
  | 'real-estate'
  | 'saas-sales';

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
  | 'group-insurance'     // Employee group health, life
  | 'commercial-insurance' // Business insurance
  | 'retail-insurance';   // Personal policies

export type RealEstateSubVertical =
  | 'commercial-leasing'  // Office, retail space
  | 'residential-sales'   // Home sales
  | 'development-sales';  // New developments

export type SaaSSubVertical =
  | 'enterprise-sales'    // Large enterprise deals
  | 'mid-market-sales'    // Mid-sized companies
  | 'smb-sales';          // Small business

export type SubVertical =
  | BankingSubVertical
  | InsuranceSubVertical
  | RealEstateSubVertical
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

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Sales configuration parameters
 */
export interface SalesConfig {
  // Target company criteria
  targetCompanySize: CompanySize[];
  revenueThreshold?: {
    min?: number;
    max?: number;
    currency: string;
  };
  headcountThreshold?: {
    min?: number;
    max?: number;
  };

  // Signal sensitivity
  hiringSensitivity: SignalSensitivity;
  expansionSensitivity: SignalSensitivity;
  fundingSensitivity: SignalSensitivity;

  // KPIs
  productKPIs: ProductKPI[];

  // Preferred industries (for target companies, NOT for salesperson vertical)
  preferredTargetIndustries?: string[];
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
// Sales Signal Types
// =============================================================================

/**
 * Valid sales signals that indicate opportunity
 * These are activity-based, NOT industry-based
 */
export type SalesSignalType =
  | 'hiring-expansion'      // Company is hiring = needs banking/payroll
  | 'office-opening'        // New office = new accounts
  | 'market-entry'          // Entering region = needs local services
  | 'project-award'         // New project = cash flow needs
  | 'headcount-jump'        // Growing team = payroll opportunity
  | 'subsidiary-creation'   // New entity = new accounts
  | 'leadership-hiring'     // New decision makers
  | 'funding-round'         // Capital = banking relationship
  | 'merger-acquisition'    // M&A = banking needs
  | 'expansion-announcement'; // General growth = opportunity

/**
 * A detected sales signal
 */
export interface SalesSignal {
  id: string;
  type: SalesSignalType;
  company: string;
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
  signalTypes?: SalesSignalType[];
  minConfidence?: number;
  companySizes?: CompanySize[];
}

/**
 * Predicate function to check if a signal matches context
 */
export type SignalMatchPredicate = (
  signal: SalesSignal,
  context: SalesContext
) => boolean;

// =============================================================================
// Default Values
// =============================================================================

/**
 * Default sales context for Banking Employee Banking in UAE
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
    headcountThreshold: {
      min: 50,
    },
    hiringSensitivity: 'high',
    expansionSensitivity: 'medium',
    fundingSensitivity: 'medium',
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
  createdAt: new Date(),
  updatedAt: new Date(),
};
