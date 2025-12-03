/**
 * Real Estate Vertical - Deep Signal Library
 * Sprint P3: Deep Vertical Intelligence Packs
 *
 * 30+ premium-grade signals for Real Estate sales professionals.
 * Targets: BUYERS/FAMILIES (residential sales, commercial leasing, property management)
 */

import type { Vertical } from '../../intelligence/context/types';
import type { DeepSignal } from './banking';

// =============================================================================
// REAL ESTATE SIGNAL DEFINITIONS
// =============================================================================

export const REAL_ESTATE_SIGNALS: DeepSignal[] = [
  // =============================================================================
  // LIFE TRANSITION SIGNALS (High Intent for Buyers/Renters)
  // =============================================================================
  {
    id: 're-family-growth',
    name: 'Family Growth',
    description: 'Growing family needs larger home - pregnancy, new child, adoption',
    category: 'intent',
    subcategory: 'life-transition',
    weight: 0.94,
    relevanceFactors: ['social announcements', 'family size changes', 'current home size'],
    dataSources: ['Social media', 'Public records', 'CRM data'],
    decayDays: 120,
    confidenceThreshold: 0.75,
  },
  {
    id: 're-marriage',
    name: 'Recent Marriage',
    description: 'Newly married couple looking for first home together',
    category: 'intent',
    subcategory: 'life-transition',
    weight: 0.91,
    relevanceFactors: ['marriage records', 'social announcements', 'current rental status'],
    dataSources: ['Public records', 'Social media', 'LinkedIn'],
    decayDays: 180,
    confidenceThreshold: 0.75,
  },
  {
    id: 're-divorce',
    name: 'Divorce/Separation',
    description: 'Individual going through divorce, needs new housing',
    category: 'intent',
    subcategory: 'life-transition',
    weight: 0.89,
    relevanceFactors: ['court records', 'address changes', 'property listings'],
    dataSources: ['Court records', 'MLS data', 'Public records'],
    decayDays: 120,
    confidenceThreshold: 0.7,
  },
  {
    id: 're-empty-nest',
    name: 'Empty Nest',
    description: 'Children moved out, looking to downsize',
    category: 'intent',
    subcategory: 'life-transition',
    weight: 0.85,
    relevanceFactors: ['family age indicators', 'current home size', 'retirement signals'],
    dataSources: ['Social media', 'Public records', 'LinkedIn'],
    decayDays: 180,
    confidenceThreshold: 0.7,
  },
  {
    id: 're-retirement',
    name: 'Retirement Relocation',
    description: 'Retiring and looking to relocate to new area',
    category: 'intent',
    subcategory: 'life-transition',
    weight: 0.88,
    relevanceFactors: ['retirement announcements', 'age indicators', 'location preferences'],
    dataSources: ['LinkedIn', 'Social media', 'Public records'],
    decayDays: 365,
    confidenceThreshold: 0.7,
  },
  {
    id: 're-death-in-family',
    name: 'Estate Settlement',
    description: 'Family settling estate, property may be sold',
    category: 'timing',
    subcategory: 'life-transition',
    weight: 0.82,
    relevanceFactors: ['probate records', 'estate filings', 'property status'],
    dataSources: ['Probate records', 'Public records', 'MLS data'],
    decayDays: 180,
    confidenceThreshold: 0.75,
  },

  // =============================================================================
  // EMPLOYMENT & RELOCATION SIGNALS
  // =============================================================================
  {
    id: 're-job-relocation',
    name: 'Job Relocation',
    description: 'Individual relocating for new job opportunity',
    category: 'intent',
    subcategory: 'relocation',
    weight: 0.96,
    relevanceFactors: ['job change', 'company location', 'current residence distance'],
    dataSources: ['LinkedIn', 'Company announcements', 'Social media'],
    decayDays: 60,
    confidenceThreshold: 0.8,
  },
  {
    id: 're-corporate-transfer',
    name: 'Corporate Transfer',
    description: 'Employee being transferred to new location by employer',
    category: 'intent',
    subcategory: 'relocation',
    weight: 0.95,
    relevanceFactors: ['company relocation programs', 'office moves', 'title changes'],
    dataSources: ['LinkedIn', 'Company data', 'HR partnerships'],
    decayDays: 45,
    confidenceThreshold: 0.85,
  },
  {
    id: 're-remote-work',
    name: 'Remote Work Transition',
    description: 'Moving to remote work, considering relocation',
    category: 'intent',
    subcategory: 'relocation',
    weight: 0.78,
    relevanceFactors: ['job type changes', 'company policies', 'location flexibility'],
    dataSources: ['LinkedIn', 'Company announcements', 'Job postings'],
    decayDays: 90,
    confidenceThreshold: 0.6,
  },
  {
    id: 're-new-job-local',
    name: 'New Job Same City',
    description: 'New job in same city may trigger closer housing search',
    category: 'intent',
    subcategory: 'relocation',
    weight: 0.72,
    relevanceFactors: ['job location', 'commute changes', 'current residence'],
    dataSources: ['LinkedIn', 'Company data', 'Maps data'],
    decayDays: 60,
    confidenceThreshold: 0.65,
  },

  // =============================================================================
  // RENTAL & LEASE SIGNALS
  // =============================================================================
  {
    id: 're-lease-expiring',
    name: 'Lease Expiring',
    description: 'Current rental lease approaching end date',
    category: 'timing',
    subcategory: 'rental',
    weight: 0.97,
    relevanceFactors: ['lease term', 'move-in date', 'renewal patterns'],
    dataSources: ['Property management data', 'CRM data', 'Partner data'],
    decayDays: 60,
    confidenceThreshold: 0.85,
  },
  {
    id: 're-rent-increase',
    name: 'Facing Rent Increase',
    description: 'Tenant facing significant rent increase at renewal',
    category: 'timing',
    subcategory: 'rental',
    weight: 0.92,
    relevanceFactors: ['market rent trends', 'building rate increases', 'tenant duration'],
    dataSources: ['Property management', 'Market data', 'Rental platforms'],
    decayDays: 45,
    confidenceThreshold: 0.75,
  },
  {
    id: 're-first-time-buyer',
    name: 'First-Time Buyer Signals',
    description: 'Renter showing first-time home buyer indicators',
    category: 'intent',
    subcategory: 'rental',
    weight: 0.90,
    relevanceFactors: ['rental history', 'income level', 'savings indicators'],
    dataSources: ['Credit bureaus', 'Rental history', 'CRM data'],
    decayDays: 120,
    confidenceThreshold: 0.7,
  },
  {
    id: 're-dissatisfied-tenant',
    name: 'Dissatisfied Tenant',
    description: 'Tenant showing signs of dissatisfaction with current rental',
    category: 'engagement',
    subcategory: 'rental',
    weight: 0.75,
    relevanceFactors: ['maintenance complaints', 'review activity', 'property issues'],
    dataSources: ['Property management', 'Review sites', 'Social media'],
    decayDays: 60,
    confidenceThreshold: 0.65,
  },

  // =============================================================================
  // PROPERTY & OWNERSHIP SIGNALS
  // =============================================================================
  {
    id: 're-listing-withdrawn',
    name: 'Listing Withdrawn',
    description: 'Property listing was withdrawn, may relist with new agent',
    category: 'timing',
    subcategory: 'ownership',
    weight: 0.88,
    relevanceFactors: ['MLS history', 'listing duration', 'withdrawal reason'],
    dataSources: ['MLS data', 'Property records', 'Agent networks'],
    decayDays: 90,
    confidenceThreshold: 0.8,
  },
  {
    id: 're-fsbo-expired',
    name: 'FSBO Expired',
    description: 'For Sale By Owner listing expired, may need agent help',
    category: 'timing',
    subcategory: 'ownership',
    weight: 0.93,
    relevanceFactors: ['FSBO listings', 'listing duration', 'price history'],
    dataSources: ['FSBO platforms', 'Property records', 'MLS data'],
    decayDays: 45,
    confidenceThreshold: 0.85,
  },
  {
    id: 're-equity-rich',
    name: 'High Equity Position',
    description: 'Homeowner with significant equity, prime for upgrade',
    category: 'quality',
    subcategory: 'ownership',
    weight: 0.85,
    relevanceFactors: ['purchase price', 'current value', 'loan balance'],
    dataSources: ['Property records', 'Mortgage data', 'Market analysis'],
    decayDays: 180,
    confidenceThreshold: 0.75,
  },
  {
    id: 're-long-tenure',
    name: 'Long Tenure Owner',
    description: 'Homeowner in property 10+ years, likely to consider move',
    category: 'timing',
    subcategory: 'ownership',
    weight: 0.76,
    relevanceFactors: ['ownership duration', 'property condition', 'life stage'],
    dataSources: ['Property records', 'Public records', 'CRM data'],
    decayDays: 365,
    confidenceThreshold: 0.6,
  },
  {
    id: 're-pre-foreclosure',
    name: 'Pre-Foreclosure',
    description: 'Property in pre-foreclosure, may need quick sale',
    category: 'timing',
    subcategory: 'ownership',
    weight: 0.91,
    relevanceFactors: ['default notices', 'lis pendens', 'payment history'],
    dataSources: ['County records', 'Foreclosure databases', 'Court records'],
    decayDays: 90,
    confidenceThreshold: 0.85,
  },

  // =============================================================================
  // COMMERCIAL REAL ESTATE SIGNALS
  // =============================================================================
  {
    id: 're-business-expansion',
    name: 'Business Expansion',
    description: 'Company expanding and needs additional commercial space',
    category: 'intent',
    subcategory: 'commercial',
    weight: 0.93,
    relevanceFactors: ['hiring signals', 'revenue growth', 'current space utilization'],
    dataSources: ['LinkedIn', 'News', 'Commercial brokers'],
    decayDays: 90,
    confidenceThreshold: 0.75,
  },
  {
    id: 're-commercial-lease-expiry',
    name: 'Commercial Lease Expiring',
    description: 'Business commercial lease approaching renewal date',
    category: 'timing',
    subcategory: 'commercial',
    weight: 0.95,
    relevanceFactors: ['lease terms', 'occupancy data', 'tenant improvements'],
    dataSources: ['Commercial databases', 'Broker networks', 'Property management'],
    decayDays: 180,
    confidenceThreshold: 0.8,
  },
  {
    id: 're-office-downsizing',
    name: 'Office Downsizing',
    description: 'Company reducing office footprint due to remote work',
    category: 'intent',
    subcategory: 'commercial',
    weight: 0.86,
    relevanceFactors: ['remote work policies', 'sublease listings', 'space reduction'],
    dataSources: ['News', 'Commercial listings', 'Company announcements'],
    decayDays: 120,
    confidenceThreshold: 0.7,
  },
  {
    id: 're-new-business',
    name: 'New Business Launch',
    description: 'New business starting and needs commercial space',
    category: 'intent',
    subcategory: 'commercial',
    weight: 0.89,
    relevanceFactors: ['business registration', 'funding', 'hiring activity'],
    dataSources: ['Business registries', 'Crunchbase', 'LinkedIn'],
    decayDays: 60,
    confidenceThreshold: 0.75,
  },

  // =============================================================================
  // INVESTMENT SIGNALS
  // =============================================================================
  {
    id: 're-investor-interest',
    name: 'Investment Property Interest',
    description: 'Individual showing interest in investment properties',
    category: 'intent',
    subcategory: 'investment',
    weight: 0.84,
    relevanceFactors: ['search behavior', 'property history', 'portfolio size'],
    dataSources: ['Property records', 'Intent data', 'CRM data'],
    decayDays: 90,
    confidenceThreshold: 0.7,
  },
  {
    id: 're-1031-exchange',
    name: '1031 Exchange Window',
    description: 'Investor in 1031 exchange timeline, must purchase quickly',
    category: 'timing',
    subcategory: 'investment',
    weight: 0.96,
    relevanceFactors: ['recent sale', 'exchange intermediary', 'timeline urgency'],
    dataSources: ['Property records', 'Tax records', 'Broker networks'],
    decayDays: 45,
    confidenceThreshold: 0.85,
  },
  {
    id: 're-portfolio-expansion',
    name: 'Portfolio Expansion',
    description: 'Real estate investor actively expanding portfolio',
    category: 'intent',
    subcategory: 'investment',
    weight: 0.87,
    relevanceFactors: ['recent purchases', 'acquisition patterns', 'financing activity'],
    dataSources: ['Property records', 'Mortgage data', 'Investor networks'],
    decayDays: 120,
    confidenceThreshold: 0.75,
  },

  // =============================================================================
  // ENGAGEMENT & RESEARCH SIGNALS
  // =============================================================================
  {
    id: 're-property-search',
    name: 'Active Property Search',
    description: 'Individual actively searching for properties online',
    category: 'engagement',
    subcategory: 'research',
    weight: 0.82,
    relevanceFactors: ['search frequency', 'saved properties', 'alert subscriptions'],
    dataSources: ['Portal data', 'Intent providers', 'Website analytics'],
    decayDays: 30,
    confidenceThreshold: 0.7,
  },
  {
    id: 're-mortgage-preapproval',
    name: 'Mortgage Pre-Approval',
    description: 'Individual obtained mortgage pre-approval',
    category: 'intent',
    subcategory: 'research',
    weight: 0.95,
    relevanceFactors: ['lender applications', 'credit inquiries', 'pre-approval letters'],
    dataSources: ['Lender networks', 'Credit bureaus', 'Partner data'],
    decayDays: 60,
    confidenceThreshold: 0.85,
  },
  {
    id: 're-open-house-attendee',
    name: 'Open House Attendee',
    description: 'Individual attended multiple open houses recently',
    category: 'engagement',
    subcategory: 'research',
    weight: 0.88,
    relevanceFactors: ['sign-in sheets', 'showing requests', 'agent interactions'],
    dataSources: ['Agent networks', 'Showing platforms', 'CRM data'],
    decayDays: 30,
    confidenceThreshold: 0.8,
  },

  // =============================================================================
  // RISK & NEGATIVE SIGNALS
  // =============================================================================
  {
    id: 're-credit-issues',
    name: 'Credit Challenges',
    description: 'Individual has credit issues affecting mortgage qualification',
    category: 'risk',
    subcategory: 'negative',
    weight: -0.50,
    relevanceFactors: ['credit score', 'delinquencies', 'bankruptcy history'],
    dataSources: ['Credit bureaus', 'Public records', 'Lender networks'],
    decayDays: 365,
    confidenceThreshold: 0.8,
  },
  {
    id: 're-job-instability',
    name: 'Employment Instability',
    description: 'Individual has unstable employment history',
    category: 'risk',
    subcategory: 'negative',
    weight: -0.40,
    relevanceFactors: ['job changes', 'employment gaps', 'industry volatility'],
    dataSources: ['LinkedIn', 'Employment verification', 'CRM data'],
    decayDays: 180,
    confidenceThreshold: 0.7,
  },
  {
    id: 're-not-motivated',
    name: 'Low Motivation Seller',
    description: 'Seller not motivated to sell at market price',
    category: 'risk',
    subcategory: 'negative',
    weight: -0.35,
    relevanceFactors: ['price expectations', 'time on market', 'showing feedback'],
    dataSources: ['MLS data', 'Agent feedback', 'Showing data'],
    decayDays: 90,
    confidenceThreshold: 0.65,
  },
];

// =============================================================================
// SCORING CONFIGURATION
// =============================================================================

export interface RealEstateScoringConfig {
  weights: {
    quality: number;
    timing: number;
    likelihood: number;
    engagement: number;
    motivation: number;
  };
  thresholds: {
    hot: number;
    warm: number;
    cold: number;
  };
  boosts: {
    multiSignal: number;
    recentActivity: number;
    highConfidence: number;
    urgentTiming: number;
  };
}

export const REAL_ESTATE_SCORING_CONFIG: RealEstateScoringConfig = {
  weights: {
    quality: 0.15,      // Individual/property quality indicators
    timing: 0.35,       // Time-sensitive opportunities (highest for real estate)
    likelihood: 0.20,   // Likelihood to buy/sell
    engagement: 0.15,   // Prior engagement signals
    motivation: 0.15,   // Buyer/seller motivation level
  },
  thresholds: {
    hot: 72,            // Score >= 72 is hot
    warm: 48,           // Score 48-71 is warm
    cold: 0,            // Score < 48 is cold
  },
  boosts: {
    multiSignal: 1.18,      // 18% boost for 3+ signals
    recentActivity: 1.20,   // 20% boost for activity in last 7 days
    highConfidence: 1.10,   // 10% boost for high confidence signals
    urgentTiming: 1.30,     // 30% boost for time-critical signals (lease expiry, 1031)
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getRealEstateSignals(): DeepSignal[] {
  return REAL_ESTATE_SIGNALS;
}

export function getRealEstateSignalById(id: string): DeepSignal | undefined {
  return REAL_ESTATE_SIGNALS.find(s => s.id === id);
}

export function getRealEstateSignalsByCategory(category: DeepSignal['category']): DeepSignal[] {
  return REAL_ESTATE_SIGNALS.filter(s => s.category === category);
}

export function getRealEstateSignalsBySubcategory(subcategory: string): DeepSignal[] {
  return REAL_ESTATE_SIGNALS.filter(s => s.subcategory === subcategory);
}

export function getRealEstateScoringConfig(): RealEstateScoringConfig {
  return REAL_ESTATE_SCORING_CONFIG;
}

export const REAL_ESTATE_VERTICAL: Vertical = 'real-estate';
