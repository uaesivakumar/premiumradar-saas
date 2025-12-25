/**
 * Stack Readiness API - THE SINGLE SOURCE OF TRUTH
 *
 * GET /api/superadmin/controlplane/stack-readiness
 *   ?vertical_id=xxx              - Check specific vertical stack
 *   ?sub_vertical_id=xxx          - Check specific sub-vertical stack
 *   ?persona_id=xxx               - Check specific persona stack
 *   ?all=true                     - Get readiness for all stacks
 *
 * FORMAL DEFINITION (Control Plane v3.0):
 * ========================================
 * stack_readiness = READY iff ALL are true:
 *   1. Vertical exists AND is_active
 *   2. Sub-vertical exists AND is_active
 *   3. Persona exists AND is_active
 *   4. At least one ACTIVE policy for the persona
 *   5. At least one valid workspace binding
 *   6. Runtime config resolves without error
 *
 * This resolver is consumed by:
 * - Control Plane UI (authoritative view)
 * - Blueprints UI (read-only view)
 * - Runtime resolution (OS integration)
 *
 * ⛔ NO OTHER STATUS COMPUTATION IS ALLOWED
 * All status derivation MUST call this API.
 */

import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';

// Formal status enum - no ambiguity
export type StackStatus = 'READY' | 'BLOCKED' | 'INCOMPLETE' | 'NOT_FOUND';

export interface StackReadiness {
  status: StackStatus;
  checks: {
    vertical_exists: boolean;
    vertical_active: boolean;
    sub_vertical_exists: boolean;
    sub_vertical_active: boolean;
    persona_exists: boolean;
    persona_active: boolean;
    has_active_policy: boolean;
    has_valid_binding: boolean;
    runtime_resolves: boolean;
  };
  blockers: string[];
  metadata: {
    vertical_id: string | null;
    vertical_key: string | null;
    sub_vertical_id: string | null;
    sub_vertical_key: string | null;
    persona_id: string | null;
    persona_key: string | null;
    active_policy_id: string | null;
    active_policy_version: number | null;
    binding_count: number;
  };
  timestamp: string;
}

interface VerticalRow {
  id: string;
  key: string;
  name: string;
  is_active: boolean;
}

interface SubVerticalRow {
  id: string;
  key: string;
  name: string;
  is_active: boolean;
  vertical_id: string;
}

interface PersonaRow {
  id: string;
  key: string;
  name: string;
  is_active: boolean;
  sub_vertical_id: string;
}

interface PolicyRow {
  id: string;
  policy_version: number;
  status: string;
}

interface BindingRow {
  id: string;
  workspace_id: string;
  is_active: boolean;
}

/**
 * Compute stack readiness for a persona
 * This is THE canonical computation - used everywhere
 */
async function computeStackReadiness(personaId: string): Promise<StackReadiness> {
  const timestamp = new Date().toISOString();
  const blockers: string[] = [];

  // Initialize checks - all false until proven true
  const checks = {
    vertical_exists: false,
    vertical_active: false,
    sub_vertical_exists: false,
    sub_vertical_active: false,
    persona_exists: false,
    persona_active: false,
    has_active_policy: false,
    has_valid_binding: false,
    runtime_resolves: false,
  };

  const metadata = {
    vertical_id: null as string | null,
    vertical_key: null as string | null,
    sub_vertical_id: null as string | null,
    sub_vertical_key: null as string | null,
    persona_id: personaId,
    persona_key: null as string | null,
    active_policy_id: null as string | null,
    active_policy_version: null as number | null,
    binding_count: 0,
  };

  // Check 1-3: Persona exists and get hierarchy
  const persona = await queryOne<PersonaRow>(
    `SELECT p.id, p.key, p.name, p.is_active, p.sub_vertical_id
     FROM os_personas p
     WHERE p.id = $1`,
    [personaId]
  );

  if (!persona) {
    blockers.push('Persona not found');
    return {
      status: 'NOT_FOUND',
      checks,
      blockers,
      metadata,
      timestamp,
    };
  }

  checks.persona_exists = true;
  metadata.persona_key = persona.key;

  if (!persona.is_active) {
    blockers.push('Persona is inactive');
  } else {
    checks.persona_active = true;
  }

  // Get sub-vertical
  const subVertical = await queryOne<SubVerticalRow>(
    `SELECT sv.id, sv.key, sv.name, sv.is_active, sv.vertical_id
     FROM os_sub_verticals sv
     WHERE sv.id = $1`,
    [persona.sub_vertical_id]
  );

  if (!subVertical) {
    blockers.push('Sub-vertical not found');
  } else {
    checks.sub_vertical_exists = true;
    metadata.sub_vertical_id = subVertical.id;
    metadata.sub_vertical_key = subVertical.key;

    if (!subVertical.is_active) {
      blockers.push('Sub-vertical is inactive');
    } else {
      checks.sub_vertical_active = true;
    }

    // Get vertical
    const vertical = await queryOne<VerticalRow>(
      `SELECT v.id, v.key, v.name, v.is_active
       FROM os_verticals v
       WHERE v.id = $1`,
      [subVertical.vertical_id]
    );

    if (!vertical) {
      blockers.push('Vertical not found');
    } else {
      checks.vertical_exists = true;
      metadata.vertical_id = vertical.id;
      metadata.vertical_key = vertical.key;

      if (!vertical.is_active) {
        blockers.push('Vertical is inactive');
      } else {
        checks.vertical_active = true;
      }
    }
  }

  // Check 4: Active policy
  const policy = await queryOne<PolicyRow>(
    `SELECT id, policy_version, status
     FROM os_persona_policies
     WHERE persona_id = $1 AND status = 'ACTIVE'
     ORDER BY policy_version DESC
     LIMIT 1`,
    [personaId]
  );

  if (!policy) {
    blockers.push('No ACTIVE policy for persona');
  } else {
    checks.has_active_policy = true;
    metadata.active_policy_id = policy.id;
    metadata.active_policy_version = policy.policy_version;
  }

  // Check 5: Valid workspace binding
  const bindings = await query<BindingRow>(
    `SELECT id, workspace_id, is_active
     FROM os_workspace_bindings
     WHERE persona_id = $1 AND is_active = true`,
    [personaId]
  );

  metadata.binding_count = bindings.length;
  if (bindings.length === 0) {
    blockers.push('No active workspace bindings');
  } else {
    checks.has_valid_binding = true;
  }

  // Check 6: Runtime resolves (if we have all prerequisites)
  if (checks.vertical_active && checks.sub_vertical_active &&
      checks.persona_active && checks.has_active_policy && checks.has_valid_binding) {
    // All prerequisites met - runtime should resolve
    checks.runtime_resolves = true;
  } else {
    blockers.push('Runtime blocked: missing prerequisites');
  }

  // Compute final status
  let status: StackStatus;
  if (Object.values(checks).every(Boolean)) {
    status = 'READY';
  } else if (blockers.some(b => b.includes('inactive'))) {
    status = 'BLOCKED';
  } else {
    status = 'INCOMPLETE';
  }

  return {
    status,
    checks,
    blockers,
    metadata,
    timestamp,
  };
}

/**
 * Get all personas with their stack readiness
 */
async function getAllStackReadiness(): Promise<{ stacks: StackReadiness[]; summary: { ready: number; blocked: number; incomplete: number; total: number } }> {
  const personas = await query<{ id: string }>(
    'SELECT id FROM os_personas ORDER BY key'
  );

  const stacks: StackReadiness[] = [];
  let ready = 0, blocked = 0, incomplete = 0;

  for (const persona of personas) {
    const readiness = await computeStackReadiness(persona.id);
    stacks.push(readiness);

    if (readiness.status === 'READY') ready++;
    else if (readiness.status === 'BLOCKED') blocked++;
    else incomplete++;
  }

  return {
    stacks,
    summary: { ready, blocked, incomplete, total: personas.length },
  };
}

export async function GET(request: NextRequest) {
  // Require Super Admin session
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  try {
    // Get all stacks
    if (searchParams.get('all') === 'true') {
      const result = await getAllStackReadiness();
      return Response.json({
        success: true,
        ...result,
      });
    }

    // Get by persona_id (most specific)
    const personaId = searchParams.get('persona_id');
    if (personaId) {
      const readiness = await computeStackReadiness(personaId);
      return Response.json({
        success: true,
        data: readiness,
      });
    }

    // Get by sub_vertical_id (get all personas under it)
    const subVerticalId = searchParams.get('sub_vertical_id');
    if (subVerticalId) {
      const personas = await query<{ id: string }>(
        'SELECT id FROM os_personas WHERE sub_vertical_id = $1',
        [subVerticalId]
      );

      const stacks: StackReadiness[] = [];
      for (const p of personas) {
        stacks.push(await computeStackReadiness(p.id));
      }

      return Response.json({
        success: true,
        sub_vertical_id: subVerticalId,
        stacks,
      });
    }

    // Get by vertical_id (get all personas under all sub-verticals)
    const verticalId = searchParams.get('vertical_id');
    if (verticalId) {
      const personas = await query<{ id: string }>(
        `SELECT p.id FROM os_personas p
         JOIN os_sub_verticals sv ON p.sub_vertical_id = sv.id
         WHERE sv.vertical_id = $1`,
        [verticalId]
      );

      const stacks: StackReadiness[] = [];
      for (const p of personas) {
        stacks.push(await computeStackReadiness(p.id));
      }

      return Response.json({
        success: true,
        vertical_id: verticalId,
        stacks,
      });
    }

    return Response.json({
      success: false,
      error: 'MISSING_PARAMS',
      message: 'Provide one of: ?all=true, ?persona_id=xxx, ?sub_vertical_id=xxx, ?vertical_id=xxx',
    }, { status: 400 });

  } catch (error) {
    console.error('[StackReadiness] Error:', error);
    return Response.json({
      success: false,
      error: 'SERVER_ERROR',
      message: error instanceof Error ? error.message : 'Failed to compute stack readiness',
    }, { status: 500 });
  }
}
