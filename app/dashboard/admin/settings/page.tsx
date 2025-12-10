/**
 * Tenant Settings Page
 * S149: Tenant Admin MVP
 *
 * Admin interface for tenant configuration including:
 * - General settings
 * - Feature toggles
 * - Team settings
 * - Workspace customization
 * - Outreach configuration
 */

'use client';

import { useState, useEffect } from 'react';
import { TenantSettingsForm } from '@/components/admin/TenantSettingsForm';
import type { TenantSettings } from '@/lib/admin/tenant-settings';

// Default settings for MVP (would load from API in production)
const defaultSettings: TenantSettings = {
  id: 'settings-1',
  tenantId: 'tenant-1',
  general: {
    displayName: 'My Workspace',
    timezone: 'Asia/Dubai',
    dateFormat: 'DD/MM/YYYY',
    currency: 'AED',
    language: 'en',
    logoUrl: null,
    primaryColor: null,
    secondaryColor: null,
  },
  features: {
    enableSIVA: true,
    enableAutonomousMode: false,
    enableBulkExport: true,
    enableAPIAccess: false,
    enableWebhooks: false,
    enableCustomEnrichment: false,
    enableTeamCollaboration: true,
    enableAdvancedAnalytics: false,
    enableWhiteLabeling: false,
    enableSSO: false,
    enableAuditLogs: true,
    enableDataRetention: true,
    maxDataRetentionDays: 90,
  },
  verticals: {
    allowAll: true,
    allowed: [],
    blocked: [],
    default: 'banking',
  },
  regions: {
    allowAll: false,
    allowed: ['UAE'],
    blocked: [],
    default: 'UAE',
  },
  team: {
    maxUsers: 25,
    maxTeams: 5,
    allowUserInvites: true,
    requireApproval: false,
    defaultRole: 'analyst',
    allowRoleCreation: false,
    enforcePasswordPolicy: true,
    sessionTimeout: 60,
    requireMFA: false,
  },
  workspace: {
    defaultView: 'radar',
    showQuickActions: true,
    enableDarkMode: true,
    enableNotifications: true,
    notificationChannels: ['email', 'in-app'],
    dashboardWidgets: ['radar', 'activity', 'tasks', 'metrics'],
    customCss: null,
  },
  outreach: {
    enabled: true,
    defaultTone: 'professional',
    maxDailyEmails: 100,
    maxDailySequences: 10,
    requireApproval: false,
    enableTracking: true,
    enableABTesting: false,
    cooldownHours: 24,
    excludeWeekends: true,
    workingHoursStart: '09:00',
    workingHoursEnd: '18:00',
  },
  enrichment: {
    enabled: true,
    autoEnrich: true,
    providers: ['apollo', 'clearbit'],
    customPipelines: [],
    refreshInterval: 30,
    maxCreditsPerMonth: 10000,
  },
  billing: {
    showUsage: true,
    showInvoices: true,
    showPlanDetails: true,
    allowPlanChange: true,
    allowAddOns: true,
    billingEmail: null,
    billingAlerts: true,
    alertThreshold: 80,
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date(),
  updatedBy: null,
  version: 1,
};

export default function TenantSettingsPage() {
  const [settings, setSettings] = useState<TenantSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    // Simulate loading settings from API
    const loadSettings = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/admin/tenant-settings');
        // const data = await response.json();
        // setSettings(data);

        // Use default settings for MVP
        setSettings(defaultSettings);
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async (section: keyof TenantSettings, data: unknown) => {
    setSaveStatus('saving');
    try {
      // TODO: Replace with actual API call
      // await fetch('/api/admin/tenant-settings', {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ section, data }),
      // });

      // Optimistic update
      setSettings(prev => ({
        ...prev,
        [section]: data,
        updatedAt: new Date(),
        version: prev.version + 1,
      }));

      console.log(`[Settings] Saved section: ${section}`, data);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a
                href="/dashboard/admin"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </a>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Tenant Settings</h1>
                <p className="text-sm text-gray-500">Configure workspace preferences and features</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {saveStatus === 'saved' && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Saved
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Error saving
                </span>
              )}
              <span className="text-sm text-gray-400">
                v{settings.version} | Updated {settings.updatedAt.toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <TenantSettingsForm
          settings={settings}
          onSave={handleSave}
          isLoading={saveStatus === 'saving'}
        />
      </div>
    </div>
  );
}
