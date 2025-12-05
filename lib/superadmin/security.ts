/**
 * Super Admin Security - Founder-Only Access
 *
 * Multi-layer security for Super Admin panel:
 * 1. Email whitelist (SUPER_ADMIN_EMAILS env var)
 * 2. Access code verification (SUPER_ADMIN_SECRET env var)
 * 3. Session-based authentication with expiry
 * 4. Rate limiting on failed attempts
 * 5. Audit logging for all access
 *
 * CRITICAL: This protects the entire system configuration.
 * If compromised, the entire project is at risk.
 */

import { cookies } from 'next/headers';
import crypto from 'crypto';

// =============================================================================
// CONFIGURATION
// =============================================================================

const SUPER_ADMIN_COOKIE = 'pr_superadmin_session';
const SESSION_DURATION_HOURS = 4; // Session expires after 4 hours
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

// In-memory rate limiting (use Redis in production for multi-instance)
const failedAttempts = new Map<string, { count: number; lastAttempt: number }>();

// =============================================================================
// TYPES
// =============================================================================

export interface SuperAdminSession {
  email: string;
  authenticatedAt: number;
  expiresAt: number;
  ip: string;
  userAgent: string;
  sessionId: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  session?: SuperAdminSession;
  remainingAttempts?: number;
  lockoutMinutes?: number;
}

export interface AccessLog {
  timestamp: string;
  action: 'LOGIN_ATTEMPT' | 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'ACCESS' | 'ACTION';
  email?: string;
  ip: string;
  userAgent: string;
  details?: string;
  success: boolean;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get allowed super admin emails from environment
 */
function getAllowedEmails(): string[] {
  const emails = process.env.SUPER_ADMIN_EMAILS || '';
  return emails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
}

/**
 * Get super admin secret from environment
 */
function getSecret(): string {
  return process.env.SUPER_ADMIN_SECRET || '';
}

/**
 * Generate secure session ID
 */
function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash sensitive data for storage
 */
function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Get session encryption key (MUST be configured)
 */
function getSessionKey(): string {
  const key = process.env.SUPER_ADMIN_SESSION_KEY || process.env.NEXTAUTH_SECRET;
  if (!key) {
    throw new Error('SUPER_ADMIN_SESSION_KEY or NEXTAUTH_SECRET must be configured for session encryption');
  }
  return key;
}

/**
 * Encrypt session data
 */
function encryptSession(session: SuperAdminSession): string {
  const key = getSessionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', crypto.scryptSync(key, 'salt', 32), iv);
  let encrypted = cipher.update(JSON.stringify(session), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt session data
 */
function decryptSession(encrypted: string): SuperAdminSession | null {
  try {
    const key = getSessionKey();
    const [ivHex, data] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', crypto.scryptSync(key, 'salt', 32), iv);
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}

/**
 * Check if IP is rate limited
 */
function isRateLimited(ip: string): { limited: boolean; remainingAttempts: number; lockoutMinutes: number } {
  const record = failedAttempts.get(ip);
  if (!record) {
    return { limited: false, remainingAttempts: MAX_FAILED_ATTEMPTS, lockoutMinutes: 0 };
  }

  const timeSinceLastAttempt = Date.now() - record.lastAttempt;
  const lockoutMs = LOCKOUT_DURATION_MINUTES * 60 * 1000;

  // Clear old records
  if (timeSinceLastAttempt > lockoutMs) {
    failedAttempts.delete(ip);
    return { limited: false, remainingAttempts: MAX_FAILED_ATTEMPTS, lockoutMinutes: 0 };
  }

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    const remainingLockout = Math.ceil((lockoutMs - timeSinceLastAttempt) / 60000);
    return { limited: true, remainingAttempts: 0, lockoutMinutes: remainingLockout };
  }

  return {
    limited: false,
    remainingAttempts: MAX_FAILED_ATTEMPTS - record.count,
    lockoutMinutes: 0
  };
}

/**
 * Record failed attempt
 */
function recordFailedAttempt(ip: string): void {
  const record = failedAttempts.get(ip);
  if (record) {
    record.count++;
    record.lastAttempt = Date.now();
  } else {
    failedAttempts.set(ip, { count: 1, lastAttempt: Date.now() });
  }
}

/**
 * Clear failed attempts on success
 */
function clearFailedAttempts(ip: string): void {
  failedAttempts.delete(ip);
}

// =============================================================================
// AUDIT LOGGING
// =============================================================================

const accessLogs: AccessLog[] = [];

/**
 * Log access attempt
 */
export function logAccess(log: AccessLog): void {
  accessLogs.push(log);

  // Keep only last 1000 logs in memory (use database in production)
  if (accessLogs.length > 1000) {
    accessLogs.shift();
  }

  // Console log for server monitoring
  console.log(`[SUPERADMIN] ${log.action}: ${log.email || 'anonymous'} from ${log.ip} - ${log.success ? 'SUCCESS' : 'FAILED'}${log.details ? ` - ${log.details}` : ''}`);
}

/**
 * Get recent access logs
 */
export function getAccessLogs(limit = 100): AccessLog[] {
  return accessLogs.slice(-limit).reverse();
}

// =============================================================================
// AUTHENTICATION
// =============================================================================

/**
 * Authenticate super admin with email and secret code
 */
export async function authenticate(
  email: string,
  secretCode: string,
  ip: string,
  userAgent: string
): Promise<AuthResult> {
  // Check rate limiting first
  const rateLimit = isRateLimited(ip);
  if (rateLimit.limited) {
    logAccess({
      timestamp: new Date().toISOString(),
      action: 'LOGIN_ATTEMPT',
      email,
      ip,
      userAgent,
      details: `Rate limited - ${rateLimit.lockoutMinutes} minutes remaining`,
      success: false
    });

    return {
      success: false,
      error: `Too many failed attempts. Try again in ${rateLimit.lockoutMinutes} minutes.`,
      lockoutMinutes: rateLimit.lockoutMinutes
    };
  }

  // Check if email is in whitelist
  const allowedEmails = getAllowedEmails();
  const normalizedEmail = email.trim().toLowerCase();

  if (allowedEmails.length === 0) {
    logAccess({
      timestamp: new Date().toISOString(),
      action: 'LOGIN_FAILED',
      email,
      ip,
      userAgent,
      details: 'No super admins configured',
      success: false
    });

    return {
      success: false,
      error: 'Super Admin not configured. Contact system administrator.'
    };
  }

  if (!allowedEmails.includes(normalizedEmail)) {
    recordFailedAttempt(ip);
    const newRateLimit = isRateLimited(ip);

    logAccess({
      timestamp: new Date().toISOString(),
      action: 'LOGIN_FAILED',
      email,
      ip,
      userAgent,
      details: 'Email not in whitelist',
      success: false
    });

    return {
      success: false,
      error: 'Access denied. You are not authorized as a Super Admin.',
      remainingAttempts: newRateLimit.remainingAttempts
    };
  }

  // Check secret code
  const correctSecret = getSecret();
  if (!correctSecret) {
    return {
      success: false,
      error: 'Super Admin secret not configured. Contact system administrator.'
    };
  }

  if (secretCode !== correctSecret) {
    recordFailedAttempt(ip);
    const newRateLimit = isRateLimited(ip);

    logAccess({
      timestamp: new Date().toISOString(),
      action: 'LOGIN_FAILED',
      email,
      ip,
      userAgent,
      details: 'Invalid secret code',
      success: false
    });

    return {
      success: false,
      error: 'Invalid access code.',
      remainingAttempts: newRateLimit.remainingAttempts
    };
  }

  // Success - create session
  clearFailedAttempts(ip);

  const now = Date.now();
  const session: SuperAdminSession = {
    email: normalizedEmail,
    authenticatedAt: now,
    expiresAt: now + (SESSION_DURATION_HOURS * 60 * 60 * 1000),
    ip,
    userAgent,
    sessionId: generateSessionId()
  };

  logAccess({
    timestamp: new Date().toISOString(),
    action: 'LOGIN_SUCCESS',
    email: normalizedEmail,
    ip,
    userAgent,
    success: true
  });

  return {
    success: true,
    session
  };
}

/**
 * Verify current session
 */
export async function verifySession(
  ip: string,
  userAgent: string
): Promise<{ valid: boolean; session?: SuperAdminSession; error?: string }> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SUPER_ADMIN_COOKIE);

    if (!sessionCookie) {
      return { valid: false, error: 'No session found' };
    }

    const session = decryptSession(sessionCookie.value);
    if (!session) {
      return { valid: false, error: 'Invalid session data' };
    }

    // Check expiry
    if (Date.now() > session.expiresAt) {
      logAccess({
        timestamp: new Date().toISOString(),
        action: 'ACCESS',
        email: session.email,
        ip,
        userAgent,
        details: 'Session expired',
        success: false
      });
      return { valid: false, error: 'Session expired. Please log in again.' };
    }

    // Optional: Verify IP hasn't changed (strict mode)
    // if (session.ip !== ip) {
    //   return { valid: false, error: 'Session IP mismatch' };
    // }

    return { valid: true, session };
  } catch (error) {
    return { valid: false, error: 'Session verification failed' };
  }
}

/**
 * Create session cookie
 */
export function createSessionCookie(session: SuperAdminSession): {
  name: string;
  value: string;
  options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict';
    maxAge: number;
    path: string;
  };
} {
  return {
    name: SUPER_ADMIN_COOKIE,
    value: encryptSession(session),
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_DURATION_HOURS * 60 * 60,
      path: '/'  // Use root path so cookie is sent to /api/superadmin/* endpoints
    }
  };
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(): {
  name: string;
  value: string;
  options: { maxAge: number; path: string };
} {
  return {
    name: SUPER_ADMIN_COOKIE,
    value: '',
    options: {
      maxAge: 0,
      path: '/'  // Must match the path used in createSessionCookie
    }
  };
}

/**
 * Check if super admin is configured
 */
export function isSuperAdminConfigured(): boolean {
  const emails = getAllowedEmails();
  const secret = getSecret();
  return emails.length > 0 && secret.length > 0;
}

/**
 * Get session info (for display, no sensitive data)
 */
export function getSessionInfo(session: SuperAdminSession): {
  email: string;
  authenticatedAt: string;
  expiresAt: string;
  remainingMinutes: number;
} {
  const remaining = Math.max(0, Math.ceil((session.expiresAt - Date.now()) / 60000));
  return {
    email: session.email,
    authenticatedAt: new Date(session.authenticatedAt).toISOString(),
    expiresAt: new Date(session.expiresAt).toISOString(),
    remainingMinutes: remaining
  };
}
