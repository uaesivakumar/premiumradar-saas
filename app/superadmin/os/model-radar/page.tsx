'use client';

/**
 * S232: Super Admin Model Radar
 *
 * Capability-driven model visibility WITHOUT runtime control.
 *
 * MUST SHIP:
 * - Capabilities Supported / Blocked columns per model
 * - Eligibility toggle (resource, not behavior)
 * - Routing decision viewer (filter by capability, persona, show deviations)
 *
 * MUST NOT SHIP:
 * - Any "force model" button
 * - Any "default model for capability" override
 * - Any bypass of router
 *
 * Admin can see and approve eligibility.
 * Admin cannot dictate routing.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Brain,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  Shield,
  ShieldOff,
  Zap,
  Clock,
  Filter,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Activity,
  Eye,
  XCircle,
} from 'lucide-react';

interface Capability {
  capability_key: string;
  name: string;
  latency_class: string;
  risk_class: string;
  is_active: boolean;
}

interface Model {
  id: string;
  slug: string;
  name: string;
  provider_type: string;
  is_active: boolean;
  is_eligible: boolean;
  stability_score: number;
  avg_latency_ms: number;
  supported_capabilities: string[];
  disallowed_capabilities: string[];
  cost_per_1k: number;
}

interface RoutingDecision {
  id: string;
  interaction_id: string;
  capability_key: string;
  persona_id: string;
  persona_key?: string;
  model_id: string;
  model_slug: string;
  model_active: boolean;
  model_eligible: boolean;
  routing_score: number;
  routing_reason: string;
  envelope_hash: string;
  channel: string;
  created_at: string;
  replay_status: string;
}

export default function ModelRadarPage() {
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [routingDecisions, setRoutingDecisions] = useState<RoutingDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingEligibility, setUpdatingEligibility] = useState<string | null>(null);

  // Filters for routing decisions
  const [filterCapability, setFilterCapability] = useState<string>('');
  const [filterPersona, setFilterPersona] = useState<string>('');
  const [filterDeviation, setFilterDeviation] = useState<boolean>(false);
  const [showRoutingDecisions, setShowRoutingDecisions] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [capRes, modelsRes, decisionsRes] = await Promise.allSettled([
        fetch('/api/superadmin/os/capabilities'),
        fetch('/api/superadmin/os/models'),
        fetch('/api/superadmin/os/routing-decisions?limit=50'),
      ]);

      if (capRes.status === 'fulfilled' && capRes.value.ok) {
        const data = await capRes.value.json();
        if (data.success) setCapabilities(data.data || []);
      }

      if (modelsRes.status === 'fulfilled' && modelsRes.value.ok) {
        const data = await modelsRes.value.json();
        if (data.success) setModels(data.data || []);
      }

      if (decisionsRes.status === 'fulfilled' && decisionsRes.value.ok) {
        const data = await decisionsRes.value.json();
        if (data.success) setRoutingDecisions(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch Model Radar data:', err);
      setError('Failed to connect to UPR OS');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleEligibility = async (modelSlug: string, currentEligibility: boolean) => {
    try {
      setUpdatingEligibility(modelSlug);
      const response = await fetch(`/api/superadmin/os/models/${modelSlug}/eligibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_eligible: !currentEligibility }),
      });

      if (response.ok) {
        setModels(prev =>
          prev.map(m =>
            m.slug === modelSlug ? { ...m, is_eligible: !currentEligibility } : m
          )
        );
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update eligibility');
      }
    } catch (err) {
      setError('Failed to update eligibility');
    } finally {
      setUpdatingEligibility(null);
    }
  };

  const filteredDecisions = routingDecisions.filter(d => {
    if (filterCapability && d.capability_key !== filterCapability) return false;
    if (filterPersona && !d.persona_key?.includes(filterPersona)) return false;
    if (filterDeviation && d.replay_status === 'REPLAYABLE') return false;
    return true;
  });

  const uniqueCapabilityKeys = [...new Set(routingDecisions.map(d => d.capability_key))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-pink-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading Model Radar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/superadmin/os"
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Brain className="w-7 h-7 text-pink-400" />
              Model Radar
            </h1>
            <p className="text-gray-400 mt-1">
              S232: Capability-driven visibility. Admin sees, router decides.
            </p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <XCircle className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}

      {/* Capabilities Registry */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Capability Registry ({capabilities.length})
          </h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-6 gap-2">
            {capabilities.map(cap => (
              <div
                key={cap.capability_key}
                className={`p-3 rounded-lg border ${
                  cap.is_active
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-gray-900 border-gray-800 opacity-50'
                }`}
              >
                <p className="text-white font-mono text-sm truncate">{cap.capability_key}</p>
                <p className="text-gray-500 text-xs truncate">{cap.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    cap.latency_class === 'low' ? 'bg-green-500/20 text-green-400' :
                    cap.latency_class === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {cap.latency_class}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    cap.risk_class === 'low' ? 'bg-green-500/20 text-green-400' :
                    cap.risk_class === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {cap.risk_class} risk
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Models with Capabilities */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Models & Eligibility ({models.length})
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Eligibility = resource availability. Router decides which model to use.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Model</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Provider</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Stability</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Cost/1k</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Supported Capabilities</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Blocked</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-center">Eligible</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {models.map(model => (
                <tr key={model.id} className={`hover:bg-gray-800/50 ${!model.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono text-sm">{model.slug}</span>
                      {!model.is_active && (
                        <span className="text-xs px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded">
                          inactive
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{model.provider_type}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${model.stability_score}%` }}
                        />
                      </div>
                      <span className="text-gray-400 text-xs">{model.stability_score}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm font-mono">
                    ${model.cost_per_1k?.toFixed(4) || '0.0000'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {model.supported_capabilities?.length > 0 ? (
                        model.supported_capabilities.map(cap => (
                          <span
                            key={cap}
                            className="text-xs px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded font-mono"
                          >
                            {cap}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 text-xs">none</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {model.disallowed_capabilities?.length > 0 ? (
                        model.disallowed_capabilities.map(cap => (
                          <span
                            key={cap}
                            className="text-xs px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded font-mono"
                          >
                            {cap}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 text-xs">none</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleEligibility(model.slug, model.is_eligible)}
                      disabled={updatingEligibility === model.slug}
                      className={`p-2 rounded-lg transition-colors ${
                        model.is_eligible
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      }`}
                      title={model.is_eligible ? 'Click to mark ineligible' : 'Click to mark eligible'}
                    >
                      {updatingEligibility === model.slug ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : model.is_eligible ? (
                        <Shield className="w-4 h-4" />
                      ) : (
                        <ShieldOff className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Routing Decision Viewer */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <button
          onClick={() => setShowRoutingDecisions(!showRoutingDecisions)}
          className="w-full p-4 border-b border-gray-800 flex items-center justify-between"
        >
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-400" />
            Routing Decision Viewer ({routingDecisions.length})
          </h2>
          {showRoutingDecisions ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showRoutingDecisions && (
          <>
            {/* Filters */}
            <div className="p-4 border-b border-gray-800 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400 text-sm">Filters:</span>
              </div>
              <select
                value={filterCapability}
                onChange={(e) => setFilterCapability(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white"
              >
                <option value="">All Capabilities</option>
                {uniqueCapabilityKeys.map(cap => (
                  <option key={cap} value={cap}>{cap}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Persona key..."
                value={filterPersona}
                onChange={(e) => setFilterPersona(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white w-40"
              />
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={filterDeviation}
                  onChange={(e) => setFilterDeviation(e.target.checked)}
                  className="rounded bg-gray-800 border-gray-700"
                />
                Deviations only
              </label>
            </div>

            {/* Decisions Table */}
            <div className="overflow-x-auto max-h-96">
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-900">
                  <tr className="border-b border-gray-800 text-left">
                    <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                    <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Capability</th>
                    <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Persona</th>
                    <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Model</th>
                    <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Score</th>
                    <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Channel</th>
                    <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">Replay Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredDecisions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        No routing decisions match filters
                      </td>
                    </tr>
                  ) : (
                    filteredDecisions.map(decision => (
                      <tr key={decision.id} className="hover:bg-gray-800/50">
                        <td className="px-4 py-2 text-gray-400 text-xs">
                          {new Date(decision.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-2">
                          <span className="text-xs px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded font-mono">
                            {decision.capability_key}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-400 text-sm font-mono">
                          {decision.persona_key || decision.persona_id?.slice(0, 8) || '-'}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-white text-sm font-mono">{decision.model_slug}</span>
                            {!decision.model_active && (
                              <span className="text-xs text-red-400">(inactive)</span>
                            )}
                            {!decision.model_eligible && (
                              <span className="text-xs text-orange-400">(ineligible)</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-gray-400 text-sm">
                          {decision.routing_score?.toFixed(2) || '-'}
                        </td>
                        <td className="px-4 py-2">
                          <span className="text-xs px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded">
                            {decision.channel}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {decision.replay_status === 'REPLAYABLE' ? (
                            <span className="flex items-center gap-1 text-xs text-green-400">
                              <CheckCircle className="w-3 h-3" />
                              Replayable
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-orange-400">
                              <AlertTriangle className="w-3 h-3" />
                              {decision.replay_status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* No Force Model Warning */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <p className="text-blue-400 font-medium">Router Integrity Protected</p>
            <p className="text-gray-400 text-sm mt-1">
              Eligibility toggles control resource availability, not routing behavior.
              The model router (S230) makes all selection decisions based on capability requirements,
              persona budgets, and deterministic scoring. No UI path can bypass authorization (S229).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
