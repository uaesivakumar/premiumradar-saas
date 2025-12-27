/**
 * OS Control Plane Policy Stage API
 *
 * POST /api/superadmin/controlplane/personas/:id/policy/stage
 *
 * Stages a policy before activation. This is part of the
 * DRAFT → STAGED → ACTIVE lifecycle.
 *
 * Staging validates:
 * - Policy exists
 * - Policy has required fields populated
 * - Policy is in DRAFT status (can't re-stage an ACTIVE policy)
 */

import { NextRequest } from 'next/server';
import { queryOne } from '@/lib/db/client';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';
import {
  logControlPlaneAudit,
  notFoundError,
  serverError,
} from '@/lib/db/controlplane-audit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface OSPersonaPolicy {
  id: string;
  persona_id: string;
  policy_version: number;
  status: string;
  allowed_intents: unknown[];
  forbidden_outputs: unknown[];
  allowed_tools: unknown[];
}

/**
 * POST /api/superadmin/controlplane/personas/:id/policy/stage
 * Stage a policy for review before activation
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const actorUser = sessionResult.session?.email || 'unknown';

  try {
    // Verify persona exists
    const persona = await queryOne<{ id: string; key: string }>(
      'SELECT id, key FROM os_personas WHERE id = $1',
      [id]
    );

    if (!persona) {
      await logControlPlaneAudit({
        actorUser,
        action: 'stage_policy',
        targetType: 'policy',
        targetId: id,
        requestJson: {},
        success: false,
        errorMessage: 'Persona not found',
      });
      return notFoundError('Persona');
    }

    // Check policy exists and get current status
    const existingPolicy = await queryOne<OSPersonaPolicy>(
      `SELECT id, persona_id, policy_version, status, allowed_intents, forbidden_outputs, allowed_tools
       FROM os_persona_policies WHERE persona_id = $1`,
      [id]
    );

    if (!existingPolicy) {
      await logControlPlaneAudit({
        actorUser,
        action: 'stage_policy',
        targetType: 'policy',
        targetId: id,
        requestJson: {},
        success: false,
        errorMessage: 'Policy not found',
      });
      return notFoundError('Policy');
    }

    // GOVERNANCE HARDENING: Empty policy hard-block (EMP-001, EMP-002, EMP-003)
    // Min 1 intent + Min 1 tool required before staging
    const intents = Array.isArray(existingPolicy.allowed_intents) ? existingPolicy.allowed_intents : [];
    const tools = Array.isArray(existingPolicy.allowed_tools) ? existingPolicy.allowed_tools : [];

    if (intents.length === 0) {
      await logControlPlaneAudit({
        actorUser,
        action: 'stage_policy',
        targetType: 'policy',
        targetId: existingPolicy.id,
        requestJson: {},
        success: false,
        errorMessage: 'Policy must have at least one allowed intent',
      });
      return Response.json({
        success: false,
        error: 'EMPTY_POLICY',
        code: 'EMP-001',
        message: 'Policy must have at least one allowed intent before staging.',
        field: 'allowed_intents',
        current_count: 0,
      }, { status: 400 });
    }

    if (tools.length === 0) {
      await logControlPlaneAudit({
        actorUser,
        action: 'stage_policy',
        targetType: 'policy',
        targetId: existingPolicy.id,
        requestJson: {},
        success: false,
        errorMessage: 'Policy must have at least one allowed tool',
      });
      return Response.json({
        success: false,
        error: 'EMPTY_POLICY',
        code: 'EMP-002',
        message: 'Policy must have at least one allowed tool before staging.',
        field: 'allowed_tools',
        current_count: 0,
      }, { status: 400 });
    }

    // Validate current status allows staging
    if (existingPolicy.status === 'ACTIVE') {
      await logControlPlaneAudit({
        actorUser,
        action: 'stage_policy',
        targetType: 'policy',
        targetId: existingPolicy.id,
        requestJson: {},
        success: false,
        errorMessage: 'Cannot stage an ACTIVE policy. Create a new version first.',
      });
      return Response.json({
        success: false,
        error: 'INVALID_STATUS_TRANSITION',
        message: 'Cannot stage an ACTIVE policy. Create a new version or deprecate first.',
        current_status: existingPolicy.status,
      }, { status: 400 });
    }

    if (existingPolicy.status === 'DEPRECATED') {
      await logControlPlaneAudit({
        actorUser,
        action: 'stage_policy',
        targetType: 'policy',
        targetId: existingPolicy.id,
        requestJson: {},
        success: false,
        errorMessage: 'Cannot stage a DEPRECATED policy',
      });
      return Response.json({
        success: false,
        error: 'INVALID_STATUS_TRANSITION',
        message: 'Cannot stage a DEPRECATED policy.',
        current_status: existingPolicy.status,
      }, { status: 400 });
    }

    // Update status to STAGED
    const result = await queryOne<OSPersonaPolicy>(
      `UPDATE os_persona_policies
       SET status = 'STAGED'
       WHERE persona_id = $1
       RETURNING id, persona_id, policy_version, status`,
      [id]
    );

    // Audit log success
    await logControlPlaneAudit({
      actorUser,
      action: 'stage_policy',
      targetType: 'policy',
      targetId: result?.id,
      requestJson: {},
      resultJson: {
        policy_version: result?.policy_version,
        status: result?.status,
        persona_key: persona.key
      },
      success: true,
    });

    return Response.json({
      success: true,
      policy: {
        id: result?.id,
        status: result?.status,
        policy_version: result?.policy_version,
        persona_key: persona.key,
      },
    });

  } catch (error) {
    console.error('[ControlPlane:Policy Stage] Error:', error);
    return serverError('Failed to stage policy');
  }
}
