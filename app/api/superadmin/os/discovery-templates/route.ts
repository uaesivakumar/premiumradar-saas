/**
 * Super Admin Discovery Templates API (Sprint 77)
 *
 * Proxies to UPR OS /api/os/discovery-templates endpoint
 * Allows Super Admin to manage configurable search query templates
 * for live discovery per vertical/sub-vertical/region
 *
 * Templates control what SIVA searches for when a user triggers discovery.
 * This enables customization without code changes.
 *
 * Endpoints:
 * - GET    /api/superadmin/os/discovery-templates           - List templates
 * - POST   /api/superadmin/os/discovery-templates           - Create template
 * - PATCH  /api/superadmin/os/discovery-templates           - Update template
 * - DELETE /api/superadmin/os/discovery-templates           - Delete template
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/superadmin/security';

const OS_BASE_URL = process.env.UPR_OS_BASE_URL || 'https://upr-os-service-191599223867.us-central1.run.app';
const OS_TOKEN = process.env.PR_OS_TOKEN;

async function verifyAuth(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return verifySession(ip, userAgent);
}

async function callOSAPI(path: string, options: RequestInit = {}) {
  const url = `${OS_BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-pr-os-token': OS_TOKEN || '',
      ...options.headers,
    },
  });

  const data = await response.json();
  return { status: response.status, data };
}

/**
 * GET /api/superadmin/os/discovery-templates
 * List templates with optional filters
 *
 * Query params:
 * - vertical: Filter by vertical_id
 * - sub_vertical: Filter by sub_vertical_id
 * - region: Filter by region_code
 * - active_only: Only return active templates (default: true)
 * - id: Get single template by ID
 */
export async function GET(request: NextRequest) {
  const session = await verifyAuth(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Build query string
    const queryParams = new URLSearchParams();
    if (searchParams.get('vertical')) queryParams.set('vertical', searchParams.get('vertical')!);
    if (searchParams.get('sub_vertical')) queryParams.set('sub_vertical', searchParams.get('sub_vertical')!);
    if (searchParams.get('region')) queryParams.set('region', searchParams.get('region')!);
    if (searchParams.get('active_only')) queryParams.set('active_only', searchParams.get('active_only')!);

    const path = id
      ? `/api/os/discovery-templates/${id}`
      : `/api/os/discovery-templates?${queryParams.toString()}`;

    const { status, data } = await callOSAPI(path);
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error('[SuperAdmin:DiscoveryTemplates] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/superadmin/os/discovery-templates
 * Create new template or bulk create
 *
 * Body for single:
 * {
 *   vertical_id?: string,
 *   sub_vertical_id?: string,
 *   region_code?: string,
 *   query_template: string,
 *   query_type?: string,
 *   priority?: number,
 *   description?: string,
 *   is_active?: boolean
 * }
 *
 * Body for bulk:
 * {
 *   bulk: true,
 *   templates: [...array of templates]
 * }
 */
export async function POST(request: NextRequest) {
  const session = await verifyAuth(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const path = body.bulk
      ? '/api/os/discovery-templates/bulk'
      : '/api/os/discovery-templates';

    const { status, data } = await callOSAPI(path, {
      method: 'POST',
      body: JSON.stringify(body.bulk ? { templates: body.templates } : body),
    });

    return NextResponse.json(data, { status });
  } catch (error) {
    console.error('[SuperAdmin:DiscoveryTemplates] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/superadmin/os/discovery-templates
 * Update existing template
 *
 * Body:
 * {
 *   id: string (required),
 *   updates: {
 *     vertical_id?: string,
 *     sub_vertical_id?: string,
 *     region_code?: string,
 *     query_template?: string,
 *     query_type?: string,
 *     priority?: number,
 *     description?: string,
 *     is_active?: boolean
 *   }
 * }
 */
export async function PATCH(request: NextRequest) {
  const session = await verifyAuth(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Template id is required' },
        { status: 400 }
      );
    }

    const { status, data } = await callOSAPI(`/api/os/discovery-templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    return NextResponse.json(data, { status });
  } catch (error) {
    console.error('[SuperAdmin:DiscoveryTemplates] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/superadmin/os/discovery-templates
 * Delete template (soft delete by default)
 *
 * Query params:
 * - id: Template ID (required)
 * - hard: If 'true', permanently delete
 */
export async function DELETE(request: NextRequest) {
  const session = await verifyAuth(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const hard = searchParams.get('hard');

    if (!id) {
      return NextResponse.json(
        { error: 'Template id is required' },
        { status: 400 }
      );
    }

    const path = hard === 'true'
      ? `/api/os/discovery-templates/${id}?hard=true`
      : `/api/os/discovery-templates/${id}`;

    const { status, data } = await callOSAPI(path, {
      method: 'DELETE',
    });

    return NextResponse.json(data, { status });
  } catch (error) {
    console.error('[SuperAdmin:DiscoveryTemplates] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
