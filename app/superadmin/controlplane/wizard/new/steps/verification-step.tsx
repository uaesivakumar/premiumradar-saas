'use client';

/**
 * Step 6: Runtime Verification
 *
 * Auto-run checks with "re-run" button:
 * - GET /api/os/resolve-binding?tenant_id=...&workspace_id=...
 *
 * Shows result card with:
 * - Resolution method: BINDING
 * - control_plane_version
 * - agent, entity_type, persona_key
 * - policy status
 *
 * If fails: show exact NOT READY error code and "Fix it" button
 */

import { useState, useCallback, useEffect } from 'react';
import { useWizard } from '../wizard-context';

interface VerificationResult {
  success: boolean;
  error?: string;
  message?: string;
  resolution_method?: string;
  control_plane_version?: string;
  runtime?: {
    agent: string;
    entity_type: string;
    persona_key: string;
  };
  policy?: {
    status: string;
    version?: number;
  };
  vertical?: { key: string; name: string };
  sub_vertical?: { key: string; name: string };
  persona?: { key: string; name: string };
}

export function VerificationStep() {
  const { wizardState, updateWizardState, markStepComplete, setCurrentStep } = useWizard();

  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [autoRan, setAutoRan] = useState(false);

  const runVerification = useCallback(async () => {
    if (!wizardState.tenant_id || !wizardState.workspace_id) {
      setResult({
        success: false,
        error: 'MISSING_BINDING',
        message: 'Tenant ID and Workspace ID are required. Go back to Step 5.',
      });
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch(
        `/api/os/resolve-binding?tenant_id=${encodeURIComponent(
          wizardState.tenant_id
        )}&workspace_id=${encodeURIComponent(wizardState.workspace_id)}`
      );

      const data: VerificationResult = await response.json();
      setResult(data);

      if (data.success) {
        updateWizardState({
          verification_passed: true,
          verification_result: data as unknown as Record<string, unknown>,
        });
        markStepComplete(6);
      } else {
        updateWizardState({
          verification_passed: false,
          verification_result: data as unknown as Record<string, unknown>,
        });
      }
    } catch (error) {
      setResult({
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Failed to connect to verification endpoint.',
      });
    } finally {
      setIsVerifying(false);
    }
  }, [wizardState.tenant_id, wizardState.workspace_id, updateWizardState, markStepComplete]);

  // Auto-run on mount
  useEffect(() => {
    if (!autoRan && wizardState.tenant_id && wizardState.workspace_id) {
      setAutoRan(true);
      runVerification();
    }
  }, [autoRan, wizardState.tenant_id, wizardState.workspace_id, runVerification]);

  const getFailingStep = useCallback((error: string) => {
    switch (error) {
      case 'BINDING_NOT_FOUND':
      case 'BINDING_INACTIVE':
        return 5;
      case 'POLICY_NOT_ACTIVE':
        return 4;
      case 'PERSONA_INACTIVE':
        return 3;
      case 'SUB_VERTICAL_INACTIVE':
        return 2;
      case 'VERTICAL_INACTIVE':
        return 1;
      default:
        return null;
    }
  }, []);

  const handleFixIt = useCallback(() => {
    if (result?.error) {
      const step = getFailingStep(result.error);
      if (step) {
        setCurrentStep(step);
      }
    }
  }, [result, getFailingStep, setCurrentStep]);

  if (wizardState.verification_passed) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Verification Passed</h2>
          <p className="text-sm text-gray-500 mt-1">
            Runtime configuration is valid. Ready to publish!
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-green-600 text-2xl">✓</span>
            <span className="font-semibold text-green-900 text-lg">Stack is READY</span>
          </div>

          {result && (
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Resolution Method</dt>
                <dd className="font-medium text-gray-900">{result.resolution_method}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Control Plane</dt>
                <dd className="font-medium text-gray-900">v{result.control_plane_version}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Agent</dt>
                <dd className="font-medium text-gray-900">{result.runtime?.agent}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Entity Type</dt>
                <dd className="font-medium text-gray-900">{result.runtime?.entity_type}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Persona</dt>
                <dd className="font-medium text-gray-900">{result.runtime?.persona_key}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Policy Status</dt>
                <dd className="inline-flex">
                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-800">
                    {result.policy?.status}
                  </span>
                </dd>
              </div>
            </dl>
          )}
        </div>

        <button
          onClick={runVerification}
          disabled={isVerifying}
          className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          {isVerifying ? 'Verifying...' : 'Re-run Verification'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Verify Runtime Readiness</h2>
        <p className="text-sm text-gray-500 mt-1">
          Checking that your vertical stack is properly configured.
        </p>
      </div>

      {isVerifying ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-blue-800">Running verification checks...</p>
        </div>
      ) : result ? (
        result.success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-600 text-lg">✓</span>
              <span className="font-medium text-green-900">Verification Passed</span>
            </div>
            <p className="text-green-800 text-sm">
              Your vertical stack is ready. Click Continue to publish.
            </p>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-600 text-lg">✗</span>
              <span className="font-medium text-red-900">Verification Failed</span>
            </div>
            <div className="bg-white rounded border border-red-100 p-3 mt-3">
              <p className="font-mono text-sm text-red-800 mb-1">
                Error: {result.error}
              </p>
              <p className="text-gray-600 text-sm">{result.message}</p>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={runVerification}
                disabled={isVerifying}
                className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Re-run
              </button>
              {getFailingStep(result.error || '') && (
                <button
                  onClick={handleFixIt}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Fix it (Step {getFailingStep(result.error || '')})
                </button>
              )}
            </div>
          </div>
        )
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600 mb-4">Click to start verification</p>
          <button
            onClick={runVerification}
            disabled={isVerifying}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Run Verification
          </button>
        </div>
      )}

      <div className="text-sm text-gray-500">
        <p className="font-medium mb-2">What we check:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Workspace binding exists and is active</li>
          <li>Vertical, Sub-Vertical, and Persona are all active</li>
          <li>Persona has an ACTIVE policy</li>
          <li>Runtime configuration resolves correctly</li>
        </ul>
      </div>
    </div>
  );
}
