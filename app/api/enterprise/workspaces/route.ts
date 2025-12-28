/**
 * S292: Workspace APIs
 * Part of User & Enterprise Management Program v1.1
 * Phase C - Backend & API
 *
 * GET  /api/enterprise/workspaces - List workspaces
 * POST /api/enterprise/workspaces - Create workspace (ENTERPRISE_ADMIN only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import {
  listEnterpriseWorkspaces,
  createWorkspace,
  canCreateWorkspace,
} from '@/lib/db/workspaces';
import { hasRequiredRole } from '@/lib/auth/rbac/types';
import { query } from '@/lib/db/client';

// ============================================================
// GET /api/enterprise/workspaces - List workspaces
// ============================================================

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const enterpriseId = session.enterpriseId;

    if (!enterpriseId) {
      return NextResponse.json(
        { success: false, error: 'No enterprise associated with user' },
        { status: 404 }
      );
    }

    const { workspaces, total } = await listEnterpriseWorkspaces(enterpriseId);

    // Check if more workspaces can be created
    const canCreate = await canCreateWorkspace(enterpriseId);

    return NextResponse.json({
      success: true,
      data: {
        workspaces: workspaces.map((ws) => ({
          id: ws.workspace_id,
          name: ws.name,
          slug: ws.slug,
          sub_vertical_id: ws.sub_vertical_id,
          status: ws.status,
          is_default: ws.is_default,
          created_at: ws.created_at,
        })),
        total,
        can_create: canCreate,
      },
    });
  } catch (error) {
    console.error('[API] GET /api/enterprise/workspaces error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list workspaces' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/enterprise/workspaces - Create workspace (ENTERPRISE_ADMIN only)
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has ENTERPRISE_ADMIN or higher role
    const userRole = session.user.role as 'SUPER_ADMIN' | 'ENTERPRISE_ADMIN' | 'ENTERPRISE_USER' | 'INDIVIDUAL_USER' | 'TENANT_ADMIN' | 'TENANT_USER' | 'READ_ONLY';
    if (!hasRequiredRole(userRole, 'ENTERPRISE_ADMIN') && !hasRequiredRole(userRole, 'TENANT_ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'ENTERPRISE_ADMIN role required' },
        { status: 403 }
      );
    }

    const enterpriseId = session.enterpriseId;

    if (!enterpriseId) {
      return NextResponse.json(
        { success: false, error: 'No enterprise associated with user' },
        { status: 404 }
      );
    }

    // Check capacity
    const canCreate = await canCreateWorkspace(enterpriseId);
    if (!canCreate) {
      return NextResponse.json(
        { success: false, error: 'Workspace limit reached. Upgrade your plan to add more workspaces.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Workspace name is required' },
        { status: 400 }
      );
    }

    // Get sub-vertical ID - either from request or use default
    let subVerticalId = body.sub_vertical_id;
    if (!subVerticalId) {
      // Use employee_banking as default
      const subVerticalResult = await query<{ id: string }>(
        `SELECT id FROM os_sub_verticals WHERE key = 'employee_banking' LIMIT 1`
      );
      subVerticalId = subVerticalResult[0]?.id;
    }

    if (!subVerticalId) {
      return NextResponse.json(
        { success: false, error: 'Sub-vertical ID is required or default not found' },
        { status: 400 }
      );
    }

    // Create the workspace
    const workspace = await createWorkspace({
      enterprise_id: enterpriseId,
      name: body.name,
      sub_vertical_id: subVerticalId,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      is_default: body.is_default || false,
      settings: body.settings || {},
    });

    return NextResponse.json({
      success: true,
      data: {
        workspace: {
          id: workspace.workspace_id,
          name: workspace.name,
          slug: workspace.slug,
          sub_vertical_id: workspace.sub_vertical_id,
          status: workspace.status,
          is_default: workspace.is_default,
          created_at: workspace.created_at,
        },
      },
    });
  } catch (error) {
    console.error('[API] POST /api/enterprise/workspaces error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create workspace' },
      { status: 500 }
    );
  }
}
