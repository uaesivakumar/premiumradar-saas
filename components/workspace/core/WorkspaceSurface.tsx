'use client';

/**
 * WorkspaceSurface - S371: Pageless Core Surface
 * S374: NBA → Card Wiring integration
 *
 * WORKSPACE UX (LOCKED):
 * - Single-canvas workspace surface
 * - Renders cards in priority order
 * - Max 2-line summaries, expand on demand
 * - No chat bubbles, no conversation transcript
 * - Cards are the only visible artifacts
 * - Only ONE NBA card at any time (enforced by CardStore)
 *
 * See docs/WORKSPACE_UX_DECISION.md (LOCKED)
 */

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCardStore, startTTLEngine, stopTTLEngine } from '@/lib/stores/card-store';
import { useSalesContext } from '@/lib/intelligence/hooks/useSalesContext';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';
import { useWorkspaceNBA } from '@/lib/workspace/hooks';
import { dispatchAction, ActionContext } from '@/lib/workspace/action-handlers';
import { ContextBar } from './ContextBar';
import { CardContainer } from './CardContainer';
import { SystemState } from './SystemState';
import { CommandPalette } from './CommandPalette';
import { DiscoveryLoader } from './DiscoveryLoader';
import { useDiscoveryContextStore, selectIsDiscoveryActive } from '@/lib/workspace/discovery-context';

export function WorkspaceSurface() {
  const cards = useCardStore((state) => state.getActiveCards());
  const actOnCard = useCardStore((state) => state.actOnCard);
  const dismissCard = useCardStore((state) => state.dismissCard);
  const { subVerticalName, regionsDisplay, verticalName } = useSalesContext();
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);

  // S381: Discovery loader state
  const isDiscoveryActive = useDiscoveryContextStore(selectIsDiscoveryActive);

  // S374: NBA lifecycle management
  const { nba, handleAction: handleNBAAction, getContext } = useWorkspaceNBA({
    autoFetch: true,
    autoRefresh: true,
  });

  // Start TTL engine on mount
  useEffect(() => {
    startTTLEngine();
    return () => stopTTLEngine();
  }, []);

  // S374: Handle card actions
  const handleCardAction = useCallback(async (cardId: string, actionId: string) => {
    const card = cards.find(c => c.id === cardId) || nba;
    if (!card) {
      console.warn('[WorkspaceSurface] Card not found:', cardId);
      return;
    }

    const action = card.actions?.find(a => a.id === actionId);
    if (!action) {
      console.warn('[WorkspaceSurface] Action not found:', actionId);
      return;
    }

    // Get action context
    const nbaContext = getContext();
    const actionContext: ActionContext = {
      tenantId: nbaContext.tenantId,
      userId: nbaContext.userId,
      workspaceId: nbaContext.workspaceId,
    };

    console.log('[WorkspaceSurface] Dispatching action:', action.handler);

    const result = await dispatchAction(action.handler, card, actionContext);

    if (!result.success) {
      console.error('[WorkspaceSurface] Action failed:', result.error);
      // TODO: Show error card
    }

    // Handle navigation if needed
    if (result.nextAction === 'navigate' && result.navigateTo) {
      // For now, just log - navigation will be implemented later
      console.log('[WorkspaceSurface] Navigate to:', result.navigateTo);
    }
  }, [cards, nba, getContext]);

  const hasCards = cards.length > 0;
  const systemState = isDiscoveryActive ? 'discovering' : (hasCards ? (nba ? 'live' : 'waiting') : 'no-signals');

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
            {isDiscoveryActive ? (
              <DiscoveryLoader
                region={regionsDisplay}
                subVertical={subVerticalName}
                primaryColor={industryConfig.primaryColor}
              />
            ) : hasCards ? (
              <CardContainer cards={cards} nba={nba} onAction={handleCardAction} />
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
