/**
 * OS Control Plane Audit Logger
 *
 * Every write to OS control plane tables MUST be logged here.
 * This is a non-negotiable requirement from the execution contract.
 */

import { query } from './client';

export type AuditAction =
  | 'create_vertical'
  | 'update_vertical'
  | 'activate_vertical'
  | 'deactivate_vertical'
  | 'delete_vertical'
  | 'create_sub_vertical'
  | 'update_sub_vertical'
  | 'delete_sub_vertical'
  | 'create_persona'
  | 'update_persona'
  | 'delete_persona'
  | 'update_policy'
  | 'stage_policy'
  | 'activate_policy'
  | 'create_binding'
  | 'update_binding'
  | 'delete_binding';

export type AuditTargetType =
  | 'vertical'
  | 'sub_vertical'
  | 'persona'
  | 'policy'
  | 'binding';

interface AuditLogParams {
  actorUser: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId?: string;
  requestJson?: Record<string, unknown>;
  resultJson?: Record<string, unknown>;
  success: boolean;
  errorMessage?: string;
}

/**
 * Log a control plane audit event
 * This MUST be called for every POST/PUT/DELETE operation
 */
export async function logControlPlaneAudit(params: AuditLogParams): Promise<void> {
  const {
    actorUser,
    action,
    targetType,
    targetId,
    requestJson,
    resultJson,
    success,
    errorMessage,
  } = params;

  try {
    await query(
      `INSERT INTO os_controlplane_audit
       (actor_user, action, target_type, target_id, request_json, result_json, success, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        actorUser,
        action,
        targetType,
        targetId || null,
        requestJson ? JSON.stringify(requestJson) : null,
        resultJson ? JSON.stringify(resultJson) : null,
        success,
        errorMessage || null,
      ]
    );
  } catch (error) {
    // Log but don't fail the operation if audit logging fails
    console.error('[ControlPlaneAudit] Failed to log audit event:', error);
    console.error('[ControlPlaneAudit] Event:', { actorUser, action, targetType, targetId });
  }
}

/**
 * Validate key format: lowercase snake_case only
 */
export function validateKey(key: string): { valid: boolean; error?: string } {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'Key is required' };
  }

  const snakeCaseRegex = /^[a-z][a-z0-9_]*$/;
  if (!snakeCaseRegex.test(key)) {
    return { valid: false, error: 'Key must be lowercase snake_case (e.g., saas_sales)' };
  }

  return { valid: true };
}

/**
 * Standard error responses per contract
 */
export function conflictError(field: string) {
  return Response.json(
    { error: 'conflict', field, message: `A record with this ${field} already exists` },
    { status: 409 }
  );
}

export function validationError(field: string, message?: string) {
  return Response.json(
    { error: 'validation', field, message: message || `${field} is required or invalid` },
    { status: 400 }
  );
}

export function notFoundError(resource = 'record') {
  return Response.json(
    { error: 'not_found', message: `${resource} not found` },
    { status: 404 }
  );
}

export function serverError(message = 'Internal server error') {
  return Response.json(
    { error: 'server_error', message },
    { status: 500 }
  );
}
