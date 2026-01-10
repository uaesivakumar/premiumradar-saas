/**
 * OS Novelty Action API Proxy - S390
 *
 * Records user actions on discovered entities:
 * - evaluated: User wants to evaluate (resurface in 1 day)
 * - saved: User saved lead (don't show for 30 days)
 * - skipped: User skipped lead (don't show for 7 days)
 *
 * SECURITY:
 * - Requires authenticated session
 * - Injects user_id from session (never trusts client)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';

const OS_BASE_URL = process.env.UPR_OS_BASE_URL || 'http://localhost:8080';
const PR_OS_TOKEN = process.env.PR_OS_TOKEN || process.env.UPR_OS_API_KEY || '';

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
    if (!body.entity_id && !body.entity_name) {
      return NextResponse.json(
        { success: false, error: 'entity_id or entity_name is required' },
        { status: 400 }
      );
    }

    if (!body.action) {
      return NextResponse.json(
        { success: false, error: 'action is required (evaluated, saved, skipped)' },
        { status: 400 }
      );
    }

    // Forward to OS with user_id injected
    const osResponse = await fetch(`${OS_BASE_URL}/api/os/novelty/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-pr-os-token': PR_OS_TOKEN,
        'x-tenant-id': session.tenantId,
        'x-user-id': session.user.id,
      },
      body: JSON.stringify({
        entity_id: body.entity_id,
        entity_name: body.entity_name,
        action: body.action,
        sales_context: body.sales_context,
        user_id: session.user.id,  // Injected from session
        metadata: body.metadata,
      }),
    });

    const result = await osResponse.json();

    console.log(`[API /os/novelty/action] User: ${session.user.id} | Entity: ${body.entity_name || body.entity_id} | Action: ${body.action}`);

    return NextResponse.json(result, { status: osResponse.status });
  } catch (error) {
    console.error('[API /os/novelty/action] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record action' },
      { status: 500 }
    );
  }
}
