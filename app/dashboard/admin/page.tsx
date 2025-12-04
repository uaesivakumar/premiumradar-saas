/**
 * Admin Dashboard Page
 *
 * Main admin panel for tenant management, user management,
 * and system configuration.
 */

'use client';

import { useState } from 'react';
import { TenantTable, ImpersonationBanner } from '@/components/admin';
import {
  useImpersonationStore,
  startImpersonation,
  type TenantSummary,
} from '@/lib/admin';

type AdminTab = 'tenants' | 'users' | 'config';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('tenants');
  const [impersonateModal, setImpersonateModal] = useState<TenantSummary | null>(null);
  const [impersonateReason, setImpersonateReason] = useState('');
  const [isImpersonating, setIsImpersonating] = useState(false);

  const startImpersonationSession = useImpersonationStore((s) => s.startImpersonation);

  async function handleImpersonate() {
    if (!impersonateModal || impersonateReason.length < 10) return;

    setIsImpersonating(true);
    try {
      const session = await startImpersonation(
        {
          targetTenantId: impersonateModal.id,
          reason: impersonateReason,
        },
        'admin_user', // Would come from auth context
        'admin@premiumradar.com'
      );

      startImpersonationSession(session);
      setImpersonateModal(null);
      setImpersonateReason('');
    } finally {
      setIsImpersonating(false);
    }
  }

  const tabs = [
    { id: 'tenants' as const, label: 'Tenants', icon: '🏢' },
    { id: 'users' as const, label: 'Users', icon: '👥' },
    { id: 'config' as const, label: 'Configuration', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ImpersonationBanner />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">Manage tenants, users, and system configuration</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg font-medium">
                Super Admin
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'tenants' && (
          <TenantTable
            onSelectTenant={(tenant) => {
              console.log('Selected tenant:', tenant);
            }}
            onImpersonate={(tenant) => setImpersonateModal(tenant)}
          />
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="text-4xl mb-4">👥</div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">User Management</h2>
            <p className="text-gray-500">
              Manage users across all tenants. Ban, disable, or delete user accounts.
            </p>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="grid grid-cols-2 gap-6">
            <ConfigCard
              icon="📋"
              title="Version Control"
              description="View and manage application versions"
              href="/dashboard/admin/config/versions"
            />
            <ConfigCard
              icon="🎛️"
              title="Feature Flags"
              description="Toggle features and manage rollouts"
              href="/dashboard/admin/config/flags"
            />
            <ConfigCard
              icon="⚙️"
              title="OS Settings"
              description="Configure API, AI, and cache settings"
              href="/dashboard/admin/config/settings"
            />
            <ConfigCard
              icon="📊"
              title="Scoring Parameters"
              description="Tune Q/T/L/E scoring weights"
              href="/dashboard/admin/config/scoring"
            />
            <ConfigCard
              icon="🏷️"
              title="Vertical Registry"
              description="Manage industry verticals"
              href="/dashboard/admin/config/verticals"
            />
            <ConfigCard
              icon="🔑"
              title="API Integrations"
              description="Manage Apollo, SERP, and other API keys"
              href="/dashboard/admin/config/integrations"
            />
          </div>
        )}
      </div>

      {/* Impersonate Modal */}
      {impersonateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Impersonate Tenant
            </h2>

            <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="text-sm text-orange-800">
                  <p className="font-medium">You are about to impersonate:</p>
                  <p className="font-bold mt-1">{impersonateModal.name}</p>
                  <p className="mt-2 text-orange-700">
                    All actions will be logged for audit purposes.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for impersonation *
              </label>
              <textarea
                value={impersonateReason}
                onChange={(e) => setImpersonateReason(e.target.value)}
                placeholder="e.g., Customer support request #12345"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {impersonateReason.length > 0 && impersonateReason.length < 10 && (
                <p className="text-xs text-red-500 mt-1">
                  Reason must be at least 10 characters
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setImpersonateModal(null);
                  setImpersonateReason('');
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImpersonate}
                disabled={impersonateReason.length < 10 || isImpersonating}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImpersonating ? 'Starting...' : 'Start Impersonation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfigCard({
  icon,
  title,
  description,
  href,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="block bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all"
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </a>
  );
}
