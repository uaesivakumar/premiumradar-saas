/**
 * OS Discovery API Proxy
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
    console.log(`[OS Discovery] tenant=${session.tenantId} user=${session.user.id} region=${body.region_code || 'default'}`);

    // VS5: Set tenant context for RLS enforcement in OS
    osClient.setContext({
      tenantId: session.tenantId,
      userId: session.user.id,
    });

    const result = await osClient.discovery(securePayload);

    // Clear context after request
    osClient.clearContext();

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /os/discovery] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Discovery request failed' },
      { status: 500 }
    );
  }
}
