/**
 * S323: Enterprise Security Guards
 * Part of User & Enterprise Management Program v1.1
 * Phase G - Security, RLS & Audit
 *
 * Security guards for enterprise-level access control.
 */

import { getServerSession } from '@/lib/auth/session';
import { queryOne } from '@/lib/db/client';

// =============================================================================
// TYPES
// =============================================================================

export type EnterpriseRole =
  | 'SUPER_ADMIN'
  | 'ENTERPRISE_ADMIN'
  | 'ENTERPRISE_USER'
  | 'INDIVIDUAL_USER';

export interface GuardContext {
  user_id: string;
  enterprise_id: string | null;
  workspace_id: string | null;
  role: EnterpriseRole;
  is_demo: boolean;
}

export interface GuardResult {
  allowed: boolean;
  reason?: string;
  required_role?: EnterpriseRole;
  context?: GuardContext;
}

// =============================================================================
// CONTEXT EXTRACTION
// =============================================================================

/**
 * Get guard context from current session
 */
export async function getGuardContext(): Promise<GuardContext | null> {
  const session = await getServerSession();

  if (!session?.user) {
    return null;
  }

  return {
    user_id: session.user.id,
    enterprise_id: session.enterpriseId || null,
    workspace_id: session.workspaceId || null,
    role: (session.user.role as EnterpriseRole) || 'INDIVIDUAL_USER',
    is_demo: session.isDemo || false,
  };
}

// =============================================================================
// ROLE HIERARCHY
// =============================================================================

const ROLE_HIERARCHY: Record<EnterpriseRole, number> = {
  SUPER_ADMIN: 100,
  ENTERPRISE_ADMIN: 50,
  ENTERPRISE_USER: 25,
  INDIVIDUAL_USER: 10,
};

/**
 * Check if a role has at least the required permission level
 */
export function hasRoleLevel(userRole: EnterpriseRole, requiredRole: EnterpriseRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// =============================================================================
// ENTERPRISE GUARDS
// =============================================================================

/**
 * Guard: Require authentication
 */
export async function requireAuth(): Promise<GuardResult> {
  const context = await getGuardContext();

  if (!context) {
    return {
      allowed: false,
      reason: 'Authentication required',
    };
  }

  return { allowed: true, context };
}

/**
 * Guard: Require specific role or higher
 */
export async function requireRole(minimumRole: EnterpriseRole): Promise<GuardResult> {
  const context = await getGuardContext();

  if (!context) {
    return {
      allowed: false,
      reason: 'Authentication required',
    };
  }

  if (!hasRoleLevel(context.role, minimumRole)) {
    return {
      allowed: false,
      reason: `Insufficient permissions. Required: ${minimumRole}`,
      required_role: minimumRole,
      context,
    };
  }

  return { allowed: true, context };
}

/**
 * Guard: Require enterprise membership
 */
export async function requireEnterprise(): Promise<GuardResult> {
  const context = await getGuardContext();

  if (!context) {
    return {
      allowed: false,
      reason: 'Authentication required',
    };
  }

  if (!context.enterprise_id) {
    return {
      allowed: false,
      reason: 'Enterprise membership required',
      context,
    };
  }

  return { allowed: true, context };
}

/**
 * Guard: Require specific enterprise access
 */
export async function requireEnterpriseAccess(enterpriseId: string): Promise<GuardResult> {
  const context = await getGuardContext();

  if (!context) {
    return {
      allowed: false,
      reason: 'Authentication required',
    };
  }

  // Super admins can access any enterprise
  if (context.role === 'SUPER_ADMIN') {
    return { allowed: true, context };
  }

  if (context.enterprise_id !== enterpriseId) {
    return {
      allowed: false,
      reason: 'Access to this enterprise is denied',
      context,
    };
  }

  return { allowed: true, context };
}

/**
 * Guard: Require workspace access
 */
export async function requireWorkspaceAccess(workspaceId: string): Promise<GuardResult> {
  const context = await getGuardContext();

  if (!context) {
    return {
      allowed: false,
      reason: 'Authentication required',
    };
  }

  // Super admins can access any workspace
  if (context.role === 'SUPER_ADMIN') {
    return { allowed: true, context };
  }

  // Enterprise admins can access all workspaces in their enterprise
  if (context.role === 'ENTERPRISE_ADMIN' && context.enterprise_id) {
    const workspace = await queryOne<{ enterprise_id: string }>(
      'SELECT enterprise_id FROM workspaces WHERE workspace_id = $1',
      [workspaceId]
    );

    if (workspace && workspace.enterprise_id === context.enterprise_id) {
      return { allowed: true, context };
    }
  }

  // Regular users can only access their assigned workspace
  if (context.workspace_id !== workspaceId) {
    return {
      allowed: false,
      reason: 'Access to this workspace is denied',
      context,
    };
  }

  return { allowed: true, context };
}

/**
 * Guard: Require enterprise admin
 */
export async function requireEnterpriseAdmin(): Promise<GuardResult> {
  return requireRole('ENTERPRISE_ADMIN');
}

/**
 * Guard: Require super admin
 */
export async function requireSuperAdmin(): Promise<GuardResult> {
  return requireRole('SUPER_ADMIN');
}

/**
 * Guard: Require non-demo enterprise
 */
export async function requireNonDemo(): Promise<GuardResult> {
  const context = await getGuardContext();

  if (!context) {
    return {
      allowed: false,
      reason: 'Authentication required',
    };
  }

  if (context.is_demo) {
    return {
      allowed: false,
      reason: 'This feature is not available in demo mode',
      context,
    };
  }

  return { allowed: true, context };
}

/**
 * Guard: Require active enterprise (not expired, not suspended)
 */
export async function requireActiveEnterprise(): Promise<GuardResult> {
  const context = await getGuardContext();

  if (!context) {
    return {
      allowed: false,
      reason: 'Authentication required',
    };
  }

  if (!context.enterprise_id) {
    return {
      allowed: false,
      reason: 'Enterprise membership required',
      context,
    };
  }

  const enterprise = await queryOne<{
    is_active: boolean;
    status: string;
    demo_expires_at: Date | null;
  }>(
    'SELECT is_active, status, demo_expires_at FROM enterprises WHERE enterprise_id = $1',
    [context.enterprise_id]
  );

  if (!enterprise) {
    return {
      allowed: false,
      reason: 'Enterprise not found',
      context,
    };
  }

  if (!enterprise.is_active) {
    return {
      allowed: false,
      reason: 'Enterprise is inactive',
      context,
    };
  }

  if (enterprise.status === 'suspended') {
    return {
      allowed: false,
      reason: 'Enterprise is suspended',
      context,
    };
  }

  if (enterprise.status === 'expired') {
    return {
      allowed: false,
      reason: 'Enterprise subscription has expired',
      context,
    };
  }

  // Check demo expiration
  if (enterprise.demo_expires_at && new Date(enterprise.demo_expires_at) < new Date()) {
    return {
      allowed: false,
      reason: 'Demo period has expired',
      context,
    };
  }

  return { allowed: true, context };
}

// =============================================================================
// RESOURCE GUARDS
// =============================================================================

/**
 * Guard: Check if user can manage users in enterprise
 */
export async function canManageUsers(): Promise<GuardResult> {
  const roleResult = await requireRole('ENTERPRISE_ADMIN');
  if (!roleResult.allowed) return roleResult;

  const enterpriseResult = await requireActiveEnterprise();
  if (!enterpriseResult.allowed) return enterpriseResult;

  return { allowed: true, context: enterpriseResult.context };
}

/**
 * Guard: Check if user can manage workspaces
 */
export async function canManageWorkspaces(): Promise<GuardResult> {
  const roleResult = await requireRole('ENTERPRISE_ADMIN');
  if (!roleResult.allowed) return roleResult;

  const enterpriseResult = await requireActiveEnterprise();
  if (!enterpriseResult.allowed) return enterpriseResult;

  return { allowed: true, context: enterpriseResult.context };
}

/**
 * Guard: Check if user can access enterprise settings
 */
export async function canAccessEnterpriseSettings(): Promise<GuardResult> {
  const roleResult = await requireRole('ENTERPRISE_ADMIN');
  if (!roleResult.allowed) return roleResult;

  const enterpriseResult = await requireEnterprise();
  if (!enterpriseResult.allowed) return enterpriseResult;

  return { allowed: true, context: enterpriseResult.context };
}

/**
 * Guard: Check if user can export data
 */
export async function canExportData(): Promise<GuardResult> {
  const enterpriseResult = await requireActiveEnterprise();
  if (!enterpriseResult.allowed) return enterpriseResult;

  // Demo users cannot export
  const nonDemoResult = await requireNonDemo();
  if (!nonDemoResult.allowed) return nonDemoResult;

  return { allowed: true, context: enterpriseResult.context };
}

// =============================================================================
// COMPOSITE GUARDS
// =============================================================================

/**
 * Run multiple guards in sequence
 * Returns first failure or final success
 */
export async function runGuards(
  guards: Array<() => Promise<GuardResult>>
): Promise<GuardResult> {
  for (const guard of guards) {
    const result = await guard();
    if (!result.allowed) {
      return result;
    }
  }

  const lastGuard = guards[guards.length - 1];
  if (lastGuard) {
    return lastGuard();
  }

  return { allowed: true };
}

// =============================================================================
// EXPORTS
// =============================================================================

export const guards = {
  // Context
  getContext: getGuardContext,
  hasRoleLevel,

  // Basic guards
  requireAuth,
  requireRole,
  requireEnterprise,
  requireEnterpriseAccess,
  requireWorkspaceAccess,
  requireEnterpriseAdmin,
  requireSuperAdmin,
  requireNonDemo,
  requireActiveEnterprise,

  // Resource guards
  canManageUsers,
  canManageWorkspaces,
  canAccessEnterpriseSettings,
  canExportData,

  // Utilities
  runGuards,
};

export default guards;
