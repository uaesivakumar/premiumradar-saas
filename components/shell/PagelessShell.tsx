'use client';

/**
 * Pageless Shell - LEFT SIDEBAR LAYOUT
 *
 * SIVA-first interface with sidebar for maximum content width.
 * Sidebar: Logo + Context + SIVA Status + Settings
 * Main: Full-width AI surface
 *
 * UX PRINCIPLES:
 * - Full page width for content
 * - Sidebar is minimal and informative
 * - Logo: PremiumRadar (radar + AI symbol)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useSalesContext } from '@/lib/intelligence/hooks/useSalesContext';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';
import { useSIVAStore } from '@/lib/stores/siva-store';
import { SIVASurface } from '@/components/siva/SIVASurface';
import { PremiumRadarLogo } from '@/components/brand/PremiumRadarLogo';
import { Settings, HelpCircle, Shield, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface PagelessShellProps {
  children?: React.ReactNode;
}

export function PagelessShell({ children }: PagelessShellProps) {
  const { subVerticalName, regionsDisplay, verticalName } = useSalesContext();
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);
  const { state } = useSIVAStore();

  const isProcessing = state !== 'idle';

  return (
    <div className="h-screen bg-slate-950 flex overflow-hidden">
      {/* Left Sidebar - Compact */}
      <aside className="w-16 lg:w-56 flex-shrink-0 bg-slate-900/80 border-r border-white/5 flex flex-col">
        {/* Logo - PremiumRadar Brand Mark */}
        <Link href="/dashboard" className="p-3 lg:p-4 flex items-center gap-3 border-b border-white/5 hover:bg-white/5 transition-colors">
          <PremiumRadarLogo size="md" color={industryConfig.primaryColor} animate={isProcessing} />
          <span className="font-bold text-white hidden lg:inline">PremiumRadar</span>
        </Link>

        {/* Context Section */}
        <div className="p-3 lg:p-4 border-b border-white/5">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 hidden lg:block">Context</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-white/80">
              <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0"></span>
              <span className="text-xs lg:text-sm truncate hidden lg:inline">{verticalName}</span>
            </div>
            <div className="flex items-center gap-2 text-white/60 hidden lg:flex">
              <ChevronRight className="w-3 h-3 flex-shrink-0" />
              <span className="text-xs truncate">{subVerticalName}</span>
            </div>
            <div className="flex items-center gap-2 text-white/60 hidden lg:flex">
              <ChevronRight className="w-3 h-3 flex-shrink-0" />
              <span className="text-xs truncate">{regionsDisplay}</span>
            </div>
          </div>
        </div>

        {/* SIVA Status - With Heartbeat */}
        <motion.div
          className="p-3 lg:p-4 border-b border-white/5 relative"
          animate={isProcessing ? {
            boxShadow: [
              '0 0 0 0 rgba(168, 85, 247, 0)',
              '0 0 20px 2px rgba(168, 85, 247, 0.15)',
              '0 0 0 0 rgba(168, 85, 247, 0)',
            ],
          } : {}}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 hidden lg:block">Assistant</p>
          <div className="flex items-center gap-2">
            <motion.div
              className={`w-3 h-3 rounded-full ${isProcessing ? 'bg-purple-400' : 'bg-green-400'}`}
              animate={isProcessing ? {
                scale: [1, 1.3, 1],
                boxShadow: [
                  '0 0 0 0 rgba(168, 85, 247, 0.4)',
                  '0 0 0 8px rgba(168, 85, 247, 0)',
                  '0 0 0 0 rgba(168, 85, 247, 0)',
                ],
              } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
            <span className="text-xs text-white/80 hidden lg:inline">
              {state === 'idle' ? 'Ready' : state === 'thinking' ? 'Working...' : state === 'generating' ? 'Working...' : 'Working...'}
            </span>
          </div>
        </motion.div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Actions */}
        <div className="p-2 border-t border-white/5 space-y-1">
          <Link
            href="/dashboard/admin"
            className="flex items-center gap-3 p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Admin"
          >
            <Shield className="w-5 h-5" />
            <span className="text-sm hidden lg:inline">Admin</span>
          </Link>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm hidden lg:inline">Settings</span>
          </Link>
          <Link
            href="/dashboard/help"
            className="flex items-center gap-3 p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Help"
          >
            <HelpCircle className="w-5 h-5" />
            <span className="text-sm hidden lg:inline">Help</span>
          </Link>
        </div>
      </aside>

      {/* Main Content - Full Width SIVA */}
      <main className="flex-1 relative overflow-hidden">
        <SIVASurface />
      </main>
    </div>
  );
}

export default PagelessShell;
