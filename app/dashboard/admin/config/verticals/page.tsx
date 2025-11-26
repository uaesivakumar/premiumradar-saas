/**
 * Vertical Config Management Page
 *
 * Super-Admin page for managing vertical/sub-vertical/region configurations.
 * This is where all vertical logic is defined (plug-and-play).
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// =============================================================================
// Types
// =============================================================================

interface VerticalConfig {
  id: string;
  createdAt: string;
  updatedAt: string;
  vertical: string;
  subVertical: string;
  regionCountry: string;
  regionCity?: string;
  name: string;
  description?: string;
  radarTarget: 'companies' | 'individuals' | 'families' | 'candidates';
  config: VerticalConfigData;
  isActive: boolean;
  isSeeded: boolean;
}

interface VerticalConfigData {
  allowedSignalTypes: string[];
  signalConfigs: SignalConfig[];
  scoringWeights: {
    quality: number;
    timing: number;
    liquidity: number;
    endUser: number;
  };
  scoringFactors: ScoringFactorConfig[];
  regionalWeights: RegionalWeightConfig[];
  timingSignals: TimingSignalConfig[];
  enrichmentSources: EnrichmentSourceConfig[];
  outreachChannels: OutreachChannelConfig[];
  journeyStages: JourneyStageConfig[];
  companyProfiles?: CompanyProfileConfig[];
  defaultKPIs?: DefaultKPI[];
}

interface SignalConfig {
  type: string;
  name: string;
  description: string;
  relevance: number;
}

interface ScoringFactorConfig {
  id: string;
  name: string;
  weight: number;
  description: string;
}

interface RegionalWeightConfig {
  region: string;
  qualityBoost: number;
  timingBoost: number;
  marketMaturity: number;
}

interface TimingSignalConfig {
  id: string;
  name: string;
  description: string;
  deadline?: string;
  months?: number[];
  urgencyMultiplier: number;
}

interface EnrichmentSourceConfig {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  priority: number;
  fields: string[];
}

interface OutreachChannelConfig {
  id: string;
  channel: string;
  enabled: boolean;
  priority: number;
}

interface JourneyStageConfig {
  id: string;
  name: string;
  order: number;
  actions: string[];
  exitCriteria: string[];
}

interface CompanyProfileConfig {
  name: string;
  description: string;
}

interface DefaultKPI {
  product: string;
  target: number;
  unit: string;
  period: string;
}

// =============================================================================
// Constants
// =============================================================================

const RADAR_TARGETS = [
  { value: 'companies', label: 'Companies', icon: '🏢' },
  { value: 'individuals', label: 'Individuals', icon: '👤' },
  { value: 'families', label: 'Families', icon: '👨‍👩‍👧' },
  { value: 'candidates', label: 'Candidates', icon: '💼' },
] as const;

const VERTICALS = [
  'banking',
  'insurance',
  'real-estate',
  'recruitment',
  'saas-sales',
] as const;

const SUB_VERTICALS: Record<string, string[]> = {
  banking: ['employee-banking', 'corporate-banking', 'sme-banking', 'retail-banking', 'wealth-management'],
  insurance: ['life-insurance', 'group-insurance', 'health-insurance', 'commercial-insurance'],
  'real-estate': ['residential-sales', 'commercial-leasing', 'property-management'],
  recruitment: ['executive-search', 'tech-recruitment', 'mass-recruitment'],
  'saas-sales': ['enterprise-sales', 'mid-market-sales', 'smb-sales'],
};

const ALL_SIGNAL_TYPES = [
  // Banking signals
  'hiring-expansion',
  'office-opening',
  'market-entry',
  'project-award',
  'headcount-jump',
  'subsidiary-creation',
  'leadership-hiring',
  'funding-round',
  'merger-acquisition',
  'expansion-announcement',
  // Insurance signals
  'life-event',
  'salary-change',
  'job-change',
  'family-event',
  // Real Estate signals
  'rental-expiry',
  'relocation',
  'family-growth',
  // Recruitment signals
  'job-posting',
  'layoff-announcement',
  'skill-trending',
];

// =============================================================================
// Page Component
// =============================================================================

export default function VerticalsConfigPage() {
  const [configs, setConfigs] = useState<VerticalConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<VerticalConfig | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  // Fetch configs
  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/vertical-config?all=true');
      const data = await response.json();

      if (data.success) {
        setConfigs(data.data);
      } else {
        setError(data.error || 'Failed to fetch configs');
      }
    } catch (err) {
      setError('Failed to fetch configs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  // Create new config
  const handleCreate = async (config: Partial<VerticalConfig>) => {
    try {
      const response = await fetch('/api/admin/vertical-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await response.json();

      if (data.success) {
        await fetchConfigs();
        setIsCreating(false);
      } else {
        alert(data.error || 'Failed to create config');
      }
    } catch (err) {
      alert('Failed to create config');
    }
  };

  // Update config
  const handleUpdate = async (id: string, config: Partial<VerticalConfig>) => {
    try {
      const response = await fetch(`/api/admin/vertical-config?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await response.json();

      if (data.success) {
        await fetchConfigs();
        setEditingConfig(null);
      } else {
        alert(data.error || 'Failed to update config');
      }
    } catch (err) {
      alert('Failed to update config');
    }
  };

  // Delete config
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this config?')) return;

    try {
      const response = await fetch(`/api/admin/vertical-config?id=${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        await fetchConfigs();
      } else {
        alert(data.error || 'Failed to delete config');
      }
    } catch (err) {
      alert('Failed to delete config');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/admin"
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Vertical Registry</h1>
                <p className="text-sm text-gray-500">
                  Manage vertical/sub-vertical/region configurations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowJsonPreview(!showJsonPreview)}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
              >
                {showJsonPreview ? 'Hide JSON' : 'Show JSON'}
              </button>
              <button
                onClick={() => setIsCreating(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                + Add Vertical
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : configs.length === 0 ? (
          <EmptyState onCreateClick={() => setIsCreating(true)} />
        ) : (
          <div className="grid gap-4">
            {configs.map((config) => (
              <ConfigCard
                key={config.id}
                config={config}
                showJson={showJsonPreview}
                onEdit={() => setEditingConfig(config)}
                onDelete={() => handleDelete(config.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(isCreating || editingConfig) && (
        <ConfigModal
          config={editingConfig}
          onSave={(data) => {
            if (editingConfig) {
              handleUpdate(editingConfig.id, data);
            } else {
              handleCreate(data);
            }
          }}
          onClose={() => {
            setIsCreating(false);
            setEditingConfig(null);
          }}
        />
      )}
    </div>
  );
}

// =============================================================================
// Config Card Component
// =============================================================================

function ConfigCard({
  config,
  showJson,
  onEdit,
  onDelete,
}: {
  config: VerticalConfig;
  showJson: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const radarTarget = RADAR_TARGETS.find((r) => r.value === config.radarTarget);
  const signalCount = config.config.allowedSignalTypes.length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{radarTarget?.icon || '📦'}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900">{config.name}</h3>
                {config.isSeeded && (
                  <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                    Seeded
                  </span>
                )}
                {!config.isActive && (
                  <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {config.vertical} / {config.subVertical} / {config.regionCountry}
              </p>
              {config.description && (
                <p className="text-sm text-gray-400 mt-1">{config.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              Edit
            </button>
            {!config.isSeeded && (
              <button
                onClick={onDelete}
                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-1 text-gray-500">
            <span>📡</span>
            <span>{signalCount} signals</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <span>🎯</span>
            <span>Targets {radarTarget?.label}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <span>📊</span>
            <span>
              Q:{config.config.scoringWeights.quality * 100}% T:{config.config.scoringWeights.timing * 100}% L:{config.config.scoringWeights.liquidity * 100}% E:{config.config.scoringWeights.endUser * 100}%
            </span>
          </div>
        </div>

        {/* Signal Types */}
        <div className="mt-3 flex flex-wrap gap-1">
          {config.config.allowedSignalTypes.slice(0, 6).map((signal) => (
            <span
              key={signal}
              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
            >
              {signal}
            </span>
          ))}
          {config.config.allowedSignalTypes.length > 6 && (
            <span className="px-2 py-0.5 text-xs text-gray-400">
              +{config.config.allowedSignalTypes.length - 6} more
            </span>
          )}
        </div>
      </div>

      {/* JSON Preview */}
      {showJson && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <pre className="text-xs text-gray-600 overflow-x-auto max-h-48">
            {JSON.stringify(config.config, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Empty State Component
// =============================================================================

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
      <div className="text-5xl mb-4">🏷️</div>
      <h2 className="text-lg font-medium text-gray-900 mb-2">No Verticals Configured</h2>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        Create your first vertical configuration to enable industry-specific intelligence.
        Start with Banking/Employee Banking/UAE as a template.
      </p>
      <div className="flex justify-center gap-3">
        <button
          onClick={onCreateClick}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          + Create Vertical Config
        </button>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            alert(
              'To seed Banking config, run:\nnpx ts-node scripts/seeds/banking-employee-uae.ts'
            );
          }}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Seed Banking Demo
        </a>
      </div>
    </div>
  );
}

// =============================================================================
// Config Modal Component
// =============================================================================

function ConfigModal({
  config,
  onSave,
  onClose,
}: {
  config: VerticalConfig | null;
  onSave: (data: Partial<VerticalConfig>) => void;
  onClose: () => void;
}) {
  const isEditing = !!config;

  const [formData, setFormData] = useState({
    vertical: config?.vertical || 'banking',
    subVertical: config?.subVertical || 'employee-banking',
    regionCountry: config?.regionCountry || 'UAE',
    name: config?.name || '',
    description: config?.description || '',
    radarTarget: config?.radarTarget || 'companies',
    isActive: config?.isActive ?? true,
    config: config?.config || createDefaultConfig(),
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'signals' | 'scoring' | 'enrichment' | 'json'>('basic');

  function createDefaultConfig(): VerticalConfigData {
    return {
      allowedSignalTypes: [],
      signalConfigs: [],
      scoringWeights: { quality: 0.30, timing: 0.25, liquidity: 0.20, endUser: 0.25 },
      scoringFactors: [],
      regionalWeights: [],
      timingSignals: [],
      enrichmentSources: [],
      outreachChannels: [],
      journeyStages: [],
    };
  }

  const handleSave = () => {
    if (!formData.name) {
      alert('Name is required');
      return;
    }

    onSave(formData);
  };

  const tabs = [
    { id: 'basic' as const, label: 'Basic Info' },
    { id: 'signals' as const, label: 'Signals' },
    { id: 'scoring' as const, label: 'Scoring' },
    { id: 'enrichment' as const, label: 'Enrichment' },
    { id: 'json' as const, label: 'JSON' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Vertical Config' : 'Create Vertical Config'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-200">
          <nav className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'basic' && (
            <BasicInfoTab
              formData={formData}
              setFormData={setFormData}
              isEditing={isEditing}
            />
          )}

          {activeTab === 'signals' && (
            <SignalsTab formData={formData} setFormData={setFormData} />
          )}

          {activeTab === 'scoring' && (
            <ScoringTab formData={formData} setFormData={setFormData} />
          )}

          {activeTab === 'enrichment' && (
            <EnrichmentTab formData={formData} setFormData={setFormData} />
          )}

          {activeTab === 'json' && (
            <JsonTab formData={formData} setFormData={setFormData} />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            {isEditing ? 'Save Changes' : 'Create Config'}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Tab Components
// =============================================================================

interface FormData {
  vertical: string;
  subVertical: string;
  regionCountry: string;
  name: string;
  description: string;
  radarTarget: 'companies' | 'individuals' | 'families' | 'candidates';
  isActive: boolean;
  config: VerticalConfigData;
}

function BasicInfoTab({
  formData,
  setFormData,
  isEditing,
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  isEditing: boolean;
}) {
  const availableSubVerticals = SUB_VERTICALS[formData.vertical] || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vertical *
          </label>
          <select
            value={formData.vertical}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                vertical: e.target.value,
                subVertical: SUB_VERTICALS[e.target.value]?.[0] || '',
              }))
            }
            disabled={isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
          >
            {VERTICALS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sub-Vertical *
          </label>
          <select
            value={formData.subVertical}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, subVertical: e.target.value }))
            }
            disabled={isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
          >
            {availableSubVerticals.map((sv) => (
              <option key={sv} value={sv}>
                {sv}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Region (Country) *
          </label>
          <input
            type="text"
            value={formData.regionCountry}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, regionCountry: e.target.value }))
            }
            disabled={isEditing}
            placeholder="UAE"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Display Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Banking - Employee Banking (UAE)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Payroll accounts, salary accounts, employee benefits"
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Radar Target *
        </label>
        <div className="grid grid-cols-4 gap-3">
          {RADAR_TARGETS.map((target) => (
            <button
              key={target.value}
              type="button"
              onClick={() =>
                setFormData((prev) => ({ ...prev, radarTarget: target.value }))
              }
              className={`p-3 border rounded-lg text-center transition-colors ${
                formData.radarTarget === target.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-2xl block mb-1">{target.icon}</span>
              <span className="text-sm">{target.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
          }
          className="rounded border-gray-300"
        />
        <label htmlFor="isActive" className="text-sm text-gray-700">
          Active (available for use)
        </label>
      </div>
    </div>
  );
}

function SignalsTab({
  formData,
  setFormData,
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}) {
  const toggleSignal = (signal: string) => {
    setFormData((prev) => {
      const current = prev.config.allowedSignalTypes;
      const updated = current.includes(signal)
        ? current.filter((s) => s !== signal)
        : [...current, signal];

      return {
        ...prev,
        config: { ...prev.config, allowedSignalTypes: updated },
      };
    });
  };

  const signalGroups = {
    Banking: ALL_SIGNAL_TYPES.filter((s) =>
      ['hiring-expansion', 'office-opening', 'market-entry', 'project-award', 'headcount-jump', 'subsidiary-creation', 'leadership-hiring', 'funding-round', 'merger-acquisition', 'expansion-announcement'].includes(s)
    ),
    Insurance: ALL_SIGNAL_TYPES.filter((s) =>
      ['life-event', 'salary-change', 'job-change', 'family-event'].includes(s)
    ),
    'Real Estate': ALL_SIGNAL_TYPES.filter((s) =>
      ['rental-expiry', 'relocation', 'family-growth'].includes(s)
    ),
    Recruitment: ALL_SIGNAL_TYPES.filter((s) =>
      ['job-posting', 'layoff-announcement', 'skill-trending'].includes(s)
    ),
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Select which signals are relevant for this vertical. These determine what triggers lead discovery.
      </p>

      {Object.entries(signalGroups).map(([group, signals]) => (
        <div key={group}>
          <h3 className="text-sm font-medium text-gray-700 mb-2">{group} Signals</h3>
          <div className="flex flex-wrap gap-2">
            {signals.map((signal) => {
              const isSelected = formData.config.allowedSignalTypes.includes(signal);
              return (
                <button
                  key={signal}
                  type="button"
                  onClick={() => toggleSignal(signal)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    isSelected
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {isSelected && '✓ '}
                  {signal}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-1">Selected Signals</h3>
        <p className="text-sm text-gray-500">
          {formData.config.allowedSignalTypes.length} signals selected:{' '}
          {formData.config.allowedSignalTypes.join(', ') || 'None'}
        </p>
      </div>
    </div>
  );
}

function ScoringTab({
  formData,
  setFormData,
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}) {
  const updateWeight = (key: keyof VerticalConfigData['scoringWeights'], value: number) => {
    setFormData((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        scoringWeights: {
          ...prev.config.scoringWeights,
          [key]: value,
        },
      },
    }));
  };

  const weights = formData.config.scoringWeights;
  const total = weights.quality + weights.timing + weights.liquidity + weights.endUser;

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Configure Q/T/L/E scoring weights. Total should equal 1.0 (100%).
      </p>

      <div className="space-y-4">
        {(['quality', 'timing', 'liquidity', 'endUser'] as const).map((key) => (
          <div key={key} className="flex items-center gap-4">
            <label className="w-24 text-sm font-medium text-gray-700 capitalize">
              {key === 'endUser' ? 'End User' : key}
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={weights[key] * 100}
              onChange={(e) => updateWeight(key, Number(e.target.value) / 100)}
              className="flex-1"
            />
            <span className="w-16 text-sm text-gray-600 text-right">
              {(weights[key] * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>

      <div className={`p-3 rounded-lg ${Math.abs(total - 1) < 0.01 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
        <span className="text-sm font-medium">
          Total: {(total * 100).toFixed(0)}%
        </span>
        {Math.abs(total - 1) >= 0.01 && (
          <span className="text-sm ml-2">(should equal 100%)</span>
        )}
      </div>
    </div>
  );
}

function EnrichmentTab({
  formData,
  setFormData,
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}) {
  const defaultSources = [
    { id: 'apollo', name: 'Apollo', type: 'apollo' },
    { id: 'linkedin', name: 'LinkedIn', type: 'linkedin' },
    { id: 'crunchbase', name: 'Crunchbase', type: 'crunchbase' },
  ];

  const toggleSource = (sourceId: string) => {
    setFormData((prev) => {
      const current = prev.config.enrichmentSources;
      const exists = current.find((s) => s.id === sourceId);

      if (exists) {
        return {
          ...prev,
          config: {
            ...prev.config,
            enrichmentSources: current.filter((s) => s.id !== sourceId),
          },
        };
      } else {
        const source = defaultSources.find((s) => s.id === sourceId)!;
        return {
          ...prev,
          config: {
            ...prev.config,
            enrichmentSources: [
              ...current,
              {
                id: source.id,
                name: source.name,
                type: source.type,
                enabled: true,
                priority: current.length + 1,
                fields: [],
              },
            ],
          },
        };
      }
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Select enrichment sources for company/contact data.
      </p>

      <div className="space-y-3">
        {defaultSources.map((source) => {
          const isEnabled = formData.config.enrichmentSources.some(
            (s) => s.id === source.id
          );
          return (
            <div
              key={source.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                isEnabled
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => toggleSource(source.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => {}}
                    className="rounded border-gray-300"
                  />
                  <span className="font-medium text-gray-900">{source.name}</span>
                </div>
                <span className="text-sm text-gray-500">{source.type}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function JsonTab({
  formData,
  setFormData,
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}) {
  const [jsonText, setJsonText] = useState(JSON.stringify(formData.config, null, 2));
  const [error, setError] = useState<string | null>(null);

  const handleJsonChange = (text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      setFormData((prev) => ({ ...prev, config: parsed }));
      setError(null);
    } catch (e) {
      setError('Invalid JSON');
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Edit the raw JSON configuration directly. Be careful with changes.
      </p>

      <textarea
        value={jsonText}
        onChange={(e) => handleJsonChange(e.target.value)}
        rows={20}
        className={`w-full px-3 py-2 font-mono text-sm border rounded-lg ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
