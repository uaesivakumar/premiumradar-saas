/**
 * IP Allowlist - Sprint S49
 * Enterprise IP-based access control
 *
 * Features:
 * - IPv4/IPv6 support
 * - CIDR range matching
 * - Admin bypass option
 * - Expiring entries
 */

import { IPAllowlist, IPEntry } from './types';

// In-memory store (use database in production)
const ipAllowlistStore = new Map<string, IPAllowlist>();

// ============================================================
// DEFAULT CONFIGURATION
// ============================================================

const DEFAULT_IP_ALLOWLIST: IPAllowlist = {
  tenantId: '',
  enabled: false,
  mode: 'allow',
  entries: [],
  bypassForAdmins: true,
};

// ============================================================
// IP ALLOWLIST MANAGEMENT
// ============================================================

/**
 * Get IP allowlist for a tenant
 */
export function getIPAllowlist(tenantId: string): IPAllowlist {
  return ipAllowlistStore.get(tenantId) || { ...DEFAULT_IP_ALLOWLIST, tenantId };
}

/**
 * Set IP allowlist configuration
 */
export function setIPAllowlist(tenantId: string, config: Partial<IPAllowlist>): IPAllowlist {
  const existing = getIPAllowlist(tenantId);
  const updated = { ...existing, ...config, tenantId };
  ipAllowlistStore.set(tenantId, updated);
  return updated;
}

/**
 * Add IP to allowlist
 */
export function addIP(
  tenantId: string,
  ip: string,
  addedBy: string,
  options?: {
    label?: string;
    expiresAt?: string;
  }
): IPEntry | null {
  const allowlist = getIPAllowlist(tenantId);

  // Detect IP type
  const type = detectIPType(ip);
  if (!type) {
    return null; // Invalid IP
  }

  // Check if already exists
  const existing = allowlist.entries.find(e => e.ip === ip);
  if (existing) {
    return existing;
  }

  const entry: IPEntry = {
    ip,
    type,
    label: options?.label,
    addedAt: new Date().toISOString(),
    addedBy,
    expiresAt: options?.expiresAt,
  };

  allowlist.entries.push(entry);
  ipAllowlistStore.set(tenantId, allowlist);

  return entry;
}

/**
 * Remove IP from allowlist
 */
export function removeIP(tenantId: string, ip: string): boolean {
  const allowlist = getIPAllowlist(tenantId);
  const initialLength = allowlist.entries.length;

  allowlist.entries = allowlist.entries.filter(e => e.ip !== ip);

  if (allowlist.entries.length !== initialLength) {
    ipAllowlistStore.set(tenantId, allowlist);
    return true;
  }

  return false;
}

/**
 * Check if IP is allowed
 */
export function isIPAllowed(
  tenantId: string,
  ip: string,
  isAdmin: boolean = false
): { allowed: boolean; reason?: string } {
  const allowlist = getIPAllowlist(tenantId);

  // If allowlist is disabled, allow all
  if (!allowlist.enabled) {
    return { allowed: true };
  }

  // Admin bypass
  if (isAdmin && allowlist.bypassForAdmins) {
    return { allowed: true };
  }

  // Clean expired entries
  cleanExpiredEntries(tenantId);

  // Check if IP matches any entry
  const isMatch = allowlist.entries.some(entry => matchIP(ip, entry));

  if (allowlist.mode === 'allow') {
    // Allow mode: only IPs in list are allowed
    if (!isMatch) {
      return {
        allowed: false,
        reason: 'IP address is not in the allowed list',
      };
    }
  } else {
    // Block mode: IPs in list are blocked
    if (isMatch) {
      return {
        allowed: false,
        reason: 'IP address is blocked',
      };
    }
  }

  return { allowed: true };
}

/**
 * Get all IP entries for a tenant
 */
export function listIPs(tenantId: string): IPEntry[] {
  const allowlist = getIPAllowlist(tenantId);
  return allowlist.entries;
}

/**
 * Bulk add IPs
 */
export function bulkAddIPs(
  tenantId: string,
  ips: string[],
  addedBy: string,
  options?: {
    label?: string;
    expiresAt?: string;
  }
): IPEntry[] {
  const added: IPEntry[] = [];

  for (const ip of ips) {
    const entry = addIP(tenantId, ip, addedBy, options);
    if (entry) {
      added.push(entry);
    }
  }

  return added;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Detect IP type (IPv4, IPv6, or CIDR)
 */
function detectIPType(ip: string): 'ipv4' | 'ipv6' | 'cidr' | null {
  // CIDR notation
  if (ip.includes('/')) {
    const [address, prefix] = ip.split('/');
    const prefixNum = parseInt(prefix, 10);

    if (isIPv4(address) && prefixNum >= 0 && prefixNum <= 32) {
      return 'cidr';
    }
    if (isIPv6(address) && prefixNum >= 0 && prefixNum <= 128) {
      return 'cidr';
    }
    return null;
  }

  if (isIPv4(ip)) return 'ipv4';
  if (isIPv6(ip)) return 'ipv6';

  return null;
}

/**
 * Check if string is valid IPv4
 */
function isIPv4(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;

  return parts.every(part => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
  });
}

/**
 * Check if string is valid IPv6
 */
function isIPv6(ip: string): boolean {
  // Simplified IPv6 validation
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  return ipv6Regex.test(ip) || ip === '::1' || ip === '::';
}

/**
 * Check if an IP matches an entry (exact or CIDR)
 */
function matchIP(ip: string, entry: IPEntry): boolean {
  // Exact match
  if (ip === entry.ip) {
    return true;
  }

  // CIDR match
  if (entry.type === 'cidr') {
    return isIPInCIDR(ip, entry.ip);
  }

  return false;
}

/**
 * Check if IP is within CIDR range
 */
function isIPInCIDR(ip: string, cidr: string): boolean {
  const [range, prefixStr] = cidr.split('/');
  const prefix = parseInt(prefixStr, 10);

  // Only handle IPv4 CIDR for simplicity
  if (!isIPv4(ip) || !isIPv4(range)) {
    return false;
  }

  const ipNum = ipv4ToNumber(ip);
  const rangeNum = ipv4ToNumber(range);
  const mask = ~(2 ** (32 - prefix) - 1);

  return (ipNum & mask) === (rangeNum & mask);
}

/**
 * Convert IPv4 to number
 */
function ipv4ToNumber(ip: string): number {
  const parts = ip.split('.').map(p => parseInt(p, 10));
  return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

/**
 * Remove expired entries
 */
function cleanExpiredEntries(tenantId: string): void {
  const allowlist = getIPAllowlist(tenantId);
  const now = new Date().toISOString();

  const cleaned = allowlist.entries.filter(
    entry => !entry.expiresAt || entry.expiresAt > now
  );

  if (cleaned.length !== allowlist.entries.length) {
    allowlist.entries = cleaned;
    ipAllowlistStore.set(tenantId, allowlist);
  }
}

/**
 * Validate IP format
 */
export function isValidIP(ip: string): boolean {
  return detectIPType(ip) !== null;
}

/**
 * Get current client IP (for use in API routes)
 * NOTE: In production, use request headers (X-Forwarded-For, etc.)
 */
export function getClientIP(headers: { [key: string]: string | string[] | undefined }): string | null {
  // Check common proxy headers
  const forwardedFor = headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0];
    return ips.trim();
  }

  const realIP = headers['x-real-ip'];
  if (realIP) {
    return Array.isArray(realIP) ? realIP[0] : realIP;
  }

  return null;
}

export default {
  getIPAllowlist,
  setIPAllowlist,
  addIP,
  removeIP,
  isIPAllowed,
  listIPs,
  bulkAddIPs,
  isValidIP,
  getClientIP,
};
