/**
 * Enterprise Security Types - Sprint S49
 * Types for DLP, access controls, and audit logging
 */

// ============================================================
// DLP (Data Loss Prevention)
// ============================================================

export interface DLPPolicy {
  id: string;
  name: string;
  enabled: boolean;
  rules: DLPRule[];
  actions: DLPAction[];
  createdAt: string;
  updatedAt: string;
}

export interface DLPRule {
  id: string;
  type: DLPRuleType;
  pattern?: string;
  threshold?: number;
  fields?: string[];
  enabled: boolean;
}

export type DLPRuleType =
  | 'pii_detection'        // Detect PII (emails, phones, SSN)
  | 'sensitive_keywords'   // Custom keyword detection
  | 'bulk_export'          // Large data exports
  | 'external_share'       // Sharing outside domain
  | 'copy_paste'           // Copy/paste detection
  | 'screenshot'           // Screenshot detection (limited)
  | 'download_limit';      // Download frequency limits

export type DLPAction =
  | 'log'                  // Log the event
  | 'warn'                 // Show warning to user
  | 'block'                // Block the action
  | 'notify_admin'         // Notify workspace admin
  | 'require_approval';    // Require admin approval

export interface DLPViolation {
  id: string;
  tenantId: string;
  userId: string;
  ruleId: string;
  ruleType: DLPRuleType;
  action: string;
  data?: Record<string, unknown>;
  blocked: boolean;
  timestamp: string;
}

// ============================================================
// Copy Protection & Export Controls
// ============================================================

export interface ExportControl {
  tenantId: string;
  enabled: boolean;
  restrictions: ExportRestriction[];
  approvalRequired: boolean;
  approvers: string[];
  maxRecordsPerExport: number;
  maxExportsPerDay: number;
  allowedFormats: ExportFormat[];
  watermarkEnabled: boolean;
}

export type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'json';

export interface ExportRestriction {
  field: string;
  action: 'redact' | 'mask' | 'exclude' | 'hash';
  pattern?: string;
}

export interface CopyProtection {
  tenantId: string;
  enabled: boolean;
  blockCopyPaste: boolean;
  blockScreenshot: boolean;
  blockPrint: boolean;
  blockRightClick: boolean;
  allowedDomains: string[];
  sensitiveFields: string[];
}

// ============================================================
// Domain & IP Whitelisting
// ============================================================

export interface DomainWhitelist {
  tenantId: string;
  enabled: boolean;
  mode: 'allow' | 'block';
  domains: DomainEntry[];
  enforceSSODomain: boolean;
}

export interface DomainEntry {
  domain: string;
  addedAt: string;
  addedBy: string;
  reason?: string;
}

export interface IPAllowlist {
  tenantId: string;
  enabled: boolean;
  mode: 'allow' | 'block';
  entries: IPEntry[];
  bypassForAdmins: boolean;
}

export interface IPEntry {
  ip: string;
  type: 'ipv4' | 'ipv6' | 'cidr';
  label?: string;
  addedAt: string;
  addedBy: string;
  expiresAt?: string;
}

// ============================================================
// Permission Guards
// ============================================================

export interface PermissionGuard {
  resource: string;
  action: string;
  conditions: PermissionCondition[];
  deniedMessage?: string;
}

export interface PermissionCondition {
  type: 'role' | 'permission' | 'tenant' | 'time' | 'ip' | 'mfa';
  operator: 'equals' | 'in' | 'not_in' | 'matches';
  value: string | string[];
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  requiredAction?: string;
}

// ============================================================
// Audit Logging
// ============================================================

export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details: Record<string, unknown>;
  ip: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
  errorMessage?: string;
}

export type AuditAction =
  // Auth
  | 'auth.login'
  | 'auth.logout'
  | 'auth.mfa_setup'
  | 'auth.mfa_verify'
  | 'auth.password_change'
  | 'auth.session_revoke'
  // Data
  | 'data.view'
  | 'data.export'
  | 'data.delete'
  | 'data.copy'
  // Team
  | 'team.invite'
  | 'team.remove'
  | 'team.role_change'
  // Settings
  | 'settings.update'
  | 'settings.security_change'
  | 'settings.dlp_update'
  // API
  | 'api.key_create'
  | 'api.key_revoke'
  | 'api.request'
  // Admin
  | 'admin.impersonate'
  | 'admin.vertical_override'
  | 'admin.dlp_bypass';

export interface AuditFilter {
  tenantId?: string;
  userId?: string;
  action?: AuditAction;
  resource?: string;
  startDate?: string;
  endDate?: string;
  success?: boolean;
}

// ============================================================
// Session Security
// ============================================================

export interface SessionSecurityConfig {
  tenantId: string;
  maxConcurrentSessions: number;
  sessionTimeoutMinutes: number;
  requireMfaForSensitive: boolean;
  bindToIP: boolean;
  bindToDevice: boolean;
  revokeOnPasswordChange: boolean;
  inactivityTimeoutMinutes: number;
}

export interface SecureSession {
  id: string;
  userId: string;
  tenantId: string;
  ip: string;
  userAgent: string;
  deviceFingerprint?: string;
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
  mfaVerified: boolean;
  isValid: boolean;
}

// ============================================================
// Security Events
// ============================================================

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  tenantId: string;
  userId?: string;
  ip: string;
  details: Record<string, unknown>;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export type SecurityEventType =
  | 'brute_force_attempt'
  | 'suspicious_ip'
  | 'dlp_violation'
  | 'unauthorized_access'
  | 'session_anomaly'
  | 'export_abuse'
  | 'api_abuse'
  | 'impossible_travel';
