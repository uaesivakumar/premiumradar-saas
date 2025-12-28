/**
 * S338-F4: Policy by ID API
 *
 * GET /api/superadmin/controlplane/policies/:id - Get policy with version history
 * PATCH /api/superadmin/controlplane/policies/:id - Update policy (creates new version)
 */

import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';
import {
  logControlPlaneAudit,
  notFoundError,
  serverError,
  validationError,
} from '@/lib/db/controlplane-audit';

interface OSPersonaPolicy {
  id: string;
  persona_id: string;
  policy_version: number;
  status: 'DRAFT' | 'ACTIVE' | 'DEPRECATED' | 'STAGED';
  allowed_intents: string[];
  forbidden_outputs: string[];
  allowed_tools: string[];
  evidence_scope: Record<string, unknown>;
  memory_scope: Record<string, unknown>;
  cost_budget: Record<string, unknown>;
  latency_budget: Record<string, unknown>;
  escalation_rules: Record<string, unknown>;
  disclaimer_rules: Record<string, unknown>;
  staged_at: string | null;
  activated_at: string | null;
  deprecated_at: string | null;
  created_at: string;
  updated_at: string;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/superadmin/controlplane/policies/:id
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Get policy
    const policy = await queryOne<OSPersonaPolicy>(
      `SELECT
         id, persona_id, policy_version, status,
         allowed_intents, forbidden_outputs, allowed_tools,
         evidence_scope, memory_scope, cost_budget, latency_budget,
         escalation_rules, disclaimer_rules,
         staged_at, activated_at, deprecated_at,
         created_at, updated_at
       FROM os_persona_policies
       WHERE id = $1`,
      [id]
    );

    if (!policy) {
      return notFoundError('Policy');
    }

    // Get version history for this persona
    const versionHistory = await query<{
      id: string;
      policy_version: number;
      status: string;
      created_at: string;
    }>(
      `SELECT id, policy_version, status, created_at
       FROM os_persona_policies
       WHERE persona_id = $1
       ORDER BY policy_version DESC`,
      [policy.persona_id]
    );

    return Response.json({
      success: true,
      data: {
        policy,
        version_history: versionHistory,
      },
    });
  } catch (error) {
    console.error('[ControlPlane:Policy GET] Error:', error);
    return serverError('Failed to fetch policy');
  }
}

/**
 * PATCH /api/superadmin/controlplane/policies/:id
 * Updates policy fields (creates new version if ACTIVE, updates in-place if DRAFT)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const actorUser = sessionResult.session?.email || 'unknown';

  try {
    const body = await request.json();
    const { allowed_intents, forbidden_outputs, allowed_tools } = body;

    // Check policy exists
    const existing = await queryOne<OSPersonaPolicy>(
      `SELECT id, persona_id, policy_version, status
       FROM os_persona_policies WHERE id = $1`,
      [id]
    );

    if (!existing) {
      await logControlPlaneAudit({
        actorUser,
        action: 'patch_policy',
        targetType: 'policy',
        targetId: id,
        requestJson: body,
        success: false,
        errorMessage: 'Not found',
      });
      return notFoundError('Policy');
    }

    // Validate arrays
    if (allowed_intents !== undefined && !Array.isArray(allowed_intents)) {
      return validationError('allowed_intents', 'Must be an array');
    }
    if (forbidden_outputs !== undefined && !Array.isArray(forbidden_outputs)) {
      return validationError('forbidden_outputs', 'Must be an array');
    }
    if (allowed_tools !== undefined && !Array.isArray(allowed_tools)) {
      return validationError('allowed_tools', 'Must be an array');
    }

    let result: OSPersonaPolicy | null = null;
    let newVersion: number | null = null;

    if (existing.status === 'DRAFT') {
      // Update DRAFT in place
      const updates: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      if (allowed_intents !== undefined) {
        updates.push(`allowed_intents = $${paramIndex++}`);
        values.push(JSON.stringify(allowed_intents));
      }
      if (forbidden_outputs !== undefined) {
        updates.push(`forbidden_outputs = $${paramIndex++}`);
        values.push(JSON.stringify(forbidden_outputs));
      }
      if (allowed_tools !== undefined) {
        updates.push(`allowed_tools = $${paramIndex++}`);
        values.push(JSON.stringify(allowed_tools));
      }

      updates.push(`updated_at = NOW()`);

      if (updates.length === 1) {
        return validationError('body', 'No fields to update');
      }

      values.push(id);
      result = await queryOne<OSPersonaPolicy>(
        `UPDATE os_persona_policies
         SET ${updates.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        values
      );
    } else {
      // For ACTIVE/DEPRECATED/STAGED, create a new DRAFT version
      const nextVersion = existing.policy_version + 1;

      // Get current policy full data
      const currentPolicy = await queryOne<OSPersonaPolicy>(
        `SELECT * FROM os_persona_policies WHERE id = $1`,
        [id]
      );

      if (!currentPolicy) {
        return notFoundError('Policy');
      }

      result = await queryOne<OSPersonaPolicy>(
        `INSERT INTO os_persona_policies (
           persona_id, policy_version, status,
           allowed_intents, forbidden_outputs, allowed_tools,
           evidence_scope, memory_scope, cost_budget, latency_budget,
           escalation_rules, disclaimer_rules
         ) VALUES ($1, $2, 'DRAFT', $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          existing.persona_id,
          nextVersion,
          JSON.stringify(allowed_intents ?? currentPolicy.allowed_intents),
          JSON.stringify(forbidden_outputs ?? currentPolicy.forbidden_outputs),
          JSON.stringify(allowed_tools ?? currentPolicy.allowed_tools),
          JSON.stringify(currentPolicy.evidence_scope || {}),
          JSON.stringify(currentPolicy.memory_scope || {}),
          JSON.stringify(currentPolicy.cost_budget || {}),
          JSON.stringify(currentPolicy.latency_budget || {}),
          JSON.stringify(currentPolicy.escalation_rules || {}),
          JSON.stringify(currentPolicy.disclaimer_rules || {}),
        ]
      );

      newVersion = nextVersion;
    }

    // Audit log success
    await logControlPlaneAudit({
      actorUser,
      action: 'patch_policy',
      targetType: 'policy',
      targetId: id,
      requestJson: body,
      resultJson: {
        ...(result as unknown as Record<string, unknown>),
        new_version: newVersion,
      },
      success: true,
    });

    return Response.json({
      success: true,
      data: result,
      new_version: newVersion,
    });

  } catch (error) {
    console.error('[ControlPlane:Policy PATCH] Error:', error);
    return serverError('Failed to update policy');
  }
}
