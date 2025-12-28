'use client';

import { useState, useEffect, useMemo, Component, ReactNode, ErrorInfo } from 'react';
import { useRouter } from 'next/navigation';
import {
  FlaskConical,
  ChevronRight,
  RefreshCw,
  Shield,
  Target,
  Clock,
  AlertTriangle,
  Lock,
  Archive,
  Eye,
  Settings,
  CheckCircle2,
  XCircle,
  Info,
  Scale,
  FileCheck,
  GitCompare,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

// ============================================================================
// GOVERNANCE UI - PRD v1.3 APPENDIX COMPLIANT
// This UI is for validation and trust evaluation ONLY.
// It does NOT represent conversion performance or optimization guidance.
// ============================================================================

// Error Boundary to catch and display errors
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Sales-Bench Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
          <div className="max-w-lg bg-red-500/10 border border-red-500/30 rounded-lg p-6">
            <div className="flex items-center gap-2 text-red-400 mb-4">
              <AlertTriangle className="w-5 h-5" />
              <h2 className="font-medium">Sales-Bench Error</h2>
            </div>
            <p className="text-neutral-300 text-sm mb-4">
              {this.state.error?.message || 'An unknown error occurred'}
            </p>
            <pre className="bg-black/50 p-3 rounded text-xs text-neutral-400 overflow-auto max-h-40">
              {this.state.error?.stack || 'No stack trace available'}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Types
type ViewMode = 'founder' | 'operator';

interface SuiteSummary {
  key: string;
  name: string;
  type: string;
  vertical: string;
  sub_vertical: string;
  region: string;
  scenario_count: number;
  status: string;
  latest_run?: {
    run_number: number;
    golden_pass_rate: number;
    kill_containment_rate: number;
    cohens_d: number;
    date: string;
  };
  previous_run?: {
    golden_pass_rate: number;
    kill_containment_rate: number;
  };
  // RM Trial Readiness fields (computed)
  rm_trial_ready?: boolean;
  shadow_weeks?: number;
  founder_approved_acts?: number;
  block_false_positives?: number;
  wiring_parity_valid?: boolean;
}

interface DashboardStats {
  total_suites: number;
  total_runs: number;
  avg_golden_pass: number;
  avg_kill_containment: number;
  best_performer: string;
  insight: string;
}

// Parity Check Types
interface ParityStatus {
  last_certification?: {
    certification_id: string;
    status: 'PARITY_VERIFIED' | 'PARITY_BROKEN';
    timestamp: string;
    triggered_by?: string;
  };
  is_certified: boolean;
}

interface ParityResult {
  certification_id: string;
  status: 'PARITY_VERIFIED' | 'PARITY_BROKEN';
  total_tests: number;
  passed: number;
  failed: number;
  test_cases: Array<{
    case_name: string;
    passed: boolean;
    frontend_outcome?: string;
    salesbench_outcome?: string;
    deviation_reason?: string;
  }>;
  timestamp: string;
  commit_sha?: string;
}

// Tooltip Component
function MetricTooltip({ children }: { children: ReactNode }) {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        This metric is for validation and trust evaluation only.
        <br />
        It does not represent conversion performance or optimization guidance.
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-800" />
      </div>
    </div>
  );
}

// RM Trial Readiness Badge
function RMTrialBadge({ suite, globalParityBroken }: { suite: SuiteSummary; globalParityBroken?: boolean }) {
  // Compute RM Trial Readiness based on governance conditions
  const isSystemValidated = suite.status === 'SYSTEM_VALIDATED' || suite.status === 'GA_APPROVED';
  const hasShadowStability = (suite.shadow_weeks ?? 0) >= 2;
  const hasFounderApproval = (suite.founder_approved_acts ?? 0) >= 10;
  const hasBlockIntegrity = (suite.block_false_positives ?? 0) === 0;
  // Global parity broken overrides per-suite status
  const hasWiringParity = globalParityBroken === true ? false : suite.wiring_parity_valid !== false;

  const isReady = isSystemValidated && hasShadowStability && hasFounderApproval && hasBlockIntegrity && hasWiringParity;

  // Special case: if globally parity broken, show specific message
  if (globalParityBroken) {
    return (
      <div className="group relative">
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-400">
          <ShieldAlert className="w-3 h-3" />
          PARITY BROKEN — LOCKED
        </span>
        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-red-900/50 border border-red-500/30 rounded text-xs text-red-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-64 z-50">
          RM trials are LOCKED because Frontend ↔ Sales-Bench parity is broken. Run parity certification to verify.
          <div className="absolute top-full left-4 border-4 border-transparent border-t-red-900/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      {isReady ? (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs text-emerald-400">
          <CheckCircle2 className="w-3 h-3" />
          RM TRIAL READY
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-400">
          <XCircle className="w-3 h-3" />
          NOT READY FOR RM TRIALS
        </span>
      )}
      <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-64 z-50">
        RM trials are allowed only after governance validation, shadow stability, and founder trust approval.
        <div className="absolute top-full left-4 border-4 border-transparent border-t-neutral-800" />
      </div>
    </div>
  );
}

// Suite Status Badge
function SuiteStatusBadge({ status }: { status: string }) {
  if (status === 'FROZEN' || status === 'SYSTEM_VALIDATED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] text-blue-400">
        <Lock className="w-2.5 h-2.5" />
        BASELINE — DO NOT TUNE
      </span>
    );
  }
  if (status === 'ARCHIVED' || status === 'DEPRECATED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-[10px] text-neutral-500">
        <Archive className="w-2.5 h-2.5" />
        REFERENCE ONLY
      </span>
    );
  }
  if (status === 'GA_APPROVED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] text-emerald-400">
        <FileCheck className="w-2.5 h-2.5" />
        GA APPROVED
      </span>
    );
  }
  return null;
}

function SalesBenchDashboardInner() {
  const router = useRouter();
  const [suites, setSuites] = useState<SuiteSummary[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('founder');

  // Filter State - for multi-vertical support
  const [filterVertical, setFilterVertical] = useState<string>('all');
  const [filterSubVertical, setFilterSubVertical] = useState<string>('all');

  // Derived: unique verticals and sub-verticals from suites (memoized)
  const verticals = useMemo(() =>
    [...new Set(suites.map(s => s.vertical).filter(Boolean))],
    [suites]
  );

  const subVerticals = useMemo(() =>
    [...new Set(
      suites
        .filter(s => filterVertical === 'all' || s.vertical === filterVertical)
        .map(s => s.sub_vertical)
        .filter(Boolean)
    )],
    [suites, filterVertical]
  );

  // Filtered suites based on selected filters (memoized)
  const filteredSuites = useMemo(() =>
    suites.filter(s => {
      if (filterVertical !== 'all' && s.vertical !== filterVertical) return false;
      if (filterSubVertical !== 'all' && s.sub_vertical !== filterSubVertical) return false;
      return true;
    }),
    [suites, filterVertical, filterSubVertical]
  );

  // Recalculate stats for filtered suites (memoized)
  const filteredStats = useMemo(() => {
    if (!stats) return null;
    const suitesWithRuns = filteredSuites.filter(s => s.latest_run?.golden_pass_rate != null);
    const totalRuns = suitesWithRuns.length;
    const avgGolden = suitesWithRuns.length > 0
      ? suitesWithRuns.reduce((sum, s) => sum + (s.latest_run?.golden_pass_rate || 0), 0) / suitesWithRuns.length
      : 0;
    const avgKill = suitesWithRuns.length > 0
      ? suitesWithRuns.reduce((sum, s) => sum + (s.latest_run?.kill_containment_rate || 0), 0) / suitesWithRuns.length
      : 0;
    const bestSuite = [...suitesWithRuns].sort((a, b) => {
      const scoreA = (a.latest_run?.golden_pass_rate || 0) + (a.latest_run?.kill_containment_rate || 0);
      const scoreB = (b.latest_run?.golden_pass_rate || 0) + (b.latest_run?.kill_containment_rate || 0);
      return scoreB - scoreA;
    })[0];

    return {
      ...stats,
      total_suites: filteredSuites.length,
      total_runs: totalRuns,
      avg_golden_pass: avgGolden,
      avg_kill_containment: avgKill,
      best_performer: bestSuite?.name || '-',
    };
  }, [stats, filteredSuites]);

  // Parity Check State
  const [parityStatus, setParityStatus] = useState<ParityStatus | null>(null);
  const [parityResult, setParityResult] = useState<ParityResult | null>(null);
  const [parityChecking, setParityChecking] = useState(false);
  const [parityError, setParityError] = useState<string | null>(null);

  // Compute global parity broken status (memoized)
  const globalParityBroken = useMemo(() =>
    parityResult?.status === 'PARITY_BROKEN' ||
    (parityStatus?.last_certification?.status === 'PARITY_BROKEN'),
    [parityResult, parityStatus]
  );

  const fetchParityStatus = async () => {
    try {
      const res = await fetch('/api/superadmin/os/sales-bench?action=parity-status');
      const data = await res.json();
      if (data.success && data.data) {
        setParityStatus(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch parity status:', err);
    }
  };

  const runParityCheck = async () => {
    setParityChecking(true);
    setParityError(null);
    setParityResult(null);

    try {
      const res = await fetch('/api/superadmin/os/sales-bench', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'parity-check' }),
      });
      const data = await res.json();

      if (data.success && data.data) {
        setParityResult(data.data);
        // Also refresh parity status
        await fetchParityStatus();
      } else {
        setParityError(data.error || 'Parity check failed');
      }
    } catch (err) {
      console.error('Parity check error:', err);
      setParityError('Failed to run parity check');
    } finally {
      setParityChecking(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/superadmin/os/sales-bench?action=dashboard');
      const data = await res.json();
      if (data.success && data.data) {
        setSuites(data.data.suites || []);
        setStats(data.data.stats || null);
      } else {
        console.warn('Sales-Bench API response:', data.error || 'Unknown error');
        setSuites([]);
        setStats(null);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
      setSuites([]);
      setStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchParityStatus();
    // Load saved view preference
    const savedView = localStorage.getItem('salesbench_view_mode');
    if (savedView === 'operator') {
      setViewMode('operator');
    }
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const handleViewToggle = () => {
    const newMode = viewMode === 'founder' ? 'operator' : 'founder';
    setViewMode(newMode);
    localStorage.setItem('salesbench_view_mode', newMode);
  };

  // Governance-compliant score display (no color coding that implies good/bad)
  const getComplianceColor = (score: number) => {
    // Neutral colors - no red/green that implies performance
    if (score >= 95) return 'text-neutral-200';
    if (score >= 80) return 'text-neutral-300';
    return 'text-neutral-400';
  };

  const formatType = (stage: string) => {
    const types: Record<string, { label: string; color: string }> = {
      'PRE_ENTRY': { label: 'Pre-Entry', color: 'bg-blue-500/20 text-blue-400' },
      'POST_ENTRY': { label: 'Post-Entry', color: 'bg-purple-500/20 text-purple-400' },
      'DISCOVERY': { label: 'Discovery', color: 'bg-amber-500/20 text-amber-400' },
    };
    return types[stage] || { label: stage, color: 'bg-neutral-500/20 text-neutral-400' };
  };

  // Generate governance notice (NOT performance insight)
  const getGovernanceNotice = () => {
    if (!stats) return null;

    const avgGolden = stats.avg_golden_pass ?? 0;
    const avgKill = stats.avg_kill_containment ?? 0;

    if (avgGolden >= 95 && avgKill >= 95) {
      return 'Governance Status: All suites meet baseline compliance thresholds. Suitable for RM trial evaluation.';
    }
    if (avgGolden >= 80 && avgKill >= 80) {
      return 'Governance Status: Most suites meet baseline compliance. Review individual suite status before RM involvement.';
    }
    return 'Governance Status: Some suites require attention before RM trials. This is an observational status, not an optimization target.';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <FlaskConical className="w-8 h-8 text-violet-400 animate-pulse mx-auto mb-2" />
          <p className="text-neutral-400 text-sm">Loading Governance Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* View Mode Banner */}
      {viewMode === 'founder' ? (
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-violet-400" />
              <span className="text-violet-300 text-sm font-medium">Founder View</span>
            </div>
            <p className="text-violet-300/70 text-xs">
              You are evaluating trust and maturity, not performance.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 text-sm font-medium">Operator View</span>
            </div>
            <p className="text-amber-300/70 text-xs">
              Metrics here do not indicate sales success. Do not tune thresholds without governance approval.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Scale className="w-6 h-6 text-violet-400" />
            SIVA Governance Console
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Behavioral Validation & Trust Evaluation — No Runtime Impact
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Vertical Filter */}
          <select
            value={filterVertical}
            onChange={(e) => {
              setFilterVertical(e.target.value);
              setFilterSubVertical('all'); // Reset sub-vertical when vertical changes
            }}
            className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-neutral-200 focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Verticals</option>
            {verticals.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>

          {/* Sub-Vertical Filter */}
          <select
            value={filterSubVertical}
            onChange={(e) => setFilterSubVertical(e.target.value)}
            className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-neutral-200 focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Sub-Verticals</option>
            {subVerticals.map(sv => (
              <option key={sv} value={sv}>{sv}</option>
            ))}
          </select>

          <button
            onClick={handleViewToggle}
            className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm transition-colors"
          >
            {viewMode === 'founder' ? (
              <>
                <Settings className="w-4 h-4" />
                Operator View
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Founder View
              </>
            )}
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Founder View: Trust Summary */}
      {viewMode === 'founder' && filteredStats && (
        <>
          {/* Governance Metrics (Read-Only) */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <MetricTooltip>
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
                  <Target className="w-3 h-3" />
                  GOLDEN PATH COMPLIANCE
                  <Info className="w-3 h-3 opacity-50" />
                </div>
                <p className={`text-3xl font-bold ${getComplianceColor(filteredStats.avg_golden_pass ?? 0)}`}>
                  {(filteredStats.avg_golden_pass ?? 0).toFixed(0)}%
                </p>
                <p className="text-xs text-neutral-600 mt-1">Observational metric only</p>
              </div>
            </MetricTooltip>
            <MetricTooltip>
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
                  <Shield className="w-3 h-3" />
                  POLICY CONTAINMENT RATE
                  <Info className="w-3 h-3 opacity-50" />
                </div>
                <p className={`text-3xl font-bold ${getComplianceColor(filteredStats.avg_kill_containment ?? 0)}`}>
                  {(filteredStats.avg_kill_containment ?? 0).toFixed(0)}%
                </p>
                <p className="text-xs text-neutral-600 mt-1">Observational metric only</p>
              </div>
            </MetricTooltip>
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
                <FlaskConical className="w-3 h-3" />
                VALIDATION RUNS
              </div>
              <p className="text-3xl font-bold text-white">
                {filteredStats.total_runs}
              </p>
              <p className="text-xs text-neutral-600 mt-1">Across {filteredStats.total_suites} suites</p>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
                <FileCheck className="w-3 h-3" />
                REFERENCE SUITE
              </div>
              <p className="text-lg font-bold text-neutral-200 truncate">
                {filteredStats.best_performer || '-'}
              </p>
              <p className="text-xs text-neutral-600 mt-1">Baseline for comparison</p>
            </div>
          </div>

          {/* Governance Notice */}
          <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-neutral-400 mt-0.5" />
              <div>
                <p className="text-neutral-300 text-sm font-medium">Governance Notice</p>
                <p className="text-neutral-400 text-sm mt-1">{getGovernanceNotice()}</p>
              </div>
            </div>
          </div>

          {/* What This Proves / Does Not Prove */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
              <p className="text-emerald-400 text-xs font-medium mb-2">WHAT THIS PROVES</p>
              <ul className="space-y-1.5 text-sm text-neutral-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>SIVA follows expected behavioral patterns on known scenarios</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Policy gates are consistently enforced</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Golden path scenarios produce expected ACT decisions</span>
                </li>
              </ul>
            </div>
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400 text-xs font-medium mb-2">WHAT THIS DOES NOT PROVE</p>
              <ul className="space-y-1.5 text-sm text-neutral-300">
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>Real-world conversion rates or sales success</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>Model accuracy on unseen data</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>Optimization guidance or tuning recommendations</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Wiring Parity Check - Governance Tripwire (Founder View Only) */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-violet-400" />
                <h3 className="font-medium text-white">Frontend ↔ Sales-Bench Parity Check</h3>
              </div>
              <button
                onClick={runParityCheck}
                disabled={parityChecking}
                className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:cursor-not-allowed rounded text-sm text-white transition-colors"
              >
                {parityChecking ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <GitCompare className="w-4 h-4" />
                    Run Parity Check
                  </>
                )}
              </button>
            </div>

            <p className="text-neutral-400 text-sm mb-4">
              Verifies that Frontend Discovery and Sales-Bench use the <strong>identical SIVA scoring path</strong>.
              If parity is broken, all RM Trial Readiness gates are locked until resolved.
            </p>

            {/* Parity Error */}
            {parityError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded p-3 mb-4">
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  {parityError}
                </div>
              </div>
            )}

            {/* Parity Result - Binary Output Only */}
            {parityResult && (
              <div className={`rounded-lg p-4 ${
                parityResult.status === 'PARITY_VERIFIED'
                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                  : 'bg-red-500/10 border border-red-500/30'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {parityResult.status === 'PARITY_VERIFIED' ? (
                      <>
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        <span className="font-bold text-emerald-400">PARITY VERIFIED</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-5 h-5 text-red-400" />
                        <span className="font-bold text-red-400">PARITY BROKEN</span>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-neutral-500">
                    {new Date(parityResult.timestamp).toLocaleString()}
                  </span>
                </div>

                {/* Binary summary - no percentages */}
                <div className="text-sm text-neutral-300 mb-2">
                  {parityResult.passed}/{parityResult.total_tests} test cases passed
                </div>

                {/* Commit SHA if available */}
                {parityResult.commit_sha && (
                  <div className="text-xs text-neutral-500">
                    Commit: <code className="bg-neutral-800 px-1 rounded">{parityResult.commit_sha.slice(0, 7)}</code>
                  </div>
                )}

                {/* If PARITY BROKEN, show governance warning */}
                {parityResult.status === 'PARITY_BROKEN' && (
                  <div className="mt-4 p-3 bg-red-900/30 border border-red-500/20 rounded">
                    <div className="flex items-start gap-2 text-red-300 text-sm">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>GOVERNANCE ALERT:</strong> All RM Trial Readiness gates are now LOCKED.
                        Do not proceed with RM trials until parity is restored.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Previous Certification Status (if no new result) */}
            {!parityResult && parityStatus?.last_certification && (
              <div className="text-sm text-neutral-400">
                <span>Last certification: </span>
                <span className={parityStatus.last_certification.status === 'PARITY_VERIFIED' ? 'text-emerald-400' : 'text-red-400'}>
                  {parityStatus.last_certification.status === 'PARITY_VERIFIED' ? '✓ VERIFIED' : '✗ BROKEN'}
                </span>
                <span className="text-neutral-500 ml-2">
                  ({new Date(parityStatus.last_certification.timestamp).toLocaleDateString()})
                </span>
              </div>
            )}

            {/* No certification yet */}
            {!parityResult && !parityStatus?.last_certification && (
              <div className="text-sm text-neutral-500">
                No parity certification on record. Run the check above to verify.
              </div>
            )}
          </div>
        </>
      )}

      {/* Operator View: Raw Metrics */}
      {viewMode === 'operator' && filteredStats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <MetricTooltip>
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
                <Target className="w-3 h-3" />
                GOLDEN PATH COMPLIANCE
              </div>
              <p className="text-3xl font-bold text-neutral-200">
                {(filteredStats.avg_golden_pass ?? 0).toFixed(1)}%
              </p>
            </div>
          </MetricTooltip>
          <MetricTooltip>
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
                <Shield className="w-3 h-3" />
                POLICY CONTAINMENT RATE
              </div>
              <p className="text-3xl font-bold text-neutral-200">
                {(filteredStats.avg_kill_containment ?? 0).toFixed(1)}%
              </p>
            </div>
          </MetricTooltip>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
              <FlaskConical className="w-3 h-3" />
              VALIDATION RUNS
            </div>
            <p className="text-3xl font-bold text-white">{filteredStats.total_runs}</p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
              <FileCheck className="w-3 h-3" />
              REFERENCE SUITE
            </div>
            <p className="text-lg font-bold text-neutral-200 truncate">{filteredStats.best_performer || '-'}</p>
          </div>
        </div>
      )}

      {/* Validation Suites Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
          <h2 className="font-medium">Governance Suites</h2>
          <span className="text-xs text-neutral-500">Frozen suites — Metrics are observational</span>
        </div>

        {filteredSuites.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            {suites.length === 0 ? 'No validation suites found.' : 'No suites match the selected filters.'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-neutral-800/50 text-xs text-neutral-400">
              <tr>
                <th className="px-4 py-3 text-left">Suite</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-center">Scenarios</th>
                <th className="px-4 py-3 text-center">
                  <MetricTooltip>
                    <span className="cursor-help">Golden Compliance</span>
                  </MetricTooltip>
                </th>
                <th className="px-4 py-3 text-center">
                  <MetricTooltip>
                    <span className="cursor-help">Policy Containment</span>
                  </MetricTooltip>
                </th>
                {viewMode === 'operator' && (
                  <th className="px-4 py-3 text-center">Cohen&apos;s d</th>
                )}
                <th className="px-4 py-3 text-center">RM Trial Status</th>
                <th className="px-4 py-3 text-left">Last Validated</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {filteredSuites.map((suite) => {
                const typeInfo = formatType(suite.type);

                return (
                  <tr
                    key={suite.key}
                    className="hover:bg-neutral-800/30 cursor-pointer transition-colors"
                    onClick={() => router.push(`/superadmin/sales-bench/${suite.key}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {(suite.status === 'FROZEN' || suite.status === 'SYSTEM_VALIDATED') && (
                          <Lock className="w-4 h-4 text-blue-400" />
                        )}
                        {(suite.status === 'ARCHIVED' || suite.status === 'DEPRECATED') && (
                          <Archive className="w-4 h-4 text-neutral-500" />
                        )}
                        <div>
                          <p className="font-medium text-white">{suite.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-neutral-500">{suite.key}</p>
                            <SuiteStatusBadge status={suite.status} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-neutral-400">
                      {suite.scenario_count}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {suite.latest_run?.golden_pass_rate != null ? (
                        <span className="font-medium text-neutral-200">
                          {suite.latest_run.golden_pass_rate.toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-neutral-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {suite.latest_run?.kill_containment_rate != null ? (
                        <span className="font-medium text-neutral-200">
                          {suite.latest_run.kill_containment_rate.toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-neutral-600">-</span>
                      )}
                    </td>
                    {viewMode === 'operator' && (
                      <td className="px-4 py-3 text-center">
                        {suite.latest_run?.cohens_d != null ? (
                          <span className="font-medium text-neutral-200">
                            {suite.latest_run.cohens_d.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-neutral-600">-</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3 text-center">
                      <RMTrialBadge suite={suite} globalParityBroken={globalParityBroken} />
                    </td>
                    <td className="px-4 py-3">
                      {suite.latest_run ? (
                        <div className="flex items-center gap-1 text-neutral-500 text-xs">
                          <Clock className="w-3 h-3" />
                          {new Date(suite.latest_run.date).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-neutral-600 text-xs">Never</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="w-4 h-4 text-neutral-600" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer - Governance Disclaimer */}
      <div className="mt-6 p-4 bg-neutral-900/50 border border-neutral-800 rounded-lg">
        <p className="text-xs text-neutral-500 text-center">
          Sales-Bench is a governance and validation system. Metrics shown are observational and do not indicate sales success.
          <br />
          Do not use these metrics to tune, optimize, or adjust SIVA configuration without explicit governance approval.
        </p>
      </div>
    </div>
  );
}

// Wrap with ErrorBoundary to catch and display errors
export default function SalesBenchDashboard() {
  return (
    <ErrorBoundary>
      <SalesBenchDashboardInner />
    </ErrorBoundary>
  );
}
