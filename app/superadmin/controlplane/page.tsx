'use client';

/**
 * OS Control Plane - Authoritative Configuration
 *
 * STEP 5 Rules (LOCKED):
 * - Rule 1: No dual data sources - only /api/superadmin/controlplane/* APIs
 * - Rule 2: Create → Re-fetch → Render (no optimistic UI)
 * - Rule 3: IDs flow downward, never keys
 * - Rule 4: Policy editor = single atomic save
 * - Rule 5: Runtime truth visible via resolve-config
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  AlertCircle,
  AlertTriangle,
  Plus,
  ChevronDown,
  ChevronRight,
  Edit2,
  Save,
  X,
  Eye,
  CheckCircle,
  Shield,
  Server,
  Users,
  Settings,
  FileText,
  RefreshCw,
  Clock,
} from 'lucide-react';

// =============================================================================
// TYPES (Match DB schema exactly)
// =============================================================================

interface OSVertical {
  id: string;
  key: string;
  name: string;
  entity_type: 'deal' | 'company' | 'individual';
  region_scope: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface OSSubVertical {
  id: string;
  vertical_id: string;
  key: string;
  name: string;
  default_agent: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  vertical_key?: string;
}

interface OSPersona {
  id: string;
  sub_vertical_id: string;
  key: string;
  name: string;
  mission: string | null;
  decision_lens: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  sub_vertical_key?: string;
  vertical_key?: string;
}

interface OSPersonaPolicy {
  id: string;
  persona_id: string;
  policy_version: number;
  allowed_intents: string[];
  forbidden_outputs: string[];
  allowed_tools: string[];
  evidence_scope: Record<string, unknown>;
  memory_scope: Record<string, unknown>;
  cost_budget: Record<string, unknown>;
  latency_budget: Record<string, unknown>;
  escalation_rules: Record<string, unknown>;
  disclaimer_rules: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  persona_key?: string;
}

interface ResolvedConfig {
  binding: { id: string; tenant_id: string; workspace_id: string };
  vertical: { id: string; key: string; name: string; entity_type: string };
  sub_vertical: { id: string; key: string; name: string; default_agent: string };
  persona: { id: string; key: string; name: string; mission: string };
  policy: { id: string; version: number; allowed_intents: string[]; forbidden_outputs: string[] };
}

// =============================================================================
// API FUNCTIONS (Rule 1: Only controlplane APIs)
// =============================================================================

async function fetchVerticals(): Promise<OSVertical[]> {
  const res = await fetch('/api/superadmin/controlplane/verticals');
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch verticals');
  return data.data;
}

async function fetchSubVerticals(verticalId: string): Promise<OSSubVertical[]> {
  const res = await fetch(`/api/superadmin/controlplane/verticals/${verticalId}/sub-verticals`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch sub-verticals');
  return data.data;
}

async function fetchPersonas(): Promise<OSPersona[]> {
  const res = await fetch('/api/superadmin/controlplane/personas');
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch personas');
  return data.data;
}

async function fetchPersonaPolicy(personaId: string): Promise<OSPersonaPolicy> {
  const res = await fetch(`/api/superadmin/controlplane/personas/${personaId}/policy`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch policy');
  return data.data;
}

async function createVertical(payload: {
  key: string;
  name: string;
  entity_type: string;
  region_scope: string[];
}): Promise<OSVertical> {
  const res = await fetch('/api/superadmin/controlplane/verticals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || data.error || 'Failed to create vertical');
  return data.data;
}

async function createSubVertical(payload: {
  vertical_id: string;
  key: string;
  name: string;
  default_agent: string;
}): Promise<OSSubVertical> {
  const res = await fetch('/api/superadmin/controlplane/sub-verticals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || data.error || 'Failed to create sub-vertical');
  return data.data;
}

async function createPersona(payload: {
  sub_vertical_id: string;
  key: string;
  name: string;
  mission?: string;
  decision_lens?: string;
}): Promise<OSPersona> {
  const res = await fetch('/api/superadmin/controlplane/personas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || data.error || 'Failed to create persona');
  return data.data;
}

async function updatePersonaPolicy(
  personaId: string,
  policy: Partial<OSPersonaPolicy>
): Promise<OSPersonaPolicy> {
  const res = await fetch(`/api/superadmin/controlplane/personas/${personaId}/policy`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(policy),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || data.error || 'Failed to update policy');
  return data.data;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ControlPlanePage() {
  // Data state
  const [verticals, setVerticals] = useState<OSVertical[]>([]);
  const [subVerticals, setSubVerticals] = useState<Map<string, OSSubVertical[]>>(new Map());
  const [personas, setPersonas] = useState<OSPersona[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVertical, setExpandedVertical] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<OSPersona | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<OSPersonaPolicy | null>(null);

  // Modal state
  const [showCreateVertical, setShowCreateVertical] = useState(false);
  const [showCreateSubVertical, setShowCreateSubVertical] = useState<string | null>(null);
  const [showCreatePersona, setShowCreatePersona] = useState<string | null>(null);
  const [showRuntimeConfig, setShowRuntimeConfig] = useState(false);
  const [showAuditViewer, setShowAuditViewer] = useState(false);

  // Load all data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [verticalsData, personasData] = await Promise.all([
        fetchVerticals(),
        fetchPersonas(),
      ]);

      setVerticals(verticalsData);
      setPersonas(personasData);

      // Load sub-verticals for each vertical
      const subVerticalsMap = new Map<string, OSSubVertical[]>();
      for (const v of verticalsData) {
        const subs = await fetchSubVerticals(v.id);
        subVerticalsMap.set(v.id, subs);
      }
      setSubVerticals(subVerticalsMap);

      // Expand first vertical if exists
      if (verticalsData.length > 0) {
        setExpandedVertical(verticalsData[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle persona selection - load policy
  const handleSelectPersona = useCallback(async (persona: OSPersona) => {
    setSelectedPersona(persona);
    setSelectedPolicy(null);

    try {
      const policy = await fetchPersonaPolicy(persona.id);
      setSelectedPolicy(policy);
    } catch (err) {
      console.error('Failed to load policy:', err);
    }
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 text-neutral-500 animate-spin" />
        <span className="ml-3 text-neutral-500 text-sm">Loading Control Plane...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
        <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-3" />
        <h3 className="text-sm font-medium text-red-400 mb-1">Failed to Load</h3>
        <p className="text-neutral-500 text-xs mb-4">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded transition-colors"
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
          <h1 className="text-lg font-medium text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-violet-400" />
            OS Control Plane
          </h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            Authoritative configuration for SIVA behavior
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAuditViewer(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Audit Log
          </button>
          <button
            onClick={() => setShowRuntimeConfig(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            View Runtime Config
          </button>
          <button
            onClick={() => setShowCreateVertical(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Vertical
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Hierarchy Panel */}
        <div className="col-span-4 space-y-3">
          {/* Verticals List */}
          <div className="bg-neutral-900/50 rounded-lg border border-neutral-800">
            <div className="p-3 border-b border-neutral-800">
              <h2 className="text-sm font-medium text-neutral-300">Configuration Hierarchy</h2>
            </div>
            <div className="divide-y divide-neutral-800">
              {verticals.length === 0 ? (
                <div className="p-4 text-center text-neutral-600 text-xs">
                  No verticals configured
                </div>
              ) : (
                verticals.map((vertical) => (
                  <VerticalItem
                    key={vertical.id}
                    vertical={vertical}
                    subVerticals={subVerticals.get(vertical.id) || []}
                    personas={personas.filter(
                      (p) =>
                        subVerticals
                          .get(vertical.id)
                          ?.some((sv) => sv.id === p.sub_vertical_id)
                    )}
                    isExpanded={expandedVertical === vertical.id}
                    selectedPersonaId={selectedPersona?.id}
                    onToggle={() =>
                      setExpandedVertical(
                        expandedVertical === vertical.id ? null : vertical.id
                      )
                    }
                    onSelectPersona={handleSelectPersona}
                    onAddSubVertical={() => setShowCreateSubVertical(vertical.id)}
                    onAddPersona={(subVerticalId) => setShowCreatePersona(subVerticalId)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Policy Editor Panel */}
        <div className="col-span-8 space-y-4">
          {selectedPersona && selectedPolicy ? (
            <PolicyEditor
              persona={selectedPersona}
              policy={selectedPolicy}
              onSave={async (updatedPolicy) => {
                // Rule 4: Single atomic save
                const result = await updatePersonaPolicy(selectedPersona.id, updatedPolicy);
                // Rule 2: Re-fetch after save
                setSelectedPolicy(result);
                return result;
              }}
            />
          ) : selectedPersona ? (
            <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-8 text-center">
              <Loader2 className="w-6 h-6 text-neutral-600 mx-auto mb-3 animate-spin" />
              <p className="text-neutral-500 text-sm">Loading policy...</p>
            </div>
          ) : (
            <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-8 text-center">
              <Shield className="w-8 h-8 text-neutral-700 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-neutral-400 mb-1">
                Select a Persona
              </h3>
              <p className="text-xs text-neutral-600">
                Choose from the hierarchy to edit policy
              </p>
            </div>
          )}

          {/* Workspace Binding Section */}
          <WorkspaceBindingSection
            verticals={verticals}
            subVerticals={subVerticals}
            personas={personas}
          />
        </div>
      </div>

      {/* Create Vertical Modal */}
      {showCreateVertical && (
        <CreateVerticalModal
          onClose={() => setShowCreateVertical(false)}
          onCreate={async (payload) => {
            await createVertical(payload);
            // Rule 2: Re-fetch after create
            await loadData();
            setShowCreateVertical(false);
          }}
        />
      )}

      {/* Create Sub-Vertical Modal */}
      {showCreateSubVertical && (
        <CreateSubVerticalModal
          verticalId={showCreateSubVertical}
          onClose={() => setShowCreateSubVertical(null)}
          onCreate={async (payload) => {
            await createSubVertical(payload);
            // Rule 2: Re-fetch after create
            await loadData();
            setShowCreateSubVertical(null);
          }}
        />
      )}

      {/* Create Persona Modal */}
      {showCreatePersona && (
        <CreatePersonaModal
          subVerticalId={showCreatePersona}
          onClose={() => setShowCreatePersona(null)}
          onCreate={async (payload) => {
            await createPersona(payload);
            // Rule 2: Re-fetch after create
            await loadData();
            setShowCreatePersona(null);
          }}
        />
      )}

      {/* Runtime Config Modal (Rule 5) */}
      {showRuntimeConfig && (
        <RuntimeConfigModal onClose={() => setShowRuntimeConfig(false)} />
      )}

      {/* Audit Viewer Modal (Ops/Compliance) */}
      {showAuditViewer && (
        <AuditViewer onClose={() => setShowAuditViewer(false)} />
      )}
    </div>
  );
}

// =============================================================================
// VERTICAL ITEM COMPONENT
// =============================================================================

function VerticalItem({
  vertical,
  subVerticals,
  personas,
  isExpanded,
  selectedPersonaId,
  onToggle,
  onSelectPersona,
  onAddSubVertical,
  onAddPersona,
}: {
  vertical: OSVertical;
  subVerticals: OSSubVertical[];
  personas: OSPersona[];
  isExpanded: boolean;
  selectedPersonaId?: string;
  onToggle: () => void;
  onSelectPersona: (persona: OSPersona) => void;
  onAddSubVertical: () => void;
  onAddPersona: (subVerticalId: string) => void;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-neutral-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">
            {vertical.key === 'saas_sales' ? '💼' : '🏦'}
          </span>
          <div className="text-left">
            <p className="text-sm font-medium text-white">{vertical.name}</p>
            <p className="text-[10px] text-neutral-600">
              {vertical.entity_type} • {subVerticals.length} sub-verticals
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-1.5 py-0.5 text-[10px] rounded ${
              vertical.is_active
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-neutral-800 text-neutral-500'
            }`}
          >
            {vertical.is_active ? 'Active' : 'Inactive'}
          </span>
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="bg-neutral-800/30 px-3 pb-3">
          {subVerticals.map((sv) => {
            const subPersonas = personas.filter((p) => p.sub_vertical_id === sv.id);
            return (
              <div key={sv.id} className="mt-2">
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-1 px-2">
                  <span>{sv.name}</span>
                  <span className="text-[10px] text-neutral-600">
                    {sv.default_agent}
                  </span>
                </div>
                {subPersonas.map((persona) => (
                  <button
                    key={persona.id}
                    onClick={() => onSelectPersona(persona)}
                    className={`w-full flex items-center justify-between p-2 rounded transition-colors ${
                      selectedPersonaId === persona.id
                        ? 'bg-violet-500/10 border border-violet-500/30'
                        : 'bg-neutral-800/50 hover:bg-neutral-800 border border-transparent'
                    }`}
                  >
                    <div className="text-left">
                      <p className="text-xs font-medium text-white">
                        {persona.name}
                      </p>
                      <p className="text-[10px] text-neutral-600">{persona.key}</p>
                    </div>
                    <Users className="w-3 h-3 text-neutral-600" />
                  </button>
                ))}
                <button
                  onClick={() => onAddPersona(sv.id)}
                  className="w-full mt-1 p-1.5 text-[10px] text-neutral-600 hover:text-white hover:bg-neutral-800 rounded transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-2.5 h-2.5" />
                  Add Persona
                </button>
              </div>
            );
          })}
          <button
            onClick={onAddSubVertical}
            className="w-full mt-2 p-1.5 text-xs text-neutral-500 hover:text-white hover:bg-neutral-800 rounded transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3 h-3" />
            Add Sub-Vertical
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// POLICY EDITOR COMPONENT (Rule 4: Single atomic save)
// =============================================================================

function PolicyEditor({
  persona,
  policy,
  onSave,
}: {
  persona: OSPersona;
  policy: OSPersonaPolicy;
  onSave: (policy: Partial<OSPersonaPolicy>) => Promise<OSPersonaPolicy>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedPolicy, setEditedPolicy] = useState<Partial<OSPersonaPolicy>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedVersion, setLastSavedVersion] = useState<number | null>(null);
  // Concurrency tracking
  const [versionAtEditStart, setVersionAtEditStart] = useState<number | null>(null);
  const [concurrencyWarning, setConcurrencyWarning] = useState<string | null>(null);

  // Reset edited state when persona changes
  useEffect(() => {
    setEditedPolicy({});
    setIsEditing(false);
    setSaveError(null);
    setLastSavedVersion(null);
    setVersionAtEditStart(null);
    setConcurrencyWarning(null);
  }, [persona.id]);

  // Track version when editing starts
  const startEditing = () => {
    setVersionAtEditStart(policy.policy_version);
    setConcurrencyWarning(null);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setConcurrencyWarning(null);

    try {
      // Check for concurrent modifications before saving
      const checkRes = await fetch(`/api/superadmin/controlplane/personas/${persona.id}/policy`);
      const checkData = await checkRes.json();

      if (checkData.success && checkData.data.policy_version !== versionAtEditStart) {
        setConcurrencyWarning(
          `Policy was modified by another user (v${versionAtEditStart} → v${checkData.data.policy_version}). ` +
          `Your save will create v${checkData.data.policy_version + 1}.`
        );
      }

      const result = await onSave(editedPolicy);
      setLastSavedVersion(result.policy_version);
      setIsEditing(false);
      setEditedPolicy({});
      setVersionAtEditStart(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const currentAllowedIntents = editedPolicy.allowed_intents ?? policy.allowed_intents;
  const currentForbiddenOutputs = editedPolicy.forbidden_outputs ?? policy.forbidden_outputs;
  const currentAllowedTools = editedPolicy.allowed_tools ?? policy.allowed_tools;

  return (
    <div className="bg-neutral-900/50 rounded-lg border border-neutral-800">
      {/* Header */}
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-violet-400" />
            {persona.name}
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Policy v{policy.policy_version}
            {lastSavedVersion && lastSavedVersion > policy.policy_version && (
              <span className="ml-2 text-emerald-400">
                → Saved as v{lastSavedVersion}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedPolicy({});
                  setSaveError(null);
                }}
                className="px-2 py-1 text-xs text-neutral-500 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || Object.keys(editedPolicy).length === 0}
                className="flex items-center gap-1.5 px-3 py-1 bg-violet-600 hover:bg-violet-700 text-white text-xs rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
                Save All
              </button>
            </>
          ) : (
            <button
              onClick={startEditing}
              className="flex items-center gap-1.5 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-white text-xs rounded transition-colors"
            >
              <Edit2 className="w-3 h-3" />
              Edit Policy
            </button>
          )}
        </div>
      </div>

      {/* Concurrency Warning */}
      {concurrencyWarning && (
        <div className="mx-3 mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-400">{concurrencyWarning}</p>
        </div>
      )}

      {/* Save Error */}
      {saveError && (
        <div className="mx-3 mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <p className="text-xs text-red-400">{saveError}</p>
        </div>
      )}

      {/* Persona Info */}
      <div className="p-3 border-b border-neutral-800 bg-neutral-800/30">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-neutral-500">Mission:</span>
            <p className="text-white mt-0.5">{persona.mission || 'Not set'}</p>
          </div>
          <div>
            <span className="text-neutral-500">Decision Lens:</span>
            <p className="text-white mt-0.5">{persona.decision_lens || 'Not set'}</p>
          </div>
        </div>
      </div>

      {/* Policy Fields */}
      <div className="p-4 space-y-4">
        {/* Allowed Intents */}
        <PolicyArrayField
          label="Allowed Intents"
          description="What SIVA can do"
          items={currentAllowedIntents}
          isEditing={isEditing}
          color="emerald"
          onChange={(items) =>
            setEditedPolicy({ ...editedPolicy, allowed_intents: items })
          }
        />

        {/* Forbidden Outputs */}
        <PolicyArrayField
          label="Forbidden Outputs"
          description="What SIVA must never output"
          items={currentForbiddenOutputs}
          isEditing={isEditing}
          color="red"
          onChange={(items) =>
            setEditedPolicy({ ...editedPolicy, forbidden_outputs: items })
          }
        />

        {/* Allowed Tools */}
        <PolicyArrayField
          label="Allowed Tools"
          description="Tools SIVA can invoke"
          items={currentAllowedTools}
          isEditing={isEditing}
          color="blue"
          onChange={(items) =>
            setEditedPolicy({ ...editedPolicy, allowed_tools: items })
          }
        />
      </div>

      {/* Metadata */}
      <div className="px-4 pb-4">
        <div className="text-[10px] text-neutral-600 flex items-center gap-3">
          <span>Updated: {new Date(policy.updated_at).toLocaleString()}</span>
          <span>•</span>
          <span>Persona ID: {persona.id.substring(0, 8)}...</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// POLICY ARRAY FIELD COMPONENT
// =============================================================================

function PolicyArrayField({
  label,
  description,
  items,
  isEditing,
  color,
  onChange,
}: {
  label: string;
  description: string;
  items: string[];
  isEditing: boolean;
  color: 'emerald' | 'red' | 'blue';
  onChange: (items: string[]) => void;
}) {
  const [newItem, setNewItem] = useState('');

  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      tag: 'bg-emerald-500/20 text-emerald-300',
    },
    red: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      text: 'text-red-400',
      tag: 'bg-red-500/20 text-red-300',
    },
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-400',
      tag: 'bg-blue-500/20 text-blue-300',
    },
  };

  const colors = colorClasses[color];

  const handleAdd = () => {
    const trimmed = newItem.trim();
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed]);
      setNewItem('');
    }
  };

  const handleRemove = (item: string) => {
    onChange(items.filter((i) => i !== item));
  };

  return (
    <div className={`p-3 ${colors.bg} border ${colors.border} rounded`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className={`text-xs font-medium ${colors.text}`}>{label}</h4>
          <p className="text-[10px] text-neutral-600">{description}</p>
        </div>
        <span className="text-[10px] text-neutral-600">{items.length} items</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className={`px-2 py-0.5 ${colors.tag} text-[10px] rounded flex items-center gap-1`}
          >
            {item}
            {isEditing && (
              <button
                onClick={() => handleRemove(item)}
                className="hover:text-white transition-colors"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </span>
        ))}
        {items.length === 0 && (
          <span className="text-[10px] text-neutral-600">None configured</span>
        )}
      </div>
      {isEditing && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Add item..."
            className="flex-1 px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <button
            onClick={handleAdd}
            disabled={!newItem.trim()}
            className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-white text-xs rounded transition-colors disabled:opacity-50"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// RUNTIME CONFIG MODAL (Rule 5)
// =============================================================================

function RuntimeConfigModal({ onClose }: { onClose: () => void }) {
  const [tenantId, setTenantId] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<ResolvedConfig | null>(null);

  const handleResolve = async () => {
    if (!tenantId || !workspaceId) return;

    setIsLoading(true);
    setError(null);
    setConfig(null);

    try {
      // Call OS resolve-config (via proxy or direct)
      const res = await fetch(
        `/api/os/resolve-config?tenant_id=${tenantId}&workspace_id=${workspaceId}`
      );
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || data.error || 'Failed to resolve config');
      }

      setConfig(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-xl">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-medium text-white">View Runtime Config</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Tenant ID</label>
            <input
              type="text"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="UUID of tenant..."
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Workspace ID</label>
            <input
              type="text"
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              placeholder="Workspace identifier..."
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <button
            onClick={handleResolve}
            disabled={!tenantId || !workspaceId || isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            Resolve Config
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Result */}
        {config && (
          <div className="mx-4 mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">
                Config Resolved
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-neutral-500">Vertical:</span>
                <p className="text-white">{config.vertical.key}</p>
              </div>
              <div>
                <span className="text-neutral-500">Sub-Vertical:</span>
                <p className="text-white">{config.sub_vertical.key}</p>
              </div>
              <div>
                <span className="text-neutral-500">Default Agent:</span>
                <p className="text-white">{config.sub_vertical.default_agent}</p>
              </div>
              <div>
                <span className="text-neutral-500">Persona:</span>
                <p className="text-white">{config.persona.key}</p>
              </div>
              <div>
                <span className="text-neutral-500">Policy Version:</span>
                <p className="text-white">v{config.policy.version}</p>
              </div>
              <div>
                <span className="text-neutral-500">Forbidden Outputs:</span>
                <p className="text-white">{config.policy.forbidden_outputs.length} rules</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// CREATE MODALS
// =============================================================================

function CreateVerticalModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (payload: {
    key: string;
    name: string;
    entity_type: string;
    region_scope: string[];
  }) => Promise<void>;
}) {
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [entityType, setEntityType] = useState('company');
  const [regions, setRegions] = useState('US');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);

    try {
      await onCreate({
        key: key.toLowerCase().replace(/\s+/g, '_'),
        name,
        entity_type: entityType,
        region_scope: regions.split(',').map((r) => r.trim()),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
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
              placeholder="saas_sales"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <p className="text-[10px] text-neutral-600 mt-1">Lowercase snake_case</p>
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="SaaS Sales"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Entity Type *</label>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
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
              placeholder="US, UAE"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <p className="text-[10px] text-neutral-600 mt-1">Comma-separated</p>
          </div>
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
          <button
            onClick={handleCreate}
            disabled={!key || !name || isCreating}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded transition-colors disabled:opacity-50"
          >
            {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Vertical
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateSubVerticalModal({
  verticalId,
  onClose,
  onCreate,
}: {
  verticalId: string;
  onClose: () => void;
  onCreate: (payload: {
    vertical_id: string;
    key: string;
    name: string;
    default_agent: string;
  }) => Promise<void>;
}) {
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [defaultAgent, setDefaultAgent] = useState('discovery');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);

    try {
      await onCreate({
        vertical_id: verticalId,
        key: key.toLowerCase().replace(/\s+/g, '_'),
        name,
        default_agent: defaultAgent,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <h2 className="text-sm font-medium text-white">Create Sub-Vertical</h2>
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
              placeholder="deal_evaluation"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Deal Evaluation"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Default Agent *</label>
            <select
              value={defaultAgent}
              onChange={(e) => setDefaultAgent(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              <option value="discovery">Discovery</option>
              <option value="deal-evaluation">Deal Evaluation</option>
              <option value="ranking">Ranking</option>
              <option value="scoring">Scoring</option>
            </select>
            <p className="text-[10px] text-amber-400 mt-1">
              Changing this affects runtime behavior
            </p>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            onClick={handleCreate}
            disabled={!key || !name || isCreating}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded transition-colors disabled:opacity-50"
          >
            {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Sub-Vertical
          </button>
        </div>
      </div>
    </div>
  );
}

function CreatePersonaModal({
  subVerticalId,
  onClose,
  onCreate,
}: {
  subVerticalId: string;
  onClose: () => void;
  onCreate: (payload: {
    sub_vertical_id: string;
    key: string;
    name: string;
    mission?: string;
    decision_lens?: string;
  }) => Promise<void>;
}) {
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [mission, setMission] = useState('');
  const [decisionLens, setDecisionLens] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);

    try {
      await onCreate({
        sub_vertical_id: subVerticalId,
        key: key.toLowerCase().replace(/\s+/g, '_'),
        name,
        mission: mission || undefined,
        decision_lens: decisionLens || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <h2 className="text-sm font-medium text-white">Create Persona</h2>
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
              placeholder="skeptical_cfo"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Skeptical CFO"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Mission</label>
            <textarea
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              placeholder="Protect the company from bad deals..."
              rows={2}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Decision Lens</label>
            <textarea
              value={decisionLens}
              onChange={(e) => setDecisionLens(e.target.value)}
              placeholder="Assume every deal is risky..."
              rows={2}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            onClick={handleCreate}
            disabled={!key || !name || isCreating}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded transition-colors disabled:opacity-50"
          >
            {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Persona
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// WORKSPACE BINDING SECTION
// =============================================================================

interface WorkspaceBinding {
  id: string;
  tenant_id: string;
  workspace_id: string;
  vertical_id: string;
  sub_vertical_id: string;
  persona_id: string;
  is_active: boolean;
  created_at: string;
  vertical_key?: string;
  sub_vertical_key?: string;
  persona_key?: string;
}

function WorkspaceBindingSection({
  verticals,
  subVerticals,
  personas,
}: {
  verticals: OSVertical[];
  subVerticals: Map<string, OSSubVertical[]>;
  personas: OSPersona[];
}) {
  const [tenantId, setTenantId] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [selectedVerticalId, setSelectedVerticalId] = useState('');
  const [selectedSubVerticalId, setSelectedSubVerticalId] = useState('');
  const [selectedPersonaId, setSelectedPersonaId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<WorkspaceBinding | null>(null);

  const availableSubVerticals = selectedVerticalId
    ? subVerticals.get(selectedVerticalId) || []
    : [];

  const availablePersonas = selectedSubVerticalId
    ? personas.filter((p) => p.sub_vertical_id === selectedSubVerticalId)
    : [];

  const handleCreateBinding = async () => {
    if (!tenantId || !workspaceId || !selectedVerticalId || !selectedSubVerticalId || !selectedPersonaId) {
      setError('All fields are required');
      return;
    }

    setIsCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/superadmin/controlplane/workspaces/${workspaceId}/binding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          vertical_id: selectedVerticalId,
          sub_vertical_id: selectedSubVerticalId,
          persona_id: selectedPersonaId,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || data.error || 'Failed to create binding');
      }

      setSuccess(data.data);
      // Clear form
      setTenantId('');
      setWorkspaceId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create binding');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
      <h3 className="text-sm font-medium text-white flex items-center gap-2 mb-4">
        <Settings className="w-4 h-4 text-violet-400" />
        Create Workspace Binding
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Tenant ID *</label>
          <input
            type="text"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            placeholder="UUID of tenant..."
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Workspace ID *</label>
          <input
            type="text"
            value={workspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
            placeholder="Workspace identifier..."
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Vertical *</label>
          <select
            value={selectedVerticalId}
            onChange={(e) => {
              setSelectedVerticalId(e.target.value);
              setSelectedSubVerticalId('');
              setSelectedPersonaId('');
            }}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            <option value="">Select vertical...</option>
            {verticals.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.key})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Sub-Vertical *</label>
          <select
            value={selectedSubVerticalId}
            onChange={(e) => {
              setSelectedSubVerticalId(e.target.value);
              setSelectedPersonaId('');
            }}
            disabled={!selectedVerticalId}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
          >
            <option value="">Select sub-vertical...</option>
            {availableSubVerticals.map((sv) => (
              <option key={sv.id} value={sv.id}>
                {sv.name} ({sv.default_agent})
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-neutral-500 mb-1">Persona *</label>
          <select
            value={selectedPersonaId}
            onChange={(e) => setSelectedPersonaId(e.target.value)}
            disabled={!selectedSubVerticalId}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
          >
            <option value="">Select persona...</option>
            {availablePersonas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} - {p.mission?.substring(0, 50)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded">
          <p className="text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Binding created: {success.id.substring(0, 8)}...
          </p>
          <p className="text-[10px] text-neutral-600 mt-1">
            Use "View Runtime Config" to verify the binding
          </p>
        </div>
      )}

      <button
        onClick={handleCreateBinding}
        disabled={isCreating || !tenantId || !workspaceId || !selectedPersonaId}
        className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isCreating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        Create Binding
      </button>

      <p className="text-[10px] text-neutral-600 mt-2 text-center">
        Bindings link workspaces to personas. Required for resolve-config to work.
      </p>
    </div>
  );
}

// =============================================================================
// AUDIT VIEWER (Read-only for ops/compliance)
// =============================================================================

interface AuditEntry {
  id: string;
  actor_user: string;
  action: string;
  target_type: string;
  target_id: string | null;
  request_json: Record<string, unknown> | null;
  result_json: Record<string, unknown> | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

function AuditViewer({ onClose }: { onClose: () => void }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const loadAuditLog = useCallback(async (newOffset: number = 0) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/superadmin/controlplane/audit?limit=${limit}&offset=${newOffset}`
      );
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to load audit log');
      }

      setEntries(data.data.entries);
      setTotal(data.data.total);
      setOffset(newOffset);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuditLog(0);
  }, [loadAuditLog]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-medium text-white">Audit Log</h2>
            <span className="text-xs text-neutral-500">({total} entries)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadAuditLog(offset)}
              className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-5 h-5 text-neutral-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center text-red-400 text-sm">{error}</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-500 text-sm">No audit entries yet</p>
              <p className="text-neutral-600 text-xs mt-1">
                Entries appear when control plane APIs are used
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-3 rounded border ${
                    entry.success
                      ? 'bg-neutral-800/50 border-neutral-700'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 text-[10px] rounded font-medium ${
                            entry.success
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {entry.success ? 'OK' : 'FAIL'}
                        </span>
                        <span className="text-xs font-medium text-white">
                          {entry.action}
                        </span>
                        <span className="text-xs text-neutral-500">
                          on {entry.target_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-neutral-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(entry.created_at)}
                        </span>
                        <span>by {entry.actor_user}</span>
                        {entry.target_id && (
                          <span className="font-mono">
                            {entry.target_id.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                      {entry.error_message && (
                        <p className="mt-1 text-xs text-red-400">
                          {entry.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="p-3 border-t border-neutral-800 flex items-center justify-between flex-shrink-0">
            <span className="text-xs text-neutral-500">
              Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadAuditLog(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="px-2 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-white rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => loadAuditLog(offset + limit)}
                disabled={offset + limit >= total}
                className="px-2 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-white rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
