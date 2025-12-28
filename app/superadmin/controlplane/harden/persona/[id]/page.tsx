'use client';

/**
 * S338-F3: Persona Editor Panel (Harden Mode)
 *
 * Post-creation audit & edit for existing personas.
 * Allows editing scope, region, description, and viewing/switching policy linkage.
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
  Users,
  FileText,
  History,
  RefreshCw,
  Globe,
  MapPin,
  Target,
} from 'lucide-react';
import { RuntimeReadinessPanel } from '@/components/controlplane/harden/RuntimeReadinessPanel';

// =============================================================================
// TYPES
// =============================================================================

interface Persona {
  id: string;
  sub_vertical_id: string;
  key: string;
  name: string;
  mission: string | null;
  decision_lens: string | null;
  scope?: string;
  region_code?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  sub_vertical_key?: string;
  sub_vertical_name?: string;
  vertical_key?: string;
  vertical_name?: string;
}

interface Policy {
  id: string;
  persona_id: string;
  policy_version: number;
  status: 'DRAFT' | 'ACTIVE' | 'DEPRECATED' | 'STAGED';
  allowed_intents: string[];
  forbidden_outputs: string[];
  allowed_tools: string[];
  created_at: string;
  updated_at: string;
}

interface PolicyVersion {
  id: string;
  policy_version: number;
  status: string;
  created_at: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function PersonaHardenPage() {
  const params = useParams();
  const router = useRouter();
  const personaId = params?.id as string;

  // Data state
  const [persona, setPersona] = useState<Persona | null>(null);
  const [activePolicy, setActivePolicy] = useState<Policy | null>(null);
  const [policyVersions, setPolicyVersions] = useState<PolicyVersion[]>([]);

  // Edit state
  const [editedMission, setEditedMission] = useState('');
  const [editedDecisionLens, setEditedDecisionLens] = useState('');
  const [editedScope, setEditedScope] = useState('');
  const [editedRegionCode, setEditedRegionCode] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // =============================================================================
  // DATA LOADING
  // =============================================================================

  const loadPersonaData = useCallback(async () => {
    if (!personaId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch persona details
      const personaRes = await fetch(`/api/superadmin/controlplane/personas/${personaId}`);
      const personaData = await personaRes.json();

      if (!personaData.success) {
        throw new Error(personaData.error || 'Failed to fetch persona');
      }

      const personaObj = personaData.data.persona || personaData.data;
      setPersona(personaObj);
      setEditedMission(personaObj.mission || '');
      setEditedDecisionLens(personaObj.decision_lens || '');
      setEditedScope(personaObj.scope || 'GLOBAL');
      setEditedRegionCode(personaObj.region_code || '');

      // Fetch active policy
      if (personaData.data.active_policy) {
        setActivePolicy(personaData.data.active_policy);
      } else {
        // Try to fetch policy directly
        const policyRes = await fetch(`/api/superadmin/controlplane/personas/${personaId}/policy`);
        const policyData = await policyRes.json();
        if (policyData.success) {
          setActivePolicy(policyData.data);
        }
      }

      // Fetch policy versions
      if (personaData.data.available_policies) {
        setPolicyVersions(personaData.data.available_policies);
      } else {
        const versionsRes = await fetch(`/api/superadmin/controlplane/personas/${personaId}/policy/version`);
        const versionsData = await versionsRes.json();
        if (versionsData.success) {
          setPolicyVersions(versionsData.data.versions || []);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load persona');
    } finally {
      setIsLoading(false);
    }
  }, [personaId]);

  useEffect(() => {
    loadPersonaData();
  }, [loadPersonaData]);

  // Track changes
  useEffect(() => {
    if (!persona) return;

    const changed =
      editedMission !== (persona.mission || '') ||
      editedDecisionLens !== (persona.decision_lens || '') ||
      editedScope !== (persona.scope || 'GLOBAL') ||
      editedRegionCode !== (persona.region_code || '');

    setHasChanges(changed);
  }, [persona, editedMission, editedDecisionLens, editedScope, editedRegionCode]);

  // =============================================================================
  // SAVE HANDLER
  // =============================================================================

  const handleSave = async () => {
    if (!persona || !hasChanges) return;

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/superadmin/controlplane/personas/${personaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mission: editedMission || null,
          decision_lens: editedDecisionLens || null,
          scope: editedScope,
          region_code: editedRegionCode || null,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save');
      }

      // Update local state
      setPersona(data.data);
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

  // =============================================================================
  // RENDER
  // =============================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading persona...</span>
        </div>
      </div>
    );
  }

  if (error && !persona) {
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

  if (!persona) return null;

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
          <span className="text-amber-400">Persona: {persona.name}</span>
        </nav>

        {/* Header */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-amber-400" />
              <div>
                <h1 className="text-lg font-medium text-white flex items-center gap-2">
                  {persona.name}
                  <span className="text-xs font-mono text-neutral-500">({persona.key})</span>
                </h1>
                <p className="text-sm text-neutral-400 mt-0.5">
                  Harden Mode - Edit persona configuration
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

        {/* S339: Runtime Readiness Panel */}
        <RuntimeReadinessPanel
          entityType="persona"
          entityId={personaId}
          className="mb-6"
        />

        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Persona Details */}
          <div className="col-span-7 space-y-6">
            {/* Context Info (Read-only) */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
              <h2 className="text-sm font-medium text-neutral-300 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-400" />
                Persona Context
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-500">Vertical</span>
                  <p className="text-white mt-0.5">{persona.vertical_name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-neutral-500">Sub-Vertical</span>
                  <p className="text-white mt-0.5">{persona.sub_vertical_name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-neutral-500">Status</span>
                  <p className="mt-0.5">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        persona.is_active
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {persona.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-neutral-500">Created</span>
                  <p className="text-white mt-0.5">
                    {new Date(persona.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Mission & Decision Lens (Editable) */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
              <h2 className="text-sm font-medium text-neutral-300 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                Mission & Lens
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Mission</label>
                  <textarea
                    value={editedMission}
                    onChange={(e) => setEditedMission(e.target.value)}
                    rows={3}
                    placeholder="What is this persona's purpose?"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Decision Lens</label>
                  <textarea
                    value={editedDecisionLens}
                    onChange={(e) => setEditedDecisionLens(e.target.value)}
                    rows={2}
                    placeholder="How should this persona evaluate decisions?"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Scope & Region (Editable) */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
              <h2 className="text-sm font-medium text-neutral-300 mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                Scope & Region
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Scope</label>
                  <select
                    value={editedScope}
                    onChange={(e) => setEditedScope(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="GLOBAL">GLOBAL</option>
                    <option value="REGIONAL">REGIONAL</option>
                    <option value="LOCAL">LOCAL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Region Code</label>
                  <input
                    type="text"
                    value={editedRegionCode}
                    onChange={(e) => setEditedRegionCode(e.target.value)}
                    placeholder={editedScope === 'REGIONAL' ? 'e.g., US, EU, APAC' : 'N/A for GLOBAL'}
                    disabled={editedScope === 'GLOBAL'}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
                  />
                </div>
              </div>
              {editedScope === 'REGIONAL' && !editedRegionCode && (
                <p className="mt-2 text-xs text-amber-400">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  Regional scope requires a region code
                </p>
              )}
            </div>
          </div>

          {/* Right Column - Policy Linkage */}
          <div className="col-span-5 space-y-6">
            {/* Active Policy */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
              <h2 className="text-sm font-medium text-neutral-300 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                Active Policy
              </h2>
              {activePolicy ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">v{activePolicy.policy_version}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          activePolicy.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : activePolicy.status === 'DRAFT'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-neutral-500/20 text-neutral-400'
                        }`}
                      >
                        {activePolicy.status}
                      </span>
                    </div>
                    <Link
                      href={`/superadmin/controlplane/harden/policy/${activePolicy.id}`}
                      className="text-xs text-amber-400 hover:text-amber-300"
                    >
                      Edit Policy
                    </Link>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded">
                      <span className="text-emerald-400 block mb-0.5">Allowed Intents</span>
                      <span className="text-white">{activePolicy.allowed_intents.length}</span>
                    </div>
                    <div className="p-2 bg-red-500/10 border border-red-500/20 rounded">
                      <span className="text-red-400 block mb-0.5">Forbidden</span>
                      <span className="text-white">{activePolicy.forbidden_outputs.length}</span>
                    </div>
                    <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded">
                      <span className="text-blue-400 block mb-0.5">Tools</span>
                      <span className="text-white">{activePolicy.allowed_tools.length}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FileText className="w-6 h-6 text-neutral-700 mx-auto mb-2" />
                  <p className="text-neutral-500 text-sm">No active policy</p>
                </div>
              )}
            </div>

            {/* Policy Version History */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-400" />
                  Version History
                </h2>
                <button
                  onClick={loadPersonaData}
                  className="p-1 text-neutral-500 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              {policyVersions.length > 0 ? (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {policyVersions.map((version) => (
                    <div
                      key={version.id}
                      className={`flex items-center justify-between px-2 py-1.5 rounded text-xs ${
                        version.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 border border-emerald-500/20'
                          : 'bg-neutral-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-white">v{version.policy_version}</span>
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
                      </div>
                      <span className="text-neutral-500 text-[10px]">
                        {new Date(version.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500 text-xs">No version history available</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
              <h2 className="text-sm font-medium text-neutral-300 mb-3">Quick Actions</h2>
              <div className="space-y-2">
                <Link
                  href={`/superadmin/controlplane/harden/sub-vertical/${persona.sub_vertical_id}`}
                  className="flex items-center gap-2 w-full px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded transition-colors"
                >
                  <Shield className="w-4 h-4 text-amber-400" />
                  Harden Parent Sub-Vertical
                </Link>
                <Link
                  href="/superadmin/controlplane"
                  className="flex items-center gap-2 w-full px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Control Plane
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
