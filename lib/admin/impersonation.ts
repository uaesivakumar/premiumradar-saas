/**
 * Tenant Impersonation Mode
 *
 * Allows admins to view the application as a specific tenant
 * for debugging and support purposes.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ImpersonationSession,
  ImpersonationRequest,
  ImpersonationContext,
  ImpersonationAction,
} from './types';

// ============================================================
// CONSTANTS
// ============================================================

const DEFAULT_DURATION_MINUTES = 30;
const MAX_DURATION_MINUTES = 120;
const SESSION_STORAGE_KEY = 'admin-impersonation';

// ============================================================
// IMPERSONATION STORE (Zustand)
// ============================================================

interface ImpersonationStore extends ImpersonationContext {
  startImpersonation: (session: ImpersonationSession) => void;
  endImpersonation: () => void;
  logAction: (action: Omit<ImpersonationAction, 'timestamp'>) => void;
  extendSession: (minutes: number) => void;
  isSessionValid: () => boolean;
}

export const useImpersonationStore = create<ImpersonationStore>()(
  persist(
    (set, get) => ({
      isImpersonating: false,
      session: null,
      originalAdminId: null,

      startImpersonation: (session) => {
        set({
          isImpersonating: true,
          session,
          originalAdminId: session.adminId,
        });
      },

      endImpersonation: () => {
        set({
          isImpersonating: false,
          session: null,
          originalAdminId: null,
        });
      },

      logAction: (action) => {
        const { session } = get();
        if (!session) return;

        const newAction: ImpersonationAction = {
          ...action,
          timestamp: new Date(),
        };

        set({
          session: {
            ...session,
            auditTrail: [...session.auditTrail, newAction],
          },
        });
      },

      extendSession: (minutes) => {
        const { session } = get();
        if (!session) return;

        const additionalMs = Math.min(minutes, MAX_DURATION_MINUTES) * 60 * 1000;
        const newExpiry = new Date(session.expiresAt.getTime() + additionalMs);

        set({
          session: {
            ...session,
            expiresAt: newExpiry,
          },
        });
      },

      isSessionValid: () => {
        const { session, isImpersonating } = get();
        if (!isImpersonating || !session) return false;
        return new Date() < new Date(session.expiresAt);
      },
    }),
    {
      name: SESSION_STORAGE_KEY,
      partialize: (state) => ({
        isImpersonating: state.isImpersonating,
        session: state.session,
        originalAdminId: state.originalAdminId,
      }),
    }
  )
);

// ============================================================
// IMPERSONATION SELECTORS
// ============================================================

export const selectIsImpersonating = (state: ImpersonationStore) => state.isImpersonating;
export const selectImpersonationSession = (state: ImpersonationStore) => state.session;
export const selectOriginalAdminId = (state: ImpersonationStore) => state.originalAdminId;
export const selectAuditTrail = (state: ImpersonationStore) => state.session?.auditTrail ?? [];

// ============================================================
// IMPERSONATION API
// ============================================================

/**
 * Start impersonation session
 */
export async function startImpersonation(
  request: ImpersonationRequest,
  adminId: string,
  adminEmail: string
): Promise<ImpersonationSession> {
  // Validate request
  if (!request.targetTenantId) {
    throw new Error('Target tenant ID is required');
  }

  if (!request.reason || request.reason.length < 10) {
    throw new Error('A detailed reason is required (minimum 10 characters)');
  }

  const durationMinutes = Math.min(
    request.durationMinutes || DEFAULT_DURATION_MINUTES,
    MAX_DURATION_MINUTES
  );

  // In production, this would call the API to:
  // 1. Verify admin has permission to impersonate
  // 2. Fetch tenant details
  // 3. Create audit log entry
  // 4. Return session token

  const session: ImpersonationSession = {
    id: `imp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    adminId,
    adminEmail,
    targetTenantId: request.targetTenantId,
    targetTenantName: `Tenant ${request.targetTenantId}`, // Would come from API
    startedAt: new Date(),
    expiresAt: new Date(Date.now() + durationMinutes * 60 * 1000),
    reason: request.reason,
    auditTrail: [
      {
        timestamp: new Date(),
        action: 'session_started',
        resource: 'impersonation',
        details: { reason: request.reason, duration: durationMinutes },
      },
    ],
  };

  // Log to audit trail
  await logImpersonationEvent({
    type: 'impersonation_started',
    adminId,
    adminEmail,
    targetTenantId: request.targetTenantId,
    reason: request.reason,
    sessionId: session.id,
  });

  return session;
}

/**
 * End impersonation session
 */
export async function endImpersonation(session: ImpersonationSession): Promise<void> {
  // In production, this would call the API to:
  // 1. Invalidate session token
  // 2. Create audit log entry
  // 3. Save full audit trail

  await logImpersonationEvent({
    type: 'impersonation_ended',
    adminId: session.adminId,
    adminEmail: session.adminEmail,
    targetTenantId: session.targetTenantId,
    sessionId: session.id,
    actionsPerformed: session.auditTrail.length,
  });
}

/**
 * Log impersonation event to audit trail
 */
async function logImpersonationEvent(event: Record<string, unknown>): Promise<void> {
  // In production, this would send to audit logging service
  console.log('[IMPERSONATION AUDIT]', JSON.stringify(event, null, 2));
}

// ============================================================
// IMPERSONATION GUARDS
// ============================================================

/**
 * Check if current user can impersonate
 */
export function canImpersonate(userRole: string): boolean {
  const allowedRoles = ['super_admin', 'support_admin'];
  return allowedRoles.includes(userRole);
}

/**
 * Check if action is allowed during impersonation
 */
export function isActionAllowedDuringImpersonation(action: string): boolean {
  // Disallowed actions during impersonation (read-only mode)
  const disallowedActions = [
    'delete_account',
    'change_plan',
    'export_all_data',
    'invite_users',
    'remove_users',
    'change_billing',
    'api_key_create',
    'api_key_delete',
  ];

  return !disallowedActions.includes(action);
}

/**
 * Get impersonation restrictions
 */
export function getImpersonationRestrictions(): string[] {
  return [
    'Cannot delete the account',
    'Cannot change subscription plan',
    'Cannot export all data',
    'Cannot invite or remove users',
    'Cannot modify billing settings',
    'Cannot create or delete API keys',
    'All actions are logged for audit',
  ];
}

// ============================================================
// IMPERSONATION HELPERS
// ============================================================

/**
 * Format remaining session time
 */
export function formatSessionTimeRemaining(expiresAt: Date): string {
  const now = new Date();
  const remaining = new Date(expiresAt).getTime() - now.getTime();

  if (remaining <= 0) return 'Expired';

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Check if session is about to expire (< 5 minutes)
 */
export function isSessionExpiringSoon(expiresAt: Date): boolean {
  const now = new Date();
  const remaining = new Date(expiresAt).getTime() - now.getTime();
  return remaining > 0 && remaining < 5 * 60 * 1000;
}
