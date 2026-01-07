/**
 * OS Vertical Resolver API (F3) - v2.1
 *
 * S350: Security Hole Remediation - Added authentication requirement
 *
 * GET /api/os/resolve-vertical?vertical=...&subVertical=...&region=...
 *
 * Resolves vertical/sub-vertical/region combination to:
 * - vertical_id, sub_vertical_id, persona_id
 * - Full persona with policy
 * - Configuration
 *
 * v2.1 CHANGES (S255 MVT Hard Gate v2):
 * - MVT now comes from os_sub_vertical_mvt_versions table
 * - Only ACTIVE MVT version is used (via active_mvt_version_id pointer)
 * - MVT must be mvt_valid=true AND status='ACTIVE' for runtime eligibility
 *
 * v2.0 CHANGES:
 * - primary_entity_type now comes from sub-vertical (not vertical)
 * - Persona resolution uses scope/region_code inheritance
 * - Policy must be ACTIVE status to be used
 * - All 5 layers must be valid or HARD FAIL (no silent degradation)
 *
 * Contract:
 * - Returns VERTICAL_NOT_CONFIGURED if vertical not found
 * - Returns SUB_VERTICAL_NOT_CONFIGURED if sub-vertical not found
 * - Returns MVT_INCOMPLETE if no valid active MVT version
 * - Returns PERSONA_NOT_CONFIGURED if persona not found
 * - Returns POLICY_NOT_ACTIVE if policy is not ACTIVE status
 * - All behavior driven by database, not hardcoded
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import { requireAuth } from '@/lib/middleware/auth-gate';

interface OSVertical {
  id: string;
  key: string;
  name: string;
  entity_type: string;
  region_scope: string[];
  is_active: boolean;
}

interface OSSubVertical {
  id: string;
  key: string;
  name: string;
  default_agent: string;
  primary_entity_type: string;       // v2.0
  related_entity_types: string[];    // v2.0
  active_mvt_version_id: string | null;  // v2.1: Points to versions table
  is_active: boolean;
}

// v2.1: MVT data comes from separate versions table
interface OSMVTVersion {
  id: string;
  mvt_version: number;
  buyer_role: string;
  decision_owner: string;
  allowed_signals: unknown;
  kill_rules: unknown;
  seed_scenarios: unknown;
  mvt_valid: boolean;
  mvt_validated_at: string | null;
  status: string;  // DRAFT | ACTIVE | DEPRECATED
}

interface OSPersona {
  id: string;
  key: string;
  name: string;
  mission: string | null;
  decision_lens: string | null;
  scope: string;               // v2.0
  region_code: string | null;  // v2.0
  is_active: boolean;
}

interface OSPersonaPolicy {
  id: string;
  persona_id: string;
  policy_version: number;
  status: string;                              // v2.0: DRAFT | STAGED | ACTIVE | DEPRECATED
  allowed_intents: unknown[];
  forbidden_outputs: unknown[];
  allowed_tools: unknown[];
  evidence_scope: Record<string, unknown>;
  memory_scope: Record<string, unknown>;
  cost_budget: Record<string, unknown>;
  latency_budget: Record<string, unknown>;
  escalation_rules: Record<string, unknown>;
  disclaimer_rules: Record<string, unknown>;
  activated_at: string | null;                 // v2.0
}

export async function GET(request: NextRequest) {
  // S350: Enforce authentication
  const auth = await requireAuth();
  if (!auth.success) return auth.response;

  const { searchParams } = new URL(request.url);
  const vertical = searchParams.get('vertical');
  const subVertical = searchParams.get('subVertical');
  const region = searchParams.get('region');

  // Validate required params
  if (!vertical || !subVertical || !region) {
    return NextResponse.json({
      success: false,
      error: 'MISSING_PARAMS',
      message: 'vertical, subVertical, and region parameters are required',
    }, { status: 400 });
  }

  try {
    // 1. Find vertical
    const verticalRow = await queryOne<OSVertical>(
      `SELECT id, key, name, entity_type, region_scope, is_active
       FROM os_verticals
       WHERE key = $1 AND is_active = true`,
      [vertical]
    );

    if (!verticalRow) {
      return NextResponse.json({
        success: false,
        error: 'VERTICAL_NOT_CONFIGURED',
        message: `Vertical '${vertical}' not found or inactive`,
        vertical,
      }, { status: 404 });
    }

    // Check region is in scope
    const regionScope = verticalRow.region_scope || [];
    if (!regionScope.includes(region) && !regionScope.includes('GLOBAL')) {
      return NextResponse.json({
        success: false,
        error: 'REGION_NOT_IN_SCOPE',
        message: `Region '${region}' not in vertical scope: ${regionScope.join(', ')}`,
        vertical,
        region,
        available_regions: regionScope,
      }, { status: 404 });
    }

    // 2. Find sub-vertical (v2.1: MVT from versions table via active_mvt_version_id)
    const subVerticalRow = await queryOne<OSSubVertical>(
      `SELECT id, key, name, default_agent,
              primary_entity_type, related_entity_types,
              active_mvt_version_id,
              is_active
       FROM os_sub_verticals
       WHERE vertical_id = $1 AND key = $2 AND is_active = true`,
      [verticalRow.id, subVertical]
    );

    if (!subVerticalRow) {
      return NextResponse.json({
        success: false,
        error: 'SUB_VERTICAL_NOT_CONFIGURED',
        message: `Sub-vertical '${subVertical}' not found for vertical '${vertical}'`,
        vertical,
        subVertical,
      }, { status: 404 });
    }

    // v2.1: Get active MVT version from versions table
    let mvtVersion: OSMVTVersion | null = null;

    if (subVerticalRow.active_mvt_version_id) {
      mvtVersion = await queryOne<OSMVTVersion>(
        `SELECT id, mvt_version, buyer_role, decision_owner,
                allowed_signals, kill_rules, seed_scenarios,
                mvt_valid, mvt_validated_at, status
         FROM os_sub_vertical_mvt_versions
         WHERE id = $1 AND status = 'ACTIVE'`,
        [subVerticalRow.active_mvt_version_id]
      );
    }

    // S255 MVT HARD GATE v2.1:
    // - Must have active MVT version
    // - MVT version must be mvt_valid=true AND status='ACTIVE'
    if (!mvtVersion || !mvtVersion.mvt_valid || mvtVersion.status !== 'ACTIVE') {
      // Build detailed error response
      const mvtRequirements: Record<string, string> = {};

      if (!mvtVersion) {
        mvtRequirements.mvt_version = 'NO_ACTIVE_VERSION';
      } else {
        mvtRequirements.buyer_role = mvtVersion.buyer_role ? 'present' : 'MISSING';
        mvtRequirements.decision_owner = mvtVersion.decision_owner ? 'present' : 'MISSING';
        mvtRequirements.allowed_signals = Array.isArray(mvtVersion.allowed_signals) && (mvtVersion.allowed_signals as unknown[]).length > 0 ? 'present' : 'MISSING';
        mvtRequirements.kill_rules = Array.isArray(mvtVersion.kill_rules) && (mvtVersion.kill_rules as unknown[]).length >= 2 ? 'present' : 'MISSING (min 2)';
        mvtRequirements.seed_scenarios = mvtVersion.seed_scenarios ? 'present' : 'MISSING';
        mvtRequirements.status = mvtVersion.status === 'ACTIVE' ? 'ACTIVE' : `NOT_ACTIVE (${mvtVersion.status})`;
        mvtRequirements.mvt_valid = mvtVersion.mvt_valid ? 'valid' : 'INVALID';
      }

      return NextResponse.json({
        success: false,
        error: 'MVT_INCOMPLETE',
        message: `Sub-vertical '${subVertical}' does not have complete Minimum Viable Truth (MVT). Cannot resolve for runtime.`,
        vertical,
        subVertical,
        mvt_status: {
          valid: mvtVersion?.mvt_valid || false,
          version: mvtVersion?.mvt_version || 0,
          validated_at: mvtVersion?.mvt_validated_at || null,
          status: mvtVersion?.status || 'NO_VERSION',
        },
        mvt_requirements: mvtRequirements,
        blocker: !mvtVersion ? 'NO_MVT_VERSION' :
                 !mvtVersion.mvt_valid ? 'MVT_INVALID' :
                 mvtVersion.status !== 'ACTIVE' ? 'MVT_NOT_ACTIVE' : 'UNKNOWN',
      }, { status: 400 });
    }

    // 3. Find persona (v2.0: scope/region inheritance - LOCAL > REGIONAL > GLOBAL)
    // First try LOCAL persona for exact region match
    let personaRow = await queryOne<OSPersona>(
      `SELECT id, key, name, mission, decision_lens, scope, region_code, is_active
       FROM os_personas
       WHERE sub_vertical_id = $1 AND is_active = true
         AND scope = 'LOCAL' AND region_code = $2
       ORDER BY created_at ASC
       LIMIT 1`,
      [subVerticalRow.id, region]
    );

    // If no LOCAL, try GLOBAL fallback
    if (!personaRow) {
      personaRow = await queryOne<OSPersona>(
        `SELECT id, key, name, mission, decision_lens, scope, region_code, is_active
         FROM os_personas
         WHERE sub_vertical_id = $1 AND is_active = true
           AND scope = 'GLOBAL'
         ORDER BY created_at ASC
         LIMIT 1`,
        [subVerticalRow.id]
      );
    }

    // If still no persona, try any active persona (backward compatibility)
    if (!personaRow) {
      personaRow = await queryOne<OSPersona>(
        `SELECT id, key, name, mission, decision_lens, scope, region_code, is_active
         FROM os_personas
         WHERE sub_vertical_id = $1 AND is_active = true
         ORDER BY created_at ASC
         LIMIT 1`,
        [subVerticalRow.id]
      );
    }

    if (!personaRow) {
      return NextResponse.json({
        success: false,
        error: 'PERSONA_NOT_CONFIGURED',
        message: `No active persona found for sub-vertical '${subVertical}'`,
        vertical,
        subVertical,
      }, { status: 404 });
    }

    // 4. Get persona policy (v2.0: MUST be ACTIVE status)
    const policyRow = await queryOne<OSPersonaPolicy>(
      `SELECT id, persona_id, policy_version, status,
              allowed_intents, forbidden_outputs, allowed_tools,
              evidence_scope, memory_scope, cost_budget, latency_budget,
              escalation_rules, disclaimer_rules, activated_at
       FROM os_persona_policies
       WHERE persona_id = $1 AND status = 'ACTIVE'`,
      [personaRow.id]
    );

    // v2.0: Policy MUST exist and be ACTIVE - hard fail if not
    if (!policyRow) {
      return NextResponse.json({
        success: false,
        error: 'POLICY_NOT_ACTIVE',
        message: `No active policy found for persona '${personaRow.key}'. Policy must be in ACTIVE status.`,
        vertical,
        subVertical,
        persona_key: personaRow.key,
      }, { status: 404 });
    }

    // Build response (v2.1: MVT from versions table)
    return NextResponse.json({
      success: true,
      vertical_id: verticalRow.id,
      vertical_key: verticalRow.key,
      vertical_name: verticalRow.name,
      entity_type: subVerticalRow.primary_entity_type,  // v2.0: Now from sub-vertical
      entity_type_deprecated: verticalRow.entity_type,  // v2.0: Deprecated, remove in v3.0
      region_scope: regionScope,

      sub_vertical_id: subVerticalRow.id,
      sub_vertical_key: subVerticalRow.key,
      sub_vertical_name: subVerticalRow.name,
      default_agent: subVerticalRow.default_agent,
      primary_entity_type: subVerticalRow.primary_entity_type,  // v2.0
      related_entity_types: subVerticalRow.related_entity_types, // v2.0

      // S255 v2.1: ICP Truth Triad (from versions table)
      icp_truth: {
        primary_entity_type: subVerticalRow.primary_entity_type,
        buyer_role: mvtVersion.buyer_role,
        decision_owner: mvtVersion.decision_owner,
      },

      // S255 v2.1: Signal Allow-List (from versions table)
      allowed_signals: mvtVersion.allowed_signals,

      // S255 v2.1: Kill Rules (from versions table)
      kill_rules: mvtVersion.kill_rules,

      // S255 v2.1: Sales-Bench Seed Scenarios (from versions table)
      seed_scenarios: mvtVersion.seed_scenarios,

      // S255 v2.1: MVT Status (from versions table)
      mvt_status: {
        valid: mvtVersion.mvt_valid,
        version: mvtVersion.mvt_version,
        validated_at: mvtVersion.mvt_validated_at,
        status: mvtVersion.status,
        version_id: mvtVersion.id,
      },

      persona_id: personaRow.id,
      persona_key: personaRow.key,
      persona_name: personaRow.name,
      mission: personaRow.mission,
      decision_lens: personaRow.decision_lens,
      persona_scope: personaRow.scope,               // v2.0
      persona_region_code: personaRow.region_code,   // v2.0

      policy: {
        version: policyRow.policy_version,
        status: policyRow.status,                    // v2.0
        activated_at: policyRow.activated_at,        // v2.0
        allowed_intents: policyRow.allowed_intents,
        forbidden_outputs: policyRow.forbidden_outputs,
        allowed_tools: policyRow.allowed_tools,
        evidence_scope: policyRow.evidence_scope,
        memory_scope: policyRow.memory_scope,
        cost_budget: policyRow.cost_budget,
        latency_budget: policyRow.latency_budget,
        escalation_rules: policyRow.escalation_rules,
        disclaimer_rules: policyRow.disclaimer_rules,
      },

      config: {
        vertical,
        subVertical,
        region,
        resolved_at: new Date().toISOString(),
        control_plane_version: '2.1',  // v2.1: MVT versions table
        mvt_version: mvtVersion.mvt_version,
        mvt_version_id: mvtVersion.id,
      },
    });

  } catch (error) {
    console.error('[resolve-vertical] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to resolve vertical configuration',
    }, { status: 500 });
  }
}
