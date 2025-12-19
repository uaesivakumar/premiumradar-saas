/**
 * Super Admin OS Models API
 * S232: Model Radar - Model Visibility
 *
 * Lists models with capability data for Model Radar UI.
 * Proxies to UPR OS to get models with supported/blocked capabilities.
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
 * GET /api/superadmin/os/models
 * List all models with capability and eligibility data
 */
export async function GET(request: NextRequest) {
  const session = await verifyAuth(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get models with full capability data from OS
    // Using custom endpoint for model radar data
    interface ModelData {
      id?: string;
      slug?: string;
      name?: string;
      is_active?: boolean;
      is_eligible?: boolean;
      stability_score?: number;
      quality_score?: number;
      avg_latency_ms?: number;
      supported_capabilities?: string[];
      disallowed_capabilities?: string[];
      input_cost_per_million?: number;
      output_cost_per_million?: number;
    }

    interface ProviderData {
      type?: string;
      provider_type?: string;
      models?: ModelData[];
    }

    const result = await osClient.request<{ providers: ProviderData[] }>('/api/os/llm/models', {
      params: { include_capabilities: 'true' },
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // Transform OS response to match UI interface
    // OS returns { providers: [...] } with models nested
    const providers = result.data?.providers ?? [];
    const models: Record<string, unknown>[] = [];

    for (const provider of providers) {
      const providerModels = provider.models || [];
      for (const model of providerModels) {
        models.push({
          id: model.id || model.slug,
          slug: model.slug,
          name: model.name,
          provider_type: provider.type || provider.provider_type,
          is_active: model.is_active !== false,
          is_eligible: model.is_eligible !== false,
          stability_score: model.stability_score || model.quality_score || 90,
          avg_latency_ms: model.avg_latency_ms || 1000,
          supported_capabilities: model.supported_capabilities || [],
          disallowed_capabilities: model.disallowed_capabilities || [],
          cost_per_1k: ((model.input_cost_per_million || 0) + (model.output_cost_per_million || 0)) / 2000,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: models,
    });
  } catch (error) {
    console.error('[SuperAdmin:Models] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}
