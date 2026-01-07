/**
 * Confidence Engine Tests
 *
 * S357: Confidence Engine
 * Behavior Contract B008: Confidence score updated from feedback
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

import { query, queryOne } from '@/lib/db/client';
import {
  confidenceEngine,
  CONFIDENCE_CONFIG,
} from '@/lib/intelligence/confidence-engine';

describe('B008: Confidence score updated from feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrCreateConfidence', () => {
    it('returns existing confidence record', async () => {
      const mockRecord = {
        id: 'conf-1',
        tenant_id: 'tenant-1',
        entity_type: 'COMPANY',
        entity_id: 'company-1',
        confidence_score: 0.75,
        positive_signals: 5,
        negative_signals: 1,
        total_interactions: 6,
      };

      vi.mocked(queryOne).mockResolvedValue(mockRecord);

      const result = await confidenceEngine.getOrCreateConfidence(
        'tenant-1',
        'COMPANY',
        'company-1'
      );

      expect(result).toEqual(mockRecord);
      expect(queryOne).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM entity_confidence'),
        ['tenant-1', 'COMPANY', 'company-1']
      );
    });

    it('creates new record with initial confidence', async () => {
      vi.mocked(queryOne).mockResolvedValue(null);
      vi.mocked(query).mockResolvedValue([
        {
          id: 'conf-new',
          confidence_score: CONFIDENCE_CONFIG.initialConfidence,
        },
      ]);

      const result = await confidenceEngine.getOrCreateConfidence(
        'tenant-1',
        'COMPANY',
        'new-company'
      );

      expect(result.confidence_score).toBe(CONFIDENCE_CONFIG.initialConfidence);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO entity_confidence'),
        expect.any(Array)
      );
    });
  });

  describe('updateConfidence', () => {
    it('increases confidence for positive feedback', async () => {
      vi.mocked(queryOne).mockResolvedValue({
        id: 'conf-1',
        confidence_score: 0.5,
      });
      vi.mocked(query).mockResolvedValue([]);

      const result = await confidenceEngine.updateConfidence('tenant-1', {
        entityType: 'COMPANY',
        entityId: 'company-1',
        delta: 0.15,
        reason: 'LEAD_APPROVED',
      });

      expect(result.success).toBe(true);
      expect(result.newScore).toBeGreaterThan(result.previousScore);
    });

    it('decreases confidence for negative feedback', async () => {
      vi.mocked(queryOne).mockResolvedValue({
        id: 'conf-1',
        confidence_score: 0.6,
      });
      vi.mocked(query).mockResolvedValue([]);

      const result = await confidenceEngine.updateConfidence('tenant-1', {
        entityType: 'COMPANY',
        entityId: 'company-1',
        delta: -0.1,
        reason: 'LEAD_REJECTED',
      });

      expect(result.success).toBe(true);
      expect(result.newScore).toBeLessThan(result.previousScore);
    });

    it('respects minimum confidence floor', async () => {
      vi.mocked(queryOne).mockResolvedValue({
        id: 'conf-1',
        confidence_score: 0.15,
      });
      vi.mocked(query).mockResolvedValue([]);

      const result = await confidenceEngine.updateConfidence('tenant-1', {
        entityType: 'COMPANY',
        entityId: 'company-1',
        delta: -1.0, // Large negative delta
        reason: 'DEAL_LOST',
      });

      expect(result.newScore).toBeGreaterThanOrEqual(CONFIDENCE_CONFIG.minConfidence);
    });

    it('respects maximum confidence ceiling', async () => {
      vi.mocked(queryOne).mockResolvedValue({
        id: 'conf-1',
        confidence_score: 0.9,
      });
      vi.mocked(query).mockResolvedValue([]);

      const result = await confidenceEngine.updateConfidence('tenant-1', {
        entityType: 'COMPANY',
        entityId: 'company-1',
        delta: 1.0, // Large positive delta
        reason: 'DEAL_WON',
      });

      expect(result.newScore).toBeLessThanOrEqual(CONFIDENCE_CONFIG.maxConfidence);
    });

    it('logs update to confidence_history', async () => {
      vi.mocked(queryOne).mockResolvedValue({
        id: 'conf-1',
        confidence_score: 0.5,
      });
      vi.mocked(query).mockResolvedValue([]);

      await confidenceEngine.updateConfidence('tenant-1', {
        entityType: 'COMPANY',
        entityId: 'company-1',
        delta: 0.1,
        reason: 'Test reason',
        eventId: 'event-123',
      });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO confidence_history'),
        expect.arrayContaining(['Test reason'])
      );
    });
  });

  describe('getConfidence', () => {
    it('returns confidence score for existing entity', async () => {
      vi.mocked(queryOne).mockResolvedValue({ confidence_score: 0.8 });

      const score = await confidenceEngine.getConfidence(
        'tenant-1',
        'COMPANY',
        'company-1'
      );

      expect(score).toBe(0.8);
    });

    it('returns initial confidence for non-existent entity', async () => {
      vi.mocked(queryOne).mockResolvedValue(null);

      const score = await confidenceEngine.getConfidence(
        'tenant-1',
        'COMPANY',
        'unknown'
      );

      expect(score).toBe(CONFIDENCE_CONFIG.initialConfidence);
    });
  });

  describe('feedback weight configuration', () => {
    it('has correct weights for all feedback types', () => {
      // Positive feedback has positive weights
      expect(CONFIDENCE_CONFIG.feedbackWeights.LEAD_APPROVED).toBeGreaterThan(0);
      expect(CONFIDENCE_CONFIG.feedbackWeights.NBA_ACCEPTED).toBeGreaterThan(0);
      expect(CONFIDENCE_CONFIG.feedbackWeights.DEAL_WON).toBeGreaterThan(0);

      // Negative feedback has negative weights
      expect(CONFIDENCE_CONFIG.feedbackWeights.LEAD_REJECTED).toBeLessThan(0);
      expect(CONFIDENCE_CONFIG.feedbackWeights.NBA_DISMISSED).toBeLessThan(0);
      expect(CONFIDENCE_CONFIG.feedbackWeights.DEAL_LOST).toBeLessThan(0);

      // Deal outcomes have larger magnitude than simple feedback
      expect(Math.abs(CONFIDENCE_CONFIG.feedbackWeights.DEAL_WON)).toBeGreaterThan(
        Math.abs(CONFIDENCE_CONFIG.feedbackWeights.LEAD_APPROVED)
      );
    });
  });
});
