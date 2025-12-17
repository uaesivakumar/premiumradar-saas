/**
 * OS Intelligence Session API Proxy
 * S224-S227: Decision Mode
 *
 * SECURITY:
 * - Requires authenticated session
 * - NEVER trusts client-sent tenant_id - injected from session
 *
 * Response Contract:
 * {
 *   primary_recommendation: { company, why_now[], confidence, next_action, score_drivers[] },
 *   shortlist: Company[5],
 *   collapsed_count: number,
 *   collapsed_message: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { osClient } from '@/lib/os-client';
import { getServerSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    // Require authenticated session
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // CRITICAL - Override any client-sent tenant_id with session tenant_id
    const securePayload = {
      ...body,
      tenant_id: session.tenantId,
      user_id: session.user.id,
    };

    // Log audit trail
    console.log(`[OS Intelligence Session] tenant=${session.tenantId} user=${session.user.id} vertical=${body.vertical}`);

    // Set tenant context for RLS enforcement in OS
    osClient.setContext({
      tenantId: session.tenantId,
      userId: session.user.id,
    });

    const result = await osClient.intelligenceSession(securePayload);

    // Clear context after request
    osClient.clearContext();

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /os/intelligence/session] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Intelligence session request failed' },
      { status: 500 }
    );
  }
}
