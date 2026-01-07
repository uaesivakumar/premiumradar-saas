/**
 * Lead Distribution Tests
 *
 * S362-S364: Lead Distribution Engine
 * Behavior Contracts:
 * - B013: Leads distributed fairly with explanation
 * - B014: Distribution transparency shown
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
import {
  leadDistributor,
  DEFAULT_DISTRIBUTION_CONFIG,
} from '@/lib/workspace/lead-distributor';

describe('B013: Leads distributed fairly with explanation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('distributeLead', () => {
    const mockLead = {
      id: 'lead-1',
      companyId: 'company-1',
      companyName: 'Test Corp',
      region: 'UAE',
      vertical: 'banking',
      subVertical: 'employee_banking',
      score: 75,
    };

    it('assigns lead to best matching team member', async () => {
      vi.mocked(query)
        .mockResolvedValueOnce([
          {
            id: 'tm-1',
            user_id: 'user-1',
            name: 'John Doe',
            email: 'john@test.com',
            territories: ['UAE'],
            verticals: ['banking'],
            sub_verticals: ['employee_banking'],
            max_capacity: 50,
            current_load: 10,
            conversion_rate: 0.2,
            is_active: true,
            last_assigned_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
          {
            id: 'tm-2',
            user_id: 'user-2',
            name: 'Jane Smith',
            email: 'jane@test.com',
            territories: ['KSA'],
            verticals: ['banking'],
            sub_verticals: ['corporate_banking'],
            max_capacity: 50,
            current_load: 40,
            conversion_rate: 0.15,
            is_active: true,
            last_assigned_at: new Date(Date.now() - 1 * 60 * 60 * 1000),
          },
        ])
        .mockResolvedValue([] as never);

      const result = await leadDistributor.distributeLead(
        'tenant-1',
        mockLead
      );

      expect(result.success).toBe(true);
      expect(result.assignedTo?.userId).toBe('user-1'); // Better territory + expertise match
    });

    it('always provides explanation for assignment', async () => {
      vi.mocked(query)
        .mockResolvedValueOnce([
          {
            id: 'tm-1',
            user_id: 'user-1',
            name: 'John Doe',
            email: 'john@test.com',
            territories: ['UAE'],
            verticals: ['banking'],
            sub_verticals: ['employee_banking'],
            max_capacity: 50,
            current_load: 10,
            conversion_rate: 0.2,
            is_active: true,
            last_assigned_at: null,
          },
        ])
        .mockResolvedValue([] as never);

      const result = await leadDistributor.distributeLead(
        'tenant-1',
        mockLead
      );

      expect(result.explanation).toBeDefined();
      expect(result.explanation.length).toBeGreaterThan(0);
      expect(result.explanation).toContain('John Doe');
    });

    it('provides distribution factors', async () => {
      vi.mocked(query)
        .mockResolvedValueOnce([
          {
            id: 'tm-1',
            user_id: 'user-1',
            name: 'John Doe',
            email: 'john@test.com',
            territories: ['UAE'],
            verticals: ['banking'],
            sub_verticals: ['employee_banking'],
            max_capacity: 50,
            current_load: 10,
            conversion_rate: 0.2,
            is_active: true,
            last_assigned_at: null,
          },
        ])
        .mockResolvedValue([] as never);

      const result = await leadDistributor.distributeLead(
        'tenant-1',
        mockLead
      );

      expect(result.factors).toBeDefined();
      expect(result.factors.length).toBeGreaterThan(0);

      // Should have all factor types
      const factorNames = result.factors.map(f => f.factor);
      expect(factorNames).toContain('territory');
      expect(factorNames).toContain('capacity');
      expect(factorNames).toContain('expertise');
      expect(factorNames).toContain('performance');
      expect(factorNames).toContain('fairness');
    });

    it('returns failure when no eligible team members', async () => {
      vi.mocked(query).mockResolvedValue([]);

      const result = await leadDistributor.distributeLead(
        'tenant-1',
        mockLead
      );

      expect(result.success).toBe(false);
      expect(result.assignedTo).toBeNull();
      expect(result.explanation).toContain('No eligible');
    });

    it('considers capacity in assignment', async () => {
      vi.mocked(query)
        .mockResolvedValueOnce([
          {
            id: 'tm-1',
            user_id: 'user-overloaded',
            name: 'Overloaded User',
            email: 'overloaded@test.com',
            territories: ['UAE'],
            verticals: ['banking'],
            sub_verticals: ['employee_banking'],
            max_capacity: 50,
            current_load: 48, // Almost full
            conversion_rate: 0.25,
            is_active: true,
            last_assigned_at: null,
          },
          {
            id: 'tm-2',
            user_id: 'user-available',
            name: 'Available User',
            email: 'available@test.com',
            territories: ['UAE'],
            verticals: ['banking'],
            sub_verticals: ['employee_banking'],
            max_capacity: 50,
            current_load: 10, // Plenty of capacity
            conversion_rate: 0.2,
            is_active: true,
            last_assigned_at: null,
          },
        ])
        .mockResolvedValue([] as never);

      const result = await leadDistributor.distributeLead(
        'tenant-1',
        mockLead
      );

      // Should prefer the user with more capacity
      expect(result.assignedTo?.userId).toBe('user-available');
    });
  });

  describe('fairness', () => {
    it('considers time since last assignment', async () => {
      const mockLead = {
        id: 'lead-1',
        companyId: 'company-1',
        companyName: 'Test Corp',
        region: 'UAE',
        vertical: 'banking',
        subVertical: 'employee_banking',
        score: 75,
      };

      vi.mocked(query)
        .mockResolvedValueOnce([
          {
            id: 'tm-1',
            user_id: 'user-recent',
            name: 'Recently Assigned',
            email: 'recent@test.com',
            territories: ['UAE'],
            verticals: ['banking'],
            sub_verticals: ['employee_banking'],
            max_capacity: 50,
            current_load: 10,
            conversion_rate: 0.2,
            is_active: true,
            last_assigned_at: new Date(), // Just assigned
          },
          {
            id: 'tm-2',
            user_id: 'user-waiting',
            name: 'Waiting User',
            email: 'waiting@test.com',
            territories: ['UAE'],
            verticals: ['banking'],
            sub_verticals: ['employee_banking'],
            max_capacity: 50,
            current_load: 10,
            conversion_rate: 0.2,
            is_active: true,
            last_assigned_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24h ago
          },
        ])
        .mockResolvedValue([] as never);

      const result = await leadDistributor.distributeLead(
        'tenant-1',
        mockLead
      );

      // Should prefer the user who hasn't been assigned recently
      expect(result.assignedTo?.userId).toBe('user-waiting');
    });
  });
});

describe('B014: Distribution transparency shown', () => {
  it('provides alternative candidates', async () => {
    const mockLead = {
      id: 'lead-1',
      companyId: 'company-1',
      companyName: 'Test Corp',
      region: 'UAE',
      vertical: 'banking',
      subVertical: 'employee_banking',
      score: 75,
    };

    vi.mocked(query)
      .mockResolvedValueOnce([
        {
          id: 'tm-1',
          user_id: 'user-1',
          name: 'First Choice',
          email: 'first@test.com',
          territories: ['UAE'],
          verticals: ['banking'],
          sub_verticals: ['employee_banking'],
          max_capacity: 50,
          current_load: 10,
          conversion_rate: 0.25,
          is_active: true,
          last_assigned_at: null,
        },
        {
          id: 'tm-2',
          user_id: 'user-2',
          name: 'Second Choice',
          email: 'second@test.com',
          territories: ['UAE'],
          verticals: ['banking'],
          sub_verticals: [],
          max_capacity: 50,
          current_load: 15,
          conversion_rate: 0.2,
          is_active: true,
          last_assigned_at: null,
        },
        {
          id: 'tm-3',
          user_id: 'user-3',
          name: 'Third Choice',
          email: 'third@test.com',
          territories: ['KSA'],
          verticals: ['banking'],
          sub_verticals: [],
          max_capacity: 50,
          current_load: 20,
          conversion_rate: 0.15,
          is_active: true,
          last_assigned_at: null,
        },
      ])
      .mockResolvedValue([] as never);

    const result = await leadDistributor.distributeLead(
      'tenant-1',
      mockLead
    );

    expect(result.alternativeCandidates).toBeDefined();
    expect(result.alternativeCandidates?.length).toBeGreaterThan(0);
    expect(result.alternativeCandidates?.[0].userId).not.toBe(result.assignedTo?.userId);
  });
});

describe('configuration', () => {
  it('has valid default weights summing to 1', () => {
    const totalWeight = Object.values(DEFAULT_DISTRIBUTION_CONFIG.weights).reduce(
      (sum, w) => sum + w,
      0
    );
    expect(totalWeight).toBeCloseTo(1.0, 2);
  });

  it('has reasonable max leads per user', () => {
    expect(DEFAULT_DISTRIBUTION_CONFIG.maxLeadsPerUser).toBeGreaterThan(0);
    expect(DEFAULT_DISTRIBUTION_CONFIG.maxLeadsPerUser).toBeLessThanOrEqual(100);
  });
});
