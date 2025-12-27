'use client';

/**
 * Wizard Entry Hub
 * Phase 1A: Single explicit entry point for all wizard flows
 *
 * DECISION 1: What do you want to do?
 * - Create new vertical stack
 * - Extend existing vertical stack
 *
 * Supports direct navigation from Control Plane via URL params:
 * - ?extend=sub-vertical&vertical_id=xxx
 * - ?extend=persona&vertical_id=xxx&sub_vertical_id=xxx
 * - ?extend=policy&persona_id=xxx
 */

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  GitBranch,
  ArrowRight,
  Layers,
  Users,
  FileText,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';

// Types for fetched data
interface Vertical {
  id: string;
  key: string;
  name: string;
  sub_verticals?: SubVertical[];
}

interface SubVertical {
  id: string;
  key: string;
  name: string;
  personas?: Persona[];
}

interface Persona {
  id: string;
  key: string;
  name: string;
  scope: string;
  region_code?: string;
}

type ExtendTarget = 'sub-vertical' | 'persona' | 'policy';

function WizardEntryHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Step 1: Create vs Extend
  const [mode, setMode] = useState<'select' | 'create' | 'extend'>('select');

  // Step 2 (Extend): What are you extending?
  const [extendTarget, setExtendTarget] = useState<ExtendTarget | null>(null);

  // Step 3 (Extend): Select context
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [selectedVertical, setSelectedVertical] = useState<Vertical | null>(null);
  const [selectedSubVertical, setSelectedSubVertical] = useState<SubVertical | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Parse URL params for direct navigation from Control Plane
  useEffect(() => {
    if (initialized) return;

    const extendParam = searchParams.get('extend') as ExtendTarget | null;
    const verticalId = searchParams.get('vertical_id');
    const verticalName = searchParams.get('vertical_name');
    const subVerticalId = searchParams.get('sub_vertical_id');
    const subVerticalName = searchParams.get('sub_vertical_name');
    const personaId = searchParams.get('persona_id');
    const personaName = searchParams.get('persona_name');

    if (extendParam) {
      setMode('extend');
      setExtendTarget(extendParam);

      // Pre-populate context based on params
      if (verticalId && verticalName) {
        setSelectedVertical({ id: verticalId, key: '', name: decodeURIComponent(verticalName) });
      }
      if (subVerticalId && subVerticalName) {
        setSelectedSubVertical({ id: subVerticalId, key: '', name: decodeURIComponent(subVerticalName) });
      }
      if (personaId && personaName) {
        setSelectedPersona({ id: personaId, key: '', name: decodeURIComponent(personaName), scope: '' });
      }
    }

    setInitialized(true);
  }, [searchParams, initialized]);

  // Fetch verticals when entering extend mode (only if not pre-populated)
  useEffect(() => {
    if (mode === 'extend' && !selectedVertical) {
      fetchVerticals();
    }
  }, [mode, selectedVertical]);

  // Fetch sub-verticals when vertical selected
  useEffect(() => {
    if (selectedVertical && !selectedVertical.sub_verticals) {
      fetchSubVerticals(selectedVertical.id);
    }
  }, [selectedVertical]);

  // Fetch personas when sub-vertical selected
  useEffect(() => {
    if (selectedSubVertical && !selectedSubVertical.personas) {
      fetchPersonas(selectedSubVertical.id);
    }
  }, [selectedSubVertical]);

  async function fetchVerticals() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/superadmin/controlplane/verticals');
      const data = await response.json();
      if (data.success) {
        setVerticals(data.data || []);
      } else {
        setError(data.message || 'Failed to load verticals');
      }
    } catch {
      setError('Network error loading verticals');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchSubVerticals(verticalId: string) {
    try {
      const response = await fetch(`/api/superadmin/controlplane/verticals/${verticalId}/sub-verticals`);
      const data = await response.json();
      if (data.success) {
        setVerticals(prev => prev.map(v =>
          v.id === verticalId ? { ...v, sub_verticals: data.data || [] } : v
        ));
        if (selectedVertical?.id === verticalId) {
          setSelectedVertical(prev => prev ? { ...prev, sub_verticals: data.data || [] } : null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch sub-verticals:', err);
    }
  }

  async function fetchPersonas(subVerticalId: string) {
    try {
      const response = await fetch(`/api/superadmin/controlplane/sub-verticals/${subVerticalId}/personas`);
      const data = await response.json();
      if (data.success) {
        // Update the selected sub-vertical with personas
        setSelectedSubVertical(prev => prev ? { ...prev, personas: data.data || [] } : null);
      }
    } catch (err) {
      console.error('Failed to fetch personas:', err);
    }
  }

  function handleProceed() {
    if (mode === 'create') {
      router.push('/superadmin/controlplane/wizard/new');
      return;
    }

    if (mode === 'extend' && extendTarget && selectedVertical) {
      const params = new URLSearchParams();
      params.set('mode', 'extend');
      params.set('vertical_id', selectedVertical.id);
      params.set('vertical_name', selectedVertical.name);

      if (extendTarget === 'sub-vertical') {
        // Extend with new sub-vertical (starts at step 2)
        router.push(`/superadmin/controlplane/wizard/new?${params.toString()}`);
        return;
      }

      if (extendTarget === 'persona' && selectedSubVertical) {
        // Extend with new persona (starts at step 3)
        params.set('sub_vertical_id', selectedSubVertical.id);
        params.set('sub_vertical_name', selectedSubVertical.name);
        router.push(`/superadmin/controlplane/wizard/new?${params.toString()}`);
        return;
      }

      if (extendTarget === 'policy' && selectedSubVertical && selectedPersona) {
        // Extend with new policy version (starts at step 4)
        params.set('sub_vertical_id', selectedSubVertical.id);
        params.set('sub_vertical_name', selectedSubVertical.name);
        params.set('persona_id', selectedPersona.id);
        params.set('persona_name', selectedPersona.name);
        params.set('target', 'policy');
        router.push(`/superadmin/controlplane/wizard/new?${params.toString()}`);
        return;
      }
    }
  }

  function canProceed(): boolean {
    if (mode === 'create') return true;
    if (mode === 'extend') {
      if (!extendTarget || !selectedVertical) return false;
      if (extendTarget === 'sub-vertical') return true;
      if (extendTarget === 'persona') return !!selectedSubVertical;
      if (extendTarget === 'policy') return !!selectedSubVertical && !!selectedPersona;
    }
    return false;
  }

  function resetSelection() {
    setExtendTarget(null);
    setSelectedVertical(null);
    setSelectedSubVertical(null);
    setSelectedPersona(null);
  }

  // ==========================================================================
  // RENDER: Mode Selection (Step 1)
  // ==========================================================================
  if (mode === 'select') {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Control Plane Wizard</h1>
          <p className="text-gray-500 mt-2">What do you want to do?</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Create New */}
          <button
            onClick={() => setMode('create')}
            className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all text-left"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
              <Plus className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Create New Vertical Stack</h3>
            <p className="text-sm text-gray-500">
              Start from scratch with a new vertical, sub-vertical, persona, and policy.
            </p>
          </button>

          {/* Extend Existing */}
          <button
            onClick={() => setMode('extend')}
            className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-violet-500 hover:shadow-lg transition-all text-left"
          >
            <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-violet-500 transition-colors">
              <GitBranch className="w-6 h-6 text-violet-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Extend Existing Stack</h3>
            <p className="text-sm text-gray-500">
              Add a sub-vertical, persona, or policy to an existing configuration.
            </p>
          </button>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/superadmin/controlplane"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Back to Control Plane
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: Create Mode (Direct to wizard/new)
  // ==========================================================================
  if (mode === 'create') {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Create New Vertical Stack</h1>
          <p className="text-gray-500 mt-2">You'll create a complete stack from scratch.</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-medium text-blue-900 mb-3">What will be created:</h3>
          <ol className="space-y-2 text-sm text-blue-800">
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-medium">1</span>
              Vertical Identity
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-medium">2</span>
              Sub-Vertical Sales Motion
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-medium">3</span>
              Persona & Region Scope
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-medium">4</span>
              Persona Policy
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-medium">5</span>
              Runtime Binding
            </li>
          </ol>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setMode('select')}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            Back
          </button>
          <button
            onClick={handleProceed}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Start Creating
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: Extend Mode
  // ==========================================================================
  return (
    <div className="max-w-3xl mx-auto py-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Extend Existing Stack</h1>
        <p className="text-gray-500 mt-2">
          {!extendTarget && 'What do you want to add?'}
          {extendTarget === 'sub-vertical' && 'Select a vertical to extend'}
          {extendTarget === 'persona' && 'Select where to add the persona'}
          {extendTarget === 'policy' && 'Select the persona to add a policy version'}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Step 2: Extend Target Selection */}
      {!extendTarget && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setExtendTarget('sub-vertical')}
            className="group p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-500 hover:shadow-lg transition-all text-left"
          >
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-emerald-500 transition-colors">
              <Layers className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Add Sub-Vertical</h3>
            <p className="text-xs text-gray-500">New sales motion within an existing vertical</p>
          </button>

          <button
            onClick={() => setExtendTarget('persona')}
            className="group p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-violet-500 hover:shadow-lg transition-all text-left"
          >
            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-violet-500 transition-colors">
              <Users className="w-5 h-5 text-violet-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Add Persona</h3>
            <p className="text-xs text-gray-500">New persona for an existing sub-vertical</p>
          </button>

          <button
            onClick={() => setExtendTarget('policy')}
            className="group p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-amber-500 hover:shadow-lg transition-all text-left"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-amber-500 transition-colors">
              <FileText className="w-5 h-5 text-amber-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Add Policy Version</h3>
            <p className="text-xs text-gray-500">New policy version for an existing persona</p>
          </button>
        </div>
      )}

      {/* Step 3: Context Selection */}
      {extendTarget && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <button onClick={resetSelection} className="hover:text-gray-700">
              {extendTarget === 'sub-vertical' && 'Add Sub-Vertical'}
              {extendTarget === 'persona' && 'Add Persona'}
              {extendTarget === 'policy' && 'Add Policy Version'}
            </button>
            {selectedVertical && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900">{selectedVertical.name}</span>
              </>
            )}
            {selectedSubVertical && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900">{selectedSubVertical.name}</span>
              </>
            )}
            {selectedPersona && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900">{selectedPersona.name}</span>
              </>
            )}
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          )}

          {/* Vertical Selection */}
          {!isLoading && !selectedVertical && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Select Vertical</h3>
              {verticals.length === 0 ? (
                <p className="text-gray-500 text-sm">No verticals found. Create one first.</p>
              ) : (
                <div className="space-y-2">
                  {verticals.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVertical(v)}
                      className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{v.name}</div>
                      <div className="text-xs text-gray-500 font-mono">{v.key}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sub-Vertical Selection (for persona & policy) */}
          {!isLoading && selectedVertical && (extendTarget === 'persona' || extendTarget === 'policy') && !selectedSubVertical && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Select Sub-Vertical</h3>
              {!selectedVertical.sub_verticals ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                </div>
              ) : selectedVertical.sub_verticals.length === 0 ? (
                <p className="text-gray-500 text-sm">No sub-verticals found. Create one first.</p>
              ) : (
                <div className="space-y-2">
                  {selectedVertical.sub_verticals.map(sv => (
                    <button
                      key={sv.id}
                      onClick={() => setSelectedSubVertical(sv)}
                      className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{sv.name}</div>
                      <div className="text-xs text-gray-500 font-mono">{sv.key}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Persona Selection (for policy) */}
          {!isLoading && selectedSubVertical && extendTarget === 'policy' && !selectedPersona && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Select Persona</h3>
              {!selectedSubVertical.personas ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                </div>
              ) : selectedSubVertical.personas.length === 0 ? (
                <p className="text-gray-500 text-sm">No personas found. Create one first.</p>
              ) : (
                <div className="space-y-2">
                  {selectedSubVertical.personas.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPersona(p)}
                      className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-500">
                        <span className="font-mono">{p.key}</span>
                        <span className="mx-2">|</span>
                        <span>{p.scope}</span>
                        {p.region_code && <span className="ml-1">({p.region_code})</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Summary for Sub-Vertical */}
          {selectedVertical && extendTarget === 'sub-vertical' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <h4 className="font-medium text-emerald-900 mb-2">Ready to add Sub-Vertical</h4>
              <p className="text-sm text-emerald-700">
                You'll create a new sub-vertical under <strong>{selectedVertical.name}</strong>.
              </p>
            </div>
          )}

          {/* Summary for Persona */}
          {selectedSubVertical && extendTarget === 'persona' && (
            <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
              <h4 className="font-medium text-violet-900 mb-2">Ready to add Persona</h4>
              <p className="text-sm text-violet-700">
                You'll create a new persona under <strong>{selectedSubVertical.name}</strong>.
              </p>
            </div>
          )}

          {/* Summary for Policy */}
          {selectedPersona && extendTarget === 'policy' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-medium text-amber-900 mb-2">Ready to add Policy Version</h4>
              <p className="text-sm text-amber-700">
                You'll create a new policy version for <strong>{selectedPersona.name}</strong>.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={() => {
            if (extendTarget) {
              resetSelection();
            } else {
              setMode('select');
            }
          }}
          className="px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          Back
        </button>
        <button
          onClick={handleProceed}
          disabled={!canProceed()}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg ${
            canProceed()
              ? 'bg-violet-600 text-white hover:bg-violet-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue to Wizard
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Wrapper with Suspense for useSearchParams
export default function WizardEntryHub() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto py-12 text-center">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto" />
        <p className="text-gray-500 mt-2">Loading wizard...</p>
      </div>
    }>
      <WizardEntryHubContent />
    </Suspense>
  );
}
