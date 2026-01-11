'use client';

/**
 * WorkspaceSurface - S396: Conversational Workspace
 *
 * ARCHITECTURE (LOCKED):
 * - The workspace is a turn-based conversation
 * - System speaks only when useful
 * - CTAs are responses, not navigation
 * - Silence is a feature
 *
 * NOT A DASHBOARD. NOT A CRM.
 * A judgment interface for high-stakes operators.
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
import { CommandPalette } from './CommandPalette';
import { DiscoveryLoader } from './DiscoveryLoader';
import {
  SystemUtterance,
  buildStatusAcknowledgment,
  buildEmptyButActive,
} from './SystemUtterance';
import { useDiscoveryContextStore, selectIsDiscoveryActive } from '@/lib/workspace/discovery-context';

/**
 * S396: User query display (conversational)
 * Shows what the user asked, right-aligned like a chat
 */
function UserQuery({ query }: { query: string | null }) {
  if (!query) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-end mb-6"
    >
      <div className="max-w-[70%] px-4 py-2.5 rounded-2xl rounded-br-sm bg-white/10 text-gray-200 text-sm">
        {query}
      </div>
    </motion.div>
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
  // DEFAULT VIEW: Only show UNACTIONED (active) leads - saved/evaluating hidden until filtered
  // CRITICAL: When filtering by "ignored" (skipped), we need to look at ALL cards
  const cards = useMemo(() => {
    const { section, item } = activeFilter || {};

    // Only filter for leads/companies sections
    if (section === 'leads' || section === 'companies') {
      const targetStatus = filterToCardStatus[item as string];
      if (targetStatus) {
        // For dismissed/skipped, search raw cards since getActiveCards excludes them
        if (targetStatus === 'dismissed') {
          return rawCards.filter((card) => card.status === 'dismissed' && card.type === 'signal');
        }
        // For saved/evaluating, filter from activeCards
        return activeCards.filter((card) => card.status === targetStatus);
      }
    }

    // DEFAULT (no filter or other sections): Only show ACTIVE (unactioned) leads
    // This ensures saved/evaluating leads don't clutter the main workspace
    return activeCards.filter((card) => card.status === 'active');
  }, [activeCards, rawCards, activeFilter]);

  // S390: Track all cards (for sidebar counts - includes saved/evaluating)
  const allCards = activeCards;

  // S395: Check if actionable leads exist (saved/evaluating) for hierarchy rule
  // ACTION > SIGNAL > DATA: If actionable leads exist, workspace is NOT empty
  const hasActionableLeads = useMemo(() => {
    const signalCards = activeCards.filter(c => c.type === 'signal');
    return signalCards.some(c => c.status === 'saved' || c.status === 'evaluating');
  }, [activeCards]);

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
  // S396: System state for context bar only
  const systemState = isDiscoveryActive ? 'discovering' : (hasAllCards ? 'live' : 'no-signals');

  // S396: Count saved leads for utterance
  const savedLeadCount = useMemo(() => {
    return activeCards.filter(c => c.type === 'signal' && c.status === 'saved').length;
  }, [activeCards]);

  // S396: Handle utterance actions
  const handleUtteranceAction = useCallback((actionId: string) => {
    switch (actionId) {
      case 'prioritize':
      case 'saved':
        // Show saved leads
        useLeftRailStore.getState().setActiveFilter({ section: 'leads', item: 'saved' });
        break;
      case 'later':
      case 'monitor':
        // Do nothing - user chose to defer/monitor
        break;
      case 'discover':
      case 'new':
      case 'ask':
      case 'trending':
      case 'explore':
        // Focus the command palette - user can type to start
        document.querySelector<HTMLInputElement>('[data-command-input]')?.focus();
        break;
      case 'act':
        // Show the NBA card (already visible)
        break;
      case 'alternatives':
        // Clear filter to show all active leads
        useLeftRailStore.getState().setActiveFilter(null);
        break;
      default:
        console.log('[WorkspaceSurface] Unknown utterance action:', actionId);
    }
  }, []);

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

      {/* Context Bar - minimal, no banner */}
      <ContextBar
        workspaceName={verticalName}
        subVertical={subVerticalName}
        region={regionsDisplay}
        systemState={systemState}
      />

      {/* S396: Conversational Canvas - centered, prominent */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-8 lg:px-16 flex flex-col">
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col justify-center">
          {/* User's query (if any) */}
          {lastQuery && <UserQuery query={lastQuery} />}

          <AnimatePresence mode="popLayout">
            {isDiscoveryActive ? (
              /* Discovery in progress - this is fine, communicates active work */
              <DiscoveryLoader
                region={regionsDisplay}
                subVertical={subVerticalName}
                primaryColor={industryConfig.primaryColor}
              />
            ) : activeFilter ? (
              /* User is filtering - show filtered cards or empty message */
              hasCards ? (
                <CardContainer cards={cards} nba={null} onAction={handleCardAction} />
              ) : (
                <SystemUtterance
                  type="status_acknowledgment"
                  message={`No ${activeFilter.item === 'ignored' ? 'skipped' : (activeFilter.item || '').replace('_', ' ')} leads yet.`}
                  onAction={handleUtteranceAction}
                />
              )
            ) : hasCards ? (
              /* Active leads to work through - show cards */
              <CardContainer cards={cards} nba={nba} onAction={handleCardAction} />
            ) : hasActionableLeads ? (
              /* S396: STATUS_ACKNOWLEDGMENT - saved leads exist, no new signals */
              <SystemUtterance
                {...buildStatusAcknowledgment(savedLeadCount)}
                onAction={handleUtteranceAction}
              />
            ) : (
              /* S396: EMPTY_BUT_ACTIVE - nothing yet, monitoring */
              <SystemUtterance
                {...buildEmptyButActive(subVerticalName, regionsDisplay)}
                onAction={handleUtteranceAction}
              />
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
