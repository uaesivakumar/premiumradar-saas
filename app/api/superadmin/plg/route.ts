/**
 * Super Admin PLG Governance API
 *
 * Lists ALL users with full lifecycle data and governance controls.
 * PLG Governance Layer - Super Admin control over ALL user types.
 *
 * Supports filtering by:
 * - role: SUPER_ADMIN, ENTERPRISE_ADMIN, ENTERPRISE_USER, INDIVIDUAL_USER, or 'all'
 * - status: all, demo, real, suspended
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/client';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';

export async function GET(request: NextRequest) {
  try {
    // Validate Super Admin session
    const session = await validateSuperAdminSession();
    if (!session.valid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status'); // all, demo, real, suspended
    const roleFilter = searchParams.get('role'); // all, SUPER_ADMIN, ENTERPRISE_ADMIN, ENTERPRISE_USER, INDIVIDUAL_USER

    // Build WHERE clause - now supports ALL roles
    const whereClauses: string[] = ['1=1'];

    // Role filter
    if (roleFilter && roleFilter !== 'all') {
      whereClauses.push(`u.role = '${roleFilter}'`);
    }

    // Status filter
    if (statusFilter === 'demo') {
      whereClauses.push('u.is_demo = true AND u.is_active = true');
    } else if (statusFilter === 'real') {
      whereClauses.push('u.is_demo = false AND u.is_active = true');
    } else if (statusFilter === 'suspended') {
      whereClauses.push('u.is_active = false');
    }

    const whereClause = whereClauses.join(' AND ');

    // Fetch PLG users with full context
    const usersResult = await query(`
      SELECT
        u.id,
        u.email,
        u.name,
        u.role,
        u.is_demo,
        u.is_active,
        u.created_at,
        u.last_login_at,
        u.enterprise_id,
        u.workspace_id,
        e.name as enterprise_name,
        w.name as workspace_name,
        up.vertical,
        up.sub_vertical,
        up.region_country,
        up.onboarding_completed,
        up.onboarding_step,
        up.metadata
      FROM users u
      LEFT JOIN enterprises e ON e.enterprise_id = u.enterprise_id
      LEFT JOIN workspaces w ON w.workspace_id = u.workspace_id
      LEFT JOIN user_profiles up ON up.user_id = u.id
      WHERE ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT 500
    `);

    // Calculate additional fields for each user
    const users = usersResult.map((user: any) => {
      const metadata = user.metadata || {};
      const createdAt = new Date(user.created_at);
      const now = new Date();
      const daysAsDemo = user.is_demo
        ? Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Simple activity score based on last login
      let activityScore = null;
      if (user.last_login_at) {
        const daysSinceLogin = Math.floor(
          (now.getTime() - new Date(user.last_login_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        activityScore = Math.max(0, 100 - daysSinceLogin * 5);
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_demo: user.is_demo,
        is_active: user.is_active,
        created_at: user.created_at,
        last_login_at: user.last_login_at,
        enterprise_id: user.enterprise_id,
        enterprise_name: user.enterprise_name,
        workspace_id: user.workspace_id,
        workspace_name: user.workspace_name,
        vertical: user.vertical,
        sub_vertical: user.sub_vertical,
        region_country: user.region_country,
        onboarding_completed: user.onboarding_completed || false,
        onboarding_step: user.onboarding_step,
        signup_source: metadata.signup_source || null,
        demo_started_at: user.is_demo ? user.created_at : null,
        converted_at: metadata.demo_converted_at || null,
        conversion_reason: metadata.conversion_reason || null,
        days_as_demo: daysAsDemo,
        activity_score: activityScore,
      };
    });

    // Calculate stats for current filter
    const totalUsers = users.length;
    const demoUsers = users.filter((u) => u.is_demo && u.is_active).length;
    const realUsers = users.filter((u) => !u.is_demo && u.is_active).length;
    const suspendedUsers = users.filter((u) => !u.is_active).length;

    // Role breakdown
    const roleBreakdown = {
      SUPER_ADMIN: users.filter((u) => u.role === 'SUPER_ADMIN').length,
      ENTERPRISE_ADMIN: users.filter((u) => u.role === 'ENTERPRISE_ADMIN').length,
      ENTERPRISE_USER: users.filter((u) => u.role === 'ENTERPRISE_USER').length,
      INDIVIDUAL_USER: users.filter((u) => u.role === 'INDIVIDUAL_USER').length,
    };

    // Conversions this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const conversionsResult = await query(`
      SELECT COUNT(*) as count
      FROM business_events
      WHERE event_type = 'DEMO_CONVERTED'
        AND timestamp >= $1
    `, [startOfMonth.toISOString()]);
    const convertedThisMonth = parseInt((conversionsResult as any)[0]?.count || '0');

    // Churned this month (suspended or deleted individual users)
    const churnedResult = await query(`
      SELECT COUNT(*) as count
      FROM business_events
      WHERE event_type IN ('USER_SUSPENDED', 'USER_DELETED')
        AND entity_type = 'USER'
        AND timestamp >= $1
        AND metadata->>'role' = 'INDIVIDUAL_USER'
    `, [startOfMonth.toISOString()]);
    const churnedThisMonth = parseInt((churnedResult as any)[0]?.count || '0');

    // Average days to convert
    const avgDaysResult = await query(`
      SELECT AVG(
        EXTRACT(EPOCH FROM (
          (metadata->>'converted_at')::timestamp - timestamp
        )) / 86400
      ) as avg_days
      FROM business_events
      WHERE event_type = 'DEMO_CONVERTED'
        AND metadata->>'converted_at' IS NOT NULL
    `);
    const avgDaysToConvert = (avgDaysResult as any)[0]?.avg_days
      ? Math.round(parseFloat((avgDaysResult as any)[0].avg_days))
      : null;

    // Onboarding completion rate
    const completedOnboarding = users.filter((u) => u.onboarding_completed).length;
    const onboardingCompletionRate = totalUsers > 0
      ? (completedOnboarding / totalUsers) * 100
      : 0;

    // Non-conversion reasons analysis
    const nonConversionReasons = analyzeNonConversion(users);

    return NextResponse.json({
      success: true,
      data: {
        users,
        stats: {
          total_users: totalUsers,
          demo_users: demoUsers,
          real_users: realUsers,
          suspended_users: suspendedUsers,
          converted_this_month: convertedThisMonth,
          churned_this_month: churnedThisMonth,
          avg_days_to_convert: avgDaysToConvert,
          onboarding_completion_rate: onboardingCompletionRate,
          role_breakdown: roleBreakdown,
        },
        non_conversion_reasons: nonConversionReasons,
      },
    });
  } catch (error) {
    console.error('[SuperAdmin PLG] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch PLG data' },
      { status: 500 }
    );
  }
}

// Analyze why users haven't converted
function analyzeNonConversion(users: any[]): { reason: string; count: number; percentage: number }[] {
  const demoUsers = users.filter((u) => u.is_demo && u.is_active);
  if (demoUsers.length === 0) return [];

  const reasons: Record<string, number> = {
    'Inactivity': 0,
    'Incomplete Onboarding': 0,
    'No Context Selected': 0,
    'Recent Signup': 0,
  };

  const now = new Date();
  demoUsers.forEach((user) => {
    const daysSinceSignup = Math.floor(
      (now.getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Recent signup (< 3 days) - give them time
    if (daysSinceSignup < 3) {
      reasons['Recent Signup']++;
      return;
    }

    // Inactivity - no login in 7+ days
    if (!user.last_login_at) {
      reasons['Inactivity']++;
      return;
    }
    const daysSinceLogin = Math.floor(
      (now.getTime() - new Date(user.last_login_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLogin > 7) {
      reasons['Inactivity']++;
      return;
    }

    // No context selected
    if (!user.vertical || !user.sub_vertical) {
      reasons['No Context Selected']++;
      return;
    }

    // Incomplete onboarding
    if (!user.onboarding_completed) {
      reasons['Incomplete Onboarding']++;
      return;
    }
  });

  return Object.entries(reasons)
    .filter(([_, count]) => count > 0)
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: Math.round((count / demoUsers.length) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}
