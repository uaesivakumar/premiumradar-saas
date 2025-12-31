/**
 * S345: Super Admin - Audit Trail API (Admin Plane v1.1)
 * Query business events and audit logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifySession } from '@/lib/superadmin/security';
import { query, queryOne } from '@/lib/db/client';

interface AuditEvent {
  event_id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  actor_user_id: string;
  actor_email?: string;
  workspace_id: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

/**
 * GET /api/superadmin/audit
 * Query audit trail with filters
 *
 * Query params:
 * - entity_type: Filter by entity type (USER, ENTERPRISE, WORKSPACE)
 * - entity_id: Filter by specific entity
 * - actor_id: Filter by actor (who performed the action)
 * - event_type: Filter by event type
 * - from: Start date (ISO string)
 * - to: End date (ISO string)
 * - limit: Max results (default 100)
 * - offset: Pagination offset
 */
export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               headersList.get('x-real-ip') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    const sessionResult = await verifySession(ip, userAgent);
    if (!sessionResult.valid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entity_type');
    const entityId = searchParams.get('entity_id');
    const actorId = searchParams.get('actor_id');
    const eventType = searchParams.get('event_type');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let whereClause = 'WHERE 1=1';
    const params: (string | number | Date)[] = [];
    let paramIndex = 1;

    if (entityType) {
      whereClause += ` AND be.entity_type = $${paramIndex++}`;
      params.push(entityType);
    }
    if (entityId) {
      whereClause += ` AND be.entity_id = $${paramIndex++}`;
      params.push(entityId);
    }
    if (actorId) {
      whereClause += ` AND be.actor_user_id = $${paramIndex++}`;
      params.push(actorId);
    }
    if (eventType) {
      whereClause += ` AND be.event_type = $${paramIndex++}`;
      params.push(eventType);
    }
    if (from) {
      whereClause += ` AND be.timestamp >= $${paramIndex++}`;
      params.push(new Date(from));
    }
    if (to) {
      whereClause += ` AND be.timestamp <= $${paramIndex++}`;
      params.push(new Date(to));
    }

    // Get events with actor info
    const events = await query<AuditEvent>(
      `SELECT
        be.event_id,
        be.event_type,
        be.entity_type,
        be.entity_id,
        be.actor_user_id,
        u.email as actor_email,
        be.workspace_id,
        be.timestamp,
        be.metadata
      FROM business_events be
      LEFT JOIN users u ON be.actor_user_id = u.id
      ${whereClause}
      ORDER BY be.timestamp DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, limit, offset]
    );

    // Get total count
    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM business_events be ${whereClause}`,
      params
    );
    const total = parseInt(countResult?.count || '0');

    // Get event type distribution
    const typeDistribution = await query<{ event_type: string; count: string }>(
      `SELECT event_type, COUNT(*) as count
       FROM business_events be
       ${whereClause}
       GROUP BY event_type
       ORDER BY count DESC`,
      params
    );

    return NextResponse.json({
      success: true,
      data: {
        events,
        total,
        limit,
        offset,
        distribution: typeDistribution.map(d => ({
          event_type: d.event_type,
          count: parseInt(d.count),
        })),
      },
    });
  } catch (error) {
    console.error('[SuperAdmin] GET /api/superadmin/audit error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit trail' },
      { status: 500 }
    );
  }
}
