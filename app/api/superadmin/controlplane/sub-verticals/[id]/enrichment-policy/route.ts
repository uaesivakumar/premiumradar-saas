/**
 * Enrichment Policy API - S397
 *
 * GET /api/superadmin/controlplane/sub-verticals/[id]/enrichment-policy
 *   - Returns current enrichment policy text and metadata
 *
 * PUT /api/superadmin/controlplane/sub-verticals/[id]/enrichment-policy
 *   - Updates enrichment policy text (plain English only)
 *   - Increments version counter
 *   - Does NOT trigger interpretation (that's a separate action)
 *
 * Part of Phase 1: Policy Compiler (Foundational)
 * Master Implementation Plan - LOCKED
 */

import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';
import { logControlPlaneAudit } from '@/lib/db/controlplane-audit';

interface EnrichmentPolicyResponse {
  sub_vertical_id: string;
  sub_vertical_key: string;
  sub_vertical_name: string;
  enrichment_policy_text: string | null;
  enrichment_policy_version: number;
  enrichment_policy_updated_at: string | null;
  enrichment_policy_updated_by: string | null;
  has_pending_interpretation: boolean;
  active_policy_version_id: string | null;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/superadmin/controlplane/sub-verticals/[id]/enrichment-policy
 *
 * Returns the current enrichment policy text and metadata for a sub-vertical.
 * Also indicates if there's a pending interpretation that needs review.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Get sub-vertical with enrichment policy fields
    const subVertical = await queryOne<EnrichmentPolicyResponse>(
      `SELECT
         sv.id as sub_vertical_id,
         sv.key as sub_vertical_key,
         sv.name as sub_vertical_name,
         sv.enrichment_policy_text,
         COALESCE(sv.enrichment_policy_version, 0) as enrichment_policy_version,
         sv.enrichment_policy_updated_at,
         sv.enrichment_policy_updated_by,
         -- Check if there's a pending interpretation (draft or pending_approval)
         EXISTS (
           SELECT 1 FROM enrichment_policy_versions epv
           WHERE epv.sub_vertical_id = sv.id
             AND epv.status IN ('draft', 'pending_approval')
         ) as has_pending_interpretation,
         -- Get active approved policy version ID
         (
           SELECT epv.id FROM enrichment_policy_versions epv
           WHERE epv.sub_vertical_id = sv.id
             AND epv.status = 'approved'
           ORDER BY epv.version DESC
           LIMIT 1
         ) as active_policy_version_id
       FROM os_sub_verticals sv
       WHERE sv.id = $1`,
      [id]
    );

    if (!subVertical) {
      return Response.json(
        { success: false, error: 'Sub-vertical not found' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: subVertical,
    });
  } catch (error) {
    console.error('[EnrichmentPolicy GET] Error:', error);

    // Handle case where enrichment_policy columns don't exist yet (migration not run)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('column') && errorMessage.includes('does not exist')) {
      return Response.json({
        success: true,
        data: {
          sub_vertical_id: id,
          enrichment_policy_text: null,
          enrichment_policy_version: 0,
          enrichment_policy_updated_at: null,
          enrichment_policy_updated_by: null,
          has_pending_interpretation: false,
          active_policy_version_id: null,
          _migration_required: true,
          _migration_hint: 'Run S397_enrichment_policy_text.sql migration',
        },
      });
    }

    return Response.json(
      { success: false, error: 'Failed to fetch enrichment policy' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/superadmin/controlplane/sub-verticals/[id]/enrichment-policy
 *
 * Updates the enrichment policy text. This is plain English policy definition.
 *
 * Request body:
 * {
 *   "enrichment_policy_text": "If company is large (500+ employees)..."
 * }
 *
 * This DOES NOT trigger interpretation. After saving, founder should:
 * 1. Review the saved text
 * 2. Click "Interpret Policy" to trigger LLM interpretation
 * 3. Review interpretation in side-by-side view
 * 4. Approve or edit interpretation
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
    const { enrichment_policy_text } = body;

    // Validate input
    if (enrichment_policy_text === undefined) {
      return Response.json(
        { success: false, error: 'enrichment_policy_text is required' },
        { status: 400 }
      );
    }

    // Allow null/empty to clear policy
    const policyText = enrichment_policy_text?.trim() || null;

    // Validate it's plain English (no JSON, no code)
    if (policyText) {
      // Check for JSON-like content
      if (policyText.startsWith('{') || policyText.startsWith('[')) {
        return Response.json(
          {
            success: false,
            error: 'PLAIN_ENGLISH_REQUIRED',
            message: 'Policy must be plain English text, not JSON. Write your enrichment rules in natural language.',
          },
          { status: 400 }
        );
      }

      // Check for code-like content
      if (policyText.includes('function ') || policyText.includes('=>') || policyText.includes('if (')) {
        return Response.json(
          {
            success: false,
            error: 'PLAIN_ENGLISH_REQUIRED',
            message: 'Policy must be plain English text, not code. Describe your enrichment rules naturally.',
          },
          { status: 400 }
        );
      }
    }

    // Check sub-vertical exists
    const existing = await queryOne<{ id: string; enrichment_policy_version: number }>(
      'SELECT id, COALESCE(enrichment_policy_version, 0) as enrichment_policy_version FROM os_sub_verticals WHERE id = $1',
      [id]
    );

    if (!existing) {
      return Response.json(
        { success: false, error: 'Sub-vertical not found' },
        { status: 404 }
      );
    }

    // Update policy text and increment version
    const newVersion = (existing.enrichment_policy_version || 0) + 1;

    const result = await queryOne<{
      enrichment_policy_text: string | null;
      enrichment_policy_version: number;
      enrichment_policy_updated_at: string;
    }>(
      `UPDATE os_sub_verticals
       SET enrichment_policy_text = $1,
           enrichment_policy_version = $2,
           enrichment_policy_updated_at = NOW(),
           enrichment_policy_updated_by = $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING enrichment_policy_text, enrichment_policy_version, enrichment_policy_updated_at`,
      [policyText, newVersion, actorUser, id]
    );

    // Audit log
    await logControlPlaneAudit({
      actorUser,
      action: 'update_enrichment_policy',
      targetType: 'sub_vertical',
      targetId: id,
      requestJson: { enrichment_policy_text: policyText ? `${policyText.substring(0, 100)}...` : null },
      resultJson: { version: newVersion },
      success: true,
    });

    return Response.json({
      success: true,
      data: {
        sub_vertical_id: id,
        enrichment_policy_text: result?.enrichment_policy_text,
        enrichment_policy_version: result?.enrichment_policy_version,
        enrichment_policy_updated_at: result?.enrichment_policy_updated_at,
        enrichment_policy_updated_by: actorUser,
      },
      message: policyText
        ? 'Policy saved. Click "Interpret Policy" to generate structured interpretation.'
        : 'Policy cleared.',
    });
  } catch (error) {
    console.error('[EnrichmentPolicy PUT] Error:', error);

    // Handle case where enrichment_policy columns don't exist yet
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('column') && errorMessage.includes('does not exist')) {
      return Response.json(
        {
          success: false,
          error: 'MIGRATION_REQUIRED',
          message: 'Enrichment policy columns not found. Run S397_enrichment_policy_text.sql migration first.',
        },
        { status: 500 }
      );
    }

    return Response.json(
      { success: false, error: 'Failed to update enrichment policy' },
      { status: 500 }
    );
  }
}
