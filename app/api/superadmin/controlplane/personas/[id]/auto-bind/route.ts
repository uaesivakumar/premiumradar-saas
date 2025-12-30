/**
 * Persona Auto-Bind API (S269)
 *
 * POST /api/superadmin/controlplane/personas/[id]/auto-bind
 *
 * This endpoint is called by the wizard's binding step.
 * It delegates to the auto-activation resolver for actual binding logic.
 *
 * The wizard doesn't need to know about user_id or workspace selection.
 * This endpoint creates a "pre-configured" binding that will be
 * fully resolved when actual users access the system.
 *
 * Request: { vertical_id, sub_vertical_id }
 * Response: { success, data: { id, status } }
 */

import { NextRequest } from 'next/server';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';
import { queryOne, insert } from '@/lib/db/client';
import { randomUUID } from 'crypto';

interface PersonaRow {
  id: string;
  key: string;
  is_active: boolean;
  sub_vertical_id: string;
}

interface PolicyRow {
  id: string;
  status: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require Super Admin session
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: personaId } = await params;
    const body = await request.json();
    const { vertical_id, sub_vertical_id } = body;

    // Validate persona exists
    const persona = await queryOne<PersonaRow>(
      'SELECT id, key, is_active, sub_vertical_id FROM os_personas WHERE id = $1',
      [personaId]
    );

    if (!persona) {
      return Response.json({
        success: false,
        error: 'PERSONA_NOT_FOUND',
        message: 'Persona not found',
      }, { status: 404 });
    }

    // Check for active policy
    const policy = await queryOne<PolicyRow>(
      `SELECT id, status FROM os_persona_policies
       WHERE persona_id = $1 AND status = 'ACTIVE' LIMIT 1`,
      [personaId]
    );

    if (!policy) {
      return Response.json({
        success: false,
        error: 'NO_ACTIVE_POLICY',
        message: 'Persona must have an ACTIVE policy before binding',
      }, { status: 400 });
    }

    // For wizard context, we create a "system-managed" binding placeholder
    // The actual binding to specific workspaces happens via the resolver
    // when users access the system.
    //
    // This approach:
    // 1. Marks the persona as "ready for auto-binding"
    // 2. Does NOT require tenant/workspace selection in wizard
    // 3. Actual binding happens per-user via resolver

    // Check if a system-managed binding already exists
    const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000000'; // Platform-level placeholder
    const SYSTEM_WORKSPACE_ID = '00000000-0000-0000-0000-000000000000'; // Platform-level placeholder
    const existingBinding = await queryOne<{ id: string }>(
      `SELECT id FROM os_workspace_bindings
       WHERE persona_id = $1 AND tenant_id = $2 AND workspace_id = $3 AND is_active = true`,
      [personaId, SYSTEM_TENANT_ID, SYSTEM_WORKSPACE_ID]
    );

    if (existingBinding) {
      // Already has a system-managed binding
      return Response.json({
        success: true,
        data: {
          id: existingBinding.id,
          status: 'AUTO_MANAGED',
          message: 'Binding already configured for auto-management',
        },
      });
    }

    // Create system-managed binding placeholder
    // Use SYSTEM placeholders for OS-level configurations (platform-wide)
    const bindingId = randomUUID();

    await insert(
      `INSERT INTO os_workspace_bindings (
        id, tenant_id, vertical_id, sub_vertical_id, persona_id, workspace_id, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, true)`,
      [bindingId, SYSTEM_TENANT_ID, vertical_id, sub_vertical_id, personaId, SYSTEM_WORKSPACE_ID]
    );

    return Response.json({
      success: true,
      data: {
        id: bindingId,
        status: 'AUTO_MANAGED',
        message: 'Binding configured for auto-management. Will resolve per-user at runtime.',
      },
    });

  } catch (error) {
    console.error('[AutoBind API] Error:', error);
    return Response.json({
      success: false,
      error: 'SERVER_ERROR',
      message: error instanceof Error ? error.message : 'Failed to configure auto-bind',
    }, { status: 500 });
  }
}
