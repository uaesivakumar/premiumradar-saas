/**
 * Super Admin - Activity/Audit Log API
 * List system activity and audit events
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    // Get query params for filtering
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const entityType = searchParams.get('entity_type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Check if audit_log table exists
    const tableCheck = await query<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'audit_log'
      ) as exists`
    );

    if (!tableCheck[0]?.exists) {
      // Return recent user activity as fallback
      const recentUsers = await query<{
        id: string;
        email: string;
        action: string;
        created_at: Date;
      }>(
        `SELECT
          id,
          email,
          'USER_CREATED' as action,
          created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT $1`,
        [limit]
      );

      const recentEnterprises = await query<{
        enterprise_id: string;
        name: string;
        action: string;
        created_at: Date;
      }>(
        `SELECT
          enterprise_id,
          name,
          'ENTERPRISE_CREATED' as action,
          created_at
        FROM enterprises
        ORDER BY created_at DESC
        LIMIT $1`,
        [limit]
      );

      // Combine and sort
      const activities = [
        ...recentUsers.map(u => ({
          id: u.id,
          action: u.action,
          entity_type: 'user',
          entity_id: u.id,
          description: `User ${u.email} created`,
          timestamp: u.created_at,
          actor: 'system',
        })),
        ...recentEnterprises.map(e => ({
          id: e.enterprise_id,
          action: e.action,
          entity_type: 'enterprise',
          entity_id: e.enterprise_id,
          description: `Enterprise ${e.name} created`,
          timestamp: e.created_at,
          actor: 'system',
        })),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
       .slice(0, limit);

      return NextResponse.json({
        success: true,
        data: {
          activities,
          total: activities.length,
          limit,
          offset,
          source: 'derived', // Not from audit_log table
        }
      });
    }

    // If audit_log exists, query it
    let whereClause = 'WHERE 1=1';
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (action) {
      whereClause += ` AND action = $${paramIndex++}`;
      params.push(action);
    }

    if (entityType) {
      whereClause += ` AND entity_type = $${paramIndex++}`;
      params.push(entityType);
    }

    const activities = await query<{
      id: string;
      action: string;
      entity_type: string;
      entity_id: string;
      description: string;
      metadata: Record<string, unknown>;
      actor_id: string;
      actor_email: string;
      timestamp: Date;
    }>(
      `SELECT
        al.id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.description,
        al.metadata,
        al.actor_id,
        u.email as actor_email,
        al.created_at as timestamp
      FROM audit_log al
      LEFT JOIN users u ON al.actor_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, limit, offset]
    );

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM audit_log ${whereClause}`,
      params
    );

    return NextResponse.json({
      success: true,
      data: {
        activities,
        total: parseInt(countResult[0]?.count || '0'),
        limit,
        offset,
        source: 'audit_log',
      }
    });
  } catch (error) {
    console.error('[SuperAdmin] GET /api/superadmin/activity error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}
