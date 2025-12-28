/**
 * S293A: Evidence Pack Detail API
 * Part of User & Enterprise Management Program v1.1
 * Phase C - Backend & API
 *
 * GET    /api/evidence-packs/[id] - Get evidence pack details
 * DELETE /api/evidence-packs/[id] - Archive/delete evidence pack
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import {
  getEvidencePackById,
  getPackInsights,
  archiveEvidencePack,
  deleteEvidencePack,
} from '@/lib/db/evidence-packs';

// ============================================================
// GET /api/evidence-packs/[id] - Get evidence pack details
// ============================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const pack = await getEvidencePackById(id);

    if (!pack) {
      return NextResponse.json(
        { success: false, error: 'Evidence pack not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (pack.user_id !== session.user.id && pack.enterprise_id !== session.enterpriseId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get insights
    const insights = await getPackInsights(pack.id);

    // Check if full data requested
    const { searchParams } = new URL(request.url);
    const includeFull = searchParams.get('full') === 'true';

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
          sources: pack.sources,
          is_archived: pack.is_archived,
          expires_at: pack.expires_at,
          created_at: pack.created_at,
          updated_at: pack.updated_at,
          // Include full pack_data only if requested
          ...(includeFull ? { pack_data: pack.pack_data } : {}),
        },
        insights: insights.map((i) => ({
          id: i.id,
          type: i.insight_type,
          text: i.insight_text,
          priority: i.priority,
        })),
      },
    });
  } catch (error) {
    console.error('[API] GET /api/evidence-packs/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get evidence pack' },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE /api/evidence-packs/[id] - Archive/delete evidence pack
// ============================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const pack = await getEvidencePackById(id);

    if (!pack) {
      return NextResponse.json(
        { success: false, error: 'Evidence pack not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (pack.user_id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check query param for hard delete vs archive
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    if (hardDelete) {
      await deleteEvidencePack(pack.id);
    } else {
      await archiveEvidencePack(pack.id);
    }

    return NextResponse.json({
      success: true,
      data: {
        deleted: hardDelete,
        archived: !hardDelete,
      },
    });
  } catch (error) {
    console.error('[API] DELETE /api/evidence-packs/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete evidence pack' },
      { status: 500 }
    );
  }
}
