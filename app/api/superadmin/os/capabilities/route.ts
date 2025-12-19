/**
 * Super Admin OS Capabilities API
 * S232: Model Radar - Capability Registry
 *
 * Proxies to UPR OS /api/os/capabilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/superadmin/security';
import { osClient } from '@/lib/os/os-client';

async function verifyAuth(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return verifySession(ip, userAgent);
}

/**
 * GET /api/superadmin/os/capabilities
 * List all capabilities from OS capability registry
 */
export async function GET(request: NextRequest) {
  const session = await verifyAuth(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only') === 'true';

    const result = await osClient.request<{ capabilities: Record<string, unknown>[] }>('/api/os/capabilities', {
      params: { active_only: activeOnly },
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // Transform OS response to match UI interface
    const capabilities = result.data?.capabilities ?? [];
    const transformedCapabilities = capabilities.map((cap: Record<string, unknown>) => ({
      capability_key: cap.capability_key,
      name: cap.name,
      description: cap.description,
      latency_class: cap.latency_class,
      risk_class: cap.risk_class,
      replay_tolerance: cap.replay_tolerance,
      max_tokens: cap.max_tokens,
      requires_vision: cap.requires_vision,
      requires_functions: cap.requires_functions,
      requires_json_mode: cap.requires_json_mode,
      is_active: cap.is_active,
      supported_model_count: cap.supported_model_count,
      eligible_models: cap.eligible_models,
    }));

    return NextResponse.json({
      success: true,
      data: transformedCapabilities,
    });
  } catch (error) {
    console.error('[SuperAdmin:Capabilities] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch capabilities' },
      { status: 500 }
    );
  }
}
