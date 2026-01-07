/**
 * Historical Recall Tests
 *
 * S355: Historical Action Recall
 * Behavior Contract B006: Historical recall advisory shown
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/db/client', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
}));

vi.mock('@/lib/logging/structured-logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { query } from '@/lib/db/client';
import { actionHistory } from '@/lib/memory/action-history';
import {
  stringSimilarity,
  domainSimilarity,
  calculateSimilarity,
  shouldWarn,
} from '@/lib/memory/similarity-detector';

describe('B006: Historical recall advisory shown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('actionHistory.findSimilar', () => {
    it('finds similar actions by company name', async () => {
      vi.mocked(query).mockResolvedValue([
        {
          id: 'action-1',
          action_type: 'enrichment',
          action_metadata: { companyName: 'Acme Corp' },
          created_at: new Date(Date.now() - 86400000), // 1 day ago
        },
      ]);

      const result = await actionHistory.findSimilar({
        tenantId: 'tenant-1',
        userId: 'user-1',
        actionType: 'enrichment',
        context: { companyName: 'Acme Corp' },
      });

      expect(result.hasSimilar).toBe(true);
      expect(result.similarActions.length).toBe(1);
      expect(result.advisory).toContain('yesterday');
    });

    it('generates appropriate advisory message', async () => {
      vi.mocked(query).mockResolvedValue([
        {
          id: 'action-1',
          action_type: 'enrichment',
          action_metadata: { companyName: 'Test Company' },
          created_at: new Date(Date.now() - 7 * 86400000), // 7 days ago
        },
      ]);

      const result = await actionHistory.findSimilar({
        tenantId: 'tenant-1',
        userId: 'user-1',
        actionType: 'enrichment',
        context: { companyName: 'Test Company' },
      });

      expect(result.advisory).toContain('7 days ago');
    });

    it('returns empty when no similar actions', async () => {
      vi.mocked(query).mockResolvedValue([]);

      const result = await actionHistory.findSimilar({
        tenantId: 'tenant-1',
        userId: 'user-1',
        actionType: 'enrichment',
        context: { companyName: 'New Company' },
      });

      expect(result.hasSimilar).toBe(false);
      expect(result.similarActions.length).toBe(0);
      expect(result.advisory).toBeUndefined();
    });
  });

  describe('similarity detection', () => {
    it('calculates string similarity correctly', () => {
      expect(stringSimilarity('hello world', 'hello world')).toBe(1);
      expect(stringSimilarity('hello world', 'hello earth')).toBeGreaterThan(0);
      expect(stringSimilarity('abc', 'xyz')).toBe(0);
    });

    it('calculates domain similarity correctly', () => {
      expect(domainSimilarity('example.com', 'example.com')).toBe(1);
      expect(domainSimilarity('www.example.com', 'example.com')).toBe(1);
      expect(domainSimilarity('sub.example.com', 'example.com')).toBe(0.8);
    });

    it('calculates overall similarity', () => {
      const current = {
        companyDomain: 'acme.com',
        companyName: 'Acme Corp',
      };

      const past = {
        companyDomain: 'acme.com',
        companyName: 'Acme Corporation',
      };

      const result = calculateSimilarity(current, past);
      expect(result.score).toBeGreaterThan(0.5);
      expect(result.matchedFields).toContain('companyDomain');
    });

    it('shouldWarn returns true for high similarity', () => {
      const current = { entityId: '123', companyDomain: 'test.com' };
      const past = { entityId: '123', companyDomain: 'test.com' };

      expect(shouldWarn(current, past)).toBe(true);
    });

    it('shouldWarn returns false for low similarity', () => {
      const current = { entityId: '123', companyDomain: 'foo.com' };
      const past = { entityId: '456', companyDomain: 'bar.com' };

      expect(shouldWarn(current, past)).toBe(false);
    });
  });
});
