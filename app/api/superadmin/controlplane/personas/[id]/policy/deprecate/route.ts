/**
 * OS Control Plane Policy Deprecate API
 *
 * POST /api/superadmin/controlplane/personas/:id/policy/deprecate
 *
 * Deprecates an active policy. This completes the
 * DRAFT → STAGED → ACTIVE → DEPRECATED lifecycle.
 *
 * Deprecation:
 * - Sets status to DEPRECATED
 * - Sets deprecated_at timestamp
 * - Policy is no longer used for runtime resolution
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
  deprecated_at: string | null;
}

/**
 * POST /api/superadmin/controlplane/personas/:id/policy/deprecate
 * Deprecate an active policy
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
        action: 'deprecate_policy',
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
      `SELECT id, persona_id, policy_version, status, deprecated_at
       FROM os_persona_policies WHERE persona_id = $1`,
      [id]
    );

    if (!existingPolicy) {
      await logControlPlaneAudit({
        actorUser,
        action: 'deprecate_policy',
        targetType: 'policy',
        targetId: id,
        requestJson: {},
        success: false,
        errorMessage: 'Policy not found',
      });
      return notFoundError('Policy');
    }

    // Already deprecated - no-op but not an error
    if (existingPolicy.status === 'DEPRECATED') {
      return Response.json({
        success: true,
        message: 'Policy is already DEPRECATED',
        policy: {
          id: existingPolicy.id,
          status: existingPolicy.status,
          policy_version: existingPolicy.policy_version,
          deprecated_at: existingPolicy.deprecated_at,
          persona_key: persona.key,
        },
      });
    }

    // Can only deprecate ACTIVE policies
    if (existingPolicy.status !== 'ACTIVE') {
      await logControlPlaneAudit({
        actorUser,
        action: 'deprecate_policy',
        targetType: 'policy',
        targetId: existingPolicy.id,
        requestJson: {},
        success: false,
        errorMessage: `Cannot deprecate policy in ${existingPolicy.status} status`,
      });
      return Response.json({
        success: false,
        error: 'INVALID_STATUS_TRANSITION',
        message: `Cannot deprecate policy in ${existingPolicy.status} status. Only ACTIVE policies can be deprecated.`,
        current_status: existingPolicy.status,
        required_status: 'ACTIVE',
      }, { status: 400 });
    }

    // Update status to DEPRECATED and set deprecated_at
    const result = await queryOne<OSPersonaPolicy>(
      `UPDATE os_persona_policies
       SET status = 'DEPRECATED', deprecated_at = NOW()
       WHERE persona_id = $1
       RETURNING id, persona_id, policy_version, status, deprecated_at`,
      [id]
    );

    // Audit log success
    await logControlPlaneAudit({
      actorUser,
      action: 'deprecate_policy',
      targetType: 'policy',
      targetId: result?.id,
      requestJson: {},
      resultJson: {
        policy_version: result?.policy_version,
        status: result?.status,
        deprecated_at: result?.deprecated_at,
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
        deprecated_at: result?.deprecated_at,
        persona_key: persona.key,
      },
    });

  } catch (error) {
    console.error('[ControlPlane:Policy Deprecate] Error:', error);
    return serverError('Failed to deprecate policy');
  }
}
