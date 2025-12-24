/**
 * MVT Versions API (S256)
 *
 * GET /api/superadmin/controlplane/sub-verticals/:id/mvt-versions
 *   - List all MVT versions for a sub-vertical
 *
 * POST /api/superadmin/controlplane/sub-verticals/:id/mvt-versions
 *   - Create a new MVT version (validates + auto-activates)
 */

import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';
import {
  logControlPlaneAudit,
  notFoundError,
  validationError,
  serverError,
} from '@/lib/db/controlplane-audit';

interface AllowedSignal {
  signal_key: string;
  entity_type: string;
  justification: string;
}

interface KillRule {
  rule: string;
  action: string;
  reason: string;
}

interface SeedScenario {
  scenario_id: string;
  entry_intent: string;
  buyer_type?: string;
  success_condition?: string;
  fail_condition?: string;
}

interface SeedScenarios {
  golden: SeedScenario[];
  kill: SeedScenario[];
}

interface MVTVersion {
  id: string;
  sub_vertical_id: string;
  mvt_version: number;
  buyer_role: string;
  decision_owner: string;
  allowed_signals: AllowedSignal[];
  kill_rules: KillRule[];
  seed_scenarios: SeedScenarios;
  mvt_valid: boolean;
  mvt_validated_at: string | null;
  status: string;
  created_at: string;
  created_by: string | null;
}

interface OSSubVertical {
  id: string;
  primary_entity_type: string;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// MVT Validation
function validateMVT(
  primary_entity_type: string,
  buyer_role: string | undefined,
  decision_owner: string | undefined,
  allowed_signals: AllowedSignal[] | undefined,
  kill_rules: KillRule[] | undefined,
  seed_scenarios: SeedScenarios | undefined
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!buyer_role || typeof buyer_role !== 'string' || buyer_role.trim() === '') {
    errors.push('buyer_role is required (ICP Truth Triad)');
  }

  if (!decision_owner || typeof decision_owner !== 'string' || decision_owner.trim() === '') {
    errors.push('decision_owner is required (ICP Truth Triad)');
  }

  if (!allowed_signals || !Array.isArray(allowed_signals) || allowed_signals.length < 1) {
    errors.push('At least 1 allowed_signal is required');
  } else {
    for (let i = 0; i < allowed_signals.length; i++) {
      const signal = allowed_signals[i];
      if (!signal.signal_key) errors.push(`allowed_signals[${i}].signal_key is required`);
      if (!signal.entity_type) errors.push(`allowed_signals[${i}].entity_type is required`);
      else if (signal.entity_type !== primary_entity_type) {
        errors.push(`allowed_signals[${i}].entity_type must match primary_entity_type (${primary_entity_type})`);
      }
      if (!signal.justification) errors.push(`allowed_signals[${i}].justification is required`);
    }
  }

  if (!kill_rules || !Array.isArray(kill_rules) || kill_rules.length < 2) {
    errors.push(`Minimum 2 kill_rules required (found: ${kill_rules?.length || 0})`);
  } else {
    for (let i = 0; i < kill_rules.length; i++) {
      const rule = kill_rules[i];
      if (!rule.rule) errors.push(`kill_rules[${i}].rule is required`);
      if (!rule.action) errors.push(`kill_rules[${i}].action is required`);
      if (!rule.reason) errors.push(`kill_rules[${i}].reason is required`);
    }
    const complianceKeywords = ['compliance', 'regulatory', 'legal', 'aml', 'kyc', 'sanction'];
    const hasComplianceRule = kill_rules.some(rule =>
      complianceKeywords.some(keyword => rule.reason?.toLowerCase().includes(keyword))
    );
    if (!hasComplianceRule) {
      errors.push('At least 1 compliance/regulatory kill_rule required');
    }
  }

  if (!seed_scenarios || typeof seed_scenarios !== 'object') {
    errors.push('seed_scenarios is required (with golden and kill arrays)');
  } else {
    if (!seed_scenarios.golden || !Array.isArray(seed_scenarios.golden) || seed_scenarios.golden.length < 2) {
      errors.push(`Minimum 2 golden seed_scenarios required (found: ${seed_scenarios.golden?.length || 0})`);
    }
    if (!seed_scenarios.kill || !Array.isArray(seed_scenarios.kill) || seed_scenarios.kill.length < 2) {
      errors.push(`Minimum 2 kill seed_scenarios required (found: ${seed_scenarios.kill?.length || 0})`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * GET /api/superadmin/controlplane/sub-verticals/:id/mvt-versions
 * List all MVT versions for a sub-vertical
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Check sub-vertical exists
    const subVertical = await queryOne<OSSubVertical>(
      'SELECT id, primary_entity_type FROM os_sub_verticals WHERE id = $1',
      [id]
    );

    if (!subVertical) {
      return notFoundError('Sub-Vertical');
    }

    // Get all versions
    const versions = await query<MVTVersion>(
      `SELECT id, sub_vertical_id, mvt_version, buyer_role, decision_owner,
              allowed_signals, kill_rules, seed_scenarios,
              mvt_valid, mvt_validated_at, status, created_at, created_by
       FROM os_sub_vertical_mvt_versions
       WHERE sub_vertical_id = $1
       ORDER BY mvt_version DESC`,
      [id]
    );

    return Response.json({
      success: true,
      sub_vertical_id: id,
      versions,
      count: versions.length,
    });
  } catch (error) {
    console.error('[MVT Versions GET] Error:', error);
    return serverError('Failed to fetch MVT versions');
  }
}

/**
 * POST /api/superadmin/controlplane/sub-verticals/:id/mvt-versions
 * Create a new MVT version
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const actorUser = sessionResult.session?.email || 'unknown';

  try {
    const body = await request.json();
    const {
      buyer_role,
      decision_owner,
      allowed_signals,
      kill_rules,
      seed_scenarios,
    } = body;

    // Check sub-vertical exists
    const subVertical = await queryOne<OSSubVertical>(
      'SELECT id, primary_entity_type FROM os_sub_verticals WHERE id = $1',
      [id]
    );

    if (!subVertical) {
      return notFoundError('Sub-Vertical');
    }

    // Validate MVT
    const mvtValidation = validateMVT(
      subVertical.primary_entity_type,
      buyer_role,
      decision_owner,
      allowed_signals,
      kill_rules,
      seed_scenarios
    );

    if (!mvtValidation.valid) {
      await logControlPlaneAudit({
        actorUser,
        action: 'create_mvt_version',
        targetType: 'mvt_version',
        targetId: id,
        requestJson: body,
        success: false,
        errorMessage: `MVT validation failed: ${mvtValidation.errors.join(', ')}`,
      });

      return Response.json(
        {
          success: false,
          error: 'MVT_INCOMPLETE',
          message: 'Minimum Viable Truth validation failed',
          mvt_errors: mvtValidation.errors,
        },
        { status: 400 }
      );
    }

    // Create new version via DB function
    let newVersion: MVTVersion | null = null;
    try {
      newVersion = await queryOne<MVTVersion>(
        `SELECT * FROM create_mvt_version($1, $2, $3, $4, $5, $6, $7)`,
        [
          id,
          buyer_role,
          decision_owner,
          JSON.stringify(allowed_signals),
          JSON.stringify(kill_rules),
          JSON.stringify(seed_scenarios),
          actorUser,
        ]
      );
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error';
      if (errorMessage.includes('MVT_CONSTRAINT_VIOLATION')) {
        await logControlPlaneAudit({
          actorUser,
          action: 'create_mvt_version',
          targetType: 'mvt_version',
          targetId: id,
          requestJson: body,
          success: false,
          errorMessage: errorMessage,
        });
        return Response.json(
          {
            success: false,
            error: 'MVT_CONSTRAINT_VIOLATION',
            message: errorMessage,
          },
          { status: 400 }
        );
      }
      throw dbError;
    }

    // Log success
    await logControlPlaneAudit({
      actorUser,
      action: 'create_mvt_version',
      targetType: 'mvt_version',
      targetId: newVersion?.id || id,
      requestJson: body,
      resultJson: newVersion as unknown as Record<string, unknown>,
      success: true,
    });

    return Response.json({
      success: true,
      version: newVersion,
      mvt_version: newVersion?.mvt_version,
      message: `MVT version ${newVersion?.mvt_version} created and activated`,
    });
  } catch (error) {
    console.error('[MVT Versions POST] Error:', error);
    return serverError('Failed to create MVT version');
  }
}
