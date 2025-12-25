/**
 * Auto-Activation Resolver API (S269)
 *
 * POST /api/superadmin/controlplane/resolve-activation
 *
 * THE SINGLE ENTRY POINT for runtime activation.
 * UI never triggers activation directly - all activation goes through this endpoint.
 *
 * Request:
 *   { user_id: string, persona_id?: string }
 *
 * Response:
 *   {
 *     success: boolean,
 *     data: {
 *       activated: boolean,
 *       reason_code: ReasonCode,
 *       reason_message: string,
 *       audit_id: string,
 *       binding_id?: string,
 *       workspace_id?: string,
 *       persona_id?: string,
 *       user_type?: 'enterprise' | 'individual',
 *       stack_status?: string,
 *       blockers?: string[],
 *       timestamp: string
 *     }
 *   }
 *
 * GET /api/superadmin/controlplane/resolve-activation?audit_id=xxx
 *   Replay a previous resolver decision for audit/debugging
 */

import { NextRequest } from 'next/server';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';
import {
  resolveActivation,
  replayResolverDecision,
  type ResolverInput,
} from '@/lib/resolver/auto-activation-resolver';

/**
 * POST - Trigger auto-activation resolver
 */
export async function POST(request: NextRequest) {
  // Require Super Admin session
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate input
    if (!body.user_id) {
      return Response.json({
        success: false,
        error: 'MISSING_USER_ID',
        message: 'user_id is required',
      }, { status: 400 });
    }

    const input: ResolverInput = {
      user_id: body.user_id,
      persona_id: body.persona_id, // Optional
    };

    // Run resolver
    const result = await resolveActivation(input);

    // Return result with appropriate status code
    const statusCode = result.activated ? 200 : result.reason_code === 'RESOLVER_ERROR' ? 500 : 200;

    return Response.json({
      success: true,
      data: result,
    }, { status: statusCode });

  } catch (error) {
    console.error('[ResolveActivation API] Error:', error);
    return Response.json({
      success: false,
      error: 'SERVER_ERROR',
      message: error instanceof Error ? error.message : 'Failed to resolve activation',
    }, { status: 500 });
  }
}

/**
 * GET - Replay a resolver decision
 */
export async function GET(request: NextRequest) {
  // Require Super Admin session
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const auditId = searchParams.get('audit_id');

    if (!auditId) {
      return Response.json({
        success: false,
        error: 'MISSING_AUDIT_ID',
        message: 'audit_id query parameter is required',
      }, { status: 400 });
    }

    const result = await replayResolverDecision(auditId);

    if (!result) {
      return Response.json({
        success: false,
        error: 'AUDIT_NOT_FOUND',
        message: `No resolver audit found for id: ${auditId}`,
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      data: result,
      replay: true,
    });

  } catch (error) {
    console.error('[ResolveActivation API] Replay error:', error);
    return Response.json({
      success: false,
      error: 'SERVER_ERROR',
      message: error instanceof Error ? error.message : 'Failed to replay resolver decision',
    }, { status: 500 });
  }
}
