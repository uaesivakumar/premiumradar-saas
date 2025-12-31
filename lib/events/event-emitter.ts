/**
 * S340: Business Event Emitter (Admin Plane v1.1)
 *
 * Deterministic event emission for the Business Event Log (BTE).
 * All Admin Plane mutations emit events through this module.
 *
 * IMMUTABILITY: The business_events table has triggers preventing
 * UPDATE and DELETE operations. Once an event is logged, it cannot
 * be modified.
 */

import { insert } from '@/lib/db/client';
import { ResolvedContext } from '@/lib/auth/session/session-context';

// ============================================================
// EVENT TYPES (Admin Plane v1.1)
// ============================================================

export type AdminPlaneEventType =
  // Enterprise lifecycle
  | 'ENTERPRISE_CREATED'
  | 'ENTERPRISE_UPDATED'
  | 'ENTERPRISE_DELETED'
  | 'ENTERPRISE_PLAN_CHANGED'
  // User lifecycle
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'USER_ROLE_CHANGED'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  // Workspace lifecycle
  | 'WORKSPACE_CREATED'
  | 'WORKSPACE_UPDATED'
  | 'WORKSPACE_DELETED'
  // Demo lifecycle
  | 'DEMO_STARTED'
  | 'DEMO_EXTENDED'
  | 'DEMO_CONVERTED'
  | 'DEMO_EXPIRED'
  // Admin actions
  | 'ADMIN_ACTION'
  | 'SUPER_ADMIN_ACTION';

export type EntityType =
  | 'ENTERPRISE'
  | 'USER'
  | 'WORKSPACE'
  | 'DEMO_POLICY'
  | 'SYSTEM';

// ============================================================
// EVENT PAYLOAD
// ============================================================

export interface BusinessEventPayload {
  // Required fields
  event_type: AdminPlaneEventType;
  entity_type: EntityType;
  entity_id: string;

  // Optional metadata (stored as JSON)
  metadata?: Record<string, unknown>;
}

export interface StoredBusinessEvent {
  event_id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  workspace_id: string;
  sub_vertical_id: string;
  actor_user_id: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

// ============================================================
// SENTINEL VALUES
// ============================================================

/**
 * Sentinel UUID for system-level events without workspace/sub-vertical.
 * Used when an event occurs at enterprise or system level.
 */
const SYSTEM_SENTINEL_UUID = '00000000-0000-0000-0000-000000000000';

// ============================================================
// EVENT EMITTER
// ============================================================

/**
 * Emit a business event to the immutable BTE log.
 *
 * @param context - Resolved context from session (includes actor, enterprise, workspace)
 * @param payload - Event details (type, entity, metadata)
 * @returns The stored event record
 *
 * @example
 * ```typescript
 * const ctx = await requireResolvedContext();
 * await emitBusinessEvent(ctx, {
 *   event_type: 'USER_CREATED',
 *   entity_type: 'USER',
 *   entity_id: newUser.id,
 *   metadata: { email: newUser.email, role: newUser.role }
 * });
 * ```
 */
export async function emitBusinessEvent(
  context: ResolvedContext,
  payload: BusinessEventPayload
): Promise<StoredBusinessEvent> {
  // Build metadata with resolved context
  const enrichedMetadata: Record<string, unknown> = {
    ...payload.metadata,
    // Include full resolved context for audit trail
    resolved_context: {
      enterprise_id: context.enterprise_id,
      region_code: context.region_code,
      is_demo: context.is_demo,
      demo_type: context.demo_type,
      role: context.role,
    },
  };

  return insert<StoredBusinessEvent>(
    `INSERT INTO business_events (
      event_type,
      entity_type,
      entity_id,
      workspace_id,
      sub_vertical_id,
      actor_user_id,
      metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      payload.event_type,
      payload.entity_type,
      payload.entity_id,
      context.workspace_id || SYSTEM_SENTINEL_UUID,
      context.sub_vertical_id || SYSTEM_SENTINEL_UUID,
      context.user_id,
      JSON.stringify(enrichedMetadata),
    ]
  );
}

/**
 * Emit a system-level event (no user context required).
 * Used for scheduled jobs, system events, etc.
 *
 * @param payload - Event details
 * @param systemActorId - Optional system actor ID (defaults to sentinel)
 */
export async function emitSystemEvent(
  payload: BusinessEventPayload,
  systemActorId: string = SYSTEM_SENTINEL_UUID
): Promise<StoredBusinessEvent> {
  const systemMetadata: Record<string, unknown> = {
    ...payload.metadata,
    resolved_context: {
      enterprise_id: null,
      region_code: null,
      is_demo: false,
      demo_type: null,
      role: 'SYSTEM',
    },
  };

  return insert<StoredBusinessEvent>(
    `INSERT INTO business_events (
      event_type,
      entity_type,
      entity_id,
      workspace_id,
      sub_vertical_id,
      actor_user_id,
      metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      payload.event_type,
      payload.entity_type,
      payload.entity_id,
      SYSTEM_SENTINEL_UUID,
      SYSTEM_SENTINEL_UUID,
      systemActorId,
      JSON.stringify(systemMetadata),
    ]
  );
}

// ============================================================
// QUERY HELPERS (Read-only)
// ============================================================

import { query, queryOne } from '@/lib/db/client';

/**
 * Get events for a specific entity.
 */
export async function getEntityEvents(
  entityType: EntityType,
  entityId: string,
  options?: { limit?: number; offset?: number }
): Promise<StoredBusinessEvent[]> {
  const limit = options?.limit || 100;
  const offset = options?.offset || 0;

  return query<StoredBusinessEvent>(
    `SELECT * FROM business_events
     WHERE entity_type = $1 AND entity_id = $2
     ORDER BY timestamp DESC
     LIMIT $3 OFFSET $4`,
    [entityType, entityId, limit, offset]
  );
}

/**
 * Get events by actor (user).
 */
export async function getActorEvents(
  actorUserId: string,
  options?: { limit?: number; offset?: number }
): Promise<StoredBusinessEvent[]> {
  const limit = options?.limit || 100;
  const offset = options?.offset || 0;

  return query<StoredBusinessEvent>(
    `SELECT * FROM business_events
     WHERE actor_user_id = $1
     ORDER BY timestamp DESC
     LIMIT $2 OFFSET $3`,
    [actorUserId, limit, offset]
  );
}

/**
 * Get events for a workspace within a time range.
 */
export async function getWorkspaceEvents(
  workspaceId: string,
  options?: { from?: Date; to?: Date; limit?: number }
): Promise<StoredBusinessEvent[]> {
  const limit = options?.limit || 100;
  const from = options?.from || new Date(0);
  const to = options?.to || new Date();

  return query<StoredBusinessEvent>(
    `SELECT * FROM business_events
     WHERE workspace_id = $1
       AND timestamp >= $2
       AND timestamp <= $3
     ORDER BY timestamp DESC
     LIMIT $4`,
    [workspaceId, from, to, limit]
  );
}

/**
 * Count events for an entity.
 */
export async function countEntityEvents(
  entityType: EntityType,
  entityId: string
): Promise<number> {
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM business_events
     WHERE entity_type = $1 AND entity_id = $2`,
    [entityType, entityId]
  );
  return parseInt(result?.count || '0', 10);
}

export default {
  emitBusinessEvent,
  emitSystemEvent,
  getEntityEvents,
  getActorEvents,
  getWorkspaceEvents,
  countEntityEvents,
  SYSTEM_SENTINEL_UUID,
};
