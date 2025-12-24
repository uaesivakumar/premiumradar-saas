'use client';

/**
 * MVT Version History Component (S256-F1)
 *
 * Displays version history table for a sub-vertical's MVT versions.
 * Shows version number, status, validation state, and timestamps.
 */

import { useState, useEffect, useCallback } from 'react';
import { MVTVersionActions } from './MVTVersionActions';
import { MVTVersionDiff } from './MVTVersionDiff';
import { MVTVersionForm } from './MVTVersionForm';

interface MVTVersion {
  id: string;
  sub_vertical_id: string;
  mvt_version: number;
  buyer_role: string;
  decision_owner: string;
  allowed_signals: Array<{
    signal_key: string;
    entity_type: string;
    justification: string;
  }>;
  kill_rules: Array<{
    rule: string;
    action: string;
    reason: string;
  }>;
  seed_scenarios: {
    golden: Array<{ scenario_id: string; entry_intent: string }>;
    kill: Array<{ scenario_id: string; entry_intent: string }>;
  };
  mvt_valid: boolean;
  mvt_validated_at: string | null;
  status: string;
  created_at: string;
  created_by: string | null;
}

interface MVTVersionHistoryProps {
  subVerticalId: string;
  primaryEntityType: string;
  onVersionChange?: () => void;
}

export function MVTVersionHistory({
  subVerticalId,
  primaryEntityType,
  onVersionChange,
}: MVTVersionHistoryProps) {
  const [versions, setVersions] = useState<MVTVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [diffVersions, setDiffVersions] = useState<[MVTVersion | null, MVTVersion | null]>([null, null]);
  const [showDiff, setShowDiff] = useState(false);

  const fetchVersions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/superadmin/controlplane/sub-verticals/${subVerticalId}/mvt-versions`
      );
      const data = await response.json();

      if (data.success) {
        setVersions(data.versions);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch versions');
      }
    } catch (err) {
      setError('Failed to fetch MVT versions');
      console.error('MVT versions fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [subVerticalId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleVersionAction = async () => {
    await fetchVersions();
    onVersionChange?.();
  };

  const handleCompare = (v1: MVTVersion, v2: MVTVersion) => {
    setDiffVersions([v1, v2]);
    setShowDiff(true);
  };

  const handleCreateSuccess = async () => {
    setShowCreateForm(false);
    await fetchVersions();
    onVersionChange?.();
  };

  const getStatusBadge = (status: string, mvtValid: boolean) => {
    if (status === 'ACTIVE') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ACTIVE
        </span>
      );
    }
    if (status === 'DRAFT') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          DRAFT
        </span>
      );
    }
    if (status === 'DEPRECATED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          DEPRECATED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">MVT Version History</h3>
          <p className="text-sm text-gray-500">
            Manage Minimum Viable Truth versions for this sub-vertical
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create New Version
        </button>
      </div>

      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {versions.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No MVT versions</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create the first MVT version to enable runtime eligibility.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Create First Version
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Buyer Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Decision Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Signals / Rules
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {versions.map((version, index) => (
                <tr
                  key={version.id}
                  className={version.status === 'ACTIVE' ? 'bg-green-50' : ''}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">
                        v{version.mvt_version}
                      </span>
                      {version.mvt_valid && (
                        <svg
                          className="ml-2 h-4 w-4 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(version.status, version.mvt_valid)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {version.buyer_role || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {version.decision_owner || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="text-indigo-600">
                      {version.allowed_signals?.length || 0} signals
                    </span>
                    {' / '}
                    <span className="text-red-600">
                      {version.kill_rules?.length || 0} rules
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      {new Date(version.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {version.created_by || 'System'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <MVTVersionActions
                      version={version}
                      subVerticalId={subVerticalId}
                      onActionComplete={handleVersionAction}
                      onCompare={
                        index < versions.length - 1
                          ? () => handleCompare(version, versions[index + 1])
                          : undefined
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <MVTVersionForm
          subVerticalId={subVerticalId}
          primaryEntityType={primaryEntityType}
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleCreateSuccess}
          baseVersion={versions[0]} // Use latest version as template
        />
      )}

      {/* Diff Modal */}
      {showDiff && diffVersions[0] && diffVersions[1] && (
        <MVTVersionDiff
          version1={diffVersions[0]}
          version2={diffVersions[1]}
          onClose={() => {
            setShowDiff(false);
            setDiffVersions([null, null]);
          }}
        />
      )}
    </div>
  );
}
