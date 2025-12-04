/**
 * Onboarding Store - Sprint S32-S35 + EB Journey Upgrade
 * Manages onboarding state and user profile during signup flow
 *
 * EB JOURNEY: Updated for Employee Banking flow:
 * - SubVertical selection (employee-banking, corporate-banking, etc.)
 * - Multi-region selection (Dubai, Abu Dhabi, etc.)
 * - TargetEntity derived from vertical (companies for banking)
 *
 * Step flow: welcome → identity → workspace → vertical → subVertical → regions → transition → complete
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Vertical,
  SubVertical,
  RadarTarget,
  UAE_REGIONS,
} from '@/lib/intelligence/context/types';
import { VERTICAL_RADAR_TARGETS } from '@/lib/intelligence/context/types';

// Updated step flow for EB journey
export type OnboardingStep =
  | 'welcome'
  | 'identity'
  | 'workspace'
  | 'vertical'
  | 'subVertical'  // NEW: Select sub-vertical within Banking
  | 'regions'      // NEW: Multi-select regions (Dubai, Abu Dhabi, etc.)
  | 'transition'
  | 'complete';

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  /** @deprecated Use selectedRegions[] instead */
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

  // Vertical selection (S34 + EB Journey)
  selectedVertical: VerticalId | null;
  selectedSubVertical: SubVertical | null;  // NEW: Sub-vertical within vertical
  selectedRegions: string[];                 // NEW: Multi-region array
  targetEntity: RadarTarget | null;          // NEW: Derived from vertical

  // Onboarding status
  isComplete: boolean;
  startedAt: string | null;
  completedAt: string | null;

  // Actions - Step navigation
  setStep: (step: OnboardingStep) => void;
  completeStep: (step: OnboardingStep) => void;
  getNextStep: () => OnboardingStep | null;
  isStepComplete: (step: OnboardingStep) => boolean;

  // Actions - Profile
  updateProfile: (profile: Partial<UserProfile>) => void;
  setWorkspace: (workspace: Workspace) => void;

  // Actions - Vertical/SubVertical (EB Journey)
  setVertical: (vertical: VerticalId) => void;
  setSubVertical: (subVertical: SubVertical) => void;

  // Actions - Regions (EB Journey - multi-select)
  setRegions: (regions: string[]) => void;
  addRegion: (region: string) => void;
  removeRegion: (region: string) => void;
  toggleRegion: (region: string) => void;

  // Actions - Completion
  completeOnboarding: () => void;
  resetOnboarding: () => void;

  // Helpers - Validation
  isVerticalComplete: () => boolean;
  isSubVerticalComplete: () => boolean;
  isRegionsComplete: () => boolean;
  canProceedToTransition: () => boolean;
}

// EB Journey step order: vertical → subVertical → regions
const STEP_ORDER: OnboardingStep[] = [
  'welcome',
  'identity',
  'workspace',
  'vertical',
  'subVertical',  // NEW: Sub-vertical selection
  'regions',      // NEW: Multi-region selection
  'transition',
  'complete',
];

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
        region: '', // Deprecated, use selectedRegions
      },
      workspace: null,
      selectedVertical: null,
      selectedSubVertical: null,
      selectedRegions: [],
      targetEntity: null,
      isComplete: false,
      startedAt: null,
      completedAt: null,

      // =============================================================================
      // Step Navigation Actions
      // =============================================================================

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

      // =============================================================================
      // Profile Actions
      // =============================================================================

      updateProfile: (profileUpdate) => {
        const { profile } = get();
        set({ profile: { ...profile, ...profileUpdate } });
      },

      setWorkspace: (workspace) => {
        set({ workspace });
      },

      // =============================================================================
      // Vertical/SubVertical Actions (EB Journey)
      // =============================================================================

      setVertical: (vertical) => {
        // Derive targetEntity from vertical
        const targetEntity = VERTICAL_RADAR_TARGETS[vertical];
        set({
          selectedVertical: vertical,
          targetEntity,
          // Reset sub-vertical and regions when vertical changes
          selectedSubVertical: null,
          selectedRegions: [],
        });
      },

      setSubVertical: (subVertical) => {
        set({ selectedSubVertical: subVertical });
      },

      // =============================================================================
      // Region Actions (EB Journey - multi-select)
      // =============================================================================

      setRegions: (regions) => {
        set({ selectedRegions: regions });
      },

      addRegion: (region) => {
        const { selectedRegions } = get();
        if (!selectedRegions.includes(region)) {
          set({ selectedRegions: [...selectedRegions, region] });
        }
      },

      removeRegion: (region) => {
        const { selectedRegions } = get();
        set({ selectedRegions: selectedRegions.filter(r => r !== region) });
      },

      toggleRegion: (region) => {
        const { selectedRegions } = get();
        if (selectedRegions.includes(region)) {
          set({ selectedRegions: selectedRegions.filter(r => r !== region) });
        } else {
          set({ selectedRegions: [...selectedRegions, region] });
        }
      },

      // =============================================================================
      // Completion Actions
      // =============================================================================

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
          selectedSubVertical: null,
          selectedRegions: [],
          targetEntity: null,
          isComplete: false,
          startedAt: null,
          completedAt: null,
        });
      },

      // =============================================================================
      // Validation Helpers
      // =============================================================================

      isVerticalComplete: () => {
        const { selectedVertical } = get();
        return selectedVertical !== null;
      },

      isSubVerticalComplete: () => {
        const { selectedSubVertical } = get();
        return selectedSubVertical !== null;
      },

      isRegionsComplete: () => {
        const { selectedRegions } = get();
        return selectedRegions.length > 0;
      },

      canProceedToTransition: () => {
        const { selectedVertical, selectedSubVertical, selectedRegions } = get();
        return (
          selectedVertical !== null &&
          selectedSubVertical !== null &&
          selectedRegions.length > 0
        );
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
        selectedSubVertical: state.selectedSubVertical,
        selectedRegions: state.selectedRegions,
        targetEntity: state.targetEntity,
        isComplete: state.isComplete,
        startedAt: state.startedAt,
        completedAt: state.completedAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Migration: Ensure new fields exist after rehydration
          if (!Array.isArray(state.selectedRegions)) {
            state.selectedRegions = [];
          }
          if (state.selectedSubVertical === undefined) {
            state.selectedSubVertical = null;
          }
          if (state.targetEntity === undefined) {
            state.targetEntity = state.selectedVertical
              ? VERTICAL_RADAR_TARGETS[state.selectedVertical]
              : null;
          }
          // Migrate old completedSteps to include new steps in order
          // This ensures users mid-onboarding don't get stuck
        }
      },
    }
  )
);

// =============================================================================
// Helper Functions
// =============================================================================

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

// Get total number of steps (excluding 'complete')
export function getTotalSteps(): number {
  return STEP_ORDER.length - 1; // Exclude 'complete' from count
}

// Get progress percentage
export function getProgressPercentage(completedSteps: OnboardingStep[]): number {
  const totalSteps = getTotalSteps();
  if (totalSteps === 0) return 0;
  return Math.round((completedSteps.length / totalSteps) * 100);
}

// =============================================================================
// Selectors
// =============================================================================

export const selectOnboardingVertical = (state: OnboardingState) => state.selectedVertical;
export const selectOnboardingSubVertical = (state: OnboardingState) => state.selectedSubVertical;
export const selectOnboardingRegions = (state: OnboardingState) => state.selectedRegions;
export const selectOnboardingTargetEntity = (state: OnboardingState) => state.targetEntity;
export const selectOnboardingProfile = (state: OnboardingState) => state.profile;
export const selectOnboardingWorkspace = (state: OnboardingState) => state.workspace;
export const selectOnboardingStep = (state: OnboardingState) => state.currentStep;
export const selectOnboardingIsComplete = (state: OnboardingState) => state.isComplete;
export const selectOnboardingCompletedSteps = (state: OnboardingState) => state.completedSteps;

// Derived selector: Get the full vertical selection summary
export const selectVerticalSummary = (state: OnboardingState) => ({
  vertical: state.selectedVertical,
  subVertical: state.selectedSubVertical,
  regions: state.selectedRegions,
  targetEntity: state.targetEntity,
  isComplete: state.selectedVertical !== null &&
              state.selectedSubVertical !== null &&
              state.selectedRegions.length > 0,
});

export default useOnboardingStore;
