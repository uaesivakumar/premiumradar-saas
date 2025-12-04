/**
 * Super Admin Authentication API
 *
 * POST /api/superadmin/auth - Authenticate super admin
 * DELETE /api/superadmin/auth - Logout
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import {
  authenticate,
  createSessionCookie,
  clearSessionCookie,
  logAccess,
} from '@/lib/superadmin/security';

/**
 * POST - Authenticate Super Admin
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, secretCode } = body;

    if (!email || !secretCode) {
      return NextResponse.json(
        { success: false, error: 'Email and access code are required' },
        { status: 400 }
      );
    }

    // Get client info
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               headersList.get('x-real-ip') ||
               'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    // Authenticate
    const result = await authenticate(email, secretCode, ip, userAgent);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          remainingAttempts: result.remainingAttempts,
          lockoutMinutes: result.lockoutMinutes
        },
        { status: 401 }
      );
    }

    // Set session cookie
    const sessionCookie = createSessionCookie(result.session!);
    const cookieStore = await cookies();
    cookieStore.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.options
    );

    return NextResponse.json({
      success: true,
      message: 'Authentication successful'
    });

  } catch (error) {
    console.error('[SuperAdmin Auth] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Logout Super Admin
 */
export async function DELETE(request: NextRequest) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               headersList.get('x-real-ip') ||
               'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    // Clear session cookie
    const clearCookie = clearSessionCookie();
    const cookieStore = await cookies();
    cookieStore.set(clearCookie.name, clearCookie.value, clearCookie.options);

    logAccess({
      timestamp: new Date().toISOString(),
      action: 'LOGOUT',
      ip,
      userAgent,
      success: true
    });

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('[SuperAdmin Logout] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}
