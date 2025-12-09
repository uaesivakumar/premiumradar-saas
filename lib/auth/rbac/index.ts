/**
 * RBAC Module - Sprint S141.2
 *
 * Exports RBAC types, enforcement, and helpers.
 */

// Types
export {
  type UserRole,
  type RoleCapabilities,
  type EnhancedSessionPayload,
  type RouteProtection,
  type SubscriptionStatus,
  type PlanType,
  ROLE_HIERARCHY,
  ROLE_CAPABILITIES,
  PREMIUM_ROUTES,
  ADMIN_ROUTES,
  SUPER_ADMIN_ROUTES,
  hasRequiredRole,
  canAccessRoute,
  requiresMFAForRole,
  getRoleCapabilities,
} from './types';

// Enforcement
export {
  type APIProtectionResult,
  type AccessAuditLog,
  checkAPIAccess,
  withRBAC,
  getRouteProtection,
  checkMiddlewareAccess,
  validateTenantAccess,
  filterByTenant,
  logAccessAttempt,
  getAccessLogs,
} from './enforcement';
