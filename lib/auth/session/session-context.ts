/**
 * S295: Session Context Service
 * Part of User & Enterprise Management Program v1.1
 * Phase C - Backend & API
 *
 * Higher-level session context utilities for enterprise/workspace operations.
 */

import { getServerSession, UserSession } from '../session';
import { getEnterpriseById } from '@/lib/db/enterprises';
import { getWorkspaceById, getDefaultWorkspace } from '@/lib/db/workspaces';
import { evaluateDemoPolicy, getDemoStatus, DemoEvaluationResult } from '@/lib/db/demo-policies';
import { toEnterpriseRole, ROLE_HIERARCHY, hasRequiredRole } from '../rbac/types';
import { queryOne } from '@/lib/db/client';

// ============================================================
// TYPES
// ============================================================

/**
 * S340: Canonical Resolved Context (Admin Plane v1.1)
 *
 * Flat 8-field structure for all Admin Plane APIs.
 * Resolved once per request, logged on all mutations.
 */
export type ValidRole = 'SUPER_ADMIN' | 'ENTERPRISE_ADMIN' | 'ENTERPRISE_USER' | 'INDIVIDUAL_USER';

export interface ResolvedContext {
  // User identity
  user_id: string;
  role: ValidRole;

  // Organization hierarchy (enterprise-first)
  enterprise_id: string | null;
  workspace_id: string | null;

  // Vertical binding
  sub_vertical_id: string | null;
  region_code: string | null; // e.g., 'UAE', 'US' (string, not UUID)

  // Demo state
  is_demo: boolean;
  demo_type: 'SYSTEM' | 'ENTERPRISE' | null;
}

export interface EnterpriseContext {
  enterpriseId: string;
  enterpriseName?: string;
  enterpriseType?: string;
  plan?: string;
  subscriptionStatus?: string;
  maxUsers?: number;
  maxWorkspaces?: number;
}

export interface WorkspaceContext {
  workspaceId: string;
  workspaceName?: string;
  subVerticalId?: string;
  isDefault?: boolean;
}

export interface DemoContext {
  isDemo: boolean;
  demoType: 'SYSTEM' | 'ENTERPRISE' | null;
  expiresAt: Date | null;
  isExpired: boolean;
  daysRemaining: number | null;
}

export interface FullSessionContext {
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
    enterpriseRole: string;
  };
  enterprise: EnterpriseContext | null;
  workspace: WorkspaceContext | null;
  demo: DemoContext;
  permissions: {
    canManageUsers: boolean;
    canManageWorkspaces: boolean;
    canManageEnterprise: boolean;
    canAccessAdmin: boolean;
    isEnterpriseAdmin: boolean;
    isSuperAdmin: boolean;
  };
}

// ============================================================
// SESSION CONTEXT RESOLUTION
// ============================================================

/**
 * Get full session context with resolved enterprise and workspace data
 */
export async function getFullSessionContext(): Promise<FullSessionContext | null> {
  const session = await getServerSession();

  if (!session) {
    return null;
  }

  // Get enterprise details
  let enterprise: EnterpriseContext | null = null;
  if (session.enterpriseId) {
    const ent = await getEnterpriseById(session.enterpriseId);
    if (ent) {
      enterprise = {
        enterpriseId: ent.enterprise_id,
        enterpriseName: ent.name,
        enterpriseType: ent.type,
        plan: ent.plan,
        subscriptionStatus: ent.subscription_status,
        maxUsers: ent.max_users,
        maxWorkspaces: ent.max_workspaces,
      };
    }
  }

  // Get workspace details
  let workspace: WorkspaceContext | null = null;
  if (session.workspaceId) {
    const ws = await getWorkspaceById(session.workspaceId);
    if (ws) {
      workspace = {
        workspaceId: ws.workspace_id,
        workspaceName: ws.name,
        subVerticalId: ws.sub_vertical_id,
        isDefault: ws.is_default,
      };
    }
  }

  // Get demo status
  const demoStatus = await getDemoStatus(session.user.id);

  // Determine permissions based on role
  const role = session.user.role || 'INDIVIDUAL_USER';
  const enterpriseRole = toEnterpriseRole(role as 'TENANT_USER' | 'TENANT_ADMIN' | 'SUPER_ADMIN' | 'READ_ONLY');

  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isEnterpriseAdmin = hasRequiredRole(role as 'SUPER_ADMIN' | 'ENTERPRISE_ADMIN' | 'ENTERPRISE_USER' | 'INDIVIDUAL_USER', 'ENTERPRISE_ADMIN');

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role,
      enterpriseRole,
    },
    enterprise,
    workspace,
    demo: {
      isDemo: demoStatus.is_demo,
      demoType: demoStatus.demo_type,
      expiresAt: demoStatus.expires_at,
      isExpired: demoStatus.is_expired,
      daysRemaining: demoStatus.days_remaining,
    },
    permissions: {
      canManageUsers: isEnterpriseAdmin,
      canManageWorkspaces: isEnterpriseAdmin,
      canManageEnterprise: isEnterpriseAdmin,
      canAccessAdmin: isSuperAdmin,
      isEnterpriseAdmin,
      isSuperAdmin,
    },
  };
}

// ============================================================
// S340: RESOLVED CONTEXT (Admin Plane v1.1)
// ============================================================

/**
 * Normalize role to valid Admin Plane role.
 * Maps deprecated roles to their modern equivalents.
 */
function normalizeRole(role: string | undefined): ValidRole {
  const roleMap: Record<string, ValidRole> = {
    'SUPER_ADMIN': 'SUPER_ADMIN',
    'ENTERPRISE_ADMIN': 'ENTERPRISE_ADMIN',
    'ENTERPRISE_USER': 'ENTERPRISE_USER',
    'INDIVIDUAL_USER': 'INDIVIDUAL_USER',
    // Deprecated role mappings
    'TENANT_ADMIN': 'ENTERPRISE_ADMIN',
    'TENANT_USER': 'ENTERPRISE_USER',
    'READ_ONLY': 'INDIVIDUAL_USER',
  };
  return roleMap[role || ''] || 'INDIVIDUAL_USER';
}

/**
 * S340: Get Resolved Context (Admin Plane v1.1)
 *
 * Returns flat 8-field context for Admin Plane APIs.
 * Resolves all fields from session + DB lookups.
 *
 * Resolution order:
 * 1. user_id, role from session
 * 2. enterprise_id, workspace_id from session
 * 3. sub_vertical_id from workspace
 * 4. region_code from enterprise.region
 * 5. is_demo, demo_type from users table
 */
export async function getResolvedContext(): Promise<ResolvedContext | null> {
  const session = await getServerSession();

  if (!session) {
    return null;
  }

  // Get user's demo state from DB
  const userRecord = await queryOne<{
    is_demo: boolean;
    demo_type: 'SYSTEM' | 'ENTERPRISE' | null;
  }>(
    'SELECT is_demo, demo_type FROM users WHERE id = $1',
    [session.user.id]
  );

  // Get workspace for sub_vertical_id
  let subVerticalId: string | null = null;
  if (session.workspaceId) {
    const workspace = await getWorkspaceById(session.workspaceId);
    if (workspace) {
      subVerticalId = workspace.sub_vertical_id || null;
    }
  }

  // Get enterprise for region_code
  let regionCode: string | null = null;
  if (session.enterpriseId) {
    const enterprise = await getEnterpriseById(session.enterpriseId);
    if (enterprise) {
      regionCode = enterprise.region || null;
    }
  }

  return {
    user_id: session.user.id,
    role: normalizeRole(session.user.role),
    enterprise_id: session.enterpriseId || null,
    workspace_id: session.workspaceId || null,
    sub_vertical_id: subVerticalId,
    region_code: regionCode,
    is_demo: userRecord?.is_demo ?? false,
    demo_type: userRecord?.demo_type ?? null,
  };
}

/**
 * S340: Require Resolved Context
 * Throws if context cannot be resolved (not authenticated).
 */
export async function requireResolvedContext(): Promise<ResolvedContext> {
  const context = await getResolvedContext();

  if (!context) {
    throw new Error('Authentication required');
  }

  return context;
}

// ============================================================
// LEGACY CONTEXT FUNCTIONS (kept for backward compatibility)
// ============================================================

/**
 * Get enterprise context for current session
 */
export async function getEnterpriseContext(): Promise<EnterpriseContext | null> {
  const session = await getServerSession();

  if (!session?.enterpriseId) {
    return null;
  }

  const enterprise = await getEnterpriseById(session.enterpriseId);

  if (!enterprise) {
    return null;
  }

  return {
    enterpriseId: enterprise.enterprise_id,
    enterpriseName: enterprise.name,
    enterpriseType: enterprise.type,
    plan: enterprise.plan,
    subscriptionStatus: enterprise.subscription_status,
    maxUsers: enterprise.max_users,
    maxWorkspaces: enterprise.max_workspaces,
  };
}

/**
 * Get workspace context for current session
 */
export async function getWorkspaceContext(): Promise<WorkspaceContext | null> {
  const session = await getServerSession();

  if (!session) {
    return null;
  }

  // Try to get workspace from session
  if (session.workspaceId) {
    const workspace = await getWorkspaceById(session.workspaceId);
    if (workspace) {
      return {
        workspaceId: workspace.workspace_id,
        workspaceName: workspace.name,
        subVerticalId: workspace.sub_vertical_id,
        isDefault: workspace.is_default,
      };
    }
  }

  // Fall back to default workspace for enterprise
  if (session.enterpriseId) {
    const defaultWorkspace = await getDefaultWorkspace(session.enterpriseId);
    if (defaultWorkspace) {
      return {
        workspaceId: defaultWorkspace.workspace_id,
        workspaceName: defaultWorkspace.name,
        subVerticalId: defaultWorkspace.sub_vertical_id,
        isDefault: defaultWorkspace.is_default,
      };
    }
  }

  return null;
}

// ============================================================
// DEMO CONTEXT UTILITIES
// ============================================================

/**
 * Get demo context for current session
 */
export async function getDemoContext(): Promise<DemoContext> {
  const session = await getServerSession();

  if (!session) {
    return {
      isDemo: false,
      demoType: null,
      expiresAt: null,
      isExpired: false,
      daysRemaining: null,
    };
  }

  const status = await getDemoStatus(session.user.id);

  return {
    isDemo: status.is_demo,
    demoType: status.demo_type,
    expiresAt: status.expires_at,
    isExpired: status.is_expired,
    daysRemaining: status.days_remaining,
  };
}

/**
 * Check if current user can perform a demo-limited action
 */
export async function canPerformDemoAction(
  action: 'discovery' | 'action' | 'export' | 'automation' | 'api_access'
): Promise<DemoEvaluationResult> {
  const session = await getServerSession();

  if (!session) {
    return {
      is_allowed: false,
      policy: null,
      denial_reason: 'Not authenticated',
    };
  }

  return evaluateDemoPolicy(session.user.id, action);
}

// ============================================================
// PERMISSION UTILITIES
// ============================================================

/**
 * Check if current user is an enterprise admin
 */
export async function isEnterpriseAdmin(): Promise<boolean> {
  const session = await getServerSession();

  if (!session) {
    return false;
  }

  const role = session.user.role || 'INDIVIDUAL_USER';
  return hasRequiredRole(role as 'SUPER_ADMIN' | 'ENTERPRISE_ADMIN' | 'ENTERPRISE_USER' | 'INDIVIDUAL_USER', 'ENTERPRISE_ADMIN');
}

/**
 * Check if current user is a super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  const session = await getServerSession();

  if (!session) {
    return false;
  }

  return session.user.role === 'SUPER_ADMIN';
}

/**
 * Check if current user can manage users in their enterprise
 */
export async function canManageUsers(): Promise<boolean> {
  return isEnterpriseAdmin();
}

/**
 * Check if current user can manage workspaces in their enterprise
 */
export async function canManageWorkspaces(): Promise<boolean> {
  return isEnterpriseAdmin();
}

/**
 * Check if current user belongs to a specific enterprise
 */
export async function belongsToEnterprise(enterpriseId: string): Promise<boolean> {
  const session = await getServerSession();

  if (!session) {
    return false;
  }

  return session.enterpriseId === enterpriseId;
}

/**
 * Check if current user belongs to a specific workspace
 */
export async function belongsToWorkspace(workspaceId: string): Promise<boolean> {
  const session = await getServerSession();

  if (!session) {
    return false;
  }

  return session.workspaceId === workspaceId;
}

// ============================================================
// CONTEXT VALIDATION
// ============================================================

/**
 * Require enterprise context - throws if user has no enterprise
 */
export async function requireEnterpriseContext(): Promise<EnterpriseContext> {
  const context = await getEnterpriseContext();

  if (!context) {
    throw new Error('Enterprise context required');
  }

  return context;
}

/**
 * Require workspace context - throws if user has no workspace
 */
export async function requireWorkspaceContext(): Promise<WorkspaceContext> {
  const context = await getWorkspaceContext();

  if (!context) {
    throw new Error('Workspace context required');
  }

  return context;
}

/**
 * Require enterprise admin role - throws if user is not an admin
 */
export async function requireEnterpriseAdmin(): Promise<void> {
  const isAdmin = await isEnterpriseAdmin();

  if (!isAdmin) {
    throw new Error('Enterprise admin role required');
  }
}

/**
 * Require super admin role - throws if user is not a super admin
 */
export async function requireSuperAdmin(): Promise<void> {
  const isAdmin = await isSuperAdmin();

  if (!isAdmin) {
    throw new Error('Super admin role required');
  }
}

// ============================================================
// S347: SUPER ADMIN CONTEXT WITH TARGET (Context Propagation)
// ============================================================

/**
 * S347: Target entity context for SUPER_ADMIN mutations.
 * When SUPER_ADMIN acts on an entity, we capture the TARGET's context.
 */
export interface SuperAdminTarget {
  enterprise_id?: string | null;
  workspace_id?: string | null;
  sub_vertical_id?: string | null;
  region_code?: string | null;
}

/**
 * S347: Create ResolvedContext for SUPER_ADMIN with target entity context.
 *
 * This is the ONLY way to create context for Super Admin mutations.
 * The target's organizational fields are captured for evidence fidelity.
 *
 * @param target - The target entity's organizational context
 * @returns ResolvedContext with target's enterprise/workspace/etc
 *
 * @example
 * ```typescript
 * // When creating an enterprise
 * const ctx = createSuperAdminContextWithTarget({
 *   enterprise_id: newEnterprise.enterprise_id,
 *   region_code: newEnterprise.region,
 * });
 *
 * // When creating a workspace
 * const ctx = createSuperAdminContextWithTarget({
 *   enterprise_id: workspace.enterprise_id,
 *   workspace_id: workspace.workspace_id,
 *   sub_vertical_id: workspace.sub_vertical_id,
 * });
 * ```
 */
export function createSuperAdminContextWithTarget(target: SuperAdminTarget = {}): ResolvedContext {
  return {
    user_id: '00000000-0000-0000-0000-000000000001', // Super Admin sentinel
    role: 'SUPER_ADMIN',
    enterprise_id: target.enterprise_id ?? null,
    workspace_id: target.workspace_id ?? null,
    sub_vertical_id: target.sub_vertical_id ?? null,
    region_code: target.region_code ?? null,
    is_demo: false,
    demo_type: null,
  };
}

// ============================================================
// S348: PLG SIGNUP CONTEXT (Individual User Path)
// ============================================================

/**
 * S348-F5: Create ResolvedContext for a newly created INDIVIDUAL_USER.
 *
 * This is used during signup to emit USER_CREATED events.
 * The user has no enterprise/workspace binding at this point.
 *
 * @param userId - The newly created user's ID
 * @param regionCode - Optional region from signup form
 * @returns ResolvedContext for INDIVIDUAL_USER
 */
export function createIndividualUserContext(
  userId: string,
  regionCode?: string
): ResolvedContext {
  return {
    user_id: userId,
    role: 'INDIVIDUAL_USER',
    enterprise_id: null, // Not bound at signup
    workspace_id: null,  // Not bound at signup
    sub_vertical_id: null,
    region_code: regionCode || null,
    is_demo: false,
    demo_type: null,
  };
}

export default {
  // S340: Admin Plane v1.1 Resolved Context
  getResolvedContext,
  requireResolvedContext,

  // S347: Super Admin Context with Target
  createSuperAdminContextWithTarget,

  // S348: PLG Signup Context
  createIndividualUserContext,

  // Legacy context resolution (kept for backward compatibility)
  getFullSessionContext,
  getEnterpriseContext,
  getWorkspaceContext,
  getDemoContext,
  canPerformDemoAction,

  // Permission checks
  isEnterpriseAdmin,
  isSuperAdmin,
  canManageUsers,
  canManageWorkspaces,
  belongsToEnterprise,
  belongsToWorkspace,

  // Context requirements
  requireEnterpriseContext,
  requireWorkspaceContext,
  requireEnterpriseAdmin,
  requireSuperAdmin,
};
