/**
 * Super Admin Personas API (S148)
 *
 * Full CRUD for persona management with:
 * - Schema validation before save
 * - Version tracking with rollback
 * - Deprecation instead of immediate delete
 * - OS kernel hot reload on change
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/superadmin/security';
import {
  listPersonas,
  getPersona,
  createPersona,
  updatePersona,
  deprecatePersona,
  reactivatePersona,
  archivePersona,
  getPersonaVersionHistory,
  rollbackPersonaToVersion,
  comparePersonaVersions,
  getPersonaAuditLog,
} from '@/lib/db/personas';
import { kernelLoader } from '@/lib/os/kernel-loader';
import type { PersonaConfig } from '@/lib/os/validation/persona-schema';

async function verifyAuth(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return verifySession(ip, userAgent);
}

/**
 * GET /api/superadmin/personas
 * List personas or get specific persona details
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
          return NextResponse.json({ error: 'Persona slug required' }, { status: 400 });
        }
        const persona = await getPersona(slug);
        if (!persona) {
          return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: persona });
      }

      case 'versions': {
        if (!slug) {
          return NextResponse.json({ error: 'Persona slug required' }, { status: 400 });
        }
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const versions = await getPersonaVersionHistory(slug, limit);
        return NextResponse.json({ success: true, data: { versions, total: versions.length } });
      }

      case 'compare': {
        if (!slug) {
          return NextResponse.json({ error: 'Persona slug required' }, { status: 400 });
        }
        const v1 = parseInt(searchParams.get('v1') || '0', 10);
        const v2 = parseInt(searchParams.get('v2') || '0', 10);
        if (!v1 || !v2) {
          return NextResponse.json({ error: 'Both v1 and v2 version numbers required' }, { status: 400 });
        }
        const comparison = await comparePersonaVersions(slug, v1, v2);
        return NextResponse.json({ success: true, data: comparison });
      }

      case 'audit': {
        if (!slug) {
          return NextResponse.json({ error: 'Persona slug required' }, { status: 400 });
        }
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const auditLog = await getPersonaAuditLog(slug, limit);
        return NextResponse.json({ success: true, data: { logs: auditLog, total: auditLog.length } });
      }

      default: {
        // List all personas
        const subVerticalSlug = searchParams.get('sub_vertical') || undefined;
        const activeOnly = searchParams.get('active_only') !== 'false';
        const includeDeprecated = searchParams.get('include_deprecated') === 'true';

        const personas = await listPersonas({
          subVerticalSlug,
          activeOnly,
          includeDeprecated,
        });

        return NextResponse.json({
          success: true,
          data: { personas, total: personas.length },
        });
      }
    }
  } catch (error) {
    console.error('[SuperAdmin:Personas] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch personas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/superadmin/personas
 * Create persona or perform actions (rollback, etc.)
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
        const { persona } = body as { persona: PersonaConfig };
        if (!persona) {
          return NextResponse.json({ error: 'Persona config required' }, { status: 400 });
        }

        const result = await createPersona(persona, 'superadmin');

        if (!result.success) {
          return NextResponse.json({
            success: false,
            error: result.error,
            validation: result.validation,
          }, { status: 400 });
        }

        // Trigger OS kernel reload for the new persona
        if (result.data) {
          const reloadResult = await kernelLoader.reloadPersona(
            result.data.slug,
            result.data.sub_vertical_slug
          );

          return NextResponse.json({
            success: true,
            data: result.data,
            validation: result.validation,
            osReload: reloadResult,
          });
        }

        return NextResponse.json({ success: true, data: result.data, validation: result.validation });
      }

      case 'rollback': {
        const { slug, version } = body as { slug: string; version: number };
        if (!slug || !version) {
          return NextResponse.json({ error: 'Slug and version required' }, { status: 400 });
        }

        const result = await rollbackPersonaToVersion(slug, version, 'superadmin');

        if (!result.success) {
          return NextResponse.json({
            success: false,
            error: result.error,
            validation: result.validation,
          }, { status: 400 });
        }

        // Trigger OS kernel reload after rollback
        if (result.data) {
          const reloadResult = await kernelLoader.reloadPersona(
            result.data.slug,
            result.data.sub_vertical_slug
          );

          return NextResponse.json({
            success: true,
            data: result.data,
            osReload: reloadResult,
            message: `Rolled back to version ${version}`,
          });
        }

        return NextResponse.json({ success: true, data: result.data });
      }

      case 'reactivate': {
        const { slug } = body as { slug: string };
        if (!slug) {
          return NextResponse.json({ error: 'Persona slug required' }, { status: 400 });
        }

        const result = await reactivatePersona(slug, 'superadmin');

        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }

        // Trigger OS kernel reload
        if (result.data) {
          await kernelLoader.reloadPersona(result.data.slug, result.data.sub_vertical_slug);
        }

        return NextResponse.json({ success: true, data: result.data });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: create, rollback, reactivate' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[SuperAdmin:Personas] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to execute persona operation' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/superadmin/personas
 * Update persona
 */
export async function PATCH(request: NextRequest) {
  const session = await verifyAuth(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug, updates, change_reason } = body as {
      slug: string;
      updates: Partial<PersonaConfig>;
      change_reason?: string;
    };

    if (!slug) {
      return NextResponse.json({ error: 'Persona slug required' }, { status: 400 });
    }

    const result = await updatePersona(slug, updates, 'superadmin', change_reason);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
        validation: result.validation,
      }, { status: 400 });
    }

    // Trigger OS kernel reload
    if (result.data) {
      const reloadResult = await kernelLoader.reloadPersona(
        result.data.slug,
        result.data.sub_vertical_slug
      );

      return NextResponse.json({
        success: true,
        data: result.data,
        validation: result.validation,
        osReload: reloadResult,
      });
    }

    return NextResponse.json({ success: true, data: result.data, validation: result.validation });
  } catch (error) {
    console.error('[SuperAdmin:Personas] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update persona' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/superadmin/personas
 * Deprecate or archive persona (NEVER hard delete)
 */
export async function DELETE(request: NextRequest) {
  const session = await verifyAuth(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const mode = searchParams.get('mode') || 'deprecate'; // deprecate or archive

    if (!slug) {
      return NextResponse.json({ error: 'Persona slug required' }, { status: 400 });
    }

    // Get persona first to get sub_vertical_slug for reload
    const persona = await getPersona(slug);
    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    let result;
    if (mode === 'archive') {
      result = await archivePersona(slug, 'superadmin');
    } else {
      const reason = searchParams.get('reason') || undefined;
      result = await deprecatePersona(slug, 'superadmin', reason);
    }

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    // Trigger OS kernel reload to remove deprecated persona
    await kernelLoader.reloadPersona(slug, persona.sub_vertical_slug);

    return NextResponse.json({
      success: true,
      message: mode === 'archive'
        ? `Persona "${slug}" archived (cannot be recovered)`
        : `Persona "${slug}" deprecated (can be reactivated)`,
    });
  } catch (error) {
    console.error('[SuperAdmin:Personas] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete persona' },
      { status: 500 }
    );
  }
}
