/**
 * Event Insertion Service
 *
 * S261-F5: Canonical event insertion for BTE data foundation.
 *
 * GUARDRAILS:
 * - Validates required fields
 * - Sets timestamp server-side if missing
 * - NEVER updates rows
 * - NEVER deletes rows
 * - INSERT-ONLY operations
 */

import { getPool } from '@/lib/db/client';

// ============================================================
// TYPES
// ============================================================

export interface BusinessEventInput {
  event_type: string;
  entity_type: string;
  entity_id: string;
  workspace_id: string;
  sub_vertical_id: string;
  actor_user_id: string;
  timestamp?: string | Date;
  metadata?: Record<string, unknown>;
}

export interface BusinessEvent extends BusinessEventInput {
  event_id: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

export interface UserActionInput {
  action_type: string;
  workspace_id: string;
  actor_user_id: string;
  timestamp?: string | Date;
  metadata?: Record<string, unknown>;
}

export interface UserAction extends UserActionInput {
  action_id: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

export interface WorkspaceStateInput {
  workspace_id: string;
  current_sales_stage?: string;
  pending_actions?: unknown[];
  last_recommendation_id?: string;
  last_action_taken_at?: string | Date;
}

export interface WorkspaceState extends WorkspaceStateInput {
  updated_at: Date;
}

// ============================================================
// VALIDATION
// ============================================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

function isValidISO8601(value: string): boolean {
  const date = new Date(value);
  return !isNaN(date.getTime());
}

function validateBusinessEvent(input: BusinessEventInput): string[] {
  const errors: string[] = [];

  if (!input.event_type || typeof input.event_type !== 'string') {
    errors.push('event_type is required and must be a string');
  }

  if (!input.entity_type || typeof input.entity_type !== 'string') {
    errors.push('entity_type is required and must be a string');
  }

  if (!input.entity_id || !isValidUUID(input.entity_id)) {
    errors.push('entity_id is required and must be a valid UUID');
  }

  if (!input.workspace_id || !isValidUUID(input.workspace_id)) {
    errors.push('workspace_id is required and must be a valid UUID');
  }

  if (!input.sub_vertical_id || !isValidUUID(input.sub_vertical_id)) {
    errors.push('sub_vertical_id is required and must be a valid UUID');
  }

  if (!input.actor_user_id || !isValidUUID(input.actor_user_id)) {
    errors.push('actor_user_id is required and must be a valid UUID');
  }

  if (input.timestamp !== undefined) {
    const ts = typeof input.timestamp === 'string' ? input.timestamp : input.timestamp.toISOString();
    if (!isValidISO8601(ts)) {
      errors.push('timestamp must be a valid ISO-8601 date string');
    }
  }

  return errors;
}

function validateUserAction(input: UserActionInput): string[] {
  const errors: string[] = [];

  if (!input.action_type || typeof input.action_type !== 'string') {
    errors.push('action_type is required and must be a string');
  }

  if (!input.workspace_id || !isValidUUID(input.workspace_id)) {
    errors.push('workspace_id is required and must be a valid UUID');
  }

  if (!input.actor_user_id || !isValidUUID(input.actor_user_id)) {
    errors.push('actor_user_id is required and must be a valid UUID');
  }

  if (input.timestamp !== undefined) {
    const ts = typeof input.timestamp === 'string' ? input.timestamp : input.timestamp.toISOString();
    if (!isValidISO8601(ts)) {
      errors.push('timestamp must be a valid ISO-8601 date string');
    }
  }

  return errors;
}

// ============================================================
// INSERT FUNCTIONS (NO UPDATE, NO DELETE)
// ============================================================

/**
 * Insert a business event.
 *
 * This is INSERT-ONLY. The business_events table has triggers that
 * prevent UPDATE and DELETE operations.
 */
export async function insertBusinessEvent(
  input: BusinessEventInput
): Promise<BusinessEvent> {
  // Validate input
  const errors = validateBusinessEvent(input);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  const pool = getPool();

  // Use server timestamp if not provided
  const timestamp = input.timestamp
    ? (typeof input.timestamp === 'string' ? input.timestamp : input.timestamp.toISOString())
    : undefined;

  const query = timestamp
    ? `
      INSERT INTO business_events (event_type, entity_type, entity_id, workspace_id, sub_vertical_id, actor_user_id, timestamp, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `
    : `
      INSERT INTO business_events (event_type, entity_type, entity_id, workspace_id, sub_vertical_id, actor_user_id, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

  const params = timestamp
    ? [
        input.event_type,
        input.entity_type,
        input.entity_id,
        input.workspace_id,
        input.sub_vertical_id,
        input.actor_user_id,
        timestamp,
        JSON.stringify(input.metadata || {}),
      ]
    : [
        input.event_type,
        input.entity_type,
        input.entity_id,
        input.workspace_id,
        input.sub_vertical_id,
        input.actor_user_id,
        JSON.stringify(input.metadata || {}),
      ];

  const result = await pool.query(query, params);
  return result.rows[0] as BusinessEvent;
}

/**
 * Insert multiple business events in a single transaction.
 *
 * All events are inserted atomically - if any fails, all are rolled back.
 */
export async function insertBusinessEvents(
  inputs: BusinessEventInput[]
): Promise<BusinessEvent[]> {
  // Validate all inputs first
  for (let i = 0; i < inputs.length; i++) {
    const errors = validateBusinessEvent(inputs[i]);
    if (errors.length > 0) {
      throw new Error(`Validation failed for event ${i}: ${errors.join(', ')}`);
    }
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const results: BusinessEvent[] = [];

    for (const input of inputs) {
      const timestamp = input.timestamp
        ? (typeof input.timestamp === 'string' ? input.timestamp : input.timestamp.toISOString())
        : undefined;

      const query = timestamp
        ? `
          INSERT INTO business_events (event_type, entity_type, entity_id, workspace_id, sub_vertical_id, actor_user_id, timestamp, metadata)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `
        : `
          INSERT INTO business_events (event_type, entity_type, entity_id, workspace_id, sub_vertical_id, actor_user_id, metadata)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;

      const params = timestamp
        ? [input.event_type, input.entity_type, input.entity_id, input.workspace_id, input.sub_vertical_id, input.actor_user_id, timestamp, JSON.stringify(input.metadata || {})]
        : [input.event_type, input.entity_type, input.entity_id, input.workspace_id, input.sub_vertical_id, input.actor_user_id, JSON.stringify(input.metadata || {})];

      const result = await client.query(query, params);
      results.push(result.rows[0] as BusinessEvent);
    }

    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Insert a user action.
 *
 * INSERT-ONLY operation.
 */
export async function insertUserAction(
  input: UserActionInput
): Promise<UserAction> {
  // Validate input
  const errors = validateUserAction(input);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  const pool = getPool();

  const timestamp = input.timestamp
    ? (typeof input.timestamp === 'string' ? input.timestamp : input.timestamp.toISOString())
    : undefined;

  const query = timestamp
    ? `
      INSERT INTO user_actions (action_type, workspace_id, actor_user_id, timestamp, metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `
    : `
      INSERT INTO user_actions (action_type, workspace_id, actor_user_id, metadata)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

  const params = timestamp
    ? [input.action_type, input.workspace_id, input.actor_user_id, timestamp, JSON.stringify(input.metadata || {})]
    : [input.action_type, input.workspace_id, input.actor_user_id, JSON.stringify(input.metadata || {})];

  const result = await pool.query(query, params);
  return result.rows[0] as UserAction;
}

// ============================================================
// WORKSPACE STATE (UPSERT - but history is preserved in events)
// ============================================================

/**
 * Upsert workspace state.
 *
 * NOTE: This updates workspace_state, which is mutable.
 * However, all state CHANGES should also be recorded as events
 * in business_events for full history replay.
 */
export async function upsertWorkspaceState(
  input: WorkspaceStateInput
): Promise<WorkspaceState> {
  if (!input.workspace_id || !isValidUUID(input.workspace_id)) {
    throw new Error('workspace_id is required and must be a valid UUID');
  }

  const pool = getPool();

  const query = `
    INSERT INTO workspace_state (workspace_id, current_sales_stage, pending_actions, last_recommendation_id, last_action_taken_at)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (workspace_id) DO UPDATE SET
      current_sales_stage = COALESCE(EXCLUDED.current_sales_stage, workspace_state.current_sales_stage),
      pending_actions = COALESCE(EXCLUDED.pending_actions, workspace_state.pending_actions),
      last_recommendation_id = COALESCE(EXCLUDED.last_recommendation_id, workspace_state.last_recommendation_id),
      last_action_taken_at = COALESCE(EXCLUDED.last_action_taken_at, workspace_state.last_action_taken_at)
    RETURNING *
  `;

  const params = [
    input.workspace_id,
    input.current_sales_stage || null,
    JSON.stringify(input.pending_actions || []),
    input.last_recommendation_id || null,
    input.last_action_taken_at || null,
  ];

  const result = await pool.query(query, params);
  return result.rows[0] as WorkspaceState;
}

/**
 * Get workspace state by ID.
 */
export async function getWorkspaceState(
  workspaceId: string
): Promise<WorkspaceState | null> {
  if (!isValidUUID(workspaceId)) {
    throw new Error('workspace_id must be a valid UUID');
  }

  const pool = getPool();

  const result = await pool.query(
    'SELECT * FROM workspace_state WHERE workspace_id = $1',
    [workspaceId]
  );

  return result.rows[0] as WorkspaceState || null;
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  insertBusinessEvent,
  insertBusinessEvents,
  insertUserAction,
  upsertWorkspaceState,
  getWorkspaceState,
};
