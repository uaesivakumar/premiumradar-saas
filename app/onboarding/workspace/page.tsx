'use client';

/**
 * Onboarding Workspace Page - Sprint S33
 * Workspace creation flow
 */

import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { WorkspaceCreator } from '@/components/onboarding/WorkspaceCreator';

export default function OnboardingWorkspacePage() {
  return (
    <OnboardingFrame step="workspace">
      <WorkspaceCreator />
    </OnboardingFrame>
  );
}
