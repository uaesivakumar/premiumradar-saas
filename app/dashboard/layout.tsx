'use client';

/**
 * Dashboard Layout - EB Journey Fix
 * Restored proper routing with AppShell + children
 * SIVA Surface is now at /dashboard/siva
 */

import { AppShell } from '@/components/shell/AppShell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
