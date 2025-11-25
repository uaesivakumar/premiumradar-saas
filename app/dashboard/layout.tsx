'use client';

/**
 * Dashboard Layout - Sprint S26
 * Now uses SIVA Surface (pageless AI workspace)
 */

import { SIVASurface } from '@/components/siva';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // S26: Replace traditional AppShell with SIVA Surface
  // The pageless workspace is now the default authenticated experience
  return <SIVASurface />;
}
