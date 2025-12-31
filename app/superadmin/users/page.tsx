'use client';

/**
 * Super Admin - User Management
 *
 * Full user governance with:
 * - Quick Create (4 user types)
 * - Users table with search, filter, inline actions
 * - Human-readable activity feed
 * - Enterprises overview
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Building2,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  UserPlus,
  Shield,
  Zap,
  ArrowRight,
  ChevronRight,
  RefreshCw,
  UserX,
  Briefcase,
  BarChart3,
  Sparkles,
  Target,
  Play,
  Pause,
  Plus,
  X,
  Check,
  Loader2,
  Search,
} from 'lucide-react';

// Types
interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  is_demo: boolean;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
  enterprise_name: string | null;
}

interface Stats {
  total_users: number;
  demo_users: number;
  real_users: number;
  suspended_users: number;
  converted_this_month: number;
  churned_this_month: number;
  role_breakdown: {
    SUPER_ADMIN: number;
    ENTERPRISE_ADMIN: number;
    ENTERPRISE_USER: number;
    INDIVIDUAL_USER: number;
  };
}

interface Enterprise {
  enterprise_id: string;
  name: string;
  domain: string;
  user_count: number;
  created_at: string;
}

interface ActivityItem {
  id: string;
  event_type: string;
  description: string;
  actor: string;
  timestamp: string;
  importance: 'high' | 'medium' | 'low';
}

interface Insight {
  id: string;
  type: 'warning' | 'opportunity' | 'success' | 'info';
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export default function UserManagementPage() {
  // Data states
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [selectedUserType, setSelectedUserType] = useState<string | null>(null);
  const [showCreatePanel, setShowCreatePanel] = useState(false);

  // Create user form
  const [createEmail, setCreateEmail] = useState('');
  const [createName, setCreateName] = useState('');
  const [createEnterprise, setCreateEnterprise] = useState('');
  const [createIsDemo, setCreateIsDemo] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  // Filter states
  const [userFilter, setUserFilter] = useState<'all' | 'demo' | 'real' | 'suspended'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [plgRes, enterprisesRes, activityRes] = await Promise.all([
        fetch('/api/superadmin/plg?status=all&role=all'),
        fetch('/api/superadmin/enterprises'),
        fetch('/api/superadmin/activity?limit=15'),
      ]);

      const [plgData, enterprisesData, activityData] = await Promise.all([
        plgRes.json(),
        enterprisesRes.json(),
        activityRes.json(),
      ]);

      if (plgData.success) {
        setStats(plgData.data.stats);
        setUsers(plgData.data.users || []);
        generateInsights(plgData.data.stats);
      }

      if (enterprisesData.success) {
        setEnterprises(enterprisesData.data?.enterprises || []);
      }

      if (activityData.success) {
        const humanActivities = (activityData.data || []).map((a: any) => formatActivity(a));
        setActivities(humanActivities);
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Generate insights
  function generateInsights(stats: Stats) {
    const newInsights: Insight[] = [];

    if (stats.demo_users > 3) {
      newInsights.push({
        id: 'convert-demos',
        type: 'opportunity',
        title: `${stats.demo_users} demo users ready to convert`,
        description: 'Active demo users could become paying customers.',
        action: {
          label: 'View demos',
          onClick: () => setUserFilter('demo'),
        },
      });
    }

    if (stats.suspended_users > 0) {
      newInsights.push({
        id: 'suspended',
        type: 'warning',
        title: `${stats.suspended_users} suspended users`,
        description: 'Review and decide whether to reinstate or remove.',
        action: {
          label: 'View suspended',
          onClick: () => setUserFilter('suspended'),
        },
      });
    }

    if (stats.converted_this_month > 0) {
      newInsights.push({
        id: 'conversions',
        type: 'success',
        title: `${stats.converted_this_month} conversions this month`,
        description: 'Demo users are converting to real accounts.',
      });
    }

    if (stats.total_users === 0) {
      newInsights.push({
        id: 'no-users',
        type: 'info',
        title: 'No users yet',
        description: 'Create your first user to get started.',
        action: {
          label: 'Create user',
          onClick: () => setShowCreatePanel(true),
        },
      });
    }

    setInsights(newInsights);
  }

  // Format activity to human-readable
  function formatActivity(event: any): ActivityItem {
    const metadata = event.metadata || {};
    const eventType = event.event_type;

    const descriptions: Record<string, (m: any) => string> = {
      'USER_CREATED': (m) => `${m.email || 'New user'} account created`,
      'USER_SIGNUP': (m) => `${m.email || 'Someone'} signed up`,
      'USER_LOGIN': (m) => `${m.email || 'User'} logged in`,
      'DEMO_CONVERTED': (m) => `${m.email || 'Demo'} upgraded to real account`,
      'USER_SUSPENDED': (m) => `${m.target_email || 'User'} suspended`,
      'USER_REINSTATED': (m) => `${m.target_email || 'User'} reinstated`,
      'ENTERPRISE_CREATED': (m) => `Enterprise "${m.name}" created`,
      'WORKSPACE_CREATED': (m) => `Workspace "${m.name}" created`,
      'PLG_ADMIN_CONVERT': (m) => `Converted ${m.target_user_email || 'user'} to real`,
      'PLG_ADMIN_SUSPEND': (m) => `Suspended ${m.target_user_email || 'user'}`,
      'PLG_ADMIN_REINSTATE': (m) => `Reinstated ${m.target_user_email || 'user'}`,
      'PLG_ADMIN_OVERRIDE': (m) => `Updated ${m.target_user_email || 'user'} settings`,
      'ONBOARDING_STARTED': (m) => `${m.email || 'User'} started onboarding`,
      'ONBOARDING_COMPLETED': (m) => `${m.email || 'User'} completed onboarding`,
    };

    const getDescription = descriptions[eventType] || (() => eventType.replace(/_/g, ' ').toLowerCase());

    return {
      id: event.id,
      event_type: eventType,
      description: getDescription(metadata),
      actor: metadata.performed_by || metadata.email || 'System',
      timestamp: event.created_at,
      importance: getImportance(eventType),
    };
  }

  function getImportance(eventType: string): 'high' | 'medium' | 'low' {
    if (['USER_SUSPENDED', 'DEMO_CONVERTED', 'ENTERPRISE_CREATED', 'PLG_ADMIN_CONVERT'].includes(eventType)) return 'high';
    if (['USER_CREATED', 'USER_SIGNUP', 'ONBOARDING_COMPLETED'].includes(eventType)) return 'medium';
    return 'low';
  }

  // Create user
  async function handleCreateUser(type: 'individual' | 'demo' | 'enterprise' | 'enterprise_admin') {
    if (!createEmail) {
      setCreateError('Email is required');
      return;
    }

    if ((type === 'enterprise' || type === 'enterprise_admin') && !createEnterprise) {
      setCreateError('Please select an enterprise');
      return;
    }

    setIsCreating(true);
    setCreateError('');
    setCreateSuccess('');

    const roleMap: Record<string, { role: string; is_demo: boolean }> = {
      individual: { role: 'INDIVIDUAL_USER', is_demo: false },
      demo: { role: 'INDIVIDUAL_USER', is_demo: true },
      enterprise: { role: 'ENTERPRISE_USER', is_demo: createIsDemo },
      enterprise_admin: { role: 'ENTERPRISE_ADMIN', is_demo: false },
    };

    const { role, is_demo } = roleMap[type];

    try {
      const res = await fetch('/api/superadmin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: createEmail,
          name: createName || createEmail.split('@')[0],
          role,
          is_demo,
          enterprise_id: createEnterprise || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCreateSuccess(`Created ${createEmail}`);
        setCreateEmail('');
        setCreateName('');
        setCreateEnterprise('');
        setCreateIsDemo(false);
        setSelectedUserType(null);
        fetchData();
        setTimeout(() => setCreateSuccess(''), 3000);
      } else {
        setCreateError(data.error || 'Failed to create user');
      }
    } catch (err) {
      setCreateError('Network error');
    } finally {
      setIsCreating(false);
    }
  }

  // User actions
  async function handleUserAction(userId: string, action: 'suspend' | 'reinstate' | 'convert') {
    try {
      const endpoint = `/api/superadmin/plg/${userId}/${action}`;
      const res = await fetch(endpoint, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error(`Failed to ${action} user:`, err);
    }
  }

  // Time ago
  function timeAgo(date: string): string {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }

  // Filter users
  const filteredUsers = users.filter((u) => {
    if (userFilter === 'demo' && (!u.is_demo || !u.is_active)) return false;
    if (userFilter === 'real' && (u.is_demo || !u.is_active)) return false;
    if (userFilter === 'suspended' && u.is_active) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        u.email.toLowerCase().includes(q) ||
        u.name?.toLowerCase().includes(q) ||
        u.enterprise_name?.toLowerCase().includes(q)
      );
    }

    return true;
  });

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <RefreshCw className="w-6 h-6 text-neutral-500 animate-spin" />
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
          <p className="text-sm text-neutral-500 mt-0.5">
            Create, manage, and govern all users
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-600">
            Updated {timeAgo(lastRefresh.toISOString())} ago
          </span>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Stats + Create Actions Row */}
      <div className="grid grid-cols-6 gap-4">
        {/* Stats */}
        <div className="col-span-4 grid grid-cols-4 gap-4">
          <StatCard
            label="Total Users"
            value={stats?.total_users || 0}
            icon={<Users className="w-4 h-4" />}
            onClick={() => setUserFilter('all')}
            active={userFilter === 'all'}
          />
          <StatCard
            label="Demo"
            value={stats?.demo_users || 0}
            icon={<Clock className="w-4 h-4" />}
            color="amber"
            onClick={() => setUserFilter('demo')}
            active={userFilter === 'demo'}
          />
          <StatCard
            label="Real"
            value={stats?.real_users || 0}
            icon={<CheckCircle className="w-4 h-4" />}
            color="emerald"
            onClick={() => setUserFilter('real')}
            active={userFilter === 'real'}
          />
          <StatCard
            label="Suspended"
            value={stats?.suspended_users || 0}
            icon={<UserX className="w-4 h-4" />}
            color="red"
            onClick={() => setUserFilter('suspended')}
            active={userFilter === 'suspended'}
          />
        </div>

        {/* Quick Create */}
        <div className="col-span-2 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              Quick Create
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setSelectedUserType('individual'); setShowCreatePanel(true); }}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-left transition-all"
            >
              <UserPlus className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-white">Individual</span>
            </button>
            <button
              onClick={() => { setSelectedUserType('demo'); setShowCreatePanel(true); }}
              className="flex items-center gap-2 px-3 py-2 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 rounded-lg text-left transition-all"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-white">Demo</span>
            </button>
            <button
              onClick={() => { setSelectedUserType('enterprise'); setShowCreatePanel(true); }}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-left transition-all"
            >
              <Briefcase className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-white">Enterprise</span>
            </button>
            <button
              onClick={() => { setSelectedUserType('enterprise_admin'); setShowCreatePanel(true); }}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-left transition-all"
            >
              <Shield className="w-4 h-4 text-violet-400" />
              <span className="text-xs text-white">Admin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Create Panel (slides down) */}
      {showCreatePanel && (
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 animate-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Create {selectedUserType === 'individual' ? 'Individual User' :
                selectedUserType === 'demo' ? 'Demo User' :
                selectedUserType === 'enterprise' ? 'Enterprise User' : 'Enterprise Admin'}
            </h3>
            <button
              onClick={() => { setShowCreatePanel(false); setSelectedUserType(null); setCreateError(''); }}
              className="p-1 text-neutral-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-xs text-neutral-500 mb-1">Email</label>
              <input
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-neutral-600"
                placeholder="user@example.com"
                autoFocus
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-neutral-500 mb-1">Name (optional)</label>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-neutral-600"
                placeholder="John Smith"
              />
            </div>
            {(selectedUserType === 'enterprise' || selectedUserType === 'enterprise_admin') && (
              <div className="flex-1">
                <label className="block text-xs text-neutral-500 mb-1">Enterprise</label>
                <select
                  value={createEnterprise}
                  onChange={(e) => setCreateEnterprise(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-neutral-600"
                >
                  <option value="">Select...</option>
                  {enterprises.map((e) => (
                    <option key={e.enterprise_id} value={e.enterprise_id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {selectedUserType === 'enterprise' && (
              <div className="flex items-center gap-2 pb-2">
                <input
                  type="checkbox"
                  id="createIsDemo"
                  checked={createIsDemo}
                  onChange={(e) => setCreateIsDemo(e.target.checked)}
                  className="rounded border-neutral-600"
                />
                <label htmlFor="createIsDemo" className="text-xs text-neutral-400">Demo</label>
              </div>
            )}
            <button
              onClick={() => handleCreateUser(selectedUserType as any)}
              disabled={isCreating}
              className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create'}
            </button>
          </div>

          {createError && (
            <div className="mt-3 text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {createError}
            </div>
          )}
          {createSuccess && (
            <div className="mt-3 text-sm text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {createSuccess}
            </div>
          )}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Users List (2/3 width) */}
        <div className="col-span-2 bg-neutral-900/50 border border-neutral-800 rounded-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-800">
            <h2 className="text-sm font-medium text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-neutral-500" />
              Users
              <span className="text-xs text-neutral-600">({filteredUsers.length})</span>
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-48 pl-8 pr-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-white focus:outline-none focus:border-neutral-600"
                />
              </div>
            </div>
          </div>

          {/* Users Table - Full Information */}
          <div className="overflow-x-auto">
            {filteredUsers.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
                <p className="text-neutral-500 text-sm">No users found</p>
                <button
                  onClick={() => setShowCreatePanel(true)}
                  className="mt-3 text-xs text-blue-400 hover:text-blue-300"
                >
                  Create your first user
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead className="sticky top-0 bg-neutral-900/95 backdrop-blur">
                  <tr className="text-xs text-neutral-500 border-b border-neutral-800">
                    <th className="text-left font-medium px-4 py-3">User</th>
                    <th className="text-left font-medium px-4 py-3">Role</th>
                    <th className="text-left font-medium px-4 py-3">Enterprise</th>
                    <th className="text-left font-medium px-4 py-3">Status</th>
                    <th className="text-left font-medium px-4 py-3">Last Login</th>
                    <th className="text-left font-medium px-4 py-3">Created</th>
                    <th className="text-right font-medium px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.slice(0, 100).map((user) => (
                    <tr key={user.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors">
                      {/* User Info */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                            user.role === 'SUPER_ADMIN' ? 'bg-red-500/20 text-red-400' :
                            user.role === 'ENTERPRISE_ADMIN' ? 'bg-violet-500/20 text-violet-400' :
                            user.role === 'ENTERPRISE_USER' ? 'bg-emerald-500/20 text-emerald-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm text-white font-medium">{user.name || 'No name'}</div>
                            <div className="text-xs text-neutral-400">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role - Full Name */}
                      <td className="px-4 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                          user.role === 'SUPER_ADMIN' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          user.role === 'ENTERPRISE_ADMIN' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' :
                          user.role === 'ENTERPRISE_USER' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {user.role === 'SUPER_ADMIN' && <Shield className="w-3.5 h-3.5" />}
                          {user.role === 'ENTERPRISE_ADMIN' && <Briefcase className="w-3.5 h-3.5" />}
                          {user.role === 'ENTERPRISE_USER' && <Building2 className="w-3.5 h-3.5" />}
                          {user.role === 'INDIVIDUAL_USER' && <Users className="w-3.5 h-3.5" />}
                          {user.role === 'SUPER_ADMIN' ? 'Super Admin' :
                           user.role === 'ENTERPRISE_ADMIN' ? 'Enterprise Admin' :
                           user.role === 'ENTERPRISE_USER' ? 'Enterprise User' :
                           'Individual'}
                        </div>
                      </td>

                      {/* Enterprise */}
                      <td className="px-4 py-4">
                        {user.enterprise_name ? (
                          <div className="text-sm text-white">{user.enterprise_name}</div>
                        ) : (
                          <span className="text-xs text-neutral-600">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        {!user.is_active ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                            <UserX className="w-3.5 h-3.5" />
                            Suspended
                          </div>
                        ) : user.is_demo ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="w-3.5 h-3.5" />
                            Demo
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Check className="w-3.5 h-3.5" />
                            Active
                          </div>
                        )}
                      </td>

                      {/* Last Login */}
                      <td className="px-4 py-4">
                        {user.last_login_at ? (
                          <div>
                            <div className="text-sm text-white">{timeAgo(user.last_login_at)} ago</div>
                            <div className="text-xs text-neutral-500">
                              {new Date(user.last_login_at).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-neutral-600">Never</span>
                        )}
                      </td>

                      {/* Created */}
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm text-white">{timeAgo(user.created_at)} ago</div>
                          <div className="text-xs text-neutral-500">
                            {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {user.is_demo && user.is_active && (
                            <button
                              onClick={() => handleUserAction(user.id, 'convert')}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-amber-400 hover:bg-amber-500/10 rounded transition-colors"
                              title="Convert to real account"
                            >
                              <TrendingUp className="w-3.5 h-3.5" />
                              Convert
                            </button>
                          )}
                          {user.is_active ? (
                            <button
                              onClick={() => handleUserAction(user.id, 'suspend')}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                              title="Suspend user"
                            >
                              <Pause className="w-3.5 h-3.5" />
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUserAction(user.id, 'reinstate')}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
                              title="Reinstate user"
                            >
                              <Play className="w-3.5 h-3.5" />
                              Reinstate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column - Insights + Activity */}
        <div className="col-span-1 space-y-4">
          {/* Insights */}
          {insights.length > 0 && (
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
              <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                Insights
              </h3>
              <div className="space-y-2">
                {insights.map((insight) => (
                  <div
                    key={insight.id}
                    className={`p-3 rounded-lg border ${
                      insight.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20' :
                      insight.type === 'opportunity' ? 'bg-blue-500/5 border-blue-500/20' :
                      insight.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' :
                      'bg-neutral-800/50 border-neutral-700'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {insight.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5" />}
                      {insight.type === 'opportunity' && <TrendingUp className="w-4 h-4 text-blue-400 mt-0.5" />}
                      {insight.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" />}
                      {insight.type === 'info' && <Activity className="w-4 h-4 text-neutral-400 mt-0.5" />}
                      <div className="flex-1">
                        <div className="text-xs font-medium text-white">{insight.title}</div>
                        <div className="text-xs text-neutral-500 mt-0.5">{insight.description}</div>
                        {insight.action && (
                          <button
                            onClick={insight.action.onClick}
                            className="text-xs text-blue-400 hover:text-blue-300 mt-1.5 flex items-center gap-1"
                          >
                            {insight.action.label}
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Feed */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-violet-400" />
                Activity
              </h3>
              <a href="/superadmin/activity" className="text-xs text-neutral-500 hover:text-white flex items-center gap-1">
                All <ChevronRight className="w-3 h-3" />
              </a>
            </div>
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {activities.length === 0 ? (
                <div className="text-center py-6 text-neutral-600 text-xs">
                  No recent activity
                </div>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className={`p-2 rounded border-l-2 ${
                      activity.importance === 'high' ? 'border-l-amber-500' :
                      activity.importance === 'medium' ? 'border-l-blue-500' :
                      'border-l-neutral-600'
                    } bg-neutral-800/30 hover:bg-neutral-800/50 transition-colors`}
                  >
                    <div className="text-xs text-white">{activity.description}</div>
                    <div className="text-[10px] text-neutral-500 mt-0.5 flex items-center justify-between">
                      <span>{activity.actor}</span>
                      <span>{timeAgo(activity.timestamp)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Enterprises */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                Enterprises
                <span className="text-xs text-neutral-600">({enterprises.length})</span>
              </h3>
              <a href="/superadmin/tenants" className="text-xs text-neutral-500 hover:text-white flex items-center gap-1">
                Manage <ChevronRight className="w-3 h-3" />
              </a>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {enterprises.length === 0 ? (
                <div className="text-center py-4 text-neutral-600 text-xs">
                  No enterprises yet
                </div>
              ) : (
                enterprises.slice(0, 5).map((enterprise) => (
                  <div key={enterprise.enterprise_id} className="flex items-center justify-between p-2 bg-neutral-800/30 rounded">
                    <div>
                      <div className="text-xs font-medium text-white">{enterprise.name}</div>
                      <div className="text-[10px] text-neutral-500">{enterprise.domain}</div>
                    </div>
                    <span className="text-xs text-neutral-500">{enterprise.user_count || 0} users</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Role Distribution */}
      {stats && (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            User Distribution by Role
          </h3>
          <div className="grid grid-cols-4 gap-4">
            <RoleBar role="Individual" count={stats.role_breakdown.INDIVIDUAL_USER} total={stats.total_users} color="blue" />
            <RoleBar role="Enterprise User" count={stats.role_breakdown.ENTERPRISE_USER} total={stats.total_users} color="emerald" />
            <RoleBar role="Enterprise Admin" count={stats.role_breakdown.ENTERPRISE_ADMIN} total={stats.total_users} color="violet" />
            <RoleBar role="Super Admin" count={stats.role_breakdown.SUPER_ADMIN} total={stats.total_users} color="red" />
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon,
  color = 'default',
  onClick,
  active,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color?: 'default' | 'amber' | 'emerald' | 'red';
  onClick?: () => void;
  active?: boolean;
}) {
  const colors = {
    default: active ? 'bg-white/10 border-white/20' : 'bg-neutral-900/50 border-neutral-800 hover:bg-neutral-800/50',
    amber: active ? 'bg-amber-500/10 border-amber-500/30' : 'bg-neutral-900/50 border-neutral-800 hover:bg-amber-500/5',
    emerald: active ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-neutral-900/50 border-neutral-800 hover:bg-emerald-500/5',
    red: active ? 'bg-red-500/10 border-red-500/30' : 'bg-neutral-900/50 border-neutral-800 hover:bg-red-500/5',
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border text-left transition-all ${colors[color]}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-neutral-500">{icon}</span>
      </div>
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="text-xs text-neutral-500 mt-0.5">{label}</div>
    </button>
  );
}

// Role Bar Component
function RoleBar({
  role,
  count,
  total,
  color,
}: {
  role: string;
  count: number;
  total: number;
  color: 'blue' | 'emerald' | 'violet' | 'red';
}) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  const colors = {
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    violet: 'bg-violet-500',
    red: 'bg-red-500',
  };

  return (
    <div className="p-3 bg-neutral-800/30 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-neutral-400">{role}</span>
        <span className="text-sm font-medium text-white">{count}</span>
      </div>
      <div className="h-1.5 bg-neutral-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors[color]} rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-[10px] text-neutral-600 mt-1">{percentage}%</div>
    </div>
  );
}
