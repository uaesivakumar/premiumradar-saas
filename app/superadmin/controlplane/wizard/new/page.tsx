'use client';

/**
 * Vertical Stack Wizard
 *
 * Full-page wizard for creating a complete vertical stack:
 * 1. Vertical Identity
 * 2. Sub-Vertical Sales Motion
 * 3. Persona & Region Scope
 * 4. Persona Policy (lifecycle-aware)
 * 5. Workspace Binding
 * 6. Runtime Verification
 * 7. Published Summary
 *
 * Rules:
 * - No step-skipping
 * - Every step uses server responses (no optimistic UI)
 * - Every successful step persists IDs in wizard state
 * - Wizard cannot proceed to Step 7 unless policy is ACTIVE and binding exists
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  WizardProvider,
  useWizard,
  WIZARD_STEPS,
} from './wizard-context';

// Step Components
import { VerticalStep } from './steps/vertical-step';
import { SubVerticalStep } from './steps/sub-vertical-step';
import { PersonaStep } from './steps/persona-step';
import { PolicyStep } from './steps/policy-step';
import { BindingStep } from './steps/binding-step';
import { VerificationStep } from './steps/verification-step';
import { PublishedStep } from './steps/published-step';

function WizardContent() {
  const router = useRouter();
  const {
    currentStep,
    canGoBack,
    canGoNext,
    goBack,
    goNext,
    isStepComplete,
    wizardState,
  } = useWizard();

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleCancel = useCallback(() => {
    setShowCancelConfirm(true);
  }, []);

  const handleConfirmCancel = useCallback(() => {
    router.push('/superadmin/controlplane');
  }, [router]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <VerticalStep />;
      case 2:
        return <SubVerticalStep />;
      case 3:
        return <PersonaStep />;
      case 4:
        return <PolicyStep />;
      case 5:
        return <BindingStep />;
      case 6:
        return <VerificationStep />;
      case 7:
        return <PublishedStep />;
      default:
        return <VerticalStep />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">
            Create Vertical Stack
          </h1>
          <span className="text-sm text-gray-500">
            Control Plane v2.0
          </span>
        </div>
      </header>

      <div className="flex">
        {/* Stepper Sidebar */}
        <aside className="w-72 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]">
          <nav className="p-4 space-y-1">
            {WIZARD_STEPS.map((step) => {
              const isComplete = isStepComplete(step.number);
              const isCurrent = currentStep === step.number;
              const isPending = !isComplete && !isCurrent;

              return (
                <div
                  key={step.number}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg ${
                    isCurrent
                      ? 'bg-blue-50 border border-blue-200'
                      : isComplete
                      ? 'bg-green-50'
                      : 'bg-gray-50'
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : isComplete
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {isComplete ? '✓' : step.number}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        isCurrent
                          ? 'text-blue-900'
                          : isComplete
                          ? 'text-green-900'
                          : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500">{step.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Wizard State Debug (dev only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="p-4 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-2">Debug State:</p>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(wizardState, null, 2)}
              </pre>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-3xl mx-auto">
            {renderStep()}
          </div>
        </main>
      </div>

      {/* Footer Actions */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={goBack}
              disabled={!canGoBack}
              className={`px-4 py-2 text-sm font-medium rounded-lg border ${
                canGoBack
                  ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  : 'border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Back
            </button>

            {currentStep < 7 && (
              <button
                onClick={goNext}
                disabled={!canGoNext}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  canGoNext
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {currentStep === 6 ? 'Publish' : 'Continue'}
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Discard Draft?
            </h3>
            <p className="text-gray-600 mb-6">
              Any progress will be lost. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Keep Working
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerticalStackWizardPage() {
  return (
    <WizardProvider>
      <WizardContent />
    </WizardProvider>
  );
}
