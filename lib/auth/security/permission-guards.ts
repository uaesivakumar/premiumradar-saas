/**
 * Permission Guards - Sprint S49
 * Enhanced permission checking with conditions
 *
 * Features:
 * - Role-based access control
 * - Time-based restrictions
 * - IP-based conditions
 * - MFA requirements
 * - Tenant isolation
 */

import {
  PermissionGuard,
  PermissionCondition,
  PermissionCheckResult,
} from './types';
import { isIPAllowed } from './ip-allowlist';

// In-memory store for guards (use database in production)
const guardStore = new Map<string, PermissionGuard[]>();

// ============================================================
// BUILT-IN GUARDS
// ============================================================

const BUILT_IN_GUARDS: PermissionGuard[] = [
  // Data export requires specific permission
  {
    resource: 'data',
    action: 'export',
    conditions: [
      { type: 'permission', operator: 'in', value: ['data:export', 'admin:*'] },
    ],
    deniedMessage: 'You do not have permission to export data',
  },
  // Team management requires admin role
  {
    resource: 'team',
    action: 'manage',
    conditions: [
      { type: 'role', operator: 'in', value: ['admin', 'owner'] },
    ],
    deniedMessage: 'Only admins can manage team members',
  },
  // Settings changes require MFA
  {
    resource: 'settings',
    action: 'security',
    conditions: [
      { type: 'mfa', operator: 'equals', value: 'verified' },
    ],
    deniedMessage: 'MFA verification required for security settings',
  },
  // Billing requires owner role
  {
    resource: 'billing',
    action: '*',
    conditions: [
      { type: 'role', operator: 'equals', value: 'owner' },
    ],
    deniedMessage: 'Only workspace owners can manage billing',
  },
];

// ============================================================
// PERMISSION CONTEXT
// ============================================================

export interface PermissionContext {
  tenantId: string;
  userId: string;
  role: string;
  permissions: string[];
  mfaVerified: boolean;
  ip?: string;
  currentTime?: Date;
}

// ============================================================
// GUARD MANAGEMENT
// ============================================================

/**
 * Get guards for a tenant (includes built-in)
 */
export function getGuards(tenantId: string): PermissionGuard[] {
  const customGuards = guardStore.get(tenantId) || [];
  return [...BUILT_IN_GUARDS, ...customGuards];
}

/**
 * Add custom guard for a tenant
 */
export function addGuard(tenantId: string, guard: PermissionGuard): void {
  const existing = guardStore.get(tenantId) || [];
  existing.push(guard);
  guardStore.set(tenantId, existing);
}

/**
 * Remove custom guard
 */
export function removeGuard(tenantId: string, resource: string, action: string): boolean {
  const existing = guardStore.get(tenantId) || [];
  const filtered = existing.filter(
    g => !(g.resource === resource && g.action === action)
  );

  if (filtered.length !== existing.length) {
    guardStore.set(tenantId, filtered);
    return true;
  }

  return false;
}

// ============================================================
// PERMISSION CHECKING
// ============================================================

/**
 * Check if action is allowed
 */
export function checkPermission(
  resource: string,
  action: string,
  context: PermissionContext
): PermissionCheckResult {
  const guards = getGuards(context.tenantId);

  // Find applicable guards
  const applicableGuards = guards.filter(
    g =>
      (g.resource === resource || g.resource === '*') &&
      (g.action === action || g.action === '*')
  );

  // If no guards apply, allow by default
  if (applicableGuards.length === 0) {
    return { allowed: true };
  }

  // Check all applicable guards
  for (const guard of applicableGuards) {
    const result = evaluateGuard(guard, context);
    if (!result.allowed) {
      return result;
    }
  }

  return { allowed: true };
}

/**
 * Evaluate a single guard
 */
function evaluateGuard(guard: PermissionGuard, context: PermissionContext): PermissionCheckResult {
  for (const condition of guard.conditions) {
    const conditionMet = evaluateCondition(condition, context);

    if (!conditionMet) {
      return {
        allowed: false,
        reason: guard.deniedMessage || 'Permission denied',
        requiredAction: getRequiredAction(condition),
      };
    }
  }

  return { allowed: true };
}

/**
 * Evaluate a single condition
 */
function evaluateCondition(condition: PermissionCondition, context: PermissionContext): boolean {
  switch (condition.type) {
    case 'role':
      return evaluateRoleCondition(condition, context.role);

    case 'permission':
      return evaluatePermissionCondition(condition, context.permissions);

    case 'tenant':
      return evaluateTenantCondition(condition, context.tenantId);

    case 'mfa':
      return evaluateMFACondition(condition, context.mfaVerified);

    case 'ip':
      return evaluateIPCondition(condition, context);

    case 'time':
      return evaluateTimeCondition(condition, context.currentTime || new Date());

    default:
      return false;
  }
}

/**
 * Evaluate role condition
 */
function evaluateRoleCondition(condition: PermissionCondition, role: string): boolean {
  const value = condition.value;

  switch (condition.operator) {
    case 'equals':
      return role === value;
    case 'in':
      return Array.isArray(value) && value.includes(role);
    case 'not_in':
      return Array.isArray(value) && !value.includes(role);
    default:
      return false;
  }
}

/**
 * Evaluate permission condition
 */
function evaluatePermissionCondition(condition: PermissionCondition, permissions: string[]): boolean {
  const required = Array.isArray(condition.value) ? condition.value : [condition.value];

  switch (condition.operator) {
    case 'in':
      // User has any of the required permissions
      return required.some(req => {
        if (req.endsWith(':*')) {
          // Wildcard permission
          const prefix = req.slice(0, -1);
          return permissions.some(p => p.startsWith(prefix) || p === 'admin:*');
        }
        return permissions.includes(req) || permissions.includes('admin:*');
      });
    case 'not_in':
      return !required.some(req => permissions.includes(req));
    default:
      return false;
  }
}

/**
 * Evaluate tenant condition
 */
function evaluateTenantCondition(condition: PermissionCondition, tenantId: string): boolean {
  const value = condition.value;

  switch (condition.operator) {
    case 'equals':
      return tenantId === value;
    case 'in':
      return Array.isArray(value) && value.includes(tenantId);
    case 'not_in':
      return Array.isArray(value) && !value.includes(tenantId);
    default:
      return false;
  }
}

/**
 * Evaluate MFA condition
 */
function evaluateMFACondition(condition: PermissionCondition, mfaVerified: boolean): boolean {
  if (condition.operator === 'equals' && condition.value === 'verified') {
    return mfaVerified;
  }
  return !mfaVerified;
}

/**
 * Evaluate IP condition
 */
function evaluateIPCondition(condition: PermissionCondition, context: PermissionContext): boolean {
  if (!context.ip) return false;

  // Use IP allowlist checker
  const result = isIPAllowed(context.tenantId, context.ip);
  return result.allowed;
}

/**
 * Evaluate time condition
 * Value format: "HH:MM-HH:MM" (e.g., "09:00-17:00")
 */
function evaluateTimeCondition(condition: PermissionCondition, currentTime: Date): boolean {
  if (typeof condition.value !== 'string') return false;

  const [startStr, endStr] = condition.value.split('-');
  if (!startStr || !endStr) return false;

  const [startHour, startMin] = startStr.split(':').map(Number);
  const [endHour, endMin] = endStr.split(':').map(Number);

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  const inRange = currentMinutes >= startMinutes && currentMinutes <= endMinutes;

  return condition.operator === 'in' ? inRange : !inRange;
}

/**
 * Get required action for failed condition
 */
function getRequiredAction(condition: PermissionCondition): string | undefined {
  switch (condition.type) {
    case 'mfa':
      return 'mfa_required';
    case 'role':
      return 'role_upgrade_required';
    case 'ip':
      return 'ip_restriction';
    case 'time':
      return 'time_restriction';
    default:
      return undefined;
  }
}

// ============================================================
// CONVENIENCE FUNCTIONS
// ============================================================

/**
 * Check if user can export data
 */
export function canExport(context: PermissionContext): PermissionCheckResult {
  return checkPermission('data', 'export', context);
}

/**
 * Check if user can manage team
 */
export function canManageTeam(context: PermissionContext): PermissionCheckResult {
  return checkPermission('team', 'manage', context);
}

/**
 * Check if user can change security settings
 */
export function canChangeSecuritySettings(context: PermissionContext): PermissionCheckResult {
  return checkPermission('settings', 'security', context);
}

/**
 * Check if user can access billing
 */
export function canAccessBilling(context: PermissionContext): PermissionCheckResult {
  return checkPermission('billing', '*', context);
}

/**
 * Create time-based guard
 */
export function createTimeGuard(
  tenantId: string,
  resource: string,
  action: string,
  allowedHours: string,
  message?: string
): void {
  addGuard(tenantId, {
    resource,
    action,
    conditions: [
      { type: 'time', operator: 'in', value: allowedHours },
    ],
    deniedMessage: message || `This action is only allowed during ${allowedHours}`,
  });
}

/**
 * Create MFA-required guard
 */
export function createMFAGuard(
  tenantId: string,
  resource: string,
  action: string,
  message?: string
): void {
  addGuard(tenantId, {
    resource,
    action,
    conditions: [
      { type: 'mfa', operator: 'equals', value: 'verified' },
    ],
    deniedMessage: message || 'MFA verification required for this action',
  });
}

export default {
  getGuards,
  addGuard,
  removeGuard,
  checkPermission,
  canExport,
  canManageTeam,
  canChangeSecuritySettings,
  canAccessBilling,
  createTimeGuard,
  createMFAGuard,
};
