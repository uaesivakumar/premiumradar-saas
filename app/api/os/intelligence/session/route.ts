/**
 * OS Intelligence Session API Proxy
 * S224-S227: Decision Mode
 *
 * SECURITY:
 * - Requires authenticated session
 * - NEVER trusts client-sent tenant_id - injected from session
 *
 * UPL v0.1: Injects user_preferences into payload (S253)
 * - user_preferences is LEAF-ONLY (soft overrides for tone, depth, pacing)
 * - Policy wins silently on conflict
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
import { getResolvedUserPrefs } from '@/lib/db/user-preferences';

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

    // S253 UPL: Get user preferences (leaf-only, soft overrides)
    const workspaceId = body.workspace_id || 'default';
    const { prefs: userPrefs } = await getResolvedUserPrefs({
      tenantId: session.tenantId,
      workspaceId,
      userId: session.user.id,
    });

    // CRITICAL - Override any client-sent tenant_id with session tenant_id
    // S253: Add user_preferences as separate top-level field (never mix with policy)
    const securePayload = {
      ...body,
      tenant_id: session.tenantId,
      user_id: session.user.id,
      user_preferences: userPrefs,
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
