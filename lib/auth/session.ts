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

  // Enterprise (new - spec v1.1)
  enterpriseId: string;
  enterpriseName?: string;
  workspaceId?: string;
  workspaceName?: string;

  // Demo flags (new - spec v1.1)
  isDemo?: boolean;
  demoType?: 'SYSTEM' | 'ENTERPRISE';
  demoExpiresAt?: Date;

  // Legacy tenant fields (for backward compatibility)
  /** @deprecated Use enterpriseId instead */
  tenantId: string;
  /** @deprecated Use enterpriseName instead */
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

  // Resolve enterprise ID (prefer new field, fallback to legacy)
  const enterpriseId = session.enterprise_id || session.tenant_id;
  const enterpriseName = session.enterprise_name || session.tenant_name || userWithProfile?.tenant?.name;

  return {
    user: {
      id: session.user_id,
      email: session.email,
      name: session.name,
      role: session.role,
      permissions: [], // Can be extended from DB
    },

    // Enterprise fields (new)
    enterpriseId,
    enterpriseName,
    workspaceId: session.workspace_id,
    workspaceName: session.workspace_name,

    // Demo flags
    isDemo: session.is_demo,
    demoType: session.demo_type,
    demoExpiresAt: session.demo_expires_at ? new Date(session.demo_expires_at) : undefined,

    // Legacy tenant fields (for backward compatibility)
    tenantId: enterpriseId,
    tenantName: enterpriseName,

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
