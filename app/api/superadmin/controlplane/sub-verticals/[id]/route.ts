/**
 * OS Sub-Vertical by ID API
 *
 * GET /api/superadmin/sub-verticals/:id - Get single sub-vertical with MVT status
 * PUT /api/superadmin/sub-verticals/:id - Update sub-vertical with full MVT support
 *
 * v2.0 Fields:
 * - primary_entity_type: IMMUTABLE forever after creation
 * - related_entity_types: mutable array
 *
 * S255 v2 MVT Fields (via versioning):
 * - buyer_role: ICP Truth Triad
 * - decision_owner: ICP Truth Triad
 * - allowed_signals: Signal allow-list
 * - kill_rules: Kill rules
 * - seed_scenarios: Sales-Bench seed scenarios
 *
 * VERSIONING: MVT edits create new version. Only one ACTIVE per sub-vertical.
 */

import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';
import {
  logControlPlaneAudit,
  validateKey,
  conflictError,
  validationError,
  notFoundError,
  serverError,
} from '@/lib/db/controlplane-audit';

// MVT Types
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
}

interface OSSubVertical {
  id: string;
  vertical_id: string;
  key: string;
  name: string;
  default_agent: string;
  primary_entity_type: string;
  related_entity_types: string[];
  active_mvt_version_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // From active MVT version (joined)
  buyer_role?: string | null;
  decision_owner?: string | null;
  allowed_signals?: unknown;
  kill_rules?: unknown;
  seed_scenarios?: unknown;
  mvt_version?: number;
  mvt_valid?: boolean;
  mvt_validated_at?: string | null;
  runtime_eligible?: boolean;
  eligibility_blocker?: string | null;
}

// Valid entity types (v2.0)
const VALID_ENTITY_TYPES = ['deal', 'company', 'individual'] as const;

// MVT Validation (same as POST handler)
interface MVTValidationResult {
  valid: boolean;
  errors: string[];
}

function validateMVT(
  primary_entity_type: string,
  buyer_role: string | undefined,
  decision_owner: string | undefined,
  allowed_signals: AllowedSignal[] | undefined,
  kill_rules: KillRule[] | undefined,
  seed_scenarios: SeedScenarios | undefined
): MVTValidationResult {
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

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/superadmin/sub-verticals/:id
 * Returns sub-vertical with active MVT version and runtime eligibility
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Query sub-vertical with active MVT version
    const subVertical = await queryOne<OSSubVertical>(
      `SELECT sv.id, sv.vertical_id, sv.key, sv.name, sv.default_agent,
              sv.primary_entity_type, sv.related_entity_types,
              sv.active_mvt_version_id,
              sv.is_active, sv.created_at, sv.updated_at,
              v.key as vertical_key, v.name as vertical_name,
              v.is_active as vertical_is_active,
              mv.buyer_role, mv.decision_owner,
              mv.allowed_signals, mv.kill_rules, mv.seed_scenarios,
              mv.mvt_version, mv.mvt_valid, mv.mvt_validated_at,
              mv.status as mvt_status
       FROM os_sub_verticals sv
       JOIN os_verticals v ON sv.vertical_id = v.id
       LEFT JOIN os_sub_vertical_mvt_versions mv ON sv.active_mvt_version_id = mv.id
       WHERE sv.id = $1`,
      [id]
    );

    if (!subVertical) {
      return notFoundError('Sub-Vertical');
    }

    // Get all MVT versions for this sub-vertical
    const versions = await query<MVTVersion>(
      `SELECT id, sub_vertical_id, mvt_version, buyer_role, decision_owner,
              mvt_valid, mvt_validated_at, status, created_at
       FROM os_sub_vertical_mvt_versions
       WHERE sub_vertical_id = $1
       ORDER BY mvt_version DESC`,
      [id]
    );

    // Check runtime eligibility
    const eligibilityCheck = await queryOne<{ runtime_eligible: boolean; eligibility_blocker: string | null }>(
      `SELECT
         (
           sv.is_active = true AND
           mv.mvt_valid = true AND
           mv.status = 'ACTIVE' AND
           v.is_active = true AND
           EXISTS (
             SELECT 1 FROM os_personas p
             JOIN os_persona_policies pp ON pp.persona_id = p.id
             WHERE p.sub_vertical_id = sv.id
               AND p.is_active = true
               AND pp.status = 'ACTIVE'
           )
         ) as runtime_eligible,
         CASE
           WHEN sv.is_active = false THEN 'SUB_VERTICAL_INACTIVE'
           WHEN sv.active_mvt_version_id IS NULL THEN 'NO_MVT_VERSION'
           WHEN mv.mvt_valid = false THEN 'MVT_INVALID'
           WHEN mv.status != 'ACTIVE' THEN 'MVT_NOT_ACTIVE'
           WHEN v.is_active = false THEN 'VERTICAL_INACTIVE'
           WHEN NOT EXISTS (
             SELECT 1 FROM os_personas p
             JOIN os_persona_policies pp ON pp.persona_id = p.id
             WHERE p.sub_vertical_id = sv.id
               AND p.is_active = true
               AND pp.status = 'ACTIVE'
           ) THEN 'NO_ACTIVE_PERSONA_POLICY'
           ELSE NULL
         END as eligibility_blocker
       FROM os_sub_verticals sv
       JOIN os_verticals v ON sv.vertical_id = v.id
       LEFT JOIN os_sub_vertical_mvt_versions mv ON sv.active_mvt_version_id = mv.id
       WHERE sv.id = $1`,
      [id]
    );

    return Response.json({
      success: true,
      data: {
        ...subVertical,
        runtime_eligible: eligibilityCheck?.runtime_eligible || false,
        eligibility_blocker: eligibilityCheck?.eligibility_blocker || null,
        mvt_versions: versions,
        mvt_version_count: versions.length,
      },
    });
  } catch (error) {
    console.error('[SubVertical GET] Error:', error);
    return serverError('Failed to fetch sub-vertical');
  }
}

/**
 * PUT /api/superadmin/sub-verticals/:id
 *
 * Supports two update modes:
 * 1. Basic fields only (key, name, default_agent, is_active, related_entity_types)
 * 2. MVT fields (buyer_role, decision_owner, allowed_signals, kill_rules, seed_scenarios)
 *    → Creates new MVT version, validates, and updates active_mvt_version_id
 *
 * IMMUTABLE: primary_entity_type cannot be changed after creation
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const actorUser = sessionResult.session?.email || 'unknown';

  try {
    const body = await request.json();
    const {
      // Basic fields
      key,
      name,
      default_agent,
      is_active,
      primary_entity_type,
      related_entity_types,
      // MVT fields (v2.0)
      buyer_role,
      decision_owner,
      allowed_signals,
      kill_rules,
      seed_scenarios,
    } = body;

    // Check sub-vertical exists with current MVT version
    const existing = await queryOne<OSSubVertical & { current_buyer_role?: string; current_decision_owner?: string }>(
      `SELECT sv.id, sv.vertical_id, sv.key, sv.primary_entity_type, sv.active_mvt_version_id,
              mv.buyer_role as current_buyer_role, mv.decision_owner as current_decision_owner,
              mv.allowed_signals as current_allowed_signals, mv.kill_rules as current_kill_rules,
              mv.seed_scenarios as current_seed_scenarios
       FROM os_sub_verticals sv
       LEFT JOIN os_sub_vertical_mvt_versions mv ON sv.active_mvt_version_id = mv.id
       WHERE sv.id = $1`,
      [id]
    );

    if (!existing) {
      await logControlPlaneAudit({
        actorUser,
        action: 'update_sub_vertical',
        targetType: 'sub_vertical',
        targetId: id,
        requestJson: body,
        success: false,
        errorMessage: 'Not found',
      });
      return notFoundError('Sub-Vertical');
    }

    // ========================================
    // IMMUTABLE FIELD ENFORCEMENT (v2.0)
    // ========================================
    if (primary_entity_type !== undefined && primary_entity_type !== existing.primary_entity_type) {
      await logControlPlaneAudit({
        actorUser,
        action: 'update_sub_vertical',
        targetType: 'sub_vertical',
        targetId: id,
        requestJson: body,
        success: false,
        errorMessage: 'Attempted to modify immutable field: primary_entity_type',
      });
      return Response.json(
        {
          success: false,
          error: 'IMMUTABLE_FIELD',
          field: 'primary_entity_type',
          message: 'primary_entity_type is immutable and cannot be changed after creation.',
        },
        { status: 400 }
      );
    }

    // ========================================
    // MVT UPDATE PATH (v2.0)
    // ========================================
    // Check what MVT fields are being updated
    const hasICPOnlyFields = (buyer_role !== undefined || decision_owner !== undefined) &&
      allowed_signals === undefined &&
      kill_rules === undefined &&
      seed_scenarios === undefined;

    const hasMVTFields =
      buyer_role !== undefined ||
      decision_owner !== undefined ||
      allowed_signals !== undefined ||
      kill_rules !== undefined ||
      seed_scenarios !== undefined;

    let newMVTVersion: MVTVersion | null = null;

    // ========================================
    // ICP-ONLY UPDATE PATH (buyer_role, decision_owner)
    // Allow saving ICP fields without full MVT validation
    // ========================================
    if (hasICPOnlyFields) {
      // Update ICP fields directly on sub_verticals table
      const icpUpdates: string[] = [];
      const icpValues: unknown[] = [];
      let icpParamIndex = 1;

      if (buyer_role !== undefined) {
        icpUpdates.push(`buyer_role = $${icpParamIndex++}`);
        icpValues.push(buyer_role || null);
      }
      if (decision_owner !== undefined) {
        icpUpdates.push(`decision_owner = $${icpParamIndex++}`);
        icpValues.push(decision_owner || null);
      }

      if (icpUpdates.length > 0) {
        icpUpdates.push('updated_at = NOW()');
        icpValues.push(id);

        await queryOne(
          `UPDATE os_sub_verticals
           SET ${icpUpdates.join(', ')}
           WHERE id = $${icpParamIndex}`,
          icpValues
        );

        await logControlPlaneAudit({
          actorUser,
          action: 'update_sub_vertical_icp',
          targetType: 'sub_vertical',
          targetId: id,
          requestJson: body,
          success: true,
        });

        // Fetch updated result
        const result = await queryOne<OSSubVertical>(
          `SELECT id, vertical_id, key, name, default_agent, primary_entity_type,
                  related_entity_types, active_mvt_version_id, is_active,
                  buyer_role, decision_owner, created_at, updated_at
           FROM os_sub_verticals WHERE id = $1`,
          [id]
        );

        return Response.json({
          success: true,
          data: result,
          message: 'ICP fields updated. Complete MVT configuration to enable runtime.',
        });
      }
    }

    // ========================================
    // FULL MVT UPDATE PATH (requires all fields)
    // ========================================
    if (hasMVTFields && !hasICPOnlyFields) {
      // Merge with existing MVT values (partial updates allowed)
      const mergedBuyerRole = buyer_role ?? existing.current_buyer_role ?? '';
      const mergedDecisionOwner = decision_owner ?? existing.current_decision_owner ?? '';
      const mergedAllowedSignals = allowed_signals ?? (existing.allowed_signals as AllowedSignal[]) ?? [];
      const mergedKillRules = kill_rules ?? (existing.kill_rules as KillRule[]) ?? [];
      const mergedSeedScenarios = seed_scenarios ?? (existing.seed_scenarios as SeedScenarios) ?? { golden: [], kill: [] };

      // Validate full MVT
      const mvtValidation = validateMVT(
        existing.primary_entity_type,
        mergedBuyerRole,
        mergedDecisionOwner,
        mergedAllowedSignals,
        mergedKillRules,
        mergedSeedScenarios
      );

      if (!mvtValidation.valid) {
        await logControlPlaneAudit({
          actorUser,
          action: 'update_sub_vertical_mvt',
          targetType: 'sub_vertical',
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

      // Create new MVT version via DB function
      // This function: deprecates old version, creates new one, updates pointer
      try {
        newMVTVersion = await queryOne<MVTVersion>(
          `SELECT * FROM create_mvt_version($1, $2, $3, $4, $5, $6, $7)`,
          [
            id, // sub_vertical_id
            mergedBuyerRole,
            mergedDecisionOwner,
            JSON.stringify(mergedAllowedSignals),
            JSON.stringify(mergedKillRules),
            JSON.stringify(mergedSeedScenarios),
            actorUser, // created_by
          ]
        );
      } catch (dbError) {
        // Handle DB-level constraint violations
        const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error';
        if (errorMessage.includes('MVT_CONSTRAINT_VIOLATION')) {
          await logControlPlaneAudit({
            actorUser,
            action: 'update_sub_vertical_mvt',
            targetType: 'sub_vertical',
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

      // Log MVT version creation
      await logControlPlaneAudit({
        actorUser,
        action: 'create_mvt_version',
        targetType: 'mvt_version',
        targetId: newMVTVersion?.id || id,
        requestJson: body,
        resultJson: newMVTVersion as unknown as Record<string, unknown>,
        success: true,
      });
    }

    // ========================================
    // BASIC FIELDS UPDATE PATH
    // ========================================
    // Validation: key (if provided)
    if (key !== undefined) {
      const keyValidation = validateKey(key);
      if (!keyValidation.valid) {
        await logControlPlaneAudit({
          actorUser,
          action: 'update_sub_vertical',
          targetType: 'sub_vertical',
          targetId: id,
          requestJson: body,
          success: false,
          errorMessage: keyValidation.error,
        });
        return validationError('key', keyValidation.error);
      }

      // Check for duplicate key within same vertical (if changing)
      if (key !== existing.key) {
        const duplicate = await query<{ id: string }>(
          'SELECT id FROM os_sub_verticals WHERE vertical_id = $1 AND key = $2 AND id != $3',
          [existing.vertical_id, key, id]
        );
        if (duplicate.length > 0) {
          await logControlPlaneAudit({
            actorUser,
            action: 'update_sub_vertical',
            targetType: 'sub_vertical',
            targetId: id,
            requestJson: body,
            success: false,
            errorMessage: 'Duplicate key in vertical',
          });
          return conflictError('key');
        }
      }
    }

    // Validation: related_entity_types (v2.0 - mutable array)
    if (related_entity_types !== undefined) {
      if (!Array.isArray(related_entity_types)) {
        await logControlPlaneAudit({
          actorUser,
          action: 'update_sub_vertical',
          targetType: 'sub_vertical',
          targetId: id,
          requestJson: body,
          success: false,
          errorMessage: 'related_entity_types must be an array',
        });
        return validationError('related_entity_types', 'Must be an array of entity types');
      }
      // Validate each entry
      for (const entityType of related_entity_types) {
        if (!VALID_ENTITY_TYPES.includes(entityType)) {
          await logControlPlaneAudit({
            actorUser,
            action: 'update_sub_vertical',
            targetType: 'sub_vertical',
            targetId: id,
            requestJson: body,
            success: false,
            errorMessage: `Invalid related_entity_type: ${entityType}`,
          });
          return validationError('related_entity_types', `Invalid type: ${entityType}. Must be one of: deal, company, individual`);
        }
      }
    }

    // Build update query for basic fields
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (key !== undefined) {
      updates.push(`key = $${paramIndex++}`);
      values.push(key);
    }
    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (default_agent !== undefined) {
      updates.push(`default_agent = $${paramIndex++}`);
      values.push(default_agent);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }
    // v2.0: related_entity_types is mutable
    if (related_entity_types !== undefined) {
      updates.push(`related_entity_types = $${paramIndex++}`);
      values.push(related_entity_types);
    }

    // Always update updated_at
    updates.push('updated_at = NOW()');

    // If no basic fields and no MVT fields, nothing to do
    if (updates.length === 1 && !hasMVTFields) {
      // Only updated_at was added, no real changes
      return validationError('body', 'No fields to update');
    }

    // Execute basic fields update
    let result: OSSubVertical | null = null;
    if (updates.length > 1 || !hasMVTFields) {
      values.push(id);
      result = await queryOne<OSSubVertical>(
        `UPDATE os_sub_verticals
         SET ${updates.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING id, vertical_id, key, name, default_agent, primary_entity_type, related_entity_types, active_mvt_version_id, is_active, created_at, updated_at`,
        values
      );
    }

    // If only MVT was updated, fetch current state
    if (!result) {
      result = await queryOne<OSSubVertical>(
        `SELECT id, vertical_id, key, name, default_agent, primary_entity_type, related_entity_types, active_mvt_version_id, is_active, created_at, updated_at
         FROM os_sub_verticals WHERE id = $1`,
        [id]
      );
    }

    // Audit log success
    await logControlPlaneAudit({
      actorUser,
      action: 'update_sub_vertical',
      targetType: 'sub_vertical',
      targetId: id,
      requestJson: body,
      resultJson: {
        ...result,
        mvt_version_created: newMVTVersion ? true : false,
        new_mvt_version: newMVTVersion?.mvt_version,
      } as unknown as Record<string, unknown>,
      success: true,
    });

    // Build response with MVT info
    const response: Record<string, unknown> = {
      success: true,
      data: result,
    };

    if (newMVTVersion) {
      response.mvt_version_created = true;
      response.new_mvt_version = {
        id: newMVTVersion.id,
        mvt_version: newMVTVersion.mvt_version,
        status: newMVTVersion.status,
        mvt_valid: newMVTVersion.mvt_valid,
        mvt_validated_at: newMVTVersion.mvt_validated_at,
      };
    }

    return Response.json(response);
  } catch (error) {
    console.error('[SubVertical PUT] Error:', error);
    return serverError('Failed to update sub-vertical');
  }
}

/**
 * PATCH /api/superadmin/controlplane/sub-verticals/[id]
 * Alias for PUT - supports partial updates
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return PUT(request, { params });
}
