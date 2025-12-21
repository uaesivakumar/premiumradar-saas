'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Play,
  RefreshCw,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Shield,
  Target,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Fingerprint,
  Link2,
  AlertTriangle,
  Hash,
  Wrench,
  Database,
  ShieldCheck,
  Copy,
} from 'lucide-react';

interface ScenarioResult {
  id: string;  // result_id for trace lookup
  execution_order: number;
  scenario_id: string;
  company?: { name?: string; employees?: number; employee_count?: number; industry?: string };
  contact?: { title?: string; name?: string };
  signals?: { signal?: string; strength?: number };
  path_type: string;
  expected_outcome: string;
  outcome: string;
  is_correct: boolean;
  crs_scores?: {
    qualification?: number;
    needs_discovery?: number;
    value_articulation?: number;
    objection_handling?: number;
    process_adherence?: number;
    compliance?: number;
    relationship_building?: number;
    next_step_secured?: number;
    weighted?: number;
  };
  siva_reason?: string;
  latency_ms?: number;
  // Trace fields (populated after Phase 1 Trust Layer)
  interaction_id?: string;
  envelope_sha256?: string;
}

interface TraceData {
  interaction_id: string;
  result_id: string;
  scenario_id: string;
  run_id: string;
  suite_key: string;
  run_number: number;
  execution_order: number;
  decision: {
    path_type: string;
    outcome: string;
    expected_outcome: string;
    outcome_correct: boolean;
  };
  envelope: {
    sha256: string;
    version: string;
  };
  authority: {
    persona_id: string | null;
    persona_key: string | null;
    persona_name: string | null;
    persona_version: string;
    policy_version: string;
  };
  routing: {
    model_slug: string;
    model_provider: string;
    decision: {
      model_selected: string;
      reason: string;
      alternatives_considered: string[];
      routing_score: number;
    };
  };
  tools: {
    allowed: string[];
    used: {
      tool_name: string;
      input_hash: string;
      output_hash: string;
      duration_ms: number;
      success: boolean;
      error?: string;
    }[];
    call_count: number;
  };
  policy_gates: {
    gates_hit: {
      gate_name: string;
      triggered: boolean;
      reason: string;
      action_taken: string;
    }[];
    gates_count: number;
  };
  evidence: {
    sources: {
      source: string;
      content_hash: string;
      ttl_seconds: number | null;
      fetched_at: string;
    }[];
    source_count: number;
  };
  performance: {
    latency_ms: number;
    tokens_in: number;
    tokens_out: number;
    cost_estimate: number;
    cost_actual: number | null;
    cache_hit: boolean;
  };
  risk: {
    score: number;
    escalation_triggered: boolean;
  };
  replay: {
    is_replay: boolean;
    original_interaction_id: string | null;
    status: string | null;
    deviation_reason: string | null;
    replay_url: string;
  };
  integrity: {
    signature: string;
    verification_url: string;
  };
  timestamps: {
    executed_at: string;
  };
}

interface SuiteDetails {
  suite_key: string;
  name: string;
  description?: string;
  vertical: string;
  sub_vertical: string;
  region: string;
  stage: string;
  scenario_count: number;
  golden_count?: number;
  kill_count?: number;
  status: string;
  version?: number;
  created_at?: string;
}

interface RunSummary {
  id: string;
  run_number: number;
  status: string;
  golden_pass_rate: string;
  kill_containment_rate: string;
  cohens_d: string;
  started_at: string;
  completed_at?: string;
  golden_count?: number;
  kill_count?: number;
}

export default function SuiteDetailPage({ params }: { params: { suiteKey: string } }) {
  const router = useRouter();
  const [suite, setSuite] = useState<SuiteDetails | null>(null);
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [selectedRun, setSelectedRun] = useState<RunSummary | null>(null);
  const [scenarioResults, setScenarioResults] = useState<ScenarioResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningValidation, setRunningValidation] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioResult | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('scenarios');
  const [error, setError] = useState<string | null>(null);
  // Trace Panel state (Phase 1: Trust Layer)
  const [modalTab, setModalTab] = useState<'overview' | 'trace' | 'tools'>('overview');
  const [traceData, setTraceData] = useState<TraceData | null>(null);
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceError, setTraceError] = useState<string | null>(null);

  const suiteKey = params.suiteKey;

  useEffect(() => {
    fetchSuiteDetails();
  }, [suiteKey]);

  const fetchSuiteDetails = async () => {
    if (!suiteKey) {
      setError('No suite key provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Fetch suite details
      const suiteRes = await fetch(`/api/superadmin/os/sales-bench?action=suite&suite_key=${suiteKey}`);
      const suiteData = await suiteRes.json();
      if (suiteData.success && suiteData.data) {
        setSuite(suiteData.data);
      } else {
        setError(suiteData.error || 'Failed to load suite');
        setLoading(false);
        return;
      }

      // Fetch run history
      const historyRes = await fetch(`/api/superadmin/os/sales-bench?action=history&suite_key=${suiteKey}&limit=10`);
      const historyData = await historyRes.json();
      if (historyData.success) {
        const allRuns = historyData.data || [];
        setRuns(allRuns);
        // Auto-select latest completed run
        const latestCompleted = allRuns.find((r: RunSummary) => r.status === 'COMPLETED');
        if (latestCompleted) {
          setSelectedRun(latestCompleted);
          fetchRunResults(latestCompleted.id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch suite details:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchRunResults = async (runId: string) => {
    try {
      const res = await fetch(`/api/superadmin/os/sales-bench?action=run-results&suite_key=${suiteKey}&run_id=${runId}`);
      const data = await res.json();
      if (data.success && data.data?.results) {
        setScenarioResults(data.data.results);
      }
    } catch (err) {
      console.error('Failed to fetch run results:', err);
    }
  };

  // Fetch trace/provenance data for a scenario result (Phase 1: Trust Layer)
  const fetchTraceData = async (resultId: string, runId: string) => {
    setTraceLoading(true);
    setTraceError(null);
    setTraceData(null);
    try {
      const res = await fetch(
        `/api/superadmin/os/sales-bench?action=trace&suite_key=${suiteKey}&run_id=${runId}&result_id=${resultId}`
      );
      const data = await res.json();
      if (data.success && data.data) {
        setTraceData(data.data);
      } else {
        setTraceError(data.error || 'Failed to load trace data');
      }
    } catch (err) {
      console.error('Failed to fetch trace data:', err);
      setTraceError('Failed to connect to server');
    } finally {
      setTraceLoading(false);
    }
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const runValidation = async () => {
    setRunningValidation(true);
    try {
      const res = await fetch('/api/superadmin/os/sales-bench', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: 'run-system-validation',
          suite_key: suiteKey,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Refresh after a delay to get new run
        setTimeout(() => {
          fetchSuiteDetails();
          setRunningValidation(false);
        }, 3000);
      } else {
        setRunningValidation(false);
        alert(data.error || 'Failed to start validation');
      }
    } catch (err) {
      console.error('Failed to run validation:', err);
      setRunningValidation(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-emerald-400';
    if (score >= 80) return 'text-amber-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-violet-400 animate-spin mx-auto mb-2" />
          <p className="text-neutral-400 text-sm">Loading suite details...</p>
        </div>
      </div>
    );
  }

  if (error || !suite) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-neutral-400 text-sm">{error || 'Suite not found'}</p>
          {suiteKey && (
            <p className="text-neutral-600 text-xs mt-1">Key: {suiteKey}</p>
          )}
          <button
            onClick={() => router.push('/superadmin/sales-bench')}
            className="mt-4 text-violet-400 hover:underline text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const goldenPass = selectedRun ? parseFloat(selectedRun.golden_pass_rate) : 0;
  const killContainment = selectedRun ? parseFloat(selectedRun.kill_containment_rate) : 0;
  const cohensD = selectedRun ? parseFloat(selectedRun.cohens_d) : 0;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-neutral-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => router.push('/superadmin/sales-bench')}
            className="flex items-center gap-2 text-neutral-400 hover:text-white text-sm mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{suite.name}</h1>
              <p className="text-neutral-500 text-sm mt-1">
                {suite.vertical} → {suite.sub_vertical} → {suite.region || 'UAE'}
              </p>
              {suite.description && (
                <p className="text-neutral-400 text-sm mt-2 max-w-2xl">{suite.description}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <a
                href={`/api/superadmin/os/sales-bench/report/founder?suite_key=${suiteKey}`}
                target="_blank"
                className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm transition-colors"
              >
                <FileText className="w-4 h-4" />
                Founder Report
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={`/api/superadmin/os/sales-bench/report?suite_key=${suiteKey}`}
                target="_blank"
                className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                Benchmark Report
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={runValidation}
                disabled={runningValidation}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
              >
                {runningValidation ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {runningValidation ? 'Running...' : 'Run Validation'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Cards */}
        {selectedRun && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
                <Zap className="w-3 h-3" />
                GOLDEN PASS RATE
              </div>
              <p className={`text-3xl font-bold ${getScoreColor(goldenPass)}`}>
                {goldenPass.toFixed(0)}%
              </p>
              <p className="text-xs text-neutral-600 mt-1">
                {selectedRun.golden_count || Math.round(suite.scenario_count * 0.6)} scenarios passed
              </p>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
                <Shield className="w-3 h-3" />
                KILL CONTAINMENT
              </div>
              <p className={`text-3xl font-bold ${getScoreColor(killContainment)}`}>
                {killContainment.toFixed(0)}%
              </p>
              <p className="text-xs text-neutral-600 mt-1">
                {selectedRun.kill_count || Math.round(suite.scenario_count * 0.4)} scenarios blocked
              </p>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
                <Target className="w-3 h-3" />
                COHEN&apos;S d
              </div>
              <p className={`text-3xl font-bold ${
                cohensD >= 2 ? 'text-emerald-400' : cohensD >= 0.8 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {cohensD.toFixed(2)}
              </p>
              <p className="text-xs text-neutral-600 mt-1">
                {cohensD >= 2 ? 'Excellent separation' : cohensD >= 0.8 ? 'Good separation' : 'Needs improvement'}
              </p>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
                <TrendingUp className="w-3 h-3" />
                RUN #{selectedRun.run_number}
              </div>
              <p className="text-lg font-bold text-white">
                {new Date(selectedRun.started_at).toLocaleDateString()}
              </p>
              <p className="text-xs text-neutral-600 mt-1">
                {suite.scenario_count} total scenarios
              </p>
            </div>
          </div>
        )}

        {/* Run Selector */}
        {runs.length > 1 && (
          <div className="mb-6">
            <label className="text-xs text-neutral-500 block mb-2">Select Run:</label>
            <select
              value={selectedRun?.id || ''}
              onChange={(e) => {
                const run = runs.find(r => r.id === e.target.value);
                if (run) {
                  setSelectedRun(run);
                  fetchRunResults(run.id);
                }
              }}
              className="bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm"
            >
              {runs.map((run) => (
                <option key={run.id} value={run.id}>
                  Run #{run.run_number} - {new Date(run.started_at).toLocaleDateString()} ({run.status})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Scenario Results Section */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden mb-6">
          <button
            onClick={() => setExpandedSection(expandedSection === 'scenarios' ? null : 'scenarios')}
            className="w-full px-4 py-3 border-b border-neutral-800 flex items-center justify-between hover:bg-neutral-800/30 transition-colors"
          >
            <h2 className="font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Scenario Results ({scenarioResults.length})
            </h2>
            {expandedSection === 'scenarios' ? (
              <ChevronUp className="w-4 h-4 text-neutral-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-neutral-500" />
            )}
          </button>

          {expandedSection === 'scenarios' && (
            <div className="p-4">
              {scenarioResults.length === 0 ? (
                <p className="text-neutral-500 text-center py-8">
                  No results yet. Run validation to see scenario results.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-neutral-800/50 text-xs text-neutral-400">
                    <tr>
                      <th className="px-3 py-2 text-left w-10">#</th>
                      <th className="px-3 py-2 text-left w-20">Path</th>
                      <th className="px-3 py-2 text-left">Company</th>
                      <th className="px-3 py-2 text-left w-24">Expected</th>
                      <th className="px-3 py-2 text-left w-20">SIVA</th>
                      <th className="px-3 py-2 text-center w-16">CRS</th>
                      <th className="px-3 py-2 text-center w-12">OK</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/50">
                    {scenarioResults.map((result, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-neutral-800/30 cursor-pointer transition-colors ${
                          !result.is_correct ? 'bg-red-500/5' : ''
                        }`}
                        onClick={() => setSelectedScenario(result)}
                      >
                        <td className="px-3 py-2 text-neutral-500">{result.execution_order}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            result.path_type === 'GOLDEN'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {result.path_type}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-white">
                          {result.company?.name || 'Unknown'}
                        </td>
                        <td className="px-3 py-2 text-neutral-400">{result.expected_outcome}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            result.outcome === 'PASS'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {result.outcome}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center text-violet-400">
                          {(() => {
                            const w = result.crs_scores?.weighted;
                            const val = w != null ? parseFloat(String(w)) : null;
                            return val != null && !isNaN(val) ? `${(val * 100).toFixed(0)}%` : '-';
                          })()}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {result.is_correct ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p className="text-xs text-neutral-600 mt-3 text-center">
                Click any row to see full SIVA reasoning and CRS breakdown
              </p>
            </div>
          )}
        </div>

        {/* Run History */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === 'history' ? null : 'history')}
            className="w-full px-4 py-3 border-b border-neutral-800 flex items-center justify-between hover:bg-neutral-800/30 transition-colors"
          >
            <h2 className="font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Run History ({runs.length})
            </h2>
            {expandedSection === 'history' ? (
              <ChevronUp className="w-4 h-4 text-neutral-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-neutral-500" />
            )}
          </button>

          {expandedSection === 'history' && (
            <div className="p-4">
              <table className="w-full text-sm">
                <thead className="bg-neutral-800/50 text-xs text-neutral-400">
                  <tr>
                    <th className="px-3 py-2 text-left">Run</th>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-center">Status</th>
                    <th className="px-3 py-2 text-center">Golden %</th>
                    <th className="px-3 py-2 text-center">Kill %</th>
                    <th className="px-3 py-2 text-center">Cohen&apos;s d</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {runs.map((run) => (
                    <tr
                      key={run.id}
                      className={`hover:bg-neutral-800/30 cursor-pointer transition-colors ${
                        selectedRun?.id === run.id ? 'bg-violet-500/10' : ''
                      }`}
                      onClick={() => {
                        setSelectedRun(run);
                        if (run.status === 'COMPLETED') {
                          fetchRunResults(run.id);
                        }
                      }}
                    >
                      <td className="px-3 py-2 font-medium">#{run.run_number}</td>
                      <td className="px-3 py-2 text-neutral-400">
                        {new Date(run.started_at).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          run.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : run.status === 'RUNNING'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-neutral-500/20 text-neutral-400'
                        }`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {run.status === 'COMPLETED' ? (
                          <span className={getScoreColor(parseFloat(run.golden_pass_rate))}>
                            {parseFloat(run.golden_pass_rate).toFixed(0)}%
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {run.status === 'COMPLETED' ? (
                          <span className={getScoreColor(parseFloat(run.kill_containment_rate))}>
                            {parseFloat(run.kill_containment_rate).toFixed(0)}%
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {run.status === 'COMPLETED' ? (
                          <span className={
                            parseFloat(run.cohens_d) >= 2 ? 'text-emerald-400' :
                            parseFloat(run.cohens_d) >= 0.8 ? 'text-amber-400' : 'text-red-400'
                          }>
                            {parseFloat(run.cohens_d).toFixed(2)}
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Scenario Detail Modal */}
      {selectedScenario && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex-shrink-0 bg-neutral-900 border-b border-neutral-800 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  selectedScenario.path_type === 'GOLDEN'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {selectedScenario.path_type}
                </span>
                <h3 className="text-white font-medium">
                  {selectedScenario.company?.name || 'Unknown Company'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedScenario(null);
                  setModalTab('overview');
                  setTraceData(null);
                }}
                className="text-neutral-400 hover:text-white p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Bar */}
            <div className="flex-shrink-0 bg-neutral-900 border-b border-neutral-800 px-4">
              <div className="flex gap-1">
                <button
                  onClick={() => setModalTab('overview')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    modalTab === 'overview'
                      ? 'text-violet-400 border-violet-400'
                      : 'text-neutral-400 border-transparent hover:text-white'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => {
                    setModalTab('trace');
                    if (!traceData && selectedScenario.id && selectedRun) {
                      fetchTraceData(selectedScenario.id, selectedRun.id);
                    }
                  }}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                    modalTab === 'trace'
                      ? 'text-violet-400 border-violet-400'
                      : 'text-neutral-400 border-transparent hover:text-white'
                  }`}
                >
                  <Fingerprint className="w-4 h-4" />
                  Trace
                </button>
                <button
                  onClick={() => {
                    setModalTab('tools');
                    if (!traceData && selectedScenario.id && selectedRun) {
                      fetchTraceData(selectedScenario.id, selectedRun.id);
                    }
                  }}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                    modalTab === 'tools'
                      ? 'text-violet-400 border-violet-400'
                      : 'text-neutral-400 border-transparent hover:text-white'
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                  Tools
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* === OVERVIEW TAB === */}
              {modalTab === 'overview' && (
                <>
              {/* Company & Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-800/50 rounded p-3">
                  <h4 className="text-xs text-neutral-500 mb-2">COMPANY</h4>
                  <p className="text-white font-medium">{selectedScenario.company?.name || '-'}</p>
                  {(selectedScenario.company?.employees || selectedScenario.company?.employee_count) ? (
                    <p className="text-sm text-neutral-400 mt-1">
                      {selectedScenario.company.employees || selectedScenario.company.employee_count} employees · {selectedScenario.company.industry || 'Unknown'}
                    </p>
                  ) : null}
                </div>
                <div className="bg-neutral-800/50 rounded p-3">
                  <h4 className="text-xs text-neutral-500 mb-2">CONTACT</h4>
                  <p className="text-white">{selectedScenario.contact?.name || '-'}</p>
                  <p className="text-sm text-neutral-400">{selectedScenario.contact?.title || '-'}</p>
                </div>
              </div>

              {/* Signal */}
              {selectedScenario.signals?.signal && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded p-3">
                  <h4 className="text-xs text-amber-400 mb-1">SIGNAL</h4>
                  <p className="text-white">{selectedScenario.signals.signal}</p>
                  {selectedScenario.signals.strength && (
                    <p className="text-sm text-amber-400/70 mt-1">Strength: {selectedScenario.signals.strength}%</p>
                  )}
                </div>
              )}

              {/* SIVA Reasoning */}
              <div className="bg-violet-500/10 border border-violet-500/20 rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm text-violet-400 font-medium">SIVA REASONING</h4>
                  {selectedScenario.latency_ms != null && selectedScenario.latency_ms > 0 && (
                    <span className="text-xs text-neutral-500">{selectedScenario.latency_ms}ms</span>
                  )}
                </div>
                <p className="text-white leading-relaxed">
                  {selectedScenario.siva_reason || 'No reasoning provided'}
                </p>
              </div>

              {/* Decision */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-neutral-800/50 rounded p-3 text-center">
                  <p className="text-xs text-neutral-500 mb-1">Expected</p>
                  <p className="text-white font-medium">{selectedScenario.expected_outcome}</p>
                </div>
                <div className={`rounded p-3 text-center ${
                  selectedScenario.outcome === 'PASS' ? 'bg-emerald-500/10' : 'bg-blue-500/10'
                }`}>
                  <p className="text-xs text-neutral-500 mb-1">SIVA Said</p>
                  <p className={`font-medium ${
                    selectedScenario.outcome === 'PASS' ? 'text-emerald-400' : 'text-blue-400'
                  }`}>
                    {selectedScenario.outcome}
                  </p>
                </div>
                <div className={`rounded p-3 text-center ${
                  selectedScenario.is_correct ? 'bg-emerald-500/10' : 'bg-red-500/10'
                }`}>
                  <p className="text-xs text-neutral-500 mb-1">Result</p>
                  <p className={`font-medium ${selectedScenario.is_correct ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selectedScenario.is_correct ? 'CORRECT' : 'WRONG'}
                  </p>
                </div>
              </div>

              {/* CRS Breakdown */}
              {selectedScenario.crs_scores && (
                <div className="bg-neutral-800/30 rounded p-4">
                  <h4 className="text-xs text-neutral-500 mb-3">CRS DIMENSION SCORES</h4>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { key: 'qualification', label: 'Qualification' },
                      { key: 'needs_discovery', label: 'Needs' },
                      { key: 'value_articulation', label: 'Value' },
                      { key: 'objection_handling', label: 'Objection' },
                      { key: 'process_adherence', label: 'Process' },
                      { key: 'compliance', label: 'Compliance' },
                      { key: 'relationship_building', label: 'Relationship' },
                      { key: 'next_step_secured', label: 'Next Step' },
                    ].map(({ key, label }) => {
                      const rawScore = selectedScenario.crs_scores?.[key as keyof typeof selectedScenario.crs_scores];
                      // Handle both number and string values (pg driver returns NUMERIC as strings)
                      const score = rawScore != null ? parseFloat(String(rawScore)) : null;
                      const isValid = score != null && !isNaN(score);
                      return (
                        <div key={key} className="text-center">
                          <p className="text-xs text-neutral-500">{label}</p>
                          <p className="text-lg font-medium text-blue-400">
                            {isValid ? score.toFixed(1) : '-'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 pt-3 border-t border-neutral-700 flex justify-between items-center">
                    <span className="text-neutral-400">Weighted CRS</span>
                    <span className="text-xl font-bold text-violet-400">
                      {(() => {
                        const w = selectedScenario.crs_scores.weighted;
                        const val = w != null ? parseFloat(String(w)) : null;
                        return val != null && !isNaN(val) ? `${(val * 100).toFixed(1)}%` : '-';
                      })()}
                    </span>
                  </div>
                </div>
              )}
                </>
              )}

              {/* === TRACE TAB === */}
              {modalTab === 'trace' && (
                <div className="space-y-4">
                  {traceLoading && (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-6 h-6 text-violet-400 animate-spin" />
                      <span className="ml-2 text-neutral-400">Loading trace data...</span>
                    </div>
                  )}

                  {traceError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded p-4">
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertTriangle className="w-5 h-5" />
                        <span>{traceError}</span>
                      </div>
                    </div>
                  )}

                  {!traceLoading && !traceError && traceData && (
                    <>
                      {/* Interaction Identity */}
                      <div className="bg-violet-500/10 border border-violet-500/20 rounded p-4">
                        <h4 className="text-sm text-violet-400 font-medium mb-3 flex items-center gap-2">
                          <Fingerprint className="w-4 h-4" />
                          INTERACTION IDENTITY
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-400 text-sm">Interaction ID</span>
                            <div className="flex items-center gap-2">
                              <code className="text-xs text-white bg-neutral-800 px-2 py-1 rounded font-mono">
                                {traceData.interaction_id?.slice(0, 8)}...
                              </code>
                              <button
                                onClick={() => copyToClipboard(traceData.interaction_id)}
                                className="text-neutral-500 hover:text-white"
                                title="Copy full ID"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-400 text-sm">Run #</span>
                            <span className="text-white">{traceData.run_number}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-400 text-sm">Executed At</span>
                            <span className="text-white text-sm">
                              {new Date(traceData.timestamps.executed_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Envelope Provenance */}
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded p-4">
                        <h4 className="text-sm text-amber-400 font-medium mb-3 flex items-center gap-2">
                          <Hash className="w-4 h-4" />
                          ENVELOPE PROVENANCE
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-400 text-sm">SHA256</span>
                            <div className="flex items-center gap-2">
                              <code className="text-xs text-white bg-neutral-800 px-2 py-1 rounded font-mono">
                                {traceData.envelope.sha256?.slice(0, 16)}...
                              </code>
                              <button
                                onClick={() => copyToClipboard(traceData.envelope.sha256)}
                                className="text-neutral-500 hover:text-white"
                                title="Copy full hash"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-400 text-sm">Version</span>
                            <span className="text-white">{traceData.envelope.version}</span>
                          </div>
                        </div>
                      </div>

                      {/* Authority Chain */}
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded p-4">
                        <h4 className="text-sm text-blue-400 font-medium mb-3 flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          AUTHORITY CHAIN
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-400 text-sm">Persona</span>
                            <span className="text-white">
                              {traceData.authority.persona_name || traceData.authority.persona_key || 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-400 text-sm">Persona Version</span>
                            <span className="text-white">{traceData.authority.persona_version}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-400 text-sm">Policy Version</span>
                            <span className="text-white">{traceData.authority.policy_version}</span>
                          </div>
                        </div>
                      </div>

                      {/* Model Routing */}
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-4">
                        <h4 className="text-sm text-emerald-400 font-medium mb-3 flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          MODEL ROUTING
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-400 text-sm">Model</span>
                            <span className="text-white font-mono">{traceData.routing.model_slug}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-400 text-sm">Provider</span>
                            <span className="text-white">{traceData.routing.model_provider}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-400 text-sm">Routing Score</span>
                            <span className="text-white">{traceData.routing.decision?.routing_score?.toFixed(2) || 'N/A'}</span>
                          </div>
                          {traceData.routing.decision?.reason && (
                            <div className="mt-2 pt-2 border-t border-emerald-500/20">
                              <span className="text-neutral-400 text-sm block mb-1">Reason</span>
                              <span className="text-white text-sm">{traceData.routing.decision.reason}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Policy Gates */}
                      {traceData.policy_gates.gates_count > 0 && (
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded p-4">
                          <h4 className="text-sm text-orange-400 font-medium mb-3 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" />
                            POLICY GATES ({traceData.policy_gates.gates_count})
                          </h4>
                          <div className="space-y-2">
                            {traceData.policy_gates.gates_hit.map((gate, idx) => (
                              <div key={idx} className="bg-neutral-800/50 rounded p-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-white font-mono text-sm">{gate.gate_name}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    gate.action_taken === 'PASS' ? 'bg-emerald-500/20 text-emerald-400' :
                                    gate.action_taken === 'BLOCK' ? 'bg-red-500/20 text-red-400' :
                                    'bg-neutral-500/20 text-neutral-400'
                                  }`}>
                                    {gate.action_taken}
                                  </span>
                                </div>
                                <p className="text-neutral-400 text-xs mt-1">{gate.reason}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Evidence Sources */}
                      {traceData.evidence.source_count > 0 && (
                        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded p-4">
                          <h4 className="text-sm text-cyan-400 font-medium mb-3 flex items-center gap-2">
                            <Database className="w-4 h-4" />
                            EVIDENCE SOURCES ({traceData.evidence.source_count})
                          </h4>
                          <div className="space-y-2">
                            {traceData.evidence.sources.map((source, idx) => (
                              <div key={idx} className="flex items-center justify-between text-sm">
                                <span className="text-white font-mono">{source.source}</span>
                                <span className="text-neutral-400 font-mono text-xs">
                                  {source.content_hash?.slice(0, 8)}...
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Risk & Integrity */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-neutral-800/50 rounded p-3">
                          <h4 className="text-xs text-neutral-500 mb-2">RISK SCORE</h4>
                          <div className="flex items-center gap-2">
                            <span className={`text-xl font-bold ${
                              traceData.risk.score > 0.7 ? 'text-red-400' :
                              traceData.risk.score > 0.4 ? 'text-amber-400' :
                              'text-emerald-400'
                            }`}>
                              {(traceData.risk.score * 100).toFixed(0)}%
                            </span>
                            {traceData.risk.escalation_triggered && (
                              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                                ESCALATED
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="bg-neutral-800/50 rounded p-3">
                          <h4 className="text-xs text-neutral-500 mb-2">SIGNATURE</h4>
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <code className="text-xs text-white bg-neutral-800 px-2 py-1 rounded font-mono">
                              {traceData.integrity.signature?.slice(0, 12)}...
                            </code>
                          </div>
                        </div>
                      </div>

                      {/* Replay Link */}
                      <div className="bg-neutral-800/50 rounded p-3">
                        <h4 className="text-xs text-neutral-500 mb-2">REPLAY</h4>
                        <div className="flex items-center gap-2">
                          <Link2 className="w-4 h-4 text-violet-400" />
                          <code className="text-xs text-violet-400 font-mono">
                            {traceData.replay.replay_url}
                          </code>
                        </div>
                        <p className="text-xs text-neutral-500 mt-2">
                          Append-only trace. Cannot be modified after insert.
                        </p>
                      </div>
                    </>
                  )}

                  {!traceLoading && !traceError && !traceData && (
                    <div className="text-center py-8 text-neutral-500">
                      No trace data available for this scenario.
                      <br />
                      <span className="text-xs">Run a new validation to generate trace data.</span>
                    </div>
                  )}
                </div>
              )}

              {/* === TOOLS TAB === */}
              {modalTab === 'tools' && (
                <div className="space-y-4">
                  {traceLoading && (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-6 h-6 text-violet-400 animate-spin" />
                      <span className="ml-2 text-neutral-400">Loading tool data...</span>
                    </div>
                  )}

                  {!traceLoading && traceData && (
                    <>
                      {/* Tools Allowed */}
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded p-4">
                        <h4 className="text-sm text-blue-400 font-medium mb-3">TOOLS ALLOWED</h4>
                        <div className="flex flex-wrap gap-2">
                          {traceData.tools.allowed.map((tool, idx) => (
                            <span key={idx} className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded font-mono">
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Tools Used */}
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-4">
                        <h4 className="text-sm text-emerald-400 font-medium mb-3">
                          TOOLS USED ({traceData.tools.call_count})
                        </h4>
                        {traceData.tools.used.length === 0 ? (
                          <p className="text-neutral-500 text-sm">No tool calls recorded.</p>
                        ) : (
                          <div className="space-y-3">
                            {traceData.tools.used.map((tool, idx) => (
                              <div key={idx} className="bg-neutral-800/50 rounded p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-white font-mono text-sm">{tool.tool_name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-neutral-400">{tool.duration_ms}ms</span>
                                    {tool.success ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-red-400" />
                                    )}
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-neutral-500">Input Hash</span>
                                    <code className="block text-neutral-400 font-mono">{tool.input_hash?.slice(0, 16)}...</code>
                                  </div>
                                  <div>
                                    <span className="text-neutral-500">Output Hash</span>
                                    <code className="block text-neutral-400 font-mono">{tool.output_hash?.slice(0, 16)}...</code>
                                  </div>
                                </div>
                                {tool.error && (
                                  <div className="mt-2 text-xs text-red-400">
                                    Error: {tool.error}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Performance */}
                      <div className="bg-neutral-800/50 rounded p-4">
                        <h4 className="text-xs text-neutral-500 mb-3">PERFORMANCE</h4>
                        <div className="grid grid-cols-4 gap-4">
                          <div className="text-center">
                            <p className="text-xs text-neutral-500">Latency</p>
                            <p className="text-lg font-medium text-white">{traceData.performance.latency_ms}ms</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-neutral-500">Tokens In</p>
                            <p className="text-lg font-medium text-white">{traceData.performance.tokens_in}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-neutral-500">Tokens Out</p>
                            <p className="text-lg font-medium text-white">{traceData.performance.tokens_out}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-neutral-500">Cost</p>
                            <p className="text-lg font-medium text-white">
                              ${traceData.performance.cost_estimate?.toFixed(4) || '0.0000'}
                            </p>
                          </div>
                        </div>
                        {traceData.performance.cache_hit && (
                          <div className="mt-2 text-xs text-emerald-400 text-center">
                            Cache Hit
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {!traceLoading && !traceData && (
                    <div className="text-center py-8 text-neutral-500">
                      No tool data available.
                      <br />
                      <span className="text-xs">Click the Trace tab to load data.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex-shrink-0 border-t border-neutral-800 p-4 flex justify-end">
              <button
                onClick={() => {
                  setSelectedScenario(null);
                  setModalTab('overview');
                  setTraceData(null);
                }}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
