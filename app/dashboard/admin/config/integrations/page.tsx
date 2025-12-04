/**
 * API Integrations Management Page
 *
 * Super Admin page for managing API keys for external data sources.
 * Apollo, SERP, LinkedIn, Crunchbase, etc.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

type IntegrationProvider = 'apollo' | 'serp' | 'linkedin' | 'crunchbase';

interface ApiIntegration {
  id: string;
  provider: IntegrationProvider;
  name: string;
  description?: string;
  apiKey: string;
  apiSecret?: string;
  baseUrl?: string;
  isActive: boolean;
  isDefault: boolean;
  lastUsedAt?: string;
  usageCount: number;
  errorCount: number;
  lastError?: string;
  lastErrorAt?: string;
  createdAt: string;
}

const PROVIDER_INFO: Record<IntegrationProvider, { label: string; icon: string; description: string }> = {
  apollo: {
    label: 'Apollo',
    icon: '🎯',
    description: 'Company data, headcount, hiring signals, HR contacts',
  },
  serp: {
    label: 'SerpAPI',
    icon: '🔍',
    description: 'Google News, hiring announcements, expansion signals',
  },
  linkedin: {
    label: 'LinkedIn',
    icon: '💼',
    description: 'Profile enrichment, company data (coming soon)',
  },
  crunchbase: {
    label: 'Crunchbase',
    icon: '📊',
    description: 'Funding rounds, growth signals (coming soon)',
  },
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<ApiIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);

  const fetchIntegrations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/integrations');
      const data = await response.json();

      if (data.success) {
        setIntegrations(data.data);
      } else {
        setError(data.error || 'Failed to fetch integrations');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const handleAddIntegration = async (formData: {
    provider: IntegrationProvider;
    name: string;
    description?: string;
    apiKey: string;
    apiSecret?: string;
    baseUrl?: string;
    isDefault: boolean;
  }) => {
    try {
      const response = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setIntegrations((prev) => [data.data, ...prev]);
        setShowAddModal(false);
        setSelectedProvider(null);
      } else {
        setError(data.error || 'Failed to create integration');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error(err);
    }
  };

  // Group integrations by provider
  const groupedIntegrations = integrations.reduce(
    (acc, integration) => {
      if (!acc[integration.provider]) {
        acc[integration.provider] = [];
      }
      acc[integration.provider].push(integration);
      return acc;
    },
    {} as Record<IntegrationProvider, ApiIntegration[]>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <a href="/dashboard/admin" className="hover:text-blue-600">
                  Admin
                </a>
                <span>/</span>
                <span>API Integrations</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">API Integrations</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage API keys for external data sources. No hardcoded keys.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Add Integration
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">
              Dismiss
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin text-4xl">⏳</div>
            <p className="text-gray-500 mt-2">Loading integrations...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Provider Cards */}
            {(Object.keys(PROVIDER_INFO) as IntegrationProvider[]).map((provider) => {
              const info = PROVIDER_INFO[provider];
              const providerIntegrations = groupedIntegrations[provider] || [];
              const hasActive = providerIntegrations.some((i) => i.isActive);

              return (
                <div
                  key={provider}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                >
                  {/* Provider Header */}
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{info.icon}</span>
                      <div>
                        <h2 className="font-medium text-gray-900">{info.label}</h2>
                        <p className="text-sm text-gray-500">{info.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {hasActive ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-500 rounded">
                          Not Configured
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setSelectedProvider(provider);
                          setShowAddModal(true);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        + Add Key
                      </button>
                    </div>
                  </div>

                  {/* Integration List */}
                  {providerIntegrations.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {providerIntegrations.map((integration) => (
                        <IntegrationRow
                          key={integration.id}
                          integration={integration}
                          onRefresh={fetchIntegrations}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="px-6 py-8 text-center text-gray-500">
                      <p>No API keys configured for {info.label}.</p>
                      <button
                        onClick={() => {
                          setSelectedProvider(provider);
                          setShowAddModal(true);
                        }}
                        className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Add your first key
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Integration Modal */}
      {showAddModal && (
        <AddIntegrationModal
          selectedProvider={selectedProvider}
          onClose={() => {
            setShowAddModal(false);
            setSelectedProvider(null);
          }}
          onSubmit={handleAddIntegration}
        />
      )}
    </div>
  );
}

function IntegrationRow({
  integration,
  onRefresh,
}: {
  integration: ApiIntegration;
  onRefresh: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this integration?')) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/integrations/${integration.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onRefresh();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      await fetch(`/api/admin/integrations/${integration.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !integration.isActive }),
      });
      onRefresh();
    } catch (err) {
      console.error('Failed to toggle integration', err);
    }
  };

  return (
    <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{integration.name}</span>
          {integration.isDefault && (
            <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
              Default
            </span>
          )}
          {!integration.isActive && (
            <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
              Disabled
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
          <span>Key: {integration.apiKey}</span>
          {integration.lastUsedAt && (
            <span>
              Last used: {new Date(integration.lastUsedAt).toLocaleDateString()}
            </span>
          )}
          <span>Uses: {integration.usageCount}</span>
          {integration.errorCount > 0 && (
            <span className="text-red-500">Errors: {integration.errorCount}</span>
          )}
        </div>
        {integration.lastError && (
          <div className="mt-1 text-xs text-red-500">
            Last error: {integration.lastError}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleToggleActive}
          className={`px-3 py-1 text-sm rounded ${
            integration.isActive
              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {integration.isActive ? 'Disable' : 'Enable'}
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50"
        >
          {isDeleting ? '...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

function AddIntegrationModal({
  selectedProvider,
  onClose,
  onSubmit,
}: {
  selectedProvider: IntegrationProvider | null;
  onClose: () => void;
  onSubmit: (data: {
    provider: IntegrationProvider;
    name: string;
    description?: string;
    apiKey: string;
    apiSecret?: string;
    baseUrl?: string;
    isDefault: boolean;
  }) => void;
}) {
  const [provider, setProvider] = useState<IntegrationProvider>(selectedProvider || 'apollo');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [isDefault, setIsDefault] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        provider,
        name: name || `${PROVIDER_INFO[provider].label} API Key`,
        description: description || undefined,
        apiKey,
        apiSecret: apiSecret || undefined,
        baseUrl: baseUrl || undefined,
        isDefault,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add API Integration</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as IntegrationProvider)}
              disabled={selectedProvider !== null}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {(Object.keys(PROVIDER_INFO) as IntegrationProvider[]).map((p) => (
                <option key={p} value={p}>
                  {PROVIDER_INFO[p].icon} {PROVIDER_INFO[p].label}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`${PROVIDER_INFO[provider].label} API Key`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Production key, Test key"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key *</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter API key"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* API Secret (for providers that need it) */}
          {(provider === 'linkedin' || provider === 'crunchbase') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Secret (optional)
              </label>
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Enter API secret"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Custom Base URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Base URL (optional)
            </label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="Override default API URL"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Default Flag */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isDefault" className="text-sm text-gray-700">
              Set as default for this provider
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!apiKey || isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Integration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
