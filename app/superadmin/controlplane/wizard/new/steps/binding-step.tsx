'use client';

/**
 * Step 5: Runtime Binding (Governance Hardening v1.0)
 *
 * GOVERNANCE ENFORCEMENT:
 * - Silent success FORBIDDEN (BND-001)
 * - binding_id must be valid UUID (BND-002)
 * - binding_id = "auto-managed" is FORBIDDEN (BND-003)
 * - Binding requires active persona (BND-004)
 * - Binding requires active policy (BND-005)
 *
 * If binding fails:
 * - Show exact error message
 * - Block wizard progression
 * - Provide retry option
 */

import { useEffect, useState, useCallback } from 'react';
import { useWizard } from '../wizard-context';

interface BindingError {
  code: string;
  message: string;
  recoveryStep?: number;
}

const ERROR_MAP: Record<string, BindingError> = {
  BINDING_FAILED: {
    code: 'BND-001',
    message: 'Failed to create workspace binding.',
  },
  PERSONA_NOT_ACTIVE: {
    code: 'BND-004',
    message: 'Persona is not active.',
    recoveryStep: 3,
  },
  POLICY_NOT_ACTIVE: {
    code: 'BND-005',
    message: 'Policy is not active. Activate the policy first.',
    recoveryStep: 4,
  },
  WORKSPACE_NOT_FOUND: {
    code: 'BND-006',
    message: 'Workspace does not exist.',
  },
  TENANT_NOT_FOUND: {
    code: 'BND-007',
    message: 'Tenant does not exist.',
  },
};

export function BindingStep() {
  const { wizardState, updateWizardState, markStepComplete, setCurrentStep } = useWizard();

  const [isBinding, setIsBinding] = useState(false);
  const [bindingError, setBindingError] = useState<BindingError | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // GOVERNANCE: Valid binding check - no fake "auto-managed" values (BND-003)
  const hasValidBinding = !!(
    wizardState.binding_id &&
    wizardState.binding_id !== 'auto-managed' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(wizardState.binding_id)
  );

  const isComplete = hasValidBinding;

  /**
   * GOVERNANCE: performBinding with failure visibility (BND-001)
   * No silent success - all failures are surfaced
   */
  const performBinding = useCallback(async () => {
    if (isComplete || isBinding) return;

    // Pre-check: Policy must be ACTIVE (BND-005)
    if (wizardState.policy_status !== 'ACTIVE') {
      setBindingError({
        code: 'BND-005',
        message: 'Policy must be ACTIVE before binding. Go back to Policy step.',
        recoveryStep: 4,
      });
      return;
    }

    setIsBinding(true);
    setBindingError(null);

    try {
      const response = await fetch(
        `/api/superadmin/controlplane/personas/${wizardState.persona_id}/auto-bind`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vertical_id: wizardState.vertical_id,
            sub_vertical_id: wizardState.sub_vertical_id,
          }),
        }
      );

      const data = await response.json();

      // GOVERNANCE: NO SILENT SUCCESS (BND-001)
      // If API returns failure, we MUST surface it and block progression
      if (!response.ok || !data.success) {
        const errorKey = data.error || 'BINDING_FAILED';
        const mappedError = ERROR_MAP[errorKey] || {
          code: 'BND-001',
          message: data.message || 'Binding failed. Please retry.',
        };
        setBindingError(mappedError);
        return;
      }

      // GOVERNANCE: Validate binding_id is valid UUID (BND-002)
      const bindingId = data.data?.id;
      if (!bindingId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bindingId)) {
        setBindingError({
          code: 'BND-002',
          message: 'Invalid binding ID received. Please retry.',
        });
        return;
      }

      // Success - valid binding created
      updateWizardState({
        binding_id: bindingId,
        tenant_id: data.data?.tenant_id,
        workspace_id: data.data?.workspace_id,
      });
      markStepComplete(5);
    } catch (err) {
      // GOVERNANCE: Network errors are NOT silent (BND-001)
      setBindingError({
        code: 'BND-001',
        message: 'Network error during binding. Please check connection and retry.',
      });
    } finally {
      setIsBinding(false);
    }
  }, [
    isComplete,
    isBinding,
    wizardState.persona_id,
    wizardState.vertical_id,
    wizardState.sub_vertical_id,
    wizardState.policy_status,
    updateWizardState,
    markStepComplete,
  ]);

  // Auto-attempt binding on mount (but respect failure states)
  useEffect(() => {
    if (!isComplete && !isBinding && !bindingError && retryCount === 0) {
      const timer = setTimeout(performBinding, 500);
      return () => clearTimeout(timer);
    }
  }, [isComplete, isBinding, bindingError, retryCount, performBinding]);

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setBindingError(null);
    performBinding();
  }, [performBinding]);

  const handleGoToStep = useCallback((step: number) => {
    setCurrentStep(step);
  }, [setCurrentStep]);

  // Success state
  if (isComplete) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Runtime Binding Complete</h2>
          <p className="text-sm text-gray-500 mt-1">
            Binding successfully created. Proceed to verification.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-green-600 text-lg">✓</span>
            <span className="font-medium text-green-900">Binding Created</span>
          </div>
          <dl className="grid grid-cols-1 gap-3 text-sm">
            <div>
              <dt className="text-gray-500">Binding ID</dt>
              <dd className="font-mono text-xs text-gray-900 break-all">{wizardState.binding_id}</dd>
            </div>
            {wizardState.tenant_id && (
              <div>
                <dt className="text-gray-500">Tenant</dt>
                <dd className="font-mono text-xs text-gray-900">{wizardState.tenant_id}</dd>
              </div>
            )}
            {wizardState.workspace_id && (
              <div>
                <dt className="text-gray-500">Workspace</dt>
                <dd className="font-mono text-xs text-gray-900">{wizardState.workspace_id}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    );
  }

  // Error state
  if (bindingError) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Runtime Binding</h2>
          <p className="text-sm text-gray-500 mt-1">
            Binding is required before proceeding.
          </p>
        </div>

        {/* GOVERNANCE: Exact error surfaced (BND-001) */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-red-600 text-lg">✗</span>
            <span className="font-medium text-red-900">Binding Failed</span>
          </div>

          <div className="bg-white border border-red-100 rounded p-3 mb-4">
            <p className="font-mono text-sm text-red-800 mb-1">
              Error: {bindingError.code}
            </p>
            <p className="text-gray-700 text-sm">
              {bindingError.message}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRetry}
              disabled={isBinding}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isBinding ? 'Retrying...' : 'Retry'}
            </button>
            {bindingError.recoveryStep && (
              <button
                onClick={() => handleGoToStep(bindingError.recoveryStep!)}
                className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Fix it (Step {bindingError.recoveryStep})
              </button>
            )}
          </div>

          {retryCount > 0 && (
            <p className="text-xs text-gray-500 mt-3">
              Retry attempts: {retryCount}
            </p>
          )}
        </div>

        {/* Governance info */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-amber-600">⚠</span>
            <div>
              <p className="font-medium text-amber-800">Governance: No Silent Failures</p>
              <p className="text-amber-700 mt-1">
                Binding must succeed before the wizard can proceed.
                Invalid states cannot reach runtime.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Runtime Binding</h2>
        <p className="text-sm text-gray-500 mt-1">
          Creating workspace binding for this persona.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-medium text-blue-900">Creating binding...</span>
        </div>

        <div className="bg-white/50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">What happens:</p>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-600">1.</span>
              <span>System creates a workspace binding for this persona</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">2.</span>
              <span>Binding links tenant → workspace → persona</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">3.</span>
              <span>Runtime can resolve this persona for matching requests</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Pre-requisites check */}
      <div className="text-sm text-gray-600">
        <p className="font-medium mb-2">Pre-requisites:</p>
        <ul className="space-y-1">
          <li className="flex items-center gap-2">
            {wizardState.persona_id ? (
              <span className="text-green-600">✓</span>
            ) : (
              <span className="text-red-600">✗</span>
            )}
            <span>Persona created</span>
          </li>
          <li className="flex items-center gap-2">
            {wizardState.policy_status === 'ACTIVE' ? (
              <span className="text-green-600">✓</span>
            ) : (
              <span className="text-red-600">✗</span>
            )}
            <span>Policy is ACTIVE</span>
            {wizardState.policy_status !== 'ACTIVE' && (
              <span className="text-xs text-amber-600">
                (current: {wizardState.policy_status || 'none'})
              </span>
            )}
          </li>
        </ul>
      </div>
    </div>
  );
}
