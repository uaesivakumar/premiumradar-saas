/**
 * Individual Intake Tests
 *
 * S365-S367: Individual Lead Intake
 * Behavior Contracts:
 * - B015: Individual lead intake with dedup
 * - B016: Intake validates before save
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

vi.mock('@/lib/memory/fingerprint-engine', () => ({
  fingerprintEngine: {
    generateFingerprint: vi.fn().mockReturnValue('test-fingerprint'),
    checkAndRecord: vi.fn().mockResolvedValue({ isDuplicate: false }),
  },
}));

import { query } from '@/lib/db/client';
import {
  individualIntake,
  validateLeadInput,
} from '@/lib/workspace/individual-intake';

describe('B015: Individual lead intake with dedup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('intakeLead', () => {
    it('creates lead when no duplicates', async () => {
      // No duplicates found
      vi.mocked(query)
        .mockResolvedValueOnce([]) // Exact match check
        .mockResolvedValueOnce([]) // Fuzzy match check
        .mockResolvedValueOnce([{ id: 'new-lead-123' }]) // Insert
        .mockResolvedValue([] as never); // Fingerprint record

      const result = await individualIntake.intakeLead('tenant-1', 'user-1', {
        companyName: 'New Company',
        contactEmail: 'contact@newcompany.com',
      });

      expect(result.success).toBe(true);
      expect(result.leadId).toBe('new-lead-123');
      expect(result.isDuplicate).toBe(false);
    });

    it('rejects exact duplicates', async () => {
      // Exact duplicate found
      vi.mocked(query).mockResolvedValueOnce([
        {
          id: 'existing-lead',
          company_name: 'Existing Corp',
          status: 'new',
          user_id: 'user-1',
          created_at: new Date(),
        },
      ]);

      const result = await individualIntake.intakeLead('tenant-1', 'user-1', {
        companyName: 'New Company',
        companyDomain: 'existing.com',
      });

      expect(result.success).toBe(false);
      expect(result.isDuplicate).toBe(true);
      expect(result.duplicateInfo?.existingLead).toBeDefined();
    });

    it('allows skipping duplicate check', async () => {
      vi.mocked(query)
        .mockResolvedValueOnce([{ id: 'new-lead-456' }]) // Insert
        .mockResolvedValue([] as never);

      const result = await individualIntake.intakeLead(
        'tenant-1',
        'user-1',
        { companyName: 'Test Corp' },
        { skipDuplicateCheck: true }
      );

      expect(result.success).toBe(true);
    });
  });

  describe('checkForDuplicates', () => {
    it('detects exact domain match', async () => {
      vi.mocked(query).mockResolvedValueOnce([
        {
          id: 'match-1',
          company_name: 'Existing Corp',
          status: 'contacted',
          user_id: 'user-1',
          created_at: new Date(),
        },
      ]);

      const result = await individualIntake.checkForDuplicates('tenant-1', {
        companyName: 'New Corp',
        companyDomain: 'existing.com',
      });

      expect(result.isDuplicate).toBe(true);
      expect(result.matchType).toBe('exact');
    });

    it('detects fuzzy name match', async () => {
      vi.mocked(query)
        .mockResolvedValueOnce([]) // No exact match
        .mockResolvedValueOnce([
          {
            id: 'fuzzy-1',
            company_name: 'Acme Corporation',
            similarity: 0.9,
          },
        ]);

      const result = await individualIntake.checkForDuplicates('tenant-1', {
        companyName: 'Acme Corp',
      });

      expect(result.isDuplicate).toBe(true);
      expect(result.matchType).toBe('fuzzy');
    });

    it('returns similar leads below threshold', async () => {
      vi.mocked(query)
        .mockResolvedValueOnce([]) // No exact match
        .mockResolvedValueOnce([
          {
            id: 'similar-1',
            company_name: 'Acme Industries',
            similarity: 0.7,
          },
        ]);

      const result = await individualIntake.checkForDuplicates('tenant-1', {
        companyName: 'Acme Corp',
      });

      expect(result.isDuplicate).toBe(false);
      expect(result.similarLeads?.length).toBe(1);
    });
  });

  describe('intakeBatch', () => {
    it('processes multiple leads', async () => {
      vi.mocked(query)
        .mockResolvedValueOnce([]).mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 'lead-1' }])
        .mockResolvedValue([] as never);

      const result = await individualIntake.intakeBatch('tenant-1', 'user-1', [
        { companyName: 'Company A' },
        { companyName: 'Company B' },
      ]);

      expect(result.success + result.failed + result.duplicates).toBe(2);
    });
  });
});

describe('B016: Intake validates before save', () => {
  describe('validateLeadInput', () => {
    it('requires company name', () => {
      const result = validateLeadInput({
        companyName: '',
        contactEmail: 'test@test.com',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Company name is required');
    });

    it('validates email format', () => {
      const result = validateLeadInput({
        companyName: 'Test Corp',
        contactEmail: 'invalid-email',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('accepts valid input', () => {
      const result = validateLeadInput({
        companyName: 'Test Corp',
        contactEmail: 'valid@test.com',
        companyDomain: 'test.com',
      });

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('normalizes data', () => {
      const result = validateLeadInput({
        companyName: '  Test Corp  ',
        contactEmail: 'TEST@Test.COM',
        companyDomain: 'https://www.test.com/page',
      });

      expect(result.normalizedData.companyName).toBe('Test Corp');
      expect(result.normalizedData.contactEmail).toBe('test@test.com');
      expect(result.normalizedData.companyDomain).toBe('test.com');
    });

    it('infers domain from email', () => {
      const result = validateLeadInput({
        companyName: 'Test Corp',
        contactEmail: 'contact@corporate.com',
      });

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.normalizedData.companyDomain).toBe('corporate.com');
    });

    it('does not infer domain from personal email', () => {
      const result = validateLeadInput({
        companyName: 'Test Corp',
        contactEmail: 'contact@gmail.com',
      });

      expect(result.normalizedData.companyDomain).toBeUndefined();
    });
  });
});
