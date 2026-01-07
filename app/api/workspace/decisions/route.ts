/**
 * Decisions API Endpoint - S375: Decision Persistence & Recall
 *
 * GET /api/workspace/decisions - Query past decisions
 * POST /api/workspace/decisions - Create a new decision
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth-gate';
import { query, queryOne } from '@/lib/db/client';
import { logger } from '@/lib/logging/structured-logger';

// =============================================================================
// GET - Query Decisions
// =============================================================================

export async function GET(request: NextRequest) {
  // Require authentication
  const auth = await requireAuth();
  if (!auth.success) {
    return auth.response;
  }

  const { session } = auth;
  const searchParams = request.nextUrl.searchParams;

  try {
    const entityId = searchParams.get('entityId');
    const search = searchParams.get('search');
    const recent = searchParams.get('recent') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let sql = `
      SELECT
        id, entity_id, entity_type, entity_name,
        decision, reason, confidence,
        created_at, user_id, tenant_id, workspace_id, metadata
      FROM workspace_decisions
      WHERE tenant_id = $1 AND user_id = $2
    `;
    const params: unknown[] = [session.tenantId, session.user.id];
    let paramIndex = 3;

    // Filter by entity ID
    if (entityId) {
      sql += ` AND entity_id = $${paramIndex}`;
      params.push(entityId);
      paramIndex++;
    }

    // Search by entity name (fuzzy)
    if (search) {
      sql += ` AND entity_name ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Order by most recent
    sql += ' ORDER BY created_at DESC';

    // Pagination
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const decisions = await query<{
      id: string;
      entity_id: string;
      entity_type: string;
      entity_name: string;
      decision: string;
      reason: string;
      confidence: number;
      created_at: Date;
      user_id: string;
      tenant_id: string;
      workspace_id: string | null;
      metadata: Record<string, unknown> | null;
    }>(sql, params);

    // Map to camelCase
    const data = decisions.map(d => ({
      id: d.id,
      entityId: d.entity_id,
      entityType: d.entity_type,
      entityName: d.entity_name,
      decision: d.decision,
      reason: d.reason,
      confidence: d.confidence,
      createdAt: d.created_at,
      userId: d.user_id,
      tenantId: d.tenant_id,
      workspaceId: d.workspace_id,
      metadata: d.metadata,
    }));

    return NextResponse.json({
      success: true,
      data,
      meta: {
        count: data.length,
        limit,
        offset,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Decisions query failed', {
      tenantId: session.tenantId,
      userId: session.user.id,
      error: errorMessage,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to query decisions',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Create Decision
// =============================================================================

export async function POST(request: NextRequest) {
  // Require authentication
  const auth = await requireAuth();
  if (!auth.success) {
    return auth.response;
  }

  const { session } = auth;

  try {
    const body = await request.json();
    const {
      entityId,
      entityType,
      entityName,
      decision,
      reason,
      confidence,
      workspaceId,
      metadata,
    } = body;

    // Validate required fields
    if (!entityId || !entityType || !entityName || !decision || !reason) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: entityId, entityType, entityName, decision, reason',
        },
        { status: 400 }
      );
    }

    // Validate decision type
    const validDecisions = ['pursue', 'reject', 'defer', 'save'];
    if (!validDecisions.includes(decision)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid decision type. Must be one of: ${validDecisions.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Insert decision
    const result = await queryOne<{
      id: string;
      entity_id: string;
      entity_type: string;
      entity_name: string;
      decision: string;
      reason: string;
      confidence: number;
      created_at: Date;
      user_id: string;
      tenant_id: string;
      workspace_id: string | null;
      metadata: Record<string, unknown> | null;
    }>(
      `INSERT INTO workspace_decisions (
        entity_id, entity_type, entity_name,
        decision, reason, confidence,
        user_id, tenant_id, workspace_id, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        entityId,
        entityType,
        entityName,
        decision,
        reason,
        confidence || 0,
        session.user.id,
        session.tenantId,
        workspaceId || null,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Failed to create decision' },
        { status: 500 }
      );
    }

    logger.info('Decision created', {
      tenantId: session.tenantId,
      userId: session.user.id,
      entityId,
      decision,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        entityId: result.entity_id,
        entityType: result.entity_type,
        entityName: result.entity_name,
        decision: result.decision,
        reason: result.reason,
        confidence: result.confidence,
        createdAt: result.created_at,
        userId: result.user_id,
        tenantId: result.tenant_id,
        workspaceId: result.workspace_id,
        metadata: result.metadata,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Decision creation failed', {
      tenantId: session.tenantId,
      userId: session.user.id,
      error: errorMessage,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create decision',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
