/**
 * Super Admin Territories Config API
 *
 * Proxies to UPR OS Territory APIs (S53).
 * Provides Super Admin with control over:
 * - Territory Hierarchy
 * - Territory-Vertical Assignments
 * - Sub-Verticals
 * - Assignment Rules
 * - Metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/superadmin/security';
import { territories } from '@/lib/os/os-client';

async function verifyAuth(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return verifySession(ip, userAgent);
}

/**
 * GET /api/superadmin/os/territories
 * List territories or get specific territory details
 */
export async function GET(request: NextRequest) {
  const session = await verifyAuth(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const identifier = searchParams.get('id');

    switch (action) {
      case 'get': {
        if (!identifier) {
          return NextResponse.json({ error: 'Territory identifier required' }, { status: 400 });
        }
        const withConfig = searchParams.get('withConfig') === 'true';
        const result = await territories.get(identifier, withConfig);
        return NextResponse.json(result);
      }

      case 'hierarchy': {
        if (!identifier) {
          return NextResponse.json({ error: 'Territory identifier required' }, { status: 400 });
        }
        const result = await territories.getHierarchy(identifier);
        return NextResponse.json(result);
      }

      case 'ancestors': {
        if (!identifier) {
          return NextResponse.json({ error: 'Territory identifier required' }, { status: 400 });
        }
        const result = await territories.getAncestors(identifier);
        return NextResponse.json(result);
      }

      case 'verticals': {
        if (!identifier) {
          return NextResponse.json({ error: 'Territory identifier required' }, { status: 400 });
        }
        const result = await territories.getVerticals(identifier);
        return NextResponse.json(result);
      }

      case 'sub-verticals': {
        if (!identifier) {
          return NextResponse.json({ error: 'Territory identifier required' }, { status: 400 });
        }
        const verticalSlug = searchParams.get('verticalSlug') || undefined;
        const result = await territories.getSubVerticals(identifier, verticalSlug);
        return NextResponse.json(result);
      }

      case 'rules': {
        if (!identifier) {
          return NextResponse.json({ error: 'Territory identifier required' }, { status: 400 });
        }
        const result = await territories.getRules(identifier);
        return NextResponse.json(result);
      }

      case 'metrics': {
        if (!identifier) {
          return NextResponse.json({ error: 'Territory identifier required' }, { status: 400 });
        }
        const result = await territories.getMetrics(identifier, {
          granularity: searchParams.get('granularity') || undefined,
          startDate: searchParams.get('startDate') || undefined,
          endDate: searchParams.get('endDate') || undefined,
          limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
        });
        return NextResponse.json(result);
      }

      case 'dashboard': {
        if (!identifier) {
          return NextResponse.json({ error: 'Territory identifier required' }, { status: 400 });
        }
        const result = await territories.getDashboard(identifier);
        return NextResponse.json(result);
      }

      case 'audit': {
        if (!identifier) {
          return NextResponse.json({ error: 'Territory identifier required' }, { status: 400 });
        }
        const result = await territories.getAuditLogs(identifier, {
          limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
          offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
          action: searchParams.get('auditAction') || undefined,
          actorId: searchParams.get('actorId') || undefined,
          startDate: searchParams.get('startDate') || undefined,
          endDate: searchParams.get('endDate') || undefined,
        });
        return NextResponse.json(result);
      }

      default: {
        // List all territories
        const result = await territories.list({
          level: searchParams.get('level') || undefined,
          status: searchParams.get('status') || undefined,
          parentId: searchParams.get('parentId') || undefined,
          countryCode: searchParams.get('countryCode') || undefined,
          includeInactive: searchParams.get('includeInactive') === 'true',
        });
        return NextResponse.json(result);
      }
    }
  } catch (error) {
    console.error('[SuperAdmin:Territories] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch territories' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/superadmin/os/territories
 * Create territory or execute territory operations
 */
export async function POST(request: NextRequest) {
  const session = await verifyAuth(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create': {
        const result = await territories.create(body.territory);
        return NextResponse.json(result);
      }

      case 'move': {
        if (!body.id || !body.newParentId) {
          return NextResponse.json(
            { error: 'Territory ID and newParentId required' },
            { status: 400 }
          );
        }
        const result = await territories.move(body.id, body.newParentId);
        return NextResponse.json(result);
      }

      case 'assign-vertical': {
        if (!body.id || !body.verticalSlug) {
          return NextResponse.json(
            { error: 'Territory ID and verticalSlug required' },
            { status: 400 }
          );
        }
        const result = await territories.assignVertical(body.id, body.verticalSlug, {
          configOverride: body.configOverride,
          isPrimary: body.isPrimary,
          isActive: body.isActive,
        });
        return NextResponse.json(result);
      }

      case 'remove-vertical': {
        if (!body.id || !body.verticalSlug) {
          return NextResponse.json(
            { error: 'Territory ID and verticalSlug required' },
            { status: 400 }
          );
        }
        const result = await territories.removeVertical(body.id, body.verticalSlug);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: create, move, assign-vertical, remove-vertical' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[SuperAdmin:Territories] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to execute territory operation' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/superadmin/os/territories
 * Update territory
 */
export async function PATCH(request: NextRequest) {
  const session = await verifyAuth(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Territory ID required' }, { status: 400 });
    }

    const result = await territories.update(id, updates);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[SuperAdmin:Territories] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update territory' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/superadmin/os/territories
 * Delete territory
 */
export async function DELETE(request: NextRequest) {
  const session = await verifyAuth(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Territory ID required' }, { status: 400 });
    }

    const result = await territories.delete(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[SuperAdmin:Territories] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete territory' },
      { status: 500 }
    );
  }
}
