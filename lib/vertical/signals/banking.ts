/**
 * Banking Vertical - Deep Signal Library
 * Sprint P3: Deep Vertical Intelligence Packs
 *
 * 30+ premium-grade signals for Banking sales professionals.
 * Targets: COMPANIES (corporate banking, employee banking, SME banking)
 */

import type { Vertical } from '../../intelligence/context/types';

// =============================================================================
// SIGNAL DEFINITIONS
// =============================================================================

export interface DeepSignal {
  id: string;
  name: string;
  description: string;
  category: 'intent' | 'timing' | 'engagement' | 'quality' | 'risk';
  subcategory: string;
  weight: number;
  relevanceFactors: string[];
  dataSources: string[];
  decayDays: number; // How long signal remains relevant
  confidenceThreshold: number; // Minimum confidence to surface
}

export const BANKING_SIGNALS: DeepSignal[] = [
  // =============================================================================
  // EXPANSION & GROWTH SIGNALS (High Intent)
  // =============================================================================
  {
    id: 'bank-hiring-expansion',
    name: 'Hiring Expansion',
    description: 'Company actively hiring across multiple departments indicating growth',
    category: 'intent',
    subcategory: 'expansion',
    weight: 0.90,
    relevanceFactors: ['headcount growth >20%', 'new job postings', 'senior hires'],
    dataSources: ['LinkedIn', 'JobStreet', 'company careers page'],
    decayDays: 30,
    confidenceThreshold: 0.7,
  },
  {
    id: 'bank-office-opening',
    name: 'Office/Branch Opening',
    description: 'New office or branch location being established',
    category: 'intent',
    subcategory: 'expansion',
    weight: 0.88,
    relevanceFactors: ['new location announcement', 'lease signings', 'construction permits'],
    dataSources: ['Press releases', 'Commercial real estate filings', 'News'],
    decayDays: 60,
    confidenceThreshold: 0.8,
  },
  {
    id: 'bank-market-entry',
    name: 'New Market Entry',
    description: 'Company expanding into new geographic markets',
    category: 'intent',
    subcategory: 'expansion',
    weight: 0.92,
    relevanceFactors: ['press releases', 'regulatory filings', 'new entity registration'],
    dataSources: ['News', 'Regulatory databases', 'Company announcements'],
    decayDays: 90,
    confidenceThreshold: 0.75,
  },
  {
    id: 'bank-subsidiary-creation',
    name: 'Subsidiary Creation',
    description: 'New subsidiary or entity being established',
    category: 'intent',
    subcategory: 'expansion',
    weight: 0.85,
    relevanceFactors: ['corporate filings', 'news announcements', 'registry records'],
    dataSources: ['Company registries', 'News', 'Corporate filings'],
    decayDays: 60,
    confidenceThreshold: 0.8,
  },
  {
    id: 'bank-headcount-jump',
    name: 'Headcount Jump',
    description: 'Significant increase in employee count (>15% QoQ)',
    category: 'intent',
    subcategory: 'expansion',
    weight: 0.87,
    relevanceFactors: ['LinkedIn headcount', 'job postings surge', 'office expansion'],
    dataSources: ['LinkedIn', 'Glassdoor', 'Apollo'],
    decayDays: 45,
    confidenceThreshold: 0.7,
  },

  // =============================================================================
  // DIGITAL TRANSFORMATION SIGNALS
  // =============================================================================
  {
    id: 'bank-digital-transformation',
    name: 'Digital Transformation Initiative',
    description: 'Company investing in digital banking capabilities',
    category: 'intent',
    subcategory: 'digital',
    weight: 0.95,
    relevanceFactors: ['tech hiring', 'digital partnerships', 'fintech integrations'],
    dataSources: ['Job postings', 'Press releases', 'Tech news'],
    decayDays: 90,
    confidenceThreshold: 0.7,
  },
  {
    id: 'bank-core-banking-renewal',
    name: 'Core Banking Renewal',
    description: 'Core banking system contract renewal or replacement',
    category: 'timing',
    subcategory: 'digital',
    weight: 0.93,
    relevanceFactors: ['contract expiry', 'RFP announcements', 'vendor changes'],
    dataSources: ['Industry intelligence', 'RFP databases', 'Vendor announcements'],
    decayDays: 120,
    confidenceThreshold: 0.75,
  },
  {
    id: 'bank-fintech-partnership',
    name: 'Fintech Partnership',
    description: 'Partnership or integration with fintech companies',
    category: 'intent',
    subcategory: 'digital',
    weight: 0.82,
    relevanceFactors: ['partnership announcements', 'API integrations', 'co-branding'],
    dataSources: ['Press releases', 'Tech news', 'Fintech trackers'],
    decayDays: 60,
    confidenceThreshold: 0.7,
  },
  {
    id: 'bank-digital-onboarding',
    name: 'Digital Onboarding Initiative',
    description: 'Investing in digital customer onboarding capabilities',
    category: 'intent',
    subcategory: 'digital',
    weight: 0.85,
    relevanceFactors: ['KYC tech hiring', 'eKYC partnerships', 'mobile app updates'],
    dataSources: ['Job postings', 'App store updates', 'News'],
    decayDays: 60,
    confidenceThreshold: 0.7,
  },
  {
    id: 'bank-open-banking-api',
    name: 'Open Banking API Launch',
    description: 'Launching or expanding open banking APIs',
    category: 'intent',
    subcategory: 'digital',
    weight: 0.80,
    relevanceFactors: ['developer portal launch', 'API documentation', 'sandbox availability'],
    dataSources: ['Developer portals', 'Tech blogs', 'API directories'],
    decayDays: 90,
    confidenceThreshold: 0.75,
  },

  // =============================================================================
  // FINANCIAL & FUNDING SIGNALS
  // =============================================================================
  {
    id: 'bank-funding-round',
    name: 'Funding Round',
    description: 'Company raised venture or growth capital',
    category: 'quality',
    subcategory: 'funding',
    weight: 0.94,
    relevanceFactors: ['funding announcement', 'valuation increase', 'investor quality'],
    dataSources: ['Crunchbase', 'PitchBook', 'News'],
    decayDays: 90,
    confidenceThreshold: 0.85,
  },
  {
    id: 'bank-ipo-preparation',
    name: 'IPO Preparation',
    description: 'Signs of preparing for public offering',
    category: 'timing',
    subcategory: 'funding',
    weight: 0.92,
    relevanceFactors: ['CFO hire', 'auditor selection', 'regulatory filings'],
    dataSources: ['News', 'SEC filings', 'Executive changes'],
    decayDays: 180,
    confidenceThreshold: 0.7,
  },
  {
    id: 'bank-acquisition-target',
    name: 'Acquisition Activity',
    description: 'Company involved in M&A activity',
    category: 'timing',
    subcategory: 'funding',
    weight: 0.88,
    relevanceFactors: ['M&A news', 'due diligence signals', 'advisor appointments'],
    dataSources: ['M&A databases', 'News', 'Corporate filings'],
    decayDays: 120,
    confidenceThreshold: 0.75,
  },
  {
    id: 'bank-debt-restructuring',
    name: 'Debt Restructuring',
    description: 'Company restructuring debt or seeking refinancing',
    category: 'timing',
    subcategory: 'funding',
    weight: 0.75,
    relevanceFactors: ['credit rating changes', 'refinancing news', 'lender changes'],
    dataSources: ['Credit agencies', 'News', 'Financial filings'],
    decayDays: 90,
    confidenceThreshold: 0.7,
  },

  // =============================================================================
  // REGULATORY & COMPLIANCE SIGNALS
  // =============================================================================
  {
    id: 'bank-regulatory-deadline',
    name: 'Regulatory Deadline',
    description: 'Approaching compliance deadline requiring action',
    category: 'timing',
    subcategory: 'compliance',
    weight: 0.91,
    relevanceFactors: ['regulatory calendar', 'industry deadlines', 'central bank requirements'],
    dataSources: ['Regulatory bodies', 'Industry associations', 'News'],
    decayDays: 60,
    confidenceThreshold: 0.8,
  },
  {
    id: 'bank-aml-kyc-initiative',
    name: 'AML/KYC Enhancement',
    description: 'Investing in anti-money laundering or KYC capabilities',
    category: 'intent',
    subcategory: 'compliance',
    weight: 0.86,
    relevanceFactors: ['compliance hiring', 'RegTech partnerships', 'system upgrades'],
    dataSources: ['Job postings', 'News', 'Vendor announcements'],
    decayDays: 90,
    confidenceThreshold: 0.7,
  },
  {
    id: 'bank-license-application',
    name: 'Banking License Application',
    description: 'Applying for new banking license or expanding scope',
    category: 'intent',
    subcategory: 'compliance',
    weight: 0.90,
    relevanceFactors: ['regulatory filings', 'license announcements', 'expansion plans'],
    dataSources: ['Central bank records', 'News', 'Regulatory databases'],
    decayDays: 180,
    confidenceThreshold: 0.8,
  },
  {
    id: 'bank-audit-completion',
    name: 'Audit Completion',
    description: 'Major audit completed with findings',
    category: 'timing',
    subcategory: 'compliance',
    weight: 0.72,
    relevanceFactors: ['audit reports', 'regulatory findings', 'remediation plans'],
    dataSources: ['Regulatory filings', 'News', 'Annual reports'],
    decayDays: 90,
    confidenceThreshold: 0.7,
  },

  // =============================================================================
  // LEADERSHIP & STRATEGIC SIGNALS
  // =============================================================================
  {
    id: 'bank-cxo-change',
    name: 'C-Suite Change',
    description: 'New CEO, CFO, CTO, or other C-level executive',
    category: 'timing',
    subcategory: 'leadership',
    weight: 0.88,
    relevanceFactors: ['executive announcements', 'LinkedIn updates', 'news coverage'],
    dataSources: ['News', 'LinkedIn', 'Company announcements'],
    decayDays: 90,
    confidenceThreshold: 0.85,
  },
  {
    id: 'bank-board-change',
    name: 'Board Changes',
    description: 'New board members or significant board restructuring',
    category: 'timing',
    subcategory: 'leadership',
    weight: 0.78,
    relevanceFactors: ['board announcements', 'AGM results', 'regulatory filings'],
    dataSources: ['Company filings', 'News', 'Corporate records'],
    decayDays: 60,
    confidenceThreshold: 0.8,
  },
  {
    id: 'bank-strategy-announcement',
    name: 'Strategic Initiative',
    description: 'Major strategic initiative or transformation announced',
    category: 'intent',
    subcategory: 'leadership',
    weight: 0.84,
    relevanceFactors: ['investor presentations', 'press releases', 'CEO statements'],
    dataSources: ['Investor relations', 'News', 'Earnings calls'],
    decayDays: 120,
    confidenceThreshold: 0.7,
  },

  // =============================================================================
  // LENDING & CREDIT SIGNALS
  // =============================================================================
  {
    id: 'bank-lending-expansion',
    name: 'Lending Expansion',
    description: 'Expanding lending capabilities or portfolio',
    category: 'intent',
    subcategory: 'lending',
    weight: 0.87,
    relevanceFactors: ['credit officer hiring', 'loan product launches', 'partnership announcements'],
    dataSources: ['Job postings', 'News', 'Product announcements'],
    decayDays: 60,
    confidenceThreshold: 0.7,
  },
  {
    id: 'bank-trade-finance-growth',
    name: 'Trade Finance Growth',
    description: 'Expanding trade finance and cross-border capabilities',
    category: 'intent',
    subcategory: 'lending',
    weight: 0.83,
    relevanceFactors: ['trade finance hiring', 'correspondent bank partnerships', 'product launches'],
    dataSources: ['Job postings', 'News', 'Trade publications'],
    decayDays: 90,
    confidenceThreshold: 0.7,
  },
  {
    id: 'bank-sme-focus',
    name: 'SME Banking Focus',
    description: 'Increased focus on SME banking segment',
    category: 'intent',
    subcategory: 'lending',
    weight: 0.81,
    relevanceFactors: ['SME product launches', 'relationship manager hiring', 'branch strategy'],
    dataSources: ['News', 'Job postings', 'Company announcements'],
    decayDays: 60,
    confidenceThreshold: 0.7,
  },

  // =============================================================================
  // EMPLOYEE BANKING SIGNALS
  // =============================================================================
  {
    id: 'bank-payroll-rfp',
    name: 'Payroll Banking RFP',
    description: 'Company seeking payroll banking solutions',
    category: 'intent',
    subcategory: 'employee-banking',
    weight: 0.93,
    relevanceFactors: ['RFP announcements', 'procurement signals', 'vendor research'],
    dataSources: ['RFP databases', 'Procurement portals', 'Industry contacts'],
    decayDays: 45,
    confidenceThreshold: 0.75,
  },
  {
    id: 'bank-employee-benefits',
    name: 'Employee Benefits Expansion',
    description: 'Expanding employee benefits requiring banking services',
    category: 'intent',
    subcategory: 'employee-banking',
    weight: 0.79,
    relevanceFactors: ['HR hiring', 'benefits announcements', 'compensation changes'],
    dataSources: ['Job postings', 'News', 'Glassdoor'],
    decayDays: 60,
    confidenceThreshold: 0.7,
  },
  {
    id: 'bank-wps-compliance',
    name: 'WPS Compliance Need',
    description: 'Company needing Wage Protection System compliance (UAE)',
    category: 'timing',
    subcategory: 'employee-banking',
    weight: 0.88,
    relevanceFactors: ['workforce size', 'UAE operations', 'compliance requirements'],
    dataSources: ['Company registry', 'Labor records', 'News'],
    decayDays: 30,
    confidenceThreshold: 0.8,
  },

  // =============================================================================
  // RISK & NEGATIVE SIGNALS
  // =============================================================================
  {
    id: 'bank-layoffs',
    name: 'Layoffs Announced',
    description: 'Company announced layoffs or restructuring',
    category: 'risk',
    subcategory: 'negative',
    weight: -0.60,
    relevanceFactors: ['layoff announcements', 'restructuring news', 'office closures'],
    dataSources: ['News', 'LinkedIn', 'WARN notices'],
    decayDays: 90,
    confidenceThreshold: 0.8,
  },
  {
    id: 'bank-regulatory-action',
    name: 'Regulatory Action',
    description: 'Company facing regulatory action or sanctions',
    category: 'risk',
    subcategory: 'negative',
    weight: -0.70,
    relevanceFactors: ['enforcement actions', 'fines', 'regulatory orders'],
    dataSources: ['Regulatory databases', 'News', 'Court records'],
    decayDays: 180,
    confidenceThreshold: 0.85,
  },
  {
    id: 'bank-credit-downgrade',
    name: 'Credit Downgrade',
    description: 'Credit rating downgrade',
    category: 'risk',
    subcategory: 'negative',
    weight: -0.55,
    relevanceFactors: ['rating agency actions', 'credit watch', 'outlook changes'],
    dataSources: ['Rating agencies', 'News', 'Financial databases'],
    decayDays: 120,
    confidenceThreshold: 0.85,
  },
];

// =============================================================================
// SCORING CONFIGURATION
// =============================================================================

export interface BankingScoringConfig {
  weights: {
    quality: number;
    timing: number;
    likelihood: number;
    engagement: number;
    expansion: number;
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
  };
}

export const BANKING_SCORING_CONFIG: BankingScoringConfig = {
  weights: {
    quality: 0.25,      // Company quality indicators
    timing: 0.30,       // Time-sensitive opportunities (highest for banking)
    likelihood: 0.20,   // Likelihood to buy/engage
    engagement: 0.15,   // Prior engagement signals
    expansion: 0.10,    // Growth/expansion signals
  },
  thresholds: {
    hot: 75,            // Score >= 75 is hot
    warm: 50,           // Score 50-74 is warm
    cold: 0,            // Score < 50 is cold
  },
  boosts: {
    multiSignal: 1.15,      // 15% boost for 3+ signals
    recentActivity: 1.10,   // 10% boost for activity in last 7 days
    highConfidence: 1.05,   // 5% boost for high confidence signals
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getBankingSignals(): DeepSignal[] {
  return BANKING_SIGNALS;
}

export function getBankingSignalById(id: string): DeepSignal | undefined {
  return BANKING_SIGNALS.find(s => s.id === id);
}

export function getBankingSignalsByCategory(category: DeepSignal['category']): DeepSignal[] {
  return BANKING_SIGNALS.filter(s => s.category === category);
}

export function getBankingSignalsBySubcategory(subcategory: string): DeepSignal[] {
  return BANKING_SIGNALS.filter(s => s.subcategory === subcategory);
}

export function getBankingScoringConfig(): BankingScoringConfig {
  return BANKING_SCORING_CONFIG;
}

export const BANKING_VERTICAL: Vertical = 'banking';
