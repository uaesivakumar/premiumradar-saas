/**
 * Vertical Lock - Sprint S48 Features 4, 5, 6
 * - Feature 4: Vertical Lock After Confirmation
 * - Feature 5: Super-Admin Vertical Override
 * - Feature 6: Consulting-Mode Vertical
 *
 * Manages vertical assignment and prevents unauthorized changes
 */

import { VerticalId } from '@/lib/stores/onboarding-store';
import { VerticalLockState, VerticalOverrideRequest, MFA_REQUIREMENTS } from './types';

// In-memory store for demo/development
// In production, this would be stored in Supabase
const verticalLockStore = new Map<string, VerticalLockState>();

/**
 * Create initial vertical lock state for a user
 */
export function createVerticalLock(
  userId: string,
  vertical: VerticalId,
  lockedBy: 'user' | 'admin' | 'system' = 'user'
): VerticalLockState {
  const state: VerticalLockState = {
    userId,
    vertical,
    isLocked: true,
    lockedAt: new Date().toISOString(),
    lockedBy,
    isConsultingMode: false,
    allowedVerticals: [vertical],
    lastModifiedAt: new Date().toISOString(),
    lastModifiedBy: userId,
  };

  verticalLockStore.set(userId, state);
  return state;
}

/**
 * Get vertical lock state for a user
 */
export function getVerticalLockState(userId: string): VerticalLockState | null {
  return verticalLockStore.get(userId) || null;
}

/**
 * Check if user's vertical is locked
 */
export function isVerticalLocked(userId: string): boolean {
  const state = getVerticalLockState(userId);
  return state?.isLocked ?? false;
}

/**
 * Check if user can access a specific vertical
 */
export function canAccessVertical(userId: string, vertical: VerticalId): boolean {
  const state = getVerticalLockState(userId);
  if (!state) return true; // No lock state = not yet locked

  // Consulting mode allows multiple verticals
  if (state.isConsultingMode) {
    return state.allowedVerticals.includes(vertical);
  }

  // Standard mode - only locked vertical
  return state.vertical === vertical;
}

/**
 * Get user's current vertical
 */
export function getUserVertical(userId: string): VerticalId | null {
  const state = getVerticalLockState(userId);
  return state?.vertical ?? null;
}

/**
 * Lock user to a vertical (after confirmation)
 * This is called when user completes onboarding vertical selection
 */
export function lockVertical(
  userId: string,
  vertical: VerticalId,
  lockedBy: 'user' | 'admin' | 'system' = 'user'
): VerticalLockState {
  const existing = getVerticalLockState(userId);

  if (existing?.isLocked && lockedBy === 'user') {
    throw new Error('Vertical is already locked. Admin override required.');
  }

  return createVerticalLock(userId, vertical, lockedBy);
}

/**
 * Check if override request requires MFA
 */
export function requiresMfaForOverride(request: VerticalOverrideRequest): boolean {
  // All vertical overrides require MFA for security
  return MFA_REQUIREMENTS.VERTICAL_OVERRIDE;
}

/**
 * Super-Admin: Override user's vertical (Feature 5)
 * Requires admin permissions and MFA verification
 */
export async function adminOverrideVertical(
  request: VerticalOverrideRequest,
  adminUserId: string,
  isAdmin: boolean
): Promise<{ success: boolean; error?: string; newState?: VerticalLockState }> {
  // Verify admin permissions
  if (!isAdmin) {
    return { success: false, error: 'Admin privileges required' };
  }

  // Verify MFA if required
  if (requiresMfaForOverride(request) && !request.mfaVerified) {
    return { success: false, error: 'MFA verification required for vertical override' };
  }

  // Get existing state
  const existing = getVerticalLockState(request.userId);
  if (!existing) {
    // Create new lock if none exists
    const newState = createVerticalLock(request.userId, request.newVertical, 'admin');
    return { success: true, newState };
  }

  // Update vertical
  const newState: VerticalLockState = {
    ...existing,
    vertical: request.newVertical,
    lockedAt: new Date().toISOString(),
    lockedBy: 'admin',
    lastModifiedAt: new Date().toISOString(),
    lastModifiedBy: adminUserId,
    // Update allowed verticals if not in consulting mode
    allowedVerticals: existing.isConsultingMode
      ? existing.allowedVerticals
      : [request.newVertical],
  };

  verticalLockStore.set(request.userId, newState);

  // Log override for audit
  console.log('[Vertical Lock] Admin override:', {
    userId: request.userId,
    adminId: adminUserId,
    oldVertical: existing.vertical,
    newVertical: request.newVertical,
    reason: request.reason,
    timestamp: new Date().toISOString(),
  });

  return { success: true, newState };
}

/**
 * Enable consulting mode (Feature 6)
 * Allows access to multiple verticals
 */
export async function enableConsultingMode(
  userId: string,
  allowedVerticals: VerticalId[],
  enabledBy: string,
  mfaVerified: boolean
): Promise<{ success: boolean; error?: string; newState?: VerticalLockState }> {
  // MFA required for consulting mode
  if (MFA_REQUIREMENTS.CONSULTING_MODE_ENABLE && !mfaVerified) {
    return { success: false, error: 'MFA verification required for consulting mode' };
  }

  if (allowedVerticals.length === 0) {
    return { success: false, error: 'At least one vertical must be allowed' };
  }

  const existing = getVerticalLockState(userId);
  const primaryVertical = existing?.vertical ?? allowedVerticals[0];

  const newState: VerticalLockState = {
    userId,
    vertical: primaryVertical,
    isLocked: true,
    lockedAt: existing?.lockedAt ?? new Date().toISOString(),
    lockedBy: existing?.lockedBy ?? 'admin',
    isConsultingMode: true,
    allowedVerticals,
    lastModifiedAt: new Date().toISOString(),
    lastModifiedBy: enabledBy,
  };

  verticalLockStore.set(userId, newState);

  console.log('[Vertical Lock] Consulting mode enabled:', {
    userId,
    enabledBy,
    allowedVerticals,
    timestamp: new Date().toISOString(),
  });

  return { success: true, newState };
}

/**
 * Disable consulting mode
 * Revert to single vertical lock
 */
export async function disableConsultingMode(
  userId: string,
  keepVertical: VerticalId,
  disabledBy: string
): Promise<{ success: boolean; error?: string; newState?: VerticalLockState }> {
  const existing = getVerticalLockState(userId);

  if (!existing?.isConsultingMode) {
    return { success: false, error: 'User is not in consulting mode' };
  }

  const newState: VerticalLockState = {
    ...existing,
    vertical: keepVertical,
    isConsultingMode: false,
    allowedVerticals: [keepVertical],
    lastModifiedAt: new Date().toISOString(),
    lastModifiedBy: disabledBy,
  };

  verticalLockStore.set(userId, newState);

  return { success: true, newState };
}

/**
 * Switch active vertical in consulting mode
 */
export function switchConsultingVertical(
  userId: string,
  newVertical: VerticalId
): { success: boolean; error?: string } {
  const state = getVerticalLockState(userId);

  if (!state) {
    return { success: false, error: 'No vertical lock state found' };
  }

  if (!state.isConsultingMode) {
    return { success: false, error: 'Not in consulting mode. Cannot switch verticals.' };
  }

  if (!state.allowedVerticals.includes(newVertical)) {
    return { success: false, error: 'Vertical not allowed in consulting mode' };
  }

  // Update active vertical
  state.vertical = newVertical;
  state.lastModifiedAt = new Date().toISOString();
  verticalLockStore.set(userId, state);

  return { success: true };
}

/**
 * Get audit log for vertical changes (for admin panel)
 */
export interface VerticalAuditEntry {
  userId: string;
  action: 'lock' | 'override' | 'consulting_enable' | 'consulting_disable' | 'switch';
  oldVertical: VerticalId | null;
  newVertical: VerticalId;
  performedBy: string;
  reason?: string;
  timestamp: string;
}

// Audit log would be stored in database in production
const auditLog: VerticalAuditEntry[] = [];

export function getVerticalAuditLog(userId?: string): VerticalAuditEntry[] {
  if (userId) {
    return auditLog.filter(entry => entry.userId === userId);
  }
  return [...auditLog];
}

export default {
  createVerticalLock,
  getVerticalLockState,
  isVerticalLocked,
  canAccessVertical,
  getUserVertical,
  lockVertical,
  requiresMfaForOverride,
  adminOverrideVertical,
  enableConsultingMode,
  disableConsultingMode,
  switchConsultingVertical,
  getVerticalAuditLog,
};
