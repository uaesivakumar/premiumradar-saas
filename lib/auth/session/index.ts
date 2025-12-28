/**
 * Session Module - Sprint S141.3 + S295
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

// S295: Session Context Service
export {
  type EnterpriseContext,
  type WorkspaceContext,
  type DemoContext,
  type FullSessionContext,
  getFullSessionContext,
  getEnterpriseContext,
  getWorkspaceContext,
  getDemoContext,
  canPerformDemoAction,
  isEnterpriseAdmin,
  isSuperAdmin,
  canManageUsers,
  canManageWorkspaces,
  belongsToEnterprise,
  belongsToWorkspace,
  requireEnterpriseContext,
  requireWorkspaceContext,
  requireEnterpriseAdmin,
  requireSuperAdmin,
} from './session-context';
