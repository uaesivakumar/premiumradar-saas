/**
 * OS Discovery API Proxy - S383-S388 Discovery V2
 * VS1: Secure SaaS→OS boundary
 *
 * SECURITY:
 * - Requires authenticated session
 * - NEVER trusts client-sent tenant_id - injected from session
 * - S351: Rate limiting enforced (Behavior Contract B002)
 *
 * UPL v0.1: Injects user_preferences into payload (S253)
 * - user_preferences is LEAF-ONLY (soft overrides for tone, depth, pacing)
 * - Policy wins silently on conflict
 *
 * S383-S388: Now routes to Discovery V2 (Evidence-Bound Engine)
 * - 11-layer pipeline: SalesContext → UX Truth
 * - Evidence-bound ranking (EFS+SDS+PFS→FRS)
 * - Action-ready outputs (Reach Out/Research Now/Monitor/Ignore)
 *
 * Authorization Code: VS1-VS9-APPROVED-20251213
 */

import { NextRequest, NextResponse } from 'next/server';
import { osClient } from '@/lib/os-client';
import { getServerSession } from '@/lib/auth/session';
import { getResolvedUserPrefs } from '@/lib/db/user-preferences';
import { enforceRateLimit, OS_RATE_LIMITS } from '@/lib/middleware/rate-limit';

export async function POST(request: NextRequest) {
  // S351: Enforce rate limiting (Behavior Contract B002)
  const rateLimit = await enforceRateLimit(request, OS_RATE_LIMITS.discovery);
  if (!rateLimit.allowed) return rateLimit.response;

  try {
    // VS1: Require authenticated session
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

    // S383-S388: Transform to Discovery V2 payload format
    const discoveryV2Payload = {
      query: body.query || '',
      sales_context: {
        vertical: body.vertical_id || 'banking',
        sub_vertical: body.sub_vertical_id || 'employee_banking',
        region: body.region_code || 'UAE',
      },
      options: {
        maxResults: 10,
        strictMode: false,
      },
      user_preferences: userPrefs,
    };

    // Log audit trail with UPL diagnostic (S253 validation)
    console.log(`[OS Discovery V2] query="${discoveryV2Payload.query}", region=${discoveryV2Payload.sales_context.region}, verbosity=${userPrefs.verbosity}, workspace_id=${workspaceId}, user_id=${session.user.id}, tenant_id=${session.tenantId}`);

    // VS5: Set tenant context for RLS enforcement in OS
    osClient.setContext({
      tenantId: session.tenantId,
      userId: session.user.id,
    });

    // S383-S388: Call Discovery V2 endpoint
    const result = await osClient.discoveryV2(discoveryV2Payload);

    // Clear context after request
    osClient.clearContext();

    // S383-S388: Transform Discovery V2 response to frontend-expected format
    const transformedResult = transformDiscoveryV2Response(result);

    return NextResponse.json(transformedResult);
  } catch (error) {
    console.error('[API /os/discovery] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Discovery request failed' },
      { status: 500 }
    );
  }
}

/**
 * Transform Discovery V2 response to frontend-compatible format
 *
 * V2 Response:
 * {
 *   data: {
 *     discovery: { candidates, ranked, actions },
 *     uxTruth: { headline, explanation, isEmpty }
 *   }
 * }
 *
 * Frontend expects:
 * {
 *   success: true,
 *   data: {
 *     companies: [{ id, name, signals, sivaScores, ... }]
 *   }
 * }
 */
function transformDiscoveryV2Response(result: any): any {
  if (!result.success) {
    return result;
  }

  const discovery = result.data?.discovery || result.data?.data?.discovery || {};
  const uxTruth = result.data?.uxTruth || result.data?.data?.uxTruth || {};
  const ranked = discovery.ranked || [];
  const actions = discovery.actions || {};

  // Transform ranked candidates to companies array
  const companies = ranked.map((candidate: any, index: number) => {
    const action = actions[candidate.id] || actions[candidate.name] || {};
    return {
      id: candidate.id || `discovery-${index}`,
      name: candidate.name || candidate.company_name || 'Unknown Company',
      location: candidate.location || candidate.city || '',
      city: candidate.city || '',
      industry: candidate.industry || '',
      confidenceScore: candidate.frs || candidate.confidence || 0.5,
      signals: (candidate.signals || []).map((sig: any) => ({
        type: sig.type || sig.signal_type || 'unknown',
        title: sig.title || sig.evidence || sig.type || 'Signal detected',
        evidence: sig.evidence || '',
        source: sig.source || 'discovery',
        date: sig.date || new Date().toISOString(),
      })),
      sivaScores: {
        overall: Math.round((candidate.frs || 0.5) * 100),
        tier: candidate.frs >= 0.75 ? 'HOT' : candidate.frs >= 0.5 ? 'WARM' : 'COOL',
        reasoning: candidate.ranking_reasons || action.reasons || ['Live discovery signal'],
        recommendedProducts: [],
      },
      action: {
        type: action.type || 'research_now',
        reasons: action.reasons || [],
      },
      // V2 specific fields
      efs: candidate.efs,
      sds: candidate.sds,
      pfs: candidate.pfs,
      frs: candidate.frs,
    };
  });

  return {
    success: true,
    data: {
      companies,
      total: companies.length,
      uxTruth: {
        headline: uxTruth.headline || (companies.length > 0 ? `Found ${companies.length} companies` : 'No companies found'),
        explanation: uxTruth.explanation || '',
        isEmpty: companies.length === 0,
      },
      // Pass through trace for debugging
      trace: result.data?.trace || result.data?.data?.trace,
    },
  };
}
