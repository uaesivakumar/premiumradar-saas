/**
 * Fingerprinting Tests
 *
 * S354: Action Fingerprinting
 * Behavior Contract B005: Duplicate actions detected via fingerprint
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

import { queryOne, query } from '@/lib/db/client';
import { fingerprintEngine, FingerprintEngine } from '@/lib/memory/fingerprint-engine';

describe('B005: Duplicate actions detected via fingerprint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateFingerprint', () => {
    it('generates consistent hash for same parameters', () => {
      const engine = new FingerprintEngine();

      const hash1 = engine.generateFingerprint('discovery', {
        vertical: 'banking',
        region: 'UAE',
        query: 'tech companies',
      });

      const hash2 = engine.generateFingerprint('discovery', {
        vertical: 'banking',
        region: 'UAE',
        query: 'tech companies',
      });

      expect(hash1).toBe(hash2);
    });

    it('generates different hash for different parameters', () => {
      const engine = new FingerprintEngine();

      const hash1 = engine.generateFingerprint('discovery', {
        vertical: 'banking',
        query: 'tech companies',
      });

      const hash2 = engine.generateFingerprint('discovery', {
        vertical: 'insurance',
        query: 'tech companies',
      });

      expect(hash1).not.toBe(hash2);
    });

    it('generates same hash regardless of parameter order', () => {
      const engine = new FingerprintEngine();

      const hash1 = engine.generateFingerprint('discovery', {
        vertical: 'banking',
        region: 'UAE',
        query: 'tech',
      });

      const hash2 = engine.generateFingerprint('discovery', {
        query: 'tech',
        vertical: 'banking',
        region: 'UAE',
      });

      expect(hash1).toBe(hash2);
    });
  });

  describe('checkAndRecord', () => {
    it('detects duplicate action within window', async () => {
      const existingAction = {
        id: 'action-123',
        created_at: new Date(),
        action_metadata: { query: 'tech companies' },
      };

      vi.mocked(queryOne).mockResolvedValue(existingAction);

      const result = await fingerprintEngine.checkAndRecord({
        tenantId: 'tenant-1',
        userId: 'user-1',
        actionType: 'discovery',
        actionParams: { query: 'tech companies' },
      });

      expect(result.isDuplicate).toBe(true);
      expect(result.originalAction).toBeDefined();
      expect(result.originalAction?.id).toBe('action-123');
    });

    it('allows new action if no duplicate', async () => {
      vi.mocked(queryOne).mockResolvedValue(null);
      vi.mocked(query).mockResolvedValue([]);

      const result = await fingerprintEngine.checkAndRecord({
        tenantId: 'tenant-1',
        userId: 'user-1',
        actionType: 'discovery',
        actionParams: { query: 'new search' },
      });

      expect(result.isDuplicate).toBe(false);
      expect(result.originalAction).toBeUndefined();
    });

    it('records new action when not duplicate', async () => {
      vi.mocked(queryOne).mockResolvedValue(null);
      vi.mocked(query).mockResolvedValue([]);

      await fingerprintEngine.checkAndRecord({
        tenantId: 'tenant-1',
        userId: 'user-1',
        actionType: 'discovery',
        actionParams: { query: 'new search' },
        metadata: { displayQuery: 'New Search' },
      });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO action_fingerprints'),
        expect.any(Array)
      );
    });
  });
});
