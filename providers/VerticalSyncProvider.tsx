'use client';

/**
 * VerticalSyncProvider
 *
 * Bridges the onboarding-store and sales-context-store to ensure
 * the user-selected vertical is propagated to all dashboard surfaces.
 *
 * This provider should wrap the dashboard layout to ensure sync happens
 * on every dashboard page mount.
 */

import { useEffect } from 'react';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { useSalesContextStore } from '@/lib/stores/sales-context-store';
import type { Vertical } from '@/lib/intelligence/context/types';

/**
 * Maps onboarding VerticalId to sales context Vertical type
 */
const VERTICAL_MAPPING: Record<string, Vertical> = {
  'banking': 'banking',
  'fintech': 'banking',  // FinTech maps to banking vertical for now
  'insurance': 'insurance',
  'real_estate': 'real-estate',
  'consulting': 'saas-sales',  // Consulting maps to SaaS sales
};

interface VerticalSyncProviderProps {
  children: React.ReactNode;
}

export function VerticalSyncProvider({ children }: VerticalSyncProviderProps) {
  // Read from onboarding store
  const selectedVertical = useOnboardingStore((state) => state.selectedVertical);
  const isOnboardingComplete = useOnboardingStore((state) => state.isComplete);
  const profile = useOnboardingStore((state) => state.profile);

  // Read/write to sales context store
  const currentVertical = useSalesContextStore((state) => state.context.vertical);
  const isUserConfigured = useSalesContextStore((state) => state.isUserConfigured);
  const setVertical = useSalesContextStore((state) => state.setVertical);
  const setRegion = useSalesContextStore((state) => state.setRegion);

  useEffect(() => {
    // Only sync if onboarding is complete and we have a selected vertical
    if (!isOnboardingComplete || !selectedVertical) {
      return;
    }

    // Map the onboarding vertical to sales context vertical type
    const mappedVertical = VERTICAL_MAPPING[selectedVertical];

    if (!mappedVertical) {
      console.warn(`[VerticalSync] Unknown vertical: ${selectedVertical}`);
      return;
    }

    // Only sync if the vertical is different or not yet configured
    if (mappedVertical !== currentVertical || !isUserConfigured) {
      console.log(`[VerticalSync] Syncing vertical: ${selectedVertical} -> ${mappedVertical}`);
      setVertical(mappedVertical);

      // Also sync region from profile if available
      if (profile.region) {
        setRegion({
          country: profile.region,
          city: '',
        });
      }
    }
  }, [
    selectedVertical,
    isOnboardingComplete,
    currentVertical,
    isUserConfigured,
    setVertical,
    setRegion,
    profile.region,
  ]);

  return <>{children}</>;
}

export default VerticalSyncProvider;
