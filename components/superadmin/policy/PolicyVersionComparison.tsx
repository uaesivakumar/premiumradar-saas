'use client';

/**
 * Policy Version Comparison View (S258-F1)
 *
 * Side-by-side comparison of policy versions.
 */

import { useState, useEffect } from 'react';

interface Policy {
  id: string;
  persona_id: string;
  policy_version: number;
  status: string;
  allowed_intents: string[];
  forbidden_outputs: string[];
  allowed_tools: string[];
  evidence_scope: Record<string, unknown>;
  memory_scope: Record<string, unknown>;
  cost_budget: Record<string, unknown>;
  latency_budget: Record<string, unknown>;
  escalation_rules: Record<string, unknown>;
  disclaimer_rules: Record<string, unknown>;
  activated_at: string | null;
  created_at: string;
}

interface PolicyVersionComparisonProps {
  personaId: string;
  version1: number;
  version2: number;
  onClose: () => void;
}

export function PolicyVersionComparison({
  personaId,
  version1,
  version2,
  onClose,
}: PolicyVersionComparisonProps) {
  const [policies, setPolicies] = useState<[Policy | null, Policy | null]>([null, null]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPolicies();
  }, [personaId, version1, version2]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const [res1, res2] = await Promise.all([
        fetch(`/api/superadmin/controlplane/personas/${personaId}/policy?version=${version1}`),
        fetch(`/api/superadmin/controlplane/personas/${personaId}/policy?version=${version2}`),
      ]);

      const [data1, data2] = await Promise.all([res1.json(), res2.json()]);

      if (data1.success && data2.success) {
        setPolicies([data1.policy, data2.policy]);
        setError(null);
      } else {
        setError('Failed to fetch policies');
      }
    } catch (err) {
      setError('Failed to fetch policies');
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: unknown): string => {
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : '(empty)';
    }
    if (typeof value === 'object' && value !== null) {
      const keys = Object.keys(value);
      return keys.length > 0 ? JSON.stringify(value, null, 2) : '{}';
    }
    return String(value);
  };

  const isDifferent = (v1: unknown, v2: unknown): boolean => {
    return JSON.stringify(v1) !== JSON.stringify(v2);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75">
        <div className="bg-white rounded-lg p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const [p1, p2] = policies;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between z-10">
            <h3 className="text-lg font-medium text-gray-900">
              Policy Comparison: v{version1} vs v{version2}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="px-6 py-4 bg-red-50 text-red-700">{error}</div>
          )}

          <div className="p-6">
            {/* Headers */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-indigo-50 p-3 rounded-lg">
                <span className="font-medium text-indigo-700">Version {p1?.policy_version}</span>
                <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                  p1?.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {p1?.status}
                </span>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="font-medium text-gray-700">Version {p2?.policy_version}</span>
                <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                  p2?.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {p2?.status}
                </span>
              </div>
            </div>

            {/* Comparison rows */}
            {[
              { key: 'allowed_intents', label: 'Allowed Intents' },
              { key: 'forbidden_outputs', label: 'Forbidden Outputs' },
              { key: 'allowed_tools', label: 'Allowed Tools' },
              { key: 'cost_budget', label: 'Cost Budget' },
              { key: 'latency_budget', label: 'Latency Budget' },
              { key: 'escalation_rules', label: 'Escalation Rules' },
              { key: 'disclaimer_rules', label: 'Disclaimer Rules' },
            ].map(({ key, label }) => (
              <div key={key} className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">{label}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-3 rounded text-sm font-mono ${
                    isDifferent(p1?.[key as keyof Policy], p2?.[key as keyof Policy])
                      ? 'bg-yellow-50 border-l-4 border-yellow-400'
                      : 'bg-gray-50'
                  }`}>
                    <pre className="whitespace-pre-wrap text-xs">
                      {formatValue(p1?.[key as keyof Policy])}
                    </pre>
                  </div>
                  <div className={`p-3 rounded text-sm font-mono ${
                    isDifferent(p1?.[key as keyof Policy], p2?.[key as keyof Policy])
                      ? 'bg-yellow-50 border-l-4 border-yellow-400'
                      : 'bg-gray-50'
                  }`}>
                    <pre className="whitespace-pre-wrap text-xs">
                      {formatValue(p2?.[key as keyof Policy])}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
