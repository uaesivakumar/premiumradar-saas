'use client';

/**
 * Super Admin - Activity/Audit Log
 * View system activity and audit events
 */

import { useState, useEffect } from 'react';
import {
  Activity,
  RefreshCw,
  Loader2,
  User,
  Building2,
  Key,
  Settings,
  FileText,
  Filter,
  Clock,
} from 'lucide-react';

interface ActivityItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  description: string;
  timestamp: string;
  actor: string;
  actor_email?: string;
  metadata?: Record<string, unknown>;
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [source, setSource] = useState<string>('');

  const fetchActivity = async () => {
    try {
      const params = new URLSearchParams();
      if (entityFilter !== 'all') params.set('entity_type', entityFilter);

      const res = await fetch(`/api/superadmin/activity?${params}`);
      const data = await res.json();

      if (data.success) {
        setActivities(data.data.activities);
        setSource(data.data.source);
      }
    } catch (error) {
      console.error('Failed to fetch activity:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [entityFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchActivity();
  };

  const getEntityIcon = (entityType: string) => {
    const icons: Record<string, React.ReactNode> = {
      'user': <User className="w-4 h-4" />,
      'enterprise': <Building2 className="w-4 h-4" />,
      'session': <Key className="w-4 h-4" />,
      'settings': <Settings className="w-4 h-4" />,
      'config': <FileText className="w-4 h-4" />,
    };
    return icons[entityType] || <Activity className="w-4 h-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('CREATED')) return 'text-emerald-400';
    if (action.includes('DELETE') || action.includes('DELETED')) return 'text-red-400';
    if (action.includes('UPDATE') || action.includes('UPDATED')) return 'text-blue-400';
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return 'text-violet-400';
    return 'text-neutral-400';
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-neutral-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-violet-400" />
            Activity
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            System activity and audit log
            {source === 'derived' && (
              <span className="ml-2 text-amber-500">(derived from entity records)</span>
            )}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-500" />
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded text-sm text-white focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Types</option>
            <option value="user">Users</option>
            <option value="enterprise">Enterprises</option>
            <option value="session">Sessions</option>
            <option value="config">Config</option>
          </select>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
        {activities.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            No activity found
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/50">
            {activities.map((activity) => (
              <div
                key={`${activity.id}-${activity.timestamp}`}
                className="px-4 py-3 hover:bg-neutral-800/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-neutral-800 rounded-lg text-neutral-400">
                    {getEntityIcon(activity.entity_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-sm ${getActionColor(activity.action)}`}>
                        {activity.action.replace('_', ' ')}
                      </span>
                      <span className="text-neutral-600">•</span>
                      <span className="text-xs text-neutral-500">{activity.entity_type}</span>
                    </div>
                    <p className="text-sm text-neutral-300 mt-0.5">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                      {activity.actor_email && (
                        <span>by {activity.actor_email}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Notice */}
      {source === 'derived' && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
          <p className="text-sm text-amber-300">
            <strong>Note:</strong> Activity is derived from entity records. For detailed audit logging,
            an audit_log table can be implemented to track all system changes.
          </p>
        </div>
      )}
    </div>
  );
}
