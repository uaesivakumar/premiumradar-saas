'use client';

/**
 * Super Admin Dashboard - Professional Control Panel
 *
 * Design: Linear/Stripe inspired - minimal, functional, no gradients
 * Fetches REAL data from /api/superadmin/stats
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Building2,
  Activity,
  AlertTriangle,
  Server,
  Database,
  Zap,
  ArrowRight,
  CheckCircle,
  XCircle,
  Globe,
  BarChart3,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface ApiStats {
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
    errorRate: number; // For system health (recent errors only)
    cumulativeErrorRate: number; // All-time error rate
    hasRecentErrors: boolean;
    integrations: Array<{
      provider: string;
      name: string;
      isActive: boolean;
      usageCount: number;
      errorCount: number;
      lastUsedAt: string | null;
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

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  async function fetchStats() {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/superadmin/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
        setLastRefresh(new Date());
      } else {
        setError(data.error || 'Failed to load stats');
      }
    } catch (err) {
      setError('Failed to connect to stats API');
      console.error('Stats fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Determine system health based on database and API health
  const systemHealth = stats?.database.healthy
    ? stats.api.errorRate < 0.05
      ? 'healthy'
      : 'degraded'
    : 'down';

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-5 h-5 text-neutral-500 animate-spin mx-auto mb-3" />
          <p className="text-neutral-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-3" />
          <p className="text-neutral-400 text-sm mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-white">Overview</h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            System metrics
            {lastRefresh && (
              <span className="text-neutral-600 ml-2">
                · {formatTimeAgo(lastRefresh)}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            disabled={isLoading}
            className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
            systemHealth === 'healthy'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : systemHealth === 'degraded'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {systemHealth === 'healthy' ? (
              <CheckCircle className="w-3 h-3" />
            ) : systemHealth === 'degraded' ? (
              <AlertTriangle className="w-3 h-3" />
            ) : (
              <XCircle className="w-3 h-3" />
            )}
            {systemHealth}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats?.users.total || 0}
          icon={Users}
          subtitle={`${stats?.users.active || 0} active, ${stats?.users.demo || 0} demo`}
          color="blue"
        />
        <StatCard
          title="Tenants"
          value={stats?.tenants.total || 0}
          icon={Building2}
          subtitle={`${stats?.tenants.active || 0} active, ${stats?.tenants.trial || 0} trial`}
          color="purple"
        />
        <StatCard
          title="Active Sessions"
          value={stats?.database.connectionCount || 0}
          icon={Activity}
          subtitle={`of ${stats?.database.maxConnections || 100} max`}
          color="green"
        />
        <StatCard
          title="Signals Today"
          value={(stats?.signals.today || 0).toLocaleString()}
          icon={Zap}
          subtitle={`${(stats?.signals.thisWeek || 0).toLocaleString()} this week`}
          color="orange"
        />
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-neutral-300">API</h3>
            <Server className="w-4 h-4 text-neutral-600" />
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-neutral-500">P95 Latency</span>
                <span className="text-xs font-medium text-white">{stats?.api.latencyP95 || 0}ms</span>
              </div>
              <div className="h-1 bg-neutral-800 rounded-full">
                <div
                  className="h-full bg-emerald-500/60 rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((stats?.api.latencyP95 || 0) / 500) * 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-neutral-500">Error Rate (1h)</span>
                <span className={`text-xs font-medium ${stats?.api.hasRecentErrors ? 'text-red-400' : 'text-emerald-400'}`}>
                  {stats?.api.hasRecentErrors ? `${((stats?.api.errorRate || 0) * 100).toFixed(2)}%` : '0%'}
                </span>
              </div>
              <div className="h-1 bg-neutral-800 rounded-full">
                <div
                  className={`h-full rounded-full transition-all ${
                    !stats?.api.hasRecentErrors ? 'bg-emerald-500/60' :
                    (stats?.api.errorRate || 0) < 0.05 ? 'bg-amber-500/60' : 'bg-red-500/60'
                  }`}
                  style={{ width: stats?.api.hasRecentErrors ? `${Math.min(100, (stats?.api.errorRate || 0) * 1000)}%` : '5%' }}
                />
              </div>
            </div>
            {/* Integration Stats */}
            <div className="pt-2 border-t border-neutral-800">
              <div className="flex flex-wrap gap-1.5">
                {stats?.api.integrations.map((integration) => (
                  <span
                    key={integration.provider}
                    className={`px-1.5 py-0.5 text-[10px] rounded ${
                      integration.isActive
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-neutral-800 text-neutral-500'
                    }`}
                  >
                    {integration.provider}
                  </span>
                ))}
                {(!stats?.api.integrations || stats.api.integrations.length === 0) && (
                  <span className="text-[10px] text-neutral-600">No integrations</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-neutral-300">Database</h3>
            <Database className={`w-4 h-4 ${stats?.database.healthy ? 'text-emerald-500' : 'text-red-500'}`} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Status</span>
              <span className={`text-xs font-medium ${stats?.database.healthy ? 'text-emerald-400' : 'text-red-400'}`}>
                {stats?.database.healthy ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Connections</span>
              <span className="text-xs font-medium text-white">
                {stats?.database.connectionCount || 0}/{stats?.database.maxConnections || 100}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Avg Query</span>
              <span className="text-xs font-medium text-white">{stats?.database.queryTimeAvg || 0}ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Storage</span>
              <span className="text-xs font-medium text-white">
                {formatStorageSize(stats?.database.storageUsedMb || 0)} / {formatStorageSize(stats?.database.storageMaxMb || 10240)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-neutral-300">Outreach</h3>
            <BarChart3 className="w-4 h-4 text-neutral-600" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Sent Today</span>
              <span className="text-xs font-medium text-white">{stats?.outreach.sentToday || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Open Rate</span>
              <span className={`text-xs font-medium ${(stats?.outreach.openRate || 0) > 30 ? 'text-emerald-400' : 'text-white'}`}>
                {stats?.outreach.openRate || 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Reply Rate</span>
              <span className={`text-xs font-medium ${(stats?.outreach.replyRate || 0) > 5 ? 'text-emerald-400' : 'text-white'}`}>
                {stats?.outreach.replyRate || 0}%
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-neutral-800">
            <p className="text-[10px] text-neutral-600">Signals/month: {(stats?.signals.thisMonth || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Activity & Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        {/* Recent Activity */}
        <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-neutral-300">Activity</h3>
            <Link href="/superadmin/activity" className="text-xs text-neutral-500 hover:text-white flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-2 p-2 bg-neutral-800/30 rounded">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                    activity.status === 'success' ? 'bg-emerald-500' :
                    activity.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-300 truncate">{activity.message}</p>
                    <p className="text-[10px] text-neutral-600 mt-0.5">{formatTimeAgo(new Date(activity.timestamp))}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <Activity className="w-5 h-5 text-neutral-700 mx-auto mb-2" />
                <p className="text-xs text-neutral-600">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
          <h3 className="text-sm font-medium text-neutral-300 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <QuickActionCard
              title="Demo User"
              description="Testing & demos"
              href="/superadmin/users/demo"
              icon={Users}
            />
            <QuickActionCard
              title="Verticals"
              description="Personas & config"
              href="/superadmin/verticals"
              icon={Globe}
            />
            <QuickActionCard
              title="Logs"
              description="Audit trail"
              href="/superadmin/logs"
              icon={Activity}
            />
            <QuickActionCard
              title="Integrations"
              description="API providers"
              href="/superadmin/integrations"
              icon={Zap}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  subtitle?: string;
  color: 'blue' | 'purple' | 'green' | 'orange';
}) {
  return (
    <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-neutral-500">{title}</span>
        <Icon className="w-4 h-4 text-neutral-600" />
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-semibold text-white">{value}</span>
        {subtitle && (
          <span className="text-[10px] text-neutral-600 mt-0.5">{subtitle}</span>
        )}
      </div>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="block p-3 bg-neutral-800/30 hover:bg-neutral-800/50 border border-neutral-800 hover:border-neutral-700 rounded transition-all group"
    >
      <Icon className="w-4 h-4 text-neutral-500 group-hover:text-white mb-1.5 transition-colors" />
      <h4 className="font-medium text-white text-xs">{title}</h4>
      <p className="text-[10px] text-neutral-600 mt-0.5">{description}</p>
    </Link>
  );
}

/**
 * Format a date as "X minutes ago", "X hours ago", etc.
 */
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

/**
 * Format storage size (MB to human readable)
 */
function formatStorageSize(mb: number): string {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)}GB`;
  }
  return `${mb}MB`;
}
