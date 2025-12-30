'use client';

/**
 * S338-F4: Policy Editor Panel (Harden Mode)
 *
 * Edit policy fields with versioning support:
 * - Allowed intents
 * - Forbidden outputs
 * - Allowed tools
 * - Version history display
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Save,
  Plus,
  X,
  History,
  RefreshCw,
  FileText,
  Zap,
  Ban,
  Wrench,
  Play,
} from 'lucide-react';
import { RuntimeReadinessPanel } from '@/components/controlplane/harden/RuntimeReadinessPanel';

// =============================================================================
// TYPES
// =============================================================================

interface Policy {
  id: string;
  persona_id: string;
  policy_version: number;
  status: 'DRAFT' | 'ACTIVE' | 'DEPRECATED' | 'STAGED';
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
}

interface PolicyVersion {
  id: string;
  policy_version: number;
  status: string;
  created_at: string;
}

interface Persona {
  id: string;
  key: string;
  name: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function PolicyHardenPage() {
  const params = useParams();
  const router = useRouter();
  const policyId = params?.id as string;

  // Data state
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [versions, setVersions] = useState<PolicyVersion[]>([]);

  // Edit state
  const [allowedIntents, setAllowedIntents] = useState<string[]>([]);
  const [forbiddenOutputs, setForbiddenOutputs] = useState<string[]>([]);
  const [allowedTools, setAllowedTools] = useState<string[]>([]);
  const [newIntent, setNewIntent] = useState('');
  const [newForbidden, setNewForbidden] = useState('');
  const [newTool, setNewTool] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activateSuccess, setActivateSuccess] = useState(false);
  const [showVersions, setShowVersions] = useState(false);

  // =============================================================================
  // DATA LOADING
  // =============================================================================

  const loadPolicyData = useCallback(async () => {
    if (!policyId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch policy details
      const policyRes = await fetch(`/api/superadmin/controlplane/policies/${policyId}`);
      const policyData = await policyRes.json();

      if (!policyData.success) {
        throw new Error(policyData.error || 'Failed to fetch policy');
      }

      const policyObj = policyData.data.policy || policyData.data;
      setPolicy(policyObj);
      setAllowedIntents(policyObj.allowed_intents || []);
      setForbiddenOutputs(policyObj.forbidden_outputs || []);
      setAllowedTools(policyObj.allowed_tools || []);

      // Set version history if provided
      if (policyData.data.version_history) {
        setVersions(policyData.data.version_history);
      }

      // Fetch persona info
      if (policyObj.persona_id) {
        const personaRes = await fetch(`/api/superadmin/controlplane/personas/${policyObj.persona_id}`);
        const personaData = await personaRes.json();
        if (personaData.success) {
          setPersona(personaData.data.persona || personaData.data);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load policy');
    } finally {
      setIsLoading(false);
    }
  }, [policyId]);

  useEffect(() => {
    loadPolicyData();
  }, [loadPolicyData]);

  // Track changes
  useEffect(() => {
    if (!policy) return;

    const intentsChanged = JSON.stringify(allowedIntents.sort()) !== JSON.stringify((policy.allowed_intents || []).sort());
    const forbiddenChanged = JSON.stringify(forbiddenOutputs.sort()) !== JSON.stringify((policy.forbidden_outputs || []).sort());
    const toolsChanged = JSON.stringify(allowedTools.sort()) !== JSON.stringify((policy.allowed_tools || []).sort());

    setHasChanges(intentsChanged || forbiddenChanged || toolsChanged);
  }, [policy, allowedIntents, forbiddenOutputs, allowedTools]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleSave = async () => {
    if (!policy || !hasChanges) return;

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/superadmin/controlplane/policies/${policyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allowed_intents: allowedIntents,
          forbidden_outputs: forbiddenOutputs,
          allowed_tools: allowedTools,
        }),
      });

      // Safe JSON parsing
      const text = await res.text();
      if (!text || text.trim() === '') {
        throw new Error('Empty response from server');
      }
      const data = JSON.parse(text);

      if (!data.success) {
        throw new Error(data.error || 'Failed to save');
      }

      // Update local state
      setPolicy(data.data);
      setSaveSuccess(true);
      setHasChanges(false);

      // Clear success message after 3s
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivate = async () => {
    if (!policy || !persona || policy.status !== 'DRAFT') return;

    // Confirm activation
    if (!window.confirm(`Activate Policy v${policy.policy_version}? This will make it the active policy for ${persona.name}.`)) {
      return;
    }

    setIsActivating(true);
    setError(null);
    setActivateSuccess(false);

    try {
      const res = await fetch(`/api/superadmin/controlplane/personas/${persona.id}/policy/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policy_id: policy.id,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to activate policy');
      }

      setActivateSuccess(true);
      await loadPolicyData(); // Refresh to show new status

      // Clear success message after 3s
      setTimeout(() => setActivateSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate policy');
    } finally {
      setIsActivating(false);
    }
  };

  const addItem = (type: 'intent' | 'forbidden' | 'tool') => {
    if (type === 'intent' && newIntent.trim()) {
      if (!allowedIntents.includes(newIntent.trim())) {
        setAllowedIntents([...allowedIntents, newIntent.trim()]);
      }
      setNewIntent('');
    } else if (type === 'forbidden' && newForbidden.trim()) {
      if (!forbiddenOutputs.includes(newForbidden.trim())) {
        setForbiddenOutputs([...forbiddenOutputs, newForbidden.trim()]);
      }
      setNewForbidden('');
    } else if (type === 'tool' && newTool.trim()) {
      if (!allowedTools.includes(newTool.trim())) {
        setAllowedTools([...allowedTools, newTool.trim()]);
      }
      setNewTool('');
    }
  };

  const removeItem = (type: 'intent' | 'forbidden' | 'tool', item: string) => {
    if (type === 'intent') {
      setAllowedIntents(allowedIntents.filter(i => i !== item));
    } else if (type === 'forbidden') {
      setForbiddenOutputs(forbiddenOutputs.filter(i => i !== item));
    } else if (type === 'tool') {
      setAllowedTools(allowedTools.filter(i => i !== item));
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading policy...</span>
        </div>
      </div>
    );
  }

  if (error && !policy) {
    return (
      <div className="min-h-screen bg-neutral-950 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <h2 className="text-lg font-medium text-red-400 mb-2">Failed to Load</h2>
            <p className="text-neutral-400 text-sm mb-4">{error}</p>
            <Link
              href="/superadmin/controlplane"
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Control Plane
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!policy) return null;

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-neutral-500 mb-6">
          <Link href="/superadmin/controlplane" className="hover:text-white">
            Control Plane
          </Link>
          <span>/</span>
          <Link href="/superadmin/controlplane/harden" className="hover:text-white">
            Harden Mode
          </Link>
          <span>/</span>
          <span className="text-amber-400">Policy v{policy.policy_version}</span>
        </nav>

        {/* Header */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-amber-400" />
              <div>
                <h1 className="text-lg font-medium text-white flex items-center gap-2">
                  Policy v{policy.policy_version}
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      policy.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : policy.status === 'DRAFT'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-neutral-500/20 text-neutral-400'
                    }`}
                  >
                    {policy.status}
                  </span>
                </h1>
                <p className="text-sm text-neutral-400 mt-0.5">
                  {persona ? `Persona: ${persona.name}` : 'Loading persona...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {saveSuccess && (
                <span className="flex items-center gap-1.5 text-emerald-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Saved
                </span>
              )}
              {activateSuccess && (
                <span className="flex items-center gap-1.5 text-emerald-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Activated
                </span>
              )}
              <button
                onClick={() => setShowVersions(!showVersions)}
                className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded transition-colors"
              >
                <History className="w-4 h-4" />
                Versions
              </button>
              {/* Activate button - only for DRAFT policies */}
              {policy.status === 'DRAFT' && (
                <button
                  onClick={handleActivate}
                  disabled={isActivating || hasChanges}
                  className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
                    !isActivating && !hasChanges
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  }`}
                  title={hasChanges ? 'Save changes before activating' : 'Activate this policy version'}
                >
                  {isActivating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  {isActivating ? 'Activating...' : 'Activate'}
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
                  hasChanges && !isSaving
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                }`}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Version History Panel */}
        {showVersions && (
          <div className="mb-6 bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <History className="w-4 h-4 text-blue-400" />
                Version History
              </h2>
              <button
                onClick={loadPolicyData}
                className="p-1 text-neutral-500 hover:text-white transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            {versions.length > 0 ? (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className={`flex items-center justify-between px-2 py-1.5 rounded text-xs ${
                      version.id === policy.id
                        ? 'bg-amber-500/10 border border-amber-500/20'
                        : 'bg-neutral-800/50 hover:bg-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">v{version.policy_version}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] ${
                          version.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : version.status === 'DRAFT'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-neutral-500/20 text-neutral-400'
                        }`}
                      >
                        {version.status}
                      </span>
                      {version.id === policy.id && (
                        <span className="text-amber-400">(current)</span>
                      )}
                    </div>
                    <span className="text-neutral-500">
                      {new Date(version.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-500 text-xs">No version history available</p>
            )}
          </div>
        )}

        {/* S339: Runtime Readiness Panel - Shows persona's runtime readiness */}
        {policy.persona_id && (
          <RuntimeReadinessPanel
            entityType="persona"
            entityId={policy.persona_id}
            className="mb-6"
          />
        )}

        {/* Policy Fields */}
        <div className="space-y-6">
          {/* Allowed Intents */}
          <PolicyArrayEditor
            label="Allowed Intents"
            description="What actions this persona can perform"
            icon={<Zap className="w-4 h-4 text-emerald-400" />}
            items={allowedIntents}
            newValue={newIntent}
            setNewValue={setNewIntent}
            onAdd={() => addItem('intent')}
            onRemove={(item) => removeItem('intent', item)}
            color="emerald"
            placeholder="e.g., analyze_risk, recommend_action"
          />

          {/* Forbidden Outputs */}
          <PolicyArrayEditor
            label="Forbidden Outputs"
            description="What this persona must never output"
            icon={<Ban className="w-4 h-4 text-red-400" />}
            items={forbiddenOutputs}
            newValue={newForbidden}
            setNewValue={setNewForbidden}
            onAdd={() => addItem('forbidden')}
            onRemove={(item) => removeItem('forbidden', item)}
            color="red"
            placeholder="e.g., NEVER_GUARANTEE_OUTCOME"
          />

          {/* Allowed Tools */}
          <PolicyArrayEditor
            label="Allowed Tools"
            description="What tools this persona can invoke"
            icon={<Wrench className="w-4 h-4 text-blue-400" />}
            items={allowedTools}
            newValue={newTool}
            setNewValue={setNewTool}
            onAdd={() => addItem('tool')}
            onRemove={(item) => removeItem('tool', item)}
            color="blue"
            placeholder="e.g., web_search, deal_lookup"
          />
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex items-center gap-3">
          {persona && (
            <Link
              href={`/superadmin/controlplane/harden/persona/${persona.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded transition-colors"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              Harden Parent Persona
            </Link>
          )}
          <Link
            href="/superadmin/controlplane"
            className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Control Plane
          </Link>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function PolicyArrayEditor({
  label,
  description,
  icon,
  items,
  newValue,
  setNewValue,
  onAdd,
  onRemove,
  color,
  placeholder,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  items: string[];
  newValue: string;
  setNewValue: (v: string) => void;
  onAdd: () => void;
  onRemove: (item: string) => void;
  color: 'emerald' | 'red' | 'blue';
  placeholder: string;
}) {
  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      tag: 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30',
      input: 'focus:ring-emerald-500',
    },
    red: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      tag: 'bg-red-500/20 text-red-300 hover:bg-red-500/30',
      input: 'focus:ring-red-500',
    },
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      tag: 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30',
      input: 'focus:ring-blue-500',
    },
  };

  const colors = colorClasses[color];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAdd();
    }
  };

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <h3 className="text-sm font-medium text-white">{label}</h3>
            <p className="text-[10px] text-neutral-500">{description}</p>
          </div>
        </div>
        <span className="text-xs text-neutral-500">{items.length} items</span>
      </div>

      {/* Items */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {items.map((item) => (
          <span
            key={item}
            className={`inline-flex items-center gap-1 px-2 py-0.5 ${colors.tag} text-xs rounded group`}
          >
            {item}
            <button
              onClick={() => onRemove(item)}
              className="opacity-50 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {items.length === 0 && (
          <span className="text-xs text-neutral-600">None configured</span>
        )}
      </div>

      {/* Add new */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`flex-1 px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 ${colors.input}`}
        />
        <button
          onClick={onAdd}
          disabled={!newValue.trim()}
          className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
