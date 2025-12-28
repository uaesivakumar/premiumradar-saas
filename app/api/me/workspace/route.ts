/**
 * S299: Workspace Switch API
 * Part of User & Enterprise Management Program v1.1
 * Phase D - Frontend & UI
 *
 * PUT /api/me/workspace - Switch current user's workspace
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { changeUserWorkspace } from '@/lib/db/user-profiles';
import { getWorkspaceById } from '@/lib/db/workspaces';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.workspace_id) {
      return NextResponse.json(
        { success: false, error: 'workspace_id is required' },
        { status: 400 }
      );
    }

    // Verify workspace exists and belongs to user's enterprise
    const workspace = await getWorkspaceById(body.workspace_id);

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Check workspace belongs to user's enterprise
    if (workspace.enterprise_id !== session.enterpriseId) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this workspace' },
        { status: 403 }
      );
    }

    // Switch workspace
    await changeUserWorkspace(session.user.id, body.workspace_id);

    return NextResponse.json({
      success: true,
      data: {
        workspace: {
          id: workspace.workspace_id,
          name: workspace.name,
          sub_vertical_id: workspace.sub_vertical_id,
        },
      },
    });
  } catch (error) {
    console.error('[API] PUT /api/me/workspace error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to switch workspace' },
      { status: 500 }
    );
  }
}
