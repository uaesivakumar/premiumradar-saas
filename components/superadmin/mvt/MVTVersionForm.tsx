'use client';

/**
 * MVT Version Form Component (S256-F4)
 *
 * Form for creating new MVT versions with validation.
 * Validates buyer_role, decision_owner, allowed_signals, kill_rules, seed_scenarios.
 */

import { useState, useEffect } from 'react';

interface Signal {
  signal_key: string;
  entity_type: string;
  justification: string;
}

interface KillRule {
  rule: string;
  action: string;
  reason: string;
}

interface SeedScenario {
  scenario_id: string;
  entry_intent: string;
}

interface MVTVersion {
  buyer_role: string;
  decision_owner: string;
  allowed_signals: Signal[];
  kill_rules: KillRule[];
  seed_scenarios: {
    golden: SeedScenario[];
    kill: SeedScenario[];
  };
}

interface MVTVersionFormProps {
  subVerticalId: string;
  primaryEntityType: string;
  onClose: () => void;
  onSuccess: () => void;
  baseVersion?: MVTVersion | null;
}

export function MVTVersionForm({
  subVerticalId,
  primaryEntityType,
  onClose,
  onSuccess,
  baseVersion,
}: MVTVersionFormProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Form state
  const [buyerRole, setBuyerRole] = useState(baseVersion?.buyer_role || '');
  const [decisionOwner, setDecisionOwner] = useState(baseVersion?.decision_owner || '');
  const [signals, setSignals] = useState<Signal[]>(
    baseVersion?.allowed_signals || [
      { signal_key: '', entity_type: primaryEntityType, justification: '' },
    ]
  );
  const [killRules, setKillRules] = useState<KillRule[]>(
    baseVersion?.kill_rules || [
      { rule: '', action: 'BLOCK', reason: '' },
      { rule: '', action: 'BLOCK', reason: '' },
    ]
  );
  const [goldenScenarios, setGoldenScenarios] = useState<SeedScenario[]>(
    baseVersion?.seed_scenarios?.golden || [
      { scenario_id: '', entry_intent: '' },
      { scenario_id: '', entry_intent: '' },
    ]
  );
  const [killScenarios, setKillScenarios] = useState<SeedScenario[]>(
    baseVersion?.seed_scenarios?.kill || [
      { scenario_id: '', entry_intent: '' },
      { scenario_id: '', entry_intent: '' },
    ]
  );

  // Helpers
  const addSignal = () => {
    setSignals([...signals, { signal_key: '', entity_type: primaryEntityType, justification: '' }]);
  };

  const removeSignal = (index: number) => {
    if (signals.length > 1) {
      setSignals(signals.filter((_, i) => i !== index));
    }
  };

  const updateSignal = (index: number, field: keyof Signal, value: string) => {
    const updated = [...signals];
    updated[index] = { ...updated[index], [field]: value };
    setSignals(updated);
  };

  const addKillRule = () => {
    setKillRules([...killRules, { rule: '', action: 'BLOCK', reason: '' }]);
  };

  const removeKillRule = (index: number) => {
    if (killRules.length > 2) {
      setKillRules(killRules.filter((_, i) => i !== index));
    }
  };

  const updateKillRule = (index: number, field: keyof KillRule, value: string) => {
    const updated = [...killRules];
    updated[index] = { ...updated[index], [field]: value };
    setKillRules(updated);
  };

  const addGoldenScenario = () => {
    setGoldenScenarios([...goldenScenarios, { scenario_id: '', entry_intent: '' }]);
  };

  const addKillScenario = () => {
    setKillScenarios([...killScenarios, { scenario_id: '', entry_intent: '' }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    try {
      const response = await fetch(
        `/api/superadmin/controlplane/sub-verticals/${subVerticalId}/mvt-versions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            buyer_role: buyerRole,
            decision_owner: decisionOwner,
            allowed_signals: signals.filter(s => s.signal_key),
            kill_rules: killRules.filter(r => r.rule),
            seed_scenarios: {
              golden: goldenScenarios.filter(s => s.entry_intent),
              kill: killScenarios.filter(s => s.entry_intent),
            },
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        onSuccess();
      } else {
        setErrors(data.mvt_errors || [data.message || 'Failed to create version']);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setErrors(['Failed to create MVT version']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Create New MVT Version
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Errors */}
              {errors.length > 0 && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="text-sm text-red-700">
                    <ul className="list-disc list-inside space-y-1">
                      {errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* ICP Truth Triad */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded mr-2">Required</span>
                  ICP Truth Triad
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Buyer Role</label>
                    <input
                      type="text"
                      value={buyerRole}
                      onChange={(e) => setBuyerRole(e.target.value)}
                      placeholder="e.g., HR Director"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Decision Owner</label>
                    <input
                      type="text"
                      value={decisionOwner}
                      onChange={(e) => setDecisionOwner(e.target.value)}
                      placeholder="e.g., CEO"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Allowed Signals */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center">
                    <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded mr-2">Min 1</span>
                    Allowed Signals
                  </h4>
                  <button
                    type="button"
                    onClick={addSignal}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    + Add Signal
                  </button>
                </div>
                <div className="space-y-3">
                  {signals.map((signal, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <input
                        type="text"
                        value={signal.signal_key}
                        onChange={(e) => updateSignal(index, 'signal_key', e.target.value)}
                        placeholder="signal_key"
                        className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      <input
                        type="text"
                        value={signal.entity_type}
                        disabled
                        className="w-24 border border-gray-200 rounded-md shadow-sm py-2 px-3 bg-gray-50 sm:text-sm text-gray-500"
                      />
                      <input
                        type="text"
                        value={signal.justification}
                        onChange={(e) => updateSignal(index, 'justification', e.target.value)}
                        placeholder="Justification"
                        className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      {signals.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSignal(index)}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Kill Rules */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center">
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded mr-2">Min 2 + 1 Compliance</span>
                    Kill Rules
                  </h4>
                  <button
                    type="button"
                    onClick={addKillRule}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    + Add Rule
                  </button>
                </div>
                <div className="space-y-3">
                  {killRules.map((rule, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <input
                        type="text"
                        value={rule.rule}
                        onChange={(e) => updateKillRule(index, 'rule', e.target.value)}
                        placeholder="rule_key"
                        className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      <select
                        value={rule.action}
                        onChange={(e) => updateKillRule(index, 'action', e.target.value)}
                        className="w-28 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="BLOCK">BLOCK</option>
                        <option value="WARN">WARN</option>
                        <option value="REVIEW">REVIEW</option>
                      </select>
                      <input
                        type="text"
                        value={rule.reason}
                        onChange={(e) => updateKillRule(index, 'reason', e.target.value)}
                        placeholder="Reason (use 'compliance' or 'regulatory' for compliance rule)"
                        className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      {killRules.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeKillRule(index)}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Seed Scenarios */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded mr-2">Min 2 each</span>
                  Seed Scenarios
                </h4>

                {/* Golden */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-green-700 font-medium">Golden Scenarios</span>
                    <button
                      type="button"
                      onClick={addGoldenScenario}
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {goldenScenarios.map((scenario, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={scenario.scenario_id}
                          onChange={(e) => {
                            const updated = [...goldenScenarios];
                            updated[index] = { ...updated[index], scenario_id: e.target.value };
                            setGoldenScenarios(updated);
                          }}
                          placeholder="scenario_id"
                          className="w-32 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        <input
                          type="text"
                          value={scenario.entry_intent}
                          onChange={(e) => {
                            const updated = [...goldenScenarios];
                            updated[index] = { ...updated[index], entry_intent: e.target.value };
                            setGoldenScenarios(updated);
                          }}
                          placeholder="Entry intent"
                          className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Kill */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-red-700 font-medium">Kill Scenarios</span>
                    <button
                      type="button"
                      onClick={addKillScenario}
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {killScenarios.map((scenario, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={scenario.scenario_id}
                          onChange={(e) => {
                            const updated = [...killScenarios];
                            updated[index] = { ...updated[index], scenario_id: e.target.value };
                            setKillScenarios(updated);
                          }}
                          placeholder="scenario_id"
                          className="w-32 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        <input
                          type="text"
                          value={scenario.entry_intent}
                          onChange={(e) => {
                            const updated = [...killScenarios];
                            updated[index] = { ...updated[index], entry_intent: e.target.value };
                            setKillScenarios(updated);
                          }}
                          placeholder="Entry intent"
                          className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Version'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
