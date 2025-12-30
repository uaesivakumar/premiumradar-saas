'use client';

/**
 * S339: Runtime Readiness Panel
 *
 * Shows explicit runtime eligibility checks - NOT just a binary "READY".
 * Banks will ask: "ready for what?"
 *
 * Checks:
 * - Vertical resolved
 * - Sub-vertical resolved
 * - Persona resolved
 * - Active policy bound
 * - MVT complete (kill rules, signals, scenarios)
 * - Signals resolvable
 * - Envelope buildable
 * - NBA ready
 * - Replay eligible
 */

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Shield,
  Layers,
  Users,
  FileText,
  Target,
  Zap,
  Package,
  Play,
  History,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

export interface RuntimeCheck {
  check: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

export interface RuntimeReadiness {
  entity_type: 'sub-vertical' | 'persona';
  entity_id: string;
  entity_name: string;
  overall_eligible: boolean;
  mvt_certified: boolean;
  checks: RuntimeCheck[];
  checked_at: string;
}

interface RuntimeReadinessPanelProps {
  entityType: 'sub-vertical' | 'persona';
  entityId: string;
  className?: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RuntimeReadinessPanel({
  entityType,
  entityId,
  className = '',
}: RuntimeReadinessPanelProps) {
  const [readiness, setReadiness] = useState<RuntimeReadiness | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReadiness = useCallback(async () => {
    if (!entityId) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/superadmin/controlplane/runtime-check/${entityType}/${entityId}`
      );

      // Handle non-ok responses before trying to parse JSON
      if (!res.ok) {
        let errorMsg = `HTTP ${res.status}`;
        try {
          const errorData = await res.json();
          errorMsg = errorData.error || errorData.message || errorMsg;
        } catch {
          // Response might not be JSON
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to check runtime readiness');
      }

      setReadiness(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check readiness');
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    loadReadiness();
  }, [loadReadiness]);

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const getCheckIcon = (check: RuntimeCheck) => {
    const iconMap: Record<string, React.ReactNode> = {
      vertical_resolved: <Layers className="w-4 h-4" />,
      sub_vertical_resolved: <Layers className="w-4 h-4" />,
      persona_resolved: <Users className="w-4 h-4" />,
      policy_active: <FileText className="w-4 h-4" />,
      mvt_complete: <Target className="w-4 h-4" />,
      signals_resolvable: <Zap className="w-4 h-4" />,
      envelope_buildable: <Package className="w-4 h-4" />,
      nba_ready: <Play className="w-4 h-4" />,
      replay_eligible: <History className="w-4 h-4" />,
    };
    return iconMap[check.check] || <Shield className="w-4 h-4" />;
  };

  const getStatusColor = (status: RuntimeCheck['status']) => {
    switch (status) {
      case 'pass':
        return 'text-emerald-400';
      case 'fail':
        return 'text-red-400';
      case 'warning':
        return 'text-amber-400';
    }
  };

  const getStatusIcon = (status: RuntimeCheck['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  if (isLoading) {
    return (
      <div className={`bg-neutral-900/50 border border-neutral-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-neutral-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Checking runtime readiness...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-500/10 border border-red-500/20 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-400">
            <XCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
          <button
            onClick={loadReadiness}
            className="p-1 text-neutral-500 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (!readiness) return null;

  const passCount = readiness.checks.filter((c) => c.status === 'pass').length;
  const failCount = readiness.checks.filter((c) => c.status === 'fail').length;
  const warnCount = readiness.checks.filter((c) => c.status === 'warning').length;

  return (
    <div
      className={`border rounded-lg overflow-hidden ${
        readiness.overall_eligible
          ? 'bg-emerald-500/5 border-emerald-500/20'
          : 'bg-red-500/5 border-red-500/20'
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Shield
            className={`w-5 h-5 ${
              readiness.overall_eligible ? 'text-emerald-400' : 'text-red-400'
            }`}
          />
          <div>
            <h3 className="text-sm font-medium text-white">Runtime Readiness</h3>
            <p className="text-[10px] text-neutral-500">
              {readiness.overall_eligible
                ? 'Eligible for runtime execution'
                : 'Not eligible - resolve issues below'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Summary badges */}
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">
              {passCount} pass
            </span>
            {failCount > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded">
                {failCount} fail
              </span>
            )}
            {warnCount > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                {warnCount} warn
              </span>
            )}
          </div>
          <button
            onClick={loadReadiness}
            className="p-1 text-neutral-500 hover:text-white transition-colors"
            title="Refresh checks"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* MVT Certification Status */}
      <div
        className={`px-4 py-2 border-b border-neutral-800 ${
          readiness.mvt_certified ? 'bg-emerald-500/10' : 'bg-amber-500/10'
        }`}
      >
        <div className="flex items-center gap-2">
          {readiness.mvt_certified ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          )}
          <span
            className={`text-xs font-medium ${
              readiness.mvt_certified ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            MVT {readiness.mvt_certified ? 'CERTIFIED' : 'NOT CERTIFIED'}
          </span>
          {!readiness.mvt_certified && (
            <span className="text-[10px] text-neutral-500">
              - resolve required signals, scenarios, kill rules
            </span>
          )}
        </div>
      </div>

      {/* Checks List */}
      <div className="divide-y divide-neutral-800/50">
        {readiness.checks.map((check, idx) => (
          <div
            key={idx}
            className={`px-4 py-2.5 flex items-start gap-3 ${
              check.status === 'fail' ? 'bg-red-500/5' : ''
            }`}
          >
            <div className={`mt-0.5 ${getStatusColor(check.status)}`}>
              {getCheckIcon(check)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm text-white">{check.message}</span>
                {getStatusIcon(check.status)}
              </div>
              {check.details && (
                <p className="text-[10px] text-neutral-500 mt-0.5">{check.details}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-neutral-900/50 border-t border-neutral-800">
        <p className="text-[9px] text-neutral-600">
          Checked at {new Date(readiness.checked_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
