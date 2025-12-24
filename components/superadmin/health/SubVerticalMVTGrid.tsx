'use client';

/**
 * Sub-Vertical MVT Status Grid (S257-F2)
 *
 * Grid view showing MVT status for all sub-verticals.
 * Color-coded by runtime eligibility.
 */

import { useState, useEffect } from 'react';

interface SubVerticalStatus {
  id: string;
  key: string;
  name: string;
  vertical_key: string;
  vertical_name: string;
  mvt_version: number | null;
  mvt_valid: boolean;
  mvt_status: string | null;
  runtime_eligible: boolean;
  eligibility_blocker: string | null;
  active_mvt_version_id: string | null;
}

interface SubVerticalMVTGridProps {
  onSubVerticalClick?: (subVertical: SubVerticalStatus) => void;
}

export function SubVerticalMVTGrid({ onSubVerticalClick }: SubVerticalMVTGridProps) {
  const [subVerticals, setSubVerticals] = useState<SubVerticalStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'eligible' | 'ineligible'>('all');

  useEffect(() => {
    fetchSubVerticals();
  }, []);

  const fetchSubVerticals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/superadmin/controlplane/sub-verticals?include_mvt_status=true');
      const data = await response.json();

      if (data.success) {
        setSubVerticals(data.data || []);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch sub-verticals');
      }
    } catch (err) {
      setError('Failed to fetch sub-verticals');
    } finally {
      setLoading(false);
    }
  };

  const filtered = subVerticals.filter(sv => {
    if (filter === 'eligible') return sv.runtime_eligible;
    if (filter === 'ineligible') return !sv.runtime_eligible;
    return true;
  });

  const getStatusColor = (sv: SubVerticalStatus) => {
    if (sv.runtime_eligible) return 'bg-green-100 border-green-300 hover:bg-green-200';
    if (sv.mvt_valid) return 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200';
    if (sv.active_mvt_version_id) return 'bg-orange-100 border-orange-300 hover:bg-orange-200';
    return 'bg-red-100 border-red-300 hover:bg-red-200';
  };

  const getStatusIcon = (sv: SubVerticalStatus) => {
    if (sv.runtime_eligible) {
      return (
        <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    }
    if (sv.mvt_valid) {
      return (
        <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Sub-Vertical MVT Status</h3>
        <div className="flex items-center space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'eligible' | 'ineligible')}
            className="text-sm border border-gray-300 rounded-md px-3 py-1"
          >
            <option value="all">All ({subVerticals.length})</option>
            <option value="eligible">Eligible ({subVerticals.filter(sv => sv.runtime_eligible).length})</option>
            <option value="ineligible">Ineligible ({subVerticals.filter(sv => !sv.runtime_eligible).length})</option>
          </select>
          <button
            onClick={fetchSubVerticals}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="p-6">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No sub-verticals found
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(sv => (
              <div
                key={sv.id}
                onClick={() => onSubVerticalClick?.(sv)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${getStatusColor(sv)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {sv.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {sv.vertical_name}
                    </p>
                  </div>
                  {getStatusIcon(sv)}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-gray-600">
                    v{sv.mvt_version || 0}
                  </span>
                  {sv.eligibility_blocker && (
                    <span className="text-red-600 truncate ml-2" title={sv.eligibility_blocker}>
                      {sv.eligibility_blocker.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded bg-green-200 border border-green-300 mr-1"></div>
              <span className="text-gray-600">Runtime Eligible</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded bg-yellow-200 border border-yellow-300 mr-1"></div>
              <span className="text-gray-600">MVT Valid (Missing Policy)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded bg-orange-200 border border-orange-300 mr-1"></div>
              <span className="text-gray-600">MVT Invalid</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded bg-red-200 border border-red-300 mr-1"></div>
              <span className="text-gray-600">No MVT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
