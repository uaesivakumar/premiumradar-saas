'use client';

/**
 * Super Admin - Tenants (Enterprises) Management
 * View all enterprises/tenants in the system
 */

import { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  RefreshCw,
  Loader2,
  Users,
  Layers,
  CreditCard,
  Shield,
  Filter,
} from 'lucide-react';

interface Enterprise {
  enterprise_id: string;
  name: string;
  domain: string | null;
  type: string;
  status: string;
  plan: string | null;
  region: string;
  max_users: number;
  max_workspaces: number;
  user_count: number;
  workspace_count: number;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total_enterprises: number;
  active_enterprises: number;
  demo_enterprises: number;
  paid_enterprises: number;
}

export default function TenantsPage() {
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');

  const fetchEnterprises = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (planFilter !== 'all') params.set('plan', planFilter);

      const res = await fetch(`/api/superadmin/enterprises?${params}`);
      const data = await res.json();

      if (data.success) {
        setEnterprises(data.data.enterprises);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch enterprises:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEnterprises();
  }, [statusFilter, planFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEnterprises();
  };

  const filteredEnterprises = enterprises.filter(ent => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      ent.name.toLowerCase().includes(query) ||
      ent.domain?.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'ACTIVE': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      'SUSPENDED': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      'DELETED': 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return styles[status] || 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30';
  };

  const getPlanBadge = (plan: string | null) => {
    if (!plan || plan === 'free') return 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30';
    const styles: Record<string, string> = {
      'starter': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'professional': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
      'enterprise': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    };
    return styles[plan] || 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30';
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
            <Building2 className="w-5 h-5 text-violet-400" />
            Tenants
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage enterprises and their subscriptions
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

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
              <Building2 className="w-3 h-3" />
              TOTAL TENANTS
            </div>
            <p className="text-2xl font-bold text-white">{stats.total_enterprises}</p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
              <Shield className="w-3 h-3" />
              ACTIVE
            </div>
            <p className="text-2xl font-bold text-emerald-400">{stats.active_enterprises}</p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
              <CreditCard className="w-3 h-3" />
              PAID
            </div>
            <p className="text-2xl font-bold text-violet-400">{stats.paid_enterprises}</p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
              <Layers className="w-3 h-3" />
              DEMO
            </div>
            <p className="text-2xl font-bold text-amber-400">{stats.demo_enterprises}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tenants..."
            className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded text-sm text-white focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="DELETED">Deleted</option>
          </select>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded text-sm text-white focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Enterprises Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-800/50 text-xs text-neutral-400">
            <tr>
              <th className="px-4 py-3 text-left">Tenant</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Plan</th>
              <th className="px-4 py-3 text-center">Users</th>
              <th className="px-4 py-3 text-center">Workspaces</th>
              <th className="px-4 py-3 text-left">Region</th>
              <th className="px-4 py-3 text-left">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/50">
            {filteredEnterprises.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                  No tenants found
                </td>
              </tr>
            ) : (
              filteredEnterprises.map((ent) => (
                <tr key={ent.enterprise_id} className="hover:bg-neutral-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-white">{ent.name}</p>
                      {ent.domain && (
                        <p className="text-xs text-neutral-500">{ent.domain}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs border ${getStatusBadge(ent.status)}`}>
                      {ent.status}
                    </span>
                    {ent.type === 'DEMO' && (
                      <span className="ml-2 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded">
                        DEMO
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs border ${getPlanBadge(ent.plan)}`}>
                      {ent.plan || 'free'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="w-3 h-3 text-neutral-500" />
                      <span className="text-neutral-300">{ent.user_count}</span>
                      <span className="text-neutral-600">/ {ent.max_users}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Layers className="w-3 h-3 text-neutral-500" />
                      <span className="text-neutral-300">{ent.workspace_count}</span>
                      <span className="text-neutral-600">/ {ent.max_workspaces}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-400 text-sm">
                    {ent.region}
                  </td>
                  <td className="px-4 py-3 text-neutral-400 text-sm">
                    {new Date(ent.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
