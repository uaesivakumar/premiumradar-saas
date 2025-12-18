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
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        <span className="ml-3 text-gray-400">Loading verticals...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-400 mb-2">Failed to Load Verticals</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Verticals & Personas</h1>
          <p className="text-gray-400 mt-1">Configure industry verticals and SIVA personas</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          Add Vertical
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Verticals List */}
        <div className="col-span-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800">
            <div className="p-4 border-b border-gray-800">
              <h2 className="font-semibold text-white">Verticals</h2>
            </div>
            <div className="divide-y divide-gray-800">
              {verticals.map((vertical) => (
                <div key={vertical.id}>
                  <button
                    onClick={() => setExpandedVertical(expandedVertical === vertical.id ? null : vertical.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{vertical.icon}</span>
                      <div className="text-left">
                        <p className="font-medium text-white">{vertical.name}</p>
                        <p className="text-xs text-gray-500">{vertical.subVerticals.length} sub-verticals</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        vertical.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                      }`}>
                        {vertical.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {expandedVertical === vertical.id ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {expandedVertical === vertical.id && (
                    <div className="bg-gray-800/30 px-4 pb-4">
                      {vertical.subVerticals.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setSelectedSubVertical(sub);
                            setIsEditing(false);
                          }}
                          className={`w-full flex items-center justify-between p-3 mt-2 rounded-lg transition-colors ${
                            selectedSubVertical?.id === sub.id
                              ? 'bg-blue-600/20 border border-blue-500/30'
                              : 'bg-gray-800/50 hover:bg-gray-800 border border-transparent'
                          }`}
                        >
                          <div className="text-left">
                            <p className="text-sm font-medium text-white">{sub.name}</p>
                            <p className="text-xs text-gray-500">{sub.persona.persona_name || 'No persona'}</p>
                          </div>
                          <span className={`w-2 h-2 rounded-full ${
                            sub.isActive ? 'bg-green-500' : 'bg-gray-600'
                          }`} />
                        </button>
                      ))}
                      <button className="w-full mt-2 p-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" />
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
            <div className="bg-gray-900 rounded-xl border border-gray-800">
              {/* Header */}
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-white">{selectedSubVertical.name}</h2>
                  <p className="text-sm text-gray-500">{selectedSubVertical.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Persona
                    </button>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-800 px-4">
                <nav className="flex gap-1">
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
                      className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-400'
                          : 'border-transparent text-gray-400 hover:text-white'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
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
                  <div className="text-gray-400 text-center py-8">
                    Timing rules configuration coming soon...
                  </div>
                )}

                {activeTab === 'advanced' && (
                  <div className="text-gray-400 text-center py-8">
                    Advanced settings (anti-patterns, confidence gates) coming soon...
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
              <Globe className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">Select a Sub-Vertical</h3>
              <p className="text-gray-500">Choose a sub-vertical from the left to view and edit its persona configuration.</p>
            </div>
          )}
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
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Persona Name *</label>
          {isEditing ? (
            <input
              type="text"
              value={persona.persona_name || ''}
              onChange={(e) => onChange({ persona_name: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., EB Sales Officer"
            />
          ) : (
            <p className="text-white">{persona.persona_name || '-'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Entity Type *</label>
          {isEditing ? (
            <select
              value={persona.entity_type || 'company'}
              onChange={(e) => onChange({ entity_type: e.target.value as 'company' | 'individual' | 'deal' })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="company">Company</option>
              <option value="individual">Individual</option>
              <option value="deal">Deal</option>
            </select>
          ) : (
            <p className="text-white capitalize">{persona.entity_type || '-'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Default Agent Type</label>
          {isEditing ? (
            <select
              value={config?.default_agent || 'discovery'}
              onChange={(e) => onConfigChange?.({ default_agent: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="discovery">Discovery (Company Leads)</option>
              <option value="deal-evaluation">Deal Evaluation (SaaS Sales)</option>
              <option value="ranking">Ranking</option>
              <option value="outreach">Outreach</option>
              <option value="scoring">Scoring</option>
            </select>
          ) : (
            <p className="text-white">{config?.default_agent || 'discovery'}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Determines which SIVA agent mode is used for this sub-vertical</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Role</label>
          {isEditing ? (
            <input
              type="text"
              value={persona.persona_role || ''}
              onChange={(e) => onChange({ persona_role: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Senior Banking Officer"
            />
          ) : (
            <p className="text-white">{persona.persona_role || '-'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Organization</label>
          {isEditing ? (
            <input
              type="text"
              value={persona.persona_organization || ''}
              onChange={(e) => onChange({ persona_organization: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Emirates NBD"
            />
          ) : (
            <p className="text-white">{persona.persona_organization || '-'}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Mission Statement</label>
        {isEditing ? (
          <textarea
            value={persona.mission_statement || ''}
            onChange={(e) => onChange({ mission_statement: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe the persona's mission and goals..."
          />
        ) : (
          <p className="text-white">{persona.mission_statement || '-'}</p>
        )}
      </div>
    </div>
  );
}

// Targeting Tab Component
function TargetingTab({ persona, isEditing, onChange }: { persona: Persona; isEditing: boolean; onChange: (updates: Partial<Persona>) => void }) {
  return (
    <div className="space-y-6">
      {/* Contact Priority Tiers */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Contact Priority Tiers</h3>
        <div className="space-y-3">
          {persona.contact_priority_rules?.tiers?.map((tier, index) => (
            <div key={index} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">
                  {tier.size_min !== undefined ? `Size ${tier.size_min} - ${tier.size_max || '∞'}` : `Age ${tier.age_min} - ${tier.age_max || '∞'}`}
                </span>
                <span className="text-xs text-blue-400">Priority {tier.priority}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {tier.titles.map((title, i) => (
                  <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                    {title}
                  </span>
                ))}
              </div>
            </div>
          )) || <p className="text-gray-500">No contact tiers configured</p>}
        </div>
      </div>

      {/* Edge Cases */}
      <div className="grid grid-cols-2 gap-6">
        {/* Blockers */}
        <div>
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Blockers
          </h3>
          <div className="space-y-3">
            {persona.edge_cases?.blockers?.map((blocker, index) => (
              <div key={index} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-red-400 capitalize">{blocker.type.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-red-300">×{blocker.multiplier}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {blocker.values.map((v, i) => (
                    <span key={i} className="px-2 py-0.5 bg-red-500/20 text-red-300 text-xs rounded">
                      {v}
                    </span>
                  ))}
                </div>
                {blocker.reason && (
                  <p className="text-xs text-gray-500 mt-2">{blocker.reason}</p>
                )}
              </div>
            )) || <p className="text-gray-500">No blockers configured</p>}
          </div>
        </div>

        {/* Boosters */}
        <div>
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-green-400" />
            Boosters
          </h3>
          <div className="space-y-3">
            {persona.edge_cases?.boosters?.map((booster, index) => (
              <div key={index} className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-green-400 capitalize">{booster.type.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-green-300">×{booster.multiplier}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {booster.values.map((v, i) => (
                    <span key={i} className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs rounded">
                      {v}
                    </span>
                  ))}
                </div>
                {booster.reason && (
                  <p className="text-xs text-gray-500 mt-2">{booster.reason}</p>
                )}
              </div>
            )) || <p className="text-gray-500">No boosters configured</p>}
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
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Tone</label>
          {isEditing ? (
            <select
              value={doctrine?.tone || 'professional'}
              onChange={(e) => onChange({
                outreach_doctrine: { ...doctrine, tone: e.target.value } as any
              })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
            </select>
          ) : (
            <p className="text-white capitalize">{doctrine?.tone || '-'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Formality</label>
          {isEditing ? (
            <select
              value={doctrine?.formality || 'formal'}
              onChange={(e) => onChange({
                outreach_doctrine: { ...doctrine, formality: e.target.value } as any
              })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            >
              <option value="formal">Formal</option>
              <option value="casual">Casual</option>
            </select>
          ) : (
            <p className="text-white capitalize">{doctrine?.formality || '-'}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Channels</label>
        <div className="flex flex-wrap gap-2">
          {doctrine?.channels?.map((channel, i) => (
            <span key={i} className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-lg">
              {channel}
            </span>
          )) || <p className="text-gray-500">No channels configured</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-green-400 mb-2">ALWAYS Rules</label>
          <div className="space-y-2">
            {doctrine?.always?.map((rule, i) => (
              <div key={i} className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-300">{rule}</p>
              </div>
            )) || <p className="text-gray-500">No ALWAYS rules</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-red-400 mb-2">NEVER Rules</label>
          <div className="space-y-2">
            {doctrine?.never?.map((rule, i) => (
              <div key={i} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-300">{rule}</p>
              </div>
            )) || <p className="text-gray-500">No NEVER rules</p>}
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
    <div className="space-y-6">
      {/* Weights */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4">QTLE Weights</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { key: 'q_score', label: 'Quality (Q)', color: 'blue' },
            { key: 't_score', label: 'Timing (T)', color: 'green' },
            { key: 'l_score', label: 'Likelihood (L)', color: 'purple' },
            { key: 'e_score', label: 'Engagement (E)', color: 'orange' },
          ].map((item) => (
            <div key={item.key} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400 mb-2">{item.label}</p>
              <p className="text-2xl font-bold text-white">
                {((config?.weights as any)?.[item.key] * 100 || 0).toFixed(0)}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Thresholds */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Score Thresholds</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400 mb-2">HOT Threshold</p>
            <p className="text-2xl font-bold text-red-400">{config?.thresholds?.hot || 80}</p>
          </div>
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-400 mb-2">WARM Threshold</p>
            <p className="text-2xl font-bold text-yellow-400">{config?.thresholds?.warm || 60}</p>
          </div>
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-400 mb-2">COLD Threshold</p>
            <p className="text-2xl font-bold text-blue-400">{config?.thresholds?.cold || 40}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
