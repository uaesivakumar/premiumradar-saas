/**
 * Fake Data Module
 *
 * Generate realistic fake data for demo mode.
 */

import type {
  FakeDomain,
  FakeCompany,
  FakeContact,
  FakePipelineDeal,
  PipelineStage,
} from './types';

// ============================================================
// SEED DATA
// ============================================================

const DOMAIN_WORDS = [
  // Tech
  'cloud', 'data', 'tech', 'cyber', 'code', 'byte', 'net', 'web', 'app', 'api',
  'sync', 'hub', 'flow', 'stack', 'dev', 'ops', 'ai', 'ml', 'iot', 'crypto',
  // Business
  'biz', 'corp', 'work', 'team', 'pro', 'grow', 'scale', 'lead', 'sales', 'market',
  // Finance
  'fin', 'pay', 'fund', 'cash', 'bank', 'invest', 'trade', 'wealth', 'capital', 'asset',
  // Health
  'med', 'health', 'care', 'vita', 'fit', 'well', 'life', 'bio', 'pharma', 'clinic',
  // General
  'rapid', 'swift', 'prime', 'ultra', 'mega', 'super', 'smart', 'fast', 'easy', 'simple',
];

const TLDS = ['.com', '.io', '.co', '.net', '.ai', '.app', '.dev', '.tech'];

const VERTICALS = [
  'Technology', 'Finance', 'Healthcare', 'E-Commerce', 'Education',
  'Real Estate', 'Marketing', 'SaaS', 'AI/ML', 'Crypto',
];

const COMPANY_NAMES = [
  'TechVenture Labs', 'Digital Dynamics', 'CloudScale Solutions', 'DataDriven Inc',
  'GrowthPath Partners', 'InnovateTech', 'FutureBrand Agency', 'NextGen Ventures',
  'SmartBiz Solutions', 'PrimeTech Group', 'ScaleUp Studios', 'Velocity Partners',
];

const TITLES = [
  'CEO', 'CTO', 'VP of Engineering', 'Head of Product', 'Director of Marketing',
  'Business Development Manager', 'Domain Portfolio Manager', 'M&A Director',
];

const FIRST_NAMES = [
  'James', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'Robert', 'Ashley',
  'William', 'Amanda', 'John', 'Stephanie', 'Alex', 'Jennifer', 'Chris', 'Nicole',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee',
];

// ============================================================
// GENERATORS
// ============================================================

let idCounter = 1;

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${idCounter++}`;
}

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 1): number {
  const value = Math.random() * (max - min) + min;
  return parseFloat(value.toFixed(decimals));
}

/**
 * Generate a fake domain
 */
export function generateFakeDomain(options?: {
  vertical?: string;
  minScore?: number;
  maxPrice?: number;
}): FakeDomain {
  const word1 = randomItem(DOMAIN_WORDS);
  const word2 = randomItem(DOMAIN_WORDS);
  const useTwo = Math.random() > 0.4;
  const name = useTwo ? `${word1}${word2}` : word1;
  const tld = randomItem(TLDS);
  const fullDomain = `${name}${tld}`;

  const trafficScore = randomInt(20, 95);
  const seoScore = randomInt(25, 90);
  const brandScore = randomInt(30, 95);
  const overallScore = Math.round((trafficScore + seoScore + brandScore) / 3);

  // Price correlates with score
  const basePrice = overallScore * 100;
  const priceMultiplier = randomFloat(0.5, 2.5);
  const price = Math.round(basePrice * priceMultiplier);

  return {
    id: generateId('domain'),
    name,
    tld,
    fullDomain,
    status: randomItem(['available', 'registered', 'premium', 'aftermarket']),
    price: Math.min(price, options?.maxPrice || 100000),
    estimatedValue: Math.round(price * randomFloat(0.8, 1.5)),
    trafficScore: Math.max(trafficScore, options?.minScore || 0),
    seoScore: Math.max(seoScore, options?.minScore || 0),
    brandScore: Math.max(brandScore, options?.minScore || 0),
    overallScore: Math.max(overallScore, options?.minScore || 0),
    age: randomInt(1, 15),
    backlinks: randomInt(50, 10000),
    monthlyTraffic: randomInt(1000, 500000),
    vertical: options?.vertical || randomItem(VERTICALS),
    keywords: [word1, word2, randomItem(DOMAIN_WORDS)].filter(Boolean),
    isWatched: Math.random() > 0.8,
    isPinned: Math.random() > 0.9,
  };
}

/**
 * Generate multiple fake domains
 */
export function generateFakeDomains(
  count: number,
  options?: Parameters<typeof generateFakeDomain>[0]
): FakeDomain[] {
  return Array.from({ length: count }, () => generateFakeDomain(options));
}

/**
 * Generate a fake contact
 */
export function generateFakeContact(isPrimary = false): FakeContact {
  const firstName = randomItem(FIRST_NAMES);
  const lastName = randomItem(LAST_NAMES);
  const name = `${firstName} ${lastName}`;
  const emailDomain = randomItem(['gmail.com', 'company.com', 'outlook.com']);

  return {
    id: generateId('contact'),
    name,
    title: randomItem(TITLES),
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${emailDomain}`,
    phone: `+1 (${randomInt(200, 999)}) ${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
    linkedin: Math.random() > 0.3 ? `linkedin.com/in/${firstName.toLowerCase()}${lastName.toLowerCase()}` : undefined,
    isPrimary,
  };
}

/**
 * Generate a fake company
 */
export function generateFakeCompany(): FakeCompany {
  const name = randomItem(COMPANY_NAMES);
  const domain = name.toLowerCase().replace(/\s+/g, '') + '.com';

  const sizes: FakeCompany['size'][] = ['startup', 'small', 'medium', 'large', 'enterprise'];
  const size = randomItem(sizes);

  const employeeCounts: Record<FakeCompany['size'], string> = {
    startup: '1-10',
    small: '11-50',
    medium: '51-200',
    large: '201-1000',
    enterprise: '1000+',
  };

  const revenues: Record<FakeCompany['size'], string> = {
    startup: '$100K-$1M',
    small: '$1M-$10M',
    medium: '$10M-$50M',
    large: '$50M-$500M',
    enterprise: '$500M+',
  };

  const contactCount = randomInt(1, 4);
  const contacts = [
    generateFakeContact(true),
    ...Array.from({ length: contactCount - 1 }, () => generateFakeContact(false)),
  ];

  return {
    id: generateId('company'),
    name,
    domain,
    industry: randomItem(VERTICALS),
    size,
    employeeCount: employeeCounts[size],
    revenue: revenues[size],
    founded: randomInt(1990, 2023),
    headquarters: `${randomItem(['San Francisco', 'New York', 'Austin', 'Seattle', 'Boston', 'Los Angeles'])}, USA`,
    description: `${name} is a leading provider of ${randomItem(['innovative', 'cutting-edge', 'enterprise', 'scalable'])} ${randomItem(['solutions', 'services', 'platforms', 'technologies'])} for ${randomItem(['businesses', 'enterprises', 'organizations', 'teams'])}.`,
    website: `https://${domain}`,
    linkedin: Math.random() > 0.2 ? `linkedin.com/company/${name.toLowerCase().replace(/\s+/g, '-')}` : undefined,
    contacts,
  };
}

/**
 * Generate multiple fake companies
 */
export function generateFakeCompanies(count: number): FakeCompany[] {
  return Array.from({ length: count }, () => generateFakeCompany());
}

/**
 * Generate a fake pipeline deal
 */
export function generateFakePipelineDeal(
  stage?: PipelineStage
): FakePipelineDeal {
  const domain = generateFakeDomain();
  const stages: PipelineStage[] = [
    'discovery', 'contacted', 'negotiating', 'offer-made', 'due-diligence', 'won', 'lost',
  ];
  const selectedStage = stage || randomItem(stages);

  const stageProbabilities: Record<PipelineStage, number> = {
    discovery: 10,
    contacted: 20,
    negotiating: 40,
    'offer-made': 60,
    'due-diligence': 80,
    won: 100,
    lost: 0,
  };

  const daysAgo = randomInt(1, 90);
  const addedAt = new Date();
  addedAt.setDate(addedAt.getDate() - daysAgo);

  const updateDaysAgo = randomInt(0, Math.min(daysAgo, 14));
  const updatedAt = new Date();
  updatedAt.setDate(updatedAt.getDate() - updateDaysAgo);

  return {
    id: generateId('deal'),
    domain,
    stage: selectedStage,
    value: domain.price,
    probability: stageProbabilities[selectedStage],
    addedAt,
    updatedAt,
    notes: randomItem([
      'Initial outreach sent',
      'Waiting for owner response',
      'Good conversation, negotiating terms',
      'Offer submitted, awaiting counter',
      'Due diligence in progress',
      'Deal closed successfully',
      'Owner not interested',
    ]),
    nextAction: selectedStage !== 'won' && selectedStage !== 'lost'
      ? randomItem(['Follow up', 'Send revised offer', 'Schedule call', 'Complete review'])
      : undefined,
    nextActionDate: selectedStage !== 'won' && selectedStage !== 'lost'
      ? new Date(Date.now() + randomInt(1, 7) * 24 * 60 * 60 * 1000)
      : undefined,
    owner: randomItem(FIRST_NAMES),
  };
}

/**
 * Generate a fake pipeline with realistic distribution
 */
export function generateFakePipeline(totalDeals = 25): FakePipelineDeal[] {
  const distribution: Record<PipelineStage, number> = {
    discovery: 8,
    contacted: 5,
    negotiating: 4,
    'offer-made': 3,
    'due-diligence': 2,
    won: 2,
    lost: 1,
  };

  const deals: FakePipelineDeal[] = [];

  Object.entries(distribution).forEach(([stage, count]) => {
    const adjustedCount = Math.round((count / 25) * totalDeals);
    for (let i = 0; i < adjustedCount; i++) {
      deals.push(generateFakePipelineDeal(stage as PipelineStage));
    }
  });

  return deals.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

/**
 * Generate fake discovery list
 */
export function generateFakeDiscoveryList(
  count: number,
  query?: string
): FakeDomain[] {
  const domains = generateFakeDomains(count);

  // If query provided, make some domains match
  if (query) {
    const queryLower = query.toLowerCase();
    domains.forEach((domain, i) => {
      if (i < count / 3) {
        domain.name = queryLower + randomItem(DOMAIN_WORDS);
        domain.fullDomain = domain.name + domain.tld;
        domain.keywords.unshift(queryLower);
      }
    });
  }

  return domains.sort((a, b) => b.overallScore - a.overallScore);
}

/**
 * Generate fake search suggestions
 */
export function generateFakeSearchSuggestions(partial: string): string[] {
  const suggestions: string[] = [];
  const lowerPartial = partial.toLowerCase();

  DOMAIN_WORDS.forEach((word) => {
    if (word.startsWith(lowerPartial)) {
      suggestions.push(word);
    }
  });

  // Add compound suggestions
  if (suggestions.length < 5) {
    suggestions.push(`${partial}hub`, `${partial}app`, `${partial}pro`);
  }

  return suggestions.slice(0, 8);
}
