'use client';

/**
 * S304: Enterprise Dashboard Component
 * Part of User & Enterprise Management Program v1.1
 * Phase D - Frontend & UI
 *
 * Main dashboard for enterprise admins.
 */

import React, { useState, useEffect } from 'react';
import { useEnterprise } from '@/lib/providers/EnterpriseContextProvider';
import { EnterpriseSettingsCard } from './EnterpriseSettingsCard';
import { WorkspaceList } from './WorkspaceList';
import { UserList } from './UserList';
import { DemoBanner } from './DemoBanner';

interface EnterpriseStats {
  enterprise: {
    id: string;
    name: string;
    type: string;
    plan: string;
  };
  stats: {
    userCount: number;
    workspaceCount: number;
    discoveriesThisMonth?: number;
  };
  limits: {
    max_users: number;
    max_workspaces: number;
    max_discoveries_per_month?: number;
  };
}

export function EnterpriseDashboard() {
  const { enterprise, isEnterpriseAdmin, isDemoUser, isLoading } = useEnterprise();
  const [stats, setStats] = useState<EnterpriseStats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'workspaces' | 'settings'>('overview');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    if (enterprise) {
      fetchStats();
    }
  }, [enterprise]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/enterprise');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch enterprise stats:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!enterprise) {
    return (
      <div className="p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Enterprise Account
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            You are not associated with an enterprise. Contact your administrator or create a new enterprise.
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Create Enterprise
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Team' },
    { id: 'workspaces', label: 'Workspaces' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Demo Banner */}
      {isDemoUser && (
        <DemoBanner
          variant="banner"
          onUpgrade={() => setShowUpgradeModal(true)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {enterprise.name}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Enterprise Dashboard
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Users Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Team Members</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {stats?.stats.userCount || 0}
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        {' '}/ {stats?.limits.max_users || 5}
                      </span>
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Workspaces Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Workspaces</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {stats?.stats.workspaceCount || 0}
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        {' '}/ {stats?.limits.max_workspaces || 3}
                      </span>
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Plan Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Plan</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 capitalize">
                      {enterprise.plan || 'Free'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Access */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <UserList onInviteUser={() => setActiveTab('users')} />
              <WorkspaceList onCreateWorkspace={() => setActiveTab('workspaces')} />
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <UserList
            onInviteUser={() => {
              // TODO: Open invite modal
            }}
            onUserSelect={(user) => {
              // TODO: Open user detail
            }}
          />
        )}

        {/* Workspaces Tab */}
        {activeTab === 'workspaces' && (
          <WorkspaceList
            onCreateWorkspace={() => {
              // TODO: Open create workspace modal
            }}
            onWorkspaceSelect={(ws) => {
              // TODO: Open workspace detail
            }}
          />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <EnterpriseSettingsCard onUpdate={fetchStats} />
        )}
      </div>
    </div>
  );
}

export default EnterpriseDashboard;
