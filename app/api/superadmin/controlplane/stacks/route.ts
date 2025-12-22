/**
 * OS Control Plane Stacks API
 *
 * GET /api/superadmin/controlplane/stacks?include_status=1
 *
 * Returns aggregated view of all vertical stacks with their
 * readiness status. Used to display READY/NOT READY badges
 * on the Control Plane main page.
 *
 * A stack is READY only if:
 * - Vertical exists and is_active
 * - At least one Sub-Vertical exists and is_active
 * - At least one Persona exists and is_active
 * - Persona has ACTIVE policy
 * - At least one Workspace Binding exists
 *
 * Response includes first failing reason for NOT READY stacks.
 */

import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';
import { serverError } from '@/lib/db/controlplane-audit';

interface VerticalStack {
  vertical: {
    id: string;
    key: string;
    name: string;
    is_active: boolean;
  };
  sub_verticals: SubVerticalStatus[];
  stack_status: 'READY' | 'NOT_READY';
  not_ready_reason: string | null;
}

interface SubVerticalStatus {
  id: string;
  key: string;
  name: string;
  is_active: boolean;
  persona_count: number;
  personas: PersonaStatus[];
  status: 'READY' | 'NOT_READY';
  not_ready_reason: string | null;
}

interface PersonaStatus {
  id: string;
  key: string;
  name: string;
  is_active: boolean;
  scope: string;
  region_code: string | null;
  policy_status: string | null;
  policy_version: number | null;
  has_binding: boolean;
  status: 'READY' | 'NOT_READY';
  not_ready_reason: string | null;
}

interface VerticalRow {
  id: string;
  key: string;
  name: string;
  is_active: boolean;
}

interface SubVerticalRow {
  id: string;
  vertical_id: string;
  key: string;
  name: string;
  is_active: boolean;
}

interface PersonaRow {
  id: string;
  sub_vertical_id: string;
  key: string;
  name: string;
  is_active: boolean;
  scope: string;
  region_code: string | null;
  policy_status: string | null;
  policy_version: number | null;
}

/**
 * GET /api/superadmin/controlplane/stacks
 * Returns all vertical stacks with readiness status
 */
export async function GET(request: NextRequest) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const includeStatus = searchParams.get('include_status') === '1';

  try {
    // Fetch all verticals
    const verticals = await query<VerticalRow>(
      `SELECT id, key, name, is_active
       FROM os_verticals
       ORDER BY key`
    );

    // Fetch all sub-verticals
    const subVerticals = await query<SubVerticalRow>(
      `SELECT id, vertical_id, key, name, is_active
       FROM os_sub_verticals
       ORDER BY key`
    );

    // Fetch all personas with their policy status
    const personas = await query<PersonaRow>(
      `SELECT p.id, p.sub_vertical_id, p.key, p.name, p.is_active, p.scope, p.region_code,
              pp.status as policy_status, pp.policy_version
       FROM os_personas p
       LEFT JOIN os_persona_policies pp ON pp.persona_id = p.id
       ORDER BY p.key`
    );

    // Fetch binding counts per persona
    const bindingCounts = await query<{ persona_id: string; binding_count: number }>(
      `SELECT persona_id, COUNT(*) as binding_count
       FROM os_workspace_bindings
       WHERE is_active = true
       GROUP BY persona_id`
    );

    const bindingMap = new Map(
      bindingCounts.map(b => [b.persona_id, b.binding_count])
    );

    // Build stacks
    const stacks: VerticalStack[] = verticals.map(vertical => {
      const verticalSubVerticals = subVerticals.filter(
        sv => sv.vertical_id === vertical.id
      );

      let stackNotReadyReason: string | null = null;

      // Check vertical is active
      if (!vertical.is_active) {
        stackNotReadyReason = 'Vertical is inactive';
      }

      // Check has sub-verticals
      if (!stackNotReadyReason && verticalSubVerticals.length === 0) {
        stackNotReadyReason = 'No sub-verticals defined';
      }

      const subVerticalStatuses: SubVerticalStatus[] = verticalSubVerticals.map(sv => {
        const svPersonas = personas.filter(p => p.sub_vertical_id === sv.id);

        let svNotReadyReason: string | null = null;

        if (!sv.is_active) {
          svNotReadyReason = 'Sub-vertical is inactive';
        } else if (svPersonas.length === 0) {
          svNotReadyReason = 'No personas defined';
        }

        const personaStatuses: PersonaStatus[] = svPersonas.map(p => {
          const hasBinding = (bindingMap.get(p.id) || 0) > 0;
          let personaNotReadyReason: string | null = null;

          if (!p.is_active) {
            personaNotReadyReason = 'Persona is inactive';
          } else if (p.policy_status !== 'ACTIVE') {
            personaNotReadyReason = `Policy is ${p.policy_status || 'missing'}`;
          } else if (!hasBinding) {
            personaNotReadyReason = 'No workspace binding';
          }

          return {
            id: p.id,
            key: p.key,
            name: p.name,
            is_active: p.is_active,
            scope: p.scope,
            region_code: p.region_code,
            policy_status: p.policy_status,
            policy_version: p.policy_version,
            has_binding: hasBinding,
            status: personaNotReadyReason ? 'NOT_READY' : 'READY',
            not_ready_reason: personaNotReadyReason,
          };
        });

        // Sub-vertical is ready if at least one persona is ready
        if (!svNotReadyReason) {
          const hasReadyPersona = personaStatuses.some(p => p.status === 'READY');
          if (!hasReadyPersona && personaStatuses.length > 0) {
            svNotReadyReason = personaStatuses[0].not_ready_reason;
          }
        }

        // Propagate first sub-vertical issue to stack level
        if (!stackNotReadyReason && svNotReadyReason && sv.is_active) {
          stackNotReadyReason = svNotReadyReason;
        }

        return {
          id: sv.id,
          key: sv.key,
          name: sv.name,
          is_active: sv.is_active,
          persona_count: svPersonas.length,
          personas: includeStatus ? personaStatuses : [],
          status: svNotReadyReason ? 'NOT_READY' : 'READY',
          not_ready_reason: svNotReadyReason,
        };
      });

      // Stack is ready if at least one sub-vertical is ready
      if (!stackNotReadyReason) {
        const hasReadySubVertical = subVerticalStatuses.some(sv => sv.status === 'READY');
        if (!hasReadySubVertical && subVerticalStatuses.length > 0) {
          stackNotReadyReason = subVerticalStatuses[0].not_ready_reason;
        }
      }

      return {
        vertical: {
          id: vertical.id,
          key: vertical.key,
          name: vertical.name,
          is_active: vertical.is_active,
        },
        sub_verticals: subVerticalStatuses,
        stack_status: stackNotReadyReason ? 'NOT_READY' : 'READY',
        not_ready_reason: stackNotReadyReason,
      };
    });

    return Response.json({
      success: true,
      stacks,
      summary: {
        total_verticals: verticals.length,
        ready_stacks: stacks.filter(s => s.stack_status === 'READY').length,
        not_ready_stacks: stacks.filter(s => s.stack_status === 'NOT_READY').length,
      },
    });

  } catch (error) {
    console.error('[ControlPlane:Stacks] Error:', error);
    return serverError('Failed to fetch stacks');
  }
}
