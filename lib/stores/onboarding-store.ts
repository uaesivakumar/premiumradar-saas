/**
 * Onboarding Store - Sprint S32-S35
 * Manages onboarding state and user profile during signup flow
 *
 * P2 VERTICALISATION: Updated VerticalId to match official Vertical type
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Vertical } from '@/lib/intelligence/context/types';

export type OnboardingStep = 'welcome' | 'identity' | 'workspace' | 'vertical' | 'transition' | 'complete';

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  region: string;
}

export interface Workspace {
  id: string;
  name: string;
  type: 'personal' | 'organization';
  createdAt: string;
}

// P2 VERTICALISATION: Use the official Vertical type
export type VerticalId = Vertical;

export interface OnboardingState {
  // Current step
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];

  // User profile (S32)
  profile: UserProfile;

  // Workspace (S33)
  workspace: Workspace | null;

  // Vertical (S34)
  selectedVertical: VerticalId | null;

  // Onboarding status
  isComplete: boolean;
  startedAt: string | null;
  completedAt: string | null;

  // Actions
  setStep: (step: OnboardingStep) => void;
  completeStep: (step: OnboardingStep) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  setWorkspace: (workspace: Workspace) => void;
  setVertical: (vertical: VerticalId) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  getNextStep: () => OnboardingStep | null;
  isStepComplete: (step: OnboardingStep) => boolean;
}

const STEP_ORDER: OnboardingStep[] = ['welcome', 'identity', 'workspace', 'vertical', 'transition', 'complete'];

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStep: 'welcome',
      completedSteps: [],
      profile: {
        name: '',
        email: '',
        role: '',
        region: '',
      },
      workspace: null,
      selectedVertical: null,
      isComplete: false,
      startedAt: null,
      completedAt: null,

      // Actions
      setStep: (step) => {
        set({ currentStep: step });
      },

      completeStep: (step) => {
        const { completedSteps, startedAt } = get();
        if (!completedSteps.includes(step)) {
          set({
            completedSteps: [...completedSteps, step],
            startedAt: startedAt || new Date().toISOString(),
          });
        }
      },

      updateProfile: (profileUpdate) => {
        const { profile } = get();
        set({ profile: { ...profile, ...profileUpdate } });
      },

      setWorkspace: (workspace) => {
        set({ workspace });
      },

      setVertical: (vertical) => {
        set({ selectedVertical: vertical });
      },

      completeOnboarding: () => {
        set({
          isComplete: true,
          currentStep: 'complete',
          completedAt: new Date().toISOString(),
        });
      },

      resetOnboarding: () => {
        set({
          currentStep: 'welcome',
          completedSteps: [],
          profile: { name: '', email: '', role: '', region: '' },
          workspace: null,
          selectedVertical: null,
          isComplete: false,
          startedAt: null,
          completedAt: null,
        });
      },

      getNextStep: () => {
        const { completedSteps, isComplete } = get();
        if (isComplete) return null;

        for (const step of STEP_ORDER) {
          if (!completedSteps.includes(step)) {
            return step;
          }
        }
        return null;
      },

      isStepComplete: (step) => {
        const { completedSteps } = get();
        return completedSteps.includes(step);
      },
    }),
    {
      name: 'premiumradar-onboarding',
      partialize: (state) => ({
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        profile: state.profile,
        workspace: state.workspace,
        selectedVertical: state.selectedVertical,
        isComplete: state.isComplete,
        startedAt: state.startedAt,
        completedAt: state.completedAt,
      }),
    }
  )
);

// Helper to get step index
export function getStepIndex(step: OnboardingStep): number {
  return STEP_ORDER.indexOf(step);
}

// Helper to check if step is accessible
export function isStepAccessible(step: OnboardingStep, completedSteps: OnboardingStep[]): boolean {
  const stepIndex = getStepIndex(step);
  if (stepIndex === 0) return true; // First step is always accessible

  const previousStep = STEP_ORDER[stepIndex - 1];
  return completedSteps.includes(previousStep);
}

export default useOnboardingStore;
