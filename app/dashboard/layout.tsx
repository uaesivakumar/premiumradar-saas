'use client';

/**
 * Dashboard Layout - Sprint 3
 * Wraps all dashboard pages with AppShell
 */

import { AppShell } from '@/components/shell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
