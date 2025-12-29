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
    // Using COALESCE for MVT columns that might not exist yet (migration pending)
    const subVertical = await queryOne<SubVerticalAuditData>(
      `SELECT
         sv.id, sv.key, sv.name, sv.vertical_id, sv.default_agent,
         sv.primary_entity_type, sv.related_entity_types,
         sv.is_active, sv.created_at, sv.updated_at,
         COALESCE(v.key, 'unknown') as vertical_key,
         COALESCE(v.name, 'Unknown Vertical') as vertical_name
       FROM os_sub_verticals sv
       LEFT JOIN os_verticals v ON v.id = sv.vertical_id
       WHERE sv.id = $1`,
      [id]
    );

    // Try to get MVT columns separately (they might not exist if migration not run)
    interface MVTColumns {
      buyer_role: string | null;
      decision_owner: string | null;
      allowed_signals: unknown[] | null;
      kill_rules: unknown[] | null;
      seed_scenarios: unknown | null;
      mvt_version: number | null;
      mvt_valid: boolean | null;
      mvt_validated_at: string | null;
    }
    let mvtData: MVTColumns | null = null;

    try {
      mvtData = await queryOne<MVTColumns>(
        `SELECT
           buyer_role, decision_owner, allowed_signals, kill_rules,
           seed_scenarios, mvt_version, mvt_valid, mvt_validated_at
         FROM os_sub_verticals WHERE id = $1`,
        [id]
      );
    } catch (mvtError) {
      // MVT columns don't exist yet - migration not applied
      console.warn('[ControlPlane:SubVertical Audit] MVT columns not available:', mvtError instanceof Error ? mvtError.message : 'unknown');
    }

    // Merge MVT data if available
    const fullSubVertical: SubVerticalAuditData = {
      ...subVertical!,
      buyer_role: mvtData?.buyer_role || null,
      decision_owner: mvtData?.decision_owner || null,
      allowed_signals: mvtData?.allowed_signals || null,
      kill_rules: mvtData?.kill_rules || null,
      seed_scenarios: mvtData?.seed_scenarios || null,
      mvt_version: mvtData?.mvt_version || null,
      mvt_valid: mvtData?.mvt_valid || null,
      mvt_validated_at: mvtData?.mvt_validated_at || null,
    };

    if (!subVertical) {
      console.log('[ControlPlane:SubVertical Audit] Sub-vertical not found:', id);
      return notFoundError('Sub-Vertical');
    }

    // Calculate MVT status with defensive null handling
    const allowedSignals = Array.isArray(fullSubVertical.allowed_signals) ? fullSubVertical.allowed_signals : [];
    const killRules = Array.isArray(fullSubVertical.kill_rules) ? fullSubVertical.kill_rules : [];
    const seedScenarios = (fullSubVertical.seed_scenarios && typeof fullSubVertical.seed_scenarios === 'object')
      ? fullSubVertical.seed_scenarios as { golden?: unknown[]; kill?: unknown[] }
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
      has_buyer_role: !!fullSubVertical.buyer_role,
      has_decision_owner: !!fullSubVertical.decision_owner,
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
        sub_vertical: fullSubVertical,
        mvt_status: mvtStatus,
      },
    });
  } catch (error) {
    console.error('[ControlPlane:SubVertical Audit] Error for ID:', id);
    console.error('[ControlPlane:SubVertical Audit] Error details:', error);
    console.error('[ControlPlane:SubVertical Audit] Stack:', error instanceof Error ? error.stack : 'N/A');

    // Return error details for debugging (safe for production - no sensitive data)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = error instanceof Error && 'code' in error ? (error as unknown as { code: string }).code : undefined;

    return Response.json(
      {
        success: false,
        error: 'Failed to fetch sub-vertical audit data',
        details: errorMessage,
        code: errorCode
      },
      { status: 500 }
    );
  }
}
