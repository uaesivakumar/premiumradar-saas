'use client';

/**
 * WorkspaceSurface - S371: Pageless Core Surface
 *
 * WORKSPACE UX (LOCKED):
 * - Single-canvas workspace surface
 * - Renders cards in priority order
 * - Max 2-line summaries, expand on demand
 * - No chat bubbles, no conversation transcript
 * - Cards are the only visible artifacts
 *
 * See docs/WORKSPACE_UX_DECISION.md (LOCKED)
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCardStore, startTTLEngine, stopTTLEngine } from '@/lib/stores/card-store';
import { useSalesContext } from '@/lib/intelligence/hooks/useSalesContext';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';
import { ContextBar } from './ContextBar';
import { CardContainer } from './CardContainer';
import { SystemState } from './SystemState';
import { CommandPalette } from './CommandPalette';

export function WorkspaceSurface() {
  const cards = useCardStore((state) => state.getActiveCards());
  const nba = useCardStore((state) => state.getNBA());
  const { subVerticalName, regionsDisplay, verticalName } = useSalesContext();
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);

  // Start TTL engine on mount
  useEffect(() => {
    startTTLEngine();
    return () => stopTTLEngine();
  }, []);

  const hasCards = cards.length > 0;
  const systemState = hasCards ? (nba ? 'live' : 'waiting') : 'no-signals';

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-950">
      {/* Neural Mesh Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: `${industryConfig.primaryColor}15` }}
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: `${industryConfig.secondaryColor}15` }}
          animate={{
            x: [0, -40, 0],
            y: [0, -20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Context Bar */}
      <ContextBar
        workspaceName={verticalName}
        subVertical={subVerticalName}
        region={regionsDisplay}
        systemState={systemState}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-8 lg:px-16 py-6">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="popLayout">
            {hasCards ? (
              <CardContainer cards={cards} nba={nba} />
            ) : (
              <SystemState type="no-signals" primaryColor={industryConfig.primaryColor} />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Command Palette (Bottom) */}
      <div className="flex-shrink-0 p-4 md:p-6 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent">
        <div className="max-w-3xl mx-auto">
          <CommandPalette />
        </div>
      </div>
    </div>
  );
}

export default WorkspaceSurface;
