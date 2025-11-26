'use client';

/**
 * Onboarding Vertical Page - Sprint S34
 * Industry vertical selection
 */

import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { VerticalSelector } from '@/components/onboarding/VerticalSelector';

export default function OnboardingVerticalPage() {
  return (
    <OnboardingFrame step="vertical">
      <VerticalSelector />
    </OnboardingFrame>
  );
}
