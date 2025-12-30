'use client';

/**
 * S338-F2: Sub-Vertical Harden Page
 *
 * Allows viewing and editing of existing sub-vertical configuration:
 * - Primary entity type (read-only, immutable)
 * - MVT completeness status
 * - ICP fields (buyer_role, decision_owner)
 * - Kill rules
 * - Allowed/forbidden signals
 *
 * NO creation of new entities - edit only.
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
  X,
  Save,
  RefreshCw,
  Target,
  Zap,
  AlertTriangle,
  Plus,
  Trash2,
  FileText,
} from 'lucide-react';
import { RuntimeReadinessPanel } from '@/components/controlplane/harden/RuntimeReadinessPanel';

interface SubVerticalAudit {
  id: string;
  key: string;
  name: string;
  vertical_id: string;
  vertical_key: string;
  vertical_name: string;
  default_agent: string;
  primary_entity_type: string;
  related_entity_types: string[];
  buyer_role: string | null;
  decision_owner: string | null;
  allowed_signals: Array<{ signal_key: string; entity_type: string; justification: string }>;
  kill_rules: Array<{ rule: string; action: string; reason: string }>;
  seed_scenarios: { golden: unknown[]; kill: unknown[] } | null;
  mvt_version: number;
  mvt_valid: boolean;
  mvt_validated_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface MVTStatus {
  valid: boolean;
  checks: {
    has_buyer_role: boolean;
    has_decision_owner: boolean;
    has_signals: boolean;
    has_kill_rules: boolean;
    has_compliance_rule: boolean;
    has_seed_scenarios: boolean;
  };
  missing: string[];
}

export default function SubVerticalHardenPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [subVertical, setSubVertical] = useState<SubVerticalAudit | null>(null);
  const [mvtStatus, setMvtStatus] = useState<MVTStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Editable fields
  const [buyerRole, setBuyerRole] = useState('');
  const [decisionOwner, setDecisionOwner] = useState('');

  // MVT editable fields
  const [allowedSignals, setAllowedSignals] = useState<Array<{ signal_key: string; entity_type: string; justification: string }>>([]);
  const [killRules, setKillRules] = useState<Array<{ rule: string; action: string; reason: string }>>([]);
  const [seedScenarios, setSeedScenarios] = useState<{ golden: Array<{ name: string; description: string }>; kill: Array<{ name: string; description: string }> }>({ golden: [], kill: [] });

  // Form visibility
  const [showAddSignal, setShowAddSignal] = useState(false);
  const [showAddKillRule, setShowAddKillRule] = useState(false);
  const [showAddGolden, setShowAddGolden] = useState(false);
  const [showAddKill, setShowAddKill] = useState(false);

  // New item forms
  const [newSignal, setNewSignal] = useState({ signal_key: '', entity_type: '', justification: '' });
  const [newKillRule, setNewKillRule] = useState({ rule: '', action: 'BLOCK', reason: '' });
  const [newGolden, setNewGolden] = useState({ name: '', description: '' });
  const [newKillScenario, setNewKillScenario] = useState({ name: '', description: '' });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/superadmin/controlplane/sub-verticals/${id}/audit`);

      // Handle HTTP error statuses explicitly
      if (!res.ok) {
        // Try to get error details from response body
        let errorDetails = '';
        try {
          const text = await res.text();
          if (text) {
            const errorData = JSON.parse(text);
            errorDetails = errorData.error || errorData.details || '';
          }
        } catch {
          // Response might not be JSON or empty
        }

        if (res.status === 404) {
          throw new Error('Sub-vertical not found. It may have been deleted.');
        }
        if (res.status === 400) {
          throw new Error(errorDetails || 'Invalid sub-vertical ID format.');
        }
        if (res.status === 401) {
          throw new Error('Session expired. Please log in again.');
        }
        if (res.status === 500) {
          throw new Error(errorDetails || 'Server error while loading sub-vertical. Please try again.');
        }
        // Catch any other error status
        throw new Error(`Failed to load sub-vertical (HTTP ${res.status}): ${errorDetails}`);
      }

      // Safely parse JSON response
      const text = await res.text();
      if (!text || text.trim() === '') {
        throw new Error('Empty response from server');
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('[SubVertical Harden] JSON parse error:', parseError, 'Response:', text.substring(0, 200));
        throw new Error('Invalid JSON response from server');
      }

      if (!data.success) {
        throw new Error(data.error || data.message || 'Failed to load sub-vertical');
      }

      // Validate required data fields
      if (!data.data?.sub_vertical) {
        throw new Error('Invalid response: missing sub_vertical data');
      }

      setSubVertical(data.data.sub_vertical);
      setMvtStatus(data.data.mvt_status);
      setBuyerRole(data.data.sub_vertical.buyer_role || '');
      setDecisionOwner(data.data.sub_vertical.decision_owner || '');
      setAllowedSignals(data.data.sub_vertical.allowed_signals || []);
      setKillRules(data.data.sub_vertical.kill_rules || []);
      setSeedScenarios(data.data.sub_vertical.seed_scenarios || { golden: [], kill: [] });
    } catch (err) {
      console.error('[SubVertical Harden] Load error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sub-vertical audit data');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    if (!subVertical) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Build request body - include all MVT fields if signals/rules are configured
      const hasFullMVT = allowedSignals.length > 0 || killRules.length > 0 ||
                         seedScenarios.golden.length > 0 || seedScenarios.kill.length > 0;

      const requestBody: Record<string, unknown> = {
        buyer_role: buyerRole || null,
        decision_owner: decisionOwner || null,
      };

      // If any MVT arrays are configured, include them all
      if (hasFullMVT) {
        requestBody.allowed_signals = allowedSignals;
        requestBody.kill_rules = killRules;
        requestBody.seed_scenarios = seedScenarios;
      }

      const res = await fetch(`/api/superadmin/controlplane/sub-verticals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      // Safe JSON parsing
      const text = await res.text();
      if (!text || text.trim() === '') {
        throw new Error('Empty response from server');
      }
      const data = JSON.parse(text);

      if (!data.success) {
        // Handle MVT validation errors specifically
        if (data.error === 'MVT_INCOMPLETE' && data.mvt_errors) {
          const errorList = data.mvt_errors.join('\n• ');
          throw new Error(`MVT Validation Failed:\n• ${errorList}`);
        }
        throw new Error(data.message || data.error || 'Failed to save');
      }

      setSaveSuccess(true);
      await loadData(); // Refresh data only on success
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('[Harden Save] Error:', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  // === SIGNAL HELPERS ===
  const addSignal = () => {
    if (!newSignal.signal_key || !newSignal.justification) return;
    setAllowedSignals([...allowedSignals, {
      signal_key: newSignal.signal_key,
      entity_type: newSignal.entity_type || subVertical?.primary_entity_type || 'company',
      justification: newSignal.justification
    }]);
    setNewSignal({ signal_key: '', entity_type: '', justification: '' });
    setShowAddSignal(false);
  };

  const removeSignal = (index: number) => {
    setAllowedSignals(allowedSignals.filter((_, i) => i !== index));
  };

  // === KILL RULE HELPERS ===
  const addKillRule = () => {
    if (!newKillRule.rule || !newKillRule.reason) return;
    setKillRules([...killRules, {
      rule: newKillRule.rule,
      action: newKillRule.action || 'BLOCK',
      reason: newKillRule.reason
    }]);
    setNewKillRule({ rule: '', action: 'BLOCK', reason: '' });
    setShowAddKillRule(false);
  };

  const removeKillRule = (index: number) => {
    setKillRules(killRules.filter((_, i) => i !== index));
  };

  // === SEED SCENARIO HELPERS ===
  const addGoldenScenario = () => {
    if (!newGolden.name || !newGolden.description) return;
    setSeedScenarios({
      ...seedScenarios,
      golden: [...seedScenarios.golden, { name: newGolden.name, description: newGolden.description }]
    });
    setNewGolden({ name: '', description: '' });
    setShowAddGolden(false);
  };

  const removeGoldenScenario = (index: number) => {
    setSeedScenarios({
      ...seedScenarios,
      golden: seedScenarios.golden.filter((_, i) => i !== index)
    });
  };

  const addKillScenario = () => {
    if (!newKillScenario.name || !newKillScenario.description) return;
    setSeedScenarios({
      ...seedScenarios,
      kill: [...seedScenarios.kill, { name: newKillScenario.name, description: newKillScenario.description }]
    });
    setNewKillScenario({ name: '', description: '' });
    setShowAddKill(false);
  };

  const removeKillScenario = (index: number) => {
    setSeedScenarios({
      ...seedScenarios,
      kill: seedScenarios.kill.filter((_, i) => i !== index)
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading sub-vertical...</span>
        </div>
      </div>
    );
  }

  if (error || !subVertical) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 max-w-md text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <h2 className="text-sm font-medium text-red-400 mb-2">Failed to Load</h2>
          <p className="text-neutral-500 text-xs mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
            Harden
          </Link>
          <span>/</span>
          <span className="text-white">{subVertical.name}</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <h1 className="text-lg font-medium text-white">
                  Harden: {subVertical.name}
                </h1>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                {subVertical.vertical_name} / {subVertical.key}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        </div>

        {/* Save feedback */}
        {saveError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            {saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-emerald-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            Changes saved successfully
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Entity Info & MVT Status */}
          <div className="col-span-1 space-y-4">
            {/* Entity Info */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
              <h2 className="text-sm font-medium text-neutral-400 mb-3">Entity Info</h2>
              <dl className="space-y-2 text-xs">
                <div>
                  <dt className="text-neutral-600">Key</dt>
                  <dd className="text-white font-mono">{subVertical.key}</dd>
                </div>
                <div>
                  <dt className="text-neutral-600">Primary Entity Type</dt>
                  <dd className="text-white">{subVertical.primary_entity_type || 'Not set'}</dd>
                </div>
                <div>
                  <dt className="text-neutral-600">Default Agent</dt>
                  <dd className="text-white">{subVertical.default_agent}</dd>
                </div>
                <div>
                  <dt className="text-neutral-600">Status</dt>
                  <dd>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      subVertical.is_active
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {subVertical.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            {/* MVT Status */}
            {mvtStatus && (
              <div className={`border rounded-lg p-4 ${
                mvtStatus.valid
                  ? 'bg-emerald-500/5 border-emerald-500/30'
                  : 'bg-amber-500/5 border-amber-500/30'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium text-neutral-400">MVT Status</h2>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    mvtStatus.valid
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {mvtStatus.valid ? 'COMPLETE' : 'INCOMPLETE'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {Object.entries(mvtStatus.checks).map(([key, passed]) => (
                    <div
                      key={key}
                      className={`flex items-center gap-2 text-[10px] ${
                        passed ? 'text-emerald-400' : 'text-neutral-500'
                      }`}
                    >
                      {passed ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      <span>{key.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>

                {mvtStatus.missing.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-amber-500/20">
                    <p className="text-[10px] text-amber-400 font-medium mb-1">Missing:</p>
                    <ul className="text-[10px] text-amber-300 space-y-0.5">
                      {mvtStatus.missing.map((item, i) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* S339: Runtime Readiness Panel */}
            <RuntimeReadinessPanel
              entityType="sub-vertical"
              entityId={id}
            />
          </div>

          {/* Right Column - Editable Fields */}
          <div className="col-span-2 space-y-4">
            {/* ICP Section */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-violet-400" />
                <h2 className="text-sm font-medium text-white">ICP (Ideal Customer Profile)</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">
                    Buyer Role <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={buyerRole}
                    onChange={(e) => setBuyerRole(e.target.value)}
                    placeholder="e.g., HR Director, CFO"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-neutral-600 mt-1">
                    Who typically makes the buying decision
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">
                    Decision Owner <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={decisionOwner}
                    onChange={(e) => setDecisionOwner(e.target.value)}
                    placeholder="e.g., CFO, CEO, Finance Director"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-neutral-600 mt-1">
                    Who signs off on the final purchase
                  </p>
                </div>
              </div>
            </div>

            {/* Signals Section - EDITABLE */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <h2 className="text-sm font-medium text-white">Allowed Signals</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-500">
                    {allowedSignals.length} configured
                  </span>
                  <button
                    onClick={() => setShowAddSignal(!showAddSignal)}
                    className="p-1 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                    title="Add Signal"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Add Signal Form */}
              {showAddSignal && (
                <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg space-y-2">
                  <input
                    type="text"
                    placeholder="Signal Key (e.g., revenue_growth)"
                    value={newSignal.signal_key}
                    onChange={(e) => setNewSignal({ ...newSignal, signal_key: e.target.value })}
                    className="w-full px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-white placeholder:text-neutral-600"
                  />
                  <input
                    type="text"
                    placeholder="Justification (why this signal matters)"
                    value={newSignal.justification}
                    onChange={(e) => setNewSignal({ ...newSignal, justification: e.target.value })}
                    className="w-full px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-white placeholder:text-neutral-600"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={addSignal}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowAddSignal(false)}
                      className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {allowedSignals.length > 0 ? (
                <div className="space-y-2">
                  {allowedSignals.map((signal, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 bg-blue-500/5 border border-blue-500/20 rounded text-xs"
                    >
                      <div className="flex-1">
                        <span className="text-blue-400 font-mono">{signal.signal_key}</span>
                        <span className="text-neutral-600 ml-2">({signal.entity_type})</span>
                        <p className="text-neutral-500 text-[10px] mt-0.5">{signal.justification}</p>
                      </div>
                      <button
                        onClick={() => removeSignal(i)}
                        className="p-1 text-red-400 hover:bg-red-500/20 rounded ml-2"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-600 text-xs">No signals configured. Add at least 1 signal.</p>
              )}
            </div>

            {/* Kill Rules Section - EDITABLE */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <h2 className="text-sm font-medium text-white">Kill Rules</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-500">
                    {killRules.length} configured
                  </span>
                  <button
                    onClick={() => setShowAddKillRule(!showAddKillRule)}
                    className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                    title="Add Kill Rule"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Add Kill Rule Form */}
              {showAddKillRule && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg space-y-2">
                  <input
                    type="text"
                    placeholder="Rule name (e.g., GDPR Compliance Check)"
                    value={newKillRule.rule}
                    onChange={(e) => setNewKillRule({ ...newKillRule, rule: e.target.value })}
                    className="w-full px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-white placeholder:text-neutral-600"
                  />
                  <select
                    value={newKillRule.action}
                    onChange={(e) => setNewKillRule({ ...newKillRule, action: e.target.value })}
                    className="w-full px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-white"
                  >
                    <option value="BLOCK">BLOCK</option>
                    <option value="WARN">WARN</option>
                    <option value="REVIEW">REVIEW</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Reason (include 'compliance' or 'regulatory' for compliance rules)"
                    value={newKillRule.reason}
                    onChange={(e) => setNewKillRule({ ...newKillRule, reason: e.target.value })}
                    className="w-full px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-white placeholder:text-neutral-600"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={addKillRule}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowAddKillRule(false)}
                      className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-xs rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {killRules.length > 0 ? (
                <div className="space-y-2">
                  {killRules.map((rule, i) => (
                    <div
                      key={i}
                      className="p-2 bg-red-500/5 border border-red-500/20 rounded text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-red-400">{rule.rule}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-red-300 text-[10px] px-1.5 py-0.5 bg-red-500/20 rounded">
                            {rule.action}
                          </span>
                          <button
                            onClick={() => removeKillRule(i)}
                            className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-neutral-500 text-[10px]">{rule.reason}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-600 text-xs">No kill rules configured. Add at least 2 rules (1 must be compliance).</p>
              )}
            </div>

            {/* Seed Scenarios Section - EDITABLE */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm font-medium text-white">Seed Scenarios</h2>
              </div>

              {/* Golden Scenarios */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-emerald-400">Golden Scenarios (happy path)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-500">{seedScenarios.golden.length} configured</span>
                    <button
                      onClick={() => setShowAddGolden(!showAddGolden)}
                      className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {showAddGolden && (
                  <div className="mb-2 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded space-y-2">
                    <input
                      type="text"
                      placeholder="Scenario name"
                      value={newGolden.name}
                      onChange={(e) => setNewGolden({ ...newGolden, name: e.target.value })}
                      className="w-full px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-xs text-white placeholder:text-neutral-600"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={newGolden.description}
                      onChange={(e) => setNewGolden({ ...newGolden, description: e.target.value })}
                      className="w-full px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-xs text-white placeholder:text-neutral-600"
                    />
                    <div className="flex gap-2">
                      <button onClick={addGoldenScenario} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] rounded">Add</button>
                      <button onClick={() => setShowAddGolden(false)} className="px-2 py-1 bg-neutral-700 text-white text-[10px] rounded">Cancel</button>
                    </div>
                  </div>
                )}

                {seedScenarios.golden.length > 0 ? (
                  <div className="space-y-1">
                    {seedScenarios.golden.map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-1.5 bg-emerald-500/5 border border-emerald-500/20 rounded text-[10px]">
                        <div>
                          <span className="text-emerald-400">{s.name}</span>
                          <span className="text-neutral-500 ml-2">{s.description}</span>
                        </div>
                        <button onClick={() => removeGoldenScenario(i)} className="p-0.5 text-red-400 hover:bg-red-500/20 rounded">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-neutral-600 text-[10px]">Add at least 2 golden scenarios</p>
                )}
              </div>

              {/* Kill Scenarios */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-red-400">Kill Scenarios (rejection cases)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-500">{seedScenarios.kill.length} configured</span>
                    <button
                      onClick={() => setShowAddKill(!showAddKill)}
                      className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {showAddKill && (
                  <div className="mb-2 p-2 bg-red-500/10 border border-red-500/30 rounded space-y-2">
                    <input
                      type="text"
                      placeholder="Scenario name"
                      value={newKillScenario.name}
                      onChange={(e) => setNewKillScenario({ ...newKillScenario, name: e.target.value })}
                      className="w-full px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-xs text-white placeholder:text-neutral-600"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={newKillScenario.description}
                      onChange={(e) => setNewKillScenario({ ...newKillScenario, description: e.target.value })}
                      className="w-full px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-xs text-white placeholder:text-neutral-600"
                    />
                    <div className="flex gap-2">
                      <button onClick={addKillScenario} className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] rounded">Add</button>
                      <button onClick={() => setShowAddKill(false)} className="px-2 py-1 bg-neutral-700 text-white text-[10px] rounded">Cancel</button>
                    </div>
                  </div>
                )}

                {seedScenarios.kill.length > 0 ? (
                  <div className="space-y-1">
                    {seedScenarios.kill.map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-1.5 bg-red-500/5 border border-red-500/20 rounded text-[10px]">
                        <div>
                          <span className="text-red-400">{s.name}</span>
                          <span className="text-neutral-500 ml-2">{s.description}</span>
                        </div>
                        <button onClick={() => removeKillScenario(i)} className="p-0.5 text-red-400 hover:bg-red-500/20 rounded">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-neutral-600 text-[10px]">Add at least 2 kill scenarios</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
