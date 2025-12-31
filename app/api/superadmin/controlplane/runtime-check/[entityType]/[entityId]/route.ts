/**
 * S339: Runtime Readiness Check API
 *
 * GET /api/superadmin/controlplane/runtime-check/[entityType]/[entityId]
 *
 * Returns explicit runtime eligibility checks - NOT just a binary "READY".
 * Banks will ask: "ready for what?"
 *
 * Checks:
 * - vertical_resolved
 * - sub_vertical_resolved
 * - persona_resolved
 * - policy_active
 * - mvt_complete (kill rules, signals, scenarios)
 * - signals_resolvable
 * - envelope_buildable
 * - nba_ready
 * - replay_eligible
 *
 * Also returns mvt_certified boolean derived from:
 * - Required signals present
 * - Required scenarios present
 * - Kill rules resolvable
 */

import { NextRequest } from 'next/server';
import { queryOne, query } from '@/lib/db/client';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';
import { serverError, notFoundError } from '@/lib/db/controlplane-audit';

interface RuntimeCheck {
  check: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

interface RouteParams {
  params: Promise<{ entityType: string; entityId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { entityType, entityId } = await params;

  if (!['sub-vertical', 'persona'].includes(entityType)) {
    return Response.json(
      { success: false, error: 'Invalid entity type. Must be sub-vertical or persona' },
      { status: 400 }
    );
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!entityId || !uuidRegex.test(entityId)) {
    console.error('[RuntimeCheck] Invalid UUID format:', entityId);
    return Response.json(
      { success: false, error: 'Invalid entity ID format' },
      { status: 400 }
    );
  }

  try {
    const checks: RuntimeCheck[] = [];
    let entityName = '';
    let mvtCertified = true;
    let overallEligible = true;

    if (entityType === 'sub-vertical') {
      // Get sub-vertical base info (without MVT columns that might not exist)
      const svBase = await queryOne<{
        id: string;
        key: string;
        name: string;
        vertical_id: string;
        vertical_key: string;
        vertical_name: string;
        vertical_is_active: boolean;
        is_active: boolean;
      }>(
        `SELECT
           sv.id, sv.key, sv.name, sv.vertical_id, sv.is_active,
           COALESCE(v.key, 'unknown') as vertical_key,
           COALESCE(v.name, 'Unknown') as vertical_name,
           COALESCE(v.is_active, false) as vertical_is_active
         FROM os_sub_verticals sv
         LEFT JOIN os_verticals v ON v.id = sv.vertical_id
         WHERE sv.id = $1`,
        [entityId]
      );

      if (!svBase) {
        return notFoundError('Sub-Vertical');
      }

      // Try to get MVT columns separately (they might not exist if migration not run)
      interface MVTData {
        buyer_role: string | null;
        decision_owner: string | null;
        allowed_signals: unknown[];
        kill_rules: unknown[];
        seed_scenarios: { golden?: unknown[]; kill?: unknown[] } | null;
        mvt_valid: boolean | null;
      }
      let mvtData: MVTData | null = null;
      try {
        mvtData = await queryOne<MVTData>(
          `SELECT buyer_role, decision_owner, allowed_signals, kill_rules, seed_scenarios, mvt_valid
           FROM os_sub_verticals WHERE id = $1`,
          [entityId]
        );
      } catch (mvtError) {
        console.warn('[RuntimeCheck] MVT columns not available:', mvtError instanceof Error ? mvtError.message : 'unknown');
      }

      // Merge base and MVT data
      const sv = {
        ...svBase,
        buyer_role: mvtData?.buyer_role || null,
        decision_owner: mvtData?.decision_owner || null,
        allowed_signals: mvtData?.allowed_signals || [],
        kill_rules: mvtData?.kill_rules || [],
        seed_scenarios: mvtData?.seed_scenarios || null,
        mvt_valid: mvtData?.mvt_valid || null,
      };

      entityName = sv.name;

      // Check 1: Vertical resolved
      if (sv.vertical_is_active) {
        checks.push({
          check: 'vertical_resolved',
          status: 'pass',
          message: 'Vertical resolved',
          details: `${sv.vertical_name} (${sv.vertical_key}) is active`,
        });
      } else {
        checks.push({
          check: 'vertical_resolved',
          status: 'fail',
          message: 'Vertical not resolved',
          details: `${sv.vertical_name} is inactive`,
        });
        overallEligible = false;
      }

      // Check 2: Sub-vertical resolved
      if (sv.is_active) {
        checks.push({
          check: 'sub_vertical_resolved',
          status: 'pass',
          message: 'Sub-vertical resolved',
          details: `${sv.name} (${sv.key}) is active`,
        });
      } else {
        checks.push({
          check: 'sub_vertical_resolved',
          status: 'fail',
          message: 'Sub-vertical not resolved',
          details: `${sv.name} is inactive`,
        });
        overallEligible = false;
      }

      // Check 3: MVT Complete
      const mvtIssues: string[] = [];

      if (!sv.buyer_role) {
        mvtIssues.push('buyer_role missing');
        mvtCertified = false;
      }
      if (!sv.decision_owner) {
        mvtIssues.push('decision_owner missing');
        mvtCertified = false;
      }

      const allowedSignals = Array.isArray(sv.allowed_signals) ? sv.allowed_signals : [];
      if (allowedSignals.length === 0) {
        mvtIssues.push('no allowed_signals');
        mvtCertified = false;
      }

      const killRules = Array.isArray(sv.kill_rules) ? sv.kill_rules : [];
      if (killRules.length === 0) {
        mvtIssues.push('no kill_rules');
        mvtCertified = false;
      }

      // Check for compliance rule (explicit is_compliance flag OR text match)
      const hasComplianceRule = (killRules as Array<{ rule?: string; is_compliance?: boolean }>).some(
        (r) =>
          r.is_compliance === true ||
          r.rule?.toLowerCase().includes('compliance') ||
          r.rule?.toLowerCase().includes('gdpr')
      );
      if (!hasComplianceRule) {
        mvtIssues.push('no compliance kill rule');
        mvtCertified = false;
      }

      const seedScenarios = sv.seed_scenarios || { golden: [], kill: [] };
      const hasGoldenScenarios = (seedScenarios.golden?.length || 0) > 0;
      const hasKillScenarios = (seedScenarios.kill?.length || 0) > 0;
      if (!hasGoldenScenarios && !hasKillScenarios) {
        mvtIssues.push('no seed_scenarios');
        mvtCertified = false;
      }

      if (mvtIssues.length === 0) {
        checks.push({
          check: 'mvt_complete',
          status: 'pass',
          message: 'MVT complete',
          details: `buyer_role, decision_owner, ${allowedSignals.length} signals, ${killRules.length} kill rules, scenarios`,
        });
      } else {
        checks.push({
          check: 'mvt_complete',
          status: 'fail',
          message: 'MVT incomplete',
          details: mvtIssues.join(', '),
        });
        overallEligible = false;
      }

      // Check 4: Signals resolvable
      if (allowedSignals.length > 0) {
        checks.push({
          check: 'signals_resolvable',
          status: 'pass',
          message: 'Signals resolvable',
          details: `${allowedSignals.length} signals configured`,
        });
      } else {
        checks.push({
          check: 'signals_resolvable',
          status: 'warning',
          message: 'No signals configured',
          details: 'Add allowed_signals to enable signal-based reasoning',
        });
      }

      // Check 5: Get personas under this sub-vertical
      const personas = await query<{ id: string; name: string; has_active_policy: boolean }>(
        `SELECT p.id, p.name,
           EXISTS(SELECT 1 FROM os_persona_policies pp WHERE pp.persona_id = p.id AND pp.status = 'ACTIVE') as has_active_policy
         FROM os_personas p
         WHERE p.sub_vertical_id = $1 AND p.is_active = true`,
        [entityId]
      );

      if (personas.length > 0) {
        const withPolicy = personas.filter((p) => p.has_active_policy);
        if (withPolicy.length === personas.length) {
          checks.push({
            check: 'persona_resolved',
            status: 'pass',
            message: 'All personas have active policies',
            details: `${personas.length} persona(s) with active policies`,
          });
        } else {
          checks.push({
            check: 'persona_resolved',
            status: 'warning',
            message: 'Some personas missing policies',
            details: `${withPolicy.length}/${personas.length} have active policies`,
          });
        }
      } else {
        checks.push({
          check: 'persona_resolved',
          status: 'warning',
          message: 'No personas defined',
          details: 'Create personas under this sub-vertical',
        });
      }

      // Check 6: Envelope buildable
      const envelopeBuildable = sv.is_active && sv.vertical_is_active && !!sv.buyer_role;
      if (envelopeBuildable) {
        checks.push({
          check: 'envelope_buildable',
          status: 'pass',
          message: 'Envelope buildable',
          details: 'Can construct runtime envelope for SIVA',
        });
      } else {
        checks.push({
          check: 'envelope_buildable',
          status: 'fail',
          message: 'Envelope not buildable',
          details: 'Missing required context for envelope construction',
        });
        overallEligible = false;
      }

      // Check 7: NBA ready (Next Best Action)
      if (allowedSignals.length > 0 && killRules.length > 0) {
        checks.push({
          check: 'nba_ready',
          status: 'pass',
          message: 'NBA ready',
          details: 'Can compute Next Best Action recommendations',
        });
      } else {
        checks.push({
          check: 'nba_ready',
          status: 'warning',
          message: 'NBA limited',
          details: 'Add signals and kill rules for full NBA capability',
        });
      }

      // Check 8: Replay eligible
      if (hasGoldenScenarios || hasKillScenarios) {
        checks.push({
          check: 'replay_eligible',
          status: 'pass',
          message: 'Replay eligible',
          details: `${seedScenarios.golden?.length || 0} golden, ${seedScenarios.kill?.length || 0} kill scenarios`,
        });
      } else {
        checks.push({
          check: 'replay_eligible',
          status: 'warning',
          message: 'No replay scenarios',
          details: 'Add seed_scenarios for deterministic replay testing',
        });
      }

    } else if (entityType === 'persona') {
      // Get persona with full context
      const persona = await queryOne<{
        id: string;
        key: string;
        name: string;
        sub_vertical_id: string;
        sv_key: string;
        sv_name: string;
        sv_is_active: boolean;
        vertical_key: string;
        vertical_name: string;
        vertical_is_active: boolean;
        is_active: boolean;
        mission: string | null;
        decision_lens: string | null;
      }>(
        `SELECT
           p.id, p.key, p.name, p.sub_vertical_id, p.is_active,
           p.mission, p.decision_lens,
           sv.key as sv_key, sv.name as sv_name, sv.is_active as sv_is_active,
           v.key as vertical_key, v.name as vertical_name, v.is_active as vertical_is_active
         FROM os_personas p
         JOIN os_sub_verticals sv ON sv.id = p.sub_vertical_id
         JOIN os_verticals v ON v.id = sv.vertical_id
         WHERE p.id = $1`,
        [entityId]
      );

      if (!persona) {
        return notFoundError('Persona');
      }

      entityName = persona.name;

      // Check 1: Vertical resolved
      if (persona.vertical_is_active) {
        checks.push({
          check: 'vertical_resolved',
          status: 'pass',
          message: 'Vertical resolved',
          details: `${persona.vertical_name} is active`,
        });
      } else {
        checks.push({
          check: 'vertical_resolved',
          status: 'fail',
          message: 'Vertical not resolved',
          details: `${persona.vertical_name} is inactive`,
        });
        overallEligible = false;
      }

      // Check 2: Sub-vertical resolved
      if (persona.sv_is_active) {
        checks.push({
          check: 'sub_vertical_resolved',
          status: 'pass',
          message: 'Sub-vertical resolved',
          details: `${persona.sv_name} is active`,
        });
      } else {
        checks.push({
          check: 'sub_vertical_resolved',
          status: 'fail',
          message: 'Sub-vertical not resolved',
          details: `${persona.sv_name} is inactive`,
        });
        overallEligible = false;
      }

      // Check 3: Persona resolved
      if (persona.is_active) {
        checks.push({
          check: 'persona_resolved',
          status: 'pass',
          message: 'Persona resolved',
          details: `${persona.name} (${persona.key}) is active`,
        });
      } else {
        checks.push({
          check: 'persona_resolved',
          status: 'fail',
          message: 'Persona not resolved',
          details: `${persona.name} is inactive`,
        });
        overallEligible = false;
      }

      // Check 4: Active policy bound
      const activePolicy = await queryOne<{
        id: string;
        policy_version: number;
        allowed_intents: string[];
        forbidden_outputs: string[];
        allowed_tools: string[];
      }>(
        `SELECT id, policy_version, allowed_intents, forbidden_outputs, allowed_tools
         FROM os_persona_policies
         WHERE persona_id = $1 AND status = 'ACTIVE'
         ORDER BY policy_version DESC
         LIMIT 1`,
        [entityId]
      );

      if (activePolicy) {
        checks.push({
          check: 'policy_active',
          status: 'pass',
          message: 'Active policy bound',
          details: `v${activePolicy.policy_version} - ${activePolicy.allowed_intents.length} intents, ${activePolicy.allowed_tools.length} tools`,
        });

        // Check policy completeness
        if (
          activePolicy.allowed_intents.length === 0 &&
          activePolicy.forbidden_outputs.length === 0
        ) {
          checks.push({
            check: 'policy_complete',
            status: 'warning',
            message: 'Policy is empty',
            details: 'Add allowed_intents and forbidden_outputs',
          });
          mvtCertified = false;
        }
      } else {
        checks.push({
          check: 'policy_active',
          status: 'fail',
          message: 'No active policy',
          details: 'Create and activate a policy for this persona',
        });
        overallEligible = false;
        mvtCertified = false;
      }

      // Check 5: Envelope buildable
      const envelopeBuildable = persona.is_active && persona.sv_is_active && !!activePolicy;
      if (envelopeBuildable) {
        checks.push({
          check: 'envelope_buildable',
          status: 'pass',
          message: 'Envelope buildable',
          details: 'Can construct runtime envelope for SIVA',
        });
      } else {
        checks.push({
          check: 'envelope_buildable',
          status: 'fail',
          message: 'Envelope not buildable',
          details: 'Missing required context for envelope construction',
        });
        overallEligible = false;
      }

      // Check 6: NBA ready
      if (activePolicy && activePolicy.allowed_intents.length > 0) {
        checks.push({
          check: 'nba_ready',
          status: 'pass',
          message: 'NBA ready',
          details: 'Can compute Next Best Action recommendations',
        });
      } else {
        checks.push({
          check: 'nba_ready',
          status: 'warning',
          message: 'NBA limited',
          details: 'Add allowed_intents for full NBA capability',
        });
      }
    }

    return Response.json({
      success: true,
      data: {
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        overall_eligible: overallEligible,
        mvt_certified: mvtCertified,
        checks,
        checked_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[RuntimeCheck] Error:', error);
    return serverError('Failed to check runtime readiness');
  }
}
