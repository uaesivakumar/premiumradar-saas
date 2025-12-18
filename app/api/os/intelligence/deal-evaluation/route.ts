/**
 * OS Intelligence Deal Evaluation API Proxy
 * SaaS Sales Edition - Skeptical CFO Lens
 *
 * SECURITY:
 * - Requires authenticated session
 * - NEVER trusts client-sent tenant_id - injected from session
 *
 * Response Contract:
 * {
 *   verdict: 'GO' | 'HIGH_RISK' | 'NO_GO',
 *   confidence: number,
 *   reasoning: string,
 *   risk_factors: { factor: string, severity: 'high' | 'medium' | 'low', description: string }[],
 *   decisive_action: string,
 *   deal_context: { company_name: string, deal_size?: string, stage?: string }
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

    // Validate deal_context is present
    if (!body.deal_context || !body.deal_context.company_name) {
      return NextResponse.json(
        { success: false, error: 'deal_context with company_name is required' },
        { status: 400 }
      );
    }

    // CRITICAL - Override any client-sent tenant_id with session tenant_id
    const securePayload = {
      ...body,
      tenant_id: session.tenantId,
      user_id: session.user.id,
    };

    // Log audit trail
    console.log(`[OS Deal Evaluation] tenant=${session.tenantId} user=${session.user.id} company=${body.deal_context.company_name}`);

    // Set tenant context for RLS enforcement in OS
    osClient.setContext({
      tenantId: session.tenantId,
      userId: session.user.id,
    });

    const result = await osClient.dealEvaluation(securePayload);

    // Clear context after request
    osClient.clearContext();

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /os/intelligence/deal-evaluation] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Deal evaluation request failed' },
      { status: 500 }
    );
  }
}
