/**
 * S349: Super Admin - Activity API (Admin Plane v1.1)
 *
 * List business events from the immutable business_events table.
 * This is read-only visibility, NOT analytics.
 *
 * Guardrails:
 * - NO derived metrics
 * - NO aggregations
 * - Raw events only from business_events table
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifySession } from '@/lib/superadmin/security';
import { query } from '@/lib/db/client';
import { StoredBusinessEvent } from '@/lib/events/event-emitter';

/**
 * GET /api/superadmin/activity
 *
 * Query params:
 * - event_type: string (optional) - Filter by AdminPlaneEventType
 * - entity_type: string (optional) - Filter by EntityType
 * - entity_id: string (optional) - Filter by specific entity
 * - actor_user_id: string (optional) - Filter by actor
 * - from: ISO timestamp (optional) - Start of time range
 * - to: ISO timestamp (optional) - End of time range
 * - limit: number (default 50, max 200)
 * - offset: number (default 0)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify super admin session
    const headersList = await headers();
    const ip =
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    const sessionResult = await verifySession(ip, userAgent);
    if (!sessionResult.valid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get('event_type');
    const entityType = searchParams.get('entity_type');
    const entityId = searchParams.get('entity_id');
    const actorUserId = searchParams.get('actor_user_id');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build WHERE clause
    const conditions: string[] = [];
    const params: (string | number | Date)[] = [];
    let paramIndex = 1;

    if (eventType) {
      conditions.push(`event_type = $${paramIndex++}`);
      params.push(eventType);
    }

    if (entityType) {
      conditions.push(`entity_type = $${paramIndex++}`);
      params.push(entityType);
    }

    if (entityId) {
      conditions.push(`entity_id = $${paramIndex++}`);
      params.push(entityId);
    }

    if (actorUserId) {
      conditions.push(`actor_user_id = $${paramIndex++}`);
      params.push(actorUserId);
    }

    if (fromDate) {
      conditions.push(`timestamp >= $${paramIndex++}`);
      params.push(new Date(fromDate));
    }

    if (toDate) {
      conditions.push(`timestamp <= $${paramIndex++}`);
      params.push(new Date(toDate));
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Query business_events table (read-only, no JOINs per guardrail)
    const events = await query<StoredBusinessEvent>(
      `SELECT
        event_id,
        event_type,
        entity_type,
        entity_id,
        workspace_id,
        sub_vertical_id,
        actor_user_id,
        timestamp,
        metadata
      FROM business_events
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, limit, offset]
    );

    // Get total count for pagination
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM business_events ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0]?.count || '0');

    return NextResponse.json({
      success: true,
      data: {
        events,
        total,
        limit,
        offset,
        has_more: offset + events.length < total,
        source: 'business_events', // Always from immutable BTE table
      },
    });
  } catch (error) {
    console.error('[SuperAdmin] GET /api/superadmin/activity error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}
