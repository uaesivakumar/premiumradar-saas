/**
 * S348-F4: Onboarding Context Selection API
 * Sprint: S348 - PLG Proof Pack
 *
 * Saves the user's selected context (vertical, sub-vertical, region).
 * Emits USER_UPDATED business event for every context change.
 *
 * This is a critical evidence point:
 * - Every choice is attributable
 * - No silent context changes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { updateUserProfile, getUserProfile } from '@/lib/db/users';
import { getResolvedContext, ResolvedContext } from '@/lib/auth/session/session-context';
import { emitBusinessEvent } from '@/lib/events/event-emitter';

// ============================================================
// TYPES
// ============================================================

interface ContextUpdateRequest {
  vertical?: string;
  subVertical?: string;
  regionCountry?: string;
  regionCity?: string;
  step?: 'vertical' | 'sub-vertical' | 'region' | 'complete';
}

interface ContextResponse {
  success: boolean;
  context?: {
    vertical: string;
    subVertical: string;
    regionCountry: string;
    regionCity: string | null;
    onboardingStep: string;
  };
  error?: string;
}

// ============================================================
// GET: Fetch current context
// ============================================================

export async function GET(): Promise<NextResponse<ContextResponse>> {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const profile = await getUserProfile(session.user.id);
    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      context: {
        vertical: profile.vertical,
        subVertical: profile.sub_vertical,
        regionCountry: profile.region_country,
        regionCity: profile.region_city,
        onboardingStep: profile.onboarding_step,
      },
    });
  } catch (error) {
    console.error('[S348-F4] GET /api/onboarding/context error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch context' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST: Update context (with business event)
// ============================================================

export async function POST(request: NextRequest): Promise<NextResponse<ContextResponse>> {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json() as ContextUpdateRequest;

    // Validate vertical (only banking is active)
    if (body.vertical && body.vertical !== 'banking') {
      return NextResponse.json(
        { success: false, error: 'Only Banking vertical is currently available' },
        { status: 400 }
      );
    }

    // Get current profile for comparison
    const oldProfile = await getUserProfile(session.user.id);
    if (!oldProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updates: {
      vertical?: string;
      sub_vertical?: string;
      region_country?: string;
      region_city?: string;
      onboarding_step?: string;
    } = {};

    if (body.vertical) updates.vertical = body.vertical;
    if (body.subVertical) updates.sub_vertical = body.subVertical;
    if (body.regionCountry) updates.region_country = body.regionCountry;
    if (body.regionCity) updates.region_city = body.regionCity;
    if (body.step) updates.onboarding_step = body.step;

    // Update profile
    const updatedProfile = await updateUserProfile(session.user.id, updates);
    if (!updatedProfile) {
      return NextResponse.json(
        { success: false, error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // S348-F4: Emit USER_UPDATED business event (NO SILENT CHANGES)
    // Create context for event emission
    const ctx: ResolvedContext = {
      user_id: session.user.id,
      role: (session.user.role as 'SUPER_ADMIN' | 'ENTERPRISE_ADMIN' | 'ENTERPRISE_USER' | 'INDIVIDUAL_USER') || 'INDIVIDUAL_USER',
      enterprise_id: session.enterpriseId || null,
      workspace_id: session.workspaceId || null,
      sub_vertical_id: null, // Will be populated after workspace binding
      region_code: body.regionCountry || oldProfile.region_country || null,
      is_demo: false,
      demo_type: null,
    };

    await emitBusinessEvent(ctx, {
      event_type: 'USER_UPDATED',
      entity_type: 'USER',
      entity_id: session.user.id,
      metadata: {
        context_selected: true,
        changes: {
          vertical: body.vertical ? { from: oldProfile.vertical, to: body.vertical } : undefined,
          sub_vertical: body.subVertical ? { from: oldProfile.sub_vertical, to: body.subVertical } : undefined,
          region_country: body.regionCountry ? { from: oldProfile.region_country, to: body.regionCountry } : undefined,
          region_city: body.regionCity ? { from: oldProfile.region_city, to: body.regionCity } : undefined,
          onboarding_step: body.step ? { from: oldProfile.onboarding_step, to: body.step } : undefined,
        },
        onboarding_progress: true,
        plg_flow: true,
      },
    });

    console.log('[S348-F4] Context updated with event:', {
      userId: session.user.id,
      changes: Object.keys(updates),
    });

    return NextResponse.json({
      success: true,
      context: {
        vertical: updatedProfile.vertical,
        subVertical: updatedProfile.sub_vertical,
        regionCountry: updatedProfile.region_country,
        regionCity: updatedProfile.region_city,
        onboardingStep: updatedProfile.onboarding_step,
      },
    });
  } catch (error) {
    console.error('[S348-F4] POST /api/onboarding/context error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update context' },
      { status: 500 }
    );
  }
}
