/**
 * Super Admin PLG - Evidence Pack API
 *
 * Returns the complete evidence pack for a PLG user.
 * Includes signup, onboarding, conversion, and activity evidence.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/client';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Validate Super Admin session
    const session = await validateSuperAdminSession();
    if (!session.valid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId } = params;

    // Get user with profile
    const userResult = await query(
      `SELECT
        u.*,
        up.vertical,
        up.sub_vertical,
        up.region_country,
        up.onboarding_completed,
        up.onboarding_step,
        up.metadata as profile_metadata
      FROM users u
      LEFT JOIN user_profiles up ON up.user_id = u.id
      WHERE u.id = $1`,
      [userId]
    );

    if (userResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const user = (userResult as any)[0];
    const profileMetadata = user.profile_metadata || {};

    // Get signup event
    const signupResult = await query(
      `SELECT * FROM business_events
       WHERE entity_type = 'USER'
         AND entity_id = $1
         AND event_type = 'USER_CREATED'
       ORDER BY created_at ASC
       LIMIT 1`,
      [userId]
    );

    const signupEvent = (signupResult as any)[0];
    const signupMetadata = signupEvent?.metadata || {};

    // Get onboarding events
    const onboardingResult = await query(
      `SELECT * FROM business_events
       WHERE entity_type = 'USER'
         AND entity_id = $1
         AND event_type = 'USER_UPDATED'
         AND (
           metadata ? 'context_selected'
           OR metadata ? 'onboarding_progress'
           OR metadata ? 'vertical'
           OR metadata ? 'sub_vertical'
           OR metadata ? 'region'
         )
       ORDER BY created_at ASC`,
      [userId]
    );

    const onboardingSteps = onboardingResult.map((event: any) => {
      const meta = event.metadata || {};
      const changes = meta.changes || {};
      return {
        timestamp: event.created_at,
        step: meta.onboarding_step || 'context_update',
        value: Object.entries(changes)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ') || 'Updated',
      };
    });

    // Get conversion event
    const conversionResult = await query(
      `SELECT * FROM business_events
       WHERE entity_type = 'USER'
         AND entity_id = $1
         AND event_type = 'DEMO_CONVERTED'
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    const conversionEvent = (conversionResult as any)[0];
    const conversionMetadata = conversionEvent?.metadata || {};

    // Get all events for this user (recent)
    const eventsResult = await query(
      `SELECT event_type, created_at, metadata
       FROM business_events
       WHERE entity_type = 'USER'
         AND entity_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    // Calculate activity metrics
    const loginEventsResult = await query(
      `SELECT COUNT(*) as count
       FROM business_events
       WHERE entity_type = 'USER'
         AND entity_id = $1
         AND event_type = 'USER_LOGIN'`,
      [userId]
    );

    const loginCount = parseInt((loginEventsResult as any)[0]?.count || '0');

    // Days active (unique days with events)
    const daysActiveResult = await query(
      `SELECT COUNT(DISTINCT DATE(created_at)) as days
       FROM business_events
       WHERE entity_type = 'USER'
         AND entity_id = $1`,
      [userId]
    );

    const daysActive = parseInt((daysActiveResult as any)[0]?.days || '0');

    // Activity score
    let activityScore = 0;
    if (user.last_login_at) {
      const daysSinceLogin = Math.floor(
        (Date.now() - new Date(user.last_login_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      activityScore = Math.max(0, 100 - daysSinceLogin * 5);
    }

    // Analyze non-conversion reason
    let nonConversionReason = null;
    if (user.is_demo) {
      const daysSinceSignup = Math.floor(
        (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceSignup < 3) {
        nonConversionReason = 'Recent signup (< 3 days)';
      } else if (!user.last_login_at || activityScore < 20) {
        nonConversionReason = 'Inactivity - no recent engagement';
      } else if (!user.vertical || !user.sub_vertical) {
        nonConversionReason = 'No context selected - friction at onboarding';
      } else if (!user.onboarding_completed) {
        nonConversionReason = 'Incomplete onboarding - dropped off';
      } else {
        nonConversionReason = 'Active but not converted - possible mismatch';
      }
    }

    // Build evidence pack
    const evidencePack = {
      user_id: userId,
      email: user.email,
      generated_at: new Date().toISOString(),

      signup: {
        created_at: user.created_at,
        source: signupMetadata.signup_source || profileMetadata.signup_source || 'direct',
        initial_role: signupMetadata.role || user.role,
        plg_signup: signupMetadata.plg_signup || false,
        was_demo: signupMetadata.is_demo || user.is_demo,
      },

      onboarding: {
        completed: user.onboarding_completed || false,
        current_step: user.onboarding_step,
        vertical: user.vertical,
        sub_vertical: user.sub_vertical,
        region: user.region_country,
        steps: onboardingSteps,
      },

      conversion: conversionEvent
        ? {
            converted: true,
            converted_at: conversionEvent.created_at,
            reason: conversionMetadata.conversion_reason || 'unknown',
            was_explicit: conversionMetadata.conversion_explicit || false,
            days_as_demo: conversionMetadata.days_as_demo || null,
            attribution_source: conversionMetadata.attribution_source,
          }
        : null,

      non_conversion_reason: nonConversionReason,

      activity: {
        last_login: user.last_login_at,
        login_count: loginCount,
        days_active: daysActive,
        score: activityScore,
      },

      current_state: {
        is_demo: user.is_demo,
        is_active: user.is_active,
        role: user.role,
        enterprise_id: user.enterprise_id,
        workspace_id: user.workspace_id,
      },

      events: eventsResult,
    };

    return NextResponse.json({
      success: true,
      data: evidencePack,
    });
  } catch (error) {
    console.error('[PLG Admin] Evidence error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch evidence' },
      { status: 500 }
    );
  }
}
