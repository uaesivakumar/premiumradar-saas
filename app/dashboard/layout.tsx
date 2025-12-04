'use client';

/**
 * Dashboard Layout - EB Journey PART 3: Pageless AI UX
 *
 * SIVA IS THE INTERFACE - No sidebar navigation needed.
 * All Discovery, Ranking, Outreach, Intelligence happens through SIVA.
 *
 * Legacy pages (discovery, intelligence, etc.) are kept for deep linking
 * but the default experience is the Pageless AI surface.
 */

import { PagelessShell } from '@/components/shell/PagelessShell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Pageless AI UX - SIVA is the main interface
  // Children are rendered inside SIVA's context but the primary UX is the AI surface
  return <PagelessShell>{children}</PagelessShell>;
}
