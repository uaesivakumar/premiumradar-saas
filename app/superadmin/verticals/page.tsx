'use client';

/**
 * Super Admin - Verticals & Personas
 *
 * Configure verticals, sub-verticals, and their personas.
 * This is the most critical configuration for SIVA behavior.
 */

import { useState, useEffect } from 'react';
import {
  Globe,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  Users,
  Target,
  Clock,
  MessageSquare,
  BarChart3,
  Shield,
  Lightbulb,
  AlertTriangle,
} from 'lucide-react';

interface Persona {
  slug?: string;
  persona_name: string;
  persona_role?: string;
  persona_organization?: string;
  mission_statement?: string;
  entity_type: 'company' | 'individual' | 'deal';
  contact_priority_rules?: {
    tiers: Array<{
      size_min?: number;
      size_max?: number | null;
      age_min?: number;
      age_max?: number | null;
      titles: string[];
      priority: number;
    }>;
  };
  edge_cases?: {
    blockers: Array<{
      type: string;
      values: string[];
      multiplier: number;
      reason?: string;
    }>;
    boosters: Array<{
      type: string;
      values: string[];
      multiplier: number;
      reason?: string;
    }>;
  };
  timing_rules?: {
    calendar: Array<{
      period: string;
      months: number[];
      multiplier: number;
    }>;
    signal_freshness: Array<{
      days_max: number;
      multiplier: number;
      label: string;
    }>;
  };
  outreach_doctrine?: {
    always: string[];
    never: string[];
    tone: string;
    formality: string;
    channels: string[];
  };
  scoring_config?: {
    weights: {
      q_score: number;
      t_score: number;
      l_score: number;
      e_score: number;
    };
    thresholds: {
      hot: number;
      warm: number;
      cold: number;
    };
  };
  quality_standards?: {
    minimum_data_fields: string[];
    preferred_data_sources: string[];
    data_freshness_days: number;
  };
  anti_patterns?: Array<{
    pattern: string;
    reason: string;
    severity: string;
  }>;
  confidence_gates?: {
    minimum_confidence: number;
    require_verification_below: number;
    auto_approve_above: number;
  };
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

interface SubVertical {
  id: string;
  slug: string;
  name: string;
  description: string;
  persona: Persona;
  isActive: boolean;
  config?: {
    default_agent?: string;
    [key: string]: unknown;
  };
}

interface Vertical {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  subVerticals: SubVertical[];
  isActive: boolean;
}

// Default empty state - data loaded from API
const emptyVerticals: Vertical[] = [];

// Helper to get icon for vertical
function getVerticalIcon(slug: string): string {
  const icons: Record<string, string> = {
    'banking': '🏦',
    'insurance': '🛡️',
    'real-estate': '🏠',
    'recruitment': '👥',
    'saas-sales': '💼',
  };
  return icons[slug] || '📊';
}

export default function VerticalsPage() {
  const [verticals, setVerticals] = useState<Vertical[]>(emptyVerticals);
  const [expandedVertical, setExpandedVertical] = useState<string | null>(null);
  const [selectedSubVertical, setSelectedSubVertical] = useState<SubVertical | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'identity' | 'targeting' | 'timing' | 'outreach' | 'scoring' | 'advanced'>('identity');
  const [showCreateVertical, setShowCreateVertical] = useState(false);

  // Load verticals from API
  useEffect(() => {
    async function loadVerticals() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all verticals
        const verticalsRes = await fetch('/api/admin/vertical-config?all=true');
        const verticalsData = await verticalsRes.json();

        if (!verticalsData.success) {
          throw new Error(verticalsData.error || 'Failed to load verticals');
        }

        // Transform flat config data into UI structure
        const configsArray = verticalsData.data || [];
        const verticalMap = new Map<string, Vertical>();

        for (const config of configsArray) {
          const verticalSlug = config.vertical;

          if (!verticalMap.has(verticalSlug)) {
            verticalMap.set(verticalSlug, {
              id: verticalSlug,
              slug: verticalSlug,
              name: verticalSlug.charAt(0).toUpperCase() + verticalSlug.slice(1).replace(/-/g, ' '),
              description: '',
              icon: getVerticalIcon(verticalSlug),
              isActive: config.isActive ?? true,
              subVerticals: [],
            });
          }

          const vertical = verticalMap.get(verticalSlug)!;

          // Build sub-vertical with persona from config
          const subVertical: SubVertical = {
            id: config.id,
            slug: config.subVertical,
            name: config.subVertical.charAt(0).toUpperCase() + config.subVertical.slice(1).replace(/-/g, ' '),
            description: config.persona?.mission_statement || '',
            isActive: config.isActive ?? true,
            config: config.config,
            persona: config.persona || {
              persona_name: '',
              entity_type: 'company',
            },
          };

          vertical.subVerticals.push(subVertical);
        }

        const verticalsArray = Array.from(verticalMap.values());
        setVerticals(verticalsArray);

        // Expand first vertical if exists
        if (verticalsArray.length > 0) {
          setExpandedVertical(verticalsArray[0].id);
        }
      } catch (err) {
        console.error('Failed to load verticals:', err);
        setError(err instanceof Error ? err.message : 'Failed to load verticals');
      } finally {
        setIsLoading(false);
      }
    }

    loadVerticals();
  }, []);

  async function handleSave() {
    if (!selectedSubVertical) return;

    // Validate persona
    const persona = selectedSubVertical.persona;
    if (!persona.persona_name) {
      alert('Persona name is required');
      return;
    }
    if (!persona.entity_type) {
      alert('Entity type is required');
      return;
    }

    setIsSaving(true);
    try {
      // Update vertical config with new persona
      const response = await fetch(`/api/admin/vertical-config?id=${selectedSubVertical.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: selectedSubVertical.persona,
          config: selectedSubVertical.config,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to save');
      }

      // Update local state
      setVerticals(prevVerticals =>
        prevVerticals.map(v => ({
          ...v,
          subVerticals: v.subVerticals.map(sv =>
            sv.id === selectedSubVertical.id ? selectedSubVertical : sv
          ),
        }))
      );

      setIsEditing(false);
    } catch (err) {
      console.error('Save failed:', err);
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 text-neutral-500 animate-spin" />
        <span className="ml-3 text-neutral-500 text-sm">Loading...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
        <AlertCircle className="w-5 h-5 text-red-400 mx-auto mb-3" />
        <h3 className="text-sm font-medium text-red-400 mb-1">Failed to Load</h3>
        <p className="text-neutral-500 text-xs mb-3">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-white">Verticals & Personas</h1>
          <p className="text-neutral-500 text-sm mt-0.5">Configure verticals and SIVA personas</p>
        </div>
        <button
          onClick={() => setShowCreateVertical(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Vertical
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Verticals List */}
        <div className="col-span-4">
          <div className="bg-neutral-900/50 rounded-lg border border-neutral-800">
            <div className="p-3 border-b border-neutral-800">
              <h2 className="text-sm font-medium text-neutral-300">Verticals</h2>
            </div>
            <div className="divide-y divide-neutral-800">
              {verticals.map((vertical) => (
                <div key={vertical.id}>
                  <button
                    onClick={() => setExpandedVertical(expandedVertical === vertical.id ? null : vertical.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-neutral-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{vertical.icon}</span>
                      <div className="text-left">
                        <p className="text-sm font-medium text-white">{vertical.name}</p>
                        <p className="text-[10px] text-neutral-600">{vertical.subVerticals.length} sub-verticals</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 text-[10px] rounded ${
                        vertical.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-500'
                      }`}>
                        {vertical.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {expandedVertical === vertical.id ? (
                        <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                      )}
                    </div>
                  </button>

                  {expandedVertical === vertical.id && (
                    <div className="bg-neutral-800/30 px-3 pb-3">
                      {vertical.subVerticals.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setSelectedSubVertical(sub);
                            setIsEditing(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 mt-1.5 rounded transition-colors ${
                            selectedSubVertical?.id === sub.id
                              ? 'bg-blue-500/10 border border-blue-500/30'
                              : 'bg-neutral-800/50 hover:bg-neutral-800 border border-transparent'
                          }`}
                        >
                          <div className="text-left">
                            <p className="text-xs font-medium text-white">{sub.name}</p>
                            <p className="text-[10px] text-neutral-600">{sub.persona.persona_name || 'No persona'}</p>
                          </div>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            sub.isActive ? 'bg-emerald-500' : 'bg-neutral-700'
                          }`} />
                        </button>
                      ))}
                      <button className="w-full mt-1.5 p-1.5 text-xs text-neutral-500 hover:text-white hover:bg-neutral-800 rounded transition-colors flex items-center justify-center gap-1.5">
                        <Plus className="w-3 h-3" />
                        Add Sub-Vertical
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Persona Editor */}
        <div className="col-span-8">
          {selectedSubVertical ? (
            <div className="bg-neutral-900/50 rounded-lg border border-neutral-800">
              {/* Header */}
              <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-medium text-white">{selectedSubVertical.name}</h2>
                  <p className="text-xs text-neutral-500">{selectedSubVertical.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-2 py-1 text-xs text-neutral-500 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded transition-colors disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Save
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-white text-xs rounded transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-neutral-800 px-3">
                <nav className="flex gap-0.5">
                  {[
                    { id: 'identity', label: 'Identity', icon: Users },
                    { id: 'targeting', label: 'Targeting', icon: Target },
                    { id: 'timing', label: 'Timing', icon: Clock },
                    { id: 'outreach', label: 'Outreach', icon: MessageSquare },
                    { id: 'scoring', label: 'Scoring', icon: BarChart3 },
                    { id: 'advanced', label: 'Advanced', icon: Shield },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-1.5 px-2.5 py-2 text-xs border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-400'
                          : 'border-transparent text-neutral-500 hover:text-white'
                      }`}
                    >
                      <tab.icon className="w-3 h-3" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-4">
                {activeTab === 'identity' && (
                  <IdentityTab
                    persona={selectedSubVertical.persona}
                    config={selectedSubVertical.config}
                    isEditing={isEditing}
                    onChange={(updates) => {
                      setSelectedSubVertical({
                        ...selectedSubVertical,
                        persona: { ...selectedSubVertical.persona, ...updates }
                      });
                    }}
                    onConfigChange={(updates) => {
                      setSelectedSubVertical({
                        ...selectedSubVertical,
                        config: { ...selectedSubVertical.config, ...updates }
                      });
                    }}
                  />
                )}

                {activeTab === 'targeting' && (
                  <TargetingTab
                    persona={selectedSubVertical.persona}
                    isEditing={isEditing}
                    onChange={(updates) => {
                      setSelectedSubVertical({
                        ...selectedSubVertical,
                        persona: { ...selectedSubVertical.persona, ...updates }
                      });
                    }}
                  />
                )}

                {activeTab === 'outreach' && (
                  <OutreachTab
                    persona={selectedSubVertical.persona}
                    isEditing={isEditing}
                    onChange={(updates) => {
                      setSelectedSubVertical({
                        ...selectedSubVertical,
                        persona: { ...selectedSubVertical.persona, ...updates }
                      });
                    }}
                  />
                )}

                {activeTab === 'scoring' && (
                  <ScoringTab
                    persona={selectedSubVertical.persona}
                    isEditing={isEditing}
                    onChange={(updates) => {
                      setSelectedSubVertical({
                        ...selectedSubVertical,
                        persona: { ...selectedSubVertical.persona, ...updates }
                      });
                    }}
                  />
                )}

                {activeTab === 'timing' && (
                  <div className="text-neutral-500 text-center py-6 text-sm">
                    Timing rules coming soon...
                  </div>
                )}

                {activeTab === 'advanced' && (
                  <div className="text-neutral-500 text-center py-6 text-sm">
                    Advanced settings coming soon...
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-8 text-center">
              <Globe className="w-8 h-8 text-neutral-700 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-neutral-400 mb-1">Select a Sub-Vertical</h3>
              <p className="text-xs text-neutral-600">Choose from the left to edit persona config</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Vertical Modal */}
      {showCreateVertical && (
        <CreateVerticalModal
          onClose={() => setShowCreateVertical(false)}
          onCreate={async () => {
            // Reload the page to fetch new data
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

// PHASE 0: Migration lock status
const VERTICAL_CREATION_LOCKED = true;

// Create Vertical Modal Component
function CreateVerticalModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: () => Promise<void>;
}) {
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [entityType, setEntityType] = useState('company');
  const [regions, setRegions] = useState('UAE');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PHASE 0: Show lock message during migration
  if (VERTICAL_CREATION_LOCKED) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-neutral-900 border border-amber-800/50 rounded-xl w-full max-w-md">
          <div className="p-4 border-b border-amber-800/50 flex items-center justify-between">
            <h2 className="text-sm font-medium text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Migration in Progress
            </h2>
            <button onClick={onClose} className="p-1 text-neutral-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-amber-300">
                <strong>Control Plane v2.0 Migration</strong>
              </p>
              <p className="text-xs text-amber-300/80 mt-1">
                New vertical creation is temporarily disabled while we upgrade the system architecture.
              </p>
            </div>
            <div className="text-xs text-neutral-500 space-y-1">
              <p>During migration:</p>
              <ul className="list-disc list-inside space-y-0.5 text-neutral-600">
                <li>Existing verticals can be edited</li>
                <li>Sub-verticals and personas can be managed</li>
                <li>New vertical creation is blocked</li>
              </ul>
            </div>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded transition-colors"
            >
              Understood
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!key.trim() || !name.trim()) {
      setError('Key and Name are required');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/superadmin/controlplane/verticals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: key.toLowerCase().replace(/\s+/g, '_'),
          name,
          entity_type: entityType,
          region_scope: regions.split(',').map((r) => r.trim()),
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || result.error || 'Failed to create vertical');
      }

      await onCreate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vertical');
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <h2 className="text-sm font-medium text-white">Create Vertical</h2>
          <button onClick={onClose} className="p-1 text-neutral-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Key *</label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="insurance"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-[10px] text-neutral-600 mt-1">Lowercase snake_case (e.g., real_estate)</p>
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Insurance"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Entity Type *</label>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="company">Company</option>
              <option value="individual">Individual</option>
              <option value="deal">Deal</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Regions</label>
            <input
              type="text"
              value={regions}
              onChange={(e) => setRegions(e.target.value)}
              placeholder="UAE, US"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-[10px] text-neutral-600 mt-1">Comma-separated</p>
          </div>
          {error && (
            <div className="p-2 bg-red-500/10 border border-red-500/20 rounded">
              <p className="text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-3 h-3" />
                {error}
              </p>
            </div>
          )}
          <button
            onClick={handleCreate}
            disabled={!key.trim() || !name.trim() || isCreating}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors disabled:opacity-50"
          >
            {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Vertical
          </button>
        </div>
      </div>
    </div>
  );
}

// Identity Tab Component
function IdentityTab({
  persona,
  config,
  isEditing,
  onChange,
  onConfigChange,
}: {
  persona: Persona;
  config?: { default_agent?: string; [key: string]: unknown };
  isEditing: boolean;
  onChange: (updates: Partial<Persona>) => void;
  onConfigChange?: (updates: { default_agent?: string }) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Persona Name *</label>
          {isEditing ? (
            <input
              type="text"
              value={persona.persona_name || ''}
              onChange={(e) => onChange({ persona_name: e.target.value })}
              className="w-full px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., EB Sales Officer"
            />
          ) : (
            <p className="text-sm text-white">{persona.persona_name || '-'}</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-neutral-500 mb-1">Entity Type *</label>
          {isEditing ? (
            <select
              value={persona.entity_type || 'company'}
              onChange={(e) => onChange({ entity_type: e.target.value as 'company' | 'individual' | 'deal' })}
              className="w-full px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="company">Company</option>
              <option value="individual">Individual</option>
              <option value="deal">Deal</option>
            </select>
          ) : (
            <p className="text-sm text-white capitalize">{persona.entity_type || '-'}</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-neutral-500 mb-1">Default Agent</label>
          {isEditing ? (
            <select
              value={config?.default_agent || 'discovery'}
              onChange={(e) => onConfigChange?.({ default_agent: e.target.value })}
              className="w-full px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="discovery">Discovery</option>
              <option value="deal-evaluation">Deal Evaluation</option>
              <option value="ranking">Ranking</option>
              <option value="outreach">Outreach</option>
              <option value="scoring">Scoring</option>
            </select>
          ) : (
            <p className="text-sm text-white">{config?.default_agent || 'discovery'}</p>
          )}
          <p className="text-[10px] text-neutral-600 mt-0.5">SIVA agent mode for this sub-vertical</p>
        </div>

        <div>
          <label className="block text-xs text-neutral-500 mb-1">Role</label>
          {isEditing ? (
            <input
              type="text"
              value={persona.persona_role || ''}
              onChange={(e) => onChange({ persona_role: e.target.value })}
              className="w-full px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., Senior Banking Officer"
            />
          ) : (
            <p className="text-sm text-white">{persona.persona_role || '-'}</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-neutral-500 mb-1">Organization</label>
          {isEditing ? (
            <input
              type="text"
              value={persona.persona_organization || ''}
              onChange={(e) => onChange({ persona_organization: e.target.value })}
              className="w-full px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., Emirates NBD"
            />
          ) : (
            <p className="text-sm text-white">{persona.persona_organization || '-'}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs text-neutral-500 mb-1">Mission Statement</label>
        {isEditing ? (
          <textarea
            value={persona.mission_statement || ''}
            onChange={(e) => onChange({ mission_statement: e.target.value })}
            rows={2}
            className="w-full px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Describe the persona's mission..."
          />
        ) : (
          <p className="text-sm text-white">{persona.mission_statement || '-'}</p>
        )}
      </div>
    </div>
  );
}

// Targeting Tab Component
function TargetingTab({ persona, isEditing, onChange }: { persona: Persona; isEditing: boolean; onChange: (updates: Partial<Persona>) => void }) {
  return (
    <div className="space-y-4">
      {/* Contact Priority Tiers */}
      <div>
        <h3 className="text-sm font-medium text-neutral-300 mb-2">Contact Priority Tiers</h3>
        <div className="space-y-2">
          {persona.contact_priority_rules?.tiers?.map((tier, index) => (
            <div key={index} className="p-2.5 bg-neutral-800/50 rounded border border-neutral-700">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-neutral-500">
                  {tier.size_min !== undefined ? `Size ${tier.size_min} - ${tier.size_max || '∞'}` : `Age ${tier.age_min} - ${tier.age_max || '∞'}`}
                </span>
                <span className="text-[10px] text-blue-400">Priority {tier.priority}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {tier.titles.map((title, i) => (
                  <span key={i} className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] rounded">
                    {title}
                  </span>
                ))}
              </div>
            </div>
          )) || <p className="text-neutral-600 text-xs">No contact tiers configured</p>}
        </div>
      </div>

      {/* Edge Cases */}
      <div className="grid grid-cols-2 gap-4">
        {/* Blockers */}
        <div>
          <h3 className="text-sm font-medium text-neutral-300 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            Blockers
          </h3>
          <div className="space-y-2">
            {persona.edge_cases?.blockers?.map((blocker, index) => (
              <div key={index} className="p-2 bg-red-500/10 border border-red-500/20 rounded">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-red-400 capitalize">{blocker.type.replace(/_/g, ' ')}</span>
                  <span className="text-[10px] text-red-300">×{blocker.multiplier}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {blocker.values.map((v, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-red-500/20 text-red-300 text-[10px] rounded">
                      {v}
                    </span>
                  ))}
                </div>
                {blocker.reason && (
                  <p className="text-[10px] text-neutral-600 mt-1">{blocker.reason}</p>
                )}
              </div>
            )) || <p className="text-neutral-600 text-xs">No blockers</p>}
          </div>
        </div>

        {/* Boosters */}
        <div>
          <h3 className="text-sm font-medium text-neutral-300 mb-2 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
            Boosters
          </h3>
          <div className="space-y-2">
            {persona.edge_cases?.boosters?.map((booster, index) => (
              <div key={index} className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-emerald-400 capitalize">{booster.type.replace(/_/g, ' ')}</span>
                  <span className="text-[10px] text-emerald-300">×{booster.multiplier}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {booster.values.map((v, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded">
                      {v}
                    </span>
                  ))}
                </div>
                {booster.reason && (
                  <p className="text-[10px] text-neutral-600 mt-1">{booster.reason}</p>
                )}
              </div>
            )) || <p className="text-neutral-600 text-xs">No boosters</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// Outreach Tab Component
function OutreachTab({ persona, isEditing, onChange }: { persona: Persona; isEditing: boolean; onChange: (updates: Partial<Persona>) => void }) {
  const doctrine = persona.outreach_doctrine;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Tone</label>
          {isEditing ? (
            <select
              value={doctrine?.tone || 'professional'}
              onChange={(e) => onChange({
                outreach_doctrine: { ...doctrine, tone: e.target.value } as any
              })}
              className="w-full px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-sm text-white"
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
            </select>
          ) : (
            <p className="text-sm text-white capitalize">{doctrine?.tone || '-'}</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-neutral-500 mb-1">Formality</label>
          {isEditing ? (
            <select
              value={doctrine?.formality || 'formal'}
              onChange={(e) => onChange({
                outreach_doctrine: { ...doctrine, formality: e.target.value } as any
              })}
              className="w-full px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-sm text-white"
            >
              <option value="formal">Formal</option>
              <option value="casual">Casual</option>
            </select>
          ) : (
            <p className="text-sm text-white capitalize">{doctrine?.formality || '-'}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs text-neutral-500 mb-1">Channels</label>
        <div className="flex flex-wrap gap-1.5">
          {doctrine?.channels?.map((channel, i) => (
            <span key={i} className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded">
              {channel}
            </span>
          )) || <p className="text-neutral-600 text-xs">No channels</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-emerald-400 mb-1">ALWAYS Rules</label>
          <div className="space-y-1.5">
            {doctrine?.always?.map((rule, i) => (
              <div key={i} className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded">
                <p className="text-xs text-emerald-300">{rule}</p>
              </div>
            )) || <p className="text-neutral-600 text-xs">No ALWAYS rules</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs text-red-400 mb-1">NEVER Rules</label>
          <div className="space-y-1.5">
            {doctrine?.never?.map((rule, i) => (
              <div key={i} className="p-2 bg-red-500/10 border border-red-500/20 rounded">
                <p className="text-xs text-red-300">{rule}</p>
              </div>
            )) || <p className="text-neutral-600 text-xs">No NEVER rules</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// Scoring Tab Component
function ScoringTab({ persona, isEditing, onChange }: { persona: Persona; isEditing: boolean; onChange: (updates: Partial<Persona>) => void }) {
  const config = persona.scoring_config;

  return (
    <div className="space-y-4">
      {/* Weights */}
      <div>
        <h3 className="text-sm font-medium text-neutral-300 mb-2">QTLE Weights</h3>
        <div className="grid grid-cols-4 gap-2">
          {[
            { key: 'q_score', label: 'Quality', color: 'blue' },
            { key: 't_score', label: 'Timing', color: 'emerald' },
            { key: 'l_score', label: 'Likelihood', color: 'violet' },
            { key: 'e_score', label: 'Engagement', color: 'amber' },
          ].map((item) => (
            <div key={item.key} className="p-2.5 bg-neutral-800/50 rounded border border-neutral-700">
              <p className="text-[10px] text-neutral-500 mb-1">{item.label}</p>
              <p className="text-lg font-semibold text-white">
                {((config?.weights as any)?.[item.key] * 100 || 0).toFixed(0)}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Thresholds */}
      <div>
        <h3 className="text-sm font-medium text-neutral-300 mb-2">Score Thresholds</h3>
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded">
            <p className="text-[10px] text-red-400 mb-1">HOT</p>
            <p className="text-lg font-semibold text-red-400">{config?.thresholds?.hot || 80}</p>
          </div>
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded">
            <p className="text-[10px] text-amber-400 mb-1">WARM</p>
            <p className="text-lg font-semibold text-amber-400">{config?.thresholds?.warm || 60}</p>
          </div>
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded">
            <p className="text-[10px] text-blue-400 mb-1">COLD</p>
            <p className="text-lg font-semibold text-blue-400">{config?.thresholds?.cold || 40}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
