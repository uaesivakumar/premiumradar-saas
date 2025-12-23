/**
 * OS Outreach API Proxy
 * VS1: Secure SaaS→OS boundary
 *
 * UPL v0.1: Injects user_preferences into payload (S253)
 * - user_preferences is LEAF-ONLY (soft overrides for tone, depth, pacing)
 * - Policy wins silently on conflict
 */

import { NextRequest, NextResponse } from 'next/server';
import { osClient } from '@/lib/os-client';
import { getServerSession } from '@/lib/auth/session';
import { getResolvedUserPrefs } from '@/lib/db/user-preferences';

export async function POST(request: NextRequest) {
  try {
    // VS12: Security Fix - Require authenticated session
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

    // S253: Add user_preferences as separate top-level field (never mix with policy)
    const securePayload = {
      ...body,
      tenant_id: session.tenantId,
      user_preferences: userPrefs,
    };

    // Log audit trail
    console.log(`[OS Outreach] tenant=${session.tenantId} user=${session.user.id}`);

    // Set tenant context for RLS enforcement in OS
    osClient.setContext({
      tenantId: session.tenantId,
      userId: session.user.id,
    });

    const result = await osClient.outreach(securePayload);

    osClient.clearContext();

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /os/outreach] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Outreach request failed' },
      { status: 500 }
    );
  }
}
