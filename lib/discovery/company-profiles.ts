/**
 * Company Profiles
 *
 * Company information and data for domain owners.
 */

import { create } from 'zustand';
import type {
  CompanyProfile,
  EmployeeRange,
  RevenueRange,
  FundingStage,
  DataQuality,
} from './types';

// ============================================================
// COMPANY PROFILE STORE
// ============================================================

interface CompanyProfileStore {
  profiles: Map<string, CompanyProfile>;
  isLoading: boolean;
  error: string | null;

  loadProfile: (domain: string) => Promise<CompanyProfile>;
  getProfile: (domain: string) => CompanyProfile | undefined;
  searchCompanies: (query: string) => Promise<CompanyProfile[]>;
  clearProfile: (domain: string) => void;
}

export const useCompanyProfileStore = create<CompanyProfileStore>((set, get) => ({
  profiles: new Map(),
  isLoading: false,
  error: null,

  loadProfile: async (domain) => {
    set({ isLoading: true, error: null });
    try {
      // In production, this would call the API
      const profile = await fetchCompanyProfile(domain);

      set((state) => ({
        profiles: new Map(state.profiles).set(domain, profile),
        isLoading: false,
      }));

      return profile;
    } catch (error) {
      set({ error: 'Failed to load company profile', isLoading: false });
      throw error;
    }
  },

  getProfile: (domain) => {
    return get().profiles.get(domain);
  },

  searchCompanies: async (query) => {
    // In production, this would call the API
    return generateMockCompanies(10).filter(
      (c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.domain.toLowerCase().includes(query.toLowerCase())
    );
  },

  clearProfile: (domain) => {
    set((state) => {
      const profiles = new Map(state.profiles);
      profiles.delete(domain);
      return { profiles };
    });
  },
}));

// ============================================================
// COMPANY API
// ============================================================

/**
 * Fetch company profile by domain
 */
async function fetchCompanyProfile(domain: string): Promise<CompanyProfile> {
  // In production, this would call the API
  return generateMockCompany(domain);
}

/**
 * Enrich company data
 */
export async function enrichCompanyProfile(
  domain: string,
  sources: string[]
): Promise<CompanyProfile> {
  // In production, this would call enrichment API
  console.log(`[COMPANY ENRICHMENT] Domain: ${domain}, Sources: ${sources.join(', ')}`);
  return fetchCompanyProfile(domain);
}

// ============================================================
// COMPANY HELPERS
// ============================================================

/**
 * Get employee range display label
 */
export function getEmployeeRangeLabel(range: EmployeeRange): string {
  const labels: Record<EmployeeRange, string> = {
    '1-10': '1-10 employees',
    '11-50': '11-50 employees',
    '51-200': '51-200 employees',
    '201-500': '201-500 employees',
    '501-1000': '501-1,000 employees',
    '1001-5000': '1,001-5,000 employees',
    '5000+': '5,000+ employees',
  };
  return labels[range];
}

/**
 * Get revenue range display label
 */
export function getRevenueRangeLabel(range: RevenueRange): string {
  const labels: Record<RevenueRange, string> = {
    'pre-revenue': 'Pre-revenue',
    '<1M': 'Under $1M',
    '1M-10M': '$1M - $10M',
    '10M-50M': '$10M - $50M',
    '50M-100M': '$50M - $100M',
    '100M-500M': '$100M - $500M',
    '500M-1B': '$500M - $1B',
    '1B+': '$1B+',
  };
  return labels[range];
}

/**
 * Get funding stage display label
 */
export function getFundingStageLabel(stage: FundingStage): string {
  const labels: Record<FundingStage, string> = {
    bootstrapped: 'Bootstrapped',
    'pre-seed': 'Pre-Seed',
    seed: 'Seed',
    'series-a': 'Series A',
    'series-b': 'Series B',
    'series-c': 'Series C',
    'series-d+': 'Series D+',
    public: 'Public',
    acquired: 'Acquired',
  };
  return labels[stage];
}

/**
 * Get funding stage color
 */
export function getFundingStageColor(stage: FundingStage): string {
  const colors: Record<FundingStage, string> = {
    bootstrapped: 'gray',
    'pre-seed': 'purple',
    seed: 'blue',
    'series-a': 'green',
    'series-b': 'teal',
    'series-c': 'cyan',
    'series-d+': 'indigo',
    public: 'yellow',
    acquired: 'orange',
  };
  return colors[stage];
}

/**
 * Calculate data quality score
 */
export function calculateDataQuality(profile: Partial<CompanyProfile>): DataQuality {
  const fields = [
    'name',
    'domain',
    'description',
    'industry',
    'foundedYear',
    'employeeCount',
    'revenue',
    'headquarters',
    'socialProfiles',
    'technologies',
  ];

  let filledFields = 0;
  for (const field of fields) {
    const value = profile[field as keyof CompanyProfile];
    if (value !== undefined && value !== null) {
      if (typeof value === 'object' && Object.keys(value).length === 0) continue;
      if (Array.isArray(value) && value.length === 0) continue;
      filledFields++;
    }
  }

  const completeness = filledFields / fields.length;
  const daysSinceUpdate = profile.lastUpdated
    ? (Date.now() - new Date(profile.lastUpdated).getTime()) / (1000 * 60 * 60 * 24)
    : 365;
  const freshness = Math.max(0, 1 - daysSinceUpdate / 90); // 90-day decay

  const accuracy = 0.85; // Placeholder - would be calculated from source reliability

  return {
    score: Math.round((completeness * 0.4 + freshness * 0.3 + accuracy * 0.3) * 100),
    completeness,
    freshness,
    accuracy,
    sources: ['Clearbit', 'LinkedIn', 'Crunchbase'],
  };
}

/**
 * Get company size category
 */
export function getCompanySizeCategory(
  employeeCount?: EmployeeRange
): 'startup' | 'smb' | 'midmarket' | 'enterprise' {
  if (!employeeCount) return 'startup';

  if (employeeCount === '1-10' || employeeCount === '11-50') return 'startup';
  if (employeeCount === '51-200' || employeeCount === '201-500') return 'smb';
  if (employeeCount === '501-1000' || employeeCount === '1001-5000') return 'midmarket';
  return 'enterprise';
}

/**
 * Format location for display
 */
export function formatLocation(location: CompanyProfile['headquarters']): string {
  const parts = [location.city, location.state, location.country].filter(Boolean);
  return parts.join(', ');
}

/**
 * Get social profile URL
 */
export function getSocialProfileUrl(
  platform: keyof CompanyProfile['socialProfiles'],
  handle?: string
): string | null {
  if (!handle) return null;

  const baseUrls: Record<string, string> = {
    linkedin: 'https://linkedin.com/company/',
    twitter: 'https://twitter.com/',
    facebook: 'https://facebook.com/',
    instagram: 'https://instagram.com/',
    youtube: 'https://youtube.com/',
    crunchbase: 'https://crunchbase.com/organization/',
  };

  const base = baseUrls[platform];
  if (!base) return null;

  // Handle already contains full URL
  if (handle.startsWith('http')) return handle;

  return base + handle;
}

// ============================================================
// MOCK DATA GENERATORS
// ============================================================

function generateMockCompany(domain: string): CompanyProfile {
  const baseName = domain.replace(/\.(com|net|io|co)$/, '');
  const capitalizedName = baseName.charAt(0).toUpperCase() + baseName.slice(1);

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'E-Commerce',
    'Education',
    'Real Estate',
    'Media',
  ];
  const employeeRanges: EmployeeRange[] = [
    '1-10',
    '11-50',
    '51-200',
    '201-500',
    '501-1000',
  ];
  const revenueRanges: RevenueRange[] = [
    'pre-revenue',
    '<1M',
    '1M-10M',
    '10M-50M',
    '50M-100M',
  ];
  const fundingStages: FundingStage[] = [
    'bootstrapped',
    'seed',
    'series-a',
    'series-b',
    'series-c',
  ];

  const profile: CompanyProfile = {
    id: `company_${domain.replace(/\./g, '_')}`,
    name: `${capitalizedName} Inc.`,
    domain,
    description: `${capitalizedName} is a leading provider of innovative solutions in the ${industries[Math.floor(Math.random() * industries.length)].toLowerCase()} space.`,
    industry: industries[Math.floor(Math.random() * industries.length)],
    foundedYear: 2010 + Math.floor(Math.random() * 14),
    employeeCount: employeeRanges[Math.floor(Math.random() * employeeRanges.length)],
    revenue: revenueRanges[Math.floor(Math.random() * revenueRanges.length)],
    fundingStage: fundingStages[Math.floor(Math.random() * fundingStages.length)],
    totalFunding: Math.floor(Math.random() * 50000000),
    headquarters: {
      city: 'San Francisco',
      state: 'CA',
      country: 'United States',
      region: 'North America',
    },
    socialProfiles: {
      linkedin: baseName,
      twitter: baseName,
      crunchbase: baseName,
    },
    technologies: ['React', 'Node.js', 'AWS', 'PostgreSQL'].slice(
      0,
      2 + Math.floor(Math.random() * 3)
    ),
    keywords: [baseName, 'software', 'technology', 'innovation'].slice(
      0,
      2 + Math.floor(Math.random() * 3)
    ),
    competitors: [`${baseName}competitor.com`, `other${baseName}.io`],
    lastUpdated: new Date(),
    dataQuality: {
      score: 70 + Math.floor(Math.random() * 25),
      completeness: 0.7 + Math.random() * 0.25,
      freshness: 0.8 + Math.random() * 0.2,
      accuracy: 0.75 + Math.random() * 0.2,
      sources: ['Clearbit', 'LinkedIn'],
    },
  };

  return profile;
}

function generateMockCompanies(count: number): CompanyProfile[] {
  const domains = [
    'techcorp.com',
    'innovate.io',
    'datadrive.co',
    'cloudbase.net',
    'aiplatform.com',
    'fintech.io',
    'healthtech.co',
    'ecomhub.com',
    'edutech.io',
    'mediagroup.net',
  ];

  return domains.slice(0, count).map((domain) => generateMockCompany(domain));
}
