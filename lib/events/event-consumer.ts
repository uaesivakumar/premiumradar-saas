/**
 * Event Consumer
 *
 * S356: Event Consumer Infrastructure
 * Behavior Contract B007: User feedback captured as event
 *
 * Consumes Business Transaction Events (BTE) and routes them
 * to the appropriate handlers for the Learning Loop.
 *
 * Architecture:
 * - Subscribes to business_events table changes
 * - Routes events to handlers based on event_type
 * - Updates confidence scores based on outcomes
 * - Triggers memory decay when appropriate
 */

import { query } from '@/lib/db/client';
import { logger } from '@/lib/logging/structured-logger';

// ============================================================
// WORKSPACE INTELLIGENCE EVENT TYPES
// ============================================================

export type WorkspaceEventType =
  // User feedback events
  | 'LEAD_APPROVED'
  | 'LEAD_REJECTED'
  | 'LEAD_SNOOZED'
  | 'LEAD_CONTACTED'
  | 'LEAD_CONVERTED'
  // Action events
  | 'DISCOVERY_COMPLETED'
  | 'ENRICHMENT_COMPLETED'
  | 'SCORE_CALCULATED'
  | 'NBA_PRESENTED'
  | 'NBA_ACCEPTED'
  | 'NBA_DISMISSED'
  // Outcome events
  | 'MEETING_SCHEDULED'
  | 'PROPOSAL_SENT'
  | 'DEAL_WON'
  | 'DEAL_LOST'
  // Session events
  | 'SESSION_STARTED'
  | 'SESSION_ENDED';

export interface WorkspaceEvent {
  id?: string;
  event_type: WorkspaceEventType;
  tenant_id: string;
  user_id: string;
  workspace_id?: string;
  entity_type: 'LEAD' | 'COMPANY' | 'ACTION' | 'SESSION';
  entity_id: string;
  metadata: Record<string, unknown>;
  timestamp?: Date;
}

export interface EventHandlerResult {
  success: boolean;
  processed: boolean;
  confidenceUpdate?: {
    entityId: string;
    delta: number;
    reason: string;
  };
  error?: string;
}

// ============================================================
// EVENT HANDLER REGISTRY
// ============================================================

type EventHandler = (event: WorkspaceEvent) => Promise<EventHandlerResult>;

const eventHandlers: Map<WorkspaceEventType, EventHandler[]> = new Map();

/**
 * Register an event handler for a specific event type
 */
export function registerHandler(
  eventType: WorkspaceEventType,
  handler: EventHandler
): void {
  const existing = eventHandlers.get(eventType) || [];
  existing.push(handler);
  eventHandlers.set(eventType, existing);
}

/**
 * Get all handlers for an event type
 */
export function getHandlers(eventType: WorkspaceEventType): EventHandler[] {
  return eventHandlers.get(eventType) || [];
}

// ============================================================
// EVENT EMISSION
// ============================================================

/**
 * Emit a workspace intelligence event
 * Inserts into the workspace_events table and triggers handlers
 */
export async function emitWorkspaceEvent(
  event: WorkspaceEvent
): Promise<{ eventId: string; handlerResults: EventHandlerResult[] }> {
  // Insert into database
  const result = await query<{ id: string }>(
    `INSERT INTO workspace_events (
      event_type,
      tenant_id,
      user_id,
      workspace_id,
      entity_type,
      entity_id,
      metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id`,
    [
      event.event_type,
      event.tenant_id,
      event.user_id,
      event.workspace_id,
      event.entity_type,
      event.entity_id,
      JSON.stringify(event.metadata),
    ]
  );

  const eventId = result[0]?.id;

  logger.info('Workspace event emitted', {
    eventId,
    eventType: event.event_type,
    entityType: event.entity_type,
    entityId: event.entity_id,
    tenantId: event.tenant_id,
  });

  // Process handlers
  const handlers = getHandlers(event.event_type);
  const handlerResults: EventHandlerResult[] = [];

  for (const handler of handlers) {
    try {
      const result = await handler({ ...event, id: eventId });
      handlerResults.push(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Event handler failed', {
        eventId,
        eventType: event.event_type,
        error: errorMessage,
      });
      handlerResults.push({
        success: false,
        processed: false,
        error: errorMessage,
      });
    }
  }

  return { eventId, handlerResults };
}

// ============================================================
// FEEDBACK EVENT HELPERS
// ============================================================

/**
 * Record user feedback on a lead (positive signal)
 */
export async function recordLeadApproval(
  tenantId: string,
  userId: string,
  leadId: string,
  metadata: {
    companyId?: string;
    companyName?: string;
    approvalReason?: string;
    scoreAtApproval?: number;
  }
): Promise<void> {
  await emitWorkspaceEvent({
    event_type: 'LEAD_APPROVED',
    tenant_id: tenantId,
    user_id: userId,
    entity_type: 'LEAD',
    entity_id: leadId,
    metadata: {
      ...metadata,
      feedbackType: 'positive',
      feedbackWeight: 1.0,
    },
  });
}

/**
 * Record user rejection of a lead (negative signal)
 */
export async function recordLeadRejection(
  tenantId: string,
  userId: string,
  leadId: string,
  metadata: {
    companyId?: string;
    companyName?: string;
    rejectionReason?: string;
    scoreAtRejection?: number;
  }
): Promise<void> {
  await emitWorkspaceEvent({
    event_type: 'LEAD_REJECTED',
    tenant_id: tenantId,
    user_id: userId,
    entity_type: 'LEAD',
    entity_id: leadId,
    metadata: {
      ...metadata,
      feedbackType: 'negative',
      feedbackWeight: -0.5,
    },
  });
}

/**
 * Record lead snooze (neutral signal with context)
 */
export async function recordLeadSnooze(
  tenantId: string,
  userId: string,
  leadId: string,
  metadata: {
    companyId?: string;
    snoozeUntil: Date;
    snoozeReason?: string;
  }
): Promise<void> {
  await emitWorkspaceEvent({
    event_type: 'LEAD_SNOOZED',
    tenant_id: tenantId,
    user_id: userId,
    entity_type: 'LEAD',
    entity_id: leadId,
    metadata: {
      ...metadata,
      feedbackType: 'neutral',
      feedbackWeight: 0,
    },
  });
}

/**
 * Record NBA interaction
 */
export async function recordNBAInteraction(
  tenantId: string,
  userId: string,
  nbaId: string,
  accepted: boolean,
  metadata: {
    leadId?: string;
    nbaType?: string;
    reason?: string;
  }
): Promise<void> {
  await emitWorkspaceEvent({
    event_type: accepted ? 'NBA_ACCEPTED' : 'NBA_DISMISSED',
    tenant_id: tenantId,
    user_id: userId,
    entity_type: 'ACTION',
    entity_id: nbaId,
    metadata: {
      ...metadata,
      feedbackType: accepted ? 'positive' : 'negative',
      feedbackWeight: accepted ? 0.5 : -0.25,
    },
  });
}

// ============================================================
// OUTCOME EVENT HELPERS
// ============================================================

/**
 * Record a deal outcome (terminal state)
 */
export async function recordDealOutcome(
  tenantId: string,
  userId: string,
  dealId: string,
  won: boolean,
  metadata: {
    leadId: string;
    companyId: string;
    dealValue?: number;
    daysInPipeline?: number;
    lostReason?: string;
  }
): Promise<void> {
  await emitWorkspaceEvent({
    event_type: won ? 'DEAL_WON' : 'DEAL_LOST',
    tenant_id: tenantId,
    user_id: userId,
    entity_type: 'LEAD',
    entity_id: metadata.leadId,
    metadata: {
      dealId,
      ...metadata,
      feedbackType: won ? 'positive' : 'negative',
      feedbackWeight: won ? 2.0 : -1.0,
      isTerminal: true,
    },
  });
}

// ============================================================
// EVENT QUERY FUNCTIONS
// ============================================================

/**
 * Get recent events for a tenant
 */
export async function getTenantEvents(
  tenantId: string,
  options?: {
    eventTypes?: WorkspaceEventType[];
    entityType?: string;
    limit?: number;
    since?: Date;
  }
): Promise<WorkspaceEvent[]> {
  const limit = options?.limit || 100;
  const since = options?.since || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  let sql = `
    SELECT id, event_type, tenant_id, user_id, workspace_id,
           entity_type, entity_id, metadata, created_at as timestamp
    FROM workspace_events
    WHERE tenant_id = $1
      AND created_at >= $2
  `;
  const params: unknown[] = [tenantId, since];
  let paramIndex = 3;

  if (options?.eventTypes && options.eventTypes.length > 0) {
    sql += ` AND event_type = ANY($${paramIndex})`;
    params.push(options.eventTypes);
    paramIndex++;
  }

  if (options?.entityType) {
    sql += ` AND entity_type = $${paramIndex}`;
    params.push(options.entityType);
    paramIndex++;
  }

  sql += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
  params.push(limit);

  return query<WorkspaceEvent>(sql, params);
}

/**
 * Get events for a specific entity
 */
export async function getEntityEvents(
  tenantId: string,
  entityType: string,
  entityId: string,
  limit: number = 50
): Promise<WorkspaceEvent[]> {
  return query<WorkspaceEvent>(
    `SELECT id, event_type, tenant_id, user_id, workspace_id,
            entity_type, entity_id, metadata, created_at as timestamp
     FROM workspace_events
     WHERE tenant_id = $1
       AND entity_type = $2
       AND entity_id = $3
     ORDER BY created_at DESC
     LIMIT $4`,
    [tenantId, entityType, entityId, limit]
  );
}

/**
 * Get feedback summary for learning
 */
export async function getFeedbackSummary(
  tenantId: string,
  since: Date
): Promise<{
  approvals: number;
  rejections: number;
  snoozes: number;
  nbaAccepted: number;
  nbaDismissed: number;
  dealsWon: number;
  dealsLost: number;
}> {
  const result = await query<{ event_type: string; count: string }>(
    `SELECT event_type, COUNT(*) as count
     FROM workspace_events
     WHERE tenant_id = $1
       AND created_at >= $2
       AND event_type IN (
         'LEAD_APPROVED', 'LEAD_REJECTED', 'LEAD_SNOOZED',
         'NBA_ACCEPTED', 'NBA_DISMISSED',
         'DEAL_WON', 'DEAL_LOST'
       )
     GROUP BY event_type`,
    [tenantId, since]
  );

  const counts = new Map(result.map(r => [r.event_type, parseInt(r.count, 10)]));

  return {
    approvals: counts.get('LEAD_APPROVED') || 0,
    rejections: counts.get('LEAD_REJECTED') || 0,
    snoozes: counts.get('LEAD_SNOOZED') || 0,
    nbaAccepted: counts.get('NBA_ACCEPTED') || 0,
    nbaDismissed: counts.get('NBA_DISMISSED') || 0,
    dealsWon: counts.get('DEAL_WON') || 0,
    dealsLost: counts.get('DEAL_LOST') || 0,
  };
}

export default {
  emitWorkspaceEvent,
  registerHandler,
  getHandlers,
  recordLeadApproval,
  recordLeadRejection,
  recordLeadSnooze,
  recordNBAInteraction,
  recordDealOutcome,
  getTenantEvents,
  getEntityEvents,
  getFeedbackSummary,
};
