/**
 * Super Admin Stats API
 *
 * GET /api/superadmin/stats - Get real-time system statistics
 *
 * Returns:
 * - User counts (total, active, demo)
 * - Tenant counts
 * - Signal stats
 * - Database health
 * - API integration stats
 * - Recent activity
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifySession, getAccessLogs } from '@/lib/superadmin/security';
import { query, queryOne, healthCheck, getPool } from '@/lib/db/client';
import { getIntegrations } from '@/lib/integrations/api-integrations';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    demo: number;
    pending: number;
  };
  tenants: {
    total: number;
    active: number;
    trial: number;
  };
  signals: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  database: {
    healthy: boolean;
    connectionCount: number;
    maxConnections: number;
    queryTimeAvg: number;
    storageUsedMb: number;
    storageMaxMb: number;
  };
  api: {
    latencyP95: number;
    errorRate: number;
    cumulativeErrorRate: number;
    hasRecentErrors: boolean;
    integrations: Array<{
      provider: string;
      name: string;
      isActive: boolean;
      usageCount: number;
      errorCount: number;
      lastUsedAt: Date | null;
    }>;
  };
  outreach: {
    sentToday: number;
    openRate: number;
    replyRate: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
    status: 'success' | 'warning' | 'error';
  }>;
}

/**
 * GET - Fetch dashboard statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Verify super admin session
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               headersList.get('x-real-ip') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    const sessionResult = await verifySession(ip, userAgent);
    if (!sessionResult.valid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all stats in parallel
    const [
      userStats,
      tenantStats,
      signalStats,
      dbHealth,
      dbMetrics,
      integrations,
      accessLogs,
    ] = await Promise.all([
      getUserStats(),
      getTenantStats(),
      getSignalStats(),
      healthCheck(),
      getDatabaseMetrics(),
      getIntegrations({ activeOnly: false }),
      Promise.resolve(getAccessLogs(50)),
    ]);

    // Calculate API stats from integrations
    // Note: These are cumulative all-time counts, not recent/live error rates
    const totalUsage = integrations.reduce((sum, i) => sum + i.usageCount, 0);
    const totalErrors = integrations.reduce((sum, i) => sum + i.errorCount, 0);
    // For display purposes, show the cumulative rate but don't use it for health status
    const cumulativeErrorRate = totalUsage > 0 ? totalErrors / totalUsage : 0;

    // For system health, only consider if there were very recent errors (in last hour)
    // Check if any integration has lastErrorAt within last hour
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const hasRecentErrors = integrations.some(i =>
      i.lastErrorAt && new Date(i.lastErrorAt).getTime() > oneHourAgo
    );
    // Effective error rate for health: 0 if no recent errors, otherwise show cumulative
    const errorRate = hasRecentErrors ? cumulativeErrorRate : 0;

    // Transform access logs to activity feed format
    const recentActivity = accessLogs.slice(0, 10).map((log, idx) => ({
      id: `log_${idx}`,
      type: log.action.toLowerCase(),
      message: formatActivityMessage(log),
      timestamp: log.timestamp,
      status: log.success ? 'success' as const : log.action.includes('FAILED') ? 'error' as const : 'warning' as const,
    }));

    const stats: DashboardStats = {
      users: userStats,
      tenants: tenantStats,
      signals: signalStats,
      database: {
        healthy: dbHealth,
        ...dbMetrics,
      },
      api: {
        latencyP95: 142, // Would come from APM in production
        errorRate, // For system health (only counts recent errors)
        cumulativeErrorRate, // All-time error rate for reference
        hasRecentErrors,
        integrations: integrations.map(i => ({
          provider: i.provider,
          name: i.name,
          isActive: i.isActive,
          usageCount: i.usageCount,
          errorCount: i.errorCount,
          lastUsedAt: i.lastUsedAt || null,
        })),
      },
      outreach: {
        sentToday: 0, // Will be wired to outreach module
        openRate: 0,
        replyRate: 0,
      },
      recentActivity,
    };

    return NextResponse.json({
      success: true,
      data: stats,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[SuperAdmin Stats] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

/**
 * Get user statistics from database
 */
async function getUserStats(): Promise<DashboardStats['users']> {
  try {
    // Try to get real counts from users table
    const result = await queryOne<{
      total: string;
      active: string;
      demo: string;
      pending: string;
    }>(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active' OR status IS NULL) as active,
        COUNT(*) FILTER (WHERE email LIKE '%demo%' OR is_demo = true) as demo,
        COUNT(*) FILTER (WHERE status = 'pending') as pending
      FROM users
    `);

    if (result) {
      return {
        total: parseInt(result.total) || 0,
        active: parseInt(result.active) || 0,
        demo: parseInt(result.demo) || 0,
        pending: parseInt(result.pending) || 0,
      };
    }
  } catch (error) {
    console.log('[Stats] Users table not available, using defaults');
  }

  // Return defaults if table doesn't exist yet
  return { total: 0, active: 0, demo: 0, pending: 0 };
}

/**
 * Get tenant statistics from database
 */
async function getTenantStats(): Promise<DashboardStats['tenants']> {
  try {
    const result = await queryOne<{
      total: string;
      active: string;
      trial: string;
    }>(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'trial') as trial
      FROM tenants
    `);

    if (result) {
      return {
        total: parseInt(result.total) || 0,
        active: parseInt(result.active) || 0,
        trial: parseInt(result.trial) || 0,
      };
    }
  } catch (error) {
    console.log('[Stats] Tenants table not available, using defaults');
  }

  return { total: 0, active: 0, trial: 0 };
}

/**
 * Get signal statistics
 */
async function getSignalStats(): Promise<DashboardStats['signals']> {
  try {
    const result = await queryOne<{
      today: string;
      this_week: string;
      this_month: string;
    }>(`
      SELECT
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as this_week,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as this_month
      FROM signals
    `);

    if (result) {
      return {
        today: parseInt(result.today) || 0,
        thisWeek: parseInt(result.this_week) || 0,
        thisMonth: parseInt(result.this_month) || 0,
      };
    }
  } catch (error) {
    console.log('[Stats] Signals table not available, using defaults');
  }

  return { today: 0, thisWeek: 0, thisMonth: 0 };
}

/**
 * Get database metrics
 */
async function getDatabaseMetrics(): Promise<{
  connectionCount: number;
  maxConnections: number;
  queryTimeAvg: number;
  storageUsedMb: number;
  storageMaxMb: number;
}> {
  try {
    // Get connection count
    const pool = getPool();
    const connectionCount = pool.totalCount || 0;
    const maxConnections = 100; // Default max from pg pool config

    // Try to get database size
    let storageUsedMb = 0;
    try {
      const sizeResult = await queryOne<{ size_mb: string }>(`
        SELECT pg_database_size(current_database()) / 1024 / 1024 as size_mb
      `);
      storageUsedMb = parseFloat(sizeResult?.size_mb || '0');
    } catch {
      // Size query might not work on all hosts
    }

    return {
      connectionCount,
      maxConnections,
      queryTimeAvg: 12, // Would come from query logging in production
      storageUsedMb: Math.round(storageUsedMb),
      storageMaxMb: 10240, // 10GB default
    };
  } catch (error) {
    console.log('[Stats] Database metrics error:', error);
    return {
      connectionCount: 0,
      maxConnections: 100,
      queryTimeAvg: 0,
      storageUsedMb: 0,
      storageMaxMb: 10240,
    };
  }
}

/**
 * Format access log as activity message
 */
function formatActivityMessage(log: {
  action: string;
  email?: string;
  details?: string;
}): string {
  switch (log.action) {
    case 'LOGIN_SUCCESS':
      return `Super Admin login: ${log.email}`;
    case 'LOGIN_FAILED':
      return `Failed login attempt: ${log.email || 'unknown'}`;
    case 'LOGOUT':
      return `Super Admin logout: ${log.email || 'unknown'}`;
    case 'ACCESS':
      return `Session verified: ${log.email}`;
    default:
      return log.details || `${log.action}: ${log.email || 'system'}`;
  }
}
