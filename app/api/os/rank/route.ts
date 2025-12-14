/**
 * OS Rank API Proxy
 * VS1: Secure SaaS→OS boundary
 *
 * SECURITY:
 * - Requires authenticated session
 * - NEVER trusts client-sent tenant_id - injected from session
 *
 * Authorization Code: VS1-VS9-APPROVED-20251213
 */

import { NextRequest, NextResponse } from 'next/server';
import { osClient } from '@/lib/os-client';
import { getServerSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    // VS1: Require authenticated session
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // VS1: CRITICAL - Override any client-sent tenant_id with session tenant_id
    const securePayload = {
      ...body,
      tenant_id: session.tenantId,
    };

    // Log audit trail
    console.log(`[OS Rank] tenant=${session.tenantId} user=${session.user.id} entities=${body.entities?.length || 0}`);

    // VS5: Set tenant context for RLS enforcement in OS
    osClient.setContext({
      tenantId: session.tenantId,
      userId: session.user.id,
    });

    const result = await osClient.rank(securePayload);

    // Clear context after request
    osClient.clearContext();

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /os/rank] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Rank request failed' },
      { status: 500 }
    );
  }
}
