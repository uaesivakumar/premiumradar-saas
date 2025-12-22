/**
 * OS Vertical Resolver API (F3)
 *
 * GET /api/os/resolve-vertical?vertical=...&subVertical=...&region=...
 *
 * Resolves vertical/sub-vertical/region combination to:
 * - vertical_id, sub_vertical_id, persona_id
 * - Full persona with policy
 * - Configuration
 *
 * PILOT: saas_deal_evaluation vertical validation
 *
 * Contract:
 * - Returns VERTICAL_NOT_CONFIGURED if vertical not found
 * - Returns SUB_VERTICAL_NOT_CONFIGURED if sub-vertical not found
 * - Returns PERSONA_NOT_CONFIGURED if persona not found
 * - All behavior driven by database, not hardcoded
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db/client';

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
  is_active: boolean;
}

interface OSPersona {
  id: string;
  key: string;
  name: string;
  mission: string | null;
  decision_lens: string | null;
  is_active: boolean;
}

interface OSPersonaPolicy {
  id: string;
  persona_id: string;
  policy_version: number;
  allowed_intents: unknown[];
  forbidden_outputs: unknown[];
  allowed_tools: unknown[];
  evidence_scope: Record<string, unknown>;
  memory_scope: Record<string, unknown>;
  cost_budget: Record<string, unknown>;
  latency_budget: Record<string, unknown>;
  escalation_rules: Record<string, unknown>;
  disclaimer_rules: Record<string, unknown>;
}

export async function GET(request: NextRequest) {
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

    // 2. Find sub-vertical
    const subVerticalRow = await queryOne<OSSubVertical>(
      `SELECT id, key, name, default_agent, is_active
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

    // 3. Find persona (default for this sub-vertical)
    const personaRow = await queryOne<OSPersona>(
      `SELECT id, key, name, mission, decision_lens, is_active
       FROM os_personas
       WHERE sub_vertical_id = $1 AND is_active = true
       ORDER BY created_at ASC
       LIMIT 1`,
      [subVerticalRow.id]
    );

    if (!personaRow) {
      return NextResponse.json({
        success: false,
        error: 'PERSONA_NOT_CONFIGURED',
        message: `No active persona found for sub-vertical '${subVertical}'`,
        vertical,
        subVertical,
      }, { status: 404 });
    }

    // 4. Get persona policy
    const policyRow = await queryOne<OSPersonaPolicy>(
      `SELECT id, persona_id, policy_version,
              allowed_intents, forbidden_outputs, allowed_tools,
              evidence_scope, memory_scope, cost_budget, latency_budget,
              escalation_rules, disclaimer_rules
       FROM os_persona_policies
       WHERE persona_id = $1`,
      [personaRow.id]
    );

    // Build response
    return NextResponse.json({
      success: true,
      vertical_id: verticalRow.id,
      vertical_key: verticalRow.key,
      vertical_name: verticalRow.name,
      entity_type: verticalRow.entity_type,
      region_scope: regionScope,

      sub_vertical_id: subVerticalRow.id,
      sub_vertical_key: subVerticalRow.key,
      sub_vertical_name: subVerticalRow.name,
      default_agent: subVerticalRow.default_agent,

      persona_id: personaRow.id,
      persona_key: personaRow.key,
      persona_name: personaRow.name,
      mission: personaRow.mission,
      decision_lens: personaRow.decision_lens,

      policy: policyRow ? {
        version: policyRow.policy_version,
        allowed_intents: policyRow.allowed_intents,
        forbidden_outputs: policyRow.forbidden_outputs,
        allowed_tools: policyRow.allowed_tools,
        evidence_scope: policyRow.evidence_scope,
        memory_scope: policyRow.memory_scope,
        cost_budget: policyRow.cost_budget,
        latency_budget: policyRow.latency_budget,
        escalation_rules: policyRow.escalation_rules,
        disclaimer_rules: policyRow.disclaimer_rules,
      } : null,

      config: {
        vertical,
        subVertical,
        region,
        resolved_at: new Date().toISOString(),
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
