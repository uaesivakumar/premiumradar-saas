/**
 * Decay Engine Tests
 *
 * S358: Decay Engine
 * Behavior Contract B009: Stale data automatically decays
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

vi.mock('@/lib/memory/persistent-store', () => ({
  memoryStore: {
    get: vi.fn(),
    set: vi.fn(),
  },
  MemoryKeys: {
    enrichment: vi.fn(),
  },
  MemoryTTL: {
    ENRICHMENT: 604800,
  },
}));

vi.mock('@/lib/intelligence/confidence-engine', () => ({
  confidenceEngine: {
    getOrCreateConfidence: vi.fn(),
    updateConfidence: vi.fn(),
  },
  CONFIDENCE_CONFIG: {
    minConfidence: 0.1,
    maxConfidence: 0.95,
    initialConfidence: 0.5,
  },
}));

import { query, queryOne } from '@/lib/db/client';
import { decayEngine, DECAY_CONFIG } from '@/lib/memory/decay-engine';

describe('B009: Stale data automatically decays', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateDecay', () => {
    it('does not decay within grace period', () => {
      const result = decayEngine.calculateDecay(0.8, 'COMPANY', 2);
      expect(result).toBe(0.8);
    });

    it('applies decay after grace period', () => {
      const result = decayEngine.calculateDecay(
        0.8,
        'COMPANY',
        DECAY_CONFIG.gracePeriodDays + 10
      );
      expect(result).toBeLessThan(0.8);
    });

    it('respects minimum confidence floor', () => {
      const result = decayEngine.calculateDecay(0.15, 'COMPANY', 100);
      expect(result).toBeGreaterThanOrEqual(0.1);
    });

    it('applies different decay rates per entity type', () => {
      const companyDecay = decayEngine.calculateDecay(0.8, 'COMPANY', 10);
      const signalDecay = decayEngine.calculateDecay(0.8, 'SIGNAL', 10);

      // Signal should decay faster than company
      expect(signalDecay).toBeLessThan(companyDecay);
    });

    it('MODEL_PREDICTION decays fastest', () => {
      const companyDecay = decayEngine.calculateDecay(0.8, 'COMPANY', 10);
      const predictionDecay = decayEngine.calculateDecay(0.8, 'MODEL_PREDICTION', 10);

      expect(predictionDecay).toBeLessThan(companyDecay);
    });
  });

  describe('applyDecay', () => {
    it('processes stale entities', async () => {
      vi.mocked(query).mockResolvedValueOnce([
        {
          id: 'conf-1',
          entity_type: 'COMPANY',
          entity_id: 'company-1',
          confidence_score: 0.7,
          last_feedback_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      ]).mockResolvedValue([] as never);

      const result = await decayEngine.applyDecay('tenant-1');

      expect(result.processed).toBe(1);
      expect(result.errors).toBe(0);
    });

    it('handles empty result set', async () => {
      vi.mocked(query).mockResolvedValue([]);

      const result = await decayEngine.applyDecay('tenant-1');

      expect(result.processed).toBe(0);
      expect(result.decayed).toBe(0);
    });
  });

  describe('getRefreshCandidates', () => {
    it('returns entities below refresh threshold', async () => {
      vi.mocked(query).mockResolvedValue([
        {
          id: 'conf-1',
          entity_type: 'COMPANY',
          entity_id: 'company-1',
          confidence_score: 0.2,
          last_feedback_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      const candidates = await decayEngine.getRefreshCandidates('tenant-1');

      expect(candidates.length).toBe(1);
      expect(candidates[0].confidenceScore).toBeLessThan(DECAY_CONFIG.refreshThreshold);
    });
  });

  describe('cleanupExpiredMemory', () => {
    it('deletes expired entries', async () => {
      vi.mocked(query).mockResolvedValue([{ count: '5' }]);

      const deleted = await decayEngine.cleanupExpiredMemory('tenant-1');

      expect(deleted).toBe(5);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM memory_store'),
        ['tenant-1']
      );
    });
  });

  describe('getAdjustedTTL', () => {
    it('increases TTL for high confidence', () => {
      const baseTTL = 3600;
      const adjustedTTL = decayEngine.getAdjustedTTL(baseTTL, 0.9);

      expect(adjustedTTL).toBeGreaterThan(baseTTL);
    });

    it('decreases TTL for low confidence', () => {
      const baseTTL = 3600;
      const adjustedTTL = decayEngine.getAdjustedTTL(baseTTL, 0.3);

      expect(adjustedTTL).toBeLessThan(baseTTL);
    });

    it('keeps base TTL for medium confidence', () => {
      const baseTTL = 3600;
      const adjustedTTL = decayEngine.getAdjustedTTL(baseTTL, 0.6);

      expect(adjustedTTL).toBe(baseTTL);
    });
  });

  describe('getDecayStats', () => {
    it('returns aggregated statistics', async () => {
      vi.mocked(queryOne)
        .mockResolvedValueOnce({
          total: '100',
          stale: '15',
          refresh: '5',
          avg_confidence: 0.65,
        })
        .mockResolvedValueOnce({ count: '3' });

      const stats = await decayEngine.getDecayStats('tenant-1');

      expect(stats.totalEntities).toBe(100);
      expect(stats.staleEntities).toBe(15);
      expect(stats.refreshCandidates).toBe(5);
      expect(stats.averageConfidence).toBe(0.65);
      expect(stats.decayedToday).toBe(3);
    });
  });

  describe('decay configuration', () => {
    it('has reasonable decay rates', () => {
      // All decay rates should be small positive numbers
      Object.values(DECAY_CONFIG.decayRates).forEach(rate => {
        expect(rate).toBeGreaterThan(0);
        expect(rate).toBeLessThan(0.1); // Max 10% per day
      });
    });

    it('has grace period of at least 1 day', () => {
      expect(DECAY_CONFIG.gracePeriodDays).toBeGreaterThanOrEqual(1);
    });

    it('stale threshold is above refresh threshold', () => {
      expect(DECAY_CONFIG.staleThreshold).toBeGreaterThan(DECAY_CONFIG.refreshThreshold);
    });
  });
});
