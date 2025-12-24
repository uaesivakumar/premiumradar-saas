'use client';

/**
 * MVT Version Actions Component (S256-F3)
 *
 * Row actions for MVT version table: activate, deprecate, compare.
 */

import { useState } from 'react';

interface MVTVersion {
  id: string;
  mvt_version: number;
  status: string;
  mvt_valid: boolean;
}

interface MVTVersionActionsProps {
  version: MVTVersion;
  subVerticalId: string;
  onActionComplete: () => void;
  onCompare?: () => void;
}

export function MVTVersionActions({
  version,
  subVerticalId,
  onActionComplete,
  onCompare,
}: MVTVersionActionsProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState<'activate' | 'deprecate' | null>(null);

  const handleAction = async (action: 'activate' | 'deprecate') => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/superadmin/controlplane/sub-verticals/${subVerticalId}/mvt-versions/${version.id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        }
      );

      const data = await response.json();

      if (data.success) {
        onActionComplete();
      } else {
        alert(data.message || data.error || 'Action failed');
      }
    } catch (error) {
      console.error('Action error:', error);
      alert('Failed to perform action');
    } finally {
      setLoading(false);
      setShowConfirm(null);
    }
  };

  return (
    <div className="flex items-center justify-end space-x-2">
      {/* Compare button */}
      {onCompare && (
        <button
          onClick={onCompare}
          className="text-gray-400 hover:text-gray-600"
          title="Compare with previous"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </button>
      )}

      {/* Activate button - only for non-active, valid versions */}
      {version.status !== 'ACTIVE' && version.mvt_valid && (
        <button
          onClick={() => setShowConfirm('activate')}
          disabled={loading}
          className="text-green-600 hover:text-green-800 disabled:opacity-50"
          title="Activate this version"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </button>
      )}

      {/* Deprecate button - only for non-deprecated versions */}
      {version.status !== 'DEPRECATED' && (
        <button
          onClick={() => setShowConfirm('deprecate')}
          disabled={loading}
          className="text-red-600 hover:text-red-800 disabled:opacity-50"
          title="Deprecate this version"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </button>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowConfirm(null)}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div
                  className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${
                    showConfirm === 'activate' ? 'bg-green-100' : 'bg-red-100'
                  } sm:mx-0 sm:h-10 sm:w-10`}
                >
                  {showConfirm === 'activate' ? (
                    <svg
                      className="h-6 w-6 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-6 w-6 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  )}
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {showConfirm === 'activate'
                      ? `Activate Version ${version.mvt_version}?`
                      : `Deprecate Version ${version.mvt_version}?`}
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      {showConfirm === 'activate'
                        ? 'This will deprecate the current active version and make this version active. The sub-vertical will use this MVT for runtime.'
                        : version.status === 'ACTIVE'
                        ? 'Warning: Deprecating the active version will make this sub-vertical NOT runtime-eligible until another version is activated.'
                        : 'This version will be marked as deprecated and cannot be used.'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => handleAction(showConfirm)}
                  disabled={loading}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                    showConfirm === 'activate'
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                      : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  } disabled:opacity-50`}
                >
                  {loading
                    ? 'Processing...'
                    : showConfirm === 'activate'
                    ? 'Activate'
                    : 'Deprecate'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirm(null)}
                  disabled={loading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
