/**
 * OS Pipeline API Route
 *
 * S350: Security Hole Remediation & Auth Enforcement
 * Behavior Contract B001: All API endpoints require authentication
 *
 * CRITICAL: This route was previously unauthenticated - fixed in S350
 */

import { NextRequest, NextResponse } from 'next/server';
import { osClient } from '@/lib/os-client';
import { requireAuth, injectSecureTenantContext } from '@/lib/middleware/auth-gate';

export async function POST(request: NextRequest) {
  // S350: Enforce authentication (was missing before)
  const auth = await requireAuth();
  if (!auth.success) return auth.response;

  const { session } = auth;

  try {
    const body = await request.json();

    // VS1: CRITICAL - Override any client-sent tenant_id with session tenant_id
    const securePayload = injectSecureTenantContext(body, session);

    const result = await osClient.pipeline(securePayload);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /os/pipeline] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Pipeline request failed' },
      { status: 500 }
    );
  }
}
