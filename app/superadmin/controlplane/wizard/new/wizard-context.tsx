'use client';

/**
 * Wizard Context
 *
 * Manages wizard state including:
 * - Current step
 * - Created entity IDs (vertical_id, sub_vertical_id, persona_id, policy_id, binding_id)
 * - Step completion status
 * - Navigation logic
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export interface WizardState {
  // Step 1: Vertical
  vertical_id: string | null;
  vertical_key: string | null;
  vertical_name: string | null;

  // Step 2: Sub-Vertical
  sub_vertical_id: string | null;
  sub_vertical_key: string | null;
  sub_vertical_name: string | null;
  primary_entity_type: string | null;
  default_agent: string | null;

  // Step 3: Persona
  persona_id: string | null;
  persona_key: string | null;
  persona_name: string | null;
  scope: string | null;
  region_code: string | null;

  // Step 4: Policy
  policy_id: string | null;
  policy_version: number | null;
  policy_status: string | null;
  policy_activated_at: string | null;

  // Step 5: Binding
  binding_id: string | null;
  tenant_id: string | null;
  workspace_id: string | null;

  // Step 6: Verification
  verification_passed: boolean;
  verification_result: Record<string, unknown> | null;
}

interface WizardContextValue {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  wizardState: WizardState;
  updateWizardState: (updates: Partial<WizardState>) => void;
  isStepComplete: (step: number) => boolean;
  canGoBack: boolean;
  canGoNext: boolean;
  goBack: () => void;
  goNext: () => void;
  markStepComplete: (step: number) => void;
}

const initialWizardState: WizardState = {
  vertical_id: null,
  vertical_key: null,
  vertical_name: null,
  sub_vertical_id: null,
  sub_vertical_key: null,
  sub_vertical_name: null,
  primary_entity_type: null,
  default_agent: null,
  persona_id: null,
  persona_key: null,
  persona_name: null,
  scope: null,
  region_code: null,
  policy_id: null,
  policy_version: null,
  policy_status: null,
  policy_activated_at: null,
  binding_id: null,
  tenant_id: null,
  workspace_id: null,
  verification_passed: false,
  verification_result: null,
};

export const WIZARD_STEPS = [
  { number: 1, title: 'Vertical', subtitle: 'Identity & Key' },
  { number: 2, title: 'Sub-Vertical', subtitle: 'Sales Motion' },
  { number: 3, title: 'Persona', subtitle: 'Region & Scope' },
  { number: 4, title: 'Policy', subtitle: 'Lifecycle & Rules' },
  { number: 5, title: 'Binding', subtitle: 'Workspace Link' },
  { number: 6, title: 'Verify', subtitle: 'Runtime Check' },
  { number: 7, title: 'Published', subtitle: 'Summary' },
];

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardState, setWizardState] = useState<WizardState>(initialWizardState);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const updateWizardState = useCallback((updates: Partial<WizardState>) => {
    setWizardState((prev) => ({ ...prev, ...updates }));
  }, []);

  const isStepComplete = useCallback(
    (step: number) => completedSteps.has(step),
    [completedSteps]
  );

  const markStepComplete = useCallback((step: number) => {
    setCompletedSteps((prev) => new Set([...prev, step]));
  }, []);

  // Determine if current step allows proceeding
  const canGoNext = useMemo(() => {
    switch (currentStep) {
      case 1:
        return !!wizardState.vertical_id;
      case 2:
        return !!wizardState.sub_vertical_id;
      case 3:
        return !!wizardState.persona_id;
      case 4:
        return wizardState.policy_status === 'ACTIVE';
      case 5:
        return !!wizardState.binding_id;
      case 6:
        return wizardState.verification_passed;
      case 7:
        return false; // Final step
      default:
        return false;
    }
  }, [currentStep, wizardState]);

  const canGoBack = currentStep > 1;

  const goBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const goNext = useCallback(() => {
    if (canGoNext && currentStep < 7) {
      markStepComplete(currentStep);
      setCurrentStep(currentStep + 1);
    }
  }, [canGoNext, currentStep, markStepComplete]);

  const value: WizardContextValue = {
    currentStep,
    setCurrentStep,
    wizardState,
    updateWizardState,
    isStepComplete,
    canGoBack,
    canGoNext,
    goBack,
    goNext,
    markStepComplete,
  };

  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
}
