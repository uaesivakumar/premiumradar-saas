/**
 * OS Control Plane Persona Policy API
 *
 * GET /api/superadmin/controlplane/personas/:id/policy - Get persona policy
 * PUT /api/superadmin/controlplane/personas/:id/policy - Update persona policy
 *
 * Policy contains PRD-required envelope fields:
 * - allowed_intents
 * - forbidden_outputs
 * - allowed_tools
 * - evidence_scope
 * - memory_scope
 * - cost_budget
 * - latency_budget
 * - escalation_rules
 * - disclaimer_rules
 *
 * Policy version auto-increments on every update via DB trigger.
 */

import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';
import {
  logControlPlaneAudit,
  validationError,
  notFoundError,
  serverError,
} from '@/lib/db/controlplane-audit';

interface OSPersonaPolicy {
  id: string;
  persona_id: string;
  policy_version: number;
  allowed_intents: unknown[];
  forbidden_outputs: unknown[];
  allowed_tools: unknown[];
  evidence_scope: Record<string, unknown>;
  memory_scope: Record<string, unknown>;
  cost_budget: Record<string, unknown>;
  latency_budget: Record<string, unknown>;
  escalation_rules: Record<string, unknown>;
  disclaimer_rules: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/superadmin/controlplane/personas/:id/policy
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Verify persona exists
    const persona = await queryOne<{ id: string; key: string }>(
      'SELECT id, key FROM os_personas WHERE id = $1',
      [id]
    );

    if (!persona) {
      return notFoundError('Persona');
    }

    const policy = await queryOne<OSPersonaPolicy>(
      `SELECT id, persona_id, policy_version, allowed_intents, forbidden_outputs, allowed_tools,
              evidence_scope, memory_scope, cost_budget, latency_budget,
              escalation_rules, disclaimer_rules, created_at, updated_at
       FROM os_persona_policies WHERE persona_id = $1`,
      [id]
    );

    if (!policy) {
      return notFoundError('Policy');
    }

    return Response.json({
      success: true,
      data: {
        ...policy,
        persona_key: persona.key,
      },
    });
  } catch (error) {
    console.error('[ControlPlane:Policy GET] Error:', error);
    return serverError('Failed to fetch policy');
  }
}

/**
 * PUT /api/superadmin/controlplane/personas/:id/policy
 * Update persona policy - version auto-increments via DB trigger
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const actorUser = sessionResult.session?.email || 'unknown';

  try {
    const body = await request.json();

    // Verify persona exists
    const persona = await queryOne<{ id: string; key: string }>(
      'SELECT id, key FROM os_personas WHERE id = $1',
      [id]
    );

    if (!persona) {
      await logControlPlaneAudit({
        actorUser,
        action: 'update_policy',
        targetType: 'policy',
        targetId: id,
        requestJson: body,
        success: false,
        errorMessage: 'Persona not found',
      });
      return notFoundError('Persona');
    }

    // Check policy exists
    const existingPolicy = await queryOne<{ id: string }>(
      'SELECT id FROM os_persona_policies WHERE persona_id = $1',
      [id]
    );

    if (!existingPolicy) {
      await logControlPlaneAudit({
        actorUser,
        action: 'update_policy',
        targetType: 'policy',
        targetId: id,
        requestJson: body,
        success: false,
        errorMessage: 'Policy not found',
      });
      return notFoundError('Policy');
    }

    const {
      allowed_intents,
      forbidden_outputs,
      allowed_tools,
      evidence_scope,
      memory_scope,
      cost_budget,
      latency_budget,
      escalation_rules,
      disclaimer_rules,
    } = body;

    // Validate JSON arrays
    const arrayFields = ['allowed_intents', 'forbidden_outputs', 'allowed_tools'];
    for (const field of arrayFields) {
      const value = body[field];
      if (value !== undefined && !Array.isArray(value)) {
        await logControlPlaneAudit({
          actorUser,
          action: 'update_policy',
          targetType: 'policy',
          targetId: id,
          requestJson: body,
          success: false,
          errorMessage: `${field} must be an array`,
        });
        return validationError(field, `${field} must be an array`);
      }
    }

    // Validate JSON objects
    const objectFields = [
      'evidence_scope',
      'memory_scope',
      'cost_budget',
      'latency_budget',
      'escalation_rules',
      'disclaimer_rules',
    ];
    for (const field of objectFields) {
      const value = body[field];
      if (value !== undefined && (typeof value !== 'object' || Array.isArray(value))) {
        await logControlPlaneAudit({
          actorUser,
          action: 'update_policy',
          targetType: 'policy',
          targetId: id,
          requestJson: body,
          success: false,
          errorMessage: `${field} must be an object`,
        });
        return validationError(field, `${field} must be an object`);
      }
    }

    // Build update query dynamically
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
    if (evidence_scope !== undefined) {
      updates.push(`evidence_scope = $${paramIndex++}`);
      values.push(JSON.stringify(evidence_scope));
    }
    if (memory_scope !== undefined) {
      updates.push(`memory_scope = $${paramIndex++}`);
      values.push(JSON.stringify(memory_scope));
    }
    if (cost_budget !== undefined) {
      updates.push(`cost_budget = $${paramIndex++}`);
      values.push(JSON.stringify(cost_budget));
    }
    if (latency_budget !== undefined) {
      updates.push(`latency_budget = $${paramIndex++}`);
      values.push(JSON.stringify(latency_budget));
    }
    if (escalation_rules !== undefined) {
      updates.push(`escalation_rules = $${paramIndex++}`);
      values.push(JSON.stringify(escalation_rules));
    }
    if (disclaimer_rules !== undefined) {
      updates.push(`disclaimer_rules = $${paramIndex++}`);
      values.push(JSON.stringify(disclaimer_rules));
    }

    if (updates.length === 0) {
      return validationError('body', 'No fields to update');
    }

    values.push(id);
    const result = await queryOne<OSPersonaPolicy>(
      `UPDATE os_persona_policies
       SET ${updates.join(', ')}
       WHERE persona_id = $${paramIndex}
       RETURNING id, persona_id, policy_version, allowed_intents, forbidden_outputs, allowed_tools,
                 evidence_scope, memory_scope, cost_budget, latency_budget,
                 escalation_rules, disclaimer_rules, created_at, updated_at`,
      values
    );

    // Audit log success
    await logControlPlaneAudit({
      actorUser,
      action: 'update_policy',
      targetType: 'policy',
      targetId: result?.id,
      requestJson: body,
      resultJson: { policy_version: result?.policy_version, persona_key: persona.key },
      success: true,
    });

    return Response.json({
      success: true,
      data: {
        ...result,
        persona_key: persona.key,
      },
    });

  } catch (error) {
    console.error('[ControlPlane:Policy PUT] Error:', error);
    return serverError('Failed to update policy');
  }
}
