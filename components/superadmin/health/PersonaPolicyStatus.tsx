'use client';

/**
 * Persona Policy Status Indicators (S257-F3)
 *
 * Shows policy status for personas with status indicators.
 */

import { useState, useEffect } from 'react';

interface PolicyStatus {
  id: string;
  persona_id: string;
  persona_key: string;
  persona_name: string;
  sub_vertical_name: string;
  policy_version: number;
  status: string;
  activated_at: string | null;
  created_at: string;
}

interface PersonaPolicyStatusProps {
  subVerticalId?: string;
  limit?: number;
}

export function PersonaPolicyStatus({ subVerticalId, limit = 10 }: PersonaPolicyStatusProps) {
  const [policies, setPolicies] = useState<PolicyStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPolicies();
  }, [subVerticalId]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const url = subVerticalId
        ? `/api/superadmin/controlplane/personas?sub_vertical_id=${subVerticalId}&include_policy=true`
        : `/api/superadmin/controlplane/personas?include_policy=true&limit=${limit}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        // Transform to policy view
        const policyList: PolicyStatus[] = (data.data || []).map((p: {
          id: string;
          key: string;
          name: string;
          sub_vertical_name?: string;
          policy?: {
            id: string;
            policy_version: number;
            status: string;
            activated_at: string | null;
            created_at: string;
          };
        }) => ({
          persona_id: p.id,
          persona_key: p.key,
          persona_name: p.name,
          sub_vertical_name: p.sub_vertical_name || '',
          id: p.policy?.id || '',
          policy_version: p.policy?.policy_version || 0,
          status: p.policy?.status || 'NO_POLICY',
          activated_at: p.policy?.activated_at || null,
          created_at: p.policy?.created_at || '',
        }));
        setPolicies(policyList);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch policies');
      }
    } catch (err) {
      setError('Failed to fetch policies');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="3" />
            </svg>
            ACTIVE
          </span>
        );
      case 'STAGED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="3" />
            </svg>
            STAGED
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="3" />
            </svg>
            DRAFT
          </span>
        );
      case 'DEPRECATED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="3" />
            </svg>
            DEPRECATED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            NO POLICY
          </span>
        );
    }
  };

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
        <h3 className="text-lg font-medium text-gray-900">Persona Policy Status</h3>
        <button
          onClick={fetchPolicies}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {policies.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No personas found
          </div>
        ) : (
          policies.map(policy => (
            <div key={policy.persona_id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{policy.persona_name}</p>
                <p className="text-xs text-gray-500">
                  {policy.sub_vertical_name} • v{policy.policy_version}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {getStatusBadge(policy.status)}
                {policy.activated_at && (
                  <span className="text-xs text-gray-400">
                    {new Date(policy.activated_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
