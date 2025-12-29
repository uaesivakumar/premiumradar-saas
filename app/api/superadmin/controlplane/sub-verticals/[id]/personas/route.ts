/**
 * OS Sub-Vertical Personas API
 *
 * GET /api/superadmin/controlplane/sub-verticals/[id]/personas
 * List all personas for a specific sub-vertical
 *
 * Used by:
 * - Wizard "Extend Existing Stack" flow to select persona for policy updates
 * - Control Plane hierarchy view
 */

import { query, queryOne } from '@/lib/db/client';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';
import { serverError, notFoundError } from '@/lib/db/controlplane-audit';

interface OSPersona {
  id: string;
  sub_vertical_id: string;
  key: string;
  name: string;
  mission: string | null;
  decision_lens: string | null;
  scope: string;
  region_code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  policy_status?: string;
  policy_version?: number;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/superadmin/controlplane/sub-verticals/[id]/personas
 * List all personas for a sub-vertical
 */
export async function GET(
  request: Request,
  context: RouteContext
) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: subVerticalId } = await context.params;

  try {
    // First verify the sub-vertical exists
    const subVertical = await queryOne<{ id: string; name: string }>(
      'SELECT id, name FROM os_sub_verticals WHERE id = $1',
      [subVerticalId]
    );

    if (!subVertical) {
      return notFoundError('Sub-Vertical');
    }

    // Fetch personas with their latest policy status
    const personas = await query<OSPersona>(
      `SELECT
        p.id,
        p.sub_vertical_id,
        p.key,
        p.name,
        p.mission,
        p.decision_lens,
        p.scope,
        p.region_code,
        p.is_active,
        p.created_at,
        p.updated_at,
        pol.status as policy_status,
        pol.policy_version
       FROM os_personas p
       LEFT JOIN os_persona_policies pol ON p.id = pol.persona_id
       WHERE p.sub_vertical_id = $1
       ORDER BY p.created_at ASC`,
      [subVerticalId]
    );

    return Response.json({
      success: true,
      data: personas,
      sub_vertical: subVertical,
    });
  } catch (error) {
    console.error('[SubVertical:Personas GET] Error:', error);
    return serverError('Failed to fetch personas');
  }
}
