/**
 * Diagnostic Endpoint: ResolvedContext
 * Returns the exact 8-field context for validation
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifySession } from '@/lib/superadmin/security';
import { getResolvedContext } from '@/lib/auth/session/session-context';

export async function GET() {
  try {
    // For super admin, return their context
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               headersList.get('x-real-ip') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    const sessionResult = await verifySession(ip, userAgent);

    if (sessionResult.valid && sessionResult.session) {
      return NextResponse.json({
        user_id: '00000000-0000-0000-0000-000000000001',
        role: 'SUPER_ADMIN',
        enterprise_id: null,
        workspace_id: null,
        sub_vertical_id: null,
        region_code: null,
        is_demo: false,
        demo_type: null,
        _source: 'super_admin_session',
        _email: sessionResult.session.email,
      });
    }

    // For regular users, use ResolvedContext
    const context = await getResolvedContext();

    if (!context) {
      return NextResponse.json({
        error: 'Not authenticated',
        _fields: [
          'user_id',
          'role',
          'enterprise_id',
          'workspace_id',
          'sub_vertical_id',
          'region_code',
          'is_demo',
          'demo_type'
        ]
      }, { status: 401 });
    }

    return NextResponse.json(context);
  } catch (error) {
    console.error('[Diag] Context error:', error);
    return NextResponse.json(
      { error: 'Context resolution failed' },
      { status: 500 }
    );
  }
}
