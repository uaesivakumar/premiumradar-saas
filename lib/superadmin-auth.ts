/**
 * Super Admin Auth Helper
 *
 * Wrapper around the security module for easier use in API routes.
 */

import { headers } from 'next/headers';
import { verifySession, type SuperAdminSession } from '@/lib/superadmin/security';

export interface SessionValidationResult {
  valid: boolean;
  session?: SuperAdminSession;
  error?: string;
}

/**
 * Validate super admin session from request context
 * Uses headers() to get IP and user agent automatically
 */
export async function validateSuperAdminSession(): Promise<SessionValidationResult> {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    return await verifySession(ip, userAgent);
  } catch (error) {
    console.error('[SuperAdmin Auth] Session validation error:', error);
    return { valid: false, error: 'Session validation failed' };
  }
}
