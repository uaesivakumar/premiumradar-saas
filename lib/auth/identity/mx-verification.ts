/**
 * MX Verification - Sprint S48 Feature 9
 * Verify corporate email through MX record lookup
 *
 * This runs server-side only (API route)
 * Detects email provider (Google Workspace, Microsoft 365, etc.)
 */

import { MXVerificationResult } from './types';

// Common email provider MX patterns
const EMAIL_PROVIDERS: Record<string, string[]> = {
  'Google Workspace': [
    'aspmx.l.google.com',
    'alt1.aspmx.l.google.com',
    'alt2.aspmx.l.google.com',
    'googlemail.com',
  ],
  'Microsoft 365': [
    'outlook.com',
    'protection.outlook.com',
    'mail.protection.outlook.com',
  ],
  'Zoho': [
    'mx.zoho.com',
    'mx2.zoho.com',
  ],
  'Proofpoint': [
    'pphosted.com',
  ],
  'Mimecast': [
    'mimecast.com',
  ],
  'Barracuda': [
    'barracudanetworks.com',
  ],
};

/**
 * Detect email provider from MX records
 */
function detectProvider(mxRecords: string[]): string | null {
  for (const [provider, patterns] of Object.entries(EMAIL_PROVIDERS)) {
    for (const mx of mxRecords) {
      const lower = mx.toLowerCase();
      if (patterns.some(pattern => lower.includes(pattern))) {
        return provider;
      }
    }
  }
  return null;
}

/**
 * Verify MX records for a domain (server-side only)
 * This function should be called from an API route
 */
export async function verifyMXRecords(domain: string): Promise<MXVerificationResult> {
  if (!domain) {
    return {
      domain: '',
      hasMX: false,
      mxRecords: [],
      isValid: false,
      provider: null,
      verifiedAt: new Date().toISOString(),
    };
  }

  try {
    // Use DNS over HTTPS for MX lookup (works in server environment)
    const response = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`,
      {
        headers: {
          'Accept': 'application/dns-json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`DNS lookup failed: ${response.status}`);
    }

    const data = await response.json();
    const mxRecords: string[] = [];

    if (data.Answer) {
      for (const record of data.Answer) {
        if (record.type === 15) { // MX record type
          // MX data format: "priority hostname."
          const parts = record.data.split(' ');
          if (parts.length >= 2) {
            // Remove trailing dot from hostname
            mxRecords.push(parts[1].replace(/\.$/, ''));
          }
        }
      }
    }

    const hasMX = mxRecords.length > 0;
    const provider = hasMX ? detectProvider(mxRecords) : null;

    return {
      domain,
      hasMX,
      mxRecords,
      isValid: hasMX,
      provider,
      verifiedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[MX Verification] Error:', error);
    return {
      domain,
      hasMX: false,
      mxRecords: [],
      isValid: false,
      provider: null,
      verifiedAt: new Date().toISOString(),
    };
  }
}

/**
 * Check if domain has valid corporate email setup
 * - Has MX records
 * - Uses known business email provider
 */
export function isValidCorporateEmailDomain(result: MXVerificationResult): boolean {
  if (!result.hasMX) return false;

  // Having any MX record indicates email is configured
  // Provider detection is a bonus but not required
  return true;
}

/**
 * Get email security score based on MX analysis
 * Higher score = more trustworthy corporate email
 */
export function getEmailSecurityScore(result: MXVerificationResult): number {
  let score = 0;

  // Has MX records
  if (result.hasMX) score += 40;

  // Has multiple MX records (redundancy)
  if (result.mxRecords.length > 1) score += 20;

  // Uses known enterprise provider
  if (result.provider === 'Microsoft 365') score += 30;
  else if (result.provider === 'Google Workspace') score += 30;
  else if (result.provider) score += 20;

  // Uses security gateway (Proofpoint, Mimecast, etc.)
  const securityProviders = ['Proofpoint', 'Mimecast', 'Barracuda'];
  if (result.provider && securityProviders.includes(result.provider)) {
    score += 10;
  }

  return Math.min(100, score);
}

export default {
  verifyMXRecords,
  isValidCorporateEmailDomain,
  getEmailSecurityScore,
};
