/**
 * S348-F3: Workspace Binding API
 * Sprint: S348 - PLG Proof Pack
 *
 * Binds an INDIVIDUAL_USER to a workspace (and implicitly to an enterprise).
 * This is the critical transition from PLG signup to enterprise-bound user.
 *
 * Flow:
 * 1. Create or find enterprise for user's email domain
 * 2. Create or find workspace with selected sub-vertical
 * 3. Update user's enterprise_id, workspace_id, role
 * 4. Emit WORKSPACE_CREATED (if new) + WORKSPACE_JOINED events
 *
 * Guardrails:
 * - User must be INDIVIDUAL_USER to bind
 * - User cannot change workspace after binding without admin
 * - Every binding emits business events
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { query, queryOne, getPool } from '@/lib/db/client';
import { getUserById, getUserProfile, User, UserProfile, lockUserVertical } from '@/lib/db/users';
import { getOrCreateEnterpriseForDomain, Enterprise } from '@/lib/db/enterprises';
import { getOrCreateDefaultWorkspace, Workspace } from '@/lib/db/workspaces';
import { emitBusinessEvent } from '@/lib/events/event-emitter';
import { ResolvedContext } from '@/lib/auth/session/session-context';

// ============================================================
// TYPES
// ============================================================

interface WorkspaceBindRequest {
  workspaceName: string;
  workspaceType: 'personal' | 'organization';
}

interface WorkspaceBindResponse {
  success: boolean;
  workspace?: {
    workspaceId: string;
    workspaceName: string;
    enterpriseId: string;
    enterpriseName: string;
  };
  error?: string;
}

// ============================================================
// POST: Bind user to workspace
// ============================================================

export async function POST(request: NextRequest): Promise<NextResponse<WorkspaceBindResponse>> {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json() as WorkspaceBindRequest;

    // Validate request
    if (!body.workspaceName?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Workspace name is required' },
        { status: 400 }
      );
    }

    if (!body.workspaceType || !['personal', 'organization'].includes(body.workspaceType)) {
      return NextResponse.json(
        { success: false, error: 'Valid workspace type is required (personal or organization)' },
        { status: 400 }
      );
    }

    // Get current user
    const user = await getUserById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // S348 Guardrail: Only INDIVIDUAL_USER can bind
    if (user.role !== 'INDIVIDUAL_USER') {
      return NextResponse.json(
        { success: false, error: 'User is already bound to a workspace' },
        { status: 409 }
      );
    }

    // S348 Guardrail: User must not already be bound
    if (user.workspace_id) {
      return NextResponse.json(
        { success: false, error: 'User already has a workspace' },
        { status: 409 }
      );
    }

    // Get user profile for context
    const profile = await getUserProfile(session.user.id);
    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Extract domain from email
    const emailDomain = user.email.split('@')[1]?.toLowerCase();
    if (!emailDomain) {
      return NextResponse.json(
        { success: false, error: 'Invalid email domain' },
        { status: 400 }
      );
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Step 1: Get or create enterprise for domain
      const enterprise = await getOrCreateEnterpriseForDomain(
        emailDomain,
        profile.company_name || emailDomain
      );

      // Step 2: Get sub-vertical ID
      const subVerticalKey = profile.sub_vertical || 'employee-banking';
      const subVerticalResult = await queryOne<{ id: string }>(
        'SELECT id FROM os_sub_verticals WHERE key = $1',
        [subVerticalKey]
      );
      const subVerticalId = subVerticalResult?.id || null;

      // Step 3: Create or get workspace
      let workspace: Workspace;
      let workspaceCreated = false;

      // Check if a workspace with this name already exists for the enterprise
      const existingWorkspace = await queryOne<Workspace>(
        'SELECT * FROM workspaces WHERE enterprise_id = $1 AND name = $2',
        [enterprise.enterprise_id, body.workspaceName.trim()]
      );

      if (existingWorkspace) {
        workspace = existingWorkspace;
      } else {
        // Create new workspace
        const workspaceResult = await client.query<Workspace>(
          `INSERT INTO workspaces (
            enterprise_id, sub_vertical_id, name, type, is_active, is_default
          )
          VALUES ($1, $2, $3, $4, true, false)
          RETURNING *`,
          [
            enterprise.enterprise_id,
            subVerticalId,
            body.workspaceName.trim(),
            body.workspaceType,
          ]
        );
        workspace = workspaceResult.rows[0];
        workspaceCreated = true;
      }

      // Step 4: Update user - bind to enterprise and workspace, upgrade role
      await client.query(
        `UPDATE users
         SET enterprise_id = $1, workspace_id = $2, role = 'ENTERPRISE_USER'
         WHERE id = $3`,
        [enterprise.enterprise_id, workspace.workspace_id, user.id]
      );

      // Step 5: Update profile onboarding step
      await client.query(
        `UPDATE user_profiles
         SET onboarding_step = 'complete', onboarding_completed = true, onboarding_completed_at = NOW()
         WHERE user_id = $1`,
        [user.id]
      );

      await client.query('COMMIT');

      // Step 6: Emit business events (AFTER transaction commits)
      const ctx: ResolvedContext = {
        user_id: user.id,
        role: 'ENTERPRISE_USER', // New role after binding
        enterprise_id: enterprise.enterprise_id,
        workspace_id: workspace.workspace_id,
        sub_vertical_id: subVerticalId,
        region_code: enterprise.region || profile.region_country || null,
        is_demo: false,
        demo_type: null,
      };

      // Emit WORKSPACE_CREATED if new workspace
      if (workspaceCreated) {
        await emitBusinessEvent(ctx, {
          event_type: 'WORKSPACE_CREATED',
          entity_type: 'WORKSPACE',
          entity_id: workspace.workspace_id,
          metadata: {
            workspace_name: workspace.name,
            workspace_type: body.workspaceType,
            enterprise_id: enterprise.enterprise_id,
            enterprise_name: enterprise.name,
            created_by: user.id,
            plg_workspace: true,
          },
        });
      }

      // Emit USER_UPDATED for role change (INDIVIDUAL_USER → ENTERPRISE_USER)
      await emitBusinessEvent(ctx, {
        event_type: 'USER_UPDATED',
        entity_type: 'USER',
        entity_id: user.id,
        metadata: {
          workspace_bound: true,
          workspace_id: workspace.workspace_id,
          workspace_name: workspace.name,
          enterprise_id: enterprise.enterprise_id,
          enterprise_name: enterprise.name,
          role_transition: {
            from: 'INDIVIDUAL_USER',
            to: 'ENTERPRISE_USER',
          },
          onboarding_completed: true,
          plg_flow: true,
          binding_type: body.workspaceType,
        },
      });

      console.log('[S348-F3] Workspace binding complete:', {
        userId: user.id,
        workspaceId: workspace.workspace_id,
        enterpriseId: enterprise.enterprise_id,
        roleTransition: 'INDIVIDUAL_USER → ENTERPRISE_USER',
        workspaceCreated,
      });

      return NextResponse.json({
        success: true,
        workspace: {
          workspaceId: workspace.workspace_id,
          workspaceName: workspace.name,
          enterpriseId: enterprise.enterprise_id,
          enterpriseName: enterprise.name,
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[S348-F3] POST /api/onboarding/workspace error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create workspace' },
      { status: 500 }
    );
  }
}
