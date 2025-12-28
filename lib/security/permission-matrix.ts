/**
 * S325: Permission Matrix
 * Part of User & Enterprise Management Program v1.1
 * Phase G - Security, RLS & Audit
 *
 * Comprehensive permission matrix for enterprise role-based access control.
 */

import type { EnterpriseRole } from './enterprise-guards';

// =============================================================================
// TYPES
// =============================================================================

export type ResourceType =
  | 'enterprise'
  | 'workspace'
  | 'user'
  | 'discovery'
  | 'campaign'
  | 'template'
  | 'settings'
  | 'billing'
  | 'audit_log'
  | 'api_key';

export type ActionType =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'list'
  | 'manage'
  | 'export'
  | 'invite'
  | 'assign';

export interface Permission {
  resource: ResourceType;
  action: ActionType;
  conditions?: PermissionCondition[];
}

export interface PermissionCondition {
  type: 'own_resource' | 'same_workspace' | 'same_enterprise' | 'non_demo' | 'active_subscription';
  value?: string;
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  conditions_checked?: PermissionCondition[];
}

// =============================================================================
// PERMISSION MATRIX
// =============================================================================

/**
 * Permission matrix defining what each role can do
 * Structure: ROLE -> RESOURCE -> ACTIONS[]
 */
const PERMISSION_MATRIX: Record<EnterpriseRole, Record<ResourceType, ActionType[]>> = {
  SUPER_ADMIN: {
    enterprise: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    workspace: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    user: ['create', 'read', 'update', 'delete', 'list', 'manage', 'invite', 'assign'],
    discovery: ['create', 'read', 'update', 'delete', 'list', 'export'],
    campaign: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    template: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    settings: ['read', 'update', 'manage'],
    billing: ['read', 'update', 'manage'],
    audit_log: ['read', 'list', 'export'],
    api_key: ['create', 'read', 'delete', 'list', 'manage'],
  },

  ENTERPRISE_ADMIN: {
    enterprise: ['read', 'update'],
    workspace: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    user: ['read', 'update', 'list', 'invite', 'assign'],
    discovery: ['create', 'read', 'update', 'delete', 'list', 'export'],
    campaign: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    template: ['create', 'read', 'update', 'delete', 'list', 'manage'],
    settings: ['read', 'update'],
    billing: ['read', 'update'],
    audit_log: ['read', 'list'],
    api_key: ['create', 'read', 'delete', 'list'],
  },

  ENTERPRISE_USER: {
    enterprise: ['read'],
    workspace: ['read', 'list'],
    user: ['read', 'list'],
    discovery: ['create', 'read', 'update', 'list'],
    campaign: ['create', 'read', 'update', 'list'],
    template: ['read', 'list'],
    settings: ['read'],
    billing: [],
    audit_log: [],
    api_key: [],
  },

  INDIVIDUAL_USER: {
    enterprise: [],
    workspace: [],
    user: ['read', 'update'], // Own profile only
    discovery: ['create', 'read', 'update', 'list'],
    campaign: ['create', 'read', 'update', 'list'],
    template: ['read', 'list'],
    settings: ['read', 'update'], // Own settings only
    billing: [],
    audit_log: [],
    api_key: [],
  },
};

// =============================================================================
// CONDITIONAL PERMISSIONS
// =============================================================================

/**
 * Conditions that apply to specific role/resource/action combinations
 */
const PERMISSION_CONDITIONS: Record<string, PermissionCondition[]> = {
  // Individual users can only update their own profile
  'INDIVIDUAL_USER:user:update': [{ type: 'own_resource' }],
  'INDIVIDUAL_USER:settings:update': [{ type: 'own_resource' }],

  // Enterprise users can only access their workspace's resources
  'ENTERPRISE_USER:discovery:create': [{ type: 'same_workspace' }],
  'ENTERPRISE_USER:discovery:read': [{ type: 'same_workspace' }],
  'ENTERPRISE_USER:campaign:create': [{ type: 'same_workspace' }],
  'ENTERPRISE_USER:campaign:read': [{ type: 'same_workspace' }],

  // Export requires non-demo account
  'ENTERPRISE_ADMIN:discovery:export': [{ type: 'non_demo' }],
  'ENTERPRISE_USER:discovery:export': [{ type: 'non_demo' }],

  // Billing requires active subscription
  'ENTERPRISE_ADMIN:billing:update': [{ type: 'active_subscription' }],
};

// =============================================================================
// PERMISSION CHECKING
// =============================================================================

/**
 * Check if a role has permission for an action on a resource
 */
export function hasPermission(
  role: EnterpriseRole,
  resource: ResourceType,
  action: ActionType
): boolean {
  const rolePermissions = PERMISSION_MATRIX[role];
  if (!rolePermissions) return false;

  const resourceActions = rolePermissions[resource];
  if (!resourceActions) return false;

  return resourceActions.includes(action);
}

/**
 * Get conditions for a specific permission
 */
export function getPermissionConditions(
  role: EnterpriseRole,
  resource: ResourceType,
  action: ActionType
): PermissionCondition[] {
  const key = `${role}:${resource}:${action}`;
  return PERMISSION_CONDITIONS[key] || [];
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: EnterpriseRole): Permission[] {
  const roleMatrix = PERMISSION_MATRIX[role];
  const permissions: Permission[] = [];

  for (const [resource, actions] of Object.entries(roleMatrix)) {
    for (const action of actions) {
      const conditions = getPermissionConditions(role, resource as ResourceType, action);
      permissions.push({
        resource: resource as ResourceType,
        action,
        conditions: conditions.length > 0 ? conditions : undefined,
      });
    }
  }

  return permissions;
}

/**
 * Check if a role can perform any action on a resource
 */
export function canAccessResource(role: EnterpriseRole, resource: ResourceType): boolean {
  const rolePermissions = PERMISSION_MATRIX[role];
  if (!rolePermissions) return false;

  const resourceActions = rolePermissions[resource];
  return resourceActions && resourceActions.length > 0;
}

/**
 * Get all actions a role can perform on a resource
 */
export function getAllowedActions(role: EnterpriseRole, resource: ResourceType): ActionType[] {
  return PERMISSION_MATRIX[role]?.[resource] || [];
}

// =============================================================================
// PERMISSION COMPARISON
// =============================================================================

/**
 * Check if role A has all permissions of role B
 */
export function roleContains(roleA: EnterpriseRole, roleB: EnterpriseRole): boolean {
  const permissionsA = getRolePermissions(roleA);
  const permissionsB = getRolePermissions(roleB);

  for (const permB of permissionsB) {
    const hasMatchingPerm = permissionsA.some(
      (permA) => permA.resource === permB.resource && permA.action === permB.action
    );
    if (!hasMatchingPerm) return false;
  }

  return true;
}

/**
 * Get permissions that role A has but role B doesn't
 */
export function getAdditionalPermissions(
  roleA: EnterpriseRole,
  roleB: EnterpriseRole
): Permission[] {
  const permissionsA = getRolePermissions(roleA);
  const permissionsB = getRolePermissions(roleB);

  return permissionsA.filter(
    (permA) =>
      !permissionsB.some(
        (permB) => permB.resource === permA.resource && permB.action === permA.action
      )
  );
}

// =============================================================================
// PERMISSION SUMMARY
// =============================================================================

/**
 * Get a human-readable summary of permissions for a role
 */
export function getPermissionSummary(role: EnterpriseRole): Record<ResourceType, string[]> {
  const matrix = PERMISSION_MATRIX[role];
  const summary: Record<ResourceType, string[]> = {} as Record<ResourceType, string[]>;

  for (const [resource, actions] of Object.entries(matrix)) {
    if (actions.length > 0) {
      summary[resource as ResourceType] = actions;
    }
  }

  return summary;
}

/**
 * Get all resources a role can access
 */
export function getAccessibleResources(role: EnterpriseRole): ResourceType[] {
  const matrix = PERMISSION_MATRIX[role];
  const resources: ResourceType[] = [];

  for (const [resource, actions] of Object.entries(matrix)) {
    if (actions.length > 0) {
      resources.push(resource as ResourceType);
    }
  }

  return resources;
}

// =============================================================================
// FEATURE FLAGS BASED ON PERMISSIONS
// =============================================================================

/**
 * Get feature flags based on role permissions
 */
export function getRoleFeatureFlags(role: EnterpriseRole): Record<string, boolean> {
  return {
    can_manage_enterprise: hasPermission(role, 'enterprise', 'manage'),
    can_manage_workspaces: hasPermission(role, 'workspace', 'manage'),
    can_manage_users: hasPermission(role, 'user', 'manage'),
    can_invite_users: hasPermission(role, 'user', 'invite'),
    can_manage_billing: hasPermission(role, 'billing', 'manage'),
    can_view_audit_logs: hasPermission(role, 'audit_log', 'read'),
    can_export_data: hasPermission(role, 'discovery', 'export'),
    can_manage_api_keys: hasPermission(role, 'api_key', 'manage'),
    can_manage_campaigns: hasPermission(role, 'campaign', 'manage'),
    can_manage_templates: hasPermission(role, 'template', 'manage'),
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export const permissions = {
  // Core checks
  has: hasPermission,
  getConditions: getPermissionConditions,
  canAccess: canAccessResource,
  getAllowedActions,

  // Role queries
  getRolePermissions,
  getPermissionSummary,
  getAccessibleResources,
  getRoleFeatureFlags,

  // Comparison
  roleContains,
  getAdditionalPermissions,

  // Constants
  MATRIX: PERMISSION_MATRIX,
  CONDITIONS: PERMISSION_CONDITIONS,
};

export default permissions;
