/**
 * EB Employer Data - Employee Banking Discovery
 *
 * For Employee Banking, targets are EMPLOYERS (companies hiring employees)
 * NOT banks. These companies need payroll accounts, salary disbursement,
 * and employee banking services.
 *
 * Signals focus on: hiring, expansion, headcount growth, visa issuance
 */

import type { EBCompanyData, EBSignal } from '@/components/discovery/EBDiscoveryCard';

// =============================================================================
// EB SIGNAL TYPES
// =============================================================================

export const EB_SIGNAL_TYPES = {
  HIRING_EXPANSION: 'hiring-expansion',
  HEADCOUNT_JUMP: 'headcount-jump',
  OFFICE_OPENING: 'office-opening',
  MARKET_ENTRY: 'market-entry',
  SUBSIDIARY_CREATION: 'subsidiary-creation',
  LEADERSHIP_HIRING: 'leadership-hiring',
  VISA_ISSUANCE: 'visa-issuance',
  PAYROLL_SWITCH: 'payroll-switch',
} as const;

// =============================================================================
// MOCK EB EMPLOYERS - UAE Companies Hiring
// =============================================================================

export function generateEBEmployers(regions: string[]): EBCompanyData[] {
  const allEmployers: EBCompanyData[] = [
    // Dubai Employers
    {
      id: 'eb-1',
      name: 'ADNOC Group',
      industry: 'Oil & Gas',
      size: 'enterprise',
      headcount: 15000,
      headcountGrowth: 12,
      region: 'UAE',
      city: 'Abu Dhabi',
      description: 'National oil company expanding workforce across multiple subsidiaries',
      bankingTier: 'tier1',
      signals: [
        {
          type: EB_SIGNAL_TYPES.HIRING_EXPANSION,
          title: 'Major Hiring Drive',
          description: 'Announced 2,000+ new positions across technical and support roles',
          confidence: 0.92,
          source: 'LinkedIn Jobs',
          date: '2024-01-15',
        },
        {
          type: EB_SIGNAL_TYPES.SUBSIDIARY_CREATION,
          title: 'New Subsidiary Launch',
          description: 'ADNOC Drilling expanding with dedicated payroll entity',
          confidence: 0.88,
          source: 'Company Announcement',
          date: '2024-01-10',
        },
      ],
      score: 87,
      decisionMaker: {
        name: 'Ahmed Al Mazrouei',
        title: 'Group HR Director',
        linkedin: 'https://linkedin.com/in/example',
      },
      freshness: 'fresh',
    },
    {
      id: 'eb-2',
      name: 'Emirates Airlines',
      industry: 'Aviation',
      size: 'enterprise',
      headcount: 25000,
      headcountGrowth: 18,
      region: 'UAE',
      city: 'Dubai',
      description: 'National carrier with aggressive cabin crew and ground staff expansion',
      bankingTier: 'tier1',
      signals: [
        {
          type: EB_SIGNAL_TYPES.HIRING_EXPANSION,
          title: 'Cabin Crew Recruitment',
          description: '3,000+ cabin crew positions advertised globally',
          confidence: 0.95,
          source: 'Emirates Careers',
          date: '2024-01-20',
        },
        {
          type: EB_SIGNAL_TYPES.HEADCOUNT_JUMP,
          title: 'Headcount Increase',
          description: '18% year-over-year workforce growth detected',
          confidence: 0.89,
          source: 'LinkedIn Analytics',
          date: '2024-01-18',
        },
      ],
      score: 92,
      decisionMaker: {
        name: 'Sara Al Madani',
        title: 'VP Human Resources',
        linkedin: 'https://linkedin.com/in/example',
      },
      freshness: 'fresh',
    },
    {
      id: 'eb-3',
      name: 'Al Futtaim Group',
      industry: 'Retail & Automotive',
      size: 'enterprise',
      headcount: 8000,
      headcountGrowth: 8,
      region: 'UAE',
      city: 'Dubai',
      description: 'Major retail and automotive conglomerate with multi-brand operations',
      bankingTier: 'tier1',
      signals: [
        {
          type: EB_SIGNAL_TYPES.OFFICE_OPENING,
          title: 'New Regional Office',
          description: 'Opening expanded operations center in Dubai South',
          confidence: 0.82,
          source: 'Press Release',
          date: '2024-01-12',
        },
        {
          type: EB_SIGNAL_TYPES.HIRING_EXPANSION,
          title: 'Retail Expansion Hiring',
          description: '500+ positions for new IKEA and Marks & Spencer stores',
          confidence: 0.87,
          source: 'Indeed Jobs',
          date: '2024-01-14',
        },
      ],
      score: 78,
      decisionMaker: {
        name: 'Omar Khalifa',
        title: 'Group CHRO',
        linkedin: 'https://linkedin.com/in/example',
      },
      freshness: 'recent',
    },
    {
      id: 'eb-4',
      name: 'Hilton Hotels UAE',
      industry: 'Hospitality',
      size: 'mid-market',
      headcount: 3500,
      headcountGrowth: 15,
      region: 'UAE',
      city: 'Dubai',
      description: 'Hotel chain expanding with new properties in Dubai and Abu Dhabi',
      bankingTier: 'tier2',
      signals: [
        {
          type: EB_SIGNAL_TYPES.HIRING_EXPANSION,
          title: 'Hotel Opening Recruitment',
          description: '800 positions for two new properties',
          confidence: 0.91,
          source: 'Hilton Careers',
          date: '2024-01-16',
        },
        {
          type: EB_SIGNAL_TYPES.VISA_ISSUANCE,
          title: 'Visa Processing Surge',
          description: 'Detected 200+ work visa applications in past month',
          confidence: 0.75,
          source: 'Immigration Data',
          date: '2024-01-19',
        },
      ],
      score: 84,
      decisionMaker: {
        name: 'Maria Santos',
        title: 'HR Director MEA',
        linkedin: 'https://linkedin.com/in/example',
      },
      freshness: 'fresh',
    },
    {
      id: 'eb-5',
      name: 'NAFFCO',
      industry: 'Manufacturing',
      size: 'mid-market',
      headcount: 4500,
      headcountGrowth: 10,
      region: 'UAE',
      city: 'Dubai',
      description: 'Fire safety equipment manufacturer with global operations',
      bankingTier: 'tier2',
      signals: [
        {
          type: EB_SIGNAL_TYPES.MARKET_ENTRY,
          title: 'Saudi Market Entry',
          description: 'Establishing Saudi subsidiary with 200+ local hires',
          confidence: 0.85,
          source: 'Trade Publication',
          date: '2024-01-08',
        },
        {
          type: EB_SIGNAL_TYPES.HEADCOUNT_JUMP,
          title: 'Production Expansion',
          description: 'New manufacturing line requires 150 additional staff',
          confidence: 0.80,
          source: 'Company Website',
          date: '2024-01-11',
        },
      ],
      score: 76,
      decisionMaker: {
        name: 'Khalid Rahman',
        title: 'Head of Human Capital',
        linkedin: 'https://linkedin.com/in/example',
      },
      freshness: 'recent',
    },
    {
      id: 'eb-6',
      name: 'Emaar Properties',
      industry: 'Real Estate',
      size: 'enterprise',
      headcount: 6000,
      headcountGrowth: 7,
      region: 'UAE',
      city: 'Dubai',
      description: 'Premier real estate developer with diversified portfolio',
      bankingTier: 'tier1',
      signals: [
        {
          type: EB_SIGNAL_TYPES.HIRING_EXPANSION,
          title: 'Project Team Expansion',
          description: 'Hiring for multiple mega-projects in Dubai',
          confidence: 0.84,
          source: 'LinkedIn Jobs',
          date: '2024-01-13',
        },
      ],
      score: 71,
      decisionMaker: {
        name: 'Fatima Al Suwaidi',
        title: 'VP People & Culture',
        linkedin: 'https://linkedin.com/in/example',
      },
      freshness: 'recent',
    },
    {
      id: 'eb-7',
      name: 'Chalhoub Group',
      industry: 'Luxury Retail',
      size: 'enterprise',
      headcount: 12000,
      headcountGrowth: 5,
      region: 'UAE',
      city: 'Dubai',
      description: 'Luxury retail leader representing major fashion and beauty brands',
      bankingTier: 'tier1',
      signals: [
        {
          type: EB_SIGNAL_TYPES.PAYROLL_SWITCH,
          title: 'Payroll Provider Review',
          description: 'Current payroll contract ending Q2 - open to proposals',
          confidence: 0.72,
          source: 'Industry Contact',
          date: '2024-01-05',
        },
        {
          type: EB_SIGNAL_TYPES.HIRING_EXPANSION,
          title: 'Seasonal Hiring',
          description: '400 temporary positions for luxury season',
          confidence: 0.88,
          source: 'Chalhoub Careers',
          date: '2024-01-17',
        },
      ],
      score: 82,
      decisionMaker: {
        name: 'Layla Hassan',
        title: 'Group HR Director',
        linkedin: 'https://linkedin.com/in/example',
      },
      freshness: 'fresh',
    },
    // Abu Dhabi Employers
    {
      id: 'eb-8',
      name: 'Mubadala Investment',
      industry: 'Investment',
      size: 'enterprise',
      headcount: 2500,
      headcountGrowth: 20,
      region: 'UAE',
      city: 'Abu Dhabi',
      description: 'Sovereign wealth fund with diversified global portfolio',
      bankingTier: 'government',
      signals: [
        {
          type: EB_SIGNAL_TYPES.HEADCOUNT_JUMP,
          title: 'Investment Team Growth',
          description: '20% expansion in investment and operations teams',
          confidence: 0.90,
          source: 'Annual Report',
          date: '2024-01-02',
        },
        {
          type: EB_SIGNAL_TYPES.LEADERSHIP_HIRING,
          title: 'Senior Leadership Hiring',
          description: 'Multiple MD-level positions advertised',
          confidence: 0.86,
          source: 'LinkedIn Jobs',
          date: '2024-01-09',
        },
      ],
      score: 89,
      decisionMaker: {
        name: 'Sultan Al Dhaheri',
        title: 'Chief People Officer',
        linkedin: 'https://linkedin.com/in/example',
      },
      freshness: 'fresh',
    },
    {
      id: 'eb-9',
      name: 'Etihad Airways',
      industry: 'Aviation',
      size: 'enterprise',
      headcount: 18000,
      headcountGrowth: 14,
      region: 'UAE',
      city: 'Abu Dhabi',
      description: 'National carrier rebuilding operations post-restructuring',
      bankingTier: 'tier1',
      signals: [
        {
          type: EB_SIGNAL_TYPES.HIRING_EXPANSION,
          title: 'Operational Recovery',
          description: 'Hiring 2,000+ to support route expansion',
          confidence: 0.93,
          source: 'Etihad Careers',
          date: '2024-01-21',
        },
      ],
      score: 85,
      decisionMaker: {
        name: 'Mariam Al Shamsi',
        title: 'SVP Human Resources',
        linkedin: 'https://linkedin.com/in/example',
      },
      freshness: 'fresh',
    },
    {
      id: 'eb-10',
      name: 'G42',
      industry: 'Technology',
      size: 'mid-market',
      headcount: 1500,
      headcountGrowth: 45,
      region: 'UAE',
      city: 'Abu Dhabi',
      description: 'AI and cloud computing company with rapid expansion',
      bankingTier: 'tier2',
      signals: [
        {
          type: EB_SIGNAL_TYPES.HEADCOUNT_JUMP,
          title: 'Hypergrowth Mode',
          description: '45% headcount growth - highest in UAE tech sector',
          confidence: 0.94,
          source: 'Tech News',
          date: '2024-01-22',
        },
        {
          type: EB_SIGNAL_TYPES.SUBSIDIARY_CREATION,
          title: 'New AI Subsidiary',
          description: 'Launching dedicated AI services company',
          confidence: 0.89,
          source: 'Press Release',
          date: '2024-01-20',
        },
        {
          type: EB_SIGNAL_TYPES.HIRING_EXPANSION,
          title: 'Tech Talent Drive',
          description: '500+ engineering positions open',
          confidence: 0.91,
          source: 'G42 Careers',
          date: '2024-01-19',
        },
      ],
      score: 95,
      decisionMaker: {
        name: 'Ahmed Al Khoori',
        title: 'Chief People Officer',
        linkedin: 'https://linkedin.com/in/example',
      },
      freshness: 'fresh',
    },
  ];

  // Filter by regions if specified
  if (regions.length === 0) {
    return allEmployers;
  }

  // Map region codes to cities
  const regionToCities: Record<string, string[]> = {
    'dubai': ['Dubai'],
    'abu-dhabi': ['Abu Dhabi'],
    'sharjah': ['Sharjah'],
    'northern-emirates': ['Sharjah', 'Ajman', 'RAK', 'Fujairah', 'UAQ'],
  };

  const allowedCities = regions.flatMap(r => regionToCities[r] || [r]);

  return allEmployers.filter(emp =>
    allowedCities.some(city =>
      emp.city?.toLowerCase().includes(city.toLowerCase()) ||
      emp.region.toLowerCase().includes(city.toLowerCase())
    )
  );
}

// =============================================================================
// SCORING
// =============================================================================

export function scoreEBEmployer(employer: EBCompanyData): number {
  let score = 50; // Base score

  // Signal-based scoring
  employer.signals.forEach(signal => {
    const confidenceBoost = signal.confidence * 10;

    switch (signal.type) {
      case EB_SIGNAL_TYPES.HIRING_EXPANSION:
        score += 15 + confidenceBoost;
        break;
      case EB_SIGNAL_TYPES.HEADCOUNT_JUMP:
        score += 12 + confidenceBoost;
        break;
      case EB_SIGNAL_TYPES.PAYROLL_SWITCH:
        score += 20 + confidenceBoost; // High value signal
        break;
      case EB_SIGNAL_TYPES.SUBSIDIARY_CREATION:
        score += 10 + confidenceBoost;
        break;
      case EB_SIGNAL_TYPES.OFFICE_OPENING:
        score += 8 + confidenceBoost;
        break;
      case EB_SIGNAL_TYPES.MARKET_ENTRY:
        score += 8 + confidenceBoost;
        break;
      case EB_SIGNAL_TYPES.VISA_ISSUANCE:
        score += 6 + confidenceBoost;
        break;
      case EB_SIGNAL_TYPES.LEADERSHIP_HIRING:
        score += 5 + confidenceBoost;
        break;
      default:
        score += 3;
    }
  });

  // Headcount growth bonus
  if (employer.headcountGrowth && employer.headcountGrowth > 10) {
    score += Math.min(employer.headcountGrowth, 25);
  }

  // Banking tier bonus
  if (employer.bankingTier === 'tier1' || employer.bankingTier === 'government') {
    score += 5;
  }

  // Freshness bonus
  if (employer.freshness === 'fresh') {
    score += 5;
  }

  return Math.min(Math.round(score), 100);
}

export default generateEBEmployers;
