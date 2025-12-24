'use client';

/**
 * Config Health Summary Widget (S257-F1)
 *
 * Shows overall control plane health status with counts.
 */

import { useState, useEffect } from 'react';

interface HealthData {
  verticals: { total: number; active: number; inactive: number };
  subVerticals: { total: number; active: number; mvtValid: number; runtimeEligible: number };
  personas: { total: number; active: number; withActivePolicy: number };
  policies: { total: number; active: number; staged: number; draft: number };
}

interface ConfigHealthSummaryProps {
  onRefresh?: () => void;
}

export function ConfigHealthSummary({ onRefresh }: ConfigHealthSummaryProps) {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/superadmin/controlplane/config-health');
      const data = await response.json();

      if (data.success) {
        setHealth(data.health);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch health');
      }
    } catch (err) {
      setError('Failed to fetch config health');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-4 gap-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !health) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          <p>{error || 'No health data available'}</p>
          <button
            onClick={fetchHealth}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const getHealthColor = (ratio: number) => {
    if (ratio >= 0.9) return 'text-green-600 bg-green-100';
    if (ratio >= 0.7) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Control Plane Health</h3>
        <button
          onClick={() => { fetchHealth(); onRefresh?.(); }}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Verticals */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Verticals</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getHealthColor(health.verticals.active / health.verticals.total)}`}>
                {Math.round((health.verticals.active / health.verticals.total) * 100)}%
              </span>
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {health.verticals.active}/{health.verticals.total}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {health.verticals.inactive} inactive
            </div>
          </div>

          {/* Sub-Verticals */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Sub-Verticals</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getHealthColor(health.subVerticals.runtimeEligible / health.subVerticals.total)}`}>
                {health.subVerticals.total > 0 ? Math.round((health.subVerticals.runtimeEligible / health.subVerticals.total) * 100) : 0}%
              </span>
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {health.subVerticals.runtimeEligible}/{health.subVerticals.total}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {health.subVerticals.mvtValid} MVT valid
            </div>
          </div>

          {/* Personas */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Personas</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getHealthColor(health.personas.withActivePolicy / health.personas.total)}`}>
                {health.personas.total > 0 ? Math.round((health.personas.withActivePolicy / health.personas.total) * 100) : 0}%
              </span>
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {health.personas.withActivePolicy}/{health.personas.total}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              with active policy
            </div>
          </div>

          {/* Policies */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Policies</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getHealthColor(health.policies.active / health.policies.total)}`}>
                {health.policies.total > 0 ? Math.round((health.policies.active / health.policies.total) * 100) : 0}%
              </span>
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {health.policies.active}/{health.policies.total}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {health.policies.staged} staged, {health.policies.draft} draft
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
