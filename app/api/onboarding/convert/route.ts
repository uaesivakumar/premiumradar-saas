/**
 * S348-F2: Demo → Real User Conversion API
 * Sprint: S348 - PLG Proof Pack
 *
 * Converts a demo user to a real user with EXPLICIT action.
 * This is NOT auto-upgrade. User must explicitly request conversion.
 *
 * Guardrails:
 * - User must currently be a demo user (is_demo = true)
 * - Conversion requires explicit POST (no implicit upgrade)
 * - Emits DEMO_CONVERTED business event with full context
 * - If proof is weak, conversion fails (not auto-upgrade)
 *
 * Flow:
 * 1. Validate user is demo user
 * 2. Validate conversion requirements (email verified, etc.)
 * 3. Update user.is_demo = false
 * 4. Emit DEMO_CONVERTED event
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { query, queryOne, getPool } from '@/lib/db/client';
import { getUserById, getUserProfile, User, UserProfile } from '@/lib/db/users';
import { emitBusinessEvent } from '@/lib/events/event-emitter';
import { ResolvedContext } from '@/lib/auth/session/session-context';

// ============================================================
// TYPES
// ============================================================

interface DemoConversionRequest {
  // Optional: reason for conversion (for attribution)
  conversionReason?: 'trial_complete' | 'feature_unlock' | 'manual_request';
  // Optional: additional metadata for attribution
  attributionSource?: string;
}

interface DemoConversionResponse {
  success: boolean;
  converted?: {
    userId: string;
    previouslyDemo: boolean;
    convertedAt: string;
  };
  error?: string;
  errorCode?: 'NOT_DEMO_USER' | 'ALREADY_CONVERTED' | 'CONVERSION_BLOCKED' | 'NOT_AUTHENTICATED';
}

// ============================================================
// POST: Convert demo user to real user
// ============================================================

export async function POST(request: NextRequest): Promise<NextResponse<DemoConversionResponse>> {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          errorCode: 'NOT_AUTHENTICATED',
        },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({})) as DemoConversionRequest;

    // Get current user
    const user = await getUserById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // S348 CRITICAL GUARDRAIL: Only demo users can be converted
    if (!user.is_demo) {
      return NextResponse.json(
        {
          success: false,
          error: 'User is not a demo user',
          errorCode: 'NOT_DEMO_USER',
        },
        { status: 400 }
      );
    }

    // Get user profile for context
    const profile = await getUserProfile(session.user.id);

    // S348 GUARDRAIL: Check conversion requirements
    // In future: could require email verification, minimum trial period, etc.
    const conversionRequirements = checkConversionRequirements(user, profile);
    if (!conversionRequirements.canConvert) {
      return NextResponse.json(
        {
          success: false,
          error: conversionRequirements.reason || 'Conversion requirements not met',
          errorCode: 'CONVERSION_BLOCKED',
        },
        { status: 400 }
      );
    }

    const pool = getPool();
    const client = await pool.connect();
    const convertedAt = new Date().toISOString();

    try {
      await client.query('BEGIN');

      // Step 1: Update user - set is_demo = false
      await client.query(
        `UPDATE users
         SET is_demo = false, updated_at = NOW()
         WHERE id = $1`,
        [user.id]
      );

      // Step 2: Update profile to record conversion
      await client.query(
        `UPDATE user_profiles
         SET
           metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
             'demo_converted', true,
             'demo_converted_at', $2,
             'conversion_reason', $3,
             'attribution_source', $4
           ),
           updated_at = NOW()
         WHERE user_id = $1`,
        [
          user.id,
          convertedAt,
          body.conversionReason || 'manual_request',
          body.attributionSource || null,
        ]
      );

      await client.query('COMMIT');

      // Step 3: Emit DEMO_CONVERTED business event (AFTER transaction commits)
      // Map role to ValidRole (S348 users are INDIVIDUAL_USER or ENTERPRISE_USER)
      const validRole = ['SUPER_ADMIN', 'ENTERPRISE_ADMIN', 'ENTERPRISE_USER', 'INDIVIDUAL_USER'].includes(user.role)
        ? (user.role as 'SUPER_ADMIN' | 'ENTERPRISE_ADMIN' | 'ENTERPRISE_USER' | 'INDIVIDUAL_USER')
        : 'INDIVIDUAL_USER';

      const ctx: ResolvedContext = {
        user_id: user.id,
        role: validRole,
        enterprise_id: user.enterprise_id,
        workspace_id: user.workspace_id,
        sub_vertical_id: profile?.sub_vertical || null,
        region_code: profile?.region_country || null,
        is_demo: false, // Now converted
        demo_type: null,
      };

      await emitBusinessEvent(ctx, {
        event_type: 'DEMO_CONVERTED',
        entity_type: 'USER',
        entity_id: user.id,
        metadata: {
          // Conversion details
          conversion_explicit: true, // S348: NOT auto-upgrade
          converted_at: convertedAt,
          conversion_reason: body.conversionReason || 'manual_request',
          attribution_source: body.attributionSource || null,

          // Previous state (for attribution)
          was_demo: true,
          demo_started_at: user.created_at,

          // Current state
          role: user.role,
          enterprise_bound: !!user.enterprise_id,
          workspace_bound: !!user.workspace_id,
          enterprise_id: user.enterprise_id,
          workspace_id: user.workspace_id,

          // Onboarding progress at conversion
          onboarding_completed: profile?.onboarding_completed || false,
          onboarding_step: profile?.onboarding_step || 'unknown',

          // PLG attribution
          plg_conversion: true,
        },
      });

      console.log('[S348-F2] Demo user converted to real user:', {
        userId: user.id,
        wasDemo: true,
        convertedAt,
        conversionReason: body.conversionReason || 'manual_request',
      });

      return NextResponse.json({
        success: true,
        converted: {
          userId: user.id,
          previouslyDemo: true,
          convertedAt,
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[S348-F2] POST /api/onboarding/convert error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to convert demo user' },
      { status: 500 }
    );
  }
}

// ============================================================
// GET: Check if user can convert (preview)
// ============================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await getUserById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is a demo user
    if (!user.is_demo) {
      return NextResponse.json({
        success: true,
        canConvert: false,
        reason: 'User is not a demo user',
        alreadyConverted: true,
      });
    }

    const profile = await getUserProfile(session.user.id);
    const requirements = checkConversionRequirements(user, profile);

    return NextResponse.json({
      success: true,
      canConvert: requirements.canConvert,
      reason: requirements.reason,
      requirements: requirements.details,
      currentState: {
        isDemo: user.is_demo,
        role: user.role,
        enterpriseBound: !!user.enterprise_id,
        workspaceBound: !!user.workspace_id,
        onboardingCompleted: profile?.onboarding_completed || false,
      },
    });
  } catch (error) {
    console.error('[S348-F2] GET /api/onboarding/convert error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check conversion status' },
      { status: 500 }
    );
  }
}

// ============================================================
// HELPERS
// ============================================================

interface ConversionRequirements {
  canConvert: boolean;
  reason?: string;
  details?: {
    emailVerified: boolean;
    hasProfile: boolean;
    minimumTrialMet: boolean;
  };
}

function checkConversionRequirements(
  user: User,
  profile: UserProfile | null
): ConversionRequirements {
  // S348: Define clear conversion requirements
  // For now, we allow conversion if:
  // 1. User exists (already checked)
  // 2. User is a demo user (already checked)
  // 3. User has a profile

  const hasProfile = !!profile;

  // Future requirements could include:
  // - Email verification (user.email_verified)
  // - Minimum trial period (e.g., 24 hours since signup)
  // - Feature usage (e.g., viewed at least N leads)

  // S348 PRINCIPLE: If proof is weak, conversion should fail
  // Currently requiring at minimum a profile exists

  if (!hasProfile) {
    return {
      canConvert: false,
      reason: 'User profile not found. Complete profile setup first.',
      details: {
        emailVerified: true, // Not enforced yet
        hasProfile: false,
        minimumTrialMet: true, // Not enforced yet
      },
    };
  }

  return {
    canConvert: true,
    details: {
      emailVerified: true,
      hasProfile: true,
      minimumTrialMet: true,
    },
  };
}
