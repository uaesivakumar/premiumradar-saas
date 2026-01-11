'use client';

/**
 * IntelligenceStateBanner - S394: Workspace Intelligence State
 *
 * A thin, single-line banner that provides situational clarity
 * about the system's current intelligence state.
 *
 * RULES (LOCKED):
 * - One line only, always visible
 * - Derived from existing state only (no AI)
 * - No interaction, no dismiss
 * - Deterministic: same state → same banner
 * - No emojis, no emphasis, neutral styling
 *
 * This is instrumentation, not guidance.
 */

import React from 'react';
import { useCardStore } from '@/lib/stores/card-store';
import { useDiscoveryContextStore, selectIsDiscoveryActive } from '@/lib/workspace/discovery-context';

/**
 * S394: Banner state priority (first match wins)
 * Computed from CardStore and discovery state only
 */
type BannerState =
  | 'new-leads'        // New opportunities detected today
  | 'nba-available'    // 1 high-priority action available
  | 'monitoring'       // No urgent actions — monitoring signals
  | 'nothing-new'      // Nothing new since your last check
  | 'no-match'         // No leads match your current criteria
  | 'empty'            // No leads yet — discovery is active
  | 'discovering';     // Discovery in progress

/**
 * Banner text mapping - deterministic, no AI
 */
const BANNER_TEXT: Record<BannerState, string> = {
  'new-leads': 'New opportunities detected today',
  'nba-available': 'Opportunities in your pipeline',
  'monitoring': 'No urgent actions — monitoring signals',
  'nothing-new': 'Nothing new since your last check',
  'no-match': 'No leads match your current criteria',
  'empty': 'No leads yet — run a discovery',
  'discovering': 'Finding opportunities...',
};

/**
 * Compute banner state from CardStore and discovery context
 * Priority order: first match wins
 */
function computeBannerState(
  cards: ReturnType<typeof useCardStore.getState>['cards'],
  isDiscoveryActive: boolean
): BannerState {
  // Check discovery first
  if (isDiscoveryActive) {
    return 'discovering';
  }

  // Get signal cards only (leads)
  const signalCards = cards.filter(c => c.type === 'signal');
  const activeLeads = signalCards.filter(c => c.status === 'active');
  const savedLeads = signalCards.filter(c => c.status === 'saved');
  const evaluatingLeads = signalCards.filter(c => c.status === 'evaluating');

  // Get NBA cards
  const nbaCards = cards.filter(c => c.type === 'nba');

  // Priority 1: Check for new leads (created today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const newLeadsToday = activeLeads.filter(c => {
    const created = new Date(c.createdAt);
    return created >= today;
  });

  if (newLeadsToday.length > 0) {
    return 'new-leads';
  }

  // Priority 2: NBA available (saved or evaluating leads exist)
  if (savedLeads.length > 0 || evaluatingLeads.length > 0) {
    return 'nba-available';
  }

  // Priority 3: Active leads exist but none new today
  if (activeLeads.length > 0) {
    return 'nothing-new';
  }

  // Priority 4: Has any signal cards at all (monitoring)
  if (signalCards.length > 0) {
    return 'monitoring';
  }

  // Priority 5: Empty workspace
  return 'empty';
}

export function IntelligenceStateBanner() {
  const cards = useCardStore((state) => state.cards);
  const isDiscoveryActive = useDiscoveryContextStore(selectIsDiscoveryActive);

  const bannerState = computeBannerState(cards, isDiscoveryActive);
  const bannerText = BANNER_TEXT[bannerState];

  return (
    <div className="px-4 py-2 text-center">
      <p className="text-xs text-gray-500">
        {bannerText}
      </p>
    </div>
  );
}

export default IntelligenceStateBanner;
