/**
 * Email Quality Engine - Sprint S133
 *
 * Comprehensive email validation and intelligence extraction:
 * - Disposable email detection
 * - Corporate domain detection
 * - Domain → Industry classification
 * - Region inference
 * - Lead type inference
 * - Quality scoring
 */

import type { Vertical, SubVertical } from '@/lib/intelligence/context/types';

// =============================================================================
// Types
// =============================================================================

export interface EmailQualityResult {
  email: string;
  domain: string;
  isValid: boolean;
  isDisposable: boolean;
  isCorporate: boolean;
  isFreemail: boolean;

  // Quality metrics
  qualityScore: number; // 0-100
  qualityTier: 'premium' | 'standard' | 'low' | 'rejected';

  // Intelligence extraction
  company: CompanyInference | null;
  industry: IndustryInference | null;
  region: RegionInference | null;
  leadType: LeadType;

  // Vertical mapping
  suggestedVertical: Vertical | null;
  suggestedSubVertical: SubVertical | null;

  // Flags
  flags: EmailFlag[];
}

export interface CompanyInference {
  name: string;
  domain: string;
  confidence: number; // 0-1
  source: 'known_enterprise' | 'domain_parse' | 'enrichment';
}

export interface IndustryInference {
  primary: string;
  secondary: string | null;
  confidence: number;
  vertical: Vertical | null;
}

export interface RegionInference {
  country: string;
  countryCode: string;
  city: string | null;
  confidence: number;
}

export type LeadType =
  | 'enterprise' // Large enterprise (Fortune 500, etc.)
  | 'corporate' // Mid-size corporate
  | 'startup' // Startup/scale-up
  | 'smb' // Small/medium business
  | 'individual' // Personal email
  | 'unknown';

export type EmailFlag =
  | 'disposable'
  | 'freemail'
  | 'role_based' // info@, sales@, etc.
  | 'typo_suspected'
  | 'high_value_domain'
  | 'uae_enterprise'
  | 'gcc_enterprise'
  | 'known_competitor';

// =============================================================================
// Disposable Email Domains (Common Temporary Email Services)
// =============================================================================

const DISPOSABLE_DOMAINS = new Set([
  // Major disposable email services
  '10minutemail.com', 'tempmail.com', 'guerrillamail.com', 'mailinator.com',
  'throwaway.email', 'temp-mail.org', 'fakeinbox.com', 'getnada.com',
  'maildrop.cc', 'yopmail.com', 'mohmal.com', 'dispostable.com',
  'mailnesia.com', 'spamgourmet.com', 'mytrashmail.com', 'sharklasers.com',
  'trashmail.com', 'getairmail.com', 'tempmailaddress.com', 'tempail.com',
  'emailondeck.com', 'mintemail.com', 'tempinbox.com', 'throwawaymail.com',
  'mailcatch.com', 'spambox.us', 'tempr.email', 'discard.email',
  'mailsac.com', 'inboxbear.com', 'guerrillamail.org', 'grr.la',
  'burnermail.io', 'mailpoof.com', 'jetable.org', 'spamevader.com',
]);

// =============================================================================
// Free Email Providers
// =============================================================================

const FREEMAIL_DOMAINS = new Set([
  // Major free email providers
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
  'icloud.com', 'me.com', 'mac.com', 'aol.com', 'protonmail.com',
  'zoho.com', 'mail.com', 'gmx.com', 'yandex.com', 'tutanota.com',
  // Regional
  'yahoo.co.uk', 'yahoo.co.in', 'yahoo.com.au', 'hotmail.co.uk',
  'outlook.co.uk', 'rediffmail.com', 'inbox.com',
]);

// =============================================================================
// UAE & GCC Enterprise Domains (High-Value Leads)
// =============================================================================

const UAE_ENTERPRISE_DOMAINS: Record<string, { name: string; industry: string; vertical: Vertical }> = {
  // UAE Banks (Employee Banking targets)
  'emiratesnbd.com': { name: 'Emirates NBD', industry: 'Banking', vertical: 'banking' },
  'adcb.com': { name: 'ADCB', industry: 'Banking', vertical: 'banking' },
  'dib.ae': { name: 'Dubai Islamic Bank', industry: 'Banking', vertical: 'banking' },
  'mashreqbank.com': { name: 'Mashreq Bank', industry: 'Banking', vertical: 'banking' },
  'rakbank.ae': { name: 'RAKBank', industry: 'Banking', vertical: 'banking' },
  'fab.com': { name: 'First Abu Dhabi Bank', industry: 'Banking', vertical: 'banking' },
  'nbf.ae': { name: 'National Bank of Fujairah', industry: 'Banking', vertical: 'banking' },
  'cbd.ae': { name: 'Commercial Bank of Dubai', industry: 'Banking', vertical: 'banking' },
  'ajmanbank.ae': { name: 'Ajman Bank', industry: 'Banking', vertical: 'banking' },
  'noorbank.com': { name: 'Noor Bank', industry: 'Banking', vertical: 'banking' },

  // UAE Real Estate
  'emaar.com': { name: 'Emaar Properties', industry: 'Real Estate', vertical: 'real-estate' },
  'damacproperties.com': { name: 'DAMAC Properties', industry: 'Real Estate', vertical: 'real-estate' },
  'meraas.com': { name: 'Meraas', industry: 'Real Estate', vertical: 'real-estate' },
  'aldar.com': { name: 'Aldar Properties', industry: 'Real Estate', vertical: 'real-estate' },
  'dubaiholding.com': { name: 'Dubai Holding', industry: 'Conglomerate', vertical: 'real-estate' },
  'nakheel.com': { name: 'Nakheel', industry: 'Real Estate', vertical: 'real-estate' },
  'sobharealty.com': { name: 'Sobha Realty', industry: 'Real Estate', vertical: 'real-estate' },

  // UAE Insurance
  'omaninsurance.ae': { name: 'Oman Insurance', industry: 'Insurance', vertical: 'insurance' },
  'salama.ae': { name: 'Salama Insurance', industry: 'Insurance', vertical: 'insurance' },
  'adnic.ae': { name: 'ADNIC', industry: 'Insurance', vertical: 'insurance' },
  'orientinsurance.ae': { name: 'Orient Insurance', industry: 'Insurance', vertical: 'insurance' },

  // UAE Tech/SaaS
  'careem.com': { name: 'Careem', industry: 'Technology', vertical: 'saas-sales' },
  'souq.com': { name: 'Souq/Amazon', industry: 'E-commerce', vertical: 'saas-sales' },
  'noon.com': { name: 'Noon', industry: 'E-commerce', vertical: 'saas-sales' },
  'du.ae': { name: 'du', industry: 'Telecom', vertical: 'saas-sales' },
  'etisalat.ae': { name: 'Etisalat', industry: 'Telecom', vertical: 'saas-sales' },

  // UAE Recruitment
  'michaelpage.ae': { name: 'Michael Page', industry: 'Recruitment', vertical: 'recruitment' },
  'robertwalters.ae': { name: 'Robert Walters', industry: 'Recruitment', vertical: 'recruitment' },
  'hays.ae': { name: 'Hays', industry: 'Recruitment', vertical: 'recruitment' },
};

// GCC Enterprise Domains
const GCC_ENTERPRISE_DOMAINS: Record<string, { name: string; country: string; industry: string }> = {
  // Saudi Arabia
  'aramco.com': { name: 'Saudi Aramco', country: 'SA', industry: 'Oil & Gas' },
  'sabic.com': { name: 'SABIC', country: 'SA', industry: 'Chemicals' },
  'stc.com.sa': { name: 'STC', country: 'SA', industry: 'Telecom' },
  'alrajhibank.com.sa': { name: 'Al Rajhi Bank', country: 'SA', industry: 'Banking' },

  // Qatar
  'qatarairways.com': { name: 'Qatar Airways', country: 'QA', industry: 'Aviation' },
  'qnb.com': { name: 'Qatar National Bank', country: 'QA', industry: 'Banking' },

  // Kuwait
  'nbk.com': { name: 'National Bank of Kuwait', country: 'KW', industry: 'Banking' },
  'kfh.com': { name: 'Kuwait Finance House', country: 'KW', industry: 'Banking' },

  // Bahrain
  'batelco.com': { name: 'Batelco', country: 'BH', industry: 'Telecom' },
  'nbbonline.com': { name: 'National Bank of Bahrain', country: 'BH', industry: 'Banking' },

  // Oman
  'bankmuscat.com': { name: 'Bank Muscat', country: 'OM', industry: 'Banking' },
  'omantel.om': { name: 'Omantel', country: 'OM', industry: 'Telecom' },
};

// =============================================================================
// Industry Keywords for Domain Classification
// =============================================================================

const INDUSTRY_KEYWORDS: Record<string, { industry: string; vertical: Vertical }> = {
  // Banking
  'bank': { industry: 'Banking', vertical: 'banking' },
  'finance': { industry: 'Finance', vertical: 'banking' },
  'capital': { industry: 'Finance', vertical: 'banking' },
  'invest': { industry: 'Investment', vertical: 'banking' },
  'credit': { industry: 'Banking', vertical: 'banking' },

  // Insurance
  'insurance': { industry: 'Insurance', vertical: 'insurance' },
  'insure': { industry: 'Insurance', vertical: 'insurance' },
  'takaful': { industry: 'Insurance', vertical: 'insurance' },

  // Real Estate
  'properties': { industry: 'Real Estate', vertical: 'real-estate' },
  'realty': { industry: 'Real Estate', vertical: 'real-estate' },
  'estate': { industry: 'Real Estate', vertical: 'real-estate' },
  'developers': { industry: 'Real Estate', vertical: 'real-estate' },
  'construction': { industry: 'Construction', vertical: 'real-estate' },

  // Recruitment
  'recruit': { industry: 'Recruitment', vertical: 'recruitment' },
  'staffing': { industry: 'Recruitment', vertical: 'recruitment' },
  'talent': { industry: 'Recruitment', vertical: 'recruitment' },
  'hr': { industry: 'HR', vertical: 'recruitment' },
  'jobs': { industry: 'Recruitment', vertical: 'recruitment' },

  // Technology/SaaS
  'tech': { industry: 'Technology', vertical: 'saas-sales' },
  'software': { industry: 'Software', vertical: 'saas-sales' },
  'cloud': { industry: 'Cloud', vertical: 'saas-sales' },
  'digital': { industry: 'Digital', vertical: 'saas-sales' },
  'solutions': { industry: 'Technology', vertical: 'saas-sales' },
};

// =============================================================================
// Country TLD Mapping
// =============================================================================

const TLD_COUNTRY_MAP: Record<string, { country: string; countryCode: string; region: string }> = {
  '.ae': { country: 'United Arab Emirates', countryCode: 'AE', region: 'GCC' },
  '.sa': { country: 'Saudi Arabia', countryCode: 'SA', region: 'GCC' },
  '.qa': { country: 'Qatar', countryCode: 'QA', region: 'GCC' },
  '.kw': { country: 'Kuwait', countryCode: 'KW', region: 'GCC' },
  '.bh': { country: 'Bahrain', countryCode: 'BH', region: 'GCC' },
  '.om': { country: 'Oman', countryCode: 'OM', region: 'GCC' },
  '.in': { country: 'India', countryCode: 'IN', region: 'South Asia' },
  '.uk': { country: 'United Kingdom', countryCode: 'GB', region: 'Europe' },
  '.us': { country: 'United States', countryCode: 'US', region: 'North America' },
  '.sg': { country: 'Singapore', countryCode: 'SG', region: 'Southeast Asia' },
  '.hk': { country: 'Hong Kong', countryCode: 'HK', region: 'East Asia' },
};

// =============================================================================
// Role-Based Email Prefixes (Lower quality - not decision makers)
// =============================================================================

const ROLE_BASED_PREFIXES = new Set([
  'info', 'sales', 'support', 'help', 'contact', 'admin', 'webmaster',
  'marketing', 'hello', 'team', 'office', 'enquiries', 'inquiries',
  'noreply', 'no-reply', 'careers', 'jobs', 'hr', 'billing', 'accounts',
]);

// =============================================================================
// Main Email Quality Engine
// =============================================================================

export function analyzeEmail(email: string): EmailQualityResult {
  const emailLower = email.toLowerCase().trim();

  // Basic validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailLower)) {
    return createRejectedResult(email, 'Invalid email format');
  }

  const [localPart, domain] = emailLower.split('@');
  const flags: EmailFlag[] = [];

  // Check disposable
  const isDisposable = DISPOSABLE_DOMAINS.has(domain);
  if (isDisposable) {
    flags.push('disposable');
    return createRejectedResult(email, 'Disposable email not allowed', flags);
  }

  // Check freemail
  const isFreemail = FREEMAIL_DOMAINS.has(domain);
  if (isFreemail) {
    flags.push('freemail');
  }

  // Check role-based
  const isRoleBased = ROLE_BASED_PREFIXES.has(localPart.split('.')[0]);
  if (isRoleBased) {
    flags.push('role_based');
  }

  // Infer company
  const company = inferCompany(domain);

  // Infer industry
  const industry = inferIndustry(domain, company);

  // Infer region
  const region = inferRegion(domain, company);

  // Check UAE/GCC enterprise
  if (UAE_ENTERPRISE_DOMAINS[domain]) {
    flags.push('uae_enterprise');
    flags.push('high_value_domain');
  } else if (GCC_ENTERPRISE_DOMAINS[domain]) {
    flags.push('gcc_enterprise');
    flags.push('high_value_domain');
  }

  // Determine lead type
  const leadType = determineLeadType(domain, company, isFreemail, flags);

  // Calculate quality score
  const qualityScore = calculateQualityScore({
    isFreemail,
    isRoleBased,
    company,
    industry,
    region,
    flags,
    leadType,
  });

  // Determine quality tier
  const qualityTier = getQualityTier(qualityScore);

  // Get suggested vertical/sub-vertical
  const suggestedVertical = industry?.vertical || null;
  const suggestedSubVertical = getSuggestedSubVertical(suggestedVertical, industry);

  return {
    email: emailLower,
    domain,
    isValid: true,
    isDisposable: false,
    isCorporate: !isFreemail,
    isFreemail,
    qualityScore,
    qualityTier,
    company,
    industry,
    region,
    leadType,
    suggestedVertical,
    suggestedSubVertical,
    flags,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

function createRejectedResult(email: string, _reason: string, flags: EmailFlag[] = []): EmailQualityResult {
  const domain = email.includes('@') ? email.split('@')[1] : '';
  return {
    email,
    domain,
    isValid: false,
    isDisposable: flags.includes('disposable'),
    isCorporate: false,
    isFreemail: false,
    qualityScore: 0,
    qualityTier: 'rejected',
    company: null,
    industry: null,
    region: null,
    leadType: 'unknown',
    suggestedVertical: null,
    suggestedSubVertical: null,
    flags,
  };
}

function inferCompany(domain: string): CompanyInference | null {
  // Check UAE enterprise list
  if (UAE_ENTERPRISE_DOMAINS[domain]) {
    return {
      name: UAE_ENTERPRISE_DOMAINS[domain].name,
      domain,
      confidence: 1.0,
      source: 'known_enterprise',
    };
  }

  // Check GCC enterprise list
  if (GCC_ENTERPRISE_DOMAINS[domain]) {
    return {
      name: GCC_ENTERPRISE_DOMAINS[domain].name,
      domain,
      confidence: 1.0,
      source: 'known_enterprise',
    };
  }

  // Skip freemail domains
  if (FREEMAIL_DOMAINS.has(domain)) {
    return null;
  }

  // Parse company name from domain
  const parts = domain.split('.');
  if (parts.length >= 2) {
    const companyPart = parts[0];
    // Clean up and capitalize
    const name = companyPart
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

    return {
      name,
      domain,
      confidence: 0.5,
      source: 'domain_parse',
    };
  }

  return null;
}

function inferIndustry(domain: string, company: CompanyInference | null): IndustryInference | null {
  // Check UAE enterprise list
  if (UAE_ENTERPRISE_DOMAINS[domain]) {
    return {
      primary: UAE_ENTERPRISE_DOMAINS[domain].industry,
      secondary: null,
      confidence: 1.0,
      vertical: UAE_ENTERPRISE_DOMAINS[domain].vertical,
    };
  }

  // Check GCC enterprise list
  if (GCC_ENTERPRISE_DOMAINS[domain]) {
    return {
      primary: GCC_ENTERPRISE_DOMAINS[domain].industry,
      secondary: null,
      confidence: 0.9,
      vertical: 'banking', // Default for GCC enterprises
    };
  }

  // Check domain keywords
  const domainLower = domain.toLowerCase();
  for (const [keyword, info] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (domainLower.includes(keyword)) {
      return {
        primary: info.industry,
        secondary: null,
        confidence: 0.7,
        vertical: info.vertical,
      };
    }
  }

  // Check company name keywords
  if (company?.name) {
    const nameLower = company.name.toLowerCase();
    for (const [keyword, info] of Object.entries(INDUSTRY_KEYWORDS)) {
      if (nameLower.includes(keyword)) {
        return {
          primary: info.industry,
          secondary: null,
          confidence: 0.6,
          vertical: info.vertical,
        };
      }
    }
  }

  return null;
}

function inferRegion(domain: string, _company: CompanyInference | null): RegionInference | null {
  // Check UAE enterprise (always UAE)
  if (UAE_ENTERPRISE_DOMAINS[domain]) {
    return {
      country: 'United Arab Emirates',
      countryCode: 'AE',
      city: 'Dubai', // Default to Dubai
      confidence: 0.9,
    };
  }

  // Check GCC enterprise
  if (GCC_ENTERPRISE_DOMAINS[domain]) {
    const info = GCC_ENTERPRISE_DOMAINS[domain];
    const countryMap: Record<string, string> = {
      'SA': 'Saudi Arabia',
      'QA': 'Qatar',
      'KW': 'Kuwait',
      'BH': 'Bahrain',
      'OM': 'Oman',
    };
    return {
      country: countryMap[info.country] || info.country,
      countryCode: info.country,
      city: null,
      confidence: 0.9,
    };
  }

  // Check TLD
  for (const [tld, info] of Object.entries(TLD_COUNTRY_MAP)) {
    if (domain.endsWith(tld)) {
      return {
        country: info.country,
        countryCode: info.countryCode,
        city: null,
        confidence: 0.8,
      };
    }
  }

  return null;
}

function determineLeadType(
  domain: string,
  company: CompanyInference | null,
  isFreemail: boolean,
  flags: EmailFlag[]
): LeadType {
  if (isFreemail) return 'individual';

  if (flags.includes('uae_enterprise') || flags.includes('gcc_enterprise')) {
    return 'enterprise';
  }

  if (company?.source === 'known_enterprise') {
    return 'enterprise';
  }

  // Heuristics based on domain
  if (domain.includes('startup') || domain.includes('labs') || domain.includes('io')) {
    return 'startup';
  }

  if (company?.confidence && company.confidence >= 0.5) {
    return 'corporate';
  }

  return 'smb';
}

function calculateQualityScore(params: {
  isFreemail: boolean;
  isRoleBased: boolean;
  company: CompanyInference | null;
  industry: IndustryInference | null;
  region: RegionInference | null;
  flags: EmailFlag[];
  leadType: LeadType;
}): number {
  let score = 50; // Base score

  // Deductions
  if (params.isFreemail) score -= 30;
  if (params.isRoleBased) score -= 15;

  // Additions
  if (params.company?.source === 'known_enterprise') score += 30;
  if (params.company?.confidence && params.company.confidence >= 0.7) score += 10;
  if (params.industry?.confidence && params.industry.confidence >= 0.7) score += 10;
  if (params.region?.countryCode === 'AE') score += 15; // UAE premium
  if (params.flags.includes('uae_enterprise')) score += 20;
  if (params.flags.includes('gcc_enterprise')) score += 15;

  // Lead type bonuses
  if (params.leadType === 'enterprise') score += 15;
  if (params.leadType === 'corporate') score += 10;

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}

function getQualityTier(score: number): 'premium' | 'standard' | 'low' | 'rejected' {
  if (score >= 75) return 'premium';
  if (score >= 50) return 'standard';
  if (score >= 25) return 'low';
  return 'rejected';
}

function getSuggestedSubVertical(vertical: Vertical | null, _industry: IndustryInference | null): SubVertical | null {
  if (!vertical) return null;

  // Default sub-verticals per vertical
  const defaults: Partial<Record<Vertical, SubVertical>> = {
    'banking': 'employee-banking',
    'insurance': 'commercial-insurance',
    'real-estate': 'residential-sales',
    'recruitment': 'tech-recruitment',
    'saas-sales': 'enterprise-sales',
  };

  return defaults[vertical] || null;
}

// =============================================================================
// Batch Processing
// =============================================================================

export function analyzeEmails(emails: string[]): EmailQualityResult[] {
  return emails.map(analyzeEmail);
}

// =============================================================================
// Quality Report
// =============================================================================

export function generateQualityReport(results: EmailQualityResult[]): {
  total: number;
  valid: number;
  rejected: number;
  premium: number;
  standard: number;
  low: number;
  corporate: number;
  freemail: number;
  uaeEnterprise: number;
  gccEnterprise: number;
  averageScore: number;
  verticalBreakdown: Record<string, number>;
} {
  const valid = results.filter(r => r.isValid);

  return {
    total: results.length,
    valid: valid.length,
    rejected: results.filter(r => !r.isValid).length,
    premium: results.filter(r => r.qualityTier === 'premium').length,
    standard: results.filter(r => r.qualityTier === 'standard').length,
    low: results.filter(r => r.qualityTier === 'low').length,
    corporate: results.filter(r => r.isCorporate).length,
    freemail: results.filter(r => r.isFreemail).length,
    uaeEnterprise: results.filter(r => r.flags.includes('uae_enterprise')).length,
    gccEnterprise: results.filter(r => r.flags.includes('gcc_enterprise')).length,
    averageScore: valid.length > 0
      ? Math.round(valid.reduce((sum, r) => sum + r.qualityScore, 0) / valid.length)
      : 0,
    verticalBreakdown: results.reduce((acc, r) => {
      if (r.suggestedVertical) {
        acc[r.suggestedVertical] = (acc[r.suggestedVertical] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>),
  };
}

export default analyzeEmail;
