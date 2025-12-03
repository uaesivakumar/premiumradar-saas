/**
 * SaaS Sales Vertical - Deep Signal Library
 * Sprint P3: Deep Vertical Intelligence Packs
 *
 * 30+ premium-grade signals for SaaS Sales professionals.
 * Targets: COMPANIES (B2B software, enterprise accounts, tech companies)
 */

import type { Vertical } from '../../intelligence/context/types';
import type { DeepSignal } from './banking';

// =============================================================================
// SAAS SALES SIGNAL DEFINITIONS
// =============================================================================

export const SAAS_SALES_SIGNALS: DeepSignal[] = [
  // =============================================================================
  // FUNDING & GROWTH SIGNALS
  // =============================================================================
  {
    id: 'saas-funding-round',
    name: 'Recent Funding Round',
    description: 'Company raised venture or growth capital - likely investing in tools',
    category: 'intent',
    subcategory: 'funding',
    weight: 0.95,
    relevanceFactors: ['funding amount', 'investor quality', 'growth stage'],
    dataSources: ['Crunchbase', 'PitchBook', 'News'],
    decayDays: 120,
    confidenceThreshold: 0.85,
  },
  {
    id: 'saas-series-a-plus',
    name: 'Series A+ Funding',
    description: 'Company at Series A or later - budget for enterprise tools',
    category: 'quality',
    subcategory: 'funding',
    weight: 0.92,
    relevanceFactors: ['funding stage', 'total raised', 'growth metrics'],
    dataSources: ['Crunchbase', 'PitchBook', 'LinkedIn'],
    decayDays: 180,
    confidenceThreshold: 0.8,
  },
  {
    id: 'saas-revenue-milestone',
    name: 'Revenue Milestone',
    description: 'Company hit revenue milestone (1M, 10M, 100M ARR)',
    category: 'quality',
    subcategory: 'funding',
    weight: 0.88,
    relevanceFactors: ['press releases', 'industry rankings', 'growth signals'],
    dataSources: ['News', 'Industry reports', 'Company announcements'],
    decayDays: 180,
    confidenceThreshold: 0.75,
  },
  {
    id: 'saas-ipo-track',
    name: 'IPO Track',
    description: 'Company showing signs of preparing for public offering',
    category: 'timing',
    subcategory: 'funding',
    weight: 0.90,
    relevanceFactors: ['CFO hire', 'auditor selection', 'board changes'],
    dataSources: ['News', 'SEC filings', 'LinkedIn'],
    decayDays: 180,
    confidenceThreshold: 0.7,
  },

  // =============================================================================
  // TECHNOLOGY & STACK SIGNALS
  // =============================================================================
  {
    id: 'saas-tech-stack-change',
    name: 'Tech Stack Change',
    description: 'Company changing core technology stack',
    category: 'intent',
    subcategory: 'technology',
    weight: 0.93,
    relevanceFactors: ['job postings', 'tech blog posts', 'developer activity'],
    dataSources: ['BuiltWith', 'GitHub', 'Job postings'],
    decayDays: 90,
    confidenceThreshold: 0.75,
  },
  {
    id: 'saas-competitor-churning',
    name: 'Competitor Churn',
    description: 'Company showing signs of leaving competitor solution',
    category: 'timing',
    subcategory: 'technology',
    weight: 0.96,
    relevanceFactors: ['tech stack changes', 'review activity', 'job postings'],
    dataSources: ['BuiltWith', 'G2', 'Capterra', 'Job postings'],
    decayDays: 60,
    confidenceThreshold: 0.8,
  },
  {
    id: 'saas-new-tech-adoption',
    name: 'New Technology Adoption',
    description: 'Company adopting new technology category',
    category: 'intent',
    subcategory: 'technology',
    weight: 0.85,
    relevanceFactors: ['tech stack adds', 'integration activity', 'hiring patterns'],
    dataSources: ['BuiltWith', 'GitHub', 'LinkedIn'],
    decayDays: 90,
    confidenceThreshold: 0.7,
  },
  {
    id: 'saas-integration-need',
    name: 'Integration Requirements',
    description: 'Company showing integration needs with existing tools',
    category: 'intent',
    subcategory: 'technology',
    weight: 0.80,
    relevanceFactors: ['tech stack analysis', 'job postings', 'forum discussions'],
    dataSources: ['BuiltWith', 'Stack Overflow', 'Job postings'],
    decayDays: 60,
    confidenceThreshold: 0.65,
  },
  {
    id: 'saas-legacy-modernization',
    name: 'Legacy Modernization',
    description: 'Company modernizing legacy technology systems',
    category: 'intent',
    subcategory: 'technology',
    weight: 0.88,
    relevanceFactors: ['job postings', 'tech announcements', 'vendor changes'],
    dataSources: ['Job postings', 'News', 'Tech blogs'],
    decayDays: 120,
    confidenceThreshold: 0.7,
  },

  // =============================================================================
  // HIRING & TEAM SIGNALS
  // =============================================================================
  {
    id: 'saas-engineering-growth',
    name: 'Engineering Team Growth',
    description: 'Company rapidly growing engineering team',
    category: 'intent',
    subcategory: 'hiring',
    weight: 0.91,
    relevanceFactors: ['engineering job postings', 'headcount growth', 'tech leadership hires'],
    dataSources: ['LinkedIn', 'Job boards', 'Company websites'],
    decayDays: 60,
    confidenceThreshold: 0.8,
  },
  {
    id: 'saas-ops-hiring',
    name: 'Operations/IT Hiring',
    description: 'Company hiring for operations or IT roles',
    category: 'intent',
    subcategory: 'hiring',
    weight: 0.84,
    relevanceFactors: ['ops job postings', 'IT manager hires', 'sysadmin roles'],
    dataSources: ['LinkedIn', 'Job boards', 'Company websites'],
    decayDays: 45,
    confidenceThreshold: 0.75,
  },
  {
    id: 'saas-sales-team-growth',
    name: 'Sales Team Expansion',
    description: 'Company expanding sales team - likely evaluating sales tools',
    category: 'intent',
    subcategory: 'hiring',
    weight: 0.87,
    relevanceFactors: ['sales job postings', 'sales leadership hires', 'revenue goals'],
    dataSources: ['LinkedIn', 'Job boards', 'Company announcements'],
    decayDays: 60,
    confidenceThreshold: 0.75,
  },
  {
    id: 'saas-new-cto',
    name: 'New CTO/VP Engineering',
    description: 'New technology leadership likely to evaluate tools',
    category: 'timing',
    subcategory: 'hiring',
    weight: 0.93,
    relevanceFactors: ['executive announcements', 'LinkedIn updates', 'news coverage'],
    dataSources: ['LinkedIn', 'News', 'Company announcements'],
    decayDays: 90,
    confidenceThreshold: 0.85,
  },
  {
    id: 'saas-headcount-jump',
    name: 'Rapid Headcount Growth',
    description: 'Company growing headcount >25% - scaling operations',
    category: 'intent',
    subcategory: 'hiring',
    weight: 0.90,
    relevanceFactors: ['LinkedIn headcount', 'job posting volume', 'office expansion'],
    dataSources: ['LinkedIn', 'Apollo', 'Company data'],
    decayDays: 60,
    confidenceThreshold: 0.8,
  },

  // =============================================================================
  // BUYING INTENT SIGNALS
  // =============================================================================
  {
    id: 'saas-product-research',
    name: 'Product Research Activity',
    description: 'Company researching products in your category',
    category: 'intent',
    subcategory: 'buying',
    weight: 0.94,
    relevanceFactors: ['G2 activity', 'comparison shopping', 'demo requests'],
    dataSources: ['G2', 'Capterra', 'Intent data providers'],
    decayDays: 30,
    confidenceThreshold: 0.8,
  },
  {
    id: 'saas-competitor-research',
    name: 'Competitor Research',
    description: 'Company researching your competitors',
    category: 'intent',
    subcategory: 'buying',
    weight: 0.92,
    relevanceFactors: ['review site activity', 'content consumption', 'trial signups'],
    dataSources: ['G2', 'Capterra', 'Bombora', 'Intent data'],
    decayDays: 30,
    confidenceThreshold: 0.75,
  },
  {
    id: 'saas-website-traffic',
    name: 'Website Traffic Spike',
    description: 'Company showing increased visits to your website',
    category: 'engagement',
    subcategory: 'buying',
    weight: 0.85,
    relevanceFactors: ['visit frequency', 'page depth', 'pricing page views'],
    dataSources: ['Website analytics', 'Clearbit', 'Lead forensics'],
    decayDays: 14,
    confidenceThreshold: 0.7,
  },
  {
    id: 'saas-trial-signup',
    name: 'Trial/Freemium Signup',
    description: 'Company signed up for trial or freemium version',
    category: 'intent',
    subcategory: 'buying',
    weight: 0.97,
    relevanceFactors: ['signup data', 'usage patterns', 'user count'],
    dataSources: ['Product analytics', 'CRM data', 'Marketing automation'],
    decayDays: 30,
    confidenceThreshold: 0.9,
  },
  {
    id: 'saas-rfp-issued',
    name: 'RFP/RFI Issued',
    description: 'Company issued RFP for relevant category',
    category: 'intent',
    subcategory: 'buying',
    weight: 0.98,
    relevanceFactors: ['RFP databases', 'procurement portals', 'industry contacts'],
    dataSources: ['RFP databases', 'Government portals', 'Partner networks'],
    decayDays: 45,
    confidenceThreshold: 0.9,
  },

  // =============================================================================
  // IDEAL CUSTOMER PROFILE SIGNALS
  // =============================================================================
  {
    id: 'saas-icp-match',
    name: 'ICP Match',
    description: 'Company matches ideal customer profile criteria',
    category: 'quality',
    subcategory: 'icp',
    weight: 0.89,
    relevanceFactors: ['industry', 'company size', 'tech stack', 'location'],
    dataSources: ['Company databases', 'LinkedIn', 'BuiltWith'],
    decayDays: 365,
    confidenceThreshold: 0.75,
  },
  {
    id: 'saas-industry-fit',
    name: 'Industry Fit',
    description: 'Company in high-fit industry vertical',
    category: 'quality',
    subcategory: 'icp',
    weight: 0.82,
    relevanceFactors: ['industry classification', 'use case alignment', 'case studies'],
    dataSources: ['Company databases', 'LinkedIn', 'CRM data'],
    decayDays: 365,
    confidenceThreshold: 0.7,
  },
  {
    id: 'saas-similar-customer',
    name: 'Similar to Existing Customer',
    description: 'Company similar to successful existing customer',
    category: 'quality',
    subcategory: 'icp',
    weight: 0.86,
    relevanceFactors: ['customer matching', 'firmographic similarity', 'use case overlap'],
    dataSources: ['CRM data', 'Company databases', 'LinkedIn'],
    decayDays: 365,
    confidenceThreshold: 0.75,
  },

  // =============================================================================
  // CONTRACT & RENEWAL SIGNALS
  // =============================================================================
  {
    id: 'saas-contract-expiry',
    name: 'Contract Expiring',
    description: 'Competitor contract approaching renewal date',
    category: 'timing',
    subcategory: 'contract',
    weight: 0.95,
    relevanceFactors: ['contract intelligence', 'industry cycles', 'vendor data'],
    dataSources: ['Contract databases', 'Industry intelligence', 'Partner data'],
    decayDays: 90,
    confidenceThreshold: 0.8,
  },
  {
    id: 'saas-budget-cycle',
    name: 'Budget Cycle',
    description: 'Company in annual budget planning cycle',
    category: 'timing',
    subcategory: 'contract',
    weight: 0.80,
    relevanceFactors: ['fiscal year', 'planning announcements', 'industry patterns'],
    dataSources: ['Company data', 'Industry intelligence', 'Financial filings'],
    decayDays: 90,
    confidenceThreshold: 0.65,
  },
  {
    id: 'saas-multi-year-deal',
    name: 'Multi-Year Deal Opportunity',
    description: 'Company showing appetite for multi-year commitments',
    category: 'quality',
    subcategory: 'contract',
    weight: 0.84,
    relevanceFactors: ['company stability', 'growth trajectory', 'enterprise maturity'],
    dataSources: ['Financial data', 'Company data', 'CRM data'],
    decayDays: 180,
    confidenceThreshold: 0.7,
  },

  // =============================================================================
  // ENGAGEMENT & CHAMPION SIGNALS
  // =============================================================================
  {
    id: 'saas-event-attendee',
    name: 'Event Attendee',
    description: 'Company representatives attended relevant event',
    category: 'engagement',
    subcategory: 'champion',
    weight: 0.75,
    relevanceFactors: ['event registration', 'booth visits', 'session attendance'],
    dataSources: ['Event platforms', 'Marketing automation', 'CRM data'],
    decayDays: 60,
    confidenceThreshold: 0.7,
  },
  {
    id: 'saas-content-engaged',
    name: 'Content Engagement',
    description: 'Multiple stakeholders engaging with content',
    category: 'engagement',
    subcategory: 'champion',
    weight: 0.72,
    relevanceFactors: ['content downloads', 'webinar attendance', 'email engagement'],
    dataSources: ['Marketing automation', 'Website analytics', 'CRM data'],
    decayDays: 30,
    confidenceThreshold: 0.65,
  },
  {
    id: 'saas-multi-stakeholder',
    name: 'Multi-Stakeholder Interest',
    description: 'Multiple people at company showing interest',
    category: 'intent',
    subcategory: 'champion',
    weight: 0.88,
    relevanceFactors: ['visitor count', 'department diversity', 'seniority mix'],
    dataSources: ['Website analytics', 'Marketing automation', 'CRM data'],
    decayDays: 30,
    confidenceThreshold: 0.75,
  },
  {
    id: 'saas-champion-identified',
    name: 'Champion Identified',
    description: 'Strong internal champion identified at company',
    category: 'quality',
    subcategory: 'champion',
    weight: 0.91,
    relevanceFactors: ['engagement patterns', 'role seniority', 'influence indicators'],
    dataSources: ['CRM data', 'Marketing automation', 'Sales notes'],
    decayDays: 90,
    confidenceThreshold: 0.8,
  },

  // =============================================================================
  // RISK & NEGATIVE SIGNALS
  // =============================================================================
  {
    id: 'saas-layoffs',
    name: 'Recent Layoffs',
    description: 'Company recently laid off employees',
    category: 'risk',
    subcategory: 'negative',
    weight: -0.55,
    relevanceFactors: ['layoff announcements', 'WARN notices', 'news coverage'],
    dataSources: ['News', 'LinkedIn', 'WARN databases'],
    decayDays: 120,
    confidenceThreshold: 0.8,
  },
  {
    id: 'saas-funding-issues',
    name: 'Funding/Cash Issues',
    description: 'Company showing signs of financial difficulties',
    category: 'risk',
    subcategory: 'negative',
    weight: -0.65,
    relevanceFactors: ['news coverage', 'hiring freeze', 'layoffs', 'down round'],
    dataSources: ['News', 'Crunchbase', 'LinkedIn'],
    decayDays: 180,
    confidenceThreshold: 0.75,
  },
  {
    id: 'saas-just-purchased',
    name: 'Recently Purchased Competitor',
    description: 'Company recently bought competitor solution',
    category: 'risk',
    subcategory: 'negative',
    weight: -0.60,
    relevanceFactors: ['tech stack changes', 'contract data', 'vendor announcements'],
    dataSources: ['BuiltWith', 'Contract databases', 'CRM data'],
    decayDays: 365,
    confidenceThreshold: 0.8,
  },
  {
    id: 'saas-not-decision-maker',
    name: 'No Decision Maker Access',
    description: 'Unable to access economic buyer or decision maker',
    category: 'risk',
    subcategory: 'negative',
    weight: -0.40,
    relevanceFactors: ['org structure', 'contact availability', 'engagement patterns'],
    dataSources: ['LinkedIn', 'CRM data', 'Sales notes'],
    decayDays: 90,
    confidenceThreshold: 0.7,
  },
];

// =============================================================================
// SCORING CONFIGURATION
// =============================================================================

export interface SaaSSalesScoringConfig {
  weights: {
    quality: number;
    timing: number;
    likelihood: number;
    engagement: number;
    techFit: number;
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
    trialSignup: number;
    fundingRecent: number;
  };
}

export const SAAS_SALES_SCORING_CONFIG: SaaSSalesScoringConfig = {
  weights: {
    quality: 0.25,      // Company/ICP quality indicators
    timing: 0.25,       // Time-sensitive opportunities
    likelihood: 0.20,   // Likelihood to buy
    engagement: 0.15,   // Prior engagement signals
    techFit: 0.15,      // Technology stack fit
  },
  thresholds: {
    hot: 70,            // Score >= 70 is hot
    warm: 45,           // Score 45-69 is warm
    cold: 0,            // Score < 45 is cold
  },
  boosts: {
    multiSignal: 1.20,      // 20% boost for 3+ signals
    recentActivity: 1.15,   // 15% boost for activity in last 7 days
    highConfidence: 1.10,   // 10% boost for high confidence signals
    trialSignup: 1.30,      // 30% boost for trial/freemium signup
    fundingRecent: 1.25,    // 25% boost for recent funding
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getSaaSSalesSignals(): DeepSignal[] {
  return SAAS_SALES_SIGNALS;
}

export function getSaaSSalesSignalById(id: string): DeepSignal | undefined {
  return SAAS_SALES_SIGNALS.find(s => s.id === id);
}

export function getSaaSSalesSignalsByCategory(category: DeepSignal['category']): DeepSignal[] {
  return SAAS_SALES_SIGNALS.filter(s => s.category === category);
}

export function getSaaSSalesSignalsBySubcategory(subcategory: string): DeepSignal[] {
  return SAAS_SALES_SIGNALS.filter(s => s.subcategory === subcategory);
}

export function getSaaSSalesScoringConfig(): SaaSSalesScoringConfig {
  return SAAS_SALES_SCORING_CONFIG;
}

export const SAAS_SALES_VERTICAL: Vertical = 'saas-sales';
