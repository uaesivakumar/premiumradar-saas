/**
 * Domain Extractor - Sprint S48 Feature 1
 * Extract company information from email domain
 *
 * Flow: email → domain → company name extraction
 * Uses heuristics + optional OS enrichment
 */

import { DomainInfo, PERSONAL_EMAIL_DOMAINS } from './types';

/**
 * Extract domain from email address
 */
export function extractDomain(email: string): string | null {
  if (!email || typeof email !== 'string') return null;

  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf('@');

  if (atIndex === -1 || atIndex === trimmed.length - 1) return null;

  return trimmed.substring(atIndex + 1);
}

/**
 * Check if email domain is a personal email provider
 */
export function isPersonalEmailDomain(domain: string): boolean {
  if (!domain) return false;
  return PERSONAL_EMAIL_DOMAINS.includes(domain.toLowerCase() as typeof PERSONAL_EMAIL_DOMAINS[number]);
}

/**
 * Extract company name from domain using heuristics
 * Example: "acme-corp.com" → "Acme Corp"
 */
export function extractCompanyNameFromDomain(domain: string): string | null {
  if (!domain || isPersonalEmailDomain(domain)) return null;

  // Remove common TLDs
  const parts = domain.split('.');
  if (parts.length < 2) return null;

  // Get the main part (before TLD)
  let companyPart = parts[0];

  // Handle subdomains like mail.company.com
  if (parts.length > 2 && ['mail', 'email', 'smtp', 'mx', 'www'].includes(parts[0])) {
    companyPart = parts[1];
  }

  // Clean up and format
  const cleaned = companyPart
    .replace(/[-_]/g, ' ')  // Replace dashes/underscores with spaces
    .replace(/\d+/g, '')    // Remove numbers
    .trim();

  if (!cleaned) return null;

  // Title case
  return cleaned
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Detect common company suffixes (Inc, Ltd, LLC, etc.)
 */
export function hasCompanySuffix(name: string): boolean {
  const suffixes = ['inc', 'ltd', 'llc', 'corp', 'co', 'plc', 'gmbh', 'ag', 'sa', 'bv', 'nv'];
  const lower = name.toLowerCase();
  return suffixes.some(suffix => lower.endsWith(suffix) || lower.includes(` ${suffix}`));
}

/**
 * Main function: Extract complete domain info from email
 */
export function extractDomainInfo(email: string): DomainInfo {
  const domain = extractDomain(email);
  const isPersonal = domain ? isPersonalEmailDomain(domain) : true;
  const companyName = domain ? extractCompanyNameFromDomain(domain) : null;

  return {
    email: email.trim().toLowerCase(),
    domain: domain || '',
    isPersonalEmail: isPersonal,
    isCorporateEmail: !isPersonal && !!domain,
    companyName,
    extractedAt: new Date().toISOString(),
  };
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;

  // Basic email regex - RFC 5322 simplified
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Get domain category for analytics
 */
export type DomainCategory = 'personal' | 'corporate' | 'educational' | 'government' | 'unknown';

export function getDomainCategory(domain: string): DomainCategory {
  if (!domain) return 'unknown';

  const lower = domain.toLowerCase();

  // Personal email providers
  if (isPersonalEmailDomain(lower)) return 'personal';

  // Educational domains
  if (lower.endsWith('.edu') || lower.endsWith('.ac.uk') || lower.endsWith('.edu.au')) {
    return 'educational';
  }

  // Government domains
  if (lower.endsWith('.gov') || lower.endsWith('.gov.uk') || lower.endsWith('.gov.ae')) {
    return 'government';
  }

  // Default to corporate
  return 'corporate';
}

/**
 * Extract all email info for onboarding
 */
export interface EmailAnalysis extends DomainInfo {
  category: DomainCategory;
  isValid: boolean;
  needsEnrichment: boolean;
}

export function analyzeEmail(email: string): EmailAnalysis {
  const isValid = isValidEmail(email);
  const domainInfo = extractDomainInfo(email);
  const category = getDomainCategory(domainInfo.domain);

  return {
    ...domainInfo,
    category,
    isValid,
    // Corporate emails need enrichment to get industry
    needsEnrichment: category === 'corporate' && isValid,
  };
}

export default {
  extractDomain,
  extractDomainInfo,
  isPersonalEmailDomain,
  extractCompanyNameFromDomain,
  isValidEmail,
  getDomainCategory,
  analyzeEmail,
};
