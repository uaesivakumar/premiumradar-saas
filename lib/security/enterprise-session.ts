/**
 * S324: Session Security for Enterprise
 * Part of User & Enterprise Management Program v1.1
 * Phase G - Security, RLS & Audit
 *
 * Enhanced session security for enterprise environments.
 */

import { query, queryOne } from '@/lib/db/client';
import { audit } from './enterprise-audit';

// =============================================================================
// TYPES
// =============================================================================

export interface SessionInfo {
  session_id: string;
  user_id: string;
  enterprise_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
  last_activity: Date;
  expires_at: Date;
  is_valid: boolean;
}

export interface SessionSecurityConfig {
  max_sessions_per_user: number;
  session_timeout_minutes: number;
  require_ip_match: boolean;
  require_user_agent_match: boolean;
}

// =============================================================================
// DEFAULT CONFIG
// =============================================================================

const DEFAULT_CONFIG: SessionSecurityConfig = {
  max_sessions_per_user: 5,
  session_timeout_minutes: 60 * 24, // 24 hours
  require_ip_match: false,
  require_user_agent_match: false,
};

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

/**
 * Get enterprise session security config
 */
export async function getSessionConfig(enterpriseId: string): Promise<SessionSecurityConfig> {
  const enterprise = await queryOne<{
    session_config: Record<string, unknown> | null;
  }>(
    'SELECT session_config FROM enterprises WHERE id = $1',
    [enterpriseId]
  );

  if (!enterprise?.session_config) {
    return DEFAULT_CONFIG;
  }

  return {
    ...DEFAULT_CONFIG,
    ...enterprise.session_config,
  };
}

/**
 * Create a new session record
 */
export async function createSessionRecord(
  userId: string,
  enterpriseId: string | null,
  ipAddress: string | null,
  userAgent: string | null
): Promise<string> {
  const sessionId = crypto.randomUUID();

  // Get timeout config
  let timeoutMinutes = DEFAULT_CONFIG.session_timeout_minutes;
  if (enterpriseId) {
    const config = await getSessionConfig(enterpriseId);
    timeoutMinutes = config.session_timeout_minutes;

    // Check max sessions
    await enforceMaxSessions(userId, config.max_sessions_per_user);
  }

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + timeoutMinutes);

  await query(
    `INSERT INTO user_sessions (
      id, user_id, enterprise_id, ip_address, user_agent,
      created_at, last_activity, expires_at, is_valid
    ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), $6, true)`,
    [sessionId, userId, enterpriseId, ipAddress, userAgent, expiresAt]
  );

  // Audit login
  if (enterpriseId) {
    await audit.userLogin(enterpriseId, userId, ipAddress || undefined, userAgent || undefined);
  }

  return sessionId;
}

/**
 * Validate a session
 */
export async function validateSession(
  sessionId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ valid: boolean; reason?: string; session?: SessionInfo }> {
  const session = await queryOne<SessionInfo>(
    `SELECT * FROM user_sessions WHERE id = $1`,
    [sessionId]
  );

  if (!session) {
    return { valid: false, reason: 'Session not found' };
  }

  if (!session.is_valid) {
    return { valid: false, reason: 'Session invalidated' };
  }

  if (new Date(session.expires_at) < new Date()) {
    await invalidateSession(sessionId, 'expired');
    return { valid: false, reason: 'Session expired' };
  }

  // Enterprise-specific security checks
  if (session.enterprise_id) {
    const config = await getSessionConfig(session.enterprise_id);

    // IP match check
    if (config.require_ip_match && ipAddress && session.ip_address !== ipAddress) {
      await invalidateSession(sessionId, 'ip_mismatch');
      return { valid: false, reason: 'IP address mismatch' };
    }

    // User agent match check
    if (config.require_user_agent_match && userAgent && session.user_agent !== userAgent) {
      await invalidateSession(sessionId, 'user_agent_mismatch');
      return { valid: false, reason: 'User agent mismatch' };
    }
  }

  // Update last activity
  await updateSessionActivity(sessionId);

  return { valid: true, session };
}

/**
 * Update session last activity
 */
export async function updateSessionActivity(sessionId: string): Promise<void> {
  await query(
    `UPDATE user_sessions SET last_activity = NOW() WHERE id = $1`,
    [sessionId]
  );
}

/**
 * Invalidate a session
 */
export async function invalidateSession(
  sessionId: string,
  reason: string = 'logout'
): Promise<void> {
  const session = await queryOne<{ user_id: string; enterprise_id: string | null }>(
    'SELECT user_id, enterprise_id FROM user_sessions WHERE id = $1',
    [sessionId]
  );

  await query(
    `UPDATE user_sessions SET is_valid = false, invalidated_at = NOW(), invalidation_reason = $2 WHERE id = $1`,
    [sessionId, reason]
  );

  // Audit logout
  if (session?.enterprise_id) {
    await audit.userLogout(session.enterprise_id, session.user_id);
  }
}

/**
 * Invalidate all sessions for a user
 */
export async function invalidateAllUserSessions(
  userId: string,
  reason: string = 'logout_all'
): Promise<number> {
  const result = await query(
    `UPDATE user_sessions SET is_valid = false, invalidated_at = NOW(), invalidation_reason = $2
     WHERE user_id = $1 AND is_valid = true
     RETURNING id`,
    [userId, reason]
  );

  return result.length;
}

/**
 * Invalidate all sessions for an enterprise
 */
export async function invalidateAllEnterpriseSessions(
  enterpriseId: string,
  reason: string = 'enterprise_action'
): Promise<number> {
  const result = await query(
    `UPDATE user_sessions SET is_valid = false, invalidated_at = NOW(), invalidation_reason = $2
     WHERE enterprise_id = $1 AND is_valid = true
     RETURNING id`,
    [enterpriseId, reason]
  );

  return result.length;
}

/**
 * Enforce maximum sessions per user
 */
async function enforceMaxSessions(userId: string, maxSessions: number): Promise<void> {
  // Get count of active sessions
  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM user_sessions WHERE user_id = $1 AND is_valid = true`,
    [userId]
  );

  const activeCount = parseInt(countResult?.count || '0');

  if (activeCount >= maxSessions) {
    // Invalidate oldest sessions to make room
    const sessionsToRemove = activeCount - maxSessions + 1;

    await query(
      `UPDATE user_sessions SET is_valid = false, invalidated_at = NOW(), invalidation_reason = 'max_sessions_exceeded'
       WHERE id IN (
         SELECT id FROM user_sessions
         WHERE user_id = $1 AND is_valid = true
         ORDER BY last_activity ASC
         LIMIT $2
       )`,
      [userId, sessionsToRemove]
    );
  }
}

/**
 * Get active sessions for a user
 */
export async function getUserActiveSessions(userId: string): Promise<SessionInfo[]> {
  return query<SessionInfo>(
    `SELECT * FROM user_sessions
     WHERE user_id = $1 AND is_valid = true AND expires_at > NOW()
     ORDER BY last_activity DESC`,
    [userId]
  );
}

/**
 * Cleanup expired sessions (run periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await query(
    `DELETE FROM user_sessions WHERE expires_at < NOW() - INTERVAL '7 days' RETURNING id`
  );

  return result.length;
}

// =============================================================================
// SESSION SECURITY CHECKS
// =============================================================================

/**
 * Check for suspicious activity
 */
export async function checkSuspiciousActivity(
  userId: string,
  ipAddress: string
): Promise<{ suspicious: boolean; reason?: string }> {
  // Check for multiple IPs in short time
  const recentSessions = await query<{ ip_address: string }>(
    `SELECT DISTINCT ip_address FROM user_sessions
     WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
    [userId]
  );

  if (recentSessions.length > 3) {
    return {
      suspicious: true,
      reason: 'Multiple IP addresses in short time period',
    };
  }

  // Check for rapid session creation
  const sessionCount = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM user_sessions
     WHERE user_id = $1 AND created_at > NOW() - INTERVAL '5 minutes'`,
    [userId]
  );

  if (parseInt(sessionCount?.count || '0') > 5) {
    return {
      suspicious: true,
      reason: 'Rapid session creation detected',
    };
  }

  return { suspicious: false };
}

/**
 * Record suspicious activity
 */
export async function recordSuspiciousActivity(
  userId: string,
  enterpriseId: string | null,
  reason: string,
  ipAddress?: string
): Promise<void> {
  if (enterpriseId) {
    await audit.log({
      enterprise_id: enterpriseId,
      user_id: userId,
      event_type: 'SUSPICIOUS_ACTIVITY',
      severity: 'HIGH',
      resource_type: 'session',
      action: reason,
      ip_address: ipAddress,
    });
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const sessionSecurity = {
  // Config
  getConfig: getSessionConfig,

  // Session management
  create: createSessionRecord,
  validate: validateSession,
  updateActivity: updateSessionActivity,
  invalidate: invalidateSession,
  invalidateAllForUser: invalidateAllUserSessions,
  invalidateAllForEnterprise: invalidateAllEnterpriseSessions,
  getUserSessions: getUserActiveSessions,
  cleanup: cleanupExpiredSessions,

  // Security checks
  checkSuspicious: checkSuspiciousActivity,
  recordSuspicious: recordSuspiciousActivity,
};

export default sessionSecurity;
