/**
 * Webhook Idempotency Service - Sprint S142.1
 *
 * Ensures Stripe webhooks are processed exactly once using an idempotency table.
 * Prevents duplicate processing on webhook retries.
 */

// ============================================================
// TYPES
// ============================================================

export interface WebhookEventRecord {
  id: string;
  event_id: string; // Stripe event ID (unique)
  event_type: string;
  processed_at: string;
  result: 'success' | 'failed' | 'skipped';
  error?: string;
  metadata?: Record<string, unknown>;
}

// In-memory store for demo (use PostgreSQL in production)
const webhookEvents = new Map<string, WebhookEventRecord>();

// ============================================================
// IDEMPOTENCY FUNCTIONS
// ============================================================

/**
 * Check if event has already been processed
 */
export function isEventProcessed(eventId: string): boolean {
  return webhookEvents.has(eventId);
}

/**
 * Get processed event record
 */
export function getEventRecord(eventId: string): WebhookEventRecord | null {
  return webhookEvents.get(eventId) || null;
}

/**
 * Mark event as being processed (acquire lock)
 * Returns false if event is already being processed
 */
export function acquireEventLock(eventId: string, eventType: string): boolean {
  if (webhookEvents.has(eventId)) {
    return false; // Already processed or being processed
  }

  // Create placeholder record
  const record: WebhookEventRecord = {
    id: `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    event_id: eventId,
    event_type: eventType,
    processed_at: new Date().toISOString(),
    result: 'success', // Will be updated after processing
  };

  webhookEvents.set(eventId, record);
  return true;
}

/**
 * Mark event as successfully processed
 */
export function markEventSuccess(
  eventId: string,
  metadata?: Record<string, unknown>
): void {
  const record = webhookEvents.get(eventId);
  if (record) {
    record.result = 'success';
    record.metadata = metadata;
    webhookEvents.set(eventId, record);
  }
}

/**
 * Mark event as failed
 */
export function markEventFailed(eventId: string, error: string): void {
  const record = webhookEvents.get(eventId);
  if (record) {
    record.result = 'failed';
    record.error = error;
    webhookEvents.set(eventId, record);
  }
}

/**
 * Mark event as skipped (duplicate)
 */
export function markEventSkipped(eventId: string): void {
  const record = webhookEvents.get(eventId);
  if (record) {
    record.result = 'skipped';
    webhookEvents.set(eventId, record);
  }
}

/**
 * Get all processed events (for debugging/audit)
 */
export function getAllEvents(
  filter?: {
    eventType?: string;
    result?: 'success' | 'failed' | 'skipped';
  },
  limit: number = 100
): WebhookEventRecord[] {
  let events = Array.from(webhookEvents.values());

  if (filter?.eventType) {
    events = events.filter((e) => e.event_type === filter.eventType);
  }

  if (filter?.result) {
    events = events.filter((e) => e.result === filter.result);
  }

  // Sort by processed_at descending
  events.sort((a, b) =>
    new Date(b.processed_at).getTime() - new Date(a.processed_at).getTime()
  );

  return events.slice(0, limit);
}

/**
 * Clean up old events (keep last 30 days)
 */
export function cleanupOldEvents(): number {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let cleaned = 0;
  for (const [eventId, record] of webhookEvents.entries()) {
    if (new Date(record.processed_at) < thirtyDaysAgo) {
      webhookEvents.delete(eventId);
      cleaned++;
    }
  }

  return cleaned;
}

// ============================================================
// WEBHOOK PROCESSING WRAPPER
// ============================================================

/**
 * Process webhook with idempotency guarantee
 */
export async function processWithIdempotency<T>(
  eventId: string,
  eventType: string,
  processor: () => Promise<T>
): Promise<{ success: boolean; result?: T; skipped?: boolean; error?: string }> {
  // Try to acquire lock
  if (!acquireEventLock(eventId, eventType)) {
    // Already processed
    const existingRecord = getEventRecord(eventId);
    return {
      success: existingRecord?.result === 'success',
      skipped: true,
      error: 'Event already processed',
    };
  }

  try {
    // Process the event
    const result = await processor();

    // Mark as success
    markEventSuccess(eventId, { result: 'processed' });

    return { success: true, result };
  } catch (error) {
    // Mark as failed
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    markEventFailed(eventId, errorMessage);

    return { success: false, error: errorMessage };
  }
}

export default {
  isEventProcessed,
  getEventRecord,
  acquireEventLock,
  markEventSuccess,
  markEventFailed,
  markEventSkipped,
  getAllEvents,
  cleanupOldEvents,
  processWithIdempotency,
};
