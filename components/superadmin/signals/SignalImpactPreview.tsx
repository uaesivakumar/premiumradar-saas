'use client';

/**
 * Signal Impact Preview (S260-F4)
 *
 * Preview impact of signal changes on scoring.
 */

import { useState, useEffect } from 'react';

interface Signal {
  id: string;
  key: string;
  name: string;
  weight: number;
  is_enabled: boolean;
}

interface ImpactResult {
  scenario_name: string;
  current_score: number;
  projected_score: number;
  delta: number;
  affected_signals: string[];
}

interface SignalImpactPreviewProps {
  subVerticalId: string;
  pendingChanges: {
    signalId: string;
    field: 'is_enabled' | 'weight';
    newValue: boolean | number;
  }[];
}

export function SignalImpactPreview({
  subVerticalId,
  pendingChanges,
}: SignalImpactPreviewProps) {
  const [impacts, setImpacts] = useState<ImpactResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pendingChanges.length > 0) {
      calculateImpact();
    } else {
      setImpacts([]);
    }
  }, [pendingChanges, subVerticalId]);

  const calculateImpact = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/superadmin/controlplane/sub-verticals/${subVerticalId}/signals/impact-preview`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ changes: pendingChanges }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setImpacts(data.impacts || []);
        setError(null);
      } else {
        setError(data.error || 'Failed to calculate impact');
      }
    } catch (err) {
      setError('Failed to calculate impact');
    } finally {
      setLoading(false);
    }
  };

  if (pendingChanges.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="mt-2 text-sm">Make signal changes to see impact preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Impact Preview</h3>
        <p className="text-sm text-gray-500">
          {pendingChanges.length} pending changes
        </p>
      </div>

      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="px-6 py-8 text-center">
          <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-sm text-gray-500">Calculating impact...</p>
        </div>
      ) : impacts.length === 0 ? (
        <div className="px-6 py-8 text-center text-gray-500">
          <p className="text-sm">No seed scenarios to analyze impact</p>
          <p className="text-xs mt-1">Create seed scenarios first</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {impacts.map((impact, i) => (
            <div key={i} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{impact.scenario_name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Affected: {impact.affected_signals.join(', ')}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Current</div>
                    <div className="text-sm font-medium text-gray-700">{impact.current_score}</div>
                  </div>
                  <div className="text-gray-400">→</div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Projected</div>
                    <div className="text-sm font-medium text-gray-700">{impact.projected_score}</div>
                  </div>
                  <div className={`text-right min-w-[60px] ${
                    impact.delta > 0 ? 'text-green-600' :
                    impact.delta < 0 ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    <div className="text-xs">Delta</div>
                    <div className="text-sm font-medium flex items-center justify-end">
                      {impact.delta > 0 && (
                        <svg className="h-4 w-4 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {impact.delta < 0 && (
                        <svg className="h-4 w-4 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {impact.delta > 0 ? '+' : ''}{impact.delta}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {impacts.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Average impact: {impacts.length > 0
                ? (impacts.reduce((sum, i) => sum + i.delta, 0) / impacts.length).toFixed(1)
                : 0
              } points
            </span>
            <div className="flex items-center space-x-4 text-xs">
              <span className="text-green-600">
                {impacts.filter(i => i.delta > 0).length} improved
              </span>
              <span className="text-red-600">
                {impacts.filter(i => i.delta < 0).length} degraded
              </span>
              <span className="text-gray-500">
                {impacts.filter(i => i.delta === 0).length} unchanged
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
