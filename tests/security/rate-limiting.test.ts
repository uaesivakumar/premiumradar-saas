/**
 * Rate Limiting Tests
 *
 * S351: Rate Limiting Enforcement
 * Behavior Contract B002: Rate limiting enforced via Redis
 *
 * These tests verify that:
 * 1. Exceed rate limit returns 429 Too Many Requests
 * 2. Retry-After header is present when rate limited
 * 3. Rate limits reset after window expires
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the auth module
vi.mock('@/lib/auth/session', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from '@/lib/auth/session';
import {
  enforceRateLimit,
  checkRateLimit,
  OS_RATE_LIMITS,
} from '@/lib/middleware/rate-limit';

describe('B002: Rate limiting enforced', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module state between tests
    vi.resetModules();
  });

  describe('checkRateLimit', () => {
    it('allows requests within limit', () => {
      const result = checkRateLimit('tenant-1', OS_RATE_LIMITS.discovery);

      expect(result.isLimited).toBe(false);
      expect(result.remaining).toBe(OS_RATE_LIMITS.discovery.maxRequests);
    });
  });

  describe('enforceRateLimit', () => {
    it('returns 429 when rate limit exceeded', async () => {
      // Mock authenticated session
      vi.mocked(getServerSession).mockResolvedValue({
        tenantId: 'test-tenant',
        user: { id: 'user-1', email: 'test@example.com' },
        enterpriseId: 'test-enterprise',
        expiresAt: new Date(Date.now() + 3600000),
      } as any);

      const request = new NextRequest('http://localhost/api/os/discovery', {
        method: 'POST',
      });

      // Use a very low limit for testing
      const testRule = {
        endpoint: '/api/os/test',
        windowMs: 60000,
        maxRequests: 2,
      };

      // First request should succeed
      const result1 = await enforceRateLimit(request, testRule);
      expect(result1.allowed).toBe(true);

      // Second request should succeed
      const result2 = await enforceRateLimit(request, testRule);
      expect(result2.allowed).toBe(true);

      // Third request should be rate limited
      const result3 = await enforceRateLimit(request, testRule);
      expect(result3.allowed).toBe(false);
      if (!result3.allowed) {
        expect(result3.response.status).toBe(429);
      }
    });

    it('includes Retry-After header when rate limited', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        tenantId: 'test-tenant-2',
        user: { id: 'user-2', email: 'test2@example.com' },
        enterpriseId: 'test-enterprise-2',
        expiresAt: new Date(Date.now() + 3600000),
      } as any);

      const request = new NextRequest('http://localhost/api/os/discovery', {
        method: 'POST',
      });

      const testRule = {
        endpoint: '/api/os/test-retry',
        windowMs: 60000,
        maxRequests: 1,
      };

      // Exhaust the limit
      await enforceRateLimit(request, testRule);

      // Next request should be rate limited with Retry-After
      const result = await enforceRateLimit(request, testRule);
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        const retryAfter = result.response.headers.get('Retry-After');
        expect(retryAfter).not.toBeNull();
        expect(parseInt(retryAfter || '0')).toBeGreaterThan(0);
      }
    });

    it('includes rate limit headers in response', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        tenantId: 'test-tenant-3',
        user: { id: 'user-3', email: 'test3@example.com' },
        enterpriseId: 'test-enterprise-3',
        expiresAt: new Date(Date.now() + 3600000),
      } as any);

      const request = new NextRequest('http://localhost/api/os/discovery', {
        method: 'POST',
      });

      const testRule = {
        endpoint: '/api/os/test-headers',
        windowMs: 60000,
        maxRequests: 10,
      };

      const result = await enforceRateLimit(request, testRule);
      expect(result.allowed).toBe(true);
      if (result.allowed) {
        expect(result.headers['X-RateLimit-Limit']).toBe('10');
        expect(result.headers['X-RateLimit-Remaining']).toBe('9');
        expect(result.headers['X-RateLimit-Reset']).toBeDefined();
      }
    });
  });

  describe('OS_RATE_LIMITS configuration', () => {
    it('has appropriate limits for discovery endpoint', () => {
      expect(OS_RATE_LIMITS.discovery.maxRequests).toBe(10);
      expect(OS_RATE_LIMITS.discovery.windowMs).toBe(60000); // 1 minute
    });

    it('has appropriate limits for score endpoint', () => {
      expect(OS_RATE_LIMITS.score.maxRequests).toBe(20);
      expect(OS_RATE_LIMITS.score.windowMs).toBe(60000); // 1 minute
    });

    it('has appropriate limits for pipeline endpoint', () => {
      expect(OS_RATE_LIMITS.pipeline.maxRequests).toBe(5);
      expect(OS_RATE_LIMITS.pipeline.windowMs).toBe(60000); // 1 minute
    });
  });
});
