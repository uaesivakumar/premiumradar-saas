/**
 * Role-Based Access Control (RBAC)
 *
 * Permission management for workspace roles.
 */

import type { TeamRole, Permission, PermissionMatrix } from './types';

/**
 * Permission Matrix
 *
 * Defines what each role can do.
 */
export const PERMISSION_MATRIX: PermissionMatrix = {
  owner: [
    // Full workspace control
    'workspace:read',
    'workspace:update',
    'workspace:delete',
    'workspace:billing',
    // Full team control
    'team:read',
    'team:invite',
    'team:remove',
    'team:role:change',
    // All feature access
    'discovery:read',
    'discovery:export',
    'outreach:read',
    'outreach:create',
    'outreach:send',
    'analytics:read',
    'analytics:export',
    // API management
    'api:read',
    'api:create',
    'api:revoke',
  ],

  admin: [
    // Workspace read + update (no delete/billing)
    'workspace:read',
    'workspace:update',
    // Team management (can't remove owner or change to owner)
    'team:read',
    'team:invite',
    'team:remove',
    'team:role:change',
    // All feature access
    'discovery:read',
    'discovery:export',
    'outreach:read',
    'outreach:create',
    'outreach:send',
    'analytics:read',
    'analytics:export',
    // API management
    'api:read',
    'api:create',
    'api:revoke',
  ],

  analyst: [
    // Workspace read only
    'workspace:read',
    // Team read only
    'team:read',
    // Full feature usage
    'discovery:read',
    'discovery:export',
    'outreach:read',
    'outreach:create',
    'outreach:send',
    'analytics:read',
    // No API management
  ],

  viewer: [
    // Workspace read only
    'workspace:read',
    // Team read only
    'team:read',
    // Read-only feature access
    'discovery:read',
    'outreach:read',
    'analytics:read',
    // No exports, no creation, no API
  ],
};

/**
 * Role hierarchy (higher index = more permissions)
 */
export const ROLE_HIERARCHY: TeamRole[] = ['viewer', 'analyst', 'admin', 'owner'];

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: TeamRole, permission: Permission): boolean {
  return PERMISSION_MATRIX[role]?.includes(permission) ?? false;
}

/**
 * Check if a role can manage another role
 */
export function canManageRole(actorRole: TeamRole, targetRole: TeamRole): boolean {
  const actorIndex = ROLE_HIERARCHY.indexOf(actorRole);
  const targetIndex = ROLE_HIERARCHY.indexOf(targetRole);

  // Can only manage roles below yours
  return actorIndex > targetIndex;
}

/**
 * Check if a role can assign another role
 */
export function canAssignRole(actorRole: TeamRole, newRole: TeamRole): boolean {
  // Owners can assign any role
  if (actorRole === 'owner') return true;

  // Admins can assign analyst or viewer
  if (actorRole === 'admin') {
    return newRole === 'analyst' || newRole === 'viewer';
  }

  // Others can't assign roles
  return false;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: TeamRole): Permission[] {
  return PERMISSION_MATRIX[role] || [];
}

/**
 * Get role display info
 */
export function getRoleInfo(role: TeamRole): {
  label: string;
  description: string;
  color: string;
} {
  const info: Record<TeamRole, { label: string; description: string; color: string }> = {
    owner: {
      label: 'Owner',
      description: 'Full control over workspace, billing, and all settings',
      color: 'purple',
    },
    admin: {
      label: 'Admin',
      description: 'Manage team members and all features, no billing access',
      color: 'blue',
    },
    analyst: {
      label: 'Analyst',
      description: 'Use all features, create outreach, export data',
      color: 'green',
    },
    viewer: {
      label: 'Viewer',
      description: 'View-only access to discovery and analytics',
      color: 'gray',
    },
  };

  return info[role];
}

/**
 * Permission guard for API routes
 */
export function createPermissionGuard(requiredPermission: Permission) {
  return (userRole: TeamRole): boolean => {
    return hasPermission(userRole, requiredPermission);
  };
}

/**
 * Get available roles that can be assigned by a given role
 */
export function getAssignableRoles(actorRole: TeamRole): TeamRole[] {
  if (actorRole === 'owner') {
    return ['admin', 'analyst', 'viewer'];
  }
  if (actorRole === 'admin') {
    return ['analyst', 'viewer'];
  }
  return [];
}
