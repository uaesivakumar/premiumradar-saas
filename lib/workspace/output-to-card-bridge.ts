/**
 * Output to Card Bridge - S370: Card State Foundation
 *
 * Bridges the deprecated OutputObject to the new Card model.
 * This allows gradual migration from the old SIVA store model
 * to the new card-based workspace model.
 *
 * TODO: Remove this bridge in S371 after UI migration
 */

import {
  Card,
  CardType,
  createCard,
  createSignalCard,
  DEFAULT_PRIORITIES,
} from './card-state';
import { getExpiryTime } from './ttl-engine';
import type { OutputObject, OutputObjectType } from '@/lib/stores/siva-store';

// =============================================================================
// TYPE MAPPING
// =============================================================================

/**
 * Map OutputObjectType to CardType
 */
const OUTPUT_TO_CARD_TYPE: Record<OutputObjectType, CardType> = {
  discovery: 'signal',
  scoring: 'signal',
  ranking: 'signal',
  outreach: 'signal',
  insight: 'signal',
  contacts: 'signal',
  message: 'system',
  'deal-verdict': 'decision',
};

// =============================================================================
// CONVERSION FUNCTIONS
// =============================================================================

/**
 * Convert an OutputObject to a Card
 */
export function outputObjectToCard(output: OutputObject): Card {
  const cardType = OUTPUT_TO_CARD_TYPE[output.type] || 'signal';

  // Extract entity info from data if available
  const entityId = output.data?.companyId as string | undefined ||
                   output.data?.entityId as string | undefined;
  const entityName = output.data?.company as string | undefined ||
                     output.data?.name as string | undefined ||
                     output.data?.entityName as string | undefined;

  // Build summary from data
  const summary = buildSummary(output);

  return createCard({
    type: cardType,
    priority: DEFAULT_PRIORITIES[cardType],
    title: output.title,
    summary,
    expiresAt: getExpiryTime(cardType),
    sourceType: 'signal',
    entityId,
    entityName,
    expandedContent: output.data,
    actions: getActionsForType(output.type),
    tags: [output.type, output.agent],
  });
}

/**
 * Convert multiple OutputObjects to Cards
 */
export function outputObjectsToCards(outputs: OutputObject[]): Card[] {
  return outputs.map(outputObjectToCard);
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Build a 2-line summary from output data
 */
function buildSummary(output: OutputObject): string {
  const data = output.data;

  switch (output.type) {
    case 'discovery': {
      const companies = data.companies as Array<{ name: string }> | undefined;
      const count = companies?.length || 0;
      const topCompany = companies?.[0]?.name;
      if (count > 0 && topCompany) {
        return `${count} companies found. ${topCompany} leads.`;
      }
      return 'Discovery results available.';
    }

    case 'scoring': {
      const score = data.score as number | undefined;
      const tier = data.tier as string | undefined;
      if (score !== undefined) {
        return `Score: ${score}/100 (${tier || 'Unknown'})`;
      }
      return 'Scoring complete.';
    }

    case 'ranking': {
      const rankings = data.rankings as Array<{ name: string }> | undefined;
      const count = rankings?.length || 0;
      const top = rankings?.[0]?.name;
      if (count > 0 && top) {
        return `${count} ranked. ${top} is #1.`;
      }
      return 'Ranking complete.';
    }

    case 'outreach': {
      const company = data.company as string | undefined;
      const channel = data.channel as string | undefined;
      return company
        ? `${channel || 'Outreach'} for ${company}`
        : 'Outreach generated.';
    }

    case 'contacts': {
      const contacts = data.contacts as Array<unknown> | undefined;
      const company = data.company as string | undefined;
      const count = contacts?.length || 0;
      return company
        ? `${count} contacts at ${company}`
        : `${count} contacts found.`;
    }

    case 'deal-verdict': {
      const verdict = data.verdict as string | undefined;
      const confidence = data.confidence as number | undefined;
      if (verdict) {
        return `${verdict} (${(confidence || 0) * 100}% confidence)`;
      }
      return 'Deal verdict available.';
    }

    default:
      return output.title;
  }
}

/**
 * Get default actions for an output type
 */
function getActionsForType(type: OutputObjectType): Card['actions'] {
  switch (type) {
    case 'discovery':
    case 'ranking':
      return [
        // S393: CTA labels encode intent + consequence
        { id: 'view', label: 'View details', type: 'primary', handler: 'card.view' },
        { id: 'save', label: 'Keep for follow-up', type: 'secondary', handler: 'card.save' },
        { id: 'dismiss', label: 'Ignore for now', type: 'dismiss', handler: 'card.dismiss' },
      ];

    case 'outreach':
      return [
        { id: 'send', label: 'Send', type: 'primary', handler: 'outreach.send' },
        { id: 'edit', label: 'Edit', type: 'secondary', handler: 'outreach.edit' },
        { id: 'dismiss', label: 'Dismiss', type: 'dismiss', handler: 'card.dismiss' },
      ];

    case 'contacts':
      return [
        { id: 'contact', label: 'Contact', type: 'primary', handler: 'contacts.reach' },
        { id: 'enrich', label: 'Enrich', type: 'secondary', handler: 'contacts.enrich' },
        { id: 'dismiss', label: 'Dismiss', type: 'dismiss', handler: 'card.dismiss' },
      ];

    case 'deal-verdict':
      return [
        { id: 'view-reasoning', label: 'Why?', type: 'primary', handler: 'decision.viewReasoning' },
        { id: 'override', label: 'Override', type: 'secondary', handler: 'decision.override' },
      ];

    default:
      return [
        { id: 'dismiss', label: 'Dismiss', type: 'dismiss', handler: 'card.dismiss' },
      ];
  }
}
