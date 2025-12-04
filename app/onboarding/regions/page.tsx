'use client';

/**
 * Onboarding Regions Page - EB Journey Phase 2
 * Multi-region territory selection
 */

import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { RegionMultiSelect } from '@/components/onboarding/RegionMultiSelect';

export default function OnboardingRegionsPage() {
  return (
    <OnboardingFrame step="regions">
      <RegionMultiSelect />
    </OnboardingFrame>
  );
}
