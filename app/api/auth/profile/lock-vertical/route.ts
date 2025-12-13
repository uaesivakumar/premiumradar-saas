/**
 * VS10.3: Lock Vertical API Route
 * Sprint: S1 (VS10)
 *
 * Locks user's vertical selection after onboarding.
 * Once locked, vertical cannot be changed without admin override.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth/session/enhanced-session';
import { updateUserProfile, lockUserVertical, getUserProfile } from '@/lib/db/users';

// ============================================================
// TYPES
// ============================================================

interface LockVerticalRequest {
  vertical: string;
  subVertical?: string;
  regionCountry?: string;
}

interface LockVerticalResponse {
  success: boolean;
  message?: string;
  error?: string;
  profile?: {
    vertical: string;
    subVertical: string;
    regionCountry: string;
    locked: boolean;
  };
}

// ============================================================
// HANDLER
// ============================================================

export async function POST(request: NextRequest): Promise<NextResponse<LockVerticalResponse>> {
  try {
    // Get session
    const sessionResult = await getSessionFromCookies();

    if (!sessionResult.success || !sessionResult.session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = sessionResult.session.user_id;

    // Parse request
    const body = await request.json();
    const { vertical, subVertical, regionCountry } = body as LockVerticalRequest;

    // Validate vertical (only banking is active)
    if (vertical && vertical !== 'banking') {
      return NextResponse.json(
        { success: false, error: 'Only Banking vertical is currently available' },
        { status: 400 }
      );
    }

    // Get current profile
    const currentProfile = await getUserProfile(userId);

    if (!currentProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check if already locked
    if (currentProfile.vertical_locked) {
      return NextResponse.json({
        success: true,
        message: 'Vertical is already locked',
        profile: {
          vertical: currentProfile.vertical,
          subVertical: currentProfile.sub_vertical,
          regionCountry: currentProfile.region_country,
          locked: true,
        },
      });
    }

    // Update profile if new values provided
    if (vertical || subVertical || regionCountry) {
      await updateUserProfile(userId, {
        vertical: vertical || currentProfile.vertical,
        sub_vertical: subVertical || currentProfile.sub_vertical,
        region_country: regionCountry || currentProfile.region_country,
      });
    }

    // Lock the vertical
    const lockedProfile = await lockUserVertical(userId, 'user');

    if (!lockedProfile) {
      return NextResponse.json(
        { success: false, error: 'Failed to lock vertical' },
        { status: 500 }
      );
    }

    console.log('[VS10.3] Vertical locked:', {
      userId,
      vertical: lockedProfile.vertical,
      subVertical: lockedProfile.sub_vertical,
      regionCountry: lockedProfile.region_country,
    });

    return NextResponse.json({
      success: true,
      message: 'Vertical locked successfully',
      profile: {
        vertical: lockedProfile.vertical,
        subVertical: lockedProfile.sub_vertical,
        regionCountry: lockedProfile.region_country,
        locked: true,
      },
    });

  } catch (error) {
    console.error('[LockVertical] Error:', error);

    if (error instanceof Error && error.message.includes('already locked')) {
      return NextResponse.json(
        { success: false, error: 'Vertical is already locked. Contact admin to change.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to lock vertical' },
      { status: 500 }
    );
  }
}

/**
 * GET: Get current profile lock status
 */
export async function GET(): Promise<NextResponse<LockVerticalResponse>> {
  try {
    const sessionResult = await getSessionFromCookies();

    if (!sessionResult.success || !sessionResult.session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const profile = await getUserProfile(sessionResult.session.user_id);

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        vertical: profile.vertical,
        subVertical: profile.sub_vertical,
        regionCountry: profile.region_country,
        locked: profile.vertical_locked,
      },
    });

  } catch (error) {
    console.error('[GetProfile] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get profile' },
      { status: 500 }
    );
  }
}
