/**
 * Super Admin API Providers Config API
 *
 * Proxies to UPR OS Provider APIs (S50).
 * Provides Super Admin with control over:
 * - API Providers (Apollo, SERP, OpenAI, etc.)
 * - Provider Configuration
 * - Rate Limits
 * - Health Monitoring
 * - Fallback Chains
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/superadmin/security';
import { providers } from '@/lib/os/os-client';

async function verifyAuth(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return verifySession(ip, userAgent);
}

/**
 * GET /api/superadmin/os/providers
 * List providers or get specific provider details
 */
export async function GET(request: NextRequest) {
  const session = await verifyAuth(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const idOrSlug = searchParams.get('id');

    switch (action) {
      case 'get': {
        if (!idOrSlug) {
          return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
        }
        const result = await providers.get(idOrSlug);
        return NextResponse.json(result);
      }

      case 'config': {
        if (!idOrSlug) {
          return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
        }
        const result = await providers.getConfig(idOrSlug);
        return NextResponse.json(result);
      }

      case 'rate-limits': {
        if (!idOrSlug) {
          return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
        }
        const result = await providers.getRateLimits(idOrSlug);
        return NextResponse.json(result);
      }

      case 'health': {
        if (!idOrSlug) {
          return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
        }
        const includeHistory = searchParams.get('history') === 'true';
        const result = await providers.getHealth(idOrSlug, includeHistory);
        return NextResponse.json(result);
      }

      case 'chains': {
        const result = await providers.getChains();
        return NextResponse.json(result);
      }

      case 'chain': {
        const capability = searchParams.get('capability');
        if (!capability) {
          return NextResponse.json({ error: 'Capability required' }, { status: 400 });
        }
        const vertical = searchParams.get('vertical') || undefined;
        const result = await providers.getChain(capability, vertical);
        return NextResponse.json(result);
      }

      case 'dashboard': {
        const result = await providers.dashboard();
        return NextResponse.json(result);
      }

      default: {
        // List all providers
        const result = await providers.list({
          type: searchParams.get('type') || undefined,
          status: searchParams.get('status') || undefined,
          capability: searchParams.get('capability') || undefined,
          vertical: searchParams.get('vertical') || undefined,
          includeHealth: searchParams.get('includeHealth') !== 'false',
        });
        return NextResponse.json(result);
      }
    }
  } catch (error) {
    console.error('[SuperAdmin:Providers] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/superadmin/os/providers
 * Create provider or execute provider operations
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
        const result = await providers.create(body.provider);
        return NextResponse.json(result);
      }

      case 'set-config': {
        if (!body.id) {
          return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
        }
        const result = await providers.setConfig(body.id, body.config);
        return NextResponse.json(result);
      }

      case 'check-health': {
        if (!body.id) {
          return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
        }
        const result = await providers.checkHealth(body.id);
        return NextResponse.json(result);
      }

      case 'select': {
        if (!body.capability) {
          return NextResponse.json({ error: 'Capability required' }, { status: 400 });
        }
        const result = await providers.select(body.capability, {
          vertical: body.vertical,
          limit: body.limit,
        });
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: create, set-config, check-health, select' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[SuperAdmin:Providers] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to execute provider operation' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/superadmin/os/providers
 * Update provider
 */
export async function PATCH(request: NextRequest) {
  const session = await verifyAuth(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
    }

    const result = await providers.update(id, updates);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[SuperAdmin:Providers] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update provider' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/superadmin/os/providers
 * Delete (disable) provider
 */
export async function DELETE(request: NextRequest) {
  const session = await verifyAuth(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
    }

    const result = await providers.delete(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[SuperAdmin:Providers] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete provider' },
      { status: 500 }
    );
  }
}
