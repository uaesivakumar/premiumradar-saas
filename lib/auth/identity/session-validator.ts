/**
 * Session Validator - Sprint S48 Feature 8
 * Validate sessions are bound to user's locked vertical
 *
 * Ensures:
 * - Session includes correct vertical context
 * - User can only access data for their vertical
 * - API calls include vertical validation
 */

import { VerticalId } from '@/lib/stores/onboarding-store';
import { VerticalSession } from './types';
import { getVerticalLockState, canAccessVertical, getUserVertical } from './vertical-lock';

// Session expiry (24 hours)
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

// In-memory session store (use Redis in production)
const sessionStore = new Map<string, VerticalSession>();

/**
 * Generate session ID
 */
function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Create a new vertical-bound session
 */
export function createVerticalSession(userId: string): VerticalSession | null {
  const lockState = getVerticalLockState(userId);

  if (!lockState) {
    console.warn('[Session Validator] Cannot create session: No vertical lock state');
    return null;
  }

  const now = new Date();
  const session: VerticalSession = {
    sessionId: generateSessionId(),
    userId,
    vertical: lockState.vertical,
    isValid: true,
    validatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_EXPIRY_MS).toISOString(),
  };

  sessionStore.set(session.sessionId, session);
  return session;
}

/**
 * Get session by ID
 */
export function getSession(sessionId: string): VerticalSession | null {
  return sessionStore.get(sessionId) || null;
}

/**
 * Validate session is still valid
 */
export function validateSession(sessionId: string): {
  isValid: boolean;
  error?: string;
  session?: VerticalSession;
} {
  const session = getSession(sessionId);

  if (!session) {
    return { isValid: false, error: 'Session not found' };
  }

  // Check expiry
  const now = new Date();
  if (new Date(session.expiresAt) < now) {
    session.isValid = false;
    sessionStore.set(sessionId, session);
    return { isValid: false, error: 'Session expired' };
  }

  // Check user's vertical lock is still valid
  const lockState = getVerticalLockState(session.userId);
  if (!lockState) {
    session.isValid = false;
    sessionStore.set(sessionId, session);
    return { isValid: false, error: 'User vertical lock not found' };
  }

  // Check if session vertical matches current lock
  if (session.vertical !== lockState.vertical && !lockState.isConsultingMode) {
    session.isValid = false;
    sessionStore.set(sessionId, session);
    return { isValid: false, error: 'Session vertical mismatch' };
  }

  return { isValid: true, session };
}

/**
 * Validate session and vertical access for an operation
 */
export function validateVerticalAccess(
  sessionId: string,
  requestedVertical: VerticalId
): {
  allowed: boolean;
  error?: string;
  currentVertical?: VerticalId;
} {
  const validation = validateSession(sessionId);

  if (!validation.isValid || !validation.session) {
    return { allowed: false, error: validation.error };
  }

  const session = validation.session;

  // Check if user can access requested vertical
  if (!canAccessVertical(session.userId, requestedVertical)) {
    return {
      allowed: false,
      error: 'Access to this vertical is not allowed',
      currentVertical: session.vertical,
    };
  }

  return { allowed: true, currentVertical: session.vertical };
}

/**
 * Refresh session (extend expiry)
 */
export function refreshSession(sessionId: string): VerticalSession | null {
  const session = getSession(sessionId);

  if (!session || !session.isValid) {
    return null;
  }

  const validation = validateSession(sessionId);
  if (!validation.isValid) {
    return null;
  }

  // Extend expiry
  const now = new Date();
  session.validatedAt = now.toISOString();
  session.expiresAt = new Date(now.getTime() + SESSION_EXPIRY_MS).toISOString();
  sessionStore.set(sessionId, session);

  return session;
}

/**
 * Invalidate session
 */
export function invalidateSession(sessionId: string): boolean {
  const session = getSession(sessionId);

  if (!session) {
    return false;
  }

  session.isValid = false;
  sessionStore.set(sessionId, session);
  return true;
}

/**
 * Invalidate all sessions for a user
 */
export function invalidateUserSessions(userId: string): number {
  let count = 0;

  for (const [id, session] of sessionStore.entries()) {
    if (session.userId === userId) {
      session.isValid = false;
      sessionStore.set(id, session);
      count++;
    }
  }

  return count;
}

/**
 * Update session vertical (for consulting mode switches)
 */
export function updateSessionVertical(
  sessionId: string,
  newVertical: VerticalId
): { success: boolean; error?: string } {
  const session = getSession(sessionId);

  if (!session || !session.isValid) {
    return { success: false, error: 'Invalid session' };
  }

  // Check if user can access new vertical
  if (!canAccessVertical(session.userId, newVertical)) {
    return { success: false, error: 'Cannot switch to this vertical' };
  }

  session.vertical = newVertical;
  session.validatedAt = new Date().toISOString();
  sessionStore.set(sessionId, session);

  return { success: true };
}

/**
 * Get all active sessions for a user
 */
export function getUserSessions(userId: string): VerticalSession[] {
  const sessions: VerticalSession[] = [];

  for (const session of sessionStore.values()) {
    if (session.userId === userId && session.isValid) {
      sessions.push(session);
    }
  }

  return sessions;
}

/**
 * Cleanup expired sessions
 */
export function cleanupExpiredSessions(): number {
  const now = new Date();
  let cleaned = 0;

  for (const [id, session] of sessionStore.entries()) {
    if (new Date(session.expiresAt) < now) {
      sessionStore.delete(id);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Middleware helper: Extract and validate session from request
 */
export interface SessionValidationResult {
  isValid: boolean;
  session: VerticalSession | null;
  error?: string;
  userId?: string;
  vertical?: VerticalId;
}

export function validateRequestSession(
  sessionId: string | null | undefined
): SessionValidationResult {
  if (!sessionId) {
    return { isValid: false, session: null, error: 'No session provided' };
  }

  const validation = validateSession(sessionId);

  if (!validation.isValid || !validation.session) {
    return {
      isValid: false,
      session: null,
      error: validation.error,
    };
  }

  return {
    isValid: true,
    session: validation.session,
    userId: validation.session.userId,
    vertical: validation.session.vertical,
  };
}

export default {
  createVerticalSession,
  getSession,
  validateSession,
  validateVerticalAccess,
  refreshSession,
  invalidateSession,
  invalidateUserSessions,
  updateSessionVertical,
  getUserSessions,
  cleanupExpiredSessions,
  validateRequestSession,
};
