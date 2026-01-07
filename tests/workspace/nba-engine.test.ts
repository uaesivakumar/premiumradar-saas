/**
 * NBA Engine Tests
 *
 * S359-S361: NBA Engine, Presenter, Context-aware NBA
 * Behavior Contracts:
 * - B010: Single NBA selected per context
 * - B011: NBA visually prominent and singular
 * - B012: NBA adapts to context
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

vi.mock('@/lib/intelligence/confidence-engine', () => ({
  confidenceEngine: {
    getConfidence: vi.fn().mockResolvedValue(0.7),
  },
}));

import { query } from '@/lib/db/client';
import { nbaEngine, NBA_CONFIG } from '@/lib/workspace/nba-engine';

describe('B010: Single NBA selected per context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getNBA', () => {
    it('returns exactly one NBA when candidates exist', async () => {
      vi.mocked(query).mockResolvedValueOnce([
        {
          id: 'lead-1',
          company_id: 'company-1',
          company_name: 'Test Corp',
          contact_name: 'John Doe',
          status: 'new',
          last_contacted_at: null,
          signal_type: 'hiring_expansion',
          signal_date: new Date(),
          score: 85,
          has_urgent_signal: true,
          pending_action_type: null,
        },
        {
          id: 'lead-2',
          company_id: 'company-2',
          company_name: 'Other Corp',
          contact_name: null,
          status: 'contacted',
          last_contacted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          signal_type: null,
          signal_date: null,
          score: 70,
          has_urgent_signal: false,
          pending_action_type: null,
        },
      ]).mockResolvedValue([] as never);

      const result = await nbaEngine.getNBA({
        tenantId: 'tenant-1',
        userId: 'user-1',
      });

      expect(result.nba).not.toBeNull();
      expect(result.candidatesEvaluated).toBe(2);
      // Should only return ONE nba, not an array
      expect(result.nba?.id).toBeDefined();
    });

    it('returns null when no candidates exist', async () => {
      vi.mocked(query).mockResolvedValue([]);

      const result = await nbaEngine.getNBA({
        tenantId: 'tenant-1',
        userId: 'user-1',
      });

      expect(result.nba).toBeNull();
      expect(result.candidatesEvaluated).toBe(0);
      expect(result.selectionReason).toContain('No actionable');
    });

    it('selects highest priority action', async () => {
      vi.mocked(query).mockResolvedValueOnce([
        {
          id: 'lead-urgent',
          company_id: 'company-1',
          company_name: 'Urgent Corp',
          contact_name: null,
          status: 'new',
          last_contacted_at: null,
          signal_type: 'funding_round',
          signal_date: new Date(),
          score: 90,
          has_urgent_signal: true,
          pending_action_type: null,
        },
        {
          id: 'lead-normal',
          company_id: 'company-2',
          company_name: 'Normal Corp',
          contact_name: null,
          status: 'new',
          last_contacted_at: null,
          signal_type: null,
          signal_date: null,
          score: 60,
          has_urgent_signal: false,
          pending_action_type: null,
        },
      ]).mockResolvedValue([] as never);

      const result = await nbaEngine.getNBA({
        tenantId: 'tenant-1',
        userId: 'user-1',
      });

      // Should select the urgent one
      expect(result.nba?.leadId).toBe('lead-urgent');
      expect(result.nba?.urgency).toBe('critical');
    });
  });
});

describe('B011: NBA visually prominent and singular', () => {
  it('NBA has actionText for display', async () => {
    vi.mocked(query).mockResolvedValueOnce([
      {
        id: 'lead-1',
        company_id: 'company-1',
        company_name: 'Test Corp',
        contact_name: 'John Doe',
        status: 'new',
        last_contacted_at: null,
        signal_type: null,
        signal_date: null,
        score: 75,
        has_urgent_signal: false,
        pending_action_type: null,
      },
    ]).mockResolvedValue([] as never);

    const result = await nbaEngine.getNBA({
      tenantId: 'tenant-1',
      userId: 'user-1',
    });

    expect(result.nba?.actionText).toBeDefined();
    expect(result.nba?.actionText.length).toBeGreaterThan(0);
  });

  it('NBA includes urgency for styling', async () => {
    vi.mocked(query).mockResolvedValueOnce([
      {
        id: 'lead-1',
        company_id: 'company-1',
        company_name: 'Test Corp',
        contact_name: null,
        status: 'new',
        last_contacted_at: null,
        signal_type: null,
        signal_date: null,
        score: 75,
        has_urgent_signal: false,
        pending_action_type: null,
      },
    ]).mockResolvedValue([] as never);

    const result = await nbaEngine.getNBA({
      tenantId: 'tenant-1',
      userId: 'user-1',
    });

    expect(['critical', 'high', 'medium', 'low']).toContain(result.nba?.urgency);
  });
});

describe('B012: NBA adapts to context', () => {
  it('respects current lead context', async () => {
    vi.mocked(query).mockResolvedValueOnce([
      {
        id: 'lead-1',
        company_id: 'company-1',
        company_name: 'Current Lead Corp',
        contact_name: null,
        status: 'contacted',
        last_contacted_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        signal_type: null,
        signal_date: null,
        score: 70,
        has_urgent_signal: false,
        pending_action_type: null,
      },
    ]).mockResolvedValue([] as never);

    const result = await nbaEngine.getNBA({
      tenantId: 'tenant-1',
      userId: 'user-1',
      currentLeadId: 'lead-1', // User is viewing this lead
    });

    // Should still return NBA for the current lead
    expect(result.nba).toBeDefined();
  });

  it('considers time of day in scoring', async () => {
    vi.mocked(query).mockResolvedValueOnce([
      {
        id: 'lead-1',
        company_id: 'company-1',
        company_name: 'Test Corp',
        contact_name: null,
        status: 'new',
        last_contacted_at: null,
        signal_type: null,
        signal_date: null,
        score: 75,
        has_urgent_signal: false,
        pending_action_type: null,
      },
    ]).mockResolvedValue([] as never);

    // Morning context (9am)
    const morningResult = await nbaEngine.getNBA({
      tenantId: 'tenant-1',
      userId: 'user-1',
      currentTime: new Date('2025-01-06T09:00:00'),
    });

    vi.mocked(query).mockResolvedValueOnce([
      {
        id: 'lead-1',
        company_id: 'company-1',
        company_name: 'Test Corp',
        contact_name: null,
        status: 'new',
        last_contacted_at: null,
        signal_type: null,
        signal_date: null,
        score: 75,
        has_urgent_signal: false,
        pending_action_type: null,
      },
    ]).mockResolvedValue([] as never);

    // Evening context (10pm)
    const eveningResult = await nbaEngine.getNBA({
      tenantId: 'tenant-1',
      userId: 'user-1',
      currentTime: new Date('2025-01-06T22:00:00'),
    });

    // Morning score should be higher (outreach boost)
    expect(morningResult.nba?.score).toBeGreaterThan(eveningResult.nba?.score || 0);
  });
});

describe('NBA configuration', () => {
  it('has all action types with priorities', () => {
    const actionTypes = [
      'CALL_NOW', 'RESPOND_URGENT', 'SCHEDULE_MEETING',
      'SEND_EMAIL', 'SEND_LINKEDIN', 'FOLLOW_UP',
      'CHECK_IN', 'UPDATE_STATUS', 'REVIEW_PROFILE',
      'RESEARCH_COMPANY', 'RESEARCH_CONTACT', 'FIND_TRIGGER',
    ];

    actionTypes.forEach(type => {
      expect(NBA_CONFIG.typePriorities[type as keyof typeof NBA_CONFIG.typePriorities]).toBeDefined();
    });
  });

  it('CALL_NOW has highest priority', () => {
    const highestPriority = Math.max(...Object.values(NBA_CONFIG.typePriorities));
    expect(NBA_CONFIG.typePriorities.CALL_NOW).toBe(highestPriority);
  });

  it('urgency multipliers are properly ordered', () => {
    expect(NBA_CONFIG.urgencyMultipliers.critical).toBeGreaterThan(
      NBA_CONFIG.urgencyMultipliers.high
    );
    expect(NBA_CONFIG.urgencyMultipliers.high).toBeGreaterThan(
      NBA_CONFIG.urgencyMultipliers.medium
    );
    expect(NBA_CONFIG.urgencyMultipliers.medium).toBeGreaterThan(
      NBA_CONFIG.urgencyMultipliers.low
    );
  });
});
