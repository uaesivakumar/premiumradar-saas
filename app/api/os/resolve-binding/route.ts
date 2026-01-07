/**
 * OS Workspace Binding Resolution API (Control Plane v2.0)
 *
 * GET /api/os/resolve-binding?workspace_id=...
 *
 * S350: Security Hole Remediation - Added auth, tenant_id from session
 *
 * Resolves runtime configuration purely from workspace binding.
 * This is the v2.0 path - NO manual config, NO hardcoded defaults.
 *
 * Resolution Flow:
 * 1. Lookup binding by tenant_id (from session) + workspace_id
 * 2. Validate all 5 layers are active
 * 3. Return full configuration including persona + policy
 *
 * Error Codes:
 * - BINDING_NOT_FOUND: No binding exists for this workspace
 * - BINDING_INACTIVE: Binding exists but is inactive
 * - VERTICAL_INACTIVE: Bound vertical is inactive
 * - SUB_VERTICAL_INACTIVE: Bound sub-vertical is inactive
 * - PERSONA_INACTIVE: Bound persona is inactive
 * - POLICY_NOT_ACTIVE: Persona has no ACTIVE policy
 *
 * This endpoint proves discovery can work purely via binding (no manual config).
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db/client';
import { requireAuth } from '@/lib/middleware/auth-gate';

interface BindingResolution {
  // Binding info
  binding_id: string;
  tenant_id: string;
  workspace_id: string;
  binding_active: boolean;

  // Vertical info
  vertical_id: string;
  vertical_key: string;
  vertical_name: string;
  vertical_active: boolean;

  // Sub-vertical info
  sub_vertical_id: string;
  sub_vertical_key: string;
  sub_vertical_name: string;
  sub_vertical_active: boolean;
  default_agent: string;
  primary_entity_type: string;
  related_entity_types: string[];

  // Persona info
  persona_id: string;
  persona_key: string;
  persona_name: string;
  persona_active: boolean;
  mission: string | null;
  decision_lens: string | null;
  scope: string;
  region_code: string | null;

  // Policy info
  policy_id: string | null;
  policy_version: number | null;
  policy_status: string | null;
  policy_activated_at: string | null;
}

export async function GET(request: NextRequest) {
  // S350: Enforce authentication
  const auth = await requireAuth();
  if (!auth.success) return auth.response;

  const { session } = auth;
  // VS1: CRITICAL - tenant_id from session, NOT from query params
  const tenant_id = session.tenantId;

  const { searchParams } = new URL(request.url);
  const workspace_id = searchParams.get('workspace_id');

  // Validate required params (tenant_id now comes from session)
  if (!workspace_id) {
    return NextResponse.json({
      success: false,
      error: 'MISSING_PARAMS',
      message: 'workspace_id is required',
    }, { status: 400 });
  }

  try {
    // Single query to get binding + all related data
    const resolution = await queryOne<BindingResolution>(`
      SELECT
        -- Binding
        wb.id as binding_id,
        wb.tenant_id::text,
        wb.workspace_id,
        wb.is_active as binding_active,

        -- Vertical
        v.id as vertical_id,
        v.key as vertical_key,
        v.name as vertical_name,
        v.is_active as vertical_active,

        -- Sub-vertical
        sv.id as sub_vertical_id,
        sv.key as sub_vertical_key,
        sv.name as sub_vertical_name,
        sv.is_active as sub_vertical_active,
        sv.default_agent,
        sv.primary_entity_type,
        sv.related_entity_types,

        -- Persona
        p.id as persona_id,
        p.key as persona_key,
        p.name as persona_name,
        p.is_active as persona_active,
        p.mission,
        p.decision_lens,
        p.scope,
        p.region_code,

        -- Policy (ACTIVE only)
        pp.id as policy_id,
        pp.policy_version,
        pp.status as policy_status,
        pp.activated_at as policy_activated_at

      FROM os_workspace_bindings wb
      JOIN os_verticals v ON wb.vertical_id = v.id
      JOIN os_sub_verticals sv ON wb.sub_vertical_id = sv.id
      JOIN os_personas p ON wb.persona_id = p.id
      LEFT JOIN os_persona_policies pp ON pp.persona_id = p.id AND pp.status = 'ACTIVE'
      WHERE wb.tenant_id = $1::uuid AND wb.workspace_id = $2
    `, [tenant_id, workspace_id]);

    // 1. No binding found
    if (!resolution) {
      return NextResponse.json({
        success: false,
        error: 'BINDING_NOT_FOUND',
        message: `No workspace binding found for tenant '${tenant_id}' workspace '${workspace_id}'`,
        tenant_id,
        workspace_id,
        hint: 'Create a workspace binding in Super Admin Control Plane first.',
      }, { status: 404 });
    }

    // 2. Binding inactive
    if (!resolution.binding_active) {
      return NextResponse.json({
        success: false,
        error: 'BINDING_INACTIVE',
        message: 'Workspace binding exists but is inactive',
        tenant_id,
        workspace_id,
        binding_id: resolution.binding_id,
      }, { status: 400 });
    }

    // 3. Vertical inactive
    if (!resolution.vertical_active) {
      return NextResponse.json({
        success: false,
        error: 'VERTICAL_INACTIVE',
        message: `Vertical '${resolution.vertical_key}' is inactive`,
        tenant_id,
        workspace_id,
        vertical_key: resolution.vertical_key,
      }, { status: 400 });
    }

    // 4. Sub-vertical inactive
    if (!resolution.sub_vertical_active) {
      return NextResponse.json({
        success: false,
        error: 'SUB_VERTICAL_INACTIVE',
        message: `Sub-vertical '${resolution.sub_vertical_key}' is inactive`,
        tenant_id,
        workspace_id,
        sub_vertical_key: resolution.sub_vertical_key,
      }, { status: 400 });
    }

    // 5. Persona inactive
    if (!resolution.persona_active) {
      return NextResponse.json({
        success: false,
        error: 'PERSONA_INACTIVE',
        message: `Persona '${resolution.persona_key}' is inactive`,
        tenant_id,
        workspace_id,
        persona_key: resolution.persona_key,
      }, { status: 400 });
    }

    // 6. No active policy
    if (!resolution.policy_id || resolution.policy_status !== 'ACTIVE') {
      return NextResponse.json({
        success: false,
        error: 'POLICY_NOT_ACTIVE',
        message: `Persona '${resolution.persona_key}' has no ACTIVE policy`,
        tenant_id,
        workspace_id,
        persona_key: resolution.persona_key,
        hint: 'Activate a policy for this persona in Super Admin Control Plane.',
      }, { status: 400 });
    }

    // All 5 layers valid - return full config
    return NextResponse.json({
      success: true,
      resolution_method: 'BINDING',  // Proves this came from binding
      control_plane_version: '2.0',
      resolved_at: new Date().toISOString(),

      // Binding
      binding: {
        id: resolution.binding_id,
        tenant_id: resolution.tenant_id,
        workspace_id: resolution.workspace_id,
        is_active: resolution.binding_active,
      },

      // Vertical
      vertical: {
        id: resolution.vertical_id,
        key: resolution.vertical_key,
        name: resolution.vertical_name,
      },

      // Sub-vertical
      sub_vertical: {
        id: resolution.sub_vertical_id,
        key: resolution.sub_vertical_key,
        name: resolution.sub_vertical_name,
        default_agent: resolution.default_agent,
        primary_entity_type: resolution.primary_entity_type,
        related_entity_types: resolution.related_entity_types || [],
      },

      // Persona
      persona: {
        id: resolution.persona_id,
        key: resolution.persona_key,
        name: resolution.persona_name,
        mission: resolution.mission,
        decision_lens: resolution.decision_lens,
        scope: resolution.scope,
        region_code: resolution.region_code,
      },

      // Policy
      policy: {
        id: resolution.policy_id,
        version: resolution.policy_version,
        status: resolution.policy_status,
        activated_at: resolution.policy_activated_at,
      },

      // Runtime config (what SIVA needs)
      runtime: {
        agent: resolution.default_agent,
        entity_type: resolution.primary_entity_type,
        persona_key: resolution.persona_key,
      },
    });

  } catch (error) {
    console.error('[resolve-binding] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to resolve workspace binding',
    }, { status: 500 });
  }
}
