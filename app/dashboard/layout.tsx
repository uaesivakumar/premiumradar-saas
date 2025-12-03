'use client';

/**
 * Dashboard Layout - Sprint S26
 * Now uses SIVA Surface (pageless AI workspace)
 *
 * VERTICAL SYNC: Wraps with VerticalSyncProvider to ensure
 * the user-selected vertical from onboarding is propagated
 * to sales-context-store for all dashboard surfaces.
 */

import { SIVASurface } from '@/components/siva';
import { VerticalSyncProvider } from '@/providers/VerticalSyncProvider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // S26: Replace traditional AppShell with SIVA Surface
  // The pageless workspace is now the default authenticated experience
  // VERTICAL FIX: Wrap with VerticalSyncProvider to sync onboarding vertical
  return (
    <VerticalSyncProvider>
      <SIVASurface />
    </VerticalSyncProvider>
  );
}
