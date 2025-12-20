'use client';

/**
 * Sales-Bench Governance Dashboard
 *
 * SIVA behavioral validation organized by vertical/sub-vertical/region.
 * Super Admin triggers, OS executes.
 *
 * Suite Status Progression:
 * DRAFT → SYSTEM_VALIDATED → HUMAN_VALIDATED → GA_APPROVED
 */

import { useState, useEffect } from 'react';
import {
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Play,
  Users,
  Shield,
  RefreshCw,
  Loader2,
  ChevronRight,
  ChevronDown,
  Building2,
  Globe,
  Layers,
  TrendingUp,
  Archive,
  XCircle,
  Calendar,
  Mail,
  Eye,
  FileText,
  User,
  Target,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface Scenario {
  id: string;
  path_type: 'GOLDEN' | 'KILL';
  expected_outcome: 'PASS' | 'FAIL' | 'BLOCK';
  entry_intent: string;
  success_condition: string;
  company_profile?: {
    name: string;
    employees: number;
    industry: string;
  };
  contact_profile?: {
    title: string;
    name: string;
  };
  signal_context?: {
    signal: string;
    strength: number;
  };
}

interface ValidationRun {
  id: string;  // API returns 'id' not 'run_id'
  run_id?: string;  // Alias for compatibility
  run_number: number;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  golden_pass_rate?: number | string;
  kill_containment_rate?: number | string;
  cohens_d?: number | string;
  started_at: string;
  ended_at?: string;
}

interface Suite {
  suite_key: string;
  vertical: string;
  sub_vertical: string;
  region: string;
  name: string;
  description: string;
  status: 'DRAFT' | 'SYSTEM_VALIDATED' | 'HUMAN_VALIDATED' | 'GA_APPROVED' | 'DEPRECATED';
  scenario_count: number;
  last_run_result: {
    golden_pass_rate: number;
    kill_containment_rate: number;
    cohens_d: number;
  } | null;
  is_frozen: boolean;
  frozen_at: string | null;
  created_at: string;
  system_validated_at: string | null;
  human_validated_at: string | null;
  ga_approved_at: string | null;
  version: number;
  base_suite_key: string | null;
  is_latest_version: boolean;
  version_notes: string | null;
}

interface SuitesByHierarchy {
  [vertical: string]: {
    [subVertical: string]: {
      [region: string]: Suite[];
    };
  };
}

interface DashboardStats {
  total_suites: number;
  by_status: {
    DRAFT: number;
    SYSTEM_VALIDATED: number;
    HUMAN_VALIDATED: number;
    GA_APPROVED: number;
    DEPRECATED: number;
  };
  pending_human_validation: number;
  ready_for_ga: number;
}

const STATUS_CONFIG = {
  DRAFT: { color: 'text-neutral-400', bg: 'bg-neutral-800', icon: Clock, label: 'Draft' },
  SYSTEM_VALIDATED: { color: 'text-blue-400', bg: 'bg-blue-500/10', icon: FlaskConical, label: 'System Validated' },
  HUMAN_VALIDATED: { color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Users, label: 'Human Validated' },
  GA_APPROVED: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: Shield, label: 'GA Approved' },
  DEPRECATED: { color: 'text-red-400', bg: 'bg-red-500/10', icon: Archive, label: 'Deprecated' },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function SalesBenchDashboard() {
  const [suites, setSuites] = useState<Suite[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVerticals, setExpandedVerticals] = useState<Set<string>>(new Set(['banking']));
  const [expandedSubVerticals, setExpandedSubVerticals] = useState<Set<string>>(new Set(['banking:employee_banking']));
  const [selectedSuite, setSelectedSuite] = useState<Suite | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    setError(null);

    try {
      const [suitesRes, dashboardRes] = await Promise.all([
        fetch('/api/superadmin/os/sales-bench'),
        fetch('/api/superadmin/os/sales-bench?action=dashboard'),
      ]);

      const suitesData = await suitesRes.json();
      const dashboardData = await dashboardRes.json();

      if (suitesData.success) {
        const suitesList = suitesData.suites || suitesData.data || [];
        setSuites(suitesList);

        // Calculate stats from suites if dashboard doesn't provide them
        if (!dashboardData.success || !dashboardData.stats) {
          const statsByStatus: Record<string, number> = {
            DRAFT: 0,
            SYSTEM_VALIDATED: 0,
            HUMAN_VALIDATED: 0,
            GA_APPROVED: 0,
            DEPRECATED: 0,
          };
          suitesList.forEach((s: Suite) => {
            const status = s.status || 'DRAFT';
            if (status in statsByStatus) {
              statsByStatus[status]++;
            }
          });
          setStats({
            total_suites: suitesList.length,
            by_status: statsByStatus as DashboardStats['by_status'],
            pending_human_validation: statsByStatus.SYSTEM_VALIDATED,
            ready_for_ga: statsByStatus.HUMAN_VALIDATED,
          });
        } else {
          setStats(dashboardData.stats);
        }
      }
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to load Sales-Bench data');
      console.error('[SalesBench] Load error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function executeCommand(command: string, suiteKey: string, params: Record<string, unknown> = {}) {
    setIsExecuting(true);
    try {
      const response = await fetch('/api/superadmin/os/sales-bench', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, suite_key: suiteKey, ...params }),
      });

      const result = await response.json();
      if (result.success) {
        await loadData();
      } else {
        alert(`Command failed: ${result.error}`);
      }
    } catch (err) {
      console.error('[SalesBench] Command error:', err);
      alert('Failed to execute command');
    } finally {
      setIsExecuting(false);
    }
  }

  // Organize suites by hierarchy
  const suitesByHierarchy: SuitesByHierarchy = {};
  suites.forEach((suite) => {
    if (!suitesByHierarchy[suite.vertical]) {
      suitesByHierarchy[suite.vertical] = {};
    }
    if (!suitesByHierarchy[suite.vertical][suite.sub_vertical]) {
      suitesByHierarchy[suite.vertical][suite.sub_vertical] = {};
    }
    if (!suitesByHierarchy[suite.vertical][suite.sub_vertical][suite.region]) {
      suitesByHierarchy[suite.vertical][suite.sub_vertical][suite.region] = [];
    }
    suitesByHierarchy[suite.vertical][suite.sub_vertical][suite.region].push(suite);
  });

  const toggleVertical = (vertical: string) => {
    const newSet = new Set(expandedVerticals);
    if (newSet.has(vertical)) {
      newSet.delete(vertical);
    } else {
      newSet.add(vertical);
    }
    setExpandedVerticals(newSet);
  };

  const toggleSubVertical = (key: string) => {
    const newSet = new Set(expandedSubVerticals);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedSubVerticals(newSet);
  };

  if (isLoading && !suites.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-5 h-5 text-neutral-500 animate-spin mx-auto mb-3" />
          <p className="text-neutral-500 text-sm">Loading Sales-Bench...</p>
        </div>
      </div>
    );
  }

  if (error && !suites.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-3" />
          <p className="text-neutral-400 text-sm mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-white flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-violet-400" />
            Sales-Bench
          </h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            SIVA behavioral validation
            {lastUpdated && (
              <span className="text-neutral-600 ml-2">· {lastUpdated.toLocaleTimeString()}</span>
            )}
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-5 gap-3">
          <StatCard
            label="Total Suites"
            value={stats.total_suites}
            icon={Layers}
            color="neutral"
          />
          <StatCard
            label="Draft"
            value={stats.by_status.DRAFT}
            icon={Clock}
            color="neutral"
          />
          <StatCard
            label="System Validated"
            value={stats.by_status.SYSTEM_VALIDATED}
            icon={FlaskConical}
            color="blue"
          />
          <StatCard
            label="Human Validated"
            value={stats.by_status.HUMAN_VALIDATED}
            icon={Users}
            color="amber"
          />
          <StatCard
            label="GA Approved"
            value={stats.by_status.GA_APPROVED}
            icon={Shield}
            color="emerald"
          />
        </div>
      )}

      {/* Suite Hierarchy */}
      <div className="bg-neutral-900/50 rounded-lg border border-neutral-800">
        <div className="p-4 border-b border-neutral-800">
          <h2 className="text-sm font-medium text-neutral-300">Validation Suites by Context</h2>
          <p className="text-xs text-neutral-600 mt-0.5">Vertical → Sub-Vertical → Region</p>
        </div>

        <div className="divide-y divide-neutral-800/50">
          {Object.entries(suitesByHierarchy).map(([vertical, subVerticals]) => (
            <div key={vertical}>
              {/* Vertical Level */}
              <button
                onClick={() => toggleVertical(vertical)}
                className="w-full flex items-center gap-3 p-4 hover:bg-neutral-800/30 transition-colors"
              >
                {expandedVerticals.has(vertical) ? (
                  <ChevronDown className="w-4 h-4 text-neutral-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-neutral-500" />
                )}
                <Building2 className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-medium text-white">{vertical}</span>
                <span className="text-xs text-neutral-600">
                  {Object.keys(subVerticals).length} sub-verticals
                </span>
              </button>

              {/* Sub-Vertical Level */}
              {expandedVerticals.has(vertical) && (
                <div className="bg-neutral-900/30">
                  {Object.entries(subVerticals).map(([subVertical, regions]) => {
                    const subKey = `${vertical}:${subVertical}`;
                    return (
                      <div key={subKey}>
                        <button
                          onClick={() => toggleSubVertical(subKey)}
                          className="w-full flex items-center gap-3 pl-10 pr-4 py-3 hover:bg-neutral-800/30 transition-colors"
                        >
                          {expandedSubVerticals.has(subKey) ? (
                            <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                          )}
                          <Layers className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-sm text-neutral-300">{subVertical}</span>
                          <span className="text-xs text-neutral-600">
                            {Object.keys(regions).length} regions
                          </span>
                        </button>

                        {/* Region Level */}
                        {expandedSubVerticals.has(subKey) && (
                          <div className="bg-neutral-900/20">
                            {Object.entries(regions).map(([region, regionSuites]) => (
                              <div key={region} className="pl-16 pr-4 py-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <Globe className="w-3 h-3 text-emerald-400" />
                                  <span className="text-xs font-medium text-neutral-400">{region}</span>
                                </div>

                                {/* Suites in Region */}
                                <div className="space-y-2 ml-5">
                                  {regionSuites.map((suite) => (
                                    <SuiteCard
                                      key={suite.suite_key}
                                      suite={suite}
                                      onSelect={() => setSelectedSuite(suite)}
                                      isSelected={selectedSuite?.suite_key === suite.suite_key}
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {Object.keys(suitesByHierarchy).length === 0 && (
            <div className="p-8 text-center">
              <FlaskConical className="w-8 h-8 text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-500 text-sm">No validation suites found</p>
              <p className="text-neutral-600 text-xs mt-1">Create suites via OS API</p>
            </div>
          )}
        </div>
      </div>

      {/* Selected Suite Detail Panel */}
      {selectedSuite && (
        <SuiteDetailPanel
          suite={selectedSuite}
          onClose={() => setSelectedSuite(null)}
          onExecute={executeCommand}
          isExecuting={isExecuting}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'neutral' | 'blue' | 'amber' | 'emerald';
}) {
  const colors = {
    neutral: 'text-neutral-400',
    blue: 'text-blue-400',
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
  };

  return (
    <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-neutral-500 uppercase tracking-wide">{label}</span>
        <Icon className={`w-3.5 h-3.5 ${colors[color]}`} />
      </div>
      <span className="text-xl font-semibold text-white">{value}</span>
    </div>
  );
}

function SuiteCard({
  suite,
  onSelect,
  isSelected,
}: {
  suite: Suite;
  onSelect: () => void;
  isSelected: boolean;
}) {
  const config = STATUS_CONFIG[suite.status];
  const StatusIcon = config.icon;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-lg border transition-colors ${
        isSelected
          ? 'bg-violet-500/10 border-violet-500/30'
          : 'bg-neutral-800/30 border-neutral-800 hover:bg-neutral-800/50'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white">{suite.name}</span>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${config.bg} ${config.color}`}>
          <StatusIcon className="w-3 h-3" />
          {config.label}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-neutral-500">
        <span>{suite.scenario_count} scenarios</span>
        {suite.version > 0 && (
          <span className="text-violet-400">v{suite.version}</span>
        )}
        {suite.is_frozen && (
          <span className="text-blue-400">Frozen</span>
        )}
        {suite.last_run_result && (
          <>
            <span className="text-emerald-400">
              {(suite.last_run_result.golden_pass_rate * 100).toFixed(0)}% Golden
            </span>
            <span className="text-amber-400">
              {(suite.last_run_result.kill_containment_rate * 100).toFixed(0)}% Kill
            </span>
          </>
        )}
        <span className="ml-auto flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDate(suite.created_at)}
        </span>
      </div>
    </button>
  );
}

function SuiteDetailPanel({
  suite,
  onClose,
  onExecute,
  isExecuting,
}: {
  suite: Suite;
  onClose: () => void;
  onExecute: (command: string, suiteKey: string, params?: Record<string, unknown>) => Promise<void>;
  isExecuting: boolean;
}) {
  const config = STATUS_CONFIG[suite.status];
  const StatusIcon = config.icon;
  const [approvalNotes, setApprovalNotes] = useState('');
  const [evaluatorEmails, setEvaluatorEmails] = useState('');
  const [showCalibrationForm, setShowCalibrationForm] = useState(false);
  const [inviteLinks, setInviteLinks] = useState<Array<{ email: string; scoring_url: string }>>([]);
  const [showInviteLinks, setShowInviteLinks] = useState(false);

  // New state for scenarios and validation
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loadingScenarios, setLoadingScenarios] = useState(false);
  const [showScenarios, setShowScenarios] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationRun | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  // Run history state
  const [runHistory, setRunHistory] = useState<ValidationRun[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [runScenarios, setRunScenarios] = useState<Record<string, unknown[]>>({});

  // Check if there's a run currently in progress
  const hasRunningRun = runHistory.some(r => r.status === 'RUNNING');
  const canRunSystemValidation = (suite.status === 'DRAFT' || suite.status === 'SYSTEM_VALIDATED') && !hasRunningRun;
  const canStartHumanCalibration = suite.status === 'SYSTEM_VALIDATED';
  const canApproveForGA = suite.status === 'HUMAN_VALIDATED';

  // Load scenarios and run history when panel opens
  useEffect(() => {
    loadScenarios();
    loadRunHistory();
  }, [suite.suite_key]);

  async function loadRunHistory() {
    setLoadingHistory(true);
    try {
      const response = await fetch(`/api/superadmin/os/sales-bench?action=history&suite_key=${suite.suite_key}`);
      const result = await response.json();
      if (result.success && result.runs) {
        setRunHistory(result.runs);
      }
    } catch (err) {
      console.error('Failed to load run history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function loadScenarios() {
    setLoadingScenarios(true);
    try {
      const response = await fetch(`/api/superadmin/os/sales-bench?action=scenarios&suite_key=${suite.suite_key}`);
      const result = await response.json();
      if (result.success && result.scenarios) {
        setScenarios(result.scenarios);
      }
    } catch (err) {
      console.error('Failed to load scenarios:', err);
    } finally {
      setLoadingScenarios(false);
    }
  }

  // Run system validation with feedback
  const handleRunValidation = async () => {
    setValidationResult(null);
    setValidationError(null);

    try {
      const response = await fetch('/api/superadmin/os/sales-bench', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: 'run-system-validation',
          suite_key: suite.suite_key,
          run_mode: 'FULL'
        }),
      });

      const result = await response.json();
      if (result.success && result.data) {
        setValidationResult({
          run_id: result.data.run_id,
          run_number: result.data.run_number,
          status: result.data.status,
          started_at: new Date().toISOString(),
        });
      } else {
        setValidationError(result.error || result.message || 'Validation failed');
      }
    } catch (err) {
      setValidationError('Network error. Please try again.');
    }
  };

  const handleStartCalibration = async () => {
    const emails = evaluatorEmails.split(',').map(e => e.trim()).filter(e => e);
    if (emails.length < 2) {
      alert('Please enter at least 2 evaluator emails (comma-separated)');
      return;
    }

    setValidationError(null);

    try {
      const response = await fetch('/api/superadmin/os/sales-bench', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: 'start-human-calibration',
          suite_key: suite.suite_key,
          evaluator_emails: emails,
          evaluator_count: emails.length
        }),
      });

      const result = await response.json();
      if (result.success && result.data?.invites) {
        setInviteLinks(result.data.invites);
        setShowInviteLinks(true);
        setShowCalibrationForm(false);
        setShowEmailPreview(false);
        setEvaluatorEmails('');
      } else {
        setValidationError(result.error || result.message || 'Failed to start calibration');
      }
    } catch (err) {
      setValidationError('Network error. Please try again.');
    }
  };

  // Parse emails for preview
  const parsedEmails = evaluatorEmails.split(',').map(e => e.trim()).filter(e => e && e.includes('@'));

  return (
    <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-white">{suite.name}</h3>
          <p className="text-xs text-neutral-500 mt-0.5">{suite.suite_key}</p>
        </div>
        <button
          onClick={onClose}
          className="text-neutral-500 hover:text-white transition-colors"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Status & Metrics */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-neutral-800/50 rounded p-2">
          <span className="text-[10px] text-neutral-500 block mb-1">Status</span>
          <div className={`flex items-center gap-1 ${config.color}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{config.label}</span>
          </div>
        </div>
        <div className="bg-neutral-800/50 rounded p-2">
          <span className="text-[10px] text-neutral-500 block mb-1">Scenarios</span>
          <span className="text-sm font-medium text-white">{suite.scenario_count}</span>
        </div>
        {suite.last_run_result && (
          <>
            <div className="bg-neutral-800/50 rounded p-2">
              <span className="text-[10px] text-neutral-500 block mb-1">Golden Pass</span>
              <span className="text-sm font-medium text-emerald-400">
                {(suite.last_run_result.golden_pass_rate * 100).toFixed(1)}%
              </span>
            </div>
            <div className="bg-neutral-800/50 rounded p-2">
              <span className="text-[10px] text-neutral-500 block mb-1">Cohen&apos;s d</span>
              <span className="text-sm font-medium text-violet-400">
                {suite.last_run_result.cohens_d.toFixed(2)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Context + Dates */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 text-xs text-neutral-500">
          <div className="flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            {suite.vertical}
          </div>
          <div className="flex items-center gap-1">
            <Layers className="w-3 h-3" />
            {suite.sub_vertical}
          </div>
          <div className="flex items-center gap-1">
            <Globe className="w-3 h-3" />
            {suite.region}
          </div>
          {suite.is_frozen && (
            <span className="text-blue-400">Frozen</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-neutral-600">
          <Calendar className="w-3 h-3" />
          Created {formatDate(suite.created_at)}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-neutral-800/30 rounded p-3 mb-4">
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div>
            <span className="text-neutral-500 block">Created</span>
            <span className="text-white">{formatDate(suite.created_at)}</span>
          </div>
          <div>
            <span className="text-neutral-500 block">System Validated</span>
            <span className={suite.system_validated_at ? 'text-blue-400' : 'text-neutral-600'}>
              {suite.system_validated_at ? formatDate(suite.system_validated_at) : 'Pending'}
            </span>
          </div>
          <div>
            <span className="text-neutral-500 block">Human Validated</span>
            <span className={suite.human_validated_at ? 'text-amber-400' : 'text-neutral-600'}>
              {suite.human_validated_at ? formatDate(suite.human_validated_at) : 'Pending'}
            </span>
          </div>
          <div>
            <span className="text-neutral-500 block">GA Approved</span>
            <span className={suite.ga_approved_at ? 'text-emerald-400' : 'text-neutral-600'}>
              {suite.ga_approved_at ? formatDate(suite.ga_approved_at) : 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Scenarios Preview Section */}
      <div className="border-t border-neutral-800 pt-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Scenarios ({scenarios.length || suite.scenario_count})
          </h4>
          <button
            onClick={() => setShowScenarios(!showScenarios)}
            className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300"
          >
            <Eye className="w-3 h-3" />
            {showScenarios ? 'Hide' : 'Preview'}
          </button>
        </div>

        {/* Scenario counts by type */}
        <div className="flex gap-3 mb-2">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 rounded text-[10px]">
            <Target className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400">{scenarios.filter(s => s.path_type === 'GOLDEN').length} GOLDEN</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 rounded text-[10px]">
            <XCircle className="w-3 h-3 text-red-400" />
            <span className="text-red-400">{scenarios.filter(s => s.path_type === 'KILL').length} KILL</span>
          </div>
        </div>

        {/* Scenarios list (compact summary - 5 samples only) */}
        {showScenarios && (
          <div className="bg-neutral-800/30 rounded p-2">
            {loadingScenarios ? (
              <div className="flex items-center gap-2 text-neutral-500 text-xs py-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading...
              </div>
            ) : scenarios.length === 0 ? (
              <p className="text-neutral-500 text-xs py-1">No scenarios linked</p>
            ) : (
              <div className="space-y-0.5">
                <p className="text-[10px] text-neutral-600 mb-1">Sample (5 of {scenarios.length}):</p>
                {scenarios.slice(0, 5).map((s) => (
                  <div key={s.id} className="flex items-center gap-1.5 text-[10px] py-0.5 px-1 bg-neutral-900/30 rounded">
                    <span className={`w-12 text-center px-1 py-0.5 rounded text-[9px] ${s.path_type === 'GOLDEN' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                      {s.path_type}
                    </span>
                    <span className="text-neutral-400 truncate">{s.company_profile?.name || 'Company'}</span>
                    <span className="text-neutral-600">→</span>
                    <span className="text-neutral-500">{s.contact_profile?.title || 'Contact'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-neutral-800 pt-4">
        <h4 className="text-xs font-medium text-neutral-400 mb-3">Governance Commands</h4>

        {/* Error Display */}
        {validationError && (
          <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded">
            <div className="flex items-center gap-2 text-red-400 text-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{validationError}</span>
            </div>
          </div>
        )}

        {/* Validation Result Display */}
        {validationResult && (
          <div className="mb-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              {validationResult.status === 'RUNNING' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : validationResult.status === 'COMPLETED' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
              <span className="text-xs font-medium">
                Run #{validationResult.run_number} - {validationResult.status}
              </span>
            </div>
            <div className="text-[10px] text-neutral-400">
              <p>Run ID: {validationResult.id || validationResult.run_id}</p>
              <p>Started: {formatDateTime(validationResult.started_at)}</p>
              {validationResult.golden_pass_rate !== undefined && (
                <p className="text-emerald-400 mt-1">
                  Golden Pass: {(validationResult.golden_pass_rate * 100).toFixed(1)}%
                </p>
              )}
            </div>
          </div>
        )}

        {/* System Validation */}
        {(suite.status === 'DRAFT' || suite.status === 'SYSTEM_VALIDATED') && (
          <div className="mb-3">
            {hasRunningRun ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span className="text-amber-400 text-xs">Run in progress...</span>
                <span className="text-neutral-500 text-[10px]">Wait for completion before starting new run</span>
              </div>
            ) : (
              <>
                <button
                  onClick={handleRunValidation}
                  disabled={isExecuting}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs rounded transition-colors disabled:opacity-50"
                >
                  {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  Run System Validation
                </button>
                <p className="text-[10px] text-neutral-600 mt-1">
                  SIVA scores all {scenarios.length || suite.scenario_count} scenarios ({scenarios.filter(s => s.path_type === 'GOLDEN').length} golden, {scenarios.filter(s => s.path_type === 'KILL').length} kill)
                </p>
              </>
            )}
          </div>
        )}

        {/* Invite Links Display */}
        {showInviteLinks && inviteLinks.length > 0 && (
          <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-medium">Calibration Started - Send These Links</span>
              </div>
              <button
                onClick={() => setShowInviteLinks(false)}
                className="text-neutral-500 hover:text-white text-xs"
              >
                Dismiss
              </button>
            </div>
            <p className="text-[10px] text-neutral-500 mb-2">
              Copy and send each link to the corresponding evaluator. They can score scenarios without logging in.
            </p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {inviteLinks.map((invite, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-neutral-400 w-32 truncate">{invite.email}</span>
                  <input
                    type="text"
                    value={invite.scoring_url}
                    readOnly
                    className="flex-1 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-neutral-300 text-[10px] select-all"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(invite.scoring_url);
                    }}
                    className="px-2 py-1 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 rounded text-[10px]"
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Human Calibration */}
        {canStartHumanCalibration && !showInviteLinks && (
          <div className="mb-3">
            {!showCalibrationForm ? (
              <button
                onClick={() => setShowCalibrationForm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs rounded transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Start Human Calibration
              </button>
            ) : !showEmailPreview ? (
              <div className="bg-neutral-800/50 rounded p-3 border border-amber-500/20">
                <div className="flex items-center gap-2 text-amber-400 mb-2">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-medium">Human Calibration Setup</span>
                </div>
                <p className="text-[10px] text-neutral-500 mb-2">
                  Enter evaluator emails. They will receive a link to score {scenarios.length || suite.scenario_count} scenarios.
                  Need at least 2 evaluators for Spearman correlation.
                </p>
                <input
                  type="text"
                  placeholder="email1@example.com, email2@example.com"
                  value={evaluatorEmails}
                  onChange={(e) => setEvaluatorEmails(e.target.value)}
                  className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 mb-2"
                />

                {/* Parsed emails preview */}
                {parsedEmails.length > 0 && (
                  <div className="mb-2 p-2 bg-neutral-900/50 rounded text-[10px]">
                    <span className="text-neutral-500">Will invite {parsedEmails.length} evaluator(s):</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {parsedEmails.map((email, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded">
                          {email}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowEmailPreview(true)}
                    disabled={parsedEmails.length < 2}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs rounded transition-colors disabled:opacity-50"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview & Confirm
                  </button>
                  <button
                    onClick={() => { setShowCalibrationForm(false); setEvaluatorEmails(''); }}
                    className="px-3 py-1.5 text-neutral-500 hover:text-white text-xs rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                {parsedEmails.length < 2 && parsedEmails.length > 0 && (
                  <p className="text-[10px] text-amber-500 mt-1">Need at least 2 valid emails</p>
                )}
              </div>
            ) : (
              /* Email Preview Confirmation */
              <div className="bg-neutral-800/50 rounded p-3 border border-amber-500/20">
                <div className="flex items-center gap-2 text-amber-400 mb-3">
                  <Mail className="w-4 h-4" />
                  <span className="text-xs font-medium">Confirm Calibration Invites</span>
                </div>

                <div className="bg-neutral-900/50 rounded p-3 mb-3 text-[10px]">
                  <p className="text-neutral-400 mb-2">Each evaluator will receive:</p>
                  <div className="border-l-2 border-amber-500/50 pl-2 text-neutral-300 space-y-1">
                    <p>• Unique scoring link (no login required)</p>
                    <p>• {scenarios.length || suite.scenario_count} scenarios to evaluate</p>
                    <p>• Shuffled order (reduces bias)</p>
                    <p>• 7 days to complete</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-neutral-700">
                    <p className="text-neutral-500 mb-1">Evaluators:</p>
                    {parsedEmails.map((email, i) => (
                      <div key={i} className="flex items-center gap-2 py-1">
                        <span className="text-amber-400">{i + 1}.</span>
                        <span className="text-white">{email}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleStartCalibration}
                    disabled={isExecuting}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs rounded transition-colors disabled:opacity-50"
                  >
                    {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                    Create Invites
                  </button>
                  <button
                    onClick={() => setShowEmailPreview(false)}
                    className="px-3 py-1.5 text-neutral-500 hover:text-white text-xs rounded transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => { setShowCalibrationForm(false); setShowEmailPreview(false); setEvaluatorEmails(''); }}
                    className="px-3 py-1.5 text-neutral-500 hover:text-white text-xs rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {!showCalibrationForm && (
              <p className="text-[10px] text-neutral-600 mt-1">Invite human evaluators to score scenarios for SIVA correlation</p>
            )}
          </div>
        )}

        {/* GA Approval */}
        {canApproveForGA && (
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Approval notes (required)..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="flex-1 px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
              />
              <button
                onClick={() => onExecute('approve-for-ga', suite.suite_key, { approval_notes: approvalNotes })}
                disabled={isExecuting || !approvalNotes}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs rounded transition-colors disabled:opacity-50"
              >
                {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                Approve for GA
              </button>
            </div>
            <p className="text-[10px] text-neutral-600 mt-1">Mark suite ready for production after human validation passes</p>
          </div>
        )}

        {/* GA Approved Badge */}
        {suite.status === 'GA_APPROVED' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-xs rounded">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Production Ready
            </div>
          </div>
        )}

        {/* Download Report - available for SYSTEM_VALIDATED and above */}
        {(suite.status === 'SYSTEM_VALIDATED' || suite.status === 'HUMAN_VALIDATED' || suite.status === 'GA_APPROVED') && (
          <div className="mt-3">
            <a
              href={`/api/superadmin/os/sales-bench/report?suite_key=${suite.suite_key}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 text-xs rounded transition-colors w-fit"
            >
              <FileText className="w-3.5 h-3.5" />
              Download Benchmark Report
              <ExternalLink className="w-3 h-3" />
            </a>
            <p className="text-[10px] text-neutral-600 mt-1">Professional report for investors & stakeholders (print to PDF)</p>
          </div>
        )}

        {/* Run History Table */}
        {runHistory.length > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-800/50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium text-neutral-300">Run History</h4>
              <button
                onClick={loadRunHistory}
                disabled={loadingHistory}
                className="text-[10px] text-neutral-500 hover:text-white"
              >
                {loadingHistory ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            <div className="space-y-2">
              {runHistory.map((run) => (
                <div
                  key={run.id}
                  className={`bg-neutral-900/50 rounded border ${
                    run.status === 'RUNNING' ? 'border-amber-500/30' :
                    run.status === 'COMPLETED' ? 'border-emerald-500/20' :
                    'border-neutral-700/30'
                  }`}
                >
                  <div
                    className="flex items-center justify-between p-2 cursor-pointer hover:bg-neutral-800/30"
                    onClick={() => setExpandedRunId(expandedRunId === run.id ? null : run.id)}
                  >
                    <div className="flex items-center gap-2">
                      {run.status === 'RUNNING' ? (
                        <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                      ) : run.status === 'COMPLETED' ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <XCircle className="w-3 h-3 text-neutral-500" />
                      )}
                      <span className="text-xs text-white">Run #{run.run_number}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        run.status === 'RUNNING' ? 'bg-amber-500/10 text-amber-400' :
                        run.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                        'bg-neutral-700/30 text-neutral-500'
                      }`}>
                        {run.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {run.status === 'COMPLETED' && (
                        <>
                          <span className="text-[10px] text-emerald-400">
                            Golden: {typeof run.golden_pass_rate === 'number'
                              ? `${(run.golden_pass_rate).toFixed(1)}%`
                              : `${parseFloat(String(run.golden_pass_rate || '0')).toFixed(1)}%`}
                          </span>
                          <span className="text-[10px] text-blue-400">
                            Kill: {typeof run.kill_containment_rate === 'number'
                              ? `${(run.kill_containment_rate).toFixed(1)}%`
                              : `${parseFloat(String(run.kill_containment_rate || '0')).toFixed(1)}%`}
                          </span>
                        </>
                      )}
                      <span className="text-[10px] text-neutral-500">
                        {formatDateTime(run.started_at)}
                      </span>
                      {expandedRunId === run.id ? (
                        <ChevronDown className="w-3 h-3 text-neutral-400" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-neutral-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Run Details */}
                  {expandedRunId === run.id && (
                    <div className="px-3 pb-3 border-t border-neutral-800/50">
                      <div className="grid grid-cols-4 gap-2 mt-2 text-[10px]">
                        <div>
                          <span className="text-neutral-500">Run ID:</span>
                          <p className="text-neutral-300 truncate">{run.id}</p>
                        </div>
                        <div>
                          <span className="text-neutral-500">Started:</span>
                          <p className="text-neutral-300">{formatDateTime(run.started_at)}</p>
                        </div>
                        {run.ended_at && (
                          <div>
                            <span className="text-neutral-500">Completed:</span>
                            <p className="text-neutral-300">{formatDateTime(run.ended_at)}</p>
                          </div>
                        )}
                        {run.cohens_d && (
                          <div>
                            <span className="text-neutral-500">Cohen&apos;s d:</span>
                            <p className="text-violet-400 font-medium">
                              {typeof run.cohens_d === 'number'
                                ? run.cohens_d.toFixed(2)
                                : parseFloat(String(run.cohens_d)).toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>

                      {run.status === 'COMPLETED' && (
                        <div className="mt-3 pt-2 border-t border-neutral-800/30">
                          <p className="text-[10px] text-neutral-500 mb-1">Performance Summary:</p>
                          <div className="flex gap-4">
                            <div className="flex-1 bg-emerald-500/5 rounded p-2">
                              <p className="text-[9px] text-neutral-500">Golden Path Success</p>
                              <p className="text-lg font-bold text-emerald-400">
                                {parseFloat(String(run.golden_pass_rate || '0')).toFixed(1)}%
                              </p>
                              <p className="text-[9px] text-neutral-600">of qualified leads engaged</p>
                            </div>
                            <div className="flex-1 bg-blue-500/5 rounded p-2">
                              <p className="text-[9px] text-neutral-500">Kill Path Containment</p>
                              <p className="text-lg font-bold text-blue-400">
                                {parseFloat(String(run.kill_containment_rate || '0')).toFixed(1)}%
                              </p>
                              <p className="text-[9px] text-neutral-600">of bad leads blocked</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Progression */}
        <div className="mt-4 pt-4 border-t border-neutral-800/50">
          <div className="flex items-center justify-between">
            {['DRAFT', 'SYSTEM_VALIDATED', 'HUMAN_VALIDATED', 'GA_APPROVED'].map((status, i, arr) => {
              const isComplete = ['DRAFT', 'SYSTEM_VALIDATED', 'HUMAN_VALIDATED', 'GA_APPROVED'].indexOf(suite.status) >= i;
              const isCurrent = suite.status === status;
              return (
                <div key={status} className="flex items-center">
                  <div className={`flex items-center gap-1 ${isComplete ? 'text-emerald-400' : 'text-neutral-600'}`}>
                    {isComplete ? (
                      <CheckCircle2 className={`w-4 h-4 ${isCurrent ? 'text-violet-400' : ''}`} />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-neutral-600" />
                    )}
                    <span className={`text-[10px] ${isCurrent ? 'text-violet-400 font-medium' : ''}`}>
                      {STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].label}
                    </span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className={`w-8 h-px mx-2 ${isComplete ? 'bg-emerald-500/50' : 'bg-neutral-700'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
