/**
 * Super Admin OS Model Eligibility API
 * S232: Model Radar - Eligibility Toggle
 *
 * Toggle model eligibility (resource availability, not routing behavior).
 * Proxies to UPR OS PATCH /api/os/capabilities/models/:slug/eligibility
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/superadmin/security';
import { osClient } from '@/lib/os/os-client';

async function verifyAuth(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return verifySession(ip, userAgent);
}

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * PATCH /api/superadmin/os/models/[slug]/eligibility
 * Toggle model eligibility
 *
 * Body: { is_eligible: boolean }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await verifyAuth(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slug } = await params;
    const body = await request.json();
    const { is_eligible } = body;

    if (typeof is_eligible !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'is_eligible must be a boolean' },
        { status: 400 }
      );
    }

    // Call OS API to update eligibility
    const result = await osClient.request(`/api/os/capabilities/models/${slug}/eligibility`, {
      method: 'PATCH',
      body: { is_eligible },
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('[SuperAdmin:Eligibility] PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update eligibility' },
      { status: 500 }
    );
  }
}
