'use client';

/**
 * Policy Stage Workflow (S258-F2)
 *
 * UI for staging policies before activation.
 * Shows draft policies ready to be staged.
 */

import { useState, useEffect } from 'react';

interface Policy {
  id: string;
  persona_id: string;
  persona_name: string;
  policy_version: number;
  status: string;
  allowed_intents: string[];
  forbidden_outputs: string[];
  allowed_tools: string[];
  created_at: string;
}

interface PolicyStageWorkflowProps {
  personaId?: string;
  onStaged?: (policy: Policy) => void;
}

export function PolicyStageWorkflow({ personaId, onStaged }: PolicyStageWorkflowProps) {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [staging, setStaging] = useState<string | null>(null);

  useEffect(() => {
    fetchDraftPolicies();
  }, [personaId]);

  const fetchDraftPolicies = async () => {
    try {
      setLoading(true);
      const url = personaId
        ? `/api/superadmin/controlplane/personas/${personaId}/policy?status=DRAFT`
        : '/api/superadmin/controlplane/policies?status=DRAFT';

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setPolicies(Array.isArray(data.policies) ? data.policies : [data.policy].filter(Boolean));
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch draft policies');
      }
    } catch (err) {
      setError('Failed to fetch draft policies');
    } finally {
      setLoading(false);
    }
  };

  const handleStage = async (policy: Policy) => {
    try {
      setStaging(policy.id);
      const response = await fetch(
        `/api/superadmin/controlplane/personas/${policy.persona_id}/policy/${policy.id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'stage' }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setPolicies(policies.filter(p => p.id !== policy.id));
        onStaged?.(policy);
      } else {
        setError(data.error || 'Failed to stage policy');
      }
    } catch (err) {
      setError('Failed to stage policy');
    } finally {
      setStaging(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Stage Policies</h3>
          <p className="text-sm text-gray-500">Draft policies ready for staging</p>
        </div>
        <button
          onClick={fetchDraftPolicies}
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
          <div className="px-6 py-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">No draft policies to stage</p>
          </div>
        ) : (
          policies.map(policy => (
            <div key={policy.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-900">
                      {policy.persona_name || 'Unknown Persona'}
                    </p>
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      v{policy.policy_version}
                    </span>
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      DRAFT
                    </span>
                  </div>
                  <div className="mt-1 flex items-center text-xs text-gray-500">
                    <span>{policy.allowed_intents?.length || 0} intents</span>
                    <span className="mx-1">•</span>
                    <span>{policy.forbidden_outputs?.length || 0} forbidden</span>
                    <span className="mx-1">•</span>
                    <span>{policy.allowed_tools?.length || 0} tools</span>
                  </div>
                </div>
                <button
                  onClick={() => handleStage(policy)}
                  disabled={staging === policy.id}
                  className="ml-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {staging === policy.id ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Staging...
                    </span>
                  ) : (
                    'Stage for Review'
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
