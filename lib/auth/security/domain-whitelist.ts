/**
 * Domain Whitelist - Sprint S49
 * Enterprise domain/email whitelisting for access control
 *
 * Features:
 * - Allow/block specific domains
 * - SSO domain enforcement
 * - Subdomain matching
 * - Audit trail for changes
 */

import { DomainWhitelist, DomainEntry } from './types';

// In-memory store (use database in production)
const domainWhitelistStore = new Map<string, DomainWhitelist>();

// ============================================================
// DEFAULT CONFIGURATION
// ============================================================

const DEFAULT_DOMAIN_WHITELIST: DomainWhitelist = {
  tenantId: '',
  enabled: false,
  mode: 'allow',
  domains: [],
  enforceSSODomain: false,
};

// ============================================================
// DOMAIN WHITELIST MANAGEMENT
// ============================================================

/**
 * Get domain whitelist for a tenant
 */
export function getDomainWhitelist(tenantId: string): DomainWhitelist {
  return domainWhitelistStore.get(tenantId) || { ...DEFAULT_DOMAIN_WHITELIST, tenantId };
}

/**
 * Set domain whitelist for a tenant
 */
export function setDomainWhitelist(
  tenantId: string,
  config: Partial<DomainWhitelist>
): DomainWhitelist {
  const existing = getDomainWhitelist(tenantId);
  const updated = { ...existing, ...config, tenantId };
  domainWhitelistStore.set(tenantId, updated);
  return updated;
}

/**
 * Add domain to whitelist
 */
export function addDomain(
  tenantId: string,
  domain: string,
  addedBy: string,
  reason?: string
): DomainEntry {
  const whitelist = getDomainWhitelist(tenantId);

  // Check if already exists
  const existing = whitelist.domains.find(d => d.domain.toLowerCase() === domain.toLowerCase());
  if (existing) {
    return existing;
  }

  const entry: DomainEntry = {
    domain: domain.toLowerCase(),
    addedAt: new Date().toISOString(),
    addedBy,
    reason,
  };

  whitelist.domains.push(entry);
  domainWhitelistStore.set(tenantId, whitelist);

  return entry;
}

/**
 * Remove domain from whitelist
 */
export function removeDomain(tenantId: string, domain: string): boolean {
  const whitelist = getDomainWhitelist(tenantId);
  const initialLength = whitelist.domains.length;

  whitelist.domains = whitelist.domains.filter(
    d => d.domain.toLowerCase() !== domain.toLowerCase()
  );

  if (whitelist.domains.length !== initialLength) {
    domainWhitelistStore.set(tenantId, whitelist);
    return true;
  }

  return false;
}

/**
 * Check if email domain is allowed
 */
export function isDomainAllowed(tenantId: string, email: string): { allowed: boolean; reason?: string } {
  const whitelist = getDomainWhitelist(tenantId);

  // If whitelist is disabled, allow all
  if (!whitelist.enabled) {
    return { allowed: true };
  }

  // Extract domain from email
  const domain = extractDomain(email);
  if (!domain) {
    return { allowed: false, reason: 'Invalid email format' };
  }

  // Check against domain list
  const isInList = isMatchingDomain(domain, whitelist.domains);

  if (whitelist.mode === 'allow') {
    // Allow mode: only domains in list are allowed
    if (!isInList) {
      return {
        allowed: false,
        reason: `Domain '${domain}' is not in the allowed domains list`,
      };
    }
  } else {
    // Block mode: domains in list are blocked
    if (isInList) {
      return {
        allowed: false,
        reason: `Domain '${domain}' is blocked`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Check if user's domain matches SSO domain requirement
 */
export function checkSSODomainEnforcement(
  tenantId: string,
  email: string,
  ssoDomain?: string
): { compliant: boolean; reason?: string } {
  const whitelist = getDomainWhitelist(tenantId);

  if (!whitelist.enforceSSODomain || !ssoDomain) {
    return { compliant: true };
  }

  const userDomain = extractDomain(email);
  if (!userDomain) {
    return { compliant: false, reason: 'Invalid email format' };
  }

  // Check if user's domain matches SSO domain (including subdomains)
  if (userDomain === ssoDomain || userDomain.endsWith(`.${ssoDomain}`)) {
    return { compliant: true };
  }

  return {
    compliant: false,
    reason: `Email domain must match organization SSO domain (${ssoDomain})`,
  };
}

/**
 * Bulk add domains
 */
export function bulkAddDomains(
  tenantId: string,
  domains: string[],
  addedBy: string,
  reason?: string
): DomainEntry[] {
  const added: DomainEntry[] = [];

  for (const domain of domains) {
    const entry = addDomain(tenantId, domain, addedBy, reason);
    added.push(entry);
  }

  return added;
}

/**
 * Get all domains for a tenant
 */
export function listDomains(tenantId: string): DomainEntry[] {
  const whitelist = getDomainWhitelist(tenantId);
  return whitelist.domains;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Extract domain from email
 */
function extractDomain(email: string): string | null {
  if (!email || !email.includes('@')) return null;
  return email.split('@')[1]?.toLowerCase() || null;
}

/**
 * Check if domain matches any entry in the list
 * Supports wildcard subdomains (*.example.com)
 */
function isMatchingDomain(domain: string, entries: DomainEntry[]): boolean {
  const lower = domain.toLowerCase();

  for (const entry of entries) {
    const entryDomain = entry.domain.toLowerCase();

    // Exact match
    if (lower === entryDomain) {
      return true;
    }

    // Wildcard subdomain match (*.example.com)
    if (entryDomain.startsWith('*.')) {
      const baseDomain = entryDomain.substring(2);
      if (lower === baseDomain || lower.endsWith(`.${baseDomain}`)) {
        return true;
      }
    }

    // Parent domain match (example.com matches sub.example.com)
    if (lower.endsWith(`.${entryDomain}`)) {
      return true;
    }
  }

  return false;
}

/**
 * Validate domain format
 */
export function isValidDomain(domain: string): boolean {
  // Allow wildcards
  const cleanDomain = domain.startsWith('*.') ? domain.substring(2) : domain;

  // Basic domain validation
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/;
  return domainRegex.test(cleanDomain);
}

export default {
  getDomainWhitelist,
  setDomainWhitelist,
  addDomain,
  removeDomain,
  isDomainAllowed,
  checkSSODomainEnforcement,
  bulkAddDomains,
  listDomains,
  isValidDomain,
};
