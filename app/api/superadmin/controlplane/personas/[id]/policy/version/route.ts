/**
 * OS Control Plane Policy Version API
 *
 * POST /api/superadmin/controlplane/personas/:id/policy/version
 * Creates a new policy version for an existing persona
 *
 * GET /api/superadmin/controlplane/personas/:id/policy/version
 * Lists all policy versions for a persona
 *
 * Phase 1A: Policy Versioning
 * - Creates new DRAFT version from current ACTIVE policy
 * - Deprecates current ACTIVE policy
 * - Activation handled in Phase 1B
 */

import { NextRequest } from 'next/server';
import { query, queryOne, insert } from '@/lib/db/client';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';
import {
  logControlPlaneAudit,
  notFoundError,
  serverError,
} from '@/lib/db/controlplane-audit';

interface OSPersonaPolicy {
  id: string;
  persona_id: string;
  policy_version: number;
  status: string;
  allowed_intents: unknown[];
  forbidden_outputs: unknown[];
  allowed_tools: unknown[];
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
 * GET /api/superadmin/controlplane/personas/:id/policy/version
 * List all policy versions for a persona (ordered by version DESC)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Verify persona exists
    const persona = await queryOne<{ id: string; key: string; name: string }>(
      'SELECT id, key, name FROM os_personas WHERE id = $1',
      [id]
    );

    if (!persona) {
      return notFoundError('Persona');
    }

    // Get all policy versions for this persona
    const policies = await query<OSPersonaPolicy>(
      `SELECT id, persona_id, policy_version, status,
              allowed_intents, forbidden_outputs, allowed_tools,
              evidence_scope, memory_scope, cost_budget, latency_budget,
              escalation_rules, disclaimer_rules,
              staged_at, activated_at, deprecated_at,
              created_at, updated_at
       FROM os_persona_policies
       WHERE persona_id = $1
       ORDER BY policy_version DESC`,
      [id]
    );

    return Response.json({
      success: true,
      data: {
        persona_id: persona.id,
        persona_key: persona.key,
        persona_name: persona.name,
        versions: policies,
        total_versions: policies.length,
        active_version: policies.find(p => p.status === 'ACTIVE')?.policy_version || null,
        draft_version: policies.find(p => p.status === 'DRAFT')?.policy_version || null,
      },
    });
  } catch (error) {
    console.error('[ControlPlane:Policy Version GET] Error:', error);
    return serverError('Failed to fetch policy versions');
  }
}

/**
 * POST /api/superadmin/controlplane/personas/:id/policy/version
 * Create a new policy version (DRAFT) from the current active/latest policy
 *
 * Behavior:
 * 1. Finds the current ACTIVE policy (or latest if none active)
 * 2. Copies all policy values
 * 3. Creates new policy with version+1, status=DRAFT
 * 4. Does NOT deprecate the current active (that happens on new version activation)
 *
 * Note: This allows having ACTIVE + DRAFT simultaneously for editing before activation
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
        action: 'create_policy_version',
        targetType: 'policy',
        targetId: id,
        requestJson: {},
        success: false,
        errorMessage: 'Persona not found',
      });
      return notFoundError('Persona');
    }

    // Check if a DRAFT version already exists
    const existingDraft = await queryOne<{ id: string; policy_version: number }>(
      `SELECT id, policy_version FROM os_persona_policies
       WHERE persona_id = $1 AND status = 'DRAFT'`,
      [id]
    );

    if (existingDraft) {
      await logControlPlaneAudit({
        actorUser,
        action: 'create_policy_version',
        targetType: 'policy',
        targetId: id,
        requestJson: {},
        success: false,
        errorMessage: 'Draft version already exists',
      });
      return Response.json({
        success: false,
        error: 'DRAFT_EXISTS',
        message: `A draft version (v${existingDraft.policy_version}) already exists. Edit or activate the existing draft before creating a new version.`,
        existing_draft: {
          id: existingDraft.id,
          policy_version: existingDraft.policy_version,
        },
      }, { status: 409 });
    }

    // Get the current policy to copy from (prefer ACTIVE, fall back to latest)
    const currentPolicy = await queryOne<OSPersonaPolicy>(
      `SELECT * FROM os_persona_policies
       WHERE persona_id = $1
       ORDER BY
         CASE WHEN status = 'ACTIVE' THEN 0 ELSE 1 END,
         policy_version DESC
       LIMIT 1`,
      [id]
    );

    if (!currentPolicy) {
      await logControlPlaneAudit({
        actorUser,
        action: 'create_policy_version',
        targetType: 'policy',
        targetId: id,
        requestJson: {},
        success: false,
        errorMessage: 'No existing policy found',
      });
      return Response.json({
        success: false,
        error: 'NO_POLICY',
        message: 'No existing policy found for this persona. Create an initial policy first.',
      }, { status: 404 });
    }

    const newVersion = currentPolicy.policy_version + 1;

    // Create new policy version as DRAFT
    const newPolicy = await insert<OSPersonaPolicy>(
      `INSERT INTO os_persona_policies (
        persona_id, policy_version, status,
        allowed_intents, forbidden_outputs, allowed_tools,
        evidence_scope, memory_scope, cost_budget, latency_budget,
        escalation_rules, disclaimer_rules
      ) VALUES ($1, $2, 'DRAFT', $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, persona_id, policy_version, status,
                allowed_intents, forbidden_outputs, allowed_tools,
                evidence_scope, memory_scope, cost_budget, latency_budget,
                escalation_rules, disclaimer_rules,
                staged_at, activated_at, deprecated_at,
                created_at, updated_at`,
      [
        id,
        newVersion,
        JSON.stringify(currentPolicy.allowed_intents || []),
        JSON.stringify(currentPolicy.forbidden_outputs || []),
        JSON.stringify(currentPolicy.allowed_tools || []),
        JSON.stringify(currentPolicy.evidence_scope || {}),
        JSON.stringify(currentPolicy.memory_scope || {}),
        JSON.stringify(currentPolicy.cost_budget || {}),
        JSON.stringify(currentPolicy.latency_budget || {}),
        JSON.stringify(currentPolicy.escalation_rules || {}),
        JSON.stringify(currentPolicy.disclaimer_rules || {}),
      ]
    );

    // Audit log success
    await logControlPlaneAudit({
      actorUser,
      action: 'create_policy_version',
      targetType: 'policy',
      targetId: newPolicy.id,
      requestJson: { source_version: currentPolicy.policy_version },
      resultJson: {
        new_version: newPolicy.policy_version,
        status: newPolicy.status,
        persona_key: persona.key,
      },
      success: true,
    });

    return Response.json({
      success: true,
      data: {
        id: newPolicy.id,
        persona_id: id,
        persona_key: persona.key,
        policy_version: newPolicy.policy_version,
        status: newPolicy.status,
        source_version: currentPolicy.policy_version,
        message: `Created v${newPolicy.policy_version} as DRAFT (copied from v${currentPolicy.policy_version})`,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('[ControlPlane:Policy Version POST] Error:', error);
    return serverError('Failed to create policy version');
  }
}
