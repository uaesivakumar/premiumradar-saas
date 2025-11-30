/**
 * Session Management
 * Sprint S54: Admin Panel
 *
 * Server session utilities for authentication
 */

import { createClient } from '@/lib/supabase/server';

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
 * Get the current server session
 * Returns null if not authenticated
 */
export async function getServerSession(): Promise<UserSession | null> {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Get user's tenant and permissions
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, tenant:tenants(*), role:roles(*)')
    .eq('id', user.id)
    .single();

  // Type assertions for nested objects from DB
  const profileData = profile as Record<string, unknown> | null;
  const tenant = profileData?.tenant as Record<string, unknown> | null;
  const role = profileData?.role as Record<string, unknown> | null;

  if (!tenant) {
    return null;
  }

  // Extract permissions from role
  const permissions = (role?.permissions as string[]) || [];

  return {
    user: {
      id: user.id,
      email: user.email || '',
      name: (profileData?.full_name as string) || (profileData?.name as string) || undefined,
      role: role?.name as string | undefined,
      permissions,
    },
    tenantId: tenant.id as string,
    tenantName: tenant.name as string | undefined,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
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
