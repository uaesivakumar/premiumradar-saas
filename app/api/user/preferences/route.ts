/**
 * User Preferences API
 *
 * UPL v0.1 - Leaf-only preference layer
 *
 * GUARDRAILS (NON-NEGOTIABLE):
 * 1. No changes to: os_verticals, os_sub_verticals, os_personas,
 *    os_persona_policies, os_workspace_bindings
 * 2. UPL is LEAF-ONLY - soft overrides for tone, depth, pacing
 * 3. Policy wins silently on conflict
 * 4. Per-user per-workspace scoping
 * 5. Defaults always exist (no null preference state)
 *
 * NOT in Super Admin - this is a user-level endpoint.
 *
 * Authorization Code: S253-UPL-V01-20251223
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import {
  getResolvedUserPrefs,
  upsertUserPreferences,
  validatePreferences,
  mergeWithDefaults,
  userPreferencesTableExists,
  DEFAULT_PREFS,
  type UserPreferences,
} from '@/lib/db/user-preferences';

// ============================================================
// GET /api/user/preferences?workspace_id=...
// ============================================================

/**
 * Get resolved preferences (merged defaults + saved)
 *
 * Response:
 * {
 *   "success": true,
 *   "prefs": { ...mergedDefaultsAndSaved },
 *   "source": "DEFAULT|DB"
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Get workspace_id from query (required)
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspace_id');

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'workspace_id is required' },
        { status: 400 }
      );
    }

    // 3. Check if table exists (graceful degradation)
    const tableExists = await userPreferencesTableExists();
    if (!tableExists) {
      // Return defaults if table doesn't exist yet
      return NextResponse.json({
        success: true,
        prefs: DEFAULT_PREFS,
        source: 'DEFAULT',
        note: 'UPL table not yet migrated',
      });
    }

    // 4. Get resolved preferences
    // tenant_id and user_id from session (NEVER trust client)
    const resolved = await getResolvedUserPrefs({
      tenantId: session.tenantId,
      workspaceId,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      prefs: resolved.prefs,
      source: resolved.source,
    });
  } catch (error) {
    console.error('[UPL API] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get preferences',
        // Fail-safe: return defaults
        prefs: DEFAULT_PREFS,
        source: 'DEFAULT',
      },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT /api/user/preferences
// ============================================================

interface PutPreferencesBody {
  workspace_id: string;
  prefs: Partial<UserPreferences>;
}

/**
 * Update preferences (upsert)
 *
 * Body:
 * {
 *   "workspace_id": "demo-workspace-001",
 *   "prefs": { "verbosity": "low", "risk_tolerance": "conservative" }
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "prefs": { ...mergedPrefs },
 *   "updated": true
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    // 1. Authenticate
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Parse body
    let body: PutPreferencesBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // 3. Validate required fields
    if (!body.workspace_id) {
      return NextResponse.json(
        { success: false, error: 'workspace_id is required' },
        { status: 400 }
      );
    }

    if (!body.prefs || typeof body.prefs !== 'object') {
      return NextResponse.json(
        { success: false, error: 'prefs object is required' },
        { status: 400 }
      );
    }

    // 4. Validate preferences (strict whitelist)
    const validationError = validatePreferences(body.prefs);
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 }
      );
    }

    // 5. Check if table exists
    const tableExists = await userPreferencesTableExists();
    if (!tableExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'UPL table not yet migrated. Please run migration first.',
        },
        { status: 503 }
      );
    }

    // 6. Upsert preferences
    // tenant_id and user_id from session (NEVER trust client)
    const row = await upsertUserPreferences(
      session.tenantId,
      body.workspace_id,
      session.user.id,
      body.prefs
    );

    // 7. Return merged result
    const mergedPrefs = mergeWithDefaults(row.prefs);

    return NextResponse.json({
      success: true,
      prefs: mergedPrefs,
      updated: true,
      updated_at: row.updated_at,
    });
  } catch (error) {
    console.error('[UPL API] PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
