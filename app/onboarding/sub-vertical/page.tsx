'use client';

/**
 * Onboarding Sub-Vertical Page - EB Journey Phase 2
 * Role selection within the vertical (e.g., Employee Banking)
 */

import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { SubVerticalSelector } from '@/components/onboarding/SubVerticalSelector';

export default function OnboardingSubVerticalPage() {
  return (
    <OnboardingFrame step="subVertical">
      <SubVerticalSelector />
    </OnboardingFrame>
  );
}
