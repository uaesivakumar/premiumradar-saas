'use client';

/**
 * Step 4: Persona Policy (Zero-Manual-Ops v3.1)
 *
 * Layout: Two columns
 * - Left: Policy fields editor
 * - Right: Status panel (read-only status, auto-activation indicator)
 *
 * v3.1 CHANGES:
 * - REMOVED: "Activate Policy" button
 * - REMOVED: "Stage for Review" button
 * - ADDED: Auto-activation on save
 * - Policy activation is AUTO-MANAGED by system
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
  const [error, setError] = useState<string | null>(null);

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

  /**
   * v3.1: Save and Auto-Activate Policy
   * Single action that saves policy AND activates it automatically.
   * No manual activation step required.
   */
  const handleSaveAndActivate = useCallback(async () => {
    if (!wizardState.persona_id) return;

    setIsSaving(true);
    setError(null);

    try {
      // Step 1: Save the policy
      const saveResponse = await fetch(
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

      const saveData = await saveResponse.json();
      if (!saveData.success) {
        setError(saveData.message || 'Failed to save policy');
        return;
      }

      // Step 2: Auto-activate the policy (system-managed)
      const activateResponse = await fetch(
        `/api/superadmin/controlplane/personas/${wizardState.persona_id}/policy/activate`,
        { method: 'POST' }
      );

      const activateData = await activateResponse.json();
      if (!activateData.success) {
        setError(activateData.message || 'Failed to auto-activate policy');
        return;
      }

      // Success - update wizard state
      updateWizardState({
        policy_status: 'ACTIVE',
        policy_version: activateData.policy.policy_version,
        policy_activated_at: activateData.policy.activated_at,
      });
      markStepComplete(4);
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [wizardState.persona_id, policyData, updateWizardState, markStepComplete]);

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

  if (isActive) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Policy Complete</h2>
          <p className="text-sm text-gray-500 mt-1">
            Policy has been saved and auto-activated. Proceed to verification.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-green-600 text-lg">✓</span>
            <span className="font-medium text-green-900">Policy Auto-Activated</span>
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
          <p className="text-xs text-green-700 mt-3">
            Activation: Auto-managed by system
          </p>
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

        {/* Right: Status Panel (Read-Only) */}
        <div className="col-span-1">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
            {/* v3.1: Auto-managed indicator */}
            <div className="flex items-center gap-2 text-emerald-600 text-sm">
              <span>✓</span>
              <span className="font-medium">Activation: Auto-managed</span>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Version</p>
              <p className="text-gray-900">v{wizardState.policy_version || 1}</p>
            </div>

            <div className="pt-2 border-t border-gray-200">
              {/* v3.1: Single save action - activation is automatic */}
              <button
                onClick={handleSaveAndActivate}
                disabled={isSaving}
                className="w-full px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving & Activating...' : 'Save Policy'}
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Policy will be auto-activated on save
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
