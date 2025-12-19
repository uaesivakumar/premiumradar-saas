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
} from 'lucide-react';

interface Suite {
  suite_key: string;
  vertical: string;
  sub_vertical: string;
  region: string;
  name: string;
  description: string;
  status: 'DRAFT' | 'SYSTEM_VALIDATED' | 'HUMAN_VALIDATED' | 'GA_APPROVED' | 'DEPRECATED';
  scenario_count: number;
  last_run_at: string | null;
  last_run_result: {
    golden_pass_rate: number;
    kill_containment_rate: number;
    cohens_d: number;
  } | null;
  is_frozen: boolean;
  created_at: string;
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

export default function SalesBenchDashboard() {
  const [suites, setSuites] = useState<Suite[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVerticals, setExpandedVerticals] = useState<Set<string>>(new Set(['Banking']));
  const [expandedSubVerticals, setExpandedSubVerticals] = useState<Set<string>>(new Set(['Banking:Employee Banking']));
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
        setSuites(suitesData.suites || []);
      }
      if (dashboardData.success) {
        setStats(dashboardData.stats || null);
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

  const canRunSystemValidation = suite.status === 'DRAFT' || suite.status === 'SYSTEM_VALIDATED';
  const canStartHumanCalibration = suite.status === 'SYSTEM_VALIDATED';
  const canApproveForGA = suite.status === 'HUMAN_VALIDATED';

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

      {/* Context */}
      <div className="flex items-center gap-4 mb-4 text-xs text-neutral-500">
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

      {/* Actions */}
      <div className="border-t border-neutral-800 pt-4">
        <h4 className="text-xs font-medium text-neutral-400 mb-3">Governance Commands</h4>
        <div className="flex flex-wrap gap-2">
          {canRunSystemValidation && (
            <button
              onClick={() => onExecute('run-system-validation', suite.suite_key)}
              disabled={isExecuting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs rounded transition-colors disabled:opacity-50"
            >
              {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Run System Validation
            </button>
          )}

          {canStartHumanCalibration && (
            <button
              onClick={() => onExecute('start-human-calibration', suite.suite_key, { evaluator_count: 3 })}
              disabled={isExecuting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs rounded transition-colors disabled:opacity-50"
            >
              {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
              Start Human Calibration
            </button>
          )}

          {canApproveForGA && (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                placeholder="Approval notes..."
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
          )}

          {suite.status === 'GA_APPROVED' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-xs rounded">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Production Ready
            </div>
          )}
        </div>

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
