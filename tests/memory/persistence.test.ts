/**
 * Memory Persistence Tests
 *
 * S353: Persistent Memory Store
 * Behavior Contract B004: Memory survives server restart
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the database
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

import { query, queryOne } from '@/lib/db/client';
import { memoryStore, MemoryKeys, MemoryTTL } from '@/lib/memory/persistent-store';

describe('B004: Memory survives server restart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('memoryStore.get', () => {
    it('returns cached value if not expired', async () => {
      const mockValue = { enriched: true, source: 'apollo' };
      vi.mocked(queryOne).mockResolvedValue({
        store_value: mockValue,
        expires_at: new Date(Date.now() + 3600000),
      });

      const result = await memoryStore.get(
        'enrichment:apollo:123',
        { tenantId: 'tenant-1' }
      );

      expect(result).toEqual(mockValue);
      expect(queryOne).toHaveBeenCalledWith(
        expect.stringContaining('SELECT store_value'),
        ['tenant-1', 'enrichment:apollo:123']
      );
    });

    it('returns null for expired entries', async () => {
      vi.mocked(queryOne).mockResolvedValue(null);

      const result = await memoryStore.get(
        'enrichment:apollo:123',
        { tenantId: 'tenant-1' }
      );

      expect(result).toBeNull();
    });
  });

  describe('memoryStore.set', () => {
    it('stores value with TTL', async () => {
      vi.mocked(query).mockResolvedValue([]);

      const result = await memoryStore.set(
        'enrichment:apollo:123',
        { data: 'test' },
        3600,
        { tenantId: 'tenant-1' }
      );

      expect(result).toBe(true);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO memory_store'),
        expect.arrayContaining(['tenant-1', 'enrichment:apollo:123'])
      );
    });
  });

  describe('MemoryKeys helpers', () => {
    it('generates correct enrichment key', () => {
      const key = MemoryKeys.enrichment('apollo', 'company_123');
      expect(key).toBe('enrichment:apollo:company_123');
    });

    it('generates correct discovery key', () => {
      const key = MemoryKeys.discovery('tenant_1', 'hash_abc');
      expect(key).toBe('discovery:tenant_1:hash_abc');
    });

    it('generates correct pattern key', () => {
      const key = MemoryKeys.pattern('example.com');
      expect(key).toBe('pattern:email:example.com');
    });
  });

  describe('MemoryTTL constants', () => {
    it('has appropriate TTL values', () => {
      expect(MemoryTTL.ENRICHMENT).toBe(7 * 24 * 60 * 60); // 7 days
      expect(MemoryTTL.DISCOVERY).toBe(24 * 60 * 60);      // 24 hours
      expect(MemoryTTL.SCORE).toBe(12 * 60 * 60);          // 12 hours
      expect(MemoryTTL.PATTERN).toBe(30 * 24 * 60 * 60);   // 30 days
    });
  });
});
