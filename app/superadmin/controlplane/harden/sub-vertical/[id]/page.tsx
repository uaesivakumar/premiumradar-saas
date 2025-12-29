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
  Users,
  Zap,
  AlertTriangle,
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

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/superadmin/controlplane/sub-verticals/${id}/audit`);

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Sub-vertical not found. It may have been deleted.');
        }
        if (res.status === 400) {
          throw new Error('Invalid sub-vertical ID format.');
        }
        if (res.status === 401) {
          throw new Error('Session expired. Please log in again.');
        }
      }

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || data.message || 'Failed to load sub-vertical');
      }

      setSubVertical(data.data.sub_vertical);
      setMvtStatus(data.data.mvt_status);
      setBuyerRole(data.data.sub_vertical.buyer_role || '');
      setDecisionOwner(data.data.sub_vertical.decision_owner || '');
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
      const res = await fetch(`/api/superadmin/controlplane/sub-verticals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer_role: buyerRole || null,
          decision_owner: decisionOwner || null,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to save');
      }

      setSaveSuccess(true);
      await loadData(); // Refresh data
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
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

            {/* Signals Section (Read-only for now) */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <h2 className="text-sm font-medium text-white">Allowed Signals</h2>
                </div>
                <span className="text-[10px] text-neutral-500">
                  {subVertical.allowed_signals?.length || 0} configured
                </span>
              </div>

              {subVertical.allowed_signals && subVertical.allowed_signals.length > 0 ? (
                <div className="space-y-2">
                  {subVertical.allowed_signals.map((signal, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 bg-blue-500/5 border border-blue-500/20 rounded text-xs"
                    >
                      <div>
                        <span className="text-blue-400 font-mono">{signal.signal_key}</span>
                        <span className="text-neutral-600 ml-2">({signal.entity_type})</span>
                      </div>
                      <span className="text-neutral-500 text-[10px] max-w-xs truncate">
                        {signal.justification}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-600 text-xs">No signals configured</p>
              )}
            </div>

            {/* Kill Rules Section (Read-only for now) */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <h2 className="text-sm font-medium text-white">Kill Rules</h2>
                </div>
                <span className="text-[10px] text-neutral-500">
                  {subVertical.kill_rules?.length || 0} configured
                </span>
              </div>

              {subVertical.kill_rules && subVertical.kill_rules.length > 0 ? (
                <div className="space-y-2">
                  {subVertical.kill_rules.map((rule, i) => (
                    <div
                      key={i}
                      className="p-2 bg-red-500/5 border border-red-500/20 rounded text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-red-400">{rule.rule}</span>
                        <span className="text-red-300 text-[10px] px-1.5 py-0.5 bg-red-500/20 rounded">
                          {rule.action}
                        </span>
                      </div>
                      <p className="text-neutral-500 text-[10px]">{rule.reason}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-600 text-xs">No kill rules configured</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
