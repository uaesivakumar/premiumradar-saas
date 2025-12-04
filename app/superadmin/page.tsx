'use client';

/**
 * Super Admin Dashboard
 *
 * Overview of entire system with key metrics and quick actions
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
  Clock,
  Globe,
  BarChart3,
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalTenants: number;
  activeNow: number;
  systemHealth: 'healthy' | 'degraded' | 'down';
  apiLatency: number;
  errorRate: number;
  signalsToday: number;
  outreachSent: number;
}

// Simulated stats - replace with real API calls
const mockStats: DashboardStats = {
  totalUsers: 156,
  totalTenants: 12,
  activeNow: 8,
  systemHealth: 'healthy',
  apiLatency: 142,
  errorRate: 0.02,
  signalsToday: 1247,
  outreachSent: 89,
};

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>(mockStats);
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
    status: 'success' | 'warning' | 'error';
  }>>([
    { id: '1', type: 'user', message: 'New user registered: ahmed@company.ae', timestamp: '2 min ago', status: 'success' },
    { id: '2', type: 'signal', message: 'Signal processing completed: 847 companies', timestamp: '15 min ago', status: 'success' },
    { id: '3', type: 'error', message: 'Apollo API rate limit warning', timestamp: '32 min ago', status: 'warning' },
    { id: '4', type: 'outreach', message: 'Outreach batch sent: 45 emails', timestamp: '1 hour ago', status: 'success' },
    { id: '5', type: 'system', message: 'Database backup completed', timestamp: '2 hours ago', status: 'success' },
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">System overview and key metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
            stats.systemHealth === 'healthy'
              ? 'bg-green-500/10 text-green-400'
              : stats.systemHealth === 'degraded'
              ? 'bg-yellow-500/10 text-yellow-400'
              : 'bg-red-500/10 text-red-400'
          }`}>
            {stats.systemHealth === 'healthy' ? (
              <CheckCircle className="w-4 h-4" />
            ) : stats.systemHealth === 'degraded' ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            System {stats.systemHealth}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          trend="+12%"
          color="blue"
        />
        <StatCard
          title="Tenants"
          value={stats.totalTenants}
          icon={Building2}
          trend="+2"
          color="purple"
        />
        <StatCard
          title="Active Now"
          value={stats.activeNow}
          icon={Activity}
          color="green"
        />
        <StatCard
          title="Signals Today"
          value={stats.signalsToday.toLocaleString()}
          icon={Zap}
          trend="+23%"
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
                <span className="text-sm font-medium text-white">{stats.apiLatency}ms</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${Math.min(100, (stats.apiLatency / 500) * 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-400">Error Rate</span>
                <span className="text-sm font-medium text-white">{(stats.errorRate * 100).toFixed(2)}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full">
                <div
                  className={`h-full rounded-full ${stats.errorRate < 0.01 ? 'bg-green-500' : stats.errorRate < 0.05 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(100, stats.errorRate * 1000)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Database</h3>
            <Database className="w-5 h-5 text-gray-500" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Connections</span>
              <span className="text-sm font-medium text-white">24/100</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Query Time (avg)</span>
              <span className="text-sm font-medium text-white">12ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Storage Used</span>
              <span className="text-sm font-medium text-white">2.4GB / 10GB</span>
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
              <span className="text-sm font-medium text-white">{stats.outreachSent}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Open Rate</span>
              <span className="text-sm font-medium text-green-400">42.3%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Reply Rate</span>
              <span className="text-sm font-medium text-green-400">8.7%</span>
            </div>
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
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${
                  activity.status === 'success' ? 'bg-green-500' :
                  activity.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 truncate">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{activity.timestamp}</p>
                </div>
              </div>
            ))}
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
  trend,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
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
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-white">{value}</span>
        {trend && (
          <span className="text-sm text-green-400 mb-1 flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </span>
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
