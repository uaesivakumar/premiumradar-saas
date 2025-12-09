/**
 * Session Module - Sprint S141.3
 *
 * Exports enhanced session service and types.
 */

export {
  type CreateSessionInput,
  type SessionResult,
  type SuspiciousLoginEvent,
  createSession,
  verifySession,
  getSessionFromCookies,
  refreshSession,
  updateSessionMFA,
  updateSessionSubscription,
  getSuspiciousEvents,
  setSessionCookies,
  clearSessionCookies,
} from './enhanced-session';
