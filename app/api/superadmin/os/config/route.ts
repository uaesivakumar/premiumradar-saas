/**
 * Super Admin OS Config API
 *
 * Proxies to UPR OS Config APIs (S55).
 * Provides Super Admin with control over:
 * - System Configuration Namespaces
 * - Config Values with Versioning
 * - Presets
 * - Hot Reload
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/superadmin/security';
import { config } from '@/lib/os/os-client';

async function verifyAuth(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return verifySession(ip, userAgent);
}

/**
 * GET /api/superadmin/os/config
 * Get config summary or specific configs
 */
export async function GET(request: NextRequest) {
  const session = await verifyAuth(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const namespace = searchParams.get('namespace');
    const key = searchParams.get('key');

    switch (action) {
      case 'namespace': {
        if (!namespace) {
          return NextResponse.json({ error: 'Namespace required' }, { status: 400 });
        }
        const result = await config.getNamespace(namespace);
        return NextResponse.json(result);
      }

      case 'get': {
        if (!namespace || !key) {
          return NextResponse.json({ error: 'Namespace and key required' }, { status: 400 });
        }
        const result = await config.get(namespace, key);
        return NextResponse.json(result);
      }

      case 'versions': {
        if (!namespace || !key) {
          return NextResponse.json({ error: 'Namespace and key required' }, { status: 400 });
        }
        const result = await config.getVersions(namespace, key);
        return NextResponse.json(result);
      }

      case 'presets': {
        const result = await config.getPresets();
        return NextResponse.json(result);
      }

      default: {
        // Return summary
        const result = await config.getSummary();
        return NextResponse.json(result);
      }
    }
  } catch (error) {
    console.error('[SuperAdmin:Config] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch config' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/superadmin/os/config
 * Set config value or execute config operations
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
      case 'set': {
        if (!body.namespace || !body.key || body.value === undefined) {
          return NextResponse.json(
            { error: 'Namespace, key, and value required' },
            { status: 400 }
          );
        }
        const result = await config.set(body.namespace, body.key, body.value, {
          description: body.description,
          value_type: body.value_type,
          updated_by: session.session?.email,
        });
        return NextResponse.json(result);
      }

      case 'rollback': {
        if (!body.namespace || !body.key || body.version === undefined) {
          return NextResponse.json(
            { error: 'Namespace, key, and version required' },
            { status: 400 }
          );
        }
        const result = await config.rollback(body.namespace, body.key, body.version);
        return NextResponse.json(result);
      }

      case 'apply-preset': {
        if (!body.slug) {
          return NextResponse.json({ error: 'Preset slug required' }, { status: 400 });
        }
        const result = await config.applyPreset(body.slug);
        return NextResponse.json(result);
      }

      case 'reload': {
        const result = await config.reload();
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: set, rollback, apply-preset, reload' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[SuperAdmin:Config] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to execute config operation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/superadmin/os/config
 * Delete config value
 */
export async function DELETE(request: NextRequest) {
  const session = await verifyAuth(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const namespace = searchParams.get('namespace');
    const key = searchParams.get('key');

    if (!namespace || !key) {
      return NextResponse.json({ error: 'Namespace and key required' }, { status: 400 });
    }

    const result = await config.delete(namespace, key);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[SuperAdmin:Config] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete config' },
      { status: 500 }
    );
  }
}
