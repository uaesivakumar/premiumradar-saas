/**
 * Vertical Config API
 *
 * GET /api/admin/vertical-config
 *   - Get all configs: ?all=true
 *   - Get specific: ?vertical=banking&subVertical=employee-banking&region=UAE
 *   - Get verticals list: ?verticals=true
 *   - Get sub-verticals: ?subVerticals=true&vertical=banking
 *   - Get regions: ?regions=true&vertical=banking&subVertical=employee-banking
 *
 * ⚠️ AUTHORITY LOCK (Control Plane v3.0):
 * POST/PATCH/DELETE mutations are DEPRECATED on this endpoint.
 * All vertical/persona creation MUST go through Control Plane wizard:
 *   /api/superadmin/controlplane/* endpoints
 *
 * This endpoint now serves as READ-ONLY for:
 * 1. UPR OS at runtime to fetch vertical config
 * 2. Legacy compatibility (read operations only)
 *
 * Mutations blocked with: AUTHORITY_LOCKED error
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getVerticalConfigCached,
  getAllVerticalConfigs,
  getActiveVerticalConfigs,
  getVerticals,
  getSubVerticals,
  getRegions,
  getVerticalConfigById,
} from '@/lib/admin/server';

// ⛔ AUTHORITY LOCK: These imports are intentionally removed
// createVerticalConfig, updateVerticalConfig, deleteVerticalConfig
// All mutations MUST go through Control Plane APIs

// =============================================================================
// GET - Fetch vertical configs
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get all configs
    if (searchParams.get('all') === 'true') {
      const configs = await getAllVerticalConfigs();
      return NextResponse.json({ success: true, data: configs });
    }

    // Get active configs only
    if (searchParams.get('active') === 'true') {
      const configs = await getActiveVerticalConfigs();
      return NextResponse.json({ success: true, data: configs });
    }

    // Get verticals list
    if (searchParams.get('verticals') === 'true') {
      const verticals = await getVerticals();
      return NextResponse.json({ success: true, data: verticals });
    }

    // Get sub-verticals for a vertical
    if (searchParams.get('subVerticals') === 'true') {
      const vertical = searchParams.get('vertical');
      if (!vertical) {
        return NextResponse.json(
          { success: false, error: 'vertical parameter required' },
          { status: 400 }
        );
      }
      const subVerticals = await getSubVerticals(vertical);
      return NextResponse.json({ success: true, data: subVerticals });
    }

    // Get regions for vertical/sub-vertical
    if (searchParams.get('regions') === 'true') {
      const vertical = searchParams.get('vertical');
      const subVertical = searchParams.get('subVertical');
      if (!vertical || !subVertical) {
        return NextResponse.json(
          { success: false, error: 'vertical and subVertical parameters required' },
          { status: 400 }
        );
      }
      const regions = await getRegions(vertical, subVertical);
      return NextResponse.json({ success: true, data: regions });
    }

    // Get specific config by ID
    const id = searchParams.get('id');
    if (id) {
      const config = await getVerticalConfigById(id);
      if (!config) {
        return NextResponse.json(
          { success: false, error: 'Config not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: config });
    }

    // Get specific config by vertical/sub-vertical/region (with caching)
    const vertical = searchParams.get('vertical');
    const subVertical = searchParams.get('subVertical');
    const region = searchParams.get('region');

    if (vertical && subVertical && region) {
      const config = await getVerticalConfigCached(vertical, subVertical, region);

      if (!config) {
        // Return "Coming Soon" response when config not found
        return NextResponse.json({
          success: false,
          error: 'VERTICAL_NOT_CONFIGURED',
          message: 'Coming Soon — We\'re expanding to your industry! Request early access to be among the first to experience it.',
          vertical,
          subVertical,
          region,
        }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: config });
    }

    // No valid query - return error
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid query. Use ?all=true, ?verticals=true, or ?vertical=x&subVertical=y&region=z',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('[API] GET /api/admin/vertical-config error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - AUTHORITY LOCKED
// =============================================================================

export async function POST(request: NextRequest) {
  // ⛔ AUTHORITY LOCK: All mutations MUST go through Control Plane
  // This is NOT a silent rejection - it's a loud governance failure
  console.error('[AUTHORITY VIOLATION] POST /api/admin/vertical-config called directly. Use Control Plane wizard.');

  return NextResponse.json(
    {
      success: false,
      error: 'AUTHORITY_LOCKED',
      code: 'GOVERNANCE_VIOLATION',
      message: 'Direct vertical creation is FORBIDDEN. All vertical/persona creation MUST go through the Control Plane wizard.',
      redirect: '/superadmin/controlplane/wizard/new',
      reason: 'Control Plane is the single source of truth for vertical configuration. This endpoint is now READ-ONLY.',
      timestamp: new Date().toISOString(),
    },
    { status: 403 }
  );
}

// =============================================================================
// PATCH - AUTHORITY LOCKED
// =============================================================================

export async function PATCH(request: NextRequest) {
  // ⛔ AUTHORITY LOCK: All mutations MUST go through Control Plane
  // This is NOT a silent rejection - it's a loud governance failure
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  console.error(`[AUTHORITY VIOLATION] PATCH /api/admin/vertical-config?id=${id} called directly. Use Control Plane.`);

  return NextResponse.json(
    {
      success: false,
      error: 'AUTHORITY_LOCKED',
      code: 'GOVERNANCE_VIOLATION',
      message: 'Direct vertical editing is FORBIDDEN. All vertical/persona updates MUST go through the Control Plane.',
      redirect: '/superadmin/controlplane',
      reason: 'Control Plane is the single source of truth for vertical configuration. This endpoint is now READ-ONLY.',
      attempted_id: id,
      timestamp: new Date().toISOString(),
    },
    { status: 403 }
  );
}

// =============================================================================
// DELETE - AUTHORITY LOCKED
// =============================================================================

export async function DELETE(request: NextRequest) {
  // ⛔ AUTHORITY LOCK: All mutations MUST go through Control Plane
  // This is NOT a silent rejection - it's a loud governance failure
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  console.error(`[AUTHORITY VIOLATION] DELETE /api/admin/vertical-config?id=${id} called directly. Use Control Plane.`);

  return NextResponse.json(
    {
      success: false,
      error: 'AUTHORITY_LOCKED',
      code: 'GOVERNANCE_VIOLATION',
      message: 'Direct vertical deletion is FORBIDDEN. All vertical lifecycle operations MUST go through the Control Plane.',
      redirect: '/superadmin/controlplane',
      reason: 'Control Plane is the single source of truth for vertical configuration. This endpoint is now READ-ONLY.',
      attempted_id: id,
      timestamp: new Date().toISOString(),
    },
    { status: 403 }
  );
}
