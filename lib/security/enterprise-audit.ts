/**
 * S322: Enterprise Audit Logging
 * Part of User & Enterprise Management Program v1.1
 * Phase G - Security, RLS & Audit
 *
 * Audit logging for enterprise-related actions.
 */

import { query } from '@/lib/db/client';

// =============================================================================
// TYPES
// =============================================================================

export type AuditEventType =
  // Enterprise events
  | 'ENTERPRISE_CREATED'
  | 'ENTERPRISE_UPDATED'
  | 'ENTERPRISE_DELETED'
  | 'ENTERPRISE_PLAN_CHANGED'
  // User events
  | 'USER_INVITED'
  | 'USER_JOINED'
  | 'USER_REMOVED'
  | 'USER_ROLE_CHANGED'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_PASSWORD_CHANGED'
  | 'USER_PROFILE_UPDATED'
  // Workspace events
  | 'WORKSPACE_CREATED'
  | 'WORKSPACE_UPDATED'
  | 'WORKSPACE_DELETED'
  | 'WORKSPACE_MEMBER_ADDED'
  | 'WORKSPACE_MEMBER_REMOVED'
  // Demo events
  | 'DEMO_STARTED'
  | 'DEMO_EXTENDED'
  | 'DEMO_CONVERTED'
  | 'DEMO_EXPIRED'
  // Security events
  | 'PERMISSION_DENIED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'API_KEY_CREATED'
  | 'API_KEY_REVOKED';

export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AuditEntry {
  id: string;
  enterprise_id: string;
  user_id: string | null;
  event_type: AuditEventType;
  severity: AuditSeverity;
  resource_type: string;
  resource_id: string | null;
  action: string;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

export interface AuditLogOptions {
  enterprise_id: string;
  user_id?: string;
  event_type: AuditEventType;
  severity?: AuditSeverity;
  resource_type: string;
  resource_id?: string;
  action: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

// =============================================================================
// AUDIT LOGGING
// =============================================================================

/**
 * Log an audit event
 */
export async function logAuditEvent(options: AuditLogOptions): Promise<void> {
  const severity = options.severity || getSeverityForEvent(options.event_type);

  try {
    await query(
      `INSERT INTO enterprise_audit_log (
        enterprise_id, user_id, event_type, severity, resource_type,
        resource_id, action, details, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        options.enterprise_id,
        options.user_id || null,
        options.event_type,
        severity,
        options.resource_type,
        options.resource_id || null,
        options.action,
        JSON.stringify(options.details || {}),
        options.ip_address || null,
        options.user_agent || null,
      ]
    );
  } catch (error) {
    // If audit table doesn't exist, create it and retry
    if (error instanceof Error && error.message.includes('enterprise_audit_log')) {
      await createAuditTable();
      await query(
        `INSERT INTO enterprise_audit_log (
          enterprise_id, user_id, event_type, severity, resource_type,
          resource_id, action, details, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          options.enterprise_id,
          options.user_id || null,
          options.event_type,
          severity,
          options.resource_type,
          options.resource_id || null,
          options.action,
          JSON.stringify(options.details || {}),
          options.ip_address || null,
          options.user_agent || null,
        ]
      );
    } else {
      // Log error but don't throw - audit should not break the application
      console.error('[Audit] Failed to log event:', error);
    }
  }
}

/**
 * Create audit log table if it doesn't exist
 */
async function createAuditTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS enterprise_audit_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      event_type VARCHAR(50) NOT NULL,
      severity VARCHAR(20) NOT NULL DEFAULT 'LOW',
      resource_type VARCHAR(50) NOT NULL,
      resource_id UUID,
      action VARCHAR(255) NOT NULL,
      details JSONB DEFAULT '{}',
      ip_address VARCHAR(50),
      user_agent TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_audit_log_enterprise ON enterprise_audit_log(enterprise_id)
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON enterprise_audit_log(event_type)
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_audit_log_created ON enterprise_audit_log(created_at DESC)
  `);
}

/**
 * Get audit logs for an enterprise
 */
export async function getAuditLogs(
  enterpriseId: string,
  options: {
    event_types?: AuditEventType[];
    severity?: AuditSeverity[];
    start_date?: Date;
    end_date?: Date;
    user_id?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ logs: AuditEntry[]; total: number }> {
  const params: unknown[] = [enterpriseId];
  let whereClause = 'enterprise_id = $1';
  let paramIndex = 2;

  if (options.event_types && options.event_types.length > 0) {
    params.push(options.event_types);
    whereClause += ` AND event_type = ANY($${paramIndex})`;
    paramIndex++;
  }

  if (options.severity && options.severity.length > 0) {
    params.push(options.severity);
    whereClause += ` AND severity = ANY($${paramIndex})`;
    paramIndex++;
  }

  if (options.start_date) {
    params.push(options.start_date);
    whereClause += ` AND created_at >= $${paramIndex}`;
    paramIndex++;
  }

  if (options.end_date) {
    params.push(options.end_date);
    whereClause += ` AND created_at <= $${paramIndex}`;
    paramIndex++;
  }

  if (options.user_id) {
    params.push(options.user_id);
    whereClause += ` AND user_id = $${paramIndex}`;
    paramIndex++;
  }

  // Get total count
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM enterprise_audit_log WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countResult[0]?.count || '0');

  // Get logs with pagination
  const limit = options.limit || 50;
  const offset = options.offset || 0;
  params.push(limit, offset);

  const logs = await query<AuditEntry>(
    `SELECT * FROM enterprise_audit_log
     WHERE ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    params
  );

  return { logs, total };
}

// =============================================================================
// HELPERS
// =============================================================================

function getSeverityForEvent(eventType: AuditEventType): AuditSeverity {
  const severityMap: Record<AuditEventType, AuditSeverity> = {
    ENTERPRISE_CREATED: 'MEDIUM',
    ENTERPRISE_UPDATED: 'LOW',
    ENTERPRISE_DELETED: 'CRITICAL',
    ENTERPRISE_PLAN_CHANGED: 'MEDIUM',
    USER_INVITED: 'LOW',
    USER_JOINED: 'LOW',
    USER_REMOVED: 'MEDIUM',
    USER_ROLE_CHANGED: 'MEDIUM',
    USER_LOGIN: 'LOW',
    USER_LOGOUT: 'LOW',
    USER_PASSWORD_CHANGED: 'MEDIUM',
    USER_PROFILE_UPDATED: 'LOW',
    WORKSPACE_CREATED: 'LOW',
    WORKSPACE_UPDATED: 'LOW',
    WORKSPACE_DELETED: 'MEDIUM',
    WORKSPACE_MEMBER_ADDED: 'LOW',
    WORKSPACE_MEMBER_REMOVED: 'LOW',
    DEMO_STARTED: 'LOW',
    DEMO_EXTENDED: 'LOW',
    DEMO_CONVERTED: 'MEDIUM',
    DEMO_EXPIRED: 'LOW',
    PERMISSION_DENIED: 'MEDIUM',
    SUSPICIOUS_ACTIVITY: 'HIGH',
    API_KEY_CREATED: 'MEDIUM',
    API_KEY_REVOKED: 'MEDIUM',
  };

  return severityMap[eventType] || 'LOW';
}

// =============================================================================
// CONVENIENCE METHODS
// =============================================================================

export const audit = {
  log: logAuditEvent,
  getLogs: getAuditLogs,

  // User events
  userLogin: (enterpriseId: string, userId: string, ip?: string, userAgent?: string) =>
    logAuditEvent({
      enterprise_id: enterpriseId,
      user_id: userId,
      event_type: 'USER_LOGIN',
      resource_type: 'user',
      resource_id: userId,
      action: 'User logged in',
      ip_address: ip,
      user_agent: userAgent,
    }),

  userLogout: (enterpriseId: string, userId: string) =>
    logAuditEvent({
      enterprise_id: enterpriseId,
      user_id: userId,
      event_type: 'USER_LOGOUT',
      resource_type: 'user',
      resource_id: userId,
      action: 'User logged out',
    }),

  userInvited: (enterpriseId: string, inviterId: string, inviteeEmail: string) =>
    logAuditEvent({
      enterprise_id: enterpriseId,
      user_id: inviterId,
      event_type: 'USER_INVITED',
      resource_type: 'user',
      action: `Invited user: ${inviteeEmail}`,
      details: { invitee_email: inviteeEmail },
    }),

  userRoleChanged: (enterpriseId: string, adminId: string, targetUserId: string, newRole: string) =>
    logAuditEvent({
      enterprise_id: enterpriseId,
      user_id: adminId,
      event_type: 'USER_ROLE_CHANGED',
      resource_type: 'user',
      resource_id: targetUserId,
      action: `Changed user role to: ${newRole}`,
      details: { new_role: newRole },
    }),

  // Permission events
  permissionDenied: (enterpriseId: string, userId: string, action: string, resource: string) =>
    logAuditEvent({
      enterprise_id: enterpriseId,
      user_id: userId,
      event_type: 'PERMISSION_DENIED',
      severity: 'MEDIUM',
      resource_type: resource,
      action: `Permission denied: ${action}`,
      details: { attempted_action: action },
    }),
};

export default audit;
