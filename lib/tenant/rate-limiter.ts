/**
 * Tenant Rate Limiter
 *
 * Per-tenant rate limiting with sliding window algorithm.
 */

import type { RateLimitConfig, RateLimitRule, RateLimitStatus } from './types';
import { getTenantContext } from './tenant-context';

// ============================================================
// DEFAULT RATE LIMITS
// ============================================================

export const DEFAULT_RATE_LIMITS: RateLimitRule[] = [
  // API endpoints
  { endpoint: '/api/discovery/*', windowMs: 60000, maxRequests: 100, skipFailedRequests: true },
  { endpoint: '/api/outreach/*', windowMs: 60000, maxRequests: 50, skipFailedRequests: false },
  { endpoint: '/api/analytics/*', windowMs: 60000, maxRequests: 200, skipFailedRequests: true },
  { endpoint: '/api/export/*', windowMs: 3600000, maxRequests: 10, skipFailedRequests: false },

  // Search endpoints
  { endpoint: '/api/search', windowMs: 60000, maxRequests: 30, skipFailedRequests: true },

  // Bulk operations
  { endpoint: '/api/bulk/*', windowMs: 3600000, maxRequests: 5, skipFailedRequests: false },
];

// Plan-based rate limit multipliers
const PLAN_MULTIPLIERS: Record<string, number> = {
  free: 0.5,
  starter: 1,
  professional: 2,
  enterprise: 5,
};

// ============================================================
// RATE LIMIT STORE (In-memory for demo)
// ============================================================

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Generate rate limit key
 */
function getRateLimitKey(tenantId: string, endpoint: string): string {
  return `${tenantId}:${endpoint}`;
}

/**
 * Match endpoint pattern
 */
function matchEndpoint(pattern: string, endpoint: string): boolean {
  // Convert glob pattern to regex
  const regexPattern = pattern
    .replace(/\*/g, '.*')
    .replace(/\//g, '\\/');
  return new RegExp(`^${regexPattern}$`).test(endpoint);
}

/**
 * Find matching rate limit rule
 */
function findMatchingRule(
  endpoint: string,
  rules: RateLimitRule[] = DEFAULT_RATE_LIMITS
): RateLimitRule | null {
  for (const rule of rules) {
    if (matchEndpoint(rule.endpoint, endpoint)) {
      return rule;
    }
  }
  return null;
}

// ============================================================
// RATE LIMITING
// ============================================================

/**
 * Check if request should be rate limited
 */
export function checkRateLimit(
  endpoint: string,
  config?: Partial<RateLimitConfig>
): RateLimitStatus {
  const context = getTenantContext();
  const tenantId = context?.tenantId || 'anonymous';

  const rule = findMatchingRule(endpoint);
  if (!rule) {
    // No rate limit for this endpoint
    return {
      tenantId,
      endpoint,
      remaining: Infinity,
      resetAt: new Date(),
      isLimited: false,
    };
  }

  // Apply plan multiplier
  const multiplier = PLAN_MULTIPLIERS[config?.tenantId || 'starter'] || 1;
  const maxRequests = Math.floor(rule.maxRequests * multiplier);

  // Check burst allowance
  const effectiveMax = config?.burstAllowed
    ? maxRequests * (config.burstMultiplier || 1.5)
    : maxRequests;

  const key = getRateLimitKey(tenantId, rule.endpoint);
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // Check if window has expired
  if (!entry || now - entry.windowStart > rule.windowMs) {
    entry = { count: 0, windowStart: now };
    rateLimitStore.set(key, entry);
  }

  const remaining = Math.max(0, effectiveMax - entry.count);
  const resetAt = new Date(entry.windowStart + rule.windowMs);

  return {
    tenantId,
    endpoint,
    remaining,
    resetAt,
    isLimited: remaining === 0,
  };
}

/**
 * Consume a rate limit token
 */
export function consumeRateLimit(endpoint: string, success: boolean = true): RateLimitStatus {
  const context = getTenantContext();
  const tenantId = context?.tenantId || 'anonymous';

  const rule = findMatchingRule(endpoint);
  if (!rule) {
    return {
      tenantId,
      endpoint,
      remaining: Infinity,
      resetAt: new Date(),
      isLimited: false,
    };
  }

  // Skip failed requests if configured
  if (!success && rule.skipFailedRequests) {
    return checkRateLimit(endpoint);
  }

  const key = getRateLimitKey(tenantId, rule.endpoint);
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  if (!entry || now - entry.windowStart > rule.windowMs) {
    entry = { count: 1, windowStart: now };
  } else {
    entry.count++;
  }

  rateLimitStore.set(key, entry);

  return checkRateLimit(endpoint);
}

/**
 * Get rate limit headers for HTTP response
 */
export function getRateLimitHeaders(status: RateLimitStatus): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(status.remaining === Infinity ? 'unlimited' : status.remaining),
    'X-RateLimit-Remaining': String(status.remaining),
    'X-RateLimit-Reset': String(Math.floor(status.resetAt.getTime() / 1000)),
  };
}

/**
 * Reset rate limits for a tenant (admin function)
 */
export function resetTenantRateLimits(tenantId: string): void {
  const keysToDelete: string[] = [];

  for (const key of rateLimitStore.keys()) {
    if (key.startsWith(`${tenantId}:`)) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach((key) => rateLimitStore.delete(key));
}

/**
 * Get rate limit status for all endpoints
 */
export function getAllRateLimitStatus(): RateLimitStatus[] {
  const context = getTenantContext();
  if (!context) return [];

  return DEFAULT_RATE_LIMITS.map((rule) => checkRateLimit(rule.endpoint));
}

// ============================================================
// RATE LIMIT MIDDLEWARE HELPER
// ============================================================

export interface RateLimitMiddlewareResult {
  allowed: boolean;
  status: RateLimitStatus;
  headers: Record<string, string>;
}

/**
 * Middleware helper for rate limiting
 */
export function rateLimitMiddleware(endpoint: string): RateLimitMiddlewareResult {
  const status = checkRateLimit(endpoint);

  if (status.isLimited) {
    return {
      allowed: false,
      status,
      headers: {
        ...getRateLimitHeaders(status),
        'Retry-After': String(Math.ceil((status.resetAt.getTime() - Date.now()) / 1000)),
      },
    };
  }

  // Consume a token
  const newStatus = consumeRateLimit(endpoint);

  return {
    allowed: true,
    status: newStatus,
    headers: getRateLimitHeaders(newStatus),
  };
}
