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
 * POST /api/admin/vertical-config
 *   - Create new config
 *
 * PATCH /api/admin/vertical-config
 *   - Update config (requires ?id=xxx)
 *
 * DELETE /api/admin/vertical-config
 *   - Delete config (requires ?id=xxx)
 *
 * This endpoint is called by:
 * 1. UPR OS at runtime to fetch vertical config
 * 2. Super-Admin Panel for CRUD operations
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getVerticalConfigCached,
  getAllVerticalConfigs,
  getActiveVerticalConfigs,
  getVerticals,
  getSubVerticals,
  getRegions,
  createVerticalConfig,
  updateVerticalConfig,
  deleteVerticalConfig,
  getVerticalConfigById,
  VerticalConfigSchema,
  invalidateConfigCache,
} from '@/lib/admin/server';

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
// POST - Create new vertical config
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const parseResult = VerticalConfigSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    // Mandatory persona validation (S71-fix)
    const persona = body.persona;
    if (!persona || !persona.persona_name || persona.persona_name.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'PERSONA_REQUIRED',
          message: 'No persona found for this sub-vertical. Please create a persona first. SIVA cannot function without knowing HOW to think for this role.',
        },
        { status: 400 }
      );
    }

    if (!persona.entity_type) {
      return NextResponse.json(
        {
          success: false,
          error: 'PERSONA_INCOMPLETE',
          message: 'Entity type is required in persona config. Please select company, individual, or family.',
        },
        { status: 400 }
      );
    }

    if (!persona.contact_priority_rules?.tiers?.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'PERSONA_INCOMPLETE',
          message: 'At least one contact priority tier is required in persona config.',
        },
        { status: 400 }
      );
    }

    const config = await createVerticalConfig(parseResult.data);

    return NextResponse.json(
      { success: true, data: config },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] POST /api/admin/vertical-config error:', error);

    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('unique_vertical_config')) {
      return NextResponse.json(
        {
          success: false,
          error: 'A config for this vertical/sub-vertical/region already exists',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PATCH - Update vertical config
// =============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id parameter required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Get existing config to check if it exists and get its identifiers
    const existing = await getVerticalConfigById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Config not found' },
        { status: 404 }
      );
    }

    // Mandatory persona validation on update (S71-fix)
    if (body.persona) {
      const persona = body.persona;
      if (!persona.persona_name || persona.persona_name.trim() === '') {
        return NextResponse.json(
          {
            success: false,
            error: 'PERSONA_REQUIRED',
            message: 'Persona name cannot be empty. SIVA cannot function without knowing HOW to think for this role.',
          },
          { status: 400 }
        );
      }

      if (!persona.entity_type) {
        return NextResponse.json(
          {
            success: false,
            error: 'PERSONA_INCOMPLETE',
            message: 'Entity type is required in persona config.',
          },
          { status: 400 }
        );
      }
    }

    const config = await updateVerticalConfig(id, body);

    // Invalidate cache for this config
    invalidateConfigCache(existing.vertical, existing.subVertical, existing.regionCountry);

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error('[API] PATCH /api/admin/vertical-config error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE - Delete vertical config
// =============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id parameter required' },
        { status: 400 }
      );
    }

    // Get existing config to check if it's seeded
    const existing = await getVerticalConfigById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Config not found' },
        { status: 404 }
      );
    }

    if (existing.isSeeded) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete seeded configs' },
        { status: 403 }
      );
    }

    const success = await deleteVerticalConfig(id);

    if (success) {
      // Invalidate cache
      invalidateConfigCache(existing.vertical, existing.subVertical, existing.regionCountry);
    }

    return NextResponse.json({ success });
  } catch (error) {
    console.error('[API] DELETE /api/admin/vertical-config error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
