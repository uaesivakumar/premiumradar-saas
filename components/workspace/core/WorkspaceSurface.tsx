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

import React, { useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCardStore, startTTLEngine, stopTTLEngine } from '@/lib/stores/card-store';
import { useLeftRailStore } from '@/lib/stores/left-rail-store';
import { useSalesContext } from '@/lib/intelligence/hooks/useSalesContext';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';
import { useWorkspaceNBA } from '@/lib/workspace/hooks';
import { dispatchAction, ActionContext } from '@/lib/workspace/action-handlers';
import { hydrateLeadsFromDB } from '@/lib/workspace/lead-hydration';
import { ContextBar } from './ContextBar';
import { CardContainer } from './CardContainer';
import { SystemState } from './SystemState';
import { CommandPalette } from './CommandPalette';
import { DiscoveryLoader } from './DiscoveryLoader';
import { useDiscoveryContextStore, selectIsDiscoveryActive } from '@/lib/workspace/discovery-context';

/**
 * S382: Inline query display (like ChatGPT)
 * Shows user's query above results, not as a card
 */
function QueryDisplay({ query }: { query: string | null }) {
  if (!query) return null;

  return (
    <div className="flex justify-end mb-4">
      <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-md bg-blue-600 text-white text-sm">
        {query}
      </div>
    </div>
  );
}

// S390: Map sidebar filter item to card status
const filterToCardStatus: Record<string, string> = {
  saved: 'saved',
  actioned: 'evaluating',
  ignored: 'dismissed',  // "Skipped" in UI
  unactioned: 'active',
};

// S390: Get ALL cards including dismissed (for filtering)
// Normal display excludes dismissed, but filter view needs them
function getAllCards(): ReturnType<typeof useCardStore.getState>['cards'] {
  return useCardStore.getState().cards;
}

export function WorkspaceSurface() {
  const activeCards = useCardStore((state) => state.getActiveCards());
  // S390: Get ALL cards including dismissed for filtering
  const rawCards = useCardStore((state) => state.cards);
  const actOnCard = useCardStore((state) => state.actOnCard);
  const dismissCard = useCardStore((state) => state.dismissCard);
  const { subVerticalName, regionsDisplay, verticalName } = useSalesContext();
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);

  // S390: Get sidebar filter
  const activeFilter = useLeftRailStore((state) => state.activeFilter);

  // S390: Filter cards based on sidebar selection
  // CRITICAL: When filtering by "ignored" (skipped), we need to look at ALL cards
  // including dismissed ones, not just active cards
  const cards = useMemo(() => {
    if (!activeFilter) {
      // No filter = show all visible cards (excludes dismissed)
      return activeCards;
    }

    const { section, item } = activeFilter;

    // Only filter for leads/companies sections
    if (section === 'leads' || section === 'companies') {
      const targetStatus = filterToCardStatus[item];
      if (targetStatus) {
        // For dismissed/skipped, search raw cards since getActiveCards excludes them
        if (targetStatus === 'dismissed') {
          return rawCards.filter((card) => card.status === 'dismissed' && card.type === 'signal');
        }
        return activeCards.filter((card) => card.status === targetStatus);
      }
    }

    // For other sections (reports, activities), show all for now
    return activeCards;
  }, [activeCards, rawCards, activeFilter]);

  // S390: Track all visible cards for counts (active view)
  const allCards = activeCards;

  // S381: Discovery loader state
  const isDiscoveryActive = useDiscoveryContextStore(selectIsDiscoveryActive);
  // S382: User's query for inline display
  const lastQuery = useDiscoveryContextStore((state) => state.lastQuery);

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

  // S390: Hydrate leads from database on mount
  // This ensures leads persist across logout/login
  useEffect(() => {
    hydrateLeadsFromDB().catch((error) => {
      console.error('[WorkspaceSurface] Failed to hydrate leads:', error);
    });
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
  const hasAllCards = allCards.length > 0;
  // S390: Check if filtering resulted in empty
  const isFilterEmpty = activeFilter && !hasCards && hasAllCards;
  // S382: Show "Live" when cards exist (not just when NBA exists)
  const systemState = isDiscoveryActive ? 'discovering' : (hasAllCards ? 'live' : 'no-signals');

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
          {/* S382: Show user's query inline (like ChatGPT) */}
          {lastQuery && <QueryDisplay query={lastQuery} />}

          <AnimatePresence mode="popLayout">
            {isDiscoveryActive ? (
              <DiscoveryLoader
                region={regionsDisplay}
                subVertical={subVerticalName}
                primaryColor={industryConfig.primaryColor}
              />
            ) : isFilterEmpty ? (
              /* S390: Empty state when filter has no results */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <span className="text-3xl">📋</span>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  No {activeFilter?.item === 'ignored' ? 'skipped' : activeFilter?.item?.replace('_', ' ')} leads
                </h3>
                <p className="text-sm text-gray-400 max-w-sm">
                  {activeFilter?.item === 'saved' && "You haven't saved any leads yet. Click 'Save' on a lead to add it here."}
                  {activeFilter?.item === 'actioned' && "No leads are being evaluated. Click 'Evaluate' on a lead to start."}
                  {activeFilter?.item === 'ignored' && "No leads have been skipped. Click 'Skip' on a lead to hide it."}
                  {activeFilter?.item === 'unactioned' && "All leads have been actioned. Run a new discovery to find more."}
                </p>
              </motion.div>
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
