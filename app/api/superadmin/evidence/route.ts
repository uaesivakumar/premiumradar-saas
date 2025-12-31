/**
 * S344: Super Admin - Evidence Packs API (Admin Plane v1.1)
 * Generate and retrieve deterministic evidence packs
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifySession } from '@/lib/superadmin/security';
import { query, queryOne } from '@/lib/db/client';
import { generateEvidencePack, type NarratorInput, type EvidencePack } from '@/lib/evidence/narrator';
import { getEntityEvents } from '@/lib/events/event-emitter';

/**
 * GET /api/superadmin/evidence
 * Generate evidence pack for an entity
 *
 * Query params:
 * - entity_type: USER | ENTERPRISE | WORKSPACE
 * - entity_id: UUID of the entity
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
    const entityType = searchParams.get('entity_type') as 'USER' | 'ENTERPRISE' | 'WORKSPACE';
    const entityId = searchParams.get('entity_id');

    if (!entityType || !entityId) {
      return NextResponse.json(
        { success: false, error: 'entity_type and entity_id are required' },
        { status: 400 }
      );
    }

    if (!['USER', 'ENTERPRISE', 'WORKSPACE'].includes(entityType)) {
      return NextResponse.json(
        { success: false, error: 'entity_type must be USER, ENTERPRISE, or WORKSPACE' },
        { status: 400 }
      );
    }

    // Get entity details
    let entityName: string | undefined;
    let context: NarratorInput['context'] = {};

    if (entityType === 'USER') {
      const user = await queryOne<{
        name: string | null;
        email: string;
        is_demo: boolean;
        demo_type: string | null;
        created_at: Date;
      }>(
        'SELECT name, email, is_demo, demo_type, created_at FROM users WHERE id = $1',
        [entityId]
      );
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
      entityName = user.name || user.email;
      context = {
        is_demo: user.is_demo,
        demo_type: user.demo_type || undefined,
        days_active: Math.floor((Date.now() - new Date(user.created_at).getTime()) / (24 * 60 * 60 * 1000)),
      };

      // Count user actions
      const actionCount = await queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM business_events WHERE actor_user_id = $1',
        [entityId]
      );
      context.action_count = parseInt(actionCount?.count || '0');

    } else if (entityType === 'ENTERPRISE') {
      const enterprise = await queryOne<{
        name: string;
        type: string;
        demo_expires_at: Date | null;
        created_at: Date;
      }>(
        'SELECT name, type, demo_expires_at, created_at FROM enterprises WHERE enterprise_id = $1',
        [entityId]
      );
      if (!enterprise) {
        return NextResponse.json(
          { success: false, error: 'Enterprise not found' },
          { status: 404 }
        );
      }
      entityName = enterprise.name;
      context = {
        is_demo: enterprise.type === 'DEMO',
        days_active: Math.floor((Date.now() - new Date(enterprise.created_at).getTime()) / (24 * 60 * 60 * 1000)),
      };

    } else if (entityType === 'WORKSPACE') {
      const workspace = await queryOne<{
        name: string;
        created_at: Date;
      }>(
        'SELECT name, created_at FROM workspaces WHERE workspace_id = $1',
        [entityId]
      );
      if (!workspace) {
        return NextResponse.json(
          { success: false, error: 'Workspace not found' },
          { status: 404 }
        );
      }
      entityName = workspace.name;
      context = {
        days_active: Math.floor((Date.now() - new Date(workspace.created_at).getTime()) / (24 * 60 * 60 * 1000)),
      };
    }

    // Get events from BTE
    const events = await getEntityEvents(entityType, entityId, { limit: 100 });

    // Convert to NarratorInput format
    const narratorInput: NarratorInput = {
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      events: events.map(e => ({
        timestamp: e.timestamp,
        event_type: e.event_type,
        description: `${e.event_type} on ${e.entity_type}`,
        actor: e.actor_user_id,
        metadata: e.metadata,
      })),
      signals: [], // Future: derive from events
      context,
    };

    // Generate deterministic evidence pack
    const evidencePack = generateEvidencePack(narratorInput);

    return NextResponse.json({
      success: true,
      data: {
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        evidence_pack: evidencePack,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[SuperAdmin] GET /api/superadmin/evidence error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate evidence pack' },
      { status: 500 }
    );
  }
}
