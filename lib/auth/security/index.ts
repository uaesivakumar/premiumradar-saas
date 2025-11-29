/**
 * Enterprise Security Module - Sprint S49
 * Unified exports for all security features
 *
 * Features included:
 * - DLP (Data Loss Prevention)
 * - Export Controls & Copy Protection
 * - Domain Whitelisting
 * - IP Allowlisting
 * - Permission Guards
 * - Audit Logging
 * - Session Security
 */

// ============================================================
// TYPE EXPORTS
// ============================================================

export type {
  // DLP Types
  DLPPolicy,
  DLPRule,
  DLPRuleType,
  DLPAction,
  DLPViolation,
  // Export Control Types
  ExportControl,
  ExportFormat,
  ExportRestriction,
  CopyProtection,
  // Domain/IP Types
  DomainWhitelist,
  DomainEntry,
  IPAllowlist,
  IPEntry,
  // Permission Types
  PermissionGuard,
  PermissionCondition,
  PermissionCheckResult,
  // Audit Types
  AuditLog,
  AuditAction,
  AuditFilter,
  // Session Types
  SessionSecurityConfig,
  SecureSession,
  SecurityEvent,
  SecurityEventType,
} from './types';

// ============================================================
// DLP ENGINE
// ============================================================

export {
  getDLPPolicies,
  setDLPPolicies,
  checkDLP,
  getDLPViolations,
  checkExportAllowed,
  sanitizeContent,
  createDLPPolicy,
} from './dlp-engine';

import dlpEngine from './dlp-engine';
export { dlpEngine };

// ============================================================
// EXPORT CONTROLS
// ============================================================

export {
  getExportControls,
  setExportControls,
  checkExport,
  applyExportRestrictions,
  generateWatermark,
  requestExportApproval,
  reviewExportApproval,
  getPendingExportApprovals,
  getCopyProtection,
  setCopyProtection,
  getCopyProtectionScript,
  isDomainAllowed as isExportDomainAllowed,
} from './export-controls';

export type { ExportApprovalRequest, ExportResult } from './export-controls';

import exportControls from './export-controls';
export { exportControls };

// ============================================================
// DOMAIN WHITELIST
// ============================================================

export {
  getDomainWhitelist,
  setDomainWhitelist,
  addDomain,
  removeDomain,
  isDomainAllowed,
  checkSSODomainEnforcement,
  bulkAddDomains,
  listDomains,
  isValidDomain,
} from './domain-whitelist';

import domainWhitelist from './domain-whitelist';
export { domainWhitelist };

// ============================================================
// IP ALLOWLIST
// ============================================================

export {
  getIPAllowlist,
  setIPAllowlist,
  addIP,
  removeIP,
  isIPAllowed,
  listIPs,
  bulkAddIPs,
  isValidIP,
  getClientIP,
} from './ip-allowlist';

import ipAllowlist from './ip-allowlist';
export { ipAllowlist };

// ============================================================
// PERMISSION GUARDS
// ============================================================

export {
  getGuards,
  addGuard,
  removeGuard,
  checkPermission,
  canExport,
  canManageTeam,
  canChangeSecuritySettings,
  canAccessBilling,
  createTimeGuard,
  createMFAGuard,
} from './permission-guards';

export type { PermissionContext } from './permission-guards';

import permissionGuards from './permission-guards';
export { permissionGuards };

// ============================================================
// AUDIT LOGGER
// ============================================================

export {
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
} from './audit-logger';

import auditLogger from './audit-logger';
export { auditLogger };

// ============================================================
// SESSION SECURITY
// ============================================================

export {
  getSessionConfig,
  setSessionConfig,
  createSession,
  validateSession,
  revokeSession,
  revokeUserSessions,
  getUserSessions,
  getActiveSessions,
  extendSession,
  markMFAVerified,
  logSecurityEvent,
  getSecurityEvents,
  resolveSecurityEvent,
  checkImpossibleTravel,
  checkBruteForce,
  cleanupExpiredSessions,
} from './session-security';

import sessionSecurity from './session-security';
export { sessionSecurity };

// ============================================================
// UNIFIED SECURITY OBJECT
// ============================================================

/**
 * Unified security module for convenient imports
 *
 * Usage:
 * ```typescript
 * import { security } from '@/lib/auth/security';
 *
 * // DLP
 * security.dlp.checkDLP(tenantId, userId, content, 'export');
 *
 * // Export Controls
 * security.exports.checkExport(tenantId, userId, format, recordCount);
 *
 * // Domain Whitelist
 * security.domains.isDomainAllowed(tenantId, email);
 *
 * // IP Allowlist
 * security.ips.isIPAllowed(tenantId, ip);
 *
 * // Permissions
 * security.permissions.checkPermission(resource, action, context);
 *
 * // Audit
 * security.audit.logDataAccess(tenantId, userId, email, 'data.export', ...);
 *
 * // Sessions
 * security.sessions.createSession({ ... });
 * ```
 */
export const security = {
  dlp: dlpEngine,
  exports: exportControls,
  domains: domainWhitelist,
  ips: ipAllowlist,
  permissions: permissionGuards,
  audit: auditLogger,
  sessions: sessionSecurity,
};

export default security;
