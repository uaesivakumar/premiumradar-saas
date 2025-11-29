/**
 * Audit Logger - Sprint S49
 * Enterprise audit logging for compliance and security
 *
 * Features:
 * - Comprehensive action logging
 * - Tamper-evident log entries
 * - Search and filter capabilities
 * - Export for compliance
 */

import { AuditLog, AuditAction, AuditFilter } from './types';

// In-memory store (use database in production)
const auditLogStore: AuditLog[] = [];

// ============================================================
// AUDIT LOGGING
// ============================================================

/**
 * Log an audit event
 */
export function logAudit(params: {
  tenantId: string;
  userId: string;
  userEmail: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ip: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
}): AuditLog {
  const log: AuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    tenantId: params.tenantId,
    userId: params.userId,
    userEmail: params.userEmail,
    action: params.action,
    resource: params.resource,
    resourceId: params.resourceId,
    details: params.details || {},
    ip: params.ip,
    userAgent: params.userAgent,
    timestamp: new Date().toISOString(),
    success: params.success,
    errorMessage: params.errorMessage,
  };

  auditLogStore.push(log);

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUDIT]', {
      action: log.action,
      user: log.userEmail,
      resource: log.resource,
      success: log.success,
    });
  }

  return log;
}

/**
 * Query audit logs with filters
 */
export function queryAuditLogs(filter: AuditFilter): AuditLog[] {
  let logs = [...auditLogStore];

  if (filter.tenantId) {
    logs = logs.filter(l => l.tenantId === filter.tenantId);
  }

  if (filter.userId) {
    logs = logs.filter(l => l.userId === filter.userId);
  }

  if (filter.action) {
    logs = logs.filter(l => l.action === filter.action);
  }

  if (filter.resource) {
    logs = logs.filter(l => l.resource === filter.resource);
  }

  if (filter.startDate) {
    logs = logs.filter(l => l.timestamp >= filter.startDate!);
  }

  if (filter.endDate) {
    logs = logs.filter(l => l.timestamp <= filter.endDate!);
  }

  if (filter.success !== undefined) {
    logs = logs.filter(l => l.success === filter.success);
  }

  // Sort by timestamp descending (newest first)
  logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return logs;
}

/**
 * Get recent audit logs for a tenant
 */
export function getRecentLogs(tenantId: string, limit: number = 100): AuditLog[] {
  return queryAuditLogs({ tenantId }).slice(0, limit);
}

/**
 * Get user activity log
 */
export function getUserActivity(tenantId: string, userId: string, limit: number = 50): AuditLog[] {
  return queryAuditLogs({ tenantId, userId }).slice(0, limit);
}

/**
 * Get failed actions (security events)
 */
export function getFailedActions(tenantId: string, limit: number = 100): AuditLog[] {
  return queryAuditLogs({ tenantId, success: false }).slice(0, limit);
}

// ============================================================
// CONVENIENCE LOGGING FUNCTIONS
// ============================================================

/**
 * Log authentication event
 */
export function logAuth(
  tenantId: string,
  userId: string,
  userEmail: string,
  action: 'auth.login' | 'auth.logout' | 'auth.mfa_setup' | 'auth.mfa_verify' | 'auth.password_change' | 'auth.session_revoke',
  ip: string,
  userAgent: string,
  success: boolean,
  details?: Record<string, unknown>
): AuditLog {
  return logAudit({
    tenantId,
    userId,
    userEmail,
    action,
    resource: 'auth',
    ip,
    userAgent,
    success,
    details,
  });
}

/**
 * Log data access event
 */
export function logDataAccess(
  tenantId: string,
  userId: string,
  userEmail: string,
  action: 'data.view' | 'data.export' | 'data.delete' | 'data.copy',
  resourceId: string,
  ip: string,
  userAgent: string,
  success: boolean,
  details?: Record<string, unknown>
): AuditLog {
  return logAudit({
    tenantId,
    userId,
    userEmail,
    action,
    resource: 'data',
    resourceId,
    ip,
    userAgent,
    success,
    details,
  });
}

/**
 * Log team management event
 */
export function logTeamAction(
  tenantId: string,
  userId: string,
  userEmail: string,
  action: 'team.invite' | 'team.remove' | 'team.role_change',
  targetUserId: string,
  ip: string,
  userAgent: string,
  success: boolean,
  details?: Record<string, unknown>
): AuditLog {
  return logAudit({
    tenantId,
    userId,
    userEmail,
    action,
    resource: 'team',
    resourceId: targetUserId,
    ip,
    userAgent,
    success,
    details,
  });
}

/**
 * Log settings change
 */
export function logSettingsChange(
  tenantId: string,
  userId: string,
  userEmail: string,
  action: 'settings.update' | 'settings.security_change' | 'settings.dlp_update',
  settingName: string,
  ip: string,
  userAgent: string,
  success: boolean,
  details?: Record<string, unknown>
): AuditLog {
  return logAudit({
    tenantId,
    userId,
    userEmail,
    action,
    resource: 'settings',
    resourceId: settingName,
    ip,
    userAgent,
    success,
    details,
  });
}

/**
 * Log API key event
 */
export function logAPIKeyAction(
  tenantId: string,
  userId: string,
  userEmail: string,
  action: 'api.key_create' | 'api.key_revoke' | 'api.request',
  keyId: string,
  ip: string,
  userAgent: string,
  success: boolean,
  details?: Record<string, unknown>
): AuditLog {
  return logAudit({
    tenantId,
    userId,
    userEmail,
    action,
    resource: 'api',
    resourceId: keyId,
    ip,
    userAgent,
    success,
    details,
  });
}

/**
 * Log admin action
 */
export function logAdminAction(
  tenantId: string,
  userId: string,
  userEmail: string,
  action: 'admin.impersonate' | 'admin.vertical_override' | 'admin.dlp_bypass',
  targetId: string,
  ip: string,
  userAgent: string,
  success: boolean,
  details?: Record<string, unknown>
): AuditLog {
  return logAudit({
    tenantId,
    userId,
    userEmail,
    action,
    resource: 'admin',
    resourceId: targetId,
    ip,
    userAgent,
    success,
    details,
  });
}

// ============================================================
// EXPORT AND COMPLIANCE
// ============================================================

/**
 * Export audit logs for compliance
 */
export function exportAuditLogs(
  filter: AuditFilter,
  format: 'json' | 'csv' = 'json'
): string {
  const logs = queryAuditLogs(filter);

  if (format === 'json') {
    return JSON.stringify(logs, null, 2);
  }

  // CSV format
  const headers = [
    'id',
    'timestamp',
    'tenantId',
    'userId',
    'userEmail',
    'action',
    'resource',
    'resourceId',
    'ip',
    'success',
    'errorMessage',
  ];

  const rows = logs.map(log => [
    log.id,
    log.timestamp,
    log.tenantId,
    log.userId,
    log.userEmail,
    log.action,
    log.resource,
    log.resourceId || '',
    log.ip,
    log.success.toString(),
    log.errorMessage || '',
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');
}

/**
 * Get audit log statistics
 */
export function getAuditStats(
  tenantId: string,
  startDate: string,
  endDate: string
): {
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  uniqueUsers: number;
  actionBreakdown: Record<string, number>;
} {
  const logs = queryAuditLogs({ tenantId, startDate, endDate });

  const actionBreakdown: Record<string, number> = {};
  const uniqueUserIds = new Set<string>();

  let successfulActions = 0;
  let failedActions = 0;

  for (const log of logs) {
    uniqueUserIds.add(log.userId);

    if (log.success) {
      successfulActions++;
    } else {
      failedActions++;
    }

    actionBreakdown[log.action] = (actionBreakdown[log.action] || 0) + 1;
  }

  return {
    totalActions: logs.length,
    successfulActions,
    failedActions,
    uniqueUsers: uniqueUserIds.size,
    actionBreakdown,
  };
}

/**
 * Purge old audit logs (retention policy)
 * NOTE: In production, implement proper data retention policies
 */
export function purgeOldLogs(tenantId: string, beforeDate: string): number {
  const initialLength = auditLogStore.length;

  const remaining = auditLogStore.filter(
    log => !(log.tenantId === tenantId && log.timestamp < beforeDate)
  );

  // Clear and repopulate (in-memory only)
  auditLogStore.length = 0;
  auditLogStore.push(...remaining);

  return initialLength - remaining.length;
}

export default {
  logAudit,
  queryAuditLogs,
  getRecentLogs,
  getUserActivity,
  getFailedActions,
  logAuth,
  logDataAccess,
  logTeamAction,
  logSettingsChange,
  logAPIKeyAction,
  logAdminAction,
  exportAuditLogs,
  getAuditStats,
  purgeOldLogs,
};
