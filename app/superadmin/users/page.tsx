'use client';

/**
 * Super Admin - Users Management
 * View all users across all enterprises
 */

import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Loader2,
  Building2,
  Shield,
  UserCheck,
  UserX,
  Filter,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  enterprise_id: string | null;
  enterprise_name: string | null;
  workspace_id: string | null;
  is_demo: boolean;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

interface Stats {
  total_users: number;
  active_users: number;
  demo_users: number;
  enterprise_admins: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.set('role', roleFilter);

      const res = await fetch(`/api/superadmin/users?${params}`);
      const data = await res.json();

      if (data.success) {
        setUsers(data.data.users);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      user.name?.toLowerCase().includes(query) ||
      user.enterprise_name?.toLowerCase().includes(query)
    );
  });

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      'SUPER_ADMIN': 'bg-red-500/20 text-red-400 border-red-500/30',
      'ENTERPRISE_ADMIN': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
      'ENTERPRISE_USER': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'INDIVIDUAL_USER': 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30',
    };
    return styles[role] || 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30';
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
            <Users className="w-5 h-5 text-violet-400" />
            Users
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage users across all enterprises
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
              <Users className="w-3 h-3" />
              TOTAL USERS
            </div>
            <p className="text-2xl font-bold text-white">{stats.total_users}</p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
              <UserCheck className="w-3 h-3" />
              ACTIVE
            </div>
            <p className="text-2xl font-bold text-emerald-400">{stats.active_users}</p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
              <Shield className="w-3 h-3" />
              ADMINS
            </div>
            <p className="text-2xl font-bold text-violet-400">{stats.enterprise_admins}</p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
              <UserX className="w-3 h-3" />
              DEMO
            </div>
            <p className="text-2xl font-bold text-amber-400">{stats.demo_users}</p>
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
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-500" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded text-sm text-white focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ENTERPRISE_ADMIN">Enterprise Admin</option>
            <option value="ENTERPRISE_USER">Enterprise User</option>
            <option value="INDIVIDUAL_USER">Individual User</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-800/50 text-xs text-neutral-400">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Enterprise</th>
              <th className="px-4 py-3 text-center">Role</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-left">Created</th>
              <th className="px-4 py-3 text-left">Last Login</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/50">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-neutral-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-white">{user.email}</p>
                      {user.name && (
                        <p className="text-xs text-neutral-500">{user.name}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {user.enterprise_name ? (
                      <div className="flex items-center gap-2 text-neutral-300">
                        <Building2 className="w-3 h-3 text-neutral-500" />
                        {user.enterprise_name}
                      </div>
                    ) : (
                      <span className="text-neutral-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs border ${getRoleBadge(user.role)}`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {user.is_active ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-neutral-500 text-xs">
                        <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full" />
                        Inactive
                      </span>
                    )}
                    {user.is_demo && (
                      <span className="ml-2 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded">
                        DEMO
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-400 text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-neutral-400 text-sm">
                    {user.last_login_at
                      ? new Date(user.last_login_at).toLocaleDateString()
                      : '—'}
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
