/**
 * RBAC Types - Sprint S141 + S288A
 *
 * Role-Based Access Control type definitions for PremiumRadar SaaS.
 *
 * S288A UPDATE: Added enterprise-based roles with backward compatibility.
 * New hierarchy: SUPER_ADMIN > ENTERPRISE_ADMIN > ENTERPRISE_USER > INDIVIDUAL_USER
 * Legacy roles (TENANT_ADMIN, TENANT_USER, READ_ONLY) remain for migration compatibility.
 */

// ============================================================
// ROLE DEFINITIONS
// ============================================================

// New enterprise-based roles (spec v1.1)
export type EnterpriseRole = 'SUPER_ADMIN' | 'ENTERPRISE_ADMIN' | 'ENTERPRISE_USER' | 'INDIVIDUAL_USER';

// Legacy tenant-based roles (for migration compatibility)
export type LegacyRole = 'TENANT_ADMIN' | 'TENANT_USER' | 'READ_ONLY';

// Combined role type (supports both during migration)
export type UserRole = EnterpriseRole | LegacyRole;

// Role hierarchy with both old and new roles
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  // New enterprise roles
  SUPER_ADMIN: 100,
  ENTERPRISE_ADMIN: 75,
  ENTERPRISE_USER: 50,
  INDIVIDUAL_USER: 25,
  // Legacy roles (mapped to equivalent levels)
  TENANT_ADMIN: 75,  // Same as ENTERPRISE_ADMIN
  TENANT_USER: 50,   // Same as ENTERPRISE_USER
  READ_ONLY: 10,     // Below INDIVIDUAL_USER
};

// Role migration mapping: old role -> new role
export const ROLE_MIGRATION_MAP: Record<LegacyRole, EnterpriseRole> = {
  TENANT_ADMIN: 'ENTERPRISE_ADMIN',
  TENANT_USER: 'ENTERPRISE_USER',
  READ_ONLY: 'INDIVIDUAL_USER',
};

/**
 * Get the enterprise-equivalent role for any role (handles migration)
 */
export function toEnterpriseRole(role: UserRole): EnterpriseRole {
  if (role in ROLE_MIGRATION_MAP) {
    return ROLE_MIGRATION_MAP[role as LegacyRole];
  }
  return role as EnterpriseRole;
}

export interface RoleCapabilities {
  role: UserRole;
  description: string;
  canAccessCrossEnterprise: boolean;  // Renamed from canAccessCrossTenant
  canManageUsers: boolean;
  canManageBilling: boolean;
  canConfigureVerticals: boolean;
  canUseSIVA: boolean;
  canExportData: boolean;
  canViewDashboard: boolean;
  requiresMFA: boolean;
  // Backward compatibility alias
  get canAccessCrossTenant(): boolean;
}

// Helper to create capabilities with backward-compatible getter
function createCapabilities(
  role: UserRole,
  description: string,
  canAccessCrossEnterprise: boolean,
  canManageUsers: boolean,
  canManageBilling: boolean,
  canConfigureVerticals: boolean,
  canUseSIVA: boolean,
  canExportData: boolean,
  canViewDashboard: boolean,
  requiresMFA: boolean
): RoleCapabilities {
  return {
    role,
    description,
    canAccessCrossEnterprise,
    canManageUsers,
    canManageBilling,
    canConfigureVerticals,
    canUseSIVA,
    canExportData,
    canViewDashboard,
    requiresMFA,
    get canAccessCrossTenant() { return this.canAccessCrossEnterprise; }
  };
}

export const ROLE_CAPABILITIES: Record<UserRole, RoleCapabilities> = {
  // New enterprise roles
  SUPER_ADMIN: createCapabilities(
    'SUPER_ADMIN',
    'Full access across all enterprises - Founder only',
    true, true, true, true, true, true, true, true
  ),
  ENTERPRISE_ADMIN: createCapabilities(
    'ENTERPRISE_ADMIN',
    'Admin access within their enterprise',
    false, true, true, false, true, true, true, true
  ),
  ENTERPRISE_USER: createCapabilities(
    'ENTERPRISE_USER',
    'Standard user with SIVA access within enterprise',
    false, false, false, false, true, true, true, false
  ),
  INDIVIDUAL_USER: createCapabilities(
    'INDIVIDUAL_USER',
    'Personal user account (trial/freemium)',
    false, false, false, false, true, false, true, false
  ),
  // Legacy roles (kept for migration compatibility)
  TENANT_ADMIN: createCapabilities(
    'TENANT_ADMIN',
    '[LEGACY] Admin access within their tenant',
    false, true, true, false, true, true, true, true
  ),
  TENANT_USER: createCapabilities(
    'TENANT_USER',
    '[LEGACY] Standard user with SIVA access',
    false, false, false, false, true, true, true, false
  ),
  READ_ONLY: createCapabilities(
    'READ_ONLY',
    '[LEGACY] View-only access to dashboards',
    false, false, false, false, false, false, true, false
  ),
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

  // Enterprise (new - spec v1.1)
  enterprise_id: string;
  enterprise_name?: string;
  workspace_id?: string;
  workspace_name?: string;

  // Tenant (legacy - for backward compatibility during migration)
  /** @deprecated Use enterprise_id instead */
  tenant_id: string;
  /** @deprecated Use enterprise_name instead */
  tenant_name?: string;

  // Role
  role: UserRole;

  // Demo flags (new - spec v1.1)
  is_demo?: boolean;
  demo_type?: 'SYSTEM' | 'ENTERPRISE';
  demo_expires_at?: string;

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

/**
 * Get enterprise_id from session (handles legacy tenant_id fallback)
 */
export function getEnterpriseId(session: EnhancedSessionPayload): string {
  return session.enterprise_id || session.tenant_id;
}

/**
 * Get enterprise_name from session (handles legacy tenant_name fallback)
 */
export function getEnterpriseName(session: EnhancedSessionPayload): string | undefined {
  return session.enterprise_name || session.tenant_name;
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
