'use client';

/**
 * Seed Scenario List (S259-F1)
 *
 * Shows golden and kill scenarios for sub-verticals.
 * Used by Sales-Bench for validation testing.
 */

import { useState, useEffect } from 'react';

interface SeedScenario {
  id: string;
  sub_vertical_id: string;
  scenario_type: 'golden' | 'kill';
  name: string;
  description: string;
  input_data: Record<string, unknown>;
  expected_outcome: {
    min_score?: number;
    max_score?: number;
    expected_verdict?: 'accept' | 'reject' | 'defer';
    required_signals?: string[];
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SeedScenarioListProps {
  subVerticalId: string;
  onScenarioSelect?: (scenario: SeedScenario) => void;
  onCreateNew?: () => void;
}

export function SeedScenarioList({
  subVerticalId,
  onScenarioSelect,
  onCreateNew,
}: SeedScenarioListProps) {
  const [scenarios, setScenarios] = useState<SeedScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'golden' | 'kill'>('all');

  useEffect(() => {
    fetchScenarios();
  }, [subVerticalId]);

  const fetchScenarios = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/superadmin/controlplane/sub-verticals/${subVerticalId}/seed-scenarios`
      );
      const data = await response.json();

      if (data.success) {
        setScenarios(data.scenarios || []);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch scenarios');
      }
    } catch (err) {
      setError('Failed to fetch scenarios');
    } finally {
      setLoading(false);
    }
  };

  const filtered = scenarios.filter(s => {
    if (filter === 'golden') return s.scenario_type === 'golden';
    if (filter === 'kill') return s.scenario_type === 'kill';
    return true;
  });

  const goldenCount = scenarios.filter(s => s.scenario_type === 'golden').length;
  const killCount = scenarios.filter(s => s.scenario_type === 'kill').length;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Seed Scenarios</h3>
          <p className="text-sm text-gray-500">
            {goldenCount} golden, {killCount} kill scenarios
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'golden' | 'kill')}
            className="text-sm border border-gray-300 rounded-md px-3 py-1"
          >
            <option value="all">All ({scenarios.length})</option>
            <option value="golden">Golden ({goldenCount})</option>
            <option value="kill">Kill ({killCount})</option>
          </select>
          <button
            onClick={onCreateNew}
            className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            + New
          </button>
        </div>
      </div>

      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {filtered.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">No scenarios found</p>
            <button
              onClick={onCreateNew}
              className="mt-3 text-sm text-indigo-600 hover:text-indigo-700"
            >
              Create your first scenario
            </button>
          </div>
        ) : (
          filtered.map(scenario => (
            <div
              key={scenario.id}
              onClick={() => onScenarioSelect?.(scenario)}
              className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      scenario.scenario_type === 'golden'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {scenario.scenario_type === 'golden' ? 'GOLDEN' : 'KILL'}
                    </span>
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      {scenario.name}
                    </span>
                    {!scenario.is_active && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500 truncate">
                    {scenario.description}
                  </p>
                </div>
                <div className="ml-4 text-right text-xs text-gray-400">
                  {scenario.expected_outcome.expected_verdict && (
                    <div className={`font-medium ${
                      scenario.expected_outcome.expected_verdict === 'accept'
                        ? 'text-green-600'
                        : scenario.expected_outcome.expected_verdict === 'reject'
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`}>
                      {scenario.expected_outcome.expected_verdict.toUpperCase()}
                    </div>
                  )}
                  {scenario.expected_outcome.min_score !== undefined && (
                    <div>Score: {scenario.expected_outcome.min_score}+</div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
