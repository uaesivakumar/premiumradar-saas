'use client';

/**
 * Policy Activate Confirmation Modal (S258-F3)
 *
 * Confirmation modal for activating staged policies.
 * Shows impact preview before activation.
 */

import { useState } from 'react';

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

interface PolicyActivateModalProps {
  policy: Policy;
  currentActiveVersion?: number;
  onClose: () => void;
  onActivated: (policy: Policy) => void;
}

export function PolicyActivateModal({
  policy,
  currentActiveVersion,
  onClose,
  onActivated,
}: PolicyActivateModalProps) {
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleActivate = async () => {
    if (!confirmed) {
      setError('Please confirm the activation');
      return;
    }

    try {
      setActivating(true);
      setError(null);

      const response = await fetch(
        `/api/superadmin/controlplane/personas/${policy.persona_id}/policy/${policy.id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'activate' }),
        }
      );

      const data = await response.json();

      if (data.success) {
        onActivated(policy);
        onClose();
      } else {
        setError(data.error || 'Failed to activate policy');
      }
    } catch (err) {
      setError('Failed to activate policy');
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Activate Policy</h3>
                <p className="text-sm text-gray-500">This action cannot be undone automatically</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-4">
            {/* Policy Info */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Persona</span>
                <span className="text-sm text-gray-900">{policy.persona_name}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Version to Activate</span>
                <span className="text-sm text-gray-900">v{policy.policy_version}</span>
              </div>
              {currentActiveVersion && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Current Active</span>
                  <span className="text-sm text-gray-900">v{currentActiveVersion}</span>
                </div>
              )}
            </div>

            {/* Impact Warning */}
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Activation Impact</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li className="flex items-start">
                  <svg className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>v{policy.policy_version} will become the ACTIVE policy</span>
                </li>
                {currentActiveVersion && (
                  <li className="flex items-start">
                    <svg className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>v{currentActiveVersion} will be marked as DEPRECATED</span>
                  </li>
                )}
                <li className="flex items-start">
                  <svg className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>All SIVA calls will use the new policy immediately</span>
                </li>
              </ul>
            </div>

            {/* Policy Summary */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Policy Configuration</h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-lg font-semibold text-gray-900">{policy.allowed_intents?.length || 0}</div>
                  <div className="text-xs text-gray-500">Intents</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-lg font-semibold text-gray-900">{policy.forbidden_outputs?.length || 0}</div>
                  <div className="text-xs text-gray-500">Forbidden</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-lg font-semibold text-gray-900">{policy.allowed_tools?.length || 0}</div>
                  <div className="text-xs text-gray-500">Tools</div>
                </div>
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  I understand this will immediately affect all SIVA interactions for this persona
                </span>
              </label>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleActivate}
              disabled={activating || !confirmed}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {activating ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Activating...
                </span>
              ) : (
                'Activate Policy'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
