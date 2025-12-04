/**
 * Super Admin Session API
 *
 * GET /api/superadmin/session - Get current session info
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import {
  verifySession,
  getSessionInfo,
  logAccess,
} from '@/lib/superadmin/security';

/**
 * GET - Get current session info
 */
export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               headersList.get('x-real-ip') ||
               'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    const result = await verifySession(ip, userAgent);

    if (!result.valid) {
      return NextResponse.json({
        valid: false,
        error: result.error
      });
    }

    const sessionInfo = getSessionInfo(result.session!);

    logAccess({
      timestamp: new Date().toISOString(),
      action: 'ACCESS',
      email: result.session!.email,
      ip,
      userAgent,
      details: 'Session verified',
      success: true
    });

    return NextResponse.json({
      valid: true,
      session: sessionInfo
    });

  } catch (error) {
    console.error('[SuperAdmin Session] Error:', error);
    return NextResponse.json({
      valid: false,
      error: 'Session verification failed'
    });
  }
}
