/**
 * S293A: Evidence Packs API
 * Part of User & Enterprise Management Program v1.1
 * Phase C - Backend & API
 *
 * GET  /api/evidence-packs - List user's evidence packs
 * POST /api/evidence-packs - Store a new evidence pack
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import {
  listUserEvidencePacks,
  storePackWithInsights,
  EvidencePackType,
} from '@/lib/db/evidence-packs';
import { evaluateDemoPolicy, recordDemoAction } from '@/lib/db/demo-policies';

// ============================================================
// GET /api/evidence-packs - List user's evidence packs
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const packType = searchParams.get('type') as EvidencePackType | null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const { packs, total } = await listUserEvidencePacks(session.user.id, {
      packType: packType || undefined,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: {
        packs: packs.map((p) => ({
          id: p.id,
          pack_type: p.pack_type,
          target_entity: p.target_entity,
          target_type: p.target_type,
          scores: {
            overall: p.overall_score,
            Q: p.q_score,
            T: p.t_score,
            L: p.l_score,
            E: p.e_score,
          },
          confidence: p.confidence,
          evidence_count: p.evidence_count,
          created_at: p.created_at,
        })),
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('[API] GET /api/evidence-packs error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list evidence packs' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/evidence-packs - Store a new evidence pack
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check demo policy
    if (session.isDemo) {
      const demoEval = await evaluateDemoPolicy(session.user.id, 'action');
      if (!demoEval.is_allowed) {
        return NextResponse.json(
          { success: false, error: demoEval.denial_reason || 'Demo limit reached' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();

    // Validate required fields
    if (!body.pack_type || !body.target_entity || !body.pack_data) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: pack_type, target_entity, pack_data' },
        { status: 400 }
      );
    }

    // Validate pack type
    const validTypes: EvidencePackType[] = ['ranking', 'outreach', 'discovery'];
    if (!validTypes.includes(body.pack_type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pack_type. Must be: ranking, outreach, or discovery' },
        { status: 400 }
      );
    }

    // Store the pack with automatic insight extraction
    const pack = await storePackWithInsights({
      user_id: session.user.id,
      enterprise_id: session.enterpriseId,
      workspace_id: session.workspaceId,
      pack_type: body.pack_type,
      target_entity: body.target_entity,
      target_type: body.target_type || 'company',
      pack_data: body.pack_data,
      expires_at: body.expires_at ? new Date(body.expires_at) : undefined,
    });

    // Record demo action if applicable
    if (session.isDemo) {
      await recordDemoAction(session.user.id, 'action');
    }

    return NextResponse.json({
      success: true,
      data: {
        pack: {
          id: pack.id,
          pack_type: pack.pack_type,
          target_entity: pack.target_entity,
          target_type: pack.target_type,
          scores: {
            overall: pack.overall_score,
            Q: pack.q_score,
            T: pack.t_score,
            L: pack.l_score,
            E: pack.e_score,
          },
          confidence: pack.confidence,
          evidence_count: pack.evidence_count,
          created_at: pack.created_at,
        },
      },
    });
  } catch (error) {
    console.error('[API] POST /api/evidence-packs error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to store evidence pack' },
      { status: 500 }
    );
  }
}
