/**
 * RBAC Types - Sprint S141
 *
 * Role-Based Access Control type definitions for PremiumRadar SaaS.
 * Implements static role hierarchy: SUPER_ADMIN > TENANT_ADMIN > TENANT_USER > READ_ONLY
 */

// ============================================================
// ROLE DEFINITIONS
// ============================================================

export type UserRole = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'TENANT_USER' | 'READ_ONLY';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 100,
  TENANT_ADMIN: 75,
  TENANT_USER: 50,
  READ_ONLY: 25,
};

export interface RoleCapabilities {
  role: UserRole;
  description: string;
  canAccessCrossTenant: boolean;
  canManageUsers: boolean;
  canManageBilling: boolean;
  canConfigureVerticals: boolean;
  canUseSIVA: boolean;
  canExportData: boolean;
  canViewDashboard: boolean;
  requiresMFA: boolean;
}

export const ROLE_CAPABILITIES: Record<UserRole, RoleCapabilities> = {
  SUPER_ADMIN: {
    role: 'SUPER_ADMIN',
    description: 'Full access across all tenants - Founder only',
    canAccessCrossTenant: true,
    canManageUsers: true,
    canManageBilling: true,
    canConfigureVerticals: true,
    canUseSIVA: true,
    canExportData: true,
    canViewDashboard: true,
    requiresMFA: true,
  },
  TENANT_ADMIN: {
    role: 'TENANT_ADMIN',
    description: 'Admin access within their tenant',
    canAccessCrossTenant: false,
    canManageUsers: true,
    canManageBilling: true,
    canConfigureVerticals: false,
    canUseSIVA: true,
    canExportData: true,
    canViewDashboard: true,
    requiresMFA: true,
  },
  TENANT_USER: {
    role: 'TENANT_USER',
    description: 'Standard user with SIVA access',
    canAccessCrossTenant: false,
    canManageUsers: false,
    canManageBilling: false,
    canConfigureVerticals: false,
    canUseSIVA: true,
    canExportData: true,
    canViewDashboard: true,
    requiresMFA: false,
  },
  READ_ONLY: {
    role: 'READ_ONLY',
    description: 'View-only access to dashboards',
    canAccessCrossTenant: false,
    canManageUsers: false,
    canManageBilling: false,
    canConfigureVerticals: false,
    canUseSIVA: false,
    canExportData: false,
    canViewDashboard: true,
    requiresMFA: false,
  },
};

// ============================================================
// SESSION TYPES (Enhanced JWT Payload)
// ============================================================

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
export type PlanType = 'free' | 'starter' | 'professional' | 'enterprise';

export interface EnhancedSessionPayload {
  // Identity
  user_id: string;
  email: string;
  name?: string;

  // Tenant
  tenant_id: string;
  tenant_name?: string;

  // Role
  role: UserRole;

  // MFA
  mfa_enabled: boolean;
  mfa_verified: boolean;
  mfa_required: boolean;

  // Subscription
  plan: PlanType;
  subscription_status: SubscriptionStatus;

  // Timestamps
  iat: number; // Issued at
  exp: number; // Expires at
  last_activity?: number;

  // Security
  ip_address?: string;
  user_agent?: string;
}

// ============================================================
// ROUTE PROTECTION TYPES
// ============================================================

export interface RouteProtection {
  path: string;
  requiredRole: UserRole;
  requiresMFA: boolean;
  requiresSubscription: boolean;
  allowedPlans?: PlanType[];
}

// Premium routes that require paid subscription
export const PREMIUM_ROUTES: RouteProtection[] = [
  { path: '/dashboard/intelligence', requiredRole: 'TENANT_USER', requiresMFA: false, requiresSubscription: true, allowedPlans: ['starter', 'professional', 'enterprise'] },
  { path: '/dashboard/discovery', requiredRole: 'TENANT_USER', requiresMFA: false, requiresSubscription: true, allowedPlans: ['professional', 'enterprise'] },
  { path: '/dashboard/siva', requiredRole: 'TENANT_USER', requiresMFA: false, requiresSubscription: true, allowedPlans: ['starter', 'professional', 'enterprise'] },
  { path: '/dashboard/enrichment', requiredRole: 'TENANT_USER', requiresMFA: false, requiresSubscription: true, allowedPlans: ['professional', 'enterprise'] },
];

// Admin routes that require TENANT_ADMIN or higher
export const ADMIN_ROUTES: RouteProtection[] = [
  { path: '/dashboard/admin', requiredRole: 'TENANT_ADMIN', requiresMFA: true, requiresSubscription: false },
  { path: '/dashboard/settings/team', requiredRole: 'TENANT_ADMIN', requiresMFA: false, requiresSubscription: false },
  { path: '/dashboard/settings/billing', requiredRole: 'TENANT_ADMIN', requiresMFA: false, requiresSubscription: false },
];

// Super Admin routes - Founder only
export const SUPER_ADMIN_ROUTES: RouteProtection[] = [
  { path: '/superadmin', requiredRole: 'SUPER_ADMIN', requiresMFA: true, requiresSubscription: false },
];

// ============================================================
// PERMISSION CHECKS
// ============================================================

/**
 * Check if a role has at least the required level
 */
export function hasRequiredRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if user can access a specific route
 */
export function canAccessRoute(
  session: EnhancedSessionPayload,
  route: RouteProtection
): { allowed: boolean; reason?: string } {
  // Check role
  if (!hasRequiredRole(session.role, route.requiredRole)) {
    return { allowed: false, reason: 'Insufficient role' };
  }

  // Check MFA
  if (route.requiresMFA && !session.mfa_verified) {
    return { allowed: false, reason: 'MFA verification required' };
  }

  // Check subscription
  if (route.requiresSubscription) {
    if (session.subscription_status !== 'active' && session.subscription_status !== 'trialing') {
      return { allowed: false, reason: 'Active subscription required' };
    }

    if (route.allowedPlans && !route.allowedPlans.includes(session.plan)) {
      return { allowed: false, reason: `Plan upgrade required. Current: ${session.plan}` };
    }
  }

  return { allowed: true };
}

/**
 * Check if user needs MFA based on their role
 */
export function requiresMFAForRole(role: UserRole): boolean {
  return ROLE_CAPABILITIES[role].requiresMFA;
}

/**
 * Get all capabilities for a role
 */
export function getRoleCapabilities(role: UserRole): RoleCapabilities {
  return ROLE_CAPABILITIES[role];
}

export default {
  ROLE_HIERARCHY,
  ROLE_CAPABILITIES,
  PREMIUM_ROUTES,
  ADMIN_ROUTES,
  SUPER_ADMIN_ROUTES,
  hasRequiredRole,
  canAccessRoute,
  requiresMFAForRole,
  getRoleCapabilities,
};
