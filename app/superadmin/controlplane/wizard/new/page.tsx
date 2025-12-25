'use client';

/**
 * Vertical Stack Wizard (v3.0)
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
 * UX Rules (v3.0):
 * - Cancel always asks where to go (Verticals or Control Plane)
 * - Breadcrumbs show navigation path
 * - No silent redirects
 *
 * EXTEND_STACK Mode (v3.0):
 * - URL params: ?mode=extend&vertical_id=xxx&sub_vertical_id=xxx
 * - Pre-scopes wizard to extend existing stack
 * - Skips to appropriate step (2 for new sub-vertical, 3 for new persona)
 * - Shows "Extend Vertical Stack" title instead of "Create"
 */

import { useState, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import {
  WizardProvider,
  useWizard,
  WIZARD_STEPS,
  WizardState,
} from './wizard-context';

// Step Components
import { VerticalStep } from './steps/vertical-step';
import { SubVerticalStep } from './steps/sub-vertical-step';
import { PersonaStep } from './steps/persona-step';
import { PolicyStep } from './steps/policy-step';
import { BindingStep } from './steps/binding-step';
import { VerificationStep } from './steps/verification-step';
import { PublishedStep } from './steps/published-step';

interface WizardContentProps {
  isExtendMode?: boolean;
  extendContext?: {
    verticalName?: string | null;
    subVerticalName?: string | null;
  };
}

function WizardContent({ isExtendMode = false, extendContext }: WizardContentProps) {
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

  // Dynamic title based on mode
  const wizardTitle = isExtendMode
    ? extendContext?.subVerticalName
      ? `Add Persona to ${extendContext.subVerticalName}`
      : extendContext?.verticalName
        ? `Add Sub-Vertical to ${extendContext.verticalName}`
        : 'Extend Vertical Stack'
    : 'Create Vertical Stack';

  const wizardSubtitle = isExtendMode
    ? 'Adding to an existing vertical stack'
    : 'Guided creation of a complete, runnable vertical configuration';

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

  // Get current step info for breadcrumbs
  const currentStepInfo = WIZARD_STEPS.find(s => s.number === currentStep);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Breadcrumbs */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
          <Link href="/superadmin/controlplane" className="hover:text-gray-900 hover:underline">
            Control Plane
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-900 font-medium">{wizardTitle}</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-blue-600">Step {currentStep}: {currentStepInfo?.title}</span>
        </nav>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {wizardTitle}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {wizardSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isExtendMode && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                EXTEND MODE
              </span>
            )}
            <span className="text-sm text-gray-500">
              Control Plane v3.0
            </span>
          </div>
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

      {/* Cancel Confirmation Modal - Ask Where to Go */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Exit Vertical Setup?
            </h3>
            <p className="text-gray-600 mb-4">
              Any unsaved progress will be lost. Where would you like to go?
            </p>
            <div className="space-y-2 mb-4">
              <button
                onClick={() => router.push('/superadmin/verticals')}
                className="w-full px-4 py-3 text-left text-sm font-medium text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                <span className="block">Return to Verticals</span>
                <span className="text-xs text-gray-500">Edit existing verticals and personas</span>
              </button>
              <button
                onClick={() => router.push('/superadmin/controlplane')}
                className="w-full px-4 py-3 text-left text-sm font-medium text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                <span className="block">Go to Control Plane</span>
                <span className="text-xs text-gray-500">View system readiness and bindings</span>
              </button>
            </div>
            <button
              onClick={() => setShowCancelConfirm(false)}
              className="w-full px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Stay Here
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Wrapper component that reads URL params and initializes wizard
 * URL params:
 * - mode: 'create' | 'extend' - wizard mode
 * - startStep: number (1-7) - which step to start on
 * - vertical_id: string - pre-selected vertical UUID
 * - vertical_key: string - pre-selected vertical key
 * - vertical_name: string - pre-selected vertical name
 * - sub_vertical_id: string - pre-selected sub-vertical UUID (for extend mode)
 * - sub_vertical_key: string - pre-selected sub-vertical key
 * - sub_vertical_name: string - pre-selected sub-vertical name
 */
function WizardWithParams() {
  const searchParams = useSearchParams();

  // Parse URL params (with null safety)
  const mode = searchParams?.get('mode') || 'create';
  const isExtendMode = mode === 'extend';

  const startStepParam = parseInt(searchParams?.get('startStep') || '0', 10);
  const verticalId = searchParams?.get('vertical_id') || null;
  const verticalKey = searchParams?.get('vertical_key') || null;
  const verticalName = searchParams?.get('vertical_name') || null;
  const subVerticalId = searchParams?.get('sub_vertical_id') || null;
  const subVerticalKey = searchParams?.get('sub_vertical_key') || null;
  const subVerticalName = searchParams?.get('sub_vertical_name') || null;

  // Auto-compute starting step for extend mode:
  // - If sub_vertical_id provided → start at step 3 (add persona)
  // - If only vertical_id provided → start at step 2 (add sub-vertical)
  // - Otherwise → start at step 1
  let initialStep = 1;
  if (startStepParam >= 1 && startStepParam <= 7) {
    initialStep = startStepParam;
  } else if (isExtendMode) {
    if (subVerticalId) {
      initialStep = 3; // Add persona to existing sub-vertical
    } else if (verticalId) {
      initialStep = 2; // Add sub-vertical to existing vertical
    }
  }

  // Build initial state from URL params
  const initialState: Partial<WizardState> = {};
  if (verticalId) initialState.vertical_id = verticalId;
  if (verticalKey) initialState.vertical_key = verticalKey;
  if (verticalName) initialState.vertical_name = decodeURIComponent(verticalName);
  if (subVerticalId) initialState.sub_vertical_id = subVerticalId;
  if (subVerticalKey) initialState.sub_vertical_key = subVerticalKey;
  if (subVerticalName) initialState.sub_vertical_name = decodeURIComponent(subVerticalName);

  // Context for dynamic title
  const extendContext = {
    verticalName: verticalName ? decodeURIComponent(verticalName) : null,
    subVerticalName: subVerticalName ? decodeURIComponent(subVerticalName) : null,
  };

  return (
    <WizardProvider initialStep={initialStep} initialState={initialState}>
      <WizardContent isExtendMode={isExtendMode} extendContext={extendContext} />
    </WizardProvider>
  );
}

export default function VerticalStackWizardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading wizard...</div>
      </div>
    }>
      <WizardWithParams />
    </Suspense>
  );
}
