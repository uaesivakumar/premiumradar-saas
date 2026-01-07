/**
 * Auth Gate Middleware
 *
 * S350: Security Hole Remediation & Auth Enforcement
 * Behavior Contract B001: All API endpoints require authentication
 *
 * Provides reusable authentication enforcement for API routes.
 * CRITICAL: Never trust client-sent tenant_id - always inject from session.
 */

import { NextResponse } from 'next/server';
import { getServerSession, UserSession } from '@/lib/auth/session';

export interface AuthGateResult {
  success: true;
  session: UserSession;
}

export interface AuthGateError {
  success: false;
  response: NextResponse;
}

export type AuthGateOutput = AuthGateResult | AuthGateError;

/**
 * Enforce authentication on API routes
 *
 * Usage:
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const auth = await requireAuth();
 *   if (!auth.success) return auth.response;
 *   const { session } = auth;
 *   // session.tenantId is now guaranteed to be valid
 * }
 * ```
 */
export async function requireAuth(): Promise<AuthGateOutput> {
  const session = await getServerSession();

  if (!session) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  return {
    success: true,
    session,
  };
}

/**
 * Enforce authentication with specific role requirement
 */
export async function requireAuthWithRole(
  allowedRoles: string[]
): Promise<AuthGateOutput> {
  const auth = await requireAuth();
  if (!auth.success) return auth;

  const { session } = auth;
  const userRole = session.user.role || 'user';

  if (!allowedRoles.includes(userRole)) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      ),
    };
  }

  return auth;
}

/**
 * Inject secure tenant context into request payload
 * CRITICAL: This overrides any client-sent tenant_id with the session tenant_id
 *
 * @param body - Original request body
 * @param session - Authenticated session
 * @returns Secure payload with tenant_id from session
 */
export function injectSecureTenantContext<T extends Record<string, unknown>>(
  body: T,
  session: UserSession
): T & { tenant_id: string; enterprise_id: string } {
  return {
    ...body,
    // VS1: CRITICAL - Override any client-sent tenant_id with session tenant_id
    tenant_id: session.tenantId,
    enterprise_id: session.enterpriseId,
  };
}

/**
 * Create standard 401 response
 */
export function unauthorized(message = 'Authentication required'): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  );
}

/**
 * Create standard 403 response
 */
export function forbidden(message = 'Insufficient permissions'): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 403 }
  );
}
