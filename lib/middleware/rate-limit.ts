/**
 * Rate Limit Middleware
 *
 * S351: Rate Limiting Enforcement
 * Behavior Contract B002: Rate limiting enforced via Redis
 *
 * Provides rate limiting middleware for API routes.
 * Uses in-memory store for now (Redis upgrade planned for production scale).
 *
 * Usage:
 * ```typescript
 * import { enforceRateLimit, OS_RATE_LIMITS } from '@/lib/middleware/rate-limit';
 *
 * export async function POST(request: NextRequest) {
 *   const rateLimit = enforceRateLimit(request, OS_RATE_LIMITS.discovery);
 *   if (!rateLimit.allowed) return rateLimit.response;
 *   // ... handler code
 * }
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { logger } from '@/lib/logging/structured-logger';

export interface RateLimitRule {
  endpoint: string;
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: true;
  remaining: number;
  resetAt: Date;
  headers: Record<string, string>;
}

export interface RateLimitDenied {
  allowed: false;
  response: NextResponse;
}

export type RateLimitOutput = RateLimitResult | RateLimitDenied;

// In-memory store (will be replaced by Redis for production scale)
interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every minute
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      // Remove entries older than 1 hour
      if (now - entry.windowStart > 3600000) {
        rateLimitStore.delete(key);
      }
    }
  }, 60000);
}

/**
 * OS API Rate Limits
 * Behavior Contract B002: 10 requests per minute for expensive endpoints
 */
export const OS_RATE_LIMITS = {
  // Discovery is expensive (calls external APIs)
  discovery: {
    endpoint: '/api/os/discovery',
    windowMs: 60000, // 1 minute
    maxRequests: 10,
  },
  // Score calls LLM
  score: {
    endpoint: '/api/os/score',
    windowMs: 60000, // 1 minute
    maxRequests: 20,
  },
  // Outreach calls LLM
  outreach: {
    endpoint: '/api/os/outreach',
    windowMs: 60000, // 1 minute
    maxRequests: 15,
  },
  // Pipeline is orchestration endpoint
  pipeline: {
    endpoint: '/api/os/pipeline',
    windowMs: 60000, // 1 minute
    maxRequests: 5,
  },
  // SIVA is expensive (LLM calls)
  siva: {
    endpoint: '/api/os/siva',
    windowMs: 60000, // 1 minute
    maxRequests: 10,
  },
  // Default for other OS endpoints
  default: {
    endpoint: '/api/os/*',
    windowMs: 60000, // 1 minute
    maxRequests: 30,
  },
};

/**
 * Get rate limit key for a request
 */
function getRateLimitKey(tenantId: string, endpoint: string): string {
  return `ratelimit:${tenantId}:${endpoint}`;
}

/**
 * Check rate limit without consuming a token
 */
export function checkRateLimit(
  tenantId: string,
  rule: RateLimitRule
): { remaining: number; resetAt: Date; isLimited: boolean } {
  const key = getRateLimitKey(tenantId, rule.endpoint);
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  // No entry or window expired
  if (!entry || now - entry.windowStart > rule.windowMs) {
    return {
      remaining: rule.maxRequests,
      resetAt: new Date(now + rule.windowMs),
      isLimited: false,
    };
  }

  const remaining = Math.max(0, rule.maxRequests - entry.count);
  return {
    remaining,
    resetAt: new Date(entry.windowStart + rule.windowMs),
    isLimited: remaining === 0,
  };
}

/**
 * Consume a rate limit token
 */
function consumeRateLimitToken(tenantId: string, rule: RateLimitRule): {
  remaining: number;
  resetAt: Date;
} {
  const key = getRateLimitKey(tenantId, rule.endpoint);
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // No entry or window expired - start fresh
  if (!entry || now - entry.windowStart > rule.windowMs) {
    entry = { count: 1, windowStart: now };
    rateLimitStore.set(key, entry);
    return {
      remaining: rule.maxRequests - 1,
      resetAt: new Date(now + rule.windowMs),
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    remaining: Math.max(0, rule.maxRequests - entry.count),
    resetAt: new Date(entry.windowStart + rule.windowMs),
  };
}

/**
 * Get rate limit headers
 */
function getRateLimitHeaders(
  limit: number,
  remaining: number,
  resetAt: Date
): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.floor(resetAt.getTime() / 1000)),
  };
}

/**
 * Enforce rate limit on a request
 *
 * @param request - The Next.js request object
 * @param rule - The rate limit rule to apply
 * @returns RateLimitOutput - either allowed with remaining count, or denied with response
 */
export async function enforceRateLimit(
  request: NextRequest,
  rule: RateLimitRule
): Promise<RateLimitOutput> {
  // Get tenant ID from session (fallback to IP for unauthenticated requests)
  const session = await getServerSession();
  const tenantId = session?.tenantId || getClientIP(request) || 'anonymous';

  // Check if already rate limited
  const status = checkRateLimit(tenantId, rule);

  if (status.isLimited) {
    const retryAfter = Math.ceil((status.resetAt.getTime() - Date.now()) / 1000);

    logger.warn('Rate limit exceeded', {
      tenant_id: tenantId,
      endpoint: rule.endpoint,
      reset_at: status.resetAt.toISOString(),
    });

    return {
      allowed: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          retry_after: retryAfter,
        },
        {
          status: 429,
          headers: {
            ...getRateLimitHeaders(rule.maxRequests, 0, status.resetAt),
            'Retry-After': String(retryAfter),
          },
        }
      ),
    };
  }

  // Consume a token
  const newStatus = consumeRateLimitToken(tenantId, rule);

  return {
    allowed: true,
    remaining: newStatus.remaining,
    resetAt: newStatus.resetAt,
    headers: getRateLimitHeaders(rule.maxRequests, newStatus.remaining, newStatus.resetAt),
  };
}

/**
 * Get client IP from request
 */
function getClientIP(request: NextRequest): string | null {
  // Check X-Forwarded-For header (common for proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // Check X-Real-IP header
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Cloud Run specific
  const clientIP = request.headers.get('x-client-ip');
  if (clientIP) {
    return clientIP;
  }

  return null;
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  Object.entries(result.headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
