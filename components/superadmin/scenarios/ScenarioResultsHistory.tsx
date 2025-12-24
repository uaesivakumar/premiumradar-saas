'use client';

/**
 * Scenario Results History (S259-F4)
 *
 * Shows historical test run results with trend analysis.
 */

import { useState, useEffect } from 'react';

interface TestRun {
  id: string;
  sub_vertical_id: string;
  run_at: string;
  total_scenarios: number;
  passed: number;
  failed: number;
  pass_rate: number;
  triggered_by: string;
  duration_ms: number;
}

interface ScenarioResultsHistoryProps {
  subVerticalId: string;
  limit?: number;
}

export function ScenarioResultsHistory({
  subVerticalId,
  limit = 10,
}: ScenarioResultsHistoryProps) {
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [subVerticalId, limit]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/superadmin/controlplane/sub-verticals/${subVerticalId}/test-history?limit=${limit}`
      );
      const data = await response.json();

      if (data.success) {
        setRuns(data.runs || []);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch history');
      }
    } catch (err) {
      setError('Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPassRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600 bg-green-100';
    if (rate >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getTrend = () => {
    if (runs.length < 2) return null;
    const recent = runs.slice(0, 3).reduce((sum, r) => sum + r.pass_rate, 0) / Math.min(3, runs.length);
    const older = runs.slice(3, 6).reduce((sum, r) => sum + r.pass_rate, 0) / Math.min(3, runs.length - 3) || recent;
    return recent - older;
  };

  const trend = getTrend();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Test History</h3>
          <p className="text-sm text-gray-500">Last {runs.length} runs</p>
        </div>
        {trend !== null && (
          <div className={`flex items-center text-sm font-medium ${
            trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
          }`}>
            {trend > 0 ? (
              <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            ) : trend < 0 ? (
              <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : null}
            {Math.abs(trend).toFixed(1)}% trend
          </div>
        )}
      </div>

      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Chart placeholder */}
      {runs.length > 1 && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-20 flex items-end space-x-1">
            {runs.slice().reverse().map((run, i) => (
              <div key={run.id} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full rounded-t ${
                    run.pass_rate >= 90 ? 'bg-green-400' :
                    run.pass_rate >= 70 ? 'bg-yellow-400' : 'bg-red-400'
                  }`}
                  style={{ height: `${run.pass_rate * 0.8}%`, minHeight: '4px' }}
                  title={`${run.pass_rate}% - ${formatDate(run.run_at)}`}
                ></div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Oldest</span>
            <span>Most Recent</span>
          </div>
        </div>
      )}

      {/* Run list */}
      <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
        {runs.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No test runs yet
          </div>
        ) : (
          runs.map(run => (
            <div key={run.id} className="px-6 py-3 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPassRateColor(run.pass_rate)}`}>
                      {run.pass_rate}%
                    </span>
                    <span className="ml-2 text-sm text-gray-700">
                      {run.passed}/{run.total_scenarios} passed
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDate(run.run_at)} • {run.triggered_by}
                  </div>
                </div>
                <div className="text-right text-xs text-gray-400">
                  {run.duration_ms}ms
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
