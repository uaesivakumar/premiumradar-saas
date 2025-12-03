/**
 * Insurance Vertical - Deep Signal Library
 * Sprint P3: Deep Vertical Intelligence Packs
 *
 * 30+ premium-grade signals for Insurance sales professionals.
 * Targets: INDIVIDUALS (life insurance, health, property, group benefits)
 */

import type { Vertical } from '../../intelligence/context/types';
import type { DeepSignal } from './banking';

// =============================================================================
// INSURANCE SIGNAL DEFINITIONS
// =============================================================================

export const INSURANCE_SIGNALS: DeepSignal[] = [
  // =============================================================================
  // LIFE EVENT SIGNALS (High Intent for Individual Insurance)
  // =============================================================================
  {
    id: 'ins-marriage',
    name: 'Recent Marriage',
    description: 'Individual recently married, needs to review/update coverage',
    category: 'intent',
    subcategory: 'life-event',
    weight: 0.92,
    relevanceFactors: ['social media announcements', 'registry updates', 'name changes'],
    dataSources: ['LinkedIn', 'Social media', 'Public records'],
    decayDays: 90,
    confidenceThreshold: 0.75,
  },
  {
    id: 'ins-new-parent',
    name: 'New Parent',
    description: 'Individual recently had a child, needs life/health coverage review',
    category: 'intent',
    subcategory: 'life-event',
    weight: 0.95,
    relevanceFactors: ['social announcements', 'parental leave', 'dependent additions'],
    dataSources: ['Social media', 'HR systems', 'LinkedIn'],
    decayDays: 120,
    confidenceThreshold: 0.8,
  },
  {
    id: 'ins-home-purchase',
    name: 'Home Purchase',
    description: 'Individual purchased a home, needs property/mortgage insurance',
    category: 'intent',
    subcategory: 'life-event',
    weight: 0.94,
    relevanceFactors: ['property records', 'mortgage filings', 'address changes'],
    dataSources: ['Property records', 'MLS data', 'Credit bureaus'],
    decayDays: 60,
    confidenceThreshold: 0.85,
  },
  {
    id: 'ins-divorce',
    name: 'Divorce/Separation',
    description: 'Individual going through divorce, needs policy review/updates',
    category: 'intent',
    subcategory: 'life-event',
    weight: 0.88,
    relevanceFactors: ['court records', 'address changes', 'social signals'],
    dataSources: ['Court records', 'Public records', 'LinkedIn'],
    decayDays: 90,
    confidenceThreshold: 0.7,
  },
  {
    id: 'ins-retirement-approaching',
    name: 'Approaching Retirement',
    description: 'Individual within 5 years of retirement age',
    category: 'timing',
    subcategory: 'life-event',
    weight: 0.90,
    relevanceFactors: ['age indicators', 'career length', 'retirement planning signals'],
    dataSources: ['LinkedIn', 'HR data', 'Social signals'],
    decayDays: 365,
    confidenceThreshold: 0.7,
  },
  {
    id: 'ins-major-birthday',
    name: 'Major Birthday Milestone',
    description: 'Individual reaching milestone age (30, 40, 50, 60)',
    category: 'timing',
    subcategory: 'life-event',
    weight: 0.75,
    relevanceFactors: ['age data', 'social announcements', 'career timeline'],
    dataSources: ['LinkedIn', 'Social media', 'Public records'],
    decayDays: 60,
    confidenceThreshold: 0.8,
  },

  // =============================================================================
  // INCOME & EMPLOYMENT SIGNALS
  // =============================================================================
  {
    id: 'ins-salary-increase',
    name: 'Salary Increase',
    description: 'Individual received significant salary increase (>15%)',
    category: 'intent',
    subcategory: 'income',
    weight: 0.85,
    relevanceFactors: ['promotion', 'job change', 'company performance'],
    dataSources: ['LinkedIn', 'Glassdoor', 'Company announcements'],
    decayDays: 60,
    confidenceThreshold: 0.7,
  },
  {
    id: 'ins-job-change',
    name: 'Job Change',
    description: 'Individual changed jobs, needs benefits review',
    category: 'intent',
    subcategory: 'income',
    weight: 0.88,
    relevanceFactors: ['LinkedIn updates', 'employment changes', 'benefit gaps'],
    dataSources: ['LinkedIn', 'HR systems', 'Social media'],
    decayDays: 45,
    confidenceThreshold: 0.8,
  },
  {
    id: 'ins-promotion',
    name: 'Recent Promotion',
    description: 'Individual promoted to higher role with increased compensation',
    category: 'intent',
    subcategory: 'income',
    weight: 0.82,
    relevanceFactors: ['title change', 'responsibilities increase', 'compensation bump'],
    dataSources: ['LinkedIn', 'Company announcements', 'Social media'],
    decayDays: 60,
    confidenceThreshold: 0.75,
  },
  {
    id: 'ins-self-employed',
    name: 'Started Business',
    description: 'Individual became self-employed or started business',
    category: 'intent',
    subcategory: 'income',
    weight: 0.91,
    relevanceFactors: ['business registration', 'LinkedIn updates', 'company creation'],
    dataSources: ['Business registries', 'LinkedIn', 'Company databases'],
    decayDays: 90,
    confidenceThreshold: 0.8,
  },
  {
    id: 'ins-high-net-worth',
    name: 'High Net Worth Indicators',
    description: 'Individual shows signs of significant wealth accumulation',
    category: 'quality',
    subcategory: 'income',
    weight: 0.93,
    relevanceFactors: ['property ownership', 'business ownership', 'executive role'],
    dataSources: ['Property records', 'Business registries', 'LinkedIn'],
    decayDays: 180,
    confidenceThreshold: 0.75,
  },

  // =============================================================================
  // POLICY LIFECYCLE SIGNALS
  // =============================================================================
  {
    id: 'ins-policy-expiring',
    name: 'Policy Expiring',
    description: 'Existing insurance policy approaching renewal date',
    category: 'timing',
    subcategory: 'policy',
    weight: 0.96,
    relevanceFactors: ['policy expiry dates', 'renewal cycles', 'lapse indicators'],
    dataSources: ['Insurance databases', 'CRM data', 'Industry databases'],
    decayDays: 30,
    confidenceThreshold: 0.9,
  },
  {
    id: 'ins-coverage-gap',
    name: 'Coverage Gap Detected',
    description: 'Individual has identifiable gaps in insurance coverage',
    category: 'intent',
    subcategory: 'policy',
    weight: 0.89,
    relevanceFactors: ['life changes', 'asset acquisition', 'income increase'],
    dataSources: ['Industry databases', 'Property records', 'CRM data'],
    decayDays: 60,
    confidenceThreshold: 0.7,
  },
  {
    id: 'ins-competitor-cancellation',
    name: 'Competitor Policy Cancelled',
    description: 'Individual cancelled policy with competitor',
    category: 'timing',
    subcategory: 'policy',
    weight: 0.94,
    relevanceFactors: ['cancellation notices', 'lapse data', 'market intelligence'],
    dataSources: ['Industry databases', 'Market intelligence', 'CRM data'],
    decayDays: 30,
    confidenceThreshold: 0.85,
  },
  {
    id: 'ins-rate-increase',
    name: 'Premium Increase Event',
    description: 'Individual facing rate increase at competitor',
    category: 'timing',
    subcategory: 'policy',
    weight: 0.87,
    relevanceFactors: ['market rate changes', 'competitor pricing', 'renewal notices'],
    dataSources: ['Market intelligence', 'Industry data', 'Competitor analysis'],
    decayDays: 45,
    confidenceThreshold: 0.7,
  },

  // =============================================================================
  // HEALTH & WELLNESS SIGNALS
  // =============================================================================
  {
    id: 'ins-health-focus',
    name: 'Health Focus Increase',
    description: 'Individual showing increased interest in health/wellness',
    category: 'engagement',
    subcategory: 'health',
    weight: 0.72,
    relevanceFactors: ['fitness app usage', 'gym membership', 'wellness program participation'],
    dataSources: ['App integrations', 'Social media', 'Partner data'],
    decayDays: 90,
    confidenceThreshold: 0.6,
  },
  {
    id: 'ins-medical-event',
    name: 'Health Event Indicator',
    description: 'Individual or family member had health event triggering review',
    category: 'intent',
    subcategory: 'health',
    weight: 0.85,
    relevanceFactors: ['claims data', 'social signals', 'family health events'],
    dataSources: ['Claims databases', 'Social media', 'CRM data'],
    decayDays: 60,
    confidenceThreshold: 0.7,
  },

  // =============================================================================
  // GROUP & CORPORATE SIGNALS
  // =============================================================================
  {
    id: 'ins-group-expansion',
    name: 'Group Size Expansion',
    description: 'Company expanding workforce, needs group coverage review',
    category: 'intent',
    subcategory: 'group',
    weight: 0.91,
    relevanceFactors: ['hiring signals', 'headcount growth', 'office expansion'],
    dataSources: ['LinkedIn', 'Job postings', 'Company data'],
    decayDays: 60,
    confidenceThreshold: 0.75,
  },
  {
    id: 'ins-benefits-rfp',
    name: 'Benefits RFP',
    description: 'Company seeking employee benefits proposals',
    category: 'intent',
    subcategory: 'group',
    weight: 0.95,
    relevanceFactors: ['RFP announcements', 'procurement signals', 'benefits review'],
    dataSources: ['RFP databases', 'Procurement portals', 'Industry contacts'],
    decayDays: 45,
    confidenceThreshold: 0.8,
  },
  {
    id: 'ins-hr-change',
    name: 'HR Leadership Change',
    description: 'New HR leader at company, likely to review benefits',
    category: 'timing',
    subcategory: 'group',
    weight: 0.83,
    relevanceFactors: ['HR executive hire', 'benefits restructuring', 'strategy changes'],
    dataSources: ['LinkedIn', 'News', 'Company announcements'],
    decayDays: 90,
    confidenceThreshold: 0.75,
  },
  {
    id: 'ins-contract-expiry',
    name: 'Group Contract Expiring',
    description: 'Group insurance contract approaching renewal',
    category: 'timing',
    subcategory: 'group',
    weight: 0.94,
    relevanceFactors: ['contract cycles', 'renewal dates', 'market intelligence'],
    dataSources: ['Industry databases', 'Market intelligence', 'CRM data'],
    decayDays: 60,
    confidenceThreshold: 0.85,
  },

  // =============================================================================
  // PROPERTY & ASSET SIGNALS
  // =============================================================================
  {
    id: 'ins-vehicle-purchase',
    name: 'Vehicle Purchase',
    description: 'Individual purchased new vehicle requiring insurance',
    category: 'intent',
    subcategory: 'property',
    weight: 0.93,
    relevanceFactors: ['vehicle registration', 'DMV records', 'dealer data'],
    dataSources: ['DMV records', 'Dealer networks', 'Credit bureaus'],
    decayDays: 30,
    confidenceThreshold: 0.9,
  },
  {
    id: 'ins-luxury-purchase',
    name: 'Luxury Asset Acquisition',
    description: 'Individual acquired high-value asset (boat, jewelry, art)',
    category: 'intent',
    subcategory: 'property',
    weight: 0.88,
    relevanceFactors: ['registry records', 'social signals', 'auction data'],
    dataSources: ['Registries', 'Social media', 'Auction houses'],
    decayDays: 60,
    confidenceThreshold: 0.8,
  },
  {
    id: 'ins-renovation',
    name: 'Home Renovation',
    description: 'Individual undertaking major home renovation',
    category: 'intent',
    subcategory: 'property',
    weight: 0.81,
    relevanceFactors: ['permit filings', 'contractor engagement', 'social signals'],
    dataSources: ['Building permits', 'Contractor databases', 'Social media'],
    decayDays: 90,
    confidenceThreshold: 0.7,
  },

  // =============================================================================
  // ENGAGEMENT & RESEARCH SIGNALS
  // =============================================================================
  {
    id: 'ins-comparison-shopping',
    name: 'Insurance Comparison Shopping',
    description: 'Individual actively comparing insurance options',
    category: 'engagement',
    subcategory: 'research',
    weight: 0.86,
    relevanceFactors: ['comparison site visits', 'quote requests', 'content consumption'],
    dataSources: ['Intent data providers', 'Website analytics', 'Partner data'],
    decayDays: 14,
    confidenceThreshold: 0.7,
  },
  {
    id: 'ins-content-engagement',
    name: 'Insurance Content Engagement',
    description: 'Individual engaging with insurance-related content',
    category: 'engagement',
    subcategory: 'research',
    weight: 0.68,
    relevanceFactors: ['article reads', 'video views', 'webinar attendance'],
    dataSources: ['Content platforms', 'Website analytics', 'Marketing automation'],
    decayDays: 30,
    confidenceThreshold: 0.6,
  },
  {
    id: 'ins-quote-request',
    name: 'Quote Request',
    description: 'Individual requested insurance quote',
    category: 'intent',
    subcategory: 'research',
    weight: 0.97,
    relevanceFactors: ['form submissions', 'call center data', 'partner referrals'],
    dataSources: ['CRM data', 'Website analytics', 'Call center'],
    decayDays: 7,
    confidenceThreshold: 0.95,
  },

  // =============================================================================
  // RISK & NEGATIVE SIGNALS
  // =============================================================================
  {
    id: 'ins-claims-history',
    name: 'High Claims History',
    description: 'Individual has elevated claims history',
    category: 'risk',
    subcategory: 'negative',
    weight: -0.45,
    relevanceFactors: ['claims frequency', 'claim amounts', 'claim types'],
    dataSources: ['Claims databases', 'Industry databases', 'CRM data'],
    decayDays: 365,
    confidenceThreshold: 0.8,
  },
  {
    id: 'ins-lapse-history',
    name: 'Policy Lapse History',
    description: 'Individual has history of letting policies lapse',
    category: 'risk',
    subcategory: 'negative',
    weight: -0.40,
    relevanceFactors: ['lapse records', 'payment history', 'reinstatements'],
    dataSources: ['Industry databases', 'Credit bureaus', 'CRM data'],
    decayDays: 365,
    confidenceThreshold: 0.75,
  },
  {
    id: 'ins-fraud-indicator',
    name: 'Fraud Risk Indicator',
    description: 'Individual shows potential fraud risk signals',
    category: 'risk',
    subcategory: 'negative',
    weight: -0.80,
    relevanceFactors: ['fraud databases', 'inconsistent information', 'suspicious patterns'],
    dataSources: ['Fraud databases', 'Industry databases', 'CRM data'],
    decayDays: 730,
    confidenceThreshold: 0.85,
  },
];

// =============================================================================
// SCORING CONFIGURATION
// =============================================================================

export interface InsuranceScoringConfig {
  weights: {
    quality: number;
    timing: number;
    likelihood: number;
    engagement: number;
    lifeEvent: number;
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
    lifeEvent: number;
  };
}

export const INSURANCE_SCORING_CONFIG: InsuranceScoringConfig = {
  weights: {
    quality: 0.20,      // Individual quality indicators
    timing: 0.25,       // Time-sensitive opportunities
    likelihood: 0.20,   // Likelihood to buy/engage
    engagement: 0.15,   // Prior engagement signals
    lifeEvent: 0.20,    // Life event triggers (unique to insurance)
  },
  thresholds: {
    hot: 70,            // Score >= 70 is hot
    warm: 45,           // Score 45-69 is warm
    cold: 0,            // Score < 45 is cold
  },
  boosts: {
    multiSignal: 1.20,      // 20% boost for 3+ signals
    recentActivity: 1.15,   // 15% boost for activity in last 7 days
    highConfidence: 1.08,   // 8% boost for high confidence signals
    lifeEvent: 1.25,        // 25% boost for major life events
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getInsuranceSignals(): DeepSignal[] {
  return INSURANCE_SIGNALS;
}

export function getInsuranceSignalById(id: string): DeepSignal | undefined {
  return INSURANCE_SIGNALS.find(s => s.id === id);
}

export function getInsuranceSignalsByCategory(category: DeepSignal['category']): DeepSignal[] {
  return INSURANCE_SIGNALS.filter(s => s.category === category);
}

export function getInsuranceSignalsBySubcategory(subcategory: string): DeepSignal[] {
  return INSURANCE_SIGNALS.filter(s => s.subcategory === subcategory);
}

export function getInsuranceScoringConfig(): InsuranceScoringConfig {
  return INSURANCE_SCORING_CONFIG;
}

export const INSURANCE_VERTICAL: Vertical = 'insurance';
