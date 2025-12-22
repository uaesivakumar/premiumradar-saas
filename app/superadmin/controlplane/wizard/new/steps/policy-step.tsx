'use client';

/**
 * Step 4: Persona Policy (Lifecycle-aware)
 *
 * Layout: Two columns
 * - Left: Policy fields editor
 * - Right: Lifecycle panel (status badge, Save Draft/Stage/Activate buttons)
 *
 * Policy Status Lifecycle: DRAFT → STAGED → ACTIVE
 * Wizard cannot proceed to Step 5 unless policy status = ACTIVE
 */

import { useState, useCallback, useEffect } from 'react';
import { useWizard } from '../wizard-context';

interface PolicyData {
  allowed_intents: string[];
  allowed_tools: string[];
  forbidden_outputs: string[];
  evidence_scope: Record<string, unknown>;
  escalation_rules: Record<string, unknown>;
}

export function PolicyStep() {
  const { wizardState, updateWizardState, markStepComplete } = useWizard();

  const [policyData, setPolicyData] = useState<PolicyData>({
    allowed_intents: [],
    allowed_tools: [],
    forbidden_outputs: [],
    evidence_scope: {},
    escalation_rules: {},
  });

  const [newIntent, setNewIntent] = useState('');
  const [newTool, setNewTool] = useState('');
  const [newForbidden, setNewForbidden] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isStaging, setIsStaging] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const isActive = wizardState.policy_status === 'ACTIVE';

  // Fetch current policy on mount
  useEffect(() => {
    async function fetchPolicy() {
      if (!wizardState.persona_id) return;
      try {
        const response = await fetch(
          `/api/superadmin/controlplane/personas/${wizardState.persona_id}/policy`
        );
        const data = await response.json();
        if (data.success) {
          setPolicyData({
            allowed_intents: data.data.allowed_intents || [],
            allowed_tools: data.data.allowed_tools || [],
            forbidden_outputs: data.data.forbidden_outputs || [],
            evidence_scope: data.data.evidence_scope || {},
            escalation_rules: data.data.escalation_rules || {},
          });
        }
      } catch (error) {
        console.error('Failed to fetch policy:', error);
      }
    }
    fetchPolicy();
  }, [wizardState.persona_id]);

  const handleSaveDraft = useCallback(async () => {
    if (!wizardState.persona_id) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/superadmin/controlplane/personas/${wizardState.persona_id}/policy`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...policyData,
            status: 'DRAFT',
          }),
        }
      );

      const data = await response.json();
      if (!data.success) {
        setError(data.message || 'Failed to save draft');
        return;
      }

      setLastSaved(new Date());
      updateWizardState({
        policy_version: data.data.policy_version,
      });
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [wizardState.persona_id, policyData, updateWizardState]);

  const handleStage = useCallback(async () => {
    if (!wizardState.persona_id) return;

    setIsStaging(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/superadmin/controlplane/personas/${wizardState.persona_id}/policy/stage`,
        { method: 'POST' }
      );

      const data = await response.json();
      if (!data.success) {
        setError(data.message || 'Failed to stage policy');
        return;
      }

      updateWizardState({
        policy_status: 'STAGED',
        policy_version: data.policy.policy_version,
      });
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsStaging(false);
    }
  }, [wizardState.persona_id, updateWizardState]);

  const handleActivate = useCallback(async () => {
    if (!wizardState.persona_id) return;

    setIsActivating(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/superadmin/controlplane/personas/${wizardState.persona_id}/policy/activate`,
        { method: 'POST' }
      );

      const data = await response.json();
      if (!data.success) {
        setError(data.message || 'Failed to activate policy');
        return;
      }

      updateWizardState({
        policy_status: 'ACTIVE',
        policy_version: data.policy.policy_version,
        policy_activated_at: data.policy.activated_at,
      });
      markStepComplete(4);
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsActivating(false);
    }
  }, [wizardState.persona_id, updateWizardState, markStepComplete]);

  const addTag = useCallback(
    (field: 'allowed_intents' | 'allowed_tools' | 'forbidden_outputs', value: string) => {
      if (!value.trim()) return;
      setPolicyData((prev) => ({
        ...prev,
        [field]: [...prev[field], value.trim()],
      }));
    },
    []
  );

  const removeTag = useCallback(
    (field: 'allowed_intents' | 'allowed_tools' | 'forbidden_outputs', index: number) => {
      setPolicyData((prev) => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index),
      }));
    },
    []
  );

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'STAGED':
        return 'bg-blue-100 text-blue-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isActive) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Policy Activated</h2>
          <p className="text-sm text-gray-500 mt-1">
            This step is complete. Proceed to bind a workspace.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-green-600 text-lg">✓</span>
            <span className="font-medium text-green-900">Policy is ACTIVE</span>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Version</dt>
              <dd className="text-gray-900">v{wizardState.policy_version}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Activated</dt>
              <dd className="text-gray-900">
                {wizardState.policy_activated_at
                  ? new Date(wizardState.policy_activated_at).toLocaleString()
                  : 'Just now'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Persona Policy</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure policy rules for {wizardState.persona_name || 'this persona'}.
          Policy must be ACTIVE to proceed.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Policy Fields */}
        <div className="col-span-2 space-y-4">
          {/* Allowed Intents */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allowed Intents
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newIntent}
                onChange={(e) => setNewIntent(e.target.value)}
                placeholder="Add intent..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag('allowed_intents', newIntent);
                    setNewIntent('');
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  addTag('allowed_intents', newIntent);
                  setNewIntent('');
                }}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {policyData.allowed_intents.map((intent, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {intent}
                  <button
                    onClick={() => removeTag('allowed_intents', i)}
                    className="text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              ))}
              {policyData.allowed_intents.length === 0 && (
                <span className="text-gray-400 text-sm italic">No intents configured</span>
              )}
            </div>
          </div>

          {/* Allowed Tools */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allowed Tools
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTool}
                onChange={(e) => setNewTool(e.target.value)}
                placeholder="Add tool..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag('allowed_tools', newTool);
                    setNewTool('');
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  addTag('allowed_tools', newTool);
                  setNewTool('');
                }}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {policyData.allowed_tools.map((tool, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {tool}
                  <button
                    onClick={() => removeTag('allowed_tools', i)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
              {policyData.allowed_tools.length === 0 && (
                <span className="text-gray-400 text-sm italic">No tools configured</span>
              )}
            </div>
          </div>

          {/* Forbidden Outputs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Forbidden Outputs
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newForbidden}
                onChange={(e) => setNewForbidden(e.target.value)}
                placeholder="Add forbidden pattern..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag('forbidden_outputs', newForbidden);
                    setNewForbidden('');
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  addTag('forbidden_outputs', newForbidden);
                  setNewForbidden('');
                }}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {policyData.forbidden_outputs.map((output, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                >
                  {output}
                  <button
                    onClick={() => removeTag('forbidden_outputs', i)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </span>
              ))}
              {policyData.forbidden_outputs.length === 0 && (
                <span className="text-gray-400 text-sm italic">No forbidden patterns</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Lifecycle Panel */}
        <div className="col-span-1">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Policy Status</p>
              <span
                className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                  wizardState.policy_status
                )}`}
              >
                {wizardState.policy_status || 'DRAFT'}
              </span>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Version</p>
              <p className="text-gray-900">v{wizardState.policy_version || 1}</p>
            </div>

            {lastSaved && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Last Saved</p>
                <p className="text-gray-600 text-sm">{lastSaved.toLocaleTimeString()}</p>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-gray-200">
              <button
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="w-full px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>

              {wizardState.policy_status === 'DRAFT' && (
                <button
                  onClick={handleStage}
                  disabled={isStaging}
                  className="w-full px-3 py-2 text-sm font-medium bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                >
                  {isStaging ? 'Staging...' : 'Stage for Review'}
                </button>
              )}

              {(wizardState.policy_status === 'DRAFT' ||
                wizardState.policy_status === 'STAGED') && (
                <button
                  onClick={handleActivate}
                  disabled={isActivating}
                  className="w-full px-3 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isActivating ? 'Activating...' : 'Activate Policy'}
                </button>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Policy must be ACTIVE to proceed to the next step.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
