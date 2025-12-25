'use client';

/**
 * Step 6: Runtime Verification (Zero-Manual-Ops v3.1)
 *
 * Auto-run checks using stack_readiness API:
 * - GET /api/superadmin/controlplane/stack-readiness?persona_id=...
 *
 * v3.1 CHANGES:
 * - Uses stack_readiness API instead of resolve-binding
 * - No tenant/workspace parameters needed (auto-managed)
 * - Shows system-managed verification status
 *
 * Shows result card with:
 * - Stack status: READY | BLOCKED | INCOMPLETE
 * - All checks passed/failed
 * - Policy status
 *
 * If fails: show blockers and "Fix it" button
 */

import { useState, useCallback, useEffect } from 'react';
import { useWizard } from '../wizard-context';

interface StackReadiness {
  status: 'READY' | 'BLOCKED' | 'INCOMPLETE' | 'NOT_FOUND';
  checks: Record<string, boolean>;
  blockers: string[];
  metadata: {
    vertical_id: string | null;
    vertical_key: string | null;
    sub_vertical_id: string | null;
    sub_vertical_key: string | null;
    persona_id: string | null;
    persona_key: string | null;
    active_policy_id: string | null;
    active_policy_version: number | null;
    binding_count: number;
  };
}

interface VerificationResult {
  success: boolean;
  error?: string;
  message?: string;
  data?: StackReadiness;
}

export function VerificationStep() {
  const { wizardState, updateWizardState, markStepComplete, setCurrentStep } = useWizard();

  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [autoRan, setAutoRan] = useState(false);

  const runVerification = useCallback(async () => {
    if (!wizardState.persona_id) {
      setResult({
        success: false,
        error: 'MISSING_PERSONA',
        message: 'Persona ID is required. Go back to Step 3.',
      });
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch(
        `/api/superadmin/controlplane/stack-readiness?persona_id=${encodeURIComponent(
          wizardState.persona_id
        )}`
      );

      const data = await response.json();

      if (!data.success) {
        setResult({
          success: false,
          error: data.error || 'VERIFICATION_FAILED',
          message: data.message || 'Failed to verify stack readiness.',
        });
        return;
      }

      const readiness: StackReadiness = data.data;
      const isReady = readiness.status === 'READY';

      setResult({
        success: isReady,
        error: isReady ? undefined : readiness.status,
        message: isReady ? 'Stack is ready' : readiness.blockers.join('. '),
        data: readiness,
      });

      if (isReady) {
        updateWizardState({
          verification_passed: true,
          verification_result: readiness as unknown as Record<string, unknown>,
        });
        markStepComplete(6);
      } else {
        updateWizardState({
          verification_passed: false,
          verification_result: readiness as unknown as Record<string, unknown>,
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
  }, [wizardState.persona_id, updateWizardState, markStepComplete]);

  // Auto-run on mount
  useEffect(() => {
    if (!autoRan && wizardState.persona_id) {
      setAutoRan(true);
      runVerification();
    }
  }, [autoRan, wizardState.persona_id, runVerification]);

  const getFailingStep = useCallback((blockers: string[]) => {
    const blockerText = blockers.join(' ').toLowerCase();
    if (blockerText.includes('binding')) return 5;
    if (blockerText.includes('policy')) return 4;
    if (blockerText.includes('persona')) return 3;
    if (blockerText.includes('sub-vertical')) return 2;
    if (blockerText.includes('vertical')) return 1;
    return null;
  }, []);

  const handleFixIt = useCallback(() => {
    if (result?.data?.blockers) {
      const step = getFailingStep(result.data.blockers);
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

          {result?.data && (
            <div className="space-y-3">
              {/* Checks grid */}
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(result.data.checks).map(([key, passed]) => (
                  <div
                    key={key}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                      passed
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {passed ? '✓' : '✗'}
                    <span className="truncate">{key.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>

              <dl className="grid grid-cols-2 gap-4 text-sm pt-3 border-t border-green-200">
                <div>
                  <dt className="text-gray-500">Persona</dt>
                  <dd className="font-medium text-gray-900">{result.data.metadata.persona_key}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Policy Version</dt>
                  <dd className="font-medium text-gray-900">v{result.data.metadata.active_policy_version}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Binding Status</dt>
                  <dd className="inline-flex">
                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-emerald-100 text-emerald-800">
                      Auto-Managed
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
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
                Status: {result.error}
              </p>
              {result.data?.blockers && result.data.blockers.length > 0 && (
                <ul className="text-gray-600 text-sm space-y-1 mt-2">
                  {result.data.blockers.map((blocker, i) => (
                    <li key={i}>• {blocker}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={runVerification}
                disabled={isVerifying}
                className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Re-run
              </button>
              {result.data?.blockers && getFailingStep(result.data.blockers) && (
                <button
                  onClick={handleFixIt}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Fix it (Step {getFailingStep(result.data.blockers)})
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
          <li>Vertical, Sub-Vertical, and Persona are all active</li>
          <li>Persona has an ACTIVE policy</li>
          <li>Runtime binding is auto-managed</li>
          <li>Runtime configuration resolves correctly</li>
        </ul>
        <p className="text-xs text-emerald-600 mt-2">
          Binding: Auto-managed by system
        </p>
      </div>
    </div>
  );
}
