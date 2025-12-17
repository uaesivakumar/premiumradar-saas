/**
 * OS Intelligence Feedback API Proxy
 * S221/S225: Visible Learning
 *
 * SECURITY:
 * - Requires authenticated session
 *
 * Response Contract:
 * {
 *   feedback_recorded: boolean,
 *   preference_updated: boolean,
 *   what_changed: string  // S225: Visible learning acknowledgment
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

    // Validate required fields
    if (!body.session_id || !body.company_id || !body.action) {
      return NextResponse.json(
        { success: false, error: 'session_id, company_id, and action are required' },
        { status: 400 }
      );
    }

    // Log audit trail
    console.log(`[OS Intelligence Feedback] user=${session.user.id} action=${body.action} company=${body.company_id}`);

    // Set tenant context
    osClient.setContext({
      tenantId: session.tenantId,
      userId: session.user.id,
    });

    const result = await osClient.intelligenceFeedback(body);

    // Clear context after request
    osClient.clearContext();

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /os/intelligence/feedback] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Intelligence feedback request failed' },
      { status: 500 }
    );
  }
}
