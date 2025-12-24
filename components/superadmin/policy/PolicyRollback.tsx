'use client';

/**
 * Policy Rollback Capability (S258-F4)
 *
 * UI for rolling back to previous policy versions.
 * Shows version history and allows quick rollback.
 */

import { useState, useEffect } from 'react';

interface PolicyVersion {
  id: string;
  persona_id: string;
  policy_version: number;
  status: string;
  allowed_intents: string[];
  forbidden_outputs: string[];
  allowed_tools: string[];
  activated_at: string | null;
  deprecated_at: string | null;
  created_at: string;
}

interface PolicyRollbackProps {
  personaId: string;
  personaName: string;
  onRollback?: (version: PolicyVersion) => void;
}

export function PolicyRollback({ personaId, personaName, onRollback }: PolicyRollbackProps) {
  const [versions, setVersions] = useState<PolicyVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rollingBack, setRollingBack] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<PolicyVersion | null>(null);

  useEffect(() => {
    fetchVersions();
  }, [personaId]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/superadmin/controlplane/personas/${personaId}/policy?all_versions=true`
      );
      const data = await response.json();

      if (data.success) {
        // Sort by version descending, filter to show deprecated versions for rollback
        const sorted = (data.versions || []).sort(
          (a: PolicyVersion, b: PolicyVersion) => b.policy_version - a.policy_version
        );
        setVersions(sorted);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch policy versions');
      }
    } catch (err) {
      setError('Failed to fetch policy versions');
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (version: PolicyVersion) => {
    try {
      setRollingBack(version.id);
      setError(null);

      const response = await fetch(
        `/api/superadmin/controlplane/personas/${personaId}/policy/${version.id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'activate' }),
        }
      );

      const data = await response.json();

      if (data.success) {
        await fetchVersions();
        onRollback?.(version);
        setShowConfirm(null);
      } else {
        setError(data.error || 'Failed to rollback');
      }
    } catch (err) {
      setError('Failed to rollback');
    } finally {
      setRollingBack(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            ACTIVE
          </span>
        );
      case 'STAGED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
            STAGED
          </span>
        );
      case 'DEPRECATED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
            DEPRECATED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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

  const currentActive = versions.find(v => v.status === 'ACTIVE');
  const rollbackCandidates = versions.filter(v => v.status === 'DEPRECATED');

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Policy Rollback</h3>
        <p className="text-sm text-gray-500">{personaName}</p>
      </div>

      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Current Active */}
      {currentActive && (
        <div className="px-6 py-4 bg-green-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-900">
                  Current: v{currentActive.policy_version}
                </span>
                {getStatusBadge(currentActive.status)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Activated: {formatDate(currentActive.activated_at)}
              </p>
            </div>
            <div className="text-right text-xs text-gray-500">
              <div>{currentActive.allowed_intents?.length || 0} intents</div>
              <div>{currentActive.allowed_tools?.length || 0} tools</div>
            </div>
          </div>
        </div>
      )}

      {/* Rollback Options */}
      <div className="divide-y divide-gray-200">
        {rollbackCandidates.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">No previous versions available for rollback</p>
          </div>
        ) : (
          rollbackCandidates.map(version => (
            <div key={version.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900">
                      v{version.policy_version}
                    </span>
                    {getStatusBadge(version.status)}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    <span>Was active: {formatDate(version.activated_at)}</span>
                    <span className="mx-1">•</span>
                    <span>Deprecated: {formatDate(version.deprecated_at)}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    {version.allowed_intents?.length || 0} intents,{' '}
                    {version.forbidden_outputs?.length || 0} forbidden,{' '}
                    {version.allowed_tools?.length || 0} tools
                  </div>
                </div>
                <button
                  onClick={() => setShowConfirm(version)}
                  disabled={rollingBack === version.id}
                  className="ml-4 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 disabled:opacity-50"
                >
                  <span className="flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Rollback
                  </span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Rollback Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowConfirm(null)}></div>

            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Confirm Rollback</h3>
              </div>

              <div className="px-6 py-4">
                <p className="text-sm text-gray-700 mb-4">
                  Are you sure you want to rollback to <strong>v{showConfirm.policy_version}</strong>?
                </p>

                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
                  <p className="font-medium mb-1">This will:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Activate v{showConfirm.policy_version}</li>
                    {currentActive && (
                      <li>Deprecate current v{currentActive.policy_version}</li>
                    )}
                    <li>Take effect immediately for all SIVA calls</li>
                  </ul>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRollback(showConfirm)}
                  disabled={rollingBack === showConfirm.id}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {rollingBack === showConfirm.id ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Rolling back...
                    </span>
                  ) : (
                    'Confirm Rollback'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
