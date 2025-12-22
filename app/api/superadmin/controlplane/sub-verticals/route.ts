/**
 * OS Sub-Verticals CRUD API
 *
 * GET  /api/superadmin/sub-verticals - List all sub-verticals
 * POST /api/superadmin/sub-verticals - Create new sub-vertical
 *
 * Contract Rules:
 * - key: required, lowercase snake_case
 * - vertical_id: required, must exist
 * - default_agent: required
 * - primary_entity_type: required (v2.0), one of: deal, company, individual
 * - related_entity_types: optional array (v2.0)
 * - All writes logged to os_controlplane_audit
 *
 * v2.0 MIGRATION:
 * - primary_entity_type is now the source of truth (moved from vertical level)
 * - Entity type determines discovery scope for SIVA
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

interface OSSubVertical {
  id: string;
  vertical_id: string;
  key: string;
  name: string;
  default_agent: string;
  primary_entity_type: string;       // v2.0: Entity type now at sub-vertical level
  related_entity_types: string[];    // v2.0: Additional context entities
  is_active: boolean;
  created_at: string;
  updated_at: string;
  vertical_key?: string;
  vertical_name?: string;
}

// Valid entity types (v2.0)
const VALID_ENTITY_TYPES = ['deal', 'company', 'individual'] as const;

/**
 * GET /api/superadmin/sub-verticals
 * List all sub-verticals with their parent vertical info
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
 * Create new sub-vertical
 */
export async function POST(request: NextRequest) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const actorUser = sessionResult.session?.email || 'unknown';

  try {
    const body = await request.json();
    const { vertical_id, key, name, default_agent, primary_entity_type, related_entity_types } = body;

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

    // Validation: default_agent (required per contract)
    if (!default_agent || typeof default_agent !== 'string') {
      await logControlPlaneAudit({
        actorUser,
        action: 'create_sub_vertical',
        targetType: 'sub_vertical',
        requestJson: body,
        success: false,
        errorMessage: 'default_agent is required',
      });
      return validationError('default_agent', 'default_agent is required');
    }

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

    // Insert sub-vertical (v2.0: includes primary_entity_type)
    const result = await insert<OSSubVertical>(
      `INSERT INTO os_sub_verticals (vertical_id, key, name, default_agent, primary_entity_type, related_entity_types, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING id, vertical_id, key, name, default_agent, primary_entity_type, related_entity_types, is_active, created_at, updated_at`,
      [vertical_id, key, name, default_agent, primary_entity_type, related_entity_types || []]
    );

    // Audit log success
    await logControlPlaneAudit({
      actorUser,
      action: 'create_sub_vertical',
      targetType: 'sub_vertical',
      targetId: result.id,
      requestJson: body,
      resultJson: result as unknown as Record<string, unknown>,
      success: true,
    });

    return Response.json({
      success: true,
      data: result,
    }, { status: 201 });

  } catch (error) {
    console.error('[SubVerticals POST] Error:', error);
    return serverError('Failed to create sub-vertical');
  }
}
