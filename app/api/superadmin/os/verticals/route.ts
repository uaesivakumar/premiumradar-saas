/**
 * Super Admin Verticals Config API (S147)
 *
 * Proxies to UPR OS Vertical Pack APIs with:
 * - Schema validation before save (S147.1)
 * - Local DB persistence
 * - OS kernel hot reload on change
 * - Version tracking
 *
 * Provides Super Admin with control over:
 * - Vertical Packs (Banking, Insurance, etc.)
 * - Signal Types
 * - Scoring Templates
 * - Evidence Rules
 * - Persona Templates
 * - Journey Templates
 * - Radar Targets
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/superadmin/security';
import { verticals } from '@/lib/os/os-client';
import {
  validateVerticalConfig,
  validateVerticalUpdate,
  type VerticalConfig,
} from '@/lib/os/validation/vertical-schema';
import {
  createVertical as createVerticalDB,
  updateVertical as updateVerticalDB,
  getVertical as getVerticalDB,
  getVersionHistory,
  rollbackToVersion,
} from '@/lib/db/vertical-configs';
import { kernelLoader } from '@/lib/os/kernel-loader';

async function verifyAuth(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return verifySession(ip, userAgent);
}

/**
 * GET /api/superadmin/os/verticals
 * List verticals or get specific vertical details
 */
export async function GET(request: NextRequest) {
  const session = await verifyAuth(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const slug = searchParams.get('slug');

    switch (action) {
      case 'get': {
        if (!slug) {
          return NextResponse.json({ error: 'Vertical slug required' }, { status: 400 });
        }
        const result = await verticals.get(slug);
        return NextResponse.json(result);
      }

      case 'config': {
        if (!slug) {
          return NextResponse.json({ error: 'Vertical slug required' }, { status: 400 });
        }
        const result = await verticals.getConfig(slug);
        return NextResponse.json(result);
      }

      case 'signals': {
        if (!slug) {
          return NextResponse.json({ error: 'Vertical slug required' }, { status: 400 });
        }
        const result = await verticals.getSignals(slug);
        return NextResponse.json(result);
      }

      case 'scoring': {
        if (!slug) {
          return NextResponse.json({ error: 'Vertical slug required' }, { status: 400 });
        }
        const result = await verticals.getScoring(slug);
        return NextResponse.json(result);
      }

      case 'evidence': {
        if (!slug) {
          return NextResponse.json({ error: 'Vertical slug required' }, { status: 400 });
        }
        const result = await verticals.getEvidence(slug);
        return NextResponse.json(result);
      }

      case 'personas': {
        if (!slug) {
          return NextResponse.json({ error: 'Vertical slug required' }, { status: 400 });
        }
        const result = await verticals.getPersonas(slug);
        return NextResponse.json(result);
      }

      case 'journeys': {
        if (!slug) {
          return NextResponse.json({ error: 'Vertical slug required' }, { status: 400 });
        }
        const type = searchParams.get('type') || undefined;
        const result = await verticals.getJourneys(slug, type);
        return NextResponse.json(result);
      }

      case 'radar': {
        if (!slug) {
          return NextResponse.json({ error: 'Vertical slug required' }, { status: 400 });
        }
        const result = await verticals.getRadar(slug);
        return NextResponse.json(result);
      }

      case 'versions': {
        if (!slug) {
          return NextResponse.json({ error: 'Vertical slug required' }, { status: 400 });
        }
        const result = await verticals.getVersions(slug);
        return NextResponse.json(result);
      }

      case 'dashboard': {
        const result = await verticals.dashboard();
        return NextResponse.json(result);
      }

      default: {
        // List all verticals
        const result = await verticals.list({
          include_sub: searchParams.get('include_sub') !== 'false',
          active_only: searchParams.get('active_only') !== 'false',
        });
        return NextResponse.json(result);
      }
    }
  } catch (error) {
    console.error('[SuperAdmin:Verticals] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verticals' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/superadmin/os/verticals
 * Create vertical or sub-resources
 */
export async function POST(request: NextRequest) {
  const session = await verifyAuth(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create': {
        const verticalConfig = body.vertical as VerticalConfig;

        // S147.1: Validate before save
        const validation = validateVerticalConfig(verticalConfig);
        if (!validation.valid) {
          return NextResponse.json({
            success: false,
            error: 'Validation failed',
            validation,
          }, { status: 400 });
        }

        // Save to local DB first
        const dbResult = await createVerticalDB(verticalConfig, 'superadmin');
        if (!dbResult.success) {
          return NextResponse.json({
            success: false,
            error: dbResult.error,
            validation: dbResult.validation,
          }, { status: 400 });
        }

        // Then propagate to OS
        const osResult = await verticals.create(body.vertical);

        // Trigger OS kernel hot reload
        if (osResult.success) {
          const reloadResult = await kernelLoader.reloadVertical(verticalConfig.slug);
          return NextResponse.json({
            ...osResult,
            localDB: { saved: true, id: dbResult.data?.id },
            osReload: reloadResult,
            validation,
          });
        }

        return NextResponse.json({
          ...osResult,
          localDB: { saved: true, id: dbResult.data?.id },
          validation,
        });
      }

      case 'clone': {
        if (!body.slug || !body.new_slug || !body.new_name) {
          return NextResponse.json(
            { error: 'slug, new_slug, and new_name are required' },
            { status: 400 }
          );
        }
        const result = await verticals.clone(body.slug, body.new_slug, body.new_name);
        return NextResponse.json(result);
      }

      case 'create-signal': {
        if (!body.slug) {
          return NextResponse.json({ error: 'Vertical slug required' }, { status: 400 });
        }
        const result = await verticals.createSignal(body.slug, body.signal);
        return NextResponse.json(result);
      }

      case 'create-scoring': {
        if (!body.slug) {
          return NextResponse.json({ error: 'Vertical slug required' }, { status: 400 });
        }
        const result = await verticals.createScoring(body.slug, body.template);
        return NextResponse.json(result);
      }

      case 'create-journey': {
        if (!body.slug) {
          return NextResponse.json({ error: 'Vertical slug required' }, { status: 400 });
        }
        const result = await verticals.createJourney(body.slug, body.journey);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: create, clone, create-signal, create-scoring, create-journey' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[SuperAdmin:Verticals] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to execute vertical operation' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/superadmin/os/verticals
 * Update vertical with validation and hot reload
 */
export async function PATCH(request: NextRequest) {
  const session = await verifyAuth(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug, updates, change_reason } = body;

    if (!slug) {
      return NextResponse.json({ error: 'Vertical slug required' }, { status: 400 });
    }

    // Get current config for validation
    const current = await getVerticalDB(slug);
    if (current) {
      // S147.1: Validate update
      const validation = validateVerticalUpdate(
        { slug: current.slug, name: current.name, config: current.config },
        updates as Partial<VerticalConfig>
      );

      if (!validation.valid) {
        return NextResponse.json({
          success: false,
          error: 'Validation failed',
          validation,
        }, { status: 400 });
      }

      // Save to local DB with version tracking
      const dbResult = await updateVerticalDB(slug, updates, 'superadmin', change_reason);
      if (!dbResult.success) {
        return NextResponse.json({
          success: false,
          error: dbResult.error,
          validation: dbResult.validation,
        }, { status: 400 });
      }
    }

    // Propagate to OS
    const result = await verticals.update(slug, updates);

    // Trigger OS kernel hot reload
    if (result.success) {
      const reloadResult = await kernelLoader.reloadVertical(slug);
      return NextResponse.json({
        ...result,
        osReload: reloadResult,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[SuperAdmin:Verticals] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update vertical' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/superadmin/os/verticals
 * Delete vertical
 */
export async function DELETE(request: NextRequest) {
  const session = await verifyAuth(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Vertical slug required' }, { status: 400 });
    }

    const result = await verticals.delete(slug);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[SuperAdmin:Verticals] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete vertical' },
      { status: 500 }
    );
  }
}
