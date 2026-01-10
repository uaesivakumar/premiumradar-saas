'use client';

/**
 * Pageless Shell - LEFT SIDEBAR LAYOUT
 * S369: Updated for LOCKED Workspace UX
 * S372: Dynamic Left Rail integration
 *
 * SIVA-first interface with sidebar for maximum content width.
 * Sidebar: Logo + Context + Dynamic Left Rail
 * Main: Full-width AI surface
 *
 * UX PRINCIPLES (LOCKED per WORKSPACE_UX_DECISION.md):
 * - Single persistent canvas
 * - Full page width for content
 * - Sidebar is dynamic (sections appear/disappear based on state)
 * - Logo: PremiumRadar (radar + AI symbol)
 * - No page navigation - all state-driven
 */

import React from 'react';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';
import { useSIVAStore } from '@/lib/stores/siva-store';
// S371: Replaced SIVASurface with WorkspaceSurface (card-centric)
// S372: Added LeftRail for dynamic sidebar
import { WorkspaceSurface, LeftRail } from '@/components/workspace/core';
import { PremiumRadarLogo } from '@/components/brand/PremiumRadarLogo';
import Link from 'next/link';

interface PagelessShellProps {
  children?: React.ReactNode;
}

export function PagelessShell({ children }: PagelessShellProps) {
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);
  const { state } = useSIVAStore();

  const isProcessing = state !== 'idle';

  return (
    <div className="h-screen bg-slate-950 flex overflow-hidden">
      {/* Left Sidebar - Compact */}
      <aside className="w-16 lg:w-56 flex-shrink-0 bg-slate-900/80 border-r border-white/5 flex flex-col">
        {/* Logo - PremiumRadar Brand Mark */}
        {/* S369: Links to /workspace, not /dashboard */}
        <Link href="/workspace" className="p-3 lg:p-4 flex items-center gap-3 border-b border-white/5 hover:bg-white/5 transition-colors">
          <PremiumRadarLogo size="md" color={industryConfig.primaryColor} animate={isProcessing} />
          <span className="font-bold text-white hidden lg:inline">PremiumRadar</span>
        </Link>

        {/* S390: Context and Assistant sections REMOVED - already in workspace header */}

        {/* S372: Dynamic Left Rail - Sections appear/disappear based on state */}
        <div className="flex-1 overflow-y-auto hidden lg:block">
          <LeftRail />
        </div>

        {/* S390: Admin link REMOVED - not needed for regular users */}
      </aside>

      {/* Main Content - Full Width SIVA */}
      <main className="flex-1 relative overflow-hidden">
        {/* S371: Card-centric WorkspaceSurface replaces SIVASurface */}
        <WorkspaceSurface />
      </main>
    </div>
  );
}

export default PagelessShell;
