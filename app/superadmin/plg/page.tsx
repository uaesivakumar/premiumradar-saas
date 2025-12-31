'use client';

/**
 * Super Admin - PLG Governance
 *
 * PLG = Self-serve entry, not self-governance.
 *
 * This is the PLG Governance Layer - Super Admin control over:
 * 1. User Lifecycle Control (view, force-convert, expire, suspend)
 * 2. Evidence & Accountability (evidence packs, conversion analysis)
 * 3. Override Authority (correct context, rebind workspace, assign enterprise)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Loader2,
  UserCheck,
  UserX,
  UserCog,
  Filter,
  ChevronDown,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Building2,
  Briefcase,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Edit3,
  ArrowRight,
  FileText,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Shield,
  Plus,
  UserPlus,
} from 'lucide-react';

// ============================================================
// TYPES
// ============================================================

interface PLGUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  is_demo: boolean;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;

  // Onboarding context
  vertical: string | null;
  sub_vertical: string | null;
  region_country: string | null;
  onboarding_completed: boolean;
  onboarding_step: string | null;

  // Bindings
  enterprise_id: string | null;
  enterprise_name: string | null;
  workspace_id: string | null;
  workspace_name: string | null;

  // Evidence
  signup_source: string | null;
  demo_started_at: string | null;
  converted_at: string | null;
  conversion_reason: string | null;
  days_as_demo: number | null;
  activity_score: number | null;
}

interface PLGStats {
  total_users: number;
  demo_users: number;
  real_users: number;
  suspended_users: number;
  converted_this_month: number;
  churned_this_month: number;
  avg_days_to_convert: number | null;
  onboarding_completion_rate: number;
  role_breakdown: {
    SUPER_ADMIN: number;
    ENTERPRISE_ADMIN: number;
    ENTERPRISE_USER: number;
    INDIVIDUAL_USER: number;
  };
}

interface NonConversionReason {
  reason: string;
  count: number;
  percentage: number;
}

// ============================================================
// COMPONENT
// ============================================================

export default function PLGGovernancePage() {
  const [users, setUsers] = useState<PLGUser[]>([]);
  const [stats, setStats] = useState<PLGStats | null>(null);
  const [nonConversionReasons, setNonConversionReasons] = useState<NonConversionReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'demo' | 'real' | 'suspended'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'SUPER_ADMIN' | 'ENTERPRISE_ADMIN' | 'ENTERPRISE_USER' | 'INDIVIDUAL_USER'>('all');
  const [selectedUser, setSelectedUser] = useState<PLGUser | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // ============================================================
  // DATA FETCHING
  // ============================================================

  const fetchPLGData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (roleFilter !== 'all') params.set('role', roleFilter);

      const res = await fetch(`/api/superadmin/plg?${params}`);
      const data = await res.json();

      if (data.success) {
        setUsers(data.data.users);
        setStats(data.data.stats);
        setNonConversionReasons(data.data.non_conversion_reasons || []);
      }
    } catch (error) {
      console.error('Failed to fetch PLG data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, roleFilter]);

  useEffect(() => {
    fetchPLGData();
  }, [fetchPLGData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPLGData();
  };

  // ============================================================
  // USER ACTIONS
  // ============================================================

  const handleForceConvert = async (userId: string) => {
    if (!confirm('Force-convert this demo user to a real user?')) return;

    setActionLoading(userId);
    try {
      const res = await fetch(`/api/superadmin/plg/${userId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversion_reason: 'admin_force_convert' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchPLGData();
      } else {
        alert(data.error || 'Failed to convert user');
      }
    } catch (error) {
      alert('Failed to convert user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExpireDemo = async (userId: string) => {
    if (!confirm('Force-expire this demo? User will lose access until converted.')) return;

    setActionLoading(userId);
    try {
      const res = await fetch(`/api/superadmin/plg/${userId}/expire`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        fetchPLGData();
      } else {
        alert(data.error || 'Failed to expire demo');
      }
    } catch (error) {
      alert('Failed to expire demo');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (userId: string) => {
    if (!confirm('Suspend this user? They will lose access immediately.')) return;

    setActionLoading(userId);
    try {
      const res = await fetch(`/api/superadmin/plg/${userId}/suspend`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        fetchPLGData();
      } else {
        alert(data.error || 'Failed to suspend user');
      }
    } catch (error) {
      alert('Failed to suspend user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReinstate = async (userId: string) => {
    if (!confirm('Reinstate this user?')) return;

    setActionLoading(userId);
    try {
      const res = await fetch(`/api/superadmin/plg/${userId}/reinstate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        fetchPLGData();
      } else {
        alert(data.error || 'Failed to reinstate user');
      }
    } catch (error) {
      alert('Failed to reinstate user');
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================================
  // FILTERING
  // ============================================================

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      user.name?.toLowerCase().includes(query) ||
      user.vertical?.toLowerCase().includes(query) ||
      user.sub_vertical?.toLowerCase().includes(query)
    );
  });

  // ============================================================
  // HELPERS
  // ============================================================

  const getStatusBadge = (user: PLGUser) => {
    if (!user.is_active) {
      return { text: 'SUSPENDED', style: 'bg-red-500/20 text-red-400 border-red-500/30' };
    }
    if (user.is_demo) {
      return { text: 'DEMO', style: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    }
    return { text: 'REAL', style: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { text: string; style: string }> = {
      'SUPER_ADMIN': { text: 'SUPER ADMIN', style: 'bg-red-500/20 text-red-400 border-red-500/30' },
      'ENTERPRISE_ADMIN': { text: 'ENT ADMIN', style: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
      'ENTERPRISE_USER': { text: 'ENT USER', style: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      'INDIVIDUAL_USER': { text: 'INDIVIDUAL', style: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30' },
    };
    return badges[role] || { text: role, style: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30' };
  };

  const getOnboardingStatus = (user: PLGUser) => {
    if (user.onboarding_completed) {
      return { text: 'Complete', icon: CheckCircle2, style: 'text-emerald-400' };
    }
    if (user.onboarding_step) {
      return { text: user.onboarding_step, icon: Clock, style: 'text-amber-400' };
    }
    return { text: 'Not Started', icon: XCircle, style: 'text-neutral-500' };
  };

  const formatDaysAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  // ============================================================
  // RENDER
  // ============================================================

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
            <Zap className="w-5 h-5 text-amber-400" />
            User Governance
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage ALL users: lifecycle control, evidence, suspend/reinstate, override context
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 rounded text-sm font-medium text-white transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Create User
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid - Main Stats */}
      {stats && (
        <div className="space-y-3">
          {/* Role Breakdown */}
          <div className="grid grid-cols-4 gap-3">
            <div
              className={`bg-neutral-900 border rounded-lg p-3 cursor-pointer transition-colors ${
                roleFilter === 'all' ? 'border-violet-500' : 'border-neutral-800 hover:border-neutral-700'
              }`}
              onClick={() => setRoleFilter('all')}
            >
              <div className="flex items-center gap-1.5 text-neutral-500 text-xs mb-1">
                <Users className="w-3 h-3" />
                ALL USERS
              </div>
              <p className="text-xl font-bold text-white">{stats.total_users}</p>
            </div>
            <div
              className={`bg-neutral-900 border rounded-lg p-3 cursor-pointer transition-colors ${
                roleFilter === 'ENTERPRISE_ADMIN' ? 'border-violet-500' : 'border-neutral-800 hover:border-neutral-700'
              }`}
              onClick={() => setRoleFilter('ENTERPRISE_ADMIN')}
            >
              <div className="flex items-center gap-1.5 text-neutral-500 text-xs mb-1">
                <Shield className="w-3 h-3" />
                ENTERPRISE ADMIN
              </div>
              <p className="text-xl font-bold text-violet-400">{stats.role_breakdown?.ENTERPRISE_ADMIN || 0}</p>
            </div>
            <div
              className={`bg-neutral-900 border rounded-lg p-3 cursor-pointer transition-colors ${
                roleFilter === 'ENTERPRISE_USER' ? 'border-blue-500' : 'border-neutral-800 hover:border-neutral-700'
              }`}
              onClick={() => setRoleFilter('ENTERPRISE_USER')}
            >
              <div className="flex items-center gap-1.5 text-neutral-500 text-xs mb-1">
                <Building2 className="w-3 h-3" />
                ENTERPRISE USER
              </div>
              <p className="text-xl font-bold text-blue-400">{stats.role_breakdown?.ENTERPRISE_USER || 0}</p>
            </div>
            <div
              className={`bg-neutral-900 border rounded-lg p-3 cursor-pointer transition-colors ${
                roleFilter === 'INDIVIDUAL_USER' ? 'border-amber-500' : 'border-neutral-800 hover:border-neutral-700'
              }`}
              onClick={() => setRoleFilter('INDIVIDUAL_USER')}
            >
              <div className="flex items-center gap-1.5 text-neutral-500 text-xs mb-1">
                <UserCog className="w-3 h-3" />
                INDIVIDUAL (PLG)
              </div>
              <p className="text-xl font-bold text-amber-400">{stats.role_breakdown?.INDIVIDUAL_USER || 0}</p>
            </div>
          </div>

          {/* Status Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-neutral-500 text-xs mb-1">
                <UserCog className="w-3 h-3" />
                DEMO
              </div>
              <p className="text-xl font-bold text-amber-400">{stats.demo_users}</p>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-neutral-500 text-xs mb-1">
                <UserCheck className="w-3 h-3" />
                REAL
              </div>
              <p className="text-xl font-bold text-emerald-400">{stats.real_users}</p>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-neutral-500 text-xs mb-1">
                <UserX className="w-3 h-3" />
                SUSPENDED
              </div>
              <p className="text-xl font-bold text-red-400">{stats.suspended_users}</p>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-neutral-500 text-xs mb-1">
                <TrendingUp className="w-3 h-3" />
                CONVERTED
              </div>
              <p className="text-xl font-bold text-blue-400">{stats.converted_this_month}</p>
              <p className="text-xs text-neutral-600">this month</p>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-neutral-500 text-xs mb-1">
                <TrendingDown className="w-3 h-3" />
                CHURNED
              </div>
              <p className="text-xl font-bold text-red-400">{stats.churned_this_month}</p>
              <p className="text-xs text-neutral-600">this month</p>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-neutral-500 text-xs mb-1">
                <Clock className="w-3 h-3" />
                AVG DAYS
              </div>
              <p className="text-xl font-bold text-violet-400">
                {stats.avg_days_to_convert ?? '—'}
              </p>
              <p className="text-xs text-neutral-600">to convert</p>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-neutral-500 text-xs mb-1">
                <Activity className="w-3 h-3" />
                ONBOARDING
              </div>
              <p className="text-xl font-bold text-cyan-400">
                {Math.round(stats.onboarding_completion_rate)}%
              </p>
              <p className="text-xs text-neutral-600">complete</p>
            </div>
          </div>
        </div>
      )}

      {/* Non-Conversion Analysis */}
      {nonConversionReasons.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Non-Conversion Analysis
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {nonConversionReasons.map((reason) => (
              <div key={reason.reason} className="flex items-center justify-between">
                <span className="text-sm text-neutral-400">{reason.reason}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{reason.count}</span>
                  <span className="text-xs text-neutral-600">({reason.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by email, name, vertical..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded text-sm text-white focus:outline-none focus:border-neutral-700"
          >
            <option value="all">All Status</option>
            <option value="demo">Demo Only</option>
            <option value="real">Real Only</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-800 text-xs text-neutral-500 uppercase">
              <th className="text-left p-3 font-medium">User</th>
              <th className="text-left p-3 font-medium">Role</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Context</th>
              <th className="text-left p-3 font-medium">Activity</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {filteredUsers.map((user) => {
              const status = getStatusBadge(user);
              const roleBadge = getRoleBadge(user.role);
              const isActionLoading = actionLoading === user.id;

              return (
                <tr key={user.id} className="hover:bg-neutral-800/50 transition-colors">
                  {/* User Info */}
                  <td className="p-3">
                    <div>
                      <p className="text-sm font-medium text-white">{user.email}</p>
                      {user.name && (
                        <p className="text-xs text-neutral-500">{user.name}</p>
                      )}
                      <p className="text-xs text-neutral-600 mt-0.5">
                        Joined {formatDaysAgo(user.created_at)}
                      </p>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="p-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded border ${roleBadge.style}`}>
                      {roleBadge.text}
                    </span>
                    {user.enterprise_name && (
                      <div className="flex items-center gap-1 text-xs text-neutral-500 mt-1">
                        <Building2 className="w-3 h-3" />
                        {user.enterprise_name}
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="p-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded border ${status.style}`}>
                      {status.text}
                    </span>
                    {user.is_demo && user.days_as_demo !== null && (
                      <p className="text-xs text-neutral-600 mt-1">
                        {user.days_as_demo}d as demo
                      </p>
                    )}
                  </td>

                  {/* Context (Vertical/Sub-Vertical/Region) */}
                  <td className="p-3">
                    <div className="space-y-0.5">
                      {user.vertical ? (
                        <>
                          <div className="flex items-center gap-1 text-xs text-neutral-400">
                            <Briefcase className="w-3 h-3" />
                            {user.vertical}
                          </div>
                          {user.sub_vertical && (
                            <div className="flex items-center gap-1 text-xs text-neutral-500">
                              <ChevronRight className="w-3 h-3" />
                              {user.sub_vertical}
                            </div>
                          )}
                          {user.region_country && (
                            <div className="flex items-center gap-1 text-xs text-neutral-500">
                              <MapPin className="w-3 h-3" />
                              {user.region_country}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-neutral-600">No context</span>
                      )}
                    </div>
                  </td>

                  {/* Activity */}
                  <td className="p-3">
                    <div className="space-y-0.5">
                      <p className="text-xs text-neutral-400">
                        Last: {formatDaysAgo(user.last_login_at)}
                      </p>
                      {user.activity_score !== null && (
                        <div className="flex items-center gap-1">
                          <div className="w-12 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                user.activity_score > 70
                                  ? 'bg-emerald-500'
                                  : user.activity_score > 30
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${user.activity_score}%` }}
                            />
                          </div>
                          <span className="text-xs text-neutral-600">{user.activity_score}%</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      {/* View Evidence */}
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowEvidenceModal(true);
                        }}
                        className="p-1.5 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white transition-colors"
                        title="View Evidence"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Override Context */}
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowOverrideModal(true);
                        }}
                        className="p-1.5 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white transition-colors"
                        title="Override Context"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Force Convert (demo only) */}
                      {user.is_demo && user.is_active && (
                        <button
                          onClick={() => handleForceConvert(user.id)}
                          disabled={isActionLoading}
                          className="p-1.5 hover:bg-emerald-900/50 rounded text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
                          title="Force Convert to Real"
                        >
                          {isActionLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ArrowRight className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      {/* Expire Demo (demo only) */}
                      {user.is_demo && user.is_active && (
                        <button
                          onClick={() => handleExpireDemo(user.id)}
                          disabled={isActionLoading}
                          className="p-1.5 hover:bg-amber-900/50 rounded text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50"
                          title="Force Expire Demo"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                      )}

                      {/* Suspend (active only) */}
                      {user.is_active && (
                        <button
                          onClick={() => handleSuspend(user.id)}
                          disabled={isActionLoading}
                          className="p-1.5 hover:bg-red-900/50 rounded text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                          title="Suspend User"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      )}

                      {/* Reinstate (suspended only) */}
                      {!user.is_active && (
                        <button
                          onClick={() => handleReinstate(user.id)}
                          disabled={isActionLoading}
                          className="p-1.5 hover:bg-emerald-900/50 rounded text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
                          title="Reinstate User"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-neutral-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Evidence Modal */}
      {showEvidenceModal && selectedUser && (
        <EvidenceModal
          user={selectedUser}
          onClose={() => {
            setShowEvidenceModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {/* Override Modal */}
      {showOverrideModal && selectedUser && (
        <OverrideModal
          user={selectedUser}
          onClose={() => {
            setShowOverrideModal(false);
            setSelectedUser(null);
          }}
          onSave={() => {
            setShowOverrideModal(false);
            setSelectedUser(null);
            fetchPLGData();
          }}
        />
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchPLGData();
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// EVIDENCE MODAL
// ============================================================

function EvidenceModal({ user, onClose }: { user: PLGUser; onClose: () => void }) {
  const [evidence, setEvidence] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvidence() {
      try {
        const res = await fetch(`/api/superadmin/plg/${user.id}/evidence`);
        const data = await res.json();
        if (data.success) {
          setEvidence(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch evidence:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchEvidence();
  }, [user.id]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-400" />
              Evidence Pack
            </h2>
            <p className="text-sm text-neutral-500">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-neutral-500 animate-spin" />
            </div>
          ) : evidence ? (
            <div className="space-y-4">
              {/* Signup Evidence */}
              <div className="bg-neutral-800/50 rounded-lg p-3">
                <h3 className="text-sm font-medium text-white mb-2">Signup</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-neutral-500">Source:</span>
                    <span className="text-white ml-2">{evidence.signup?.source || 'Direct'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Date:</span>
                    <span className="text-white ml-2">
                      {evidence.signup?.created_at
                        ? new Date(evidence.signup.created_at).toLocaleDateString()
                        : 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Initial Role:</span>
                    <span className="text-white ml-2">{evidence.signup?.initial_role || 'INDIVIDUAL_USER'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">PLG Signup:</span>
                    <span className="text-white ml-2">{evidence.signup?.plg_signup ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              {/* Onboarding Evidence */}
              <div className="bg-neutral-800/50 rounded-lg p-3">
                <h3 className="text-sm font-medium text-white mb-2">Onboarding</h3>
                <div className="space-y-2">
                  {evidence.onboarding?.steps?.map((step: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span className="text-neutral-400">{step.step}:</span>
                      <span className="text-white">{step.value}</span>
                      <span className="text-neutral-600">
                        ({new Date(step.timestamp).toLocaleDateString()})
                      </span>
                    </div>
                  )) || (
                    <p className="text-xs text-neutral-500">No onboarding events recorded</p>
                  )}
                </div>
              </div>

              {/* Conversion Evidence */}
              <div className="bg-neutral-800/50 rounded-lg p-3">
                <h3 className="text-sm font-medium text-white mb-2">Conversion</h3>
                {evidence.conversion ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-neutral-500">Converted:</span>
                      <span className="text-emerald-400 ml-2">Yes</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Date:</span>
                      <span className="text-white ml-2">
                        {new Date(evidence.conversion.converted_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Reason:</span>
                      <span className="text-white ml-2">{evidence.conversion.reason}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Days as Demo:</span>
                      <span className="text-white ml-2">{evidence.conversion.days_as_demo}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-amber-400">Not yet converted</p>
                    {evidence.non_conversion_reason && (
                      <div className="text-xs">
                        <span className="text-neutral-500">Likely reason:</span>
                        <span className="text-white ml-2">{evidence.non_conversion_reason}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Activity Evidence */}
              <div className="bg-neutral-800/50 rounded-lg p-3">
                <h3 className="text-sm font-medium text-white mb-2">Activity</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-neutral-500">Last Login:</span>
                    <span className="text-white ml-2">
                      {evidence.activity?.last_login
                        ? new Date(evidence.activity.last_login).toLocaleDateString()
                        : 'Never'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Total Logins:</span>
                    <span className="text-white ml-2">{evidence.activity?.login_count || 0}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Activity Score:</span>
                    <span className="text-white ml-2">{evidence.activity?.score || 0}%</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Days Active:</span>
                    <span className="text-white ml-2">{evidence.activity?.days_active || 0}</span>
                  </div>
                </div>
              </div>

              {/* Raw Events */}
              {evidence.events && evidence.events.length > 0 && (
                <div className="bg-neutral-800/50 rounded-lg p-3">
                  <h3 className="text-sm font-medium text-white mb-2">Recent Events</h3>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {evidence.events.slice(0, 10).map((event: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="text-neutral-600">
                          {new Date(event.created_at).toLocaleString()}
                        </span>
                        <span className="text-violet-400">{event.event_type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-neutral-500 text-center py-8">No evidence available</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// OVERRIDE MODAL
// ============================================================

function OverrideModal({
  user,
  onClose,
  onSave,
}: {
  user: PLGUser;
  onClose: () => void;
  onSave: () => void;
}) {
  const [vertical, setVertical] = useState(user.vertical || '');
  const [subVertical, setSubVertical] = useState(user.sub_vertical || '');
  const [region, setRegion] = useState(user.region_country || '');
  const [workspaceId, setWorkspaceId] = useState(user.workspace_id || '');
  const [enterpriseId, setEnterpriseId] = useState(user.enterprise_id || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/superadmin/plg/${user.id}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vertical: vertical || null,
          sub_vertical: subVertical || null,
          region_country: region || null,
          workspace_id: workspaceId || null,
          enterprise_id: enterpriseId || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSave();
      } else {
        alert(data.error || 'Failed to save override');
      }
    } catch (error) {
      alert('Failed to save override');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg w-full max-w-md">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-400" />
              Override Context
            </h2>
            <p className="text-sm text-neutral-500">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Vertical</label>
            <input
              type="text"
              value={vertical}
              onChange={(e) => setVertical(e.target.value)}
              placeholder="e.g., banking"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-500 mb-1">Sub-Vertical</label>
            <input
              type="text"
              value={subVertical}
              onChange={(e) => setSubVertical(e.target.value)}
              placeholder="e.g., employee_banking"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-500 mb-1">Region</label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g., UAE"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-500 mb-1">Workspace ID (rebind)</label>
            <input
              type="text"
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              placeholder="UUID or leave empty"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-500 mb-1">Enterprise ID (assign later)</label>
            <input
              type="text"
              value={enterpriseId}
              onChange={(e) => setEnterpriseId(e.target.value)}
              placeholder="UUID or leave empty"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
            />
          </div>
        </div>

        <div className="p-4 border-t border-neutral-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Override'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CREATE USER MODAL
// ============================================================

interface CreateUserModalProps {
  onClose: () => void;
  onCreated: () => void;
}

type UserType = 'individual' | 'individual_demo' | 'enterprise_user' | 'enterprise_demo' | 'enterprise_admin';

function CreateUserModal({ onClose, onCreated }: CreateUserModalProps) {
  const [userType, setUserType] = useState<UserType>('individual');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [enterpriseId, setEnterpriseId] = useState('');
  const [enterprises, setEnterprises] = useState<{ enterprise_id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch enterprises for dropdown
  useEffect(() => {
    async function fetchEnterprises() {
      try {
        const res = await fetch('/api/superadmin/enterprises');
        const data = await res.json();
        if (data.success) {
          setEnterprises(data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch enterprises:', err);
      }
    }
    fetchEnterprises();
  }, []);

  const needsEnterprise = ['enterprise_user', 'enterprise_demo', 'enterprise_admin'].includes(userType);

  const handleCreate = async () => {
    setError(null);

    // Validation
    if (!email) {
      setError('Email is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    if (needsEnterprise && !enterpriseId) {
      setError('Enterprise is required for enterprise users');
      return;
    }

    // Map userType to role and is_demo
    const roleMap: Record<UserType, { role: string; is_demo: boolean }> = {
      individual: { role: 'INDIVIDUAL_USER', is_demo: false },
      individual_demo: { role: 'INDIVIDUAL_USER', is_demo: true },
      enterprise_user: { role: 'ENTERPRISE_USER', is_demo: false },
      enterprise_demo: { role: 'ENTERPRISE_USER', is_demo: true },
      enterprise_admin: { role: 'ENTERPRISE_ADMIN', is_demo: false },
    };

    const { role, is_demo } = roleMap[userType];

    setSaving(true);
    try {
      const res = await fetch('/api/superadmin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || null,
          password,
          role,
          is_demo,
          demo_type: is_demo ? 'admin_created' : null,
          enterprise_id: needsEnterprise ? enterpriseId : null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        onCreated();
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (err) {
      setError('Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg w-full max-w-md">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-violet-400" />
              Create User
            </h2>
            <p className="text-sm text-neutral-500">Add a new user to the system</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* User Type Selection */}
          <div>
            <label className="block text-xs text-neutral-500 mb-2">User Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setUserType('individual')}
                className={`px-3 py-2 rounded text-sm font-medium border transition-colors ${
                  userType === 'individual'
                    ? 'bg-neutral-700 border-neutral-600 text-white'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                }`}
              >
                Individual
              </button>
              <button
                onClick={() => setUserType('individual_demo')}
                className={`px-3 py-2 rounded text-sm font-medium border transition-colors ${
                  userType === 'individual_demo'
                    ? 'bg-amber-600/20 border-amber-500 text-amber-400'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                }`}
              >
                Individual Demo
              </button>
              <button
                onClick={() => setUserType('enterprise_user')}
                className={`px-3 py-2 rounded text-sm font-medium border transition-colors ${
                  userType === 'enterprise_user'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                }`}
              >
                Enterprise User
              </button>
              <button
                onClick={() => setUserType('enterprise_demo')}
                className={`px-3 py-2 rounded text-sm font-medium border transition-colors ${
                  userType === 'enterprise_demo'
                    ? 'bg-amber-600/20 border-amber-500 text-amber-400'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                }`}
              >
                Enterprise Demo
              </button>
              <button
                onClick={() => setUserType('enterprise_admin')}
                className={`col-span-2 px-3 py-2 rounded text-sm font-medium border transition-colors ${
                  userType === 'enterprise_admin'
                    ? 'bg-violet-600/20 border-violet-500 text-violet-400'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                }`}
              >
                Enterprise Admin
              </button>
            </div>
          </div>

          {/* Enterprise Selection (if needed) */}
          {needsEnterprise && (
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Enterprise *</label>
              <select
                value={enterpriseId}
                onChange={(e) => setEnterpriseId(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:border-neutral-600"
              >
                <option value="">Select enterprise...</option>
                {enterprises.map((ent) => (
                  <option key={ent.enterprise_id} value={ent.enterprise_id}>
                    {ent.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-neutral-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded disabled:opacity-50 transition-colors"
          >
            {saving ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
}
