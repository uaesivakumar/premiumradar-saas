/**
 * S338-F2: Sub-Vertical Audit API
 *
 * GET /api/superadmin/controlplane/sub-verticals/:id/audit
 * Returns full audit data for a sub-vertical including MVT status, ICP, kill rules, signals.
 */

import { NextRequest } from 'next/server';
import { queryOne } from '@/lib/db/client';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';
import { serverError, notFoundError } from '@/lib/db/controlplane-audit';

interface SubVerticalAuditData {
  id: string;
  key: string;
  name: string;
  vertical_id: string;
  vertical_key: string;
  vertical_name: string;
  default_agent: string;
  primary_entity_type: string | null;
  related_entity_types: string[] | null;
  buyer_role: string | null;
  decision_owner: string | null;
  allowed_signals: unknown[] | null;
  kill_rules: unknown[] | null;
  seed_scenarios: unknown | null;
  mvt_version: number | null;
  mvt_valid: boolean | null;
  mvt_validated_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface MVTStatus {
  valid: boolean;
  checks: {
    has_buyer_role: boolean;
    has_decision_owner: boolean;
    has_signals: boolean;
    has_kill_rules: boolean;
    has_compliance_rule: boolean;
    has_seed_scenarios: boolean;
  };
  missing: string[];
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/superadmin/controlplane/sub-verticals/:id/audit
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!id || !uuidRegex.test(id)) {
    console.error('[ControlPlane:SubVertical Audit] Invalid UUID format:', id);
    return Response.json(
      { success: false, error: 'Invalid sub-vertical ID format' },
      { status: 400 }
    );
  }

  try {
    // Get sub-vertical with vertical context
    // Using LEFT JOIN to handle cases where vertical might be missing
    const subVertical = await queryOne<SubVerticalAuditData>(
      `SELECT
         sv.id, sv.key, sv.name, sv.vertical_id, sv.default_agent,
         sv.primary_entity_type, sv.related_entity_types,
         sv.buyer_role, sv.decision_owner,
         sv.allowed_signals, sv.kill_rules, sv.seed_scenarios,
         sv.mvt_version, sv.mvt_valid, sv.mvt_validated_at,
         sv.is_active, sv.created_at, sv.updated_at,
         COALESCE(v.key, 'unknown') as vertical_key,
         COALESCE(v.name, 'Unknown Vertical') as vertical_name
       FROM os_sub_verticals sv
       LEFT JOIN os_verticals v ON v.id = sv.vertical_id
       WHERE sv.id = $1`,
      [id]
    );

    if (!subVertical) {
      console.log('[ControlPlane:SubVertical Audit] Sub-vertical not found:', id);
      return notFoundError('Sub-Vertical');
    }

    // Calculate MVT status with defensive null handling
    const allowedSignals = Array.isArray(subVertical.allowed_signals) ? subVertical.allowed_signals : [];
    const killRules = Array.isArray(subVertical.kill_rules) ? subVertical.kill_rules : [];
    const seedScenarios = (subVertical.seed_scenarios && typeof subVertical.seed_scenarios === 'object')
      ? subVertical.seed_scenarios as { golden?: unknown[]; kill?: unknown[] }
      : { golden: [], kill: [] };

    // Check for compliance rule with safe type handling
    let hasComplianceRule = false;
    try {
      hasComplianceRule = killRules.some((r: unknown) => {
        if (r && typeof r === 'object' && 'rule' in r) {
          const rule = (r as { rule?: string }).rule;
          return rule?.toLowerCase().includes('compliance') || rule?.toLowerCase().includes('gdpr');
        }
        return false;
      });
    } catch {
      console.warn('[ControlPlane:SubVertical Audit] Error checking compliance rules');
    }

    const mvtChecks = {
      has_buyer_role: !!subVertical.buyer_role,
      has_decision_owner: !!subVertical.decision_owner,
      has_signals: Array.isArray(allowedSignals) && allowedSignals.length > 0,
      has_kill_rules: Array.isArray(killRules) && killRules.length > 0,
      has_compliance_rule: hasComplianceRule,
      has_seed_scenarios: !!(seedScenarios?.golden?.length || seedScenarios?.kill?.length),
    };

    const missing: string[] = [];
    if (!mvtChecks.has_buyer_role) missing.push('buyer_role');
    if (!mvtChecks.has_decision_owner) missing.push('decision_owner');
    if (!mvtChecks.has_signals) missing.push('allowed_signals');
    if (!mvtChecks.has_kill_rules) missing.push('kill_rules');
    if (!mvtChecks.has_compliance_rule) missing.push('compliance_rule');
    if (!mvtChecks.has_seed_scenarios) missing.push('seed_scenarios');

    const mvtStatus: MVTStatus = {
      valid: missing.length === 0,
      checks: mvtChecks,
      missing,
    };

    return Response.json({
      success: true,
      data: {
        sub_vertical: subVertical,
        mvt_status: mvtStatus,
      },
    });
  } catch (error) {
    console.error('[ControlPlane:SubVertical Audit] Error for ID:', id);
    console.error('[ControlPlane:SubVertical Audit] Error details:', error);

    // Return more specific error message for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      {
        success: false,
        error: 'Failed to fetch sub-vertical audit data',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
