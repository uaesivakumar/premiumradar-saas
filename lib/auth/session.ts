/**
 * Session Management
 *
 * Server session utilities - uses internal JWT auth (NO SUPABASE)
 */

import { getSessionFromCookies } from './session/enhanced-session';
import { getUserWithProfile } from '@/lib/db/users';

export interface UserSession {
  user: {
    id: string;
    email: string;
    name?: string;
    role?: string;
    permissions?: string[];
  };
  tenantId: string;
  tenantName?: string;
  expiresAt: Date;
}

/**
 * Get the current server session from JWT cookie
 * Returns null if not authenticated
 */
export async function getServerSession(): Promise<UserSession | null> {
  const result = await getSessionFromCookies();

  if (!result.success || !result.session) {
    return null;
  }

  const session = result.session;

  // Get additional user data from DB if needed
  const userWithProfile = await getUserWithProfile(session.user_id);

  return {
    user: {
      id: session.user_id,
      email: session.email,
      name: session.name,
      role: session.role,
      permissions: [], // Can be extended from DB
    },
    tenantId: session.tenant_id,
    tenantName: session.tenant_name || userWithProfile?.tenant?.name,
    expiresAt: new Date(session.exp * 1000),
  };
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireSession(): Promise<UserSession> {
  const session = await getServerSession();
  if (!session) {
    throw new Error('Authentication required');
  }
  return session;
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(session: UserSession, permission: string): boolean {
  return session.user.permissions?.includes(permission) || false;
}

/**
 * Check if user has any of the given permissions
 */
export function hasAnyPermission(session: UserSession, permissions: string[]): boolean {
  return permissions.some((p) => hasPermission(session, p));
}

/**
 * Check if user has all of the given permissions
 */
export function hasAllPermissions(session: UserSession, permissions: string[]): boolean {
  return permissions.every((p) => hasPermission(session, p));
}
