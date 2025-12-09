/**
 * RBAC Enforcement - Sprint S141.2
 *
 * API-level and middleware-level role-based access control enforcement.
 * Ensures tenant isolation and proper role hierarchy checks.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  UserRole,
  EnhancedSessionPayload,
  RouteProtection,
  PREMIUM_ROUTES,
  ADMIN_ROUTES,
  SUPER_ADMIN_ROUTES,
  hasRequiredRole,
  canAccessRoute,
  requiresMFAForRole,
} from './types';

// ============================================================
// API ROUTE PROTECTION
// ============================================================

export interface APIProtectionResult {
  allowed: boolean;
  statusCode: number;
  error?: string;
  redirectTo?: string;
}

/**
 * Check if session can access API resource
 */
export function checkAPIAccess(
  session: EnhancedSessionPayload | null,
  requiredRole: UserRole,
  resourceTenantId?: string
): APIProtectionResult {
  // No session
  if (!session) {
    return {
      allowed: false,
      statusCode: 401,
      error: 'Authentication required',
    };
  }

  // Check role hierarchy
  if (!hasRequiredRole(session.role, requiredRole)) {
    return {
      allowed: false,
      statusCode: 403,
      error: `Insufficient permissions. Required: ${requiredRole}, Current: ${session.role}`,
    };
  }

  // Check MFA for privileged roles
  if (requiresMFAForRole(session.role) && !session.mfa_verified) {
    return {
      allowed: false,
      statusCode: 403,
      error: 'MFA verification required for this role',
      redirectTo: '/mfa-required',
    };
  }

  // Check tenant isolation (SUPER_ADMIN can access any tenant)
  if (resourceTenantId && session.role !== 'SUPER_ADMIN') {
    if (session.tenant_id !== resourceTenantId) {
      return {
        allowed: false,
        statusCode: 403,
        error: 'Cross-tenant access denied',
      };
    }
  }

  return { allowed: true, statusCode: 200 };
}

/**
 * API route wrapper with RBAC enforcement
 */
export function withRBAC<T>(
  handler: (request: NextRequest, session: EnhancedSessionPayload) => Promise<T>,
  requiredRole: UserRole,
  options?: {
    requireMFA?: boolean;
    requireActiveSubscription?: boolean;
  }
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Get session from header (set by middleware)
    const sessionHeader = request.headers.get('x-session');
    let session: EnhancedSessionPayload | null = null;

    if (sessionHeader) {
      try {
        session = JSON.parse(sessionHeader);
      } catch {
        // Invalid session header
      }
    }

    // Check access
    const access = checkAPIAccess(session, requiredRole);

    if (!access.allowed) {
      return NextResponse.json(
        { error: access.error },
        { status: access.statusCode }
      );
    }

    // Additional MFA check if required
    if (options?.requireMFA && !session!.mfa_verified) {
      return NextResponse.json(
        { error: 'MFA verification required', redirectTo: '/mfa-required' },
        { status: 403 }
      );
    }

    // Subscription check if required
    if (options?.requireActiveSubscription) {
      const status = session!.subscription_status;
      if (status !== 'active' && status !== 'trialing') {
        return NextResponse.json(
          { error: 'Active subscription required', redirectTo: '/pricing' },
          { status: 402 }
        );
      }
    }

    // Execute handler
    try {
      const result = await handler(request, session!);
      return NextResponse.json(result);
    } catch (error) {
      console.error('API handler error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// ============================================================
// MIDDLEWARE PROTECTION
// ============================================================

/**
 * Get route protection configuration for a path
 */
export function getRouteProtection(pathname: string): RouteProtection | null {
  // Check Super Admin routes first
  for (const route of SUPER_ADMIN_ROUTES) {
    if (pathname.startsWith(route.path)) {
      return route;
    }
  }

  // Check Admin routes
  for (const route of ADMIN_ROUTES) {
    if (pathname.startsWith(route.path)) {
      return route;
    }
  }

  // Check Premium routes
  for (const route of PREMIUM_ROUTES) {
    if (pathname.startsWith(route.path)) {
      return route;
    }
  }

  return null;
}

/**
 * Check middleware access for a route
 */
export function checkMiddlewareAccess(
  pathname: string,
  session: EnhancedSessionPayload | null
): {
  allowed: boolean;
  redirectTo?: string;
  reason?: string;
} {
  const protection = getRouteProtection(pathname);

  // No protection required
  if (!protection) {
    return { allowed: true };
  }

  // No session for protected route
  if (!session) {
    return {
      allowed: false,
      redirectTo: '/login',
      reason: 'Authentication required',
    };
  }

  // Use canAccessRoute for comprehensive check
  const accessResult = canAccessRoute(session, protection);

  if (!accessResult.allowed) {
    // Determine redirect based on reason
    if (accessResult.reason?.includes('MFA')) {
      return {
        allowed: false,
        redirectTo: '/mfa-required',
        reason: accessResult.reason,
      };
    }

    if (accessResult.reason?.includes('subscription') || accessResult.reason?.includes('Plan')) {
      return {
        allowed: false,
        redirectTo: '/pricing',
        reason: accessResult.reason,
      };
    }

    if (accessResult.reason?.includes('role')) {
      return {
        allowed: false,
        redirectTo: '/dashboard',
        reason: accessResult.reason,
      };
    }

    return {
      allowed: false,
      redirectTo: '/dashboard',
      reason: accessResult.reason,
    };
  }

  return { allowed: true };
}

// ============================================================
// TENANT ISOLATION
// ============================================================

/**
 * Validate tenant access for a resource
 */
export function validateTenantAccess(
  session: EnhancedSessionPayload,
  resourceTenantId: string
): boolean {
  // SUPER_ADMIN can access any tenant
  if (session.role === 'SUPER_ADMIN') {
    return true;
  }

  // All other roles must match tenant
  return session.tenant_id === resourceTenantId;
}

/**
 * Filter resources by tenant
 */
export function filterByTenant<T extends { tenant_id: string }>(
  resources: T[],
  session: EnhancedSessionPayload
): T[] {
  // SUPER_ADMIN sees all
  if (session.role === 'SUPER_ADMIN') {
    return resources;
  }

  // Others see only their tenant
  return resources.filter((r) => r.tenant_id === session.tenant_id);
}

// ============================================================
// AUDIT LOGGING
// ============================================================

export interface AccessAuditLog {
  timestamp: string;
  userId: string;
  tenantId: string;
  role: UserRole;
  action: string;
  resource: string;
  resourceTenantId?: string;
  allowed: boolean;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

const auditLogs: AccessAuditLog[] = [];

/**
 * Log access attempt for audit trail
 */
export function logAccessAttempt(log: Omit<AccessAuditLog, 'timestamp'>): void {
  auditLogs.push({
    ...log,
    timestamp: new Date().toISOString(),
  });

  // In production, send to logging service
  if (!log.allowed) {
    console.warn('[RBAC] Access denied:', log);
  }
}

/**
 * Get recent access logs (for Super Admin)
 */
export function getAccessLogs(
  filter?: {
    userId?: string;
    tenantId?: string;
    allowed?: boolean;
  },
  limit: number = 100
): AccessAuditLog[] {
  let logs = [...auditLogs];

  if (filter?.userId) {
    logs = logs.filter((l) => l.userId === filter.userId);
  }

  if (filter?.tenantId) {
    logs = logs.filter((l) => l.tenantId === filter.tenantId);
  }

  if (filter?.allowed !== undefined) {
    logs = logs.filter((l) => l.allowed === filter.allowed);
  }

  return logs.slice(-limit);
}

export default {
  checkAPIAccess,
  withRBAC,
  getRouteProtection,
  checkMiddlewareAccess,
  validateTenantAccess,
  filterByTenant,
  logAccessAttempt,
  getAccessLogs,
};
