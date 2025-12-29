'use client';

/**
 * Step 4: Persona Policy (Governance Hardening v1.0)
 *
 * GOVERNANCE ENFORCEMENT:
 * - Policy Lifecycle: DRAFT → STAGED → ACTIVE → DEPRECATED
 * - Empty Policy Block: Min 1 intent + Min 1 tool required before staging
 * - No direct DRAFT → ACTIVE (POL-001)
 *
 * Layout: Two columns
 * - Left: Policy fields editor
 * - Right: Status panel with lifecycle actions
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

type PolicyStatus = 'DRAFT' | 'STAGED' | 'ACTIVE' | 'DEPRECATED';

// ============================================
// AVAILABLE OPTIONS (from UPR-OS capabilities)
// ============================================

// Tools available in UPR-OS
const AVAILABLE_TOOLS = [
  { value: 'qtle_score', label: 'Q/T/L/E Scoring', description: 'Compute qualification, timing, leverage, engagement scores' },
  { value: 'pattern_match', label: 'Pattern Matching', description: 'Match company signals against known patterns' },
  { value: 'search_companies', label: 'Search Companies', description: 'Search company database by criteria' },
  { value: 'enrich_lead', label: 'Enrich Lead', description: 'Enrich lead data from external sources' },
  { value: 'rank_opportunities', label: 'Rank Opportunities', description: 'Rank opportunities by likelihood' },
  { value: 'generate_outreach', label: 'Generate Outreach', description: 'Generate personalized outreach messages' },
  { value: 'analyze_signals', label: 'Analyze Signals', description: 'Analyze business signals for intent' },
  { value: 'lookup_contacts', label: 'Lookup Contacts', description: 'Find decision-maker contacts' },
  { value: 'check_compliance', label: 'Check Compliance', description: 'Verify regulatory compliance status' },
  { value: 'calculate_risk', label: 'Calculate Risk', description: 'Calculate credit/deal risk score' },
  { value: 'fetch_financials', label: 'Fetch Financials', description: 'Retrieve company financial data' },
  { value: 'verify_documents', label: 'Verify Documents', description: 'Verify submitted documents' },
];

// Intents that SIVA can handle
const AVAILABLE_INTENTS = [
  { value: 'score_lead', label: 'Score Lead', description: 'Score a lead for qualification' },
  { value: 'rank_companies', label: 'Rank Companies', description: 'Rank target companies' },
  { value: 'find_prospects', label: 'Find Prospects', description: 'Discover new prospects' },
  { value: 'analyze_opportunity', label: 'Analyze Opportunity', description: 'Deep analysis of an opportunity' },
  { value: 'generate_outreach_message', label: 'Generate Outreach', description: 'Create personalized outreach' },
  { value: 'recommend_next_action', label: 'Recommend Action', description: 'Suggest next best action' },
  { value: 'evaluate_company_for_wc', label: 'Evaluate for WC', description: 'Evaluate company for working capital' },
  { value: 'collect_required_documents', label: 'Collect Documents', description: 'Identify required documents' },
  { value: 'ask_qualification_questions', label: 'Qualify Lead', description: 'Ask qualification questions' },
  { value: 'assess_credit_risk', label: 'Assess Credit Risk', description: 'Evaluate credit risk' },
  { value: 'summarize_company', label: 'Summarize Company', description: 'Generate company summary' },
  { value: 'compare_opportunities', label: 'Compare Opportunities', description: 'Compare multiple opportunities' },
];

// Common forbidden outputs
const COMMON_FORBIDDEN_OUTPUTS = [
  { value: 'pii_data', label: 'PII Data', description: 'Personal identifiable information' },
  { value: 'competitor_names', label: 'Competitor Names', description: 'Names of competitor companies' },
  { value: 'guarantee_approval', label: 'Guarantee Approval', description: 'Promise of approval' },
  { value: 'quote_interest_rates', label: 'Quote Rates', description: 'Specific interest rate quotes' },
  { value: 'commit_terms_or_limits', label: 'Commit Terms', description: 'Binding terms or limits' },
  { value: 'provide_legal_advice', label: 'Legal Advice', description: 'Legal recommendations' },
  { value: 'disclose_internal_scoring', label: 'Internal Scoring', description: 'Internal scoring logic' },
  { value: 'share_other_client_data', label: 'Other Client Data', description: 'Other clients information' },
  { value: 'predict_stock_price', label: 'Stock Predictions', description: 'Stock price predictions' },
  { value: 'make_investment_advice', label: 'Investment Advice', description: 'Investment recommendations' },
];

const STATUS_CONFIG: Record<PolicyStatus, { color: string; bg: string; label: string }> = {
  DRAFT: { color: 'text-yellow-800', bg: 'bg-yellow-100', label: 'Draft' },
  STAGED: { color: 'text-blue-800', bg: 'bg-blue-100', label: 'Staged' },
  ACTIVE: { color: 'text-green-800', bg: 'bg-green-100', label: 'Active' },
  DEPRECATED: { color: 'text-gray-800', bg: 'bg-gray-100', label: 'Deprecated' },
};

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
  const [customIntent, setCustomIntent] = useState('');
  const [newTool, setNewTool] = useState('');
  const [newForbidden, setNewForbidden] = useState('');
  const [customForbidden, setCustomForbidden] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isStaging, setIsStaging] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStatus = (wizardState.policy_status as PolicyStatus) || 'DRAFT';
  const isActive = currentStatus === 'ACTIVE';
  const isDeprecated = currentStatus === 'DEPRECATED';
  const isStaged = currentStatus === 'STAGED';

  // GOVERNANCE: Empty policy detection
  const hasMinimumRequirements = policyData.allowed_intents.length >= 1 && policyData.allowed_tools.length >= 1;
  const canStage = currentStatus === 'DRAFT' && hasMinimumRequirements;
  const canActivate = currentStatus === 'STAGED';

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
          // Update status from server
          if (data.data.status) {
            updateWizardState({ policy_status: data.data.status });
          }
        }
      } catch (error) {
        console.error('Failed to fetch policy:', error);
      }
    }
    fetchPolicy();
  }, [wizardState.persona_id, updateWizardState]);

  /**
   * Save policy (keeps in DRAFT status)
   */
  const handleSave = useCallback(async () => {
    if (!wizardState.persona_id) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/superadmin/controlplane/personas/${wizardState.persona_id}/policy`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(policyData),
        }
      );

      const data = await response.json();
      if (!data.success) {
        setError(data.message || 'Failed to save policy');
        return;
      }

      // Saved successfully
      updateWizardState({
        policy_version: data.data.policy_version,
      });
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [wizardState.persona_id, policyData, updateWizardState]);

  /**
   * Stage policy for review (DRAFT → STAGED)
   * Enforces EMP-001, EMP-002 on backend
   */
  const handleStage = useCallback(async () => {
    if (!wizardState.persona_id || !canStage) return;

    setIsStaging(true);
    setError(null);

    try {
      // First save current changes
      await fetch(
        `/api/superadmin/controlplane/personas/${wizardState.persona_id}/policy`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(policyData),
        }
      );

      // Then stage
      const response = await fetch(
        `/api/superadmin/controlplane/personas/${wizardState.persona_id}/policy/stage`,
        { method: 'POST' }
      );

      const data = await response.json();
      if (!data.success) {
        // Handle governance errors
        if (data.code === 'EMP-001') {
          setError('Add at least one allowed intent before staging.');
        } else if (data.code === 'EMP-002') {
          setError('Add at least one allowed tool before staging.');
        } else {
          setError(data.message || 'Failed to stage policy');
        }
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
  }, [wizardState.persona_id, policyData, canStage, updateWizardState]);

  /**
   * Activate policy (STAGED → ACTIVE)
   * Enforces POL-001 on backend (must be STAGED)
   */
  const handleActivate = useCallback(async () => {
    if (!wizardState.persona_id || !canActivate) return;

    setIsActivating(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/superadmin/controlplane/personas/${wizardState.persona_id}/policy/activate`,
        { method: 'POST' }
      );

      const data = await response.json();
      if (!data.success) {
        // Handle governance errors
        if (data.code === 'POL-001') {
          setError('Policy must be staged before activation.');
        } else {
          setError(data.message || 'Failed to activate policy');
        }
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
  }, [wizardState.persona_id, canActivate, updateWizardState, markStepComplete]);

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

  // ACTIVE or DEPRECATED - show read-only summary
  if (isActive || isDeprecated) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Policy {isActive ? 'Active' : 'Deprecated'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isActive
              ? 'Policy is active. Proceed to verification.'
              : 'This policy has been deprecated.'}
          </p>
        </div>

        <div className={`${isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4`}>
          <div className="flex items-center gap-2 mb-3">
            <span className={isActive ? 'text-green-600 text-lg' : 'text-gray-600 text-lg'}>
              {isActive ? '✓' : '○'}
            </span>
            <span className={`font-medium ${isActive ? 'text-green-900' : 'text-gray-900'}`}>
              Policy {currentStatus}
            </span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${STATUS_CONFIG[currentStatus].bg} ${STATUS_CONFIG[currentStatus].color}`}>
              {STATUS_CONFIG[currentStatus].label}
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Version</dt>
              <dd className="text-gray-900">v{wizardState.policy_version}</dd>
            </div>
            <div>
              <dt className="text-gray-500">
                {isActive ? 'Activated' : 'Deprecated'}
              </dt>
              <dd className="text-gray-900">
                {wizardState.policy_activated_at
                  ? new Date(wizardState.policy_activated_at).toLocaleString()
                  : 'Just now'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Intents</dt>
              <dd className="text-gray-900">{policyData.allowed_intents.length}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Tools</dt>
              <dd className="text-gray-900">{policyData.allowed_tools.length}</dd>
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
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Governance: Empty policy warning */}
      {!hasMinimumRequirements && currentStatus === 'DRAFT' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-amber-600">⚠</span>
            <div>
              <p className="font-medium text-amber-800">Minimum Requirements</p>
              <ul className="mt-1 text-amber-700 space-y-1">
                {policyData.allowed_intents.length === 0 && (
                  <li>• Add at least 1 allowed intent (EMP-001)</li>
                )}
                {policyData.allowed_tools.length === 0 && (
                  <li>• Add at least 1 allowed tool (EMP-002)</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Policy Fields */}
        <div className="col-span-2 space-y-4">
          {/* Allowed Intents */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allowed Intents <span className="text-red-500">*</span>
              <span className="ml-2 text-xs font-normal text-gray-500">
                ({policyData.allowed_intents.length} added)
              </span>
            </label>
            {/* Predefined intents dropdown */}
            <div className="flex gap-2 mb-2">
              <select
                value={newIntent}
                onChange={(e) => setNewIntent(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
                disabled={isStaged}
              >
                <option value="" className="text-gray-500">Select from predefined intents...</option>
                {AVAILABLE_INTENTS
                  .filter(intent => !policyData.allowed_intents.includes(intent.value))
                  .map(intent => (
                    <option key={intent.value} value={intent.value} className="text-gray-900">
                      {intent.label} - {intent.description}
                    </option>
                  ))
                }
              </select>
              <button
                type="button"
                onClick={() => {
                  if (newIntent) {
                    addTag('allowed_intents', newIntent);
                    setNewIntent('');
                  }
                }}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50"
                disabled={isStaged || !newIntent}
              >
                Add
              </button>
            </div>
            {/* Custom intent input */}
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={customIntent}
                onChange={(e) => setCustomIntent(e.target.value)}
                placeholder="Or type custom intent (e.g., my_custom_intent)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customIntent.trim()) {
                    e.preventDefault();
                    addTag('allowed_intents', customIntent.trim());
                    setCustomIntent('');
                  }
                }}
                disabled={isStaged}
              />
              <button
                type="button"
                onClick={() => {
                  if (customIntent.trim()) {
                    addTag('allowed_intents', customIntent.trim());
                    setCustomIntent('');
                  }
                }}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50"
                disabled={isStaged || !customIntent.trim()}
              >
                Add Custom
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {policyData.allowed_intents.map((intent, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {intent}
                  {!isStaged && (
                    <button
                      onClick={() => removeTag('allowed_intents', i)}
                      className="text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
              {policyData.allowed_intents.length === 0 && (
                <span className="text-red-500 text-sm italic">Required: Add at least one intent</span>
              )}
            </div>
          </div>

          {/* Allowed Tools */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allowed Tools <span className="text-red-500">*</span>
              <span className="ml-2 text-xs font-normal text-gray-500">
                ({policyData.allowed_tools.length} added)
              </span>
            </label>
            <div className="flex gap-2 mb-2">
              <select
                value={newTool}
                onChange={(e) => setNewTool(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
                disabled={isStaged}
              >
                <option value="" className="text-gray-500">Select a tool to add...</option>
                {AVAILABLE_TOOLS
                  .filter(tool => !policyData.allowed_tools.includes(tool.value))
                  .map(tool => (
                    <option key={tool.value} value={tool.value} className="text-gray-900">
                      {tool.label} - {tool.description}
                    </option>
                  ))
                }
              </select>
              <button
                type="button"
                onClick={() => {
                  if (newTool) {
                    addTag('allowed_tools', newTool);
                    setNewTool('');
                  }
                }}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50"
                disabled={isStaged || !newTool}
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
                  {!isStaged && (
                    <button
                      onClick={() => removeTag('allowed_tools', i)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
              {policyData.allowed_tools.length === 0 && (
                <span className="text-red-500 text-sm italic">Required: Add at least one tool</span>
              )}
            </div>
          </div>

          {/* Forbidden Outputs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Forbidden Outputs
              <span className="ml-2 text-xs font-normal text-gray-500">
                ({policyData.forbidden_outputs.length} added)
              </span>
            </label>
            {/* Predefined forbidden outputs dropdown */}
            <div className="flex gap-2 mb-2">
              <select
                value={newForbidden}
                onChange={(e) => setNewForbidden(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
                disabled={isStaged}
              >
                <option value="" className="text-gray-500">Select from predefined outputs...</option>
                {COMMON_FORBIDDEN_OUTPUTS
                  .filter(output => !policyData.forbidden_outputs.includes(output.value))
                  .map(output => (
                    <option key={output.value} value={output.value} className="text-gray-900">
                      {output.label} - {output.description}
                    </option>
                  ))
                }
              </select>
              <button
                type="button"
                onClick={() => {
                  if (newForbidden) {
                    addTag('forbidden_outputs', newForbidden);
                    setNewForbidden('');
                  }
                }}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50"
                disabled={isStaged || !newForbidden}
              >
                Add
              </button>
            </div>
            {/* Custom forbidden output input */}
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={customForbidden}
                onChange={(e) => setCustomForbidden(e.target.value)}
                placeholder="Or type custom forbidden output (e.g., sensitive_data)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customForbidden.trim()) {
                    e.preventDefault();
                    addTag('forbidden_outputs', customForbidden.trim());
                    setCustomForbidden('');
                  }
                }}
                disabled={isStaged}
              />
              <button
                type="button"
                onClick={() => {
                  if (customForbidden.trim()) {
                    addTag('forbidden_outputs', customForbidden.trim());
                    setCustomForbidden('');
                  }
                }}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50"
                disabled={isStaged || !customForbidden.trim()}
              >
                Add Custom
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {policyData.forbidden_outputs.map((output, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                >
                  {output}
                  {!isStaged && (
                    <button
                      onClick={() => removeTag('forbidden_outputs', i)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
              {policyData.forbidden_outputs.length === 0 && (
                <span className="text-gray-400 text-sm italic">No forbidden patterns (optional)</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Status Panel with Lifecycle Actions */}
        <div className="col-span-1">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
            {/* Current Status */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Policy Status</p>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${STATUS_CONFIG[currentStatus].bg} ${STATUS_CONFIG[currentStatus].color}`}>
                {STATUS_CONFIG[currentStatus].label}
              </span>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Version</p>
              <p className="text-gray-900">v{wizardState.policy_version || 1}</p>
            </div>

            {/* Lifecycle Diagram */}
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-2">Lifecycle</p>
              <div className="flex items-center gap-1 text-xs">
                <span className={currentStatus === 'DRAFT' ? 'font-bold text-yellow-700' : 'text-gray-400'}>
                  DRAFT
                </span>
                <span className="text-gray-300">→</span>
                <span className={currentStatus === 'STAGED' ? 'font-bold text-blue-700' : 'text-gray-400'}>
                  STAGED
                </span>
                <span className="text-gray-300">→</span>
                <span className="text-gray-400">
                  ACTIVE
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-gray-200 space-y-2">
              {currentStatus === 'DRAFT' && (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Draft'}
                  </button>
                  <button
                    onClick={handleStage}
                    disabled={isStaging || !canStage}
                    className={`w-full px-3 py-2 text-sm font-medium rounded-lg ${
                      canStage
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    } disabled:opacity-50`}
                    title={!hasMinimumRequirements ? 'Add at least 1 intent and 1 tool' : ''}
                  >
                    {isStaging ? 'Staging...' : 'Stage for Review'}
                  </button>
                  {!hasMinimumRequirements && (
                    <p className="text-xs text-amber-600 text-center">
                      Min 1 intent + 1 tool required
                    </p>
                  )}
                </>
              )}

              {currentStatus === 'STAGED' && (
                <>
                  <div className="text-center py-2">
                    <span className="text-blue-600 text-lg">✓</span>
                    <p className="text-sm text-blue-800 font-medium">Policy Staged</p>
                    <p className="text-xs text-gray-500 mt-1">Ready for activation</p>
                  </div>
                  <button
                    onClick={handleActivate}
                    disabled={isActivating}
                    className="w-full px-3 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {isActivating ? 'Activating...' : 'Activate Policy'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
