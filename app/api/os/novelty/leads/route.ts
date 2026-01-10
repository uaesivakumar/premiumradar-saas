/**
 * OS Leads API Proxy - S390
 *
 * GET leads by state from database (SOURCE OF TRUTH)
 *
 * S390 CRITICAL INVARIANT:
 * - Leads are NEVER stored only in localStorage
 * - This API is the SOURCE OF TRUTH for lead visibility
 * - Frontend MUST call this on login/refresh to reconstruct workspace
 *
 * States:
 * - UNACTIONED: Seen but not touched → Visible in Inbox
 * - EVALUATING: User working on it → Visible in Evaluating section
 * - SAVED: In pipeline → Visible in Saved section
 * - SKIPPED: Rejected → Hidden (not returned by default)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';

const OS_BASE_URL = process.env.UPR_OS_BASE_URL || 'http://localhost:8080';
const PR_OS_TOKEN = process.env.PR_OS_TOKEN || process.env.UPR_OS_API_KEY || '';

export async function GET(request: NextRequest) {
  try {
    // Require authenticated session
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const states = searchParams.get('states') || 'UNACTIONED,EVALUATING,SAVED';
    const contextHash = searchParams.get('context_hash') || '';

    // Build OS URL
    const osUrl = new URL(`${OS_BASE_URL}/api/os/novelty/leads`);
    osUrl.searchParams.set('states', states);
    osUrl.searchParams.set('user_id', session.user.id);
    if (contextHash) {
      osUrl.searchParams.set('context_hash', contextHash);
    }

    // Forward to OS
    const osResponse = await fetch(osUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-pr-os-token': PR_OS_TOKEN,
        'x-tenant-id': session.tenantId,
        'x-pr-user-id': session.user.id,
      },
    });

    const result = await osResponse.json();

    console.log(`[API /os/novelty/leads] User: ${session.user.id} | States: ${states} | Count: ${result.data?.count || 0}`);

    return NextResponse.json(result, { status: osResponse.status });
  } catch (error) {
    console.error('[API /os/novelty/leads] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get leads' },
      { status: 500 }
    );
  }
}
