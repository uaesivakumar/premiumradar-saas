'use client';

/**
 * Pageless Shell - EB Journey PART 3
 *
 * SIVA-first interface without legacy sidebar navigation.
 * The AI surface IS the interface - no page navigation needed.
 *
 * Features:
 * - Full-screen SIVA surface
 * - Minimal header with context badge
 * - No sidebar navigation
 * - SIVA handles all Discovery, Ranking, Outreach, Intelligence
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useSalesContext } from '@/lib/intelligence/hooks/useSalesContext';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';
import { SIVASurface } from '@/components/siva/SIVASurface';
import { Sparkles, Settings, HelpCircle, Shield } from 'lucide-react';
import Link from 'next/link';

interface PagelessShellProps {
  children?: React.ReactNode;
}

export function PagelessShell({ children }: PagelessShellProps) {
  const { subVerticalName, regionsDisplay, contextBadge } = useSalesContext();
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Minimal Header */}
      <header className="flex-shrink-0 h-14 border-b border-white/10 bg-slate-900/50 backdrop-blur-sm flex items-center justify-between px-4">
        {/* Logo + Context */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: industryConfig.primaryColor }}
            >
              PR
            </div>
            <span className="font-bold text-white hidden sm:inline">PremiumRadar</span>
          </Link>

          {/* Context Badge */}
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-white/80">{contextBadge || `${subVerticalName} · ${regionsDisplay}`}</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/admin"
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Admin"
          >
            <Shield className="w-5 h-5" />
          </Link>
          <Link
            href="/dashboard/settings"
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </Link>
          <Link
            href="/dashboard/help"
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Main Content - Full Screen SIVA */}
      <main className="flex-1 relative">
        <SIVASurface />
      </main>
    </div>
  );
}

export default PagelessShell;
