'use client';

/**
 * Onboarding Welcome Page - Sprint S32
 * SIVA greeting + identity setup
 */

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { SIVAGreeting } from '@/components/onboarding/SIVAGreeting';
import { IdentityForm } from '@/components/onboarding/IdentityForm';

function WelcomeContent() {
  const searchParams = useSearchParams();
  const step = searchParams?.get('step');

  return (
    <OnboardingFrame step={step === 'identity' ? 'identity' : 'welcome'}>
      {step === 'identity' ? <IdentityForm /> : <SIVAGreeting />}
    </OnboardingFrame>
  );
}

export default function OnboardingWelcomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <WelcomeContent />
    </Suspense>
  );
}
