'use client';

/**
 * Super Admin Dashboard
 *
 * Overview of entire system with key metrics and quick actions.
 * Fetches REAL data from /api/superadmin/stats
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Building2,
  Activity,
  AlertTriangle,
  TrendingUp,
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
    errorRate: number;
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
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard stats...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
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
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">
            System overview and key metrics
            {lastRefresh && (
              <span className="text-gray-600 ml-2">
                · Updated {formatTimeAgo(lastRefresh)}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Refresh stats"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
            systemHealth === 'healthy'
              ? 'bg-green-500/10 text-green-400'
              : systemHealth === 'degraded'
              ? 'bg-yellow-500/10 text-yellow-400'
              : 'bg-red-500/10 text-red-400'
          }`}>
            {systemHealth === 'healthy' ? (
              <CheckCircle className="w-4 h-4" />
            ) : systemHealth === 'degraded' ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            System {systemHealth}
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
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">API Performance</h3>
            <Server className="w-5 h-5 text-gray-500" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-400">Latency (P95)</span>
                <span className="text-sm font-medium text-white">{stats?.api.latencyP95 || 0}ms</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((stats?.api.latencyP95 || 0) / 500) * 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-400">Error Rate</span>
                <span className="text-sm font-medium text-white">
                  {((stats?.api.errorRate || 0) * 100).toFixed(2)}%
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full">
                <div
                  className={`h-full rounded-full transition-all ${
                    (stats?.api.errorRate || 0) < 0.01 ? 'bg-green-500' :
                    (stats?.api.errorRate || 0) < 0.05 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, (stats?.api.errorRate || 0) * 1000)}%` }}
                />
              </div>
            </div>
            {/* Integration Stats */}
            <div className="pt-2 border-t border-gray-800">
              <p className="text-xs text-gray-500 mb-2">API Integrations</p>
              <div className="flex flex-wrap gap-2">
                {stats?.api.integrations.map((integration) => (
                  <span
                    key={integration.provider}
                    className={`px-2 py-1 text-xs rounded ${
                      integration.isActive
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {integration.provider}
                    {integration.usageCount > 0 && (
                      <span className="ml-1 text-gray-500">({integration.usageCount})</span>
                    )}
                  </span>
                ))}
                {(!stats?.api.integrations || stats.api.integrations.length === 0) && (
                  <span className="text-xs text-gray-500">No integrations configured</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Database</h3>
            <Database className={`w-5 h-5 ${stats?.database.healthy ? 'text-green-500' : 'text-red-500'}`} />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Status</span>
              <span className={`text-sm font-medium ${stats?.database.healthy ? 'text-green-400' : 'text-red-400'}`}>
                {stats?.database.healthy ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Connections</span>
              <span className="text-sm font-medium text-white">
                {stats?.database.connectionCount || 0}/{stats?.database.maxConnections || 100}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Query Time (avg)</span>
              <span className="text-sm font-medium text-white">{stats?.database.queryTimeAvg || 0}ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Storage Used</span>
              <span className="text-sm font-medium text-white">
                {formatStorageSize(stats?.database.storageUsedMb || 0)} / {formatStorageSize(stats?.database.storageMaxMb || 10240)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Outreach</h3>
            <BarChart3 className="w-5 h-5 text-gray-500" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Sent Today</span>
              <span className="text-sm font-medium text-white">{stats?.outreach.sentToday || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Open Rate</span>
              <span className={`text-sm font-medium ${(stats?.outreach.openRate || 0) > 30 ? 'text-green-400' : 'text-white'}`}>
                {stats?.outreach.openRate || 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Reply Rate</span>
              <span className={`text-sm font-medium ${(stats?.outreach.replyRate || 0) > 5 ? 'text-green-400' : 'text-white'}`}>
                {stats?.outreach.replyRate || 0}%
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-800">
            <p className="text-xs text-gray-500">Signals this month: {(stats?.signals.thisMonth || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Activity & Quick Actions */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Recent Activity</h3>
            <Link href="/superadmin/activity" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${
                    activity.status === 'success' ? 'bg-green-500' :
                    activity.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300 truncate">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatTimeAgo(new Date(activity.timestamp))}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickActionCard
              title="Create Demo User"
              description="For testing & demos"
              href="/superadmin/users/demo"
              icon={Users}
            />
            <QuickActionCard
              title="Configure Vertical"
              description="Personas & settings"
              href="/superadmin/verticals"
              icon={Globe}
            />
            <QuickActionCard
              title="View Logs"
              description="Access & audit logs"
              href="/superadmin/logs"
              icon={Activity}
            />
            <QuickActionCard
              title="API Integrations"
              description="Apollo, SERP, etc."
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
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  subtitle?: string;
  color: 'blue' | 'purple' | 'green' | 'orange';
}) {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-400',
    purple: 'bg-purple-500/10 text-purple-400',
    green: 'bg-green-500/10 text-green-400',
    orange: 'bg-orange-500/10 text-orange-400',
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-400">{title}</span>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-3xl font-bold text-white">{value}</span>
        {subtitle && (
          <span className="text-xs text-gray-500 mt-1">{subtitle}</span>
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
      className="block p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 rounded-xl transition-all group"
    >
      <Icon className="w-5 h-5 text-gray-400 group-hover:text-blue-400 mb-2 transition-colors" />
      <h4 className="font-medium text-white text-sm">{title}</h4>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
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
