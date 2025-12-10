/**
 * Tenant Settings Form Component
 * S149: Tenant Admin MVP
 *
 * Multi-section form for tenant configuration:
 * - General settings
 * - Features toggles
 * - Team settings
 * - Workspace settings
 */

'use client';

import { useState, useCallback } from 'react';
import type { TenantSettings } from '@/lib/admin/tenant-settings';

interface TenantSettingsFormProps {
  settings: TenantSettings;
  onSave: (section: keyof TenantSettings, data: unknown) => Promise<void>;
  isLoading?: boolean;
}

type SettingsSection = 'general' | 'features' | 'team' | 'workspace' | 'outreach';

export function TenantSettingsForm({ settings, onSave, isLoading = false }: TenantSettingsFormProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [saving, setSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = useCallback(<K extends keyof TenantSettings>(
    section: K,
    field: string,
    value: unknown
  ) => {
    setLocalSettings(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as Record<string, unknown>),
        [field]: value,
      },
    }));
    setHasChanges(true);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(activeSection, localSettings[activeSection]);
      setHasChanges(false);
    } finally {
      setSaving(false);
    }
  };

  const sections: { id: SettingsSection; label: string; icon: string }[] = [
    { id: 'general', label: 'General', icon: 'cog' },
    { id: 'features', label: 'Features', icon: 'toggle' },
    { id: 'team', label: 'Team', icon: 'users' },
    { id: 'workspace', label: 'Workspace', icon: 'layout' },
    { id: 'outreach', label: 'Outreach', icon: 'mail' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {/* Section Tabs */}
      <div className="border-b border-gray-200 px-4">
        <nav className="flex gap-4 overflow-x-auto">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`py-3 px-2 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
                activeSection === section.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Form Content */}
      <div className="p-6">
        {activeSection === 'general' && (
          <GeneralSection
            settings={localSettings.general}
            onChange={(field, value) => handleChange('general', field, value)}
          />
        )}

        {activeSection === 'features' && (
          <FeaturesSection
            settings={localSettings.features}
            onChange={(field, value) => handleChange('features', field, value)}
          />
        )}

        {activeSection === 'team' && (
          <TeamSection
            settings={localSettings.team}
            onChange={(field, value) => handleChange('team', field, value)}
          />
        )}

        {activeSection === 'workspace' && (
          <WorkspaceSection
            settings={localSettings.workspace}
            onChange={(field, value) => handleChange('workspace', field, value)}
          />
        )}

        {activeSection === 'outreach' && (
          <OutreachSection
            settings={localSettings.outreach}
            onChange={(field, value) => handleChange('outreach', field, value)}
          />
        )}
      </div>

      {/* Save Bar */}
      {hasChanges && (
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-xl flex items-center justify-between">
          <p className="text-sm text-gray-600">You have unsaved changes</p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setLocalSettings(settings);
                setHasChanges(false);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving || isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// General Settings Section
function GeneralSection({
  settings,
  onChange,
}: {
  settings: TenantSettings['general'];
  onChange: (field: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
        <p className="text-sm text-gray-500 mb-6">
          Configure basic workspace information and branding.
        </p>
      </div>

      <FormField
        label="Workspace Name"
        description="The display name for your workspace"
      >
        <input
          type="text"
          value={settings.displayName}
          onChange={(e) => onChange('displayName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </FormField>

      <FormField
        label="Timezone"
        description="Default timezone for scheduling and reports"
      >
        <select
          value={settings.timezone}
          onChange={(e) => onChange('timezone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="UTC">UTC</option>
          <option value="Asia/Dubai">Asia/Dubai (UAE)</option>
          <option value="Asia/Kolkata">Asia/Kolkata (India)</option>
          <option value="America/New_York">America/New_York</option>
          <option value="America/Los_Angeles">America/Los_Angeles</option>
          <option value="Europe/London">Europe/London</option>
        </select>
      </FormField>

      <FormField
        label="Date Format"
        description="How dates are displayed across the platform"
      >
        <select
          value={settings.dateFormat}
          onChange={(e) => onChange('dateFormat', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
        </select>
      </FormField>

      <FormField
        label="Currency"
        description="Default currency for financial displays"
      >
        <select
          value={settings.currency}
          onChange={(e) => onChange('currency', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="USD">USD - US Dollar</option>
          <option value="AED">AED - UAE Dirham</option>
          <option value="INR">INR - Indian Rupee</option>
          <option value="EUR">EUR - Euro</option>
          <option value="GBP">GBP - British Pound</option>
        </select>
      </FormField>
    </div>
  );
}

// Features Section
function FeaturesSection({
  settings,
  onChange,
}: {
  settings: TenantSettings['features'];
  onChange: (field: string, value: unknown) => void;
}) {
  const features = [
    { key: 'enableSIVA', label: 'SIVA AI Assistant', description: 'Enable AI-powered sales assistant' },
    { key: 'enableAutonomousMode', label: 'Autonomous Mode', description: 'Allow SIVA to operate autonomously' },
    { key: 'enableBulkExport', label: 'Bulk Export', description: 'Allow bulk data exports' },
    { key: 'enableAPIAccess', label: 'API Access', description: 'Enable REST API access' },
    { key: 'enableWebhooks', label: 'Webhooks', description: 'Enable webhook integrations' },
    { key: 'enableTeamCollaboration', label: 'Team Collaboration', description: 'Enable team features' },
    { key: 'enableAdvancedAnalytics', label: 'Advanced Analytics', description: 'Unlock advanced reporting' },
    { key: 'enableAuditLogs', label: 'Audit Logs', description: 'Track all user actions' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Feature Toggles</h3>
        <p className="text-sm text-gray-500 mb-6">
          Enable or disable platform features for this tenant.
        </p>
      </div>

      <div className="space-y-4">
        {features.map((feature) => (
          <div
            key={feature.key}
            className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg"
          >
            <div>
              <p className="font-medium text-gray-900">{feature.label}</p>
              <p className="text-sm text-gray-500">{feature.description}</p>
            </div>
            <Toggle
              enabled={settings[feature.key as keyof typeof settings] as boolean}
              onChange={(value) => onChange(feature.key, value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Team Section
function TeamSection({
  settings,
  onChange,
}: {
  settings: TenantSettings['team'];
  onChange: (field: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Team Settings</h3>
        <p className="text-sm text-gray-500 mb-6">
          Configure team limits and permissions.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <FormField label="Max Users" description="Maximum number of users">
          <input
            type="number"
            min={1}
            max={1000}
            value={settings.maxUsers}
            onChange={(e) => onChange('maxUsers', parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </FormField>

        <FormField label="Max Teams" description="Maximum number of teams">
          <input
            type="number"
            min={1}
            max={100}
            value={settings.maxTeams}
            onChange={(e) => onChange('maxTeams', parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </FormField>
      </div>

      <FormField label="Session Timeout (minutes)" description="Auto-logout after inactivity">
        <input
          type="number"
          min={5}
          max={1440}
          value={settings.sessionTimeout}
          onChange={(e) => onChange('sessionTimeout', parseInt(e.target.value) || 60)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </FormField>

      <div className="space-y-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Allow User Invites</p>
            <p className="text-sm text-gray-500">Let admins invite new users</p>
          </div>
          <Toggle
            enabled={settings.allowUserInvites}
            onChange={(value) => onChange('allowUserInvites', value)}
          />
        </div>

        <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Require Approval</p>
            <p className="text-sm text-gray-500">New users need approval before joining</p>
          </div>
          <Toggle
            enabled={settings.requireApproval}
            onChange={(value) => onChange('requireApproval', value)}
          />
        </div>

        <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Require MFA</p>
            <p className="text-sm text-gray-500">Enforce multi-factor authentication</p>
          </div>
          <Toggle
            enabled={settings.requireMFA}
            onChange={(value) => onChange('requireMFA', value)}
          />
        </div>
      </div>
    </div>
  );
}

// Workspace Section
function WorkspaceSection({
  settings,
  onChange,
}: {
  settings: TenantSettings['workspace'];
  onChange: (field: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Workspace Settings</h3>
        <p className="text-sm text-gray-500 mb-6">
          Customize the workspace experience.
        </p>
      </div>

      <FormField label="Default View" description="Initial view when users open the dashboard">
        <select
          value={settings.defaultView}
          onChange={(e) => onChange('defaultView', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="radar">Radar</option>
          <option value="list">List</option>
          <option value="kanban">Kanban</option>
          <option value="calendar">Calendar</option>
        </select>
      </FormField>

      <div className="space-y-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Quick Actions</p>
            <p className="text-sm text-gray-500">Show quick action buttons in dashboard</p>
          </div>
          <Toggle
            enabled={settings.showQuickActions}
            onChange={(value) => onChange('showQuickActions', value)}
          />
        </div>

        <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Dark Mode</p>
            <p className="text-sm text-gray-500">Allow users to enable dark mode</p>
          </div>
          <Toggle
            enabled={settings.enableDarkMode}
            onChange={(value) => onChange('enableDarkMode', value)}
          />
        </div>

        <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Notifications</p>
            <p className="text-sm text-gray-500">Enable notification system</p>
          </div>
          <Toggle
            enabled={settings.enableNotifications}
            onChange={(value) => onChange('enableNotifications', value)}
          />
        </div>
      </div>
    </div>
  );
}

// Outreach Section
function OutreachSection({
  settings,
  onChange,
}: {
  settings: TenantSettings['outreach'];
  onChange: (field: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Outreach Settings</h3>
        <p className="text-sm text-gray-500 mb-6">
          Configure email and outreach limits.
        </p>
      </div>

      <div className="flex items-center justify-between py-3 px-4 bg-blue-50 rounded-lg mb-6">
        <div>
          <p className="font-medium text-blue-900">Outreach Module</p>
          <p className="text-sm text-blue-700">Enable the outreach feature</p>
        </div>
        <Toggle
          enabled={settings.enabled}
          onChange={(value) => onChange('enabled', value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <FormField label="Max Daily Emails" description="Per-user email limit">
          <input
            type="number"
            min={0}
            max={1000}
            value={settings.maxDailyEmails}
            onChange={(e) => onChange('maxDailyEmails', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </FormField>

        <FormField label="Max Daily Sequences" description="Per-user sequence limit">
          <input
            type="number"
            min={0}
            max={100}
            value={settings.maxDailySequences}
            onChange={(e) => onChange('maxDailySequences', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </FormField>
      </div>

      <FormField label="Default Tone" description="Default email tone for new messages">
        <select
          value={settings.defaultTone}
          onChange={(e) => onChange('defaultTone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="professional">Professional</option>
          <option value="friendly">Friendly</option>
          <option value="formal">Formal</option>
          <option value="casual">Casual</option>
          <option value="consultative">Consultative</option>
        </select>
      </FormField>

      <div className="grid grid-cols-2 gap-6">
        <FormField label="Working Hours Start" description="Emails sent after this time">
          <input
            type="time"
            value={settings.workingHoursStart}
            onChange={(e) => onChange('workingHoursStart', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </FormField>

        <FormField label="Working Hours End" description="Emails sent before this time">
          <input
            type="time"
            value={settings.workingHoursEnd}
            onChange={(e) => onChange('workingHoursEnd', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </FormField>
      </div>

      <div className="space-y-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Require Approval</p>
            <p className="text-sm text-gray-500">Outreach needs manager approval</p>
          </div>
          <Toggle
            enabled={settings.requireApproval}
            onChange={(value) => onChange('requireApproval', value)}
          />
        </div>

        <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Email Tracking</p>
            <p className="text-sm text-gray-500">Track opens and clicks</p>
          </div>
          <Toggle
            enabled={settings.enableTracking}
            onChange={(value) => onChange('enableTracking', value)}
          />
        </div>

        <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Exclude Weekends</p>
            <p className="text-sm text-gray-500">No emails on Saturday/Sunday</p>
          </div>
          <Toggle
            enabled={settings.excludeWeekends}
            onChange={(value) => onChange('excludeWeekends', value)}
          />
        </div>
      </div>
    </div>
  );
}

// Shared Components
function FormField({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {description && <p className="text-xs text-gray-500 mb-2">{description}</p>}
      {children}
    </div>
  );
}

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        enabled ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
