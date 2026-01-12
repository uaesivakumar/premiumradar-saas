/**
 * Lead Hydration Service - S390
 *
 * S390 CRITICAL INVARIANT:
 * - Database is the SOURCE OF TRUTH for leads
 * - localStorage is a CACHE only
 * - On login/refresh, leads MUST be restored from database
 *
 * This service fetches leads from the OS and hydrates the card store.
 */

import { useCardStore } from '@/lib/stores/card-store';
import { Card, CardStatus, DEFAULT_PRIORITIES } from './card-state';

/**
 * Lead from database
 */
interface DBLead {
  entity_id: string;
  entity_name: string | null;
  lead_state: 'UNACTIONED' | 'EVALUATING' | 'SAVED' | 'SKIPPED';
  action_taken: string | null;
  action_at: string | null;
  first_seen_at: string;
  last_seen_at: string;
  seen_count: number;
  sales_context_hash: string;
}

/**
 * Map database lead_state to CardStatus
 */
function mapLeadStateToCardStatus(leadState: string): CardStatus {
  switch (leadState) {
    case 'EVALUATING':
      return 'evaluating';
    case 'SAVED':
      return 'saved';
    case 'SKIPPED':
      return 'dismissed';
    case 'UNACTIONED':
    default:
      return 'active';
  }
}

/**
 * Convert a database lead to a Card
 */
function leadToCard(lead: DBLead): Card {
  const status = mapLeadStateToCardStatus(lead.lead_state);

  return {
    id: `lead-${lead.entity_id}`,
    type: 'signal',
    priority: DEFAULT_PRIORITIES.signal,
    createdAt: new Date(lead.first_seen_at),
    expiresAt: null, // Leads from DB don't expire
    status,
    title: lead.entity_name || 'Unknown Company',
    summary: `Discovered lead - ${lead.lead_state.toLowerCase()}`,
    actions: [
      // S396: CTA labels - Enrich triggers contact discovery
      { id: 'enrich', label: 'Enrich', type: 'primary', handler: 'signal.enrich' },
      { id: 'save', label: 'Save', type: 'secondary', handler: 'signal.save' },
      { id: 'dismiss', label: 'Skip', type: 'dismiss', handler: 'signal.dismiss' },
    ],
    sourceType: 'signal',
    entityId: lead.entity_id,
    entityName: lead.entity_name || undefined,
    entityType: 'company',
    tags: ['signal', 'discovery', `state-${lead.lead_state.toLowerCase()}`],
  };
}

/**
 * Fetch leads from the OS API
 */
export async function fetchLeadsFromDB(
  states: string[] = ['UNACTIONED', 'EVALUATING', 'SAVED']
): Promise<DBLead[]> {
  try {
    const statesParam = states.join(',');
    const response = await fetch(`/api/os/novelty/leads?states=${statesParam}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('[LeadHydration] Failed to fetch leads:', response.status);
      return [];
    }

    const result = await response.json();

    if (!result.success) {
      console.error('[LeadHydration] API error:', result.error);
      return [];
    }

    console.log(`[LeadHydration] Fetched ${result.data.count} leads from DB`);
    return result.data.leads || [];
  } catch (error) {
    console.error('[LeadHydration] Error fetching leads:', error);
    return [];
  }
}

/**
 * Hydrate the card store from database leads
 *
 * This merges DB leads with any existing cards in the store,
 * giving priority to the database as the source of truth.
 */
export async function hydrateLeadsFromDB(): Promise<void> {
  const store = useCardStore.getState();

  try {
    // Fetch leads from DB
    const dbLeads = await fetchLeadsFromDB(['UNACTIONED', 'EVALUATING', 'SAVED']);

    if (dbLeads.length === 0) {
      console.log('[LeadHydration] No leads in DB, keeping localStorage state');
      return;
    }

    // Get current cards from store
    const currentCards = store.cards;

    // Convert DB leads to cards
    const dbCards = dbLeads.map(leadToCard);

    // Build a map of DB cards by entityId for quick lookup
    const dbCardMap = new Map<string, Card>();
    dbCards.forEach(card => {
      if (card.entityId) {
        dbCardMap.set(card.entityId, card);
      }
    });

    // Merge strategy:
    // 1. For each DB card, if there's a matching localStorage card with more details, use localStorage
    // 2. For localStorage cards not in DB, keep them (they might be freshly discovered)
    // 3. Update status from DB (DB is source of truth for state)

    const mergedCards: Card[] = [];
    const seenEntityIds = new Set<string>();

    // First, process localStorage cards and update their status from DB
    for (const localCard of currentCards) {
      if (localCard.entityId && dbCardMap.has(localCard.entityId)) {
        // Card exists in both - update status from DB, keep other details from localStorage
        const dbCard = dbCardMap.get(localCard.entityId)!;
        mergedCards.push({
          ...localCard,
          status: dbCard.status, // DB is source of truth for status
        });
        seenEntityIds.add(localCard.entityId);
      } else if (localCard.type !== 'signal') {
        // Non-signal cards (nba, system, etc.) - keep as-is
        mergedCards.push(localCard);
      } else if (localCard.entityId) {
        // Signal card not in DB - might be freshly discovered, keep it
        mergedCards.push(localCard);
        seenEntityIds.add(localCard.entityId);
      } else {
        // Card without entityId - keep it
        mergedCards.push(localCard);
      }
    }

    // Add DB cards that weren't in localStorage
    for (const dbCard of dbCards) {
      if (dbCard.entityId && !seenEntityIds.has(dbCard.entityId)) {
        mergedCards.push(dbCard);
      }
    }

    // Update the store
    store.rehydrate(mergedCards);

    console.log(`[LeadHydration] Hydrated ${mergedCards.length} cards (${dbLeads.length} from DB)`);
  } catch (error) {
    console.error('[LeadHydration] Error hydrating leads:', error);
    // Keep existing localStorage state on error
  }
}

/**
 * Hook to hydrate leads on component mount
 */
export function useLeadHydration(): { hydrate: () => Promise<void>; isHydrating: boolean } {
  const [isHydrating, setIsHydrating] = useState(false);

  const hydrate = useCallback(async () => {
    setIsHydrating(true);
    try {
      await hydrateLeadsFromDB();
    } finally {
      setIsHydrating(false);
    }
  }, []);

  return { hydrate, isHydrating };
}

// Need to import these for the hook
import { useState, useCallback } from 'react';
