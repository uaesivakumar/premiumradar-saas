/**
 * OS Control Plane Policy Activate API
 *
 * POST /api/superadmin/controlplane/personas/:id/policy/activate
 *
 * Activates a staged policy. This completes the
 * DRAFT → STAGED → ACTIVE lifecycle.
 *
 * Activation:
 * - Sets status to ACTIVE
 * - Sets activated_at timestamp
 * - Policy is now live for runtime resolution
 *
 * Hard rule: if activation fails, return explicit error codes.
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
  activated_at: string | null;
}

/**
 * POST /api/superadmin/controlplane/personas/:id/policy/activate
 * Activate a staged policy
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
        action: 'activate_policy',
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
      `SELECT id, persona_id, policy_version, status, activated_at
       FROM os_persona_policies WHERE persona_id = $1`,
      [id]
    );

    if (!existingPolicy) {
      await logControlPlaneAudit({
        actorUser,
        action: 'activate_policy',
        targetType: 'policy',
        targetId: id,
        requestJson: {},
        success: false,
        errorMessage: 'Policy not found',
      });
      return notFoundError('Policy');
    }

    // Already active - no-op but not an error
    if (existingPolicy.status === 'ACTIVE') {
      return Response.json({
        success: true,
        message: 'Policy is already ACTIVE',
        policy: {
          id: existingPolicy.id,
          status: existingPolicy.status,
          policy_version: existingPolicy.policy_version,
          activated_at: existingPolicy.activated_at,
          persona_key: persona.key,
        },
      });
    }

    // Cannot activate deprecated policy
    if (existingPolicy.status === 'DEPRECATED') {
      await logControlPlaneAudit({
        actorUser,
        action: 'activate_policy',
        targetType: 'policy',
        targetId: existingPolicy.id,
        requestJson: {},
        success: false,
        errorMessage: 'Cannot activate a DEPRECATED policy',
      });
      return Response.json({
        success: false,
        error: 'INVALID_STATUS_TRANSITION',
        message: 'Cannot activate a DEPRECATED policy. Create a new policy version.',
        current_status: existingPolicy.status,
      }, { status: 400 });
    }

    // For wizard flow, allow activation from both DRAFT and STAGED
    // (STAGED is recommended but DRAFT is allowed for simpler flows)
    if (existingPolicy.status !== 'DRAFT' && existingPolicy.status !== 'STAGED') {
      await logControlPlaneAudit({
        actorUser,
        action: 'activate_policy',
        targetType: 'policy',
        targetId: existingPolicy.id,
        requestJson: {},
        success: false,
        errorMessage: `Cannot activate policy in ${existingPolicy.status} status`,
      });
      return Response.json({
        success: false,
        error: 'INVALID_STATUS_TRANSITION',
        message: `Cannot activate policy in ${existingPolicy.status} status. Policy must be in DRAFT or STAGED status.`,
        current_status: existingPolicy.status,
      }, { status: 400 });
    }

    // Update status to ACTIVE and set activated_at
    const result = await queryOne<OSPersonaPolicy>(
      `UPDATE os_persona_policies
       SET status = 'ACTIVE', activated_at = NOW()
       WHERE persona_id = $1
       RETURNING id, persona_id, policy_version, status, activated_at`,
      [id]
    );

    // Audit log success
    await logControlPlaneAudit({
      actorUser,
      action: 'activate_policy',
      targetType: 'policy',
      targetId: result?.id,
      requestJson: {},
      resultJson: {
        policy_version: result?.policy_version,
        status: result?.status,
        activated_at: result?.activated_at,
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
        activated_at: result?.activated_at,
        persona_key: persona.key,
      },
    });

  } catch (error) {
    console.error('[ControlPlane:Policy Activate] Error:', error);
    return serverError('Failed to activate policy');
  }
}
