/**
 * Session Security - Sprint S49
 * Enterprise session management and security hardening
 *
 * Features:
 * - Concurrent session limits
 * - Session timeout management
 * - IP binding
 * - Device fingerprinting
 * - Suspicious activity detection
 */

import { SessionSecurityConfig, SecureSession, SecurityEvent, SecurityEventType } from './types';

// In-memory stores (use database in production)
const configStore = new Map<string, SessionSecurityConfig>();
const sessionStore = new Map<string, SecureSession[]>();
const securityEventStore: SecurityEvent[] = [];

// ============================================================
// DEFAULT CONFIGURATION
// ============================================================

const DEFAULT_SESSION_CONFIG: SessionSecurityConfig = {
  tenantId: '',
  maxConcurrentSessions: 5,
  sessionTimeoutMinutes: 60,
  requireMfaForSensitive: true,
  bindToIP: false,
  bindToDevice: false,
  revokeOnPasswordChange: true,
  inactivityTimeoutMinutes: 30,
};

// ============================================================
// SESSION CONFIG MANAGEMENT
// ============================================================

/**
 * Get session security config for a tenant
 */
export function getSessionConfig(tenantId: string): SessionSecurityConfig {
  return configStore.get(tenantId) || { ...DEFAULT_SESSION_CONFIG, tenantId };
}

/**
 * Set session security config
 */
export function setSessionConfig(
  tenantId: string,
  config: Partial<SessionSecurityConfig>
): SessionSecurityConfig {
  const existing = getSessionConfig(tenantId);
  const updated = { ...existing, ...config, tenantId };
  configStore.set(tenantId, updated);
  return updated;
}

// ============================================================
// SESSION MANAGEMENT
// ============================================================

/**
 * Create a new secure session
 */
export function createSession(params: {
  userId: string;
  tenantId: string;
  ip: string;
  userAgent: string;
  deviceFingerprint?: string;
  mfaVerified?: boolean;
}): { session: SecureSession | null; error?: string } {
  const config = getSessionConfig(params.tenantId);

  // Check concurrent session limit
  const userSessions = getUserSessions(params.tenantId, params.userId);
  const activeSessions = userSessions.filter(s => s.isValid);

  if (activeSessions.length >= config.maxConcurrentSessions) {
    // Revoke oldest session if limit exceeded
    const oldest = activeSessions.sort(
      (a, b) => a.createdAt.localeCompare(b.createdAt)
    )[0];

    if (oldest) {
      revokeSession(params.tenantId, oldest.id);
    }
  }

  // Calculate expiry
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.sessionTimeoutMinutes * 60 * 1000);

  const session: SecureSession = {
    id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    userId: params.userId,
    tenantId: params.tenantId,
    ip: params.ip,
    userAgent: params.userAgent,
    deviceFingerprint: params.deviceFingerprint,
    createdAt: now.toISOString(),
    lastActivityAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    mfaVerified: params.mfaVerified || false,
    isValid: true,
  };

  // Store session
  const sessions = sessionStore.get(params.tenantId) || [];
  sessions.push(session);
  sessionStore.set(params.tenantId, sessions);

  return { session };
}

/**
 * Validate a session
 */
export function validateSession(
  tenantId: string,
  sessionId: string,
  currentIP: string,
  currentUserAgent: string
): { valid: boolean; reason?: string; session?: SecureSession } {
  const sessions = sessionStore.get(tenantId) || [];
  const session = sessions.find(s => s.id === sessionId);

  if (!session) {
    return { valid: false, reason: 'Session not found' };
  }

  if (!session.isValid) {
    return { valid: false, reason: 'Session has been revoked' };
  }

  // Check expiry
  const now = new Date();
  if (new Date(session.expiresAt) < now) {
    session.isValid = false;
    return { valid: false, reason: 'Session has expired' };
  }

  // Check inactivity
  const config = getSessionConfig(tenantId);
  const lastActivity = new Date(session.lastActivityAt);
  const inactivityLimit = config.inactivityTimeoutMinutes * 60 * 1000;

  if (now.getTime() - lastActivity.getTime() > inactivityLimit) {
    session.isValid = false;
    return { valid: false, reason: 'Session timed out due to inactivity' };
  }

  // Check IP binding
  if (config.bindToIP && session.ip !== currentIP) {
    logSecurityEvent({
      type: 'session_anomaly',
      severity: 'medium',
      tenantId,
      userId: session.userId,
      ip: currentIP,
      details: {
        originalIP: session.ip,
        currentIP,
        reason: 'IP address changed',
      },
    });

    session.isValid = false;
    return { valid: false, reason: 'IP address mismatch' };
  }

  // Check device binding (simplified - compare user agent)
  if (config.bindToDevice && session.userAgent !== currentUserAgent) {
    logSecurityEvent({
      type: 'session_anomaly',
      severity: 'low',
      tenantId,
      userId: session.userId,
      ip: currentIP,
      details: {
        originalUA: session.userAgent,
        currentUA: currentUserAgent,
        reason: 'User agent changed',
      },
    });

    // Don't invalidate for UA changes, just log
  }

  // Update last activity
  session.lastActivityAt = now.toISOString();

  return { valid: true, session };
}

/**
 * Revoke a session
 */
export function revokeSession(tenantId: string, sessionId: string): boolean {
  const sessions = sessionStore.get(tenantId) || [];
  const session = sessions.find(s => s.id === sessionId);

  if (session) {
    session.isValid = false;
    return true;
  }

  return false;
}

/**
 * Revoke all sessions for a user
 */
export function revokeUserSessions(tenantId: string, userId: string): number {
  const sessions = sessionStore.get(tenantId) || [];
  let revoked = 0;

  for (const session of sessions) {
    if (session.userId === userId && session.isValid) {
      session.isValid = false;
      revoked++;
    }
  }

  return revoked;
}

/**
 * Get user's active sessions
 */
export function getUserSessions(tenantId: string, userId: string): SecureSession[] {
  const sessions = sessionStore.get(tenantId) || [];
  return sessions.filter(s => s.userId === userId);
}

/**
 * Get all active sessions for a tenant
 */
export function getActiveSessions(tenantId: string): SecureSession[] {
  const sessions = sessionStore.get(tenantId) || [];
  return sessions.filter(s => s.isValid);
}

/**
 * Extend session expiry
 */
export function extendSession(tenantId: string, sessionId: string, minutes: number): boolean {
  const sessions = sessionStore.get(tenantId) || [];
  const session = sessions.find(s => s.id === sessionId);

  if (session && session.isValid) {
    const newExpiry = new Date(new Date(session.expiresAt).getTime() + minutes * 60 * 1000);
    session.expiresAt = newExpiry.toISOString();
    return true;
  }

  return false;
}

/**
 * Mark session as MFA verified
 */
export function markMFAVerified(tenantId: string, sessionId: string): boolean {
  const sessions = sessionStore.get(tenantId) || [];
  const session = sessions.find(s => s.id === sessionId);

  if (session && session.isValid) {
    session.mfaVerified = true;
    return true;
  }

  return false;
}

// ============================================================
// SECURITY EVENTS
// ============================================================

/**
 * Log a security event
 */
export function logSecurityEvent(params: {
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  tenantId: string;
  userId?: string;
  ip: string;
  details: Record<string, unknown>;
}): SecurityEvent {
  const event: SecurityEvent = {
    id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    type: params.type,
    severity: params.severity,
    tenantId: params.tenantId,
    userId: params.userId,
    ip: params.ip,
    details: params.details,
    timestamp: new Date().toISOString(),
    resolved: false,
  };

  securityEventStore.push(event);

  // Log critical events
  if (params.severity === 'critical' || params.severity === 'high') {
    console.warn('[SECURITY EVENT]', event);
  }

  return event;
}

/**
 * Get security events for a tenant
 */
export function getSecurityEvents(
  tenantId: string,
  options?: {
    type?: SecurityEventType;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    resolved?: boolean;
    limit?: number;
  }
): SecurityEvent[] {
  let events = securityEventStore.filter(e => e.tenantId === tenantId);

  if (options?.type) {
    events = events.filter(e => e.type === options.type);
  }

  if (options?.severity) {
    events = events.filter(e => e.severity === options.severity);
  }

  if (options?.resolved !== undefined) {
    events = events.filter(e => e.resolved === options.resolved);
  }

  // Sort by timestamp descending
  events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  if (options?.limit) {
    events = events.slice(0, options.limit);
  }

  return events;
}

/**
 * Resolve a security event
 */
export function resolveSecurityEvent(
  eventId: string,
  resolvedBy: string
): boolean {
  const event = securityEventStore.find(e => e.id === eventId);

  if (event && !event.resolved) {
    event.resolved = true;
    event.resolvedAt = new Date().toISOString();
    event.resolvedBy = resolvedBy;
    return true;
  }

  return false;
}

// ============================================================
// SUSPICIOUS ACTIVITY DETECTION
// ============================================================

/**
 * Check for impossible travel
 * (Login from geographically distant location in short time)
 */
export function checkImpossibleTravel(
  tenantId: string,
  userId: string,
  currentIP: string,
  currentTime: Date
): { suspicious: boolean; details?: Record<string, unknown> } {
  const sessions = getUserSessions(tenantId, userId);
  const recentSessions = sessions.filter(s => {
    const sessionTime = new Date(s.createdAt);
    const hourAgo = new Date(currentTime.getTime() - 60 * 60 * 1000);
    return sessionTime > hourAgo && s.ip !== currentIP;
  });

  if (recentSessions.length > 0) {
    // In production, use GeoIP to check actual distance
    logSecurityEvent({
      type: 'impossible_travel',
      severity: 'high',
      tenantId,
      userId,
      ip: currentIP,
      details: {
        previousIPs: recentSessions.map(s => s.ip),
        timeWindow: '1 hour',
      },
    });

    return {
      suspicious: true,
      details: {
        previousSessions: recentSessions.length,
        differentIPs: [...new Set(recentSessions.map(s => s.ip))],
      },
    };
  }

  return { suspicious: false };
}

/**
 * Check for brute force attempts
 */
export function checkBruteForce(
  tenantId: string,
  userId: string,
  ip: string,
  failedAttempts: number,
  windowMinutes: number = 15
): { blocked: boolean; lockoutUntil?: string } {
  const threshold = 5; // Max failed attempts

  if (failedAttempts >= threshold) {
    const lockoutMinutes = Math.min(failedAttempts * 5, 60); // Progressive lockout
    const lockoutUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);

    logSecurityEvent({
      type: 'brute_force_attempt',
      severity: 'high',
      tenantId,
      userId,
      ip,
      details: {
        failedAttempts,
        windowMinutes,
        lockoutMinutes,
      },
    });

    return {
      blocked: true,
      lockoutUntil: lockoutUntil.toISOString(),
    };
  }

  return { blocked: false };
}

/**
 * Clean up expired sessions
 */
export function cleanupExpiredSessions(tenantId: string): number {
  const sessions = sessionStore.get(tenantId) || [];
  const now = new Date();
  let cleaned = 0;

  for (const session of sessions) {
    if (session.isValid && new Date(session.expiresAt) < now) {
      session.isValid = false;
      cleaned++;
    }
  }

  return cleaned;
}

export default {
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
};
