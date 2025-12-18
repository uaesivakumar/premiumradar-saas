/**
 * OS Sub-Verticals for a Vertical API
 *
 * GET /api/superadmin/verticals/:id/sub-verticals - List sub-verticals for vertical
 */

import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';
import { notFoundError, serverError } from '@/lib/db/controlplane-audit';

interface OSSubVertical {
  id: string;
  vertical_id: string;
  key: string;
  name: string;
  default_agent: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/superadmin/verticals/:id/sub-verticals
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Verify vertical exists
    const vertical = await queryOne<{ id: string }>(
      'SELECT id FROM os_verticals WHERE id = $1',
      [id]
    );

    if (!vertical) {
      return notFoundError('Vertical');
    }

    const subVerticals = await query<OSSubVertical>(
      `SELECT id, vertical_id, key, name, default_agent, is_active, created_at, updated_at
       FROM os_sub_verticals
       WHERE vertical_id = $1
       ORDER BY created_at ASC`,
      [id]
    );

    return Response.json({
      success: true,
      data: subVerticals,
    });
  } catch (error) {
    console.error('[SubVerticals GET] Error:', error);
    return serverError('Failed to fetch sub-verticals');
  }
}
