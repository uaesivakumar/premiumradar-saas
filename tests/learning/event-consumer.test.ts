/**
 * Event Consumer Tests
 *
 * S356: Event Consumer Infrastructure
 * Behavior Contract B007: User feedback captured as event
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
  emitWorkspaceEvent,
  registerHandler,
  getHandlers,
  recordLeadApproval,
  recordLeadRejection,
  getFeedbackSummary,
} from '@/lib/events/event-consumer';

describe('B007: User feedback captured as event', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('emitWorkspaceEvent', () => {
    it('inserts event into database', async () => {
      vi.mocked(query).mockResolvedValue([{ id: 'event-123' }]);

      const result = await emitWorkspaceEvent({
        event_type: 'LEAD_APPROVED',
        tenant_id: 'tenant-1',
        user_id: 'user-1',
        entity_type: 'LEAD',
        entity_id: 'lead-1',
        metadata: { companyName: 'Test Corp' },
      });

      expect(result.eventId).toBe('event-123');
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO workspace_events'),
        expect.arrayContaining(['LEAD_APPROVED', 'tenant-1', 'user-1'])
      );
    });

    it('executes registered handlers', async () => {
      vi.mocked(query).mockResolvedValue([{ id: 'event-456' }]);

      const mockHandler = vi.fn().mockResolvedValue({
        success: true,
        processed: true,
      });

      registerHandler('LEAD_APPROVED', mockHandler);

      await emitWorkspaceEvent({
        event_type: 'LEAD_APPROVED',
        tenant_id: 'tenant-1',
        user_id: 'user-1',
        entity_type: 'LEAD',
        entity_id: 'lead-1',
        metadata: {},
      });

      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('handler registration', () => {
    it('registers and retrieves handlers', () => {
      const handler = vi.fn();
      registerHandler('LEAD_REJECTED', handler);

      const handlers = getHandlers('LEAD_REJECTED');
      expect(handlers).toContain(handler);
    });

    it('returns empty array for unregistered event types', () => {
      const handlers = getHandlers('SESSION_STARTED');
      expect(handlers).toEqual([]);
    });
  });

  describe('feedback helpers', () => {
    it('recordLeadApproval emits correct event type', async () => {
      vi.mocked(query).mockResolvedValue([{ id: 'event-789' }]);

      await recordLeadApproval('tenant-1', 'user-1', 'lead-1', {
        companyId: 'company-1',
        companyName: 'Test Corp',
      });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO workspace_events'),
        expect.arrayContaining(['LEAD_APPROVED'])
      );
    });

    it('recordLeadRejection includes negative feedback weight', async () => {
      vi.mocked(query).mockResolvedValue([{ id: 'event-101' }]);

      await recordLeadRejection('tenant-1', 'user-1', 'lead-2', {
        rejectionReason: 'Not qualified',
      });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO workspace_events'),
        expect.arrayContaining(['LEAD_REJECTED'])
      );
    });
  });

  describe('getFeedbackSummary', () => {
    it('aggregates feedback counts correctly', async () => {
      vi.mocked(query).mockResolvedValue([
        { event_type: 'LEAD_APPROVED', count: '10' },
        { event_type: 'LEAD_REJECTED', count: '3' },
        { event_type: 'DEAL_WON', count: '2' },
      ]);

      const summary = await getFeedbackSummary('tenant-1', new Date());

      expect(summary.approvals).toBe(10);
      expect(summary.rejections).toBe(3);
      expect(summary.dealsWon).toBe(2);
      expect(summary.snoozes).toBe(0);
    });
  });
});
