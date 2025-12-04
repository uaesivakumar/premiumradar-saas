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
// Persona Types (v3.0 - Sprint 71)
// =============================================================================

interface PersonaConfig {
  persona_name: string;
  persona_role?: string;
  persona_organization?: string;
  entity_type: 'company' | 'individual' | 'family';
  primary_mission?: string;
  core_goal?: string;
  north_star_metric?: string;
  core_belief?: string;
  contact_priority_rules: {
    tiers: Array<{
      size_min?: number;
      size_max?: number | null;
      titles: string[];
      priority: number;
      reason?: string;
    }>;
    boost_conditions?: Array<{
      condition: string;
      add_titles: string[];
    }>;
  };
  edge_cases: {
    blockers: Array<{
      type: 'company_name' | 'sector' | 'status';
      values: string[];
      multiplier: number;
      reason?: string;
    }>;
    boosters: Array<{
      type: 'license_type' | 'signal_recency' | 'industry';
      values?: string[];
      condition?: string;
      multiplier: number;
      reason?: string;
    }>;
  };
  timing_rules: {
    calendar: Array<{
      period: string;
      months?: number[];
      dynamic?: boolean;
      multiplier: number;
      reason?: string;
    }>;
    signal_freshness: Array<{
      days_max: number;
      multiplier: number;
      label: string;
    }>;
  };
  outreach_doctrine: {
    always: string[];
    never: string[];
    tone: 'professional' | 'casual' | 'formal';
    formality: 'formal' | 'semi-formal' | 'informal';
    channels: string[];
  };
  quality_standards: {
    min_confidence: number;
    contact_cooldown_days: number;
    always?: string[];
    never?: string[];
  };
  anti_patterns?: Array<{
    mistake: string;
    wrong: string;
    correct: string;
  }>;
  confidence_gates?: Array<{
    condition: string;
    action: string;
  }>;
  success_patterns?: Array<{
    pattern: string;
    indicator: string;
    action: string;
  }>;
  failure_patterns?: Array<{
    pattern: string;
    indicator: string;
    recovery: string;
  }>;
}

const DEFAULT_PERSONA: PersonaConfig = {
  persona_name: '',
  entity_type: 'company',
  contact_priority_rules: {
    tiers: [
      { size_min: 0, size_max: 50, titles: ['Founder', 'COO'], priority: 1 },
      { size_min: 50, size_max: 500, titles: ['HR Director', 'HR Manager'], priority: 1 },
      { size_min: 500, size_max: null, titles: ['Payroll Manager', 'Benefits Coordinator'], priority: 1 },
    ],
  },
  edge_cases: {
    blockers: [],
    boosters: [],
  },
  timing_rules: {
    calendar: [
      { period: 'Q1', months: [1, 2], multiplier: 1.3, reason: 'New budgets' },
      { period: 'Ramadan', dynamic: true, multiplier: 0.3, reason: 'Business slowdown' },
      { period: 'Summer', months: [7, 8], multiplier: 0.7, reason: 'Vacation season' },
      { period: 'Q4', months: [12], multiplier: 0.6, reason: 'Budget freeze' },
    ],
    signal_freshness: [
      { days_max: 7, multiplier: 1.5, label: 'HOT' },
      { days_max: 14, multiplier: 1.2, label: 'WARM' },
      { days_max: 30, multiplier: 1.0, label: 'RECENT' },
    ],
  },
  outreach_doctrine: {
    always: [],
    never: [],
    tone: 'professional',
    formality: 'formal',
    channels: ['email', 'linkedin'],
  },
  quality_standards: {
    min_confidence: 70,
    contact_cooldown_days: 90,
  },
};

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
    persona: (config as VerticalConfig & { persona?: PersonaConfig })?.persona || { ...DEFAULT_PERSONA },
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'signals' | 'scoring' | 'enrichment' | 'persona' | 'json'>('basic');

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
    // Basic validation
    if (!formData.name) {
      alert('Name is required');
      return;
    }

    // Mandatory persona validation
    if (!formData.persona.persona_name || formData.persona.persona_name.trim() === '') {
      alert('⚠️ Persona Required\n\nNo persona found for this sub-vertical. Please create a persona first.\n\nSIVA cannot function without knowing HOW to think for this role.');
      return;
    }

    // Validate persona has minimum required config
    if (!formData.persona.entity_type) {
      alert('⚠️ Persona Incomplete\n\nEntity type is required. Please select company, individual, or family.');
      return;
    }

    if (!formData.persona.contact_priority_rules?.tiers?.length) {
      alert('⚠️ Persona Incomplete\n\nAt least one contact priority tier is required.');
      return;
    }

    onSave(formData);
  };

  const tabs = [
    { id: 'basic' as const, label: 'Basic Info' },
    { id: 'signals' as const, label: 'Signals' },
    { id: 'scoring' as const, label: 'Scoring' },
    { id: 'enrichment' as const, label: 'Enrichment' },
    { id: 'persona' as const, label: '🧠 Persona' },
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

          {activeTab === 'persona' && (
            <PersonaTab formData={formData} setFormData={setFormData} />
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
  persona: PersonaConfig; // v3.0: Persona config
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

// =============================================================================
// Persona Tab Component (v3.0 - Sprint 71)
// =============================================================================

function PersonaTab({
  formData,
  setFormData,
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}) {
  const [activeSection, setActiveSection] = useState<'identity' | 'contact' | 'edge' | 'timing' | 'outreach' | 'quality' | 'antipatterns' | 'confidence' | 'patterns'>('identity');

  const updatePersona = (updates: Partial<PersonaConfig>) => {
    setFormData((prev) => ({
      ...prev,
      persona: { ...prev.persona, ...updates },
    }));
  };

  const sections = [
    { id: 'identity' as const, label: 'Identity & Mission', icon: '👤' },
    { id: 'contact' as const, label: 'Contact Priority', icon: '📞' },
    { id: 'edge' as const, label: 'Edge Cases', icon: '⚠️' },
    { id: 'timing' as const, label: 'Timing Rules', icon: '📅' },
    { id: 'outreach' as const, label: 'Outreach Doctrine', icon: '📧' },
    { id: 'quality' as const, label: 'Quality Standards', icon: '✓' },
    { id: 'antipatterns' as const, label: 'Anti-Patterns', icon: '🚫' },
    { id: 'confidence' as const, label: 'Confidence Gates', icon: '🔒' },
    { id: 'patterns' as const, label: 'Success/Failure', icon: '📊' },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Configure the SIVA persona for this sub-vertical. This defines HOW SIVA thinks as this sales role.
      </p>

      {/* Section Navigation */}
      <div className="flex gap-2 flex-wrap">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveSection(section.id)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              activeSection === section.id
                ? 'bg-purple-100 border-purple-300 text-purple-700'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {section.icon} {section.label}
          </button>
        ))}
      </div>

      {/* Identity & Mission Section */}
      {activeSection === 'identity' && (
        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900">Identity & Mission</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Persona Name *</label>
              <input
                type="text"
                value={formData.persona.persona_name}
                onChange={(e) => updatePersona({ persona_name: e.target.value })}
                placeholder="EB Sales Officer"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type *</label>
              <select
                value={formData.persona.entity_type}
                onChange={(e) => updatePersona({ entity_type: e.target.value as PersonaConfig['entity_type'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="company">Company</option>
                <option value="individual">Individual</option>
                <option value="family">Family</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <input
                type="text"
                value={formData.persona.persona_role || ''}
                onChange={(e) => updatePersona({ persona_role: e.target.value })}
                placeholder="Senior Retail Banking Officer"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
              <input
                type="text"
                value={formData.persona.persona_organization || ''}
                onChange={(e) => updatePersona({ persona_organization: e.target.value })}
                placeholder="Emirates NBD"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Mission</label>
            <textarea
              value={formData.persona.primary_mission || ''}
              onChange={(e) => updatePersona({ primary_mission: e.target.value })}
              placeholder="Become the designated point of contact for companies to manage employee banking"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Core Goal</label>
            <textarea
              value={formData.persona.core_goal || ''}
              onChange={(e) => updatePersona({ core_goal: e.target.value })}
              placeholder="Build long-term payroll relationships that enable cross-sell"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">North Star Metric</label>
            <input
              type="text"
              value={formData.persona.north_star_metric || ''}
              onChange={(e) => updatePersona({ north_star_metric: e.target.value })}
              placeholder="≥200 qualified companies per month with ≥70% mid/high-tier salary segments"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Contact Priority Section */}
      {activeSection === 'contact' && (
        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900">Contact Priority Rules</h3>
          <p className="text-sm text-gray-500">Define target titles by company size tier.</p>

          {formData.persona.contact_priority_rules.tiers.map((tier, index) => (
            <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Size Min</label>
                  <input
                    type="number"
                    value={tier.size_min || 0}
                    onChange={(e) => {
                      const tiers = [...formData.persona.contact_priority_rules.tiers];
                      tiers[index] = { ...tier, size_min: Number(e.target.value) };
                      updatePersona({ contact_priority_rules: { ...formData.persona.contact_priority_rules, tiers } });
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Size Max</label>
                  <input
                    type="number"
                    value={tier.size_max || ''}
                    placeholder="∞"
                    onChange={(e) => {
                      const tiers = [...formData.persona.contact_priority_rules.tiers];
                      tiers[index] = { ...tier, size_max: e.target.value ? Number(e.target.value) : null };
                      updatePersona({ contact_priority_rules: { ...formData.persona.contact_priority_rules, tiers } });
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Target Titles (comma-separated)</label>
                  <input
                    type="text"
                    value={tier.titles.join(', ')}
                    onChange={(e) => {
                      const tiers = [...formData.persona.contact_priority_rules.tiers];
                      tiers[index] = { ...tier, titles: e.target.value.split(',').map(t => t.trim()).filter(Boolean) };
                      updatePersona({ contact_priority_rules: { ...formData.persona.contact_priority_rules, tiers } });
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => {
              const tiers = [...formData.persona.contact_priority_rules.tiers, { size_min: 0, size_max: null, titles: [], priority: 1 }];
              updatePersona({ contact_priority_rules: { ...formData.persona.contact_priority_rules, tiers } });
            }}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            + Add Tier
          </button>
        </div>
      )}

      {/* Edge Cases Section */}
      {activeSection === 'edge' && (
        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900">Edge Cases</h3>

          {/* Blockers */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">⛔ Blockers</h4>
            {formData.persona.edge_cases.blockers.map((blocker, index) => (
              <div key={index} className="bg-white p-3 rounded-lg border border-red-200 mb-2">
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Type</label>
                    <select
                      value={blocker.type}
                      onChange={(e) => {
                        const blockers = [...formData.persona.edge_cases.blockers];
                        blockers[index] = { ...blocker, type: e.target.value as 'company_name' | 'sector' | 'status' };
                        updatePersona({ edge_cases: { ...formData.persona.edge_cases, blockers } });
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    >
                      <option value="company_name">Company Name</option>
                      <option value="sector">Sector</option>
                      <option value="status">Status</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Values (comma-separated)</label>
                    <input
                      type="text"
                      value={blocker.values.join(', ')}
                      onChange={(e) => {
                        const blockers = [...formData.persona.edge_cases.blockers];
                        blockers[index] = { ...blocker, values: e.target.value.split(',').map(v => v.trim()).filter(Boolean) };
                        updatePersona({ edge_cases: { ...formData.persona.edge_cases, blockers } });
                      }}
                      placeholder="Etihad, Emirates, ADNOC"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Multiplier</label>
                    <input
                      type="number"
                      step="0.1"
                      value={blocker.multiplier}
                      onChange={(e) => {
                        const blockers = [...formData.persona.edge_cases.blockers];
                        blockers[index] = { ...blocker, multiplier: Number(e.target.value) };
                        updatePersona({ edge_cases: { ...formData.persona.edge_cases, blockers } });
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const blockers = [...formData.persona.edge_cases.blockers, { type: 'company_name' as const, values: [], multiplier: 0.1 }];
                updatePersona({ edge_cases: { ...formData.persona.edge_cases, blockers } });
              }}
              className="text-sm text-red-600 hover:text-red-700"
            >
              + Add Blocker
            </button>
          </div>

          {/* Boosters */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">🚀 Boosters</h4>
            {formData.persona.edge_cases.boosters.map((booster, index) => (
              <div key={index} className="bg-white p-3 rounded-lg border border-green-200 mb-2">
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Type</label>
                    <select
                      value={booster.type}
                      onChange={(e) => {
                        const boosters = [...formData.persona.edge_cases.boosters];
                        boosters[index] = { ...booster, type: e.target.value as 'license_type' | 'signal_recency' | 'industry' };
                        updatePersona({ edge_cases: { ...formData.persona.edge_cases, boosters } });
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    >
                      <option value="license_type">License Type</option>
                      <option value="signal_recency">Signal Recency</option>
                      <option value="industry">Industry</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Values (comma-separated)</label>
                    <input
                      type="text"
                      value={booster.values?.join(', ') || ''}
                      onChange={(e) => {
                        const boosters = [...formData.persona.edge_cases.boosters];
                        boosters[index] = { ...booster, values: e.target.value.split(',').map(v => v.trim()).filter(Boolean) };
                        updatePersona({ edge_cases: { ...formData.persona.edge_cases, boosters } });
                      }}
                      placeholder="Free Zone"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Multiplier</label>
                    <input
                      type="number"
                      step="0.1"
                      value={booster.multiplier}
                      onChange={(e) => {
                        const boosters = [...formData.persona.edge_cases.boosters];
                        boosters[index] = { ...booster, multiplier: Number(e.target.value) };
                        updatePersona({ edge_cases: { ...formData.persona.edge_cases, boosters } });
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const boosters = [...formData.persona.edge_cases.boosters, { type: 'license_type' as const, values: [], multiplier: 1.3 }];
                updatePersona({ edge_cases: { ...formData.persona.edge_cases, boosters } });
              }}
              className="text-sm text-green-600 hover:text-green-700"
            >
              + Add Booster
            </button>
          </div>
        </div>
      )}

      {/* Timing Rules Section */}
      {activeSection === 'timing' && (
        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900">Timing Rules</h3>

          {/* Calendar Rules */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">📅 Calendar Periods</h4>
            {formData.persona.timing_rules.calendar.map((rule, index) => (
              <div key={index} className="bg-white p-3 rounded-lg border border-gray-200 mb-2">
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Period</label>
                    <input
                      type="text"
                      value={rule.period}
                      onChange={(e) => {
                        const calendar = [...formData.persona.timing_rules.calendar];
                        calendar[index] = { ...rule, period: e.target.value };
                        updatePersona({ timing_rules: { ...formData.persona.timing_rules, calendar } });
                      }}
                      placeholder="Q1"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Months (1-12)</label>
                    <input
                      type="text"
                      value={rule.months?.join(', ') || ''}
                      onChange={(e) => {
                        const calendar = [...formData.persona.timing_rules.calendar];
                        calendar[index] = { ...rule, months: e.target.value.split(',').map(m => Number(m.trim())).filter(Boolean) };
                        updatePersona({ timing_rules: { ...formData.persona.timing_rules, calendar } });
                      }}
                      placeholder="1, 2"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Multiplier</label>
                    <input
                      type="number"
                      step="0.1"
                      value={rule.multiplier}
                      onChange={(e) => {
                        const calendar = [...formData.persona.timing_rules.calendar];
                        calendar[index] = { ...rule, multiplier: Number(e.target.value) };
                        updatePersona({ timing_rules: { ...formData.persona.timing_rules, calendar } });
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Reason</label>
                    <input
                      type="text"
                      value={rule.reason || ''}
                      onChange={(e) => {
                        const calendar = [...formData.persona.timing_rules.calendar];
                        calendar[index] = { ...rule, reason: e.target.value };
                        updatePersona({ timing_rules: { ...formData.persona.timing_rules, calendar } });
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Signal Freshness */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">⏱️ Signal Freshness</h4>
            {formData.persona.timing_rules.signal_freshness.map((rule, index) => (
              <div key={index} className="bg-white p-3 rounded-lg border border-gray-200 mb-2">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Days Max</label>
                    <input
                      type="number"
                      value={rule.days_max}
                      onChange={(e) => {
                        const signal_freshness = [...formData.persona.timing_rules.signal_freshness];
                        signal_freshness[index] = { ...rule, days_max: Number(e.target.value) };
                        updatePersona({ timing_rules: { ...formData.persona.timing_rules, signal_freshness } });
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Multiplier</label>
                    <input
                      type="number"
                      step="0.1"
                      value={rule.multiplier}
                      onChange={(e) => {
                        const signal_freshness = [...formData.persona.timing_rules.signal_freshness];
                        signal_freshness[index] = { ...rule, multiplier: Number(e.target.value) };
                        updatePersona({ timing_rules: { ...formData.persona.timing_rules, signal_freshness } });
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Label</label>
                    <input
                      type="text"
                      value={rule.label}
                      onChange={(e) => {
                        const signal_freshness = [...formData.persona.timing_rules.signal_freshness];
                        signal_freshness[index] = { ...rule, label: e.target.value };
                        updatePersona({ timing_rules: { ...formData.persona.timing_rules, signal_freshness } });
                      }}
                      placeholder="HOT"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outreach Doctrine Section */}
      {activeSection === 'outreach' && (
        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900">Outreach Doctrine</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
              <select
                value={formData.persona.outreach_doctrine.tone}
                onChange={(e) => updatePersona({ outreach_doctrine: { ...formData.persona.outreach_doctrine, tone: e.target.value as 'professional' | 'casual' | 'formal' } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Formality</label>
              <select
                value={formData.persona.outreach_doctrine.formality}
                onChange={(e) => updatePersona({ outreach_doctrine: { ...formData.persona.outreach_doctrine, formality: e.target.value as 'formal' | 'semi-formal' | 'informal' } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="formal">Formal</option>
                <option value="semi-formal">Semi-formal</option>
                <option value="informal">Informal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Channels (comma-separated)</label>
            <input
              type="text"
              value={formData.persona.outreach_doctrine.channels.join(', ')}
              onChange={(e) => updatePersona({ outreach_doctrine: { ...formData.persona.outreach_doctrine, channels: e.target.value.split(',').map(c => c.trim()).filter(Boolean) } })}
              placeholder="email, linkedin"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">✓ Always Do (one per line)</label>
            <textarea
              value={formData.persona.outreach_doctrine.always.join('\n')}
              onChange={(e) => updatePersona({ outreach_doctrine: { ...formData.persona.outreach_doctrine, always: e.target.value.split('\n').filter(Boolean) } })}
              placeholder="Reference specific company signal&#10;Position as Point of Contact"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">✗ Never Do (one per line)</label>
            <textarea
              value={formData.persona.outreach_doctrine.never.join('\n')}
              onChange={(e) => updatePersona({ outreach_doctrine: { ...formData.persona.outreach_doctrine, never: e.target.value.split('\n').filter(Boolean) } })}
              placeholder="Mention pricing&#10;Use pressure language"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Quality Standards Section */}
      {activeSection === 'quality' && (
        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900">Quality Standards</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Confidence (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.persona.quality_standards.min_confidence}
                onChange={(e) => updatePersona({ quality_standards: { ...formData.persona.quality_standards, min_confidence: Number(e.target.value) } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Cooldown (days)</label>
              <input
                type="number"
                value={formData.persona.quality_standards.contact_cooldown_days}
                onChange={(e) => updatePersona({ quality_standards: { ...formData.persona.quality_standards, contact_cooldown_days: Number(e.target.value) } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Anti-Patterns Section */}
      {activeSection === 'antipatterns' && (
        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900">Anti-Patterns</h3>
          <p className="text-sm text-gray-500">Define common mistakes and their corrections to guide SIVA's behavior.</p>

          {(formData.persona.anti_patterns || []).map((pattern, index) => (
            <div key={index} className="bg-white p-3 rounded-lg border border-orange-200 mb-2">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-orange-600 font-medium">Anti-Pattern #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => {
                    const anti_patterns = [...(formData.persona.anti_patterns || [])];
                    anti_patterns.splice(index, 1);
                    updatePersona({ anti_patterns });
                  }}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  Remove
                </button>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Mistake (what goes wrong)</label>
                  <input
                    type="text"
                    value={pattern.mistake}
                    onChange={(e) => {
                      const anti_patterns = [...(formData.persona.anti_patterns || [])];
                      anti_patterns[index] = { ...pattern, mistake: e.target.value };
                      updatePersona({ anti_patterns });
                    }}
                    placeholder="Contacting companies during budget freeze"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Wrong approach</label>
                  <input
                    type="text"
                    value={pattern.wrong}
                    onChange={(e) => {
                      const anti_patterns = [...(formData.persona.anti_patterns || [])];
                      anti_patterns[index] = { ...pattern, wrong: e.target.value };
                      updatePersona({ anti_patterns });
                    }}
                    placeholder="Mass outreach in December"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Correct approach</label>
                  <input
                    type="text"
                    value={pattern.correct}
                    onChange={(e) => {
                      const anti_patterns = [...(formData.persona.anti_patterns || [])];
                      anti_patterns[index] = { ...pattern, correct: e.target.value };
                      updatePersona({ anti_patterns });
                    }}
                    placeholder="Queue for Q1 follow-up when budgets reset"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => {
              const anti_patterns = [...(formData.persona.anti_patterns || []), { mistake: '', wrong: '', correct: '' }];
              updatePersona({ anti_patterns });
            }}
            className="text-sm text-orange-600 hover:text-orange-700"
          >
            + Add Anti-Pattern
          </button>
        </div>
      )}

      {/* Confidence Gates Section */}
      {activeSection === 'confidence' && (
        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900">Confidence Gates</h3>
          <p className="text-sm text-gray-500">Define conditions that must be met before SIVA takes action.</p>

          {(formData.persona.confidence_gates || []).map((gate, index) => (
            <div key={index} className="bg-white p-3 rounded-lg border border-blue-200 mb-2">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-blue-600 font-medium">Gate #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => {
                    const confidence_gates = [...(formData.persona.confidence_gates || [])];
                    confidence_gates.splice(index, 1);
                    updatePersona({ confidence_gates });
                  }}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Condition</label>
                  <input
                    type="text"
                    value={gate.condition}
                    onChange={(e) => {
                      const confidence_gates = [...(formData.persona.confidence_gates || [])];
                      confidence_gates[index] = { ...gate, condition: e.target.value };
                      updatePersona({ confidence_gates });
                    }}
                    placeholder="confidence < 50%"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Action</label>
                  <input
                    type="text"
                    value={gate.action}
                    onChange={(e) => {
                      const confidence_gates = [...(formData.persona.confidence_gates || [])];
                      confidence_gates[index] = { ...gate, action: e.target.value };
                      updatePersona({ confidence_gates });
                    }}
                    placeholder="Request human review"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => {
              const confidence_gates = [...(formData.persona.confidence_gates || []), { condition: '', action: '' }];
              updatePersona({ confidence_gates });
            }}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            + Add Confidence Gate
          </button>
        </div>
      )}

      {/* Success/Failure Patterns Section */}
      {activeSection === 'patterns' && (
        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900">Success & Failure Patterns</h3>
          <p className="text-sm text-gray-500">Define patterns that indicate success or failure for learning.</p>

          {/* Success Patterns */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-green-700">✅ Success Patterns</h4>
            {(formData.persona.success_patterns || []).map((pattern, index) => (
              <div key={index} className="bg-white p-3 rounded-lg border border-green-200 mb-2">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-green-600 font-medium">Success #{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const success_patterns = [...(formData.persona.success_patterns || [])];
                      success_patterns.splice(index, 1);
                      updatePersona({ success_patterns });
                    }}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Pattern</label>
                    <input
                      type="text"
                      value={pattern.pattern}
                      onChange={(e) => {
                        const success_patterns = [...(formData.persona.success_patterns || [])];
                        success_patterns[index] = { ...pattern, pattern: e.target.value };
                        updatePersona({ success_patterns });
                      }}
                      placeholder="Quick response"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Indicator</label>
                    <input
                      type="text"
                      value={pattern.indicator}
                      onChange={(e) => {
                        const success_patterns = [...(formData.persona.success_patterns || [])];
                        success_patterns[index] = { ...pattern, indicator: e.target.value };
                        updatePersona({ success_patterns });
                      }}
                      placeholder="Reply within 24h"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Action</label>
                    <input
                      type="text"
                      value={pattern.action}
                      onChange={(e) => {
                        const success_patterns = [...(formData.persona.success_patterns || [])];
                        success_patterns[index] = { ...pattern, action: e.target.value };
                        updatePersona({ success_patterns });
                      }}
                      placeholder="Prioritize follow-up"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const success_patterns = [...(formData.persona.success_patterns || []), { pattern: '', indicator: '', action: '' }];
                updatePersona({ success_patterns });
              }}
              className="text-sm text-green-600 hover:text-green-700"
            >
              + Add Success Pattern
            </button>
          </div>

          {/* Failure Patterns */}
          <div className="space-y-2 mt-4">
            <h4 className="text-sm font-medium text-red-700">❌ Failure Patterns</h4>
            {(formData.persona.failure_patterns || []).map((pattern, index) => (
              <div key={index} className="bg-white p-3 rounded-lg border border-red-200 mb-2">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-red-600 font-medium">Failure #{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const failure_patterns = [...(formData.persona.failure_patterns || [])];
                      failure_patterns.splice(index, 1);
                      updatePersona({ failure_patterns });
                    }}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Pattern</label>
                    <input
                      type="text"
                      value={pattern.pattern}
                      onChange={(e) => {
                        const failure_patterns = [...(formData.persona.failure_patterns || [])];
                        failure_patterns[index] = { ...pattern, pattern: e.target.value };
                        updatePersona({ failure_patterns });
                      }}
                      placeholder="No response"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Indicator</label>
                    <input
                      type="text"
                      value={pattern.indicator}
                      onChange={(e) => {
                        const failure_patterns = [...(formData.persona.failure_patterns || [])];
                        failure_patterns[index] = { ...pattern, indicator: e.target.value };
                        updatePersona({ failure_patterns });
                      }}
                      placeholder="3+ attempts ignored"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Recovery</label>
                    <input
                      type="text"
                      value={pattern.recovery}
                      onChange={(e) => {
                        const failure_patterns = [...(formData.persona.failure_patterns || [])];
                        failure_patterns[index] = { ...pattern, recovery: e.target.value };
                        updatePersona({ failure_patterns });
                      }}
                      placeholder="Move to nurture queue"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const failure_patterns = [...(formData.persona.failure_patterns || []), { pattern: '', indicator: '', recovery: '' }];
                updatePersona({ failure_patterns });
              }}
              className="text-sm text-red-600 hover:text-red-700"
            >
              + Add Failure Pattern
            </button>
          </div>
        </div>
      )}

      {/* Preview */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-purple-900 mb-2">Persona Preview</h4>
        <pre className="text-xs text-purple-800 overflow-x-auto max-h-32">
          {JSON.stringify(formData.persona, null, 2)}
        </pre>
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
