/**
 * OS Sub-Verticals CRUD API
 *
 * GET  /api/superadmin/sub-verticals - List all sub-verticals
 * POST /api/superadmin/sub-verticals - Create new sub-vertical
 *
 * Contract Rules:
 * - key: required, lowercase snake_case
 * - vertical_id: required, must exist
 * - default_agent: ALWAYS SIVA (no user selection - defaults to 'SIVA')
 * - primary_entity_type: required (v2.0), one of: deal, company, individual
 * - related_entity_types: optional array (v2.0)
 * - All writes logged to os_controlplane_audit
 *
 * ARCHITECTURAL NOTE (S278):
 * - Agent is ALWAYS SIVA - there is ONE interpreter
 * - All behavior differentiation comes from: Vertical → Sub-Vertical → Persona → Policy → Envelope
 * - "SIVA Banking", "SIVA Insurance" variants are legacy debt, NOT features
 * - No agent selector in UI - default_agent is auto-set to 'SIVA'
 *
 * v2.0 MIGRATION:
 * - primary_entity_type is now the source of truth (moved from vertical level)
 * - Entity type determines discovery scope for SIVA
 *
 * S255 REVISED: MVT SOFT GATE (creation allowed, runtime blocked)
 * - buyer_role: optional at creation (fill via HARDEN MODE)
 * - decision_owner: optional at creation (fill via HARDEN MODE)
 * - allowed_signals: optional at creation (fill via HARDEN MODE)
 * - kill_rules: optional at creation (fill via HARDEN MODE)
 * - seed_scenarios: optional at creation (fill via HARDEN MODE)
 * - mvt_valid = false if any MVT field incomplete
 * - runtime_eligible = false until MVT + Persona + Policy resolved
 * - HARDEN MODE: /superadmin/controlplane/harden/sub-vertical/:id
 */

import { NextRequest } from 'next/server';
import { query, insert, queryOne } from '@/lib/db/client';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';
import {
  logControlPlaneAudit,
  validateKey,
  conflictError,
  validationError,
  notFoundError,
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

interface OSSubVertical {
  id: string;
  vertical_id: string;
  key: string;
  name: string;
  default_agent: string;
  primary_entity_type: string;       // v2.0: Entity type now at sub-vertical level
  related_entity_types: string[];    // v2.0: Additional context entities
  buyer_role: string;                // MVT v1: ICP Truth Triad
  decision_owner: string;            // MVT v1: ICP Truth Triad
  allowed_signals: AllowedSignal[];  // MVT v1: Signal allow-list
  kill_rules: KillRule[];            // MVT v1: Kill rules
  seed_scenarios: SeedScenarios;     // MVT v1: Sales-Bench scenarios
  mvt_version: number;               // MVT v1: Schema version
  mvt_valid: boolean;                // MVT v1: Validation status
  mvt_validated_at: string | null;   // MVT v1: Validation timestamp
  is_active: boolean;
  created_at: string;
  updated_at: string;
  vertical_key?: string;
  vertical_name?: string;
}

// Valid entity types (v2.0)
const VALID_ENTITY_TYPES = ['deal', 'company', 'individual'] as const;

// MVT Validation helpers
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

  // 1. ICP Truth Triad validation
  if (!buyer_role || typeof buyer_role !== 'string' || buyer_role.trim() === '') {
    errors.push('buyer_role is required (ICP Truth Triad)');
  }

  if (!decision_owner || typeof decision_owner !== 'string' || decision_owner.trim() === '') {
    errors.push('decision_owner is required (ICP Truth Triad)');
  }

  // 2. Signal Allow-List validation
  if (!allowed_signals || !Array.isArray(allowed_signals) || allowed_signals.length < 1) {
    errors.push('At least 1 allowed_signal is required');
  } else {
    // Validate each signal
    for (let i = 0; i < allowed_signals.length; i++) {
      const signal = allowed_signals[i];
      if (!signal.signal_key) {
        errors.push(`allowed_signals[${i}].signal_key is required`);
      }
      if (!signal.entity_type) {
        errors.push(`allowed_signals[${i}].entity_type is required`);
      } else if (signal.entity_type !== primary_entity_type) {
        errors.push(`allowed_signals[${i}].entity_type must match primary_entity_type (${primary_entity_type})`);
      }
      if (!signal.justification) {
        errors.push(`allowed_signals[${i}].justification is required`);
      }
    }
  }

  // 3. Kill Rules validation
  if (!kill_rules || !Array.isArray(kill_rules) || kill_rules.length < 2) {
    errors.push(`Minimum 2 kill_rules required (found: ${kill_rules?.length || 0})`);
  } else {
    // Validate each rule
    for (let i = 0; i < kill_rules.length; i++) {
      const rule = kill_rules[i];
      if (!rule.rule) {
        errors.push(`kill_rules[${i}].rule is required`);
      }
      if (!rule.action) {
        errors.push(`kill_rules[${i}].action is required`);
      }
      if (!rule.reason) {
        errors.push(`kill_rules[${i}].reason is required`);
      }
    }

    // Check for at least 1 compliance/regulatory rule
    const complianceKeywords = ['compliance', 'regulatory', 'legal', 'aml', 'kyc', 'sanction'];
    const hasComplianceRule = kill_rules.some(rule =>
      complianceKeywords.some(keyword =>
        rule.reason?.toLowerCase().includes(keyword)
      )
    );
    if (!hasComplianceRule) {
      errors.push('At least 1 compliance/regulatory kill_rule required (reason must contain: compliance, regulatory, legal, aml, kyc, or sanction)');
    }
  }

  // 4. Sales-Bench Seed Scenarios validation
  if (!seed_scenarios || typeof seed_scenarios !== 'object') {
    errors.push('seed_scenarios is required (with golden and kill arrays)');
  } else {
    if (!seed_scenarios.golden || !Array.isArray(seed_scenarios.golden) || seed_scenarios.golden.length < 2) {
      errors.push(`Minimum 2 golden seed_scenarios required (found: ${seed_scenarios.golden?.length || 0})`);
    } else {
      // Validate golden scenarios
      for (let i = 0; i < seed_scenarios.golden.length; i++) {
        const scenario = seed_scenarios.golden[i];
        if (!scenario.scenario_id) {
          errors.push(`seed_scenarios.golden[${i}].scenario_id is required`);
        }
        if (!scenario.entry_intent) {
          errors.push(`seed_scenarios.golden[${i}].entry_intent is required`);
        }
      }
    }

    if (!seed_scenarios.kill || !Array.isArray(seed_scenarios.kill) || seed_scenarios.kill.length < 2) {
      errors.push(`Minimum 2 kill seed_scenarios required (found: ${seed_scenarios.kill?.length || 0})`);
    } else {
      // Validate kill scenarios
      for (let i = 0; i < seed_scenarios.kill.length; i++) {
        const scenario = seed_scenarios.kill[i];
        if (!scenario.scenario_id) {
          errors.push(`seed_scenarios.kill[${i}].scenario_id is required`);
        }
        if (!scenario.entry_intent) {
          errors.push(`seed_scenarios.kill[${i}].entry_intent is required`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * GET /api/superadmin/sub-verticals
 * List all sub-verticals with their parent vertical info and MVT status
 */
export async function GET() {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const subVerticals = await query<OSSubVertical>(
      `SELECT sv.id, sv.vertical_id, sv.key, sv.name, sv.default_agent,
              sv.primary_entity_type, sv.related_entity_types,
              sv.buyer_role, sv.decision_owner,
              sv.allowed_signals, sv.kill_rules, sv.seed_scenarios,
              sv.mvt_version, sv.mvt_valid, sv.mvt_validated_at,
              sv.is_active, sv.created_at, sv.updated_at,
              v.key as vertical_key, v.name as vertical_name
       FROM os_sub_verticals sv
       JOIN os_verticals v ON sv.vertical_id = v.id
       ORDER BY v.key, sv.created_at ASC`
    );

    return Response.json({
      success: true,
      data: subVerticals,
    });
  } catch (error) {
    console.error('[SubVerticals GET] Error:', error);
    return serverError('Failed to fetch sub-verticals');
  }
}

/**
 * POST /api/superadmin/sub-verticals
 * Create new sub-vertical with optional MVT fields
 *
 * S255 REVISED: MVT is optional during creation (for wizard workflow).
 * Sub-verticals without complete MVT are created with mvt_valid=false.
 * HARDEN MODE is used post-creation to fill MVT fields.
 * Runtime execution is blocked until MVT is complete (checked at runtime).
 */
export async function POST(request: NextRequest) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const actorUser = sessionResult.session?.email || 'unknown';

  try {
    const body = await request.json();
    const {
      vertical_id,
      key,
      name,
      default_agent,
      primary_entity_type,
      related_entity_types,
      // MVT fields (S255)
      buyer_role,
      decision_owner,
      allowed_signals,
      kill_rules,
      seed_scenarios,
    } = body;

    // ===========================================================
    // BASIC FIELD VALIDATION (pre-MVT)
    // ===========================================================

    // Validation: vertical_id
    if (!vertical_id) {
      await logControlPlaneAudit({
        actorUser,
        action: 'create_sub_vertical',
        targetType: 'sub_vertical',
        requestJson: body,
        success: false,
        errorMessage: 'vertical_id is required',
      });
      return validationError('vertical_id', 'vertical_id is required');
    }

    // Verify vertical exists
    const vertical = await queryOne<{ id: string }>(
      'SELECT id FROM os_verticals WHERE id = $1',
      [vertical_id]
    );

    if (!vertical) {
      await logControlPlaneAudit({
        actorUser,
        action: 'create_sub_vertical',
        targetType: 'sub_vertical',
        requestJson: body,
        success: false,
        errorMessage: 'Vertical not found',
      });
      return notFoundError('Vertical');
    }

    // Validation: key
    const keyValidation = validateKey(key);
    if (!keyValidation.valid) {
      await logControlPlaneAudit({
        actorUser,
        action: 'create_sub_vertical',
        targetType: 'sub_vertical',
        requestJson: body,
        success: false,
        errorMessage: keyValidation.error,
      });
      return validationError('key', keyValidation.error);
    }

    // Validation: name
    if (!name || typeof name !== 'string') {
      await logControlPlaneAudit({
        actorUser,
        action: 'create_sub_vertical',
        targetType: 'sub_vertical',
        requestJson: body,
        success: false,
        errorMessage: 'Name is required',
      });
      return validationError('name', 'Name is required');
    }

    // S278: Agent is ALWAYS SIVA - default if not provided
    // No user selection - all behavior differentiation from Persona → Policy → Envelope
    const resolvedAgent = (default_agent && typeof default_agent === 'string') ? default_agent : 'SIVA';

    // Validation: primary_entity_type (v2.0 - REQUIRED)
    if (!primary_entity_type || !VALID_ENTITY_TYPES.includes(primary_entity_type)) {
      await logControlPlaneAudit({
        actorUser,
        action: 'create_sub_vertical',
        targetType: 'sub_vertical',
        requestJson: body,
        success: false,
        errorMessage: 'primary_entity_type is required and must be one of: deal, company, individual',
      });
      return validationError('primary_entity_type', 'Must be one of: deal, company, individual');
    }

    // Validation: related_entity_types (v2.0 - optional array)
    if (related_entity_types !== undefined) {
      if (!Array.isArray(related_entity_types)) {
        await logControlPlaneAudit({
          actorUser,
          action: 'create_sub_vertical',
          targetType: 'sub_vertical',
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
            action: 'create_sub_vertical',
            targetType: 'sub_vertical',
            requestJson: body,
            success: false,
            errorMessage: `Invalid related_entity_type: ${entityType}`,
          });
          return validationError('related_entity_types', `Invalid type: ${entityType}. Must be one of: deal, company, individual`);
        }
      }
    }

    // Check for duplicate key within vertical
    const existing = await query<{ id: string }>(
      'SELECT id FROM os_sub_verticals WHERE vertical_id = $1 AND key = $2',
      [vertical_id, key]
    );

    if (existing.length > 0) {
      await logControlPlaneAudit({
        actorUser,
        action: 'create_sub_vertical',
        targetType: 'sub_vertical',
        requestJson: body,
        success: false,
        errorMessage: 'Duplicate key in vertical',
      });
      return conflictError('key');
    }

    // ===========================================================
    // S255 REVISED: MVT VALIDATION (optional for wizard creation)
    // ===========================================================
    // MVT is validated but NOT required for creation.
    // If MVT is incomplete, sub-vertical is created with mvt_valid=false.
    // Use HARDEN MODE post-creation to complete MVT fields.

    const mvtValidation = validateMVT(
      primary_entity_type,
      buyer_role,
      decision_owner,
      allowed_signals,
      kill_rules,
      seed_scenarios
    );

    // Log MVT status but do NOT block creation
    const mvtComplete = mvtValidation.valid;

    // ===========================================================
    // INSERT SUB-VERTICAL (MVT fields optional)
    // ===========================================================
    // mvt_valid is set based on MVT completeness check above

    const result = await insert<OSSubVertical>(
      `INSERT INTO os_sub_verticals (
         vertical_id, key, name, default_agent,
         primary_entity_type, related_entity_types,
         buyer_role, decision_owner,
         allowed_signals, kill_rules, seed_scenarios,
         mvt_version, mvt_valid, is_active
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 1, $12, true)
       RETURNING id, vertical_id, key, name, default_agent,
                 primary_entity_type, related_entity_types,
                 buyer_role, decision_owner,
                 allowed_signals, kill_rules, seed_scenarios,
                 mvt_version, mvt_valid, mvt_validated_at,
                 is_active, created_at, updated_at`,
      [
        vertical_id,
        key,
        name,
        resolvedAgent, // S278: Always SIVA
        primary_entity_type,
        related_entity_types || [],
        buyer_role || null,                                    // Optional - fill via HARDEN MODE
        decision_owner || null,                                // Optional - fill via HARDEN MODE
        JSON.stringify(allowed_signals || []),                 // Empty array if not provided
        JSON.stringify(kill_rules || []),                      // Empty array if not provided
        JSON.stringify(seed_scenarios || { golden: [], kill: [] }), // Empty structure if not provided
        mvtComplete,                                           // false if MVT incomplete
      ]
    );

    // Audit log success
    await logControlPlaneAudit({
      actorUser,
      action: 'create_sub_vertical',
      targetType: 'sub_vertical',
      targetId: result.id,
      requestJson: body,
      resultJson: {
        ...result as unknown as Record<string, unknown>,
        mvt_valid: mvtComplete,
      },
      success: true,
    });

    // Build response with MVT status
    const response: {
      success: boolean;
      data: OSSubVertical;
      mvt_status: {
        valid: boolean;
        version: number;
        validated_at: string | null;
        warnings?: string[];
        next_step?: string;
      };
    } = {
      success: true,
      data: result,
      mvt_status: {
        valid: mvtComplete,
        version: 1,
        validated_at: mvtComplete ? result.mvt_validated_at : null,
      },
    };

    // Add warnings if MVT incomplete
    if (!mvtComplete) {
      response.mvt_status.warnings = mvtValidation.errors;
      response.mvt_status.next_step = 'Use HARDEN MODE to complete MVT fields: /superadmin/controlplane/harden/sub-vertical/' + result.id;
    }

    return Response.json(response, { status: 201 });

  } catch (error) {
    console.error('[SubVerticals POST] Error:', error);
    return serverError('Failed to create sub-vertical');
  }
}
