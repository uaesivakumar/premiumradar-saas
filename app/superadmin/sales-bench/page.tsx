'use client';

import { useState, useEffect, Component, ReactNode, ErrorInfo } from 'react';
import { useRouter } from 'next/navigation';
import {
  FlaskConical,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  RefreshCw,
  Zap,
  Shield,
  Target,
  Clock,
  AlertTriangle,
} from 'lucide-react';

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

interface SuiteSummary {
  key: string;
  name: string;
  type: string; // PRE_ENTRY, POST_ENTRY, etc.
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
}

interface DashboardStats {
  total_suites: number;
  total_runs: number;
  avg_golden_pass: number;
  avg_kill_containment: number;
  best_performer: string;
  insight: string;
}

function SalesBenchDashboardInner() {
  const router = useRouter();
  const [suites, setSuites] = useState<SuiteSummary[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/superadmin/os/sales-bench?action=dashboard');
      const data = await res.json();
      if (data.success && data.data) {
        setSuites(data.data.suites || []);
        setStats(data.data.stats || null);
      } else {
        // API error or unauthorized - show empty state
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
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const getTrend = (current: number, previous?: number) => {
    if (!previous) return { icon: Minus, color: 'text-neutral-500', label: 'New' };
    const diff = current - previous;
    if (diff > 2) return { icon: TrendingUp, color: 'text-emerald-400', label: `+${diff.toFixed(0)}%` };
    if (diff < -2) return { icon: TrendingDown, color: 'text-red-400', label: `${diff.toFixed(0)}%` };
    return { icon: Minus, color: 'text-neutral-500', label: 'Stable' };
  };

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-emerald-400';
    if (score >= 80) return 'text-amber-400';
    return 'text-red-400';
  };

  const formatType = (stage: string) => {
    const types: Record<string, { label: string; color: string }> = {
      'PRE_ENTRY': { label: 'Pre-Entry', color: 'bg-blue-500/20 text-blue-400' },
      'POST_ENTRY': { label: 'Post-Entry', color: 'bg-purple-500/20 text-purple-400' },
      'DISCOVERY': { label: 'Discovery', color: 'bg-amber-500/20 text-amber-400' },
    };
    return types[stage] || { label: stage, color: 'bg-neutral-500/20 text-neutral-400' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <FlaskConical className="w-8 h-8 text-violet-400 animate-pulse mx-auto mb-2" />
          <p className="text-neutral-400 text-sm">Loading Sales-Bench...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-violet-400" />
            SIVA Sales-Bench
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Behavioral validation & performance tracking
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Hero Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
              <Zap className="w-3 h-3" />
              GOLDEN PASS RATE
            </div>
            <p className={`text-3xl font-bold ${getScoreColor(stats.avg_golden_pass ?? 0)}`}>
              {(stats.avg_golden_pass ?? 0).toFixed(0)}%
            </p>
            <p className="text-xs text-neutral-600 mt-1">Qualified leads engaged</p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
              <Shield className="w-3 h-3" />
              KILL CONTAINMENT
            </div>
            <p className={`text-3xl font-bold ${getScoreColor(stats.avg_kill_containment ?? 0)}`}>
              {(stats.avg_kill_containment ?? 0).toFixed(0)}%
            </p>
            <p className="text-xs text-neutral-600 mt-1">Bad leads blocked</p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
              <Target className="w-3 h-3" />
              TOTAL RUNS
            </div>
            <p className="text-3xl font-bold text-white">
              {stats.total_runs}
            </p>
            <p className="text-xs text-neutral-600 mt-1">Across {stats.total_suites} suites</p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
              <TrendingUp className="w-3 h-3" />
              BEST PERFORMER
            </div>
            <p className="text-lg font-bold text-emerald-400 truncate">
              {stats.best_performer || '-'}
            </p>
            <p className="text-xs text-neutral-600 mt-1">Highest combined score</p>
          </div>
        </div>
      )}

      {/* Auto-Insight */}
      {stats?.insight && (
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-4 mb-6">
          <p className="text-violet-300 text-sm">
            <span className="font-medium text-violet-400">Insight:</span> {stats.insight}
          </p>
        </div>
      )}

      {/* Suites Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-800">
          <h2 className="font-medium">Validation Suites</h2>
        </div>

        {suites.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            No validation suites found. Create one to get started.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-neutral-800/50 text-xs text-neutral-400">
              <tr>
                <th className="px-4 py-3 text-left">Suite</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Vertical</th>
                <th className="px-4 py-3 text-left">Sub-Vertical</th>
                <th className="px-4 py-3 text-center">Scenarios</th>
                <th className="px-4 py-3 text-center">Golden %</th>
                <th className="px-4 py-3 text-center">Kill %</th>
                <th className="px-4 py-3 text-center">Cohen&apos;s d</th>
                <th className="px-4 py-3 text-center">Trend</th>
                <th className="px-4 py-3 text-left">Last Run</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {suites.map((suite) => {
                const typeInfo = formatType(suite.type);
                const goldenTrend = getTrend(
                  suite.latest_run?.golden_pass_rate || 0,
                  suite.previous_run?.golden_pass_rate
                );
                const TrendIcon = goldenTrend.icon;

                return (
                  <tr
                    key={suite.key}
                    className="hover:bg-neutral-800/30 cursor-pointer transition-colors"
                    onClick={() => router.push(`/superadmin/sales-bench/${suite.key}`)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{suite.name}</p>
                      <p className="text-xs text-neutral-500">{suite.key}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-300 capitalize">
                      {suite.vertical.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-neutral-300 capitalize">
                      {suite.sub_vertical.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-center text-neutral-400">
                      {suite.scenario_count}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {suite.latest_run ? (
                        <span className={`font-medium ${getScoreColor(suite.latest_run.golden_pass_rate)}`}>
                          {suite.latest_run.golden_pass_rate.toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-neutral-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {suite.latest_run ? (
                        <span className={`font-medium ${getScoreColor(suite.latest_run.kill_containment_rate)}`}>
                          {suite.latest_run.kill_containment_rate.toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-neutral-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {suite.latest_run ? (
                        <span className={`font-medium ${
                          suite.latest_run.cohens_d >= 2 ? 'text-emerald-400' :
                          suite.latest_run.cohens_d >= 0.8 ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {suite.latest_run.cohens_d.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-neutral-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className={`flex items-center justify-center gap-1 ${goldenTrend.color}`}>
                        <TrendIcon className="w-3 h-3" />
                        <span className="text-xs">{goldenTrend.label}</span>
                      </div>
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

      {/* Footer Help */}
      <div className="mt-6 text-center text-xs text-neutral-600">
        Click any suite to view detailed results, run validation, or download reports.
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
