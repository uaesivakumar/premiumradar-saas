/**
 * Recall Engine - S375: Decision Persistence & Recall
 *
 * Enables users to recall past decisions by entity name.
 * Supports fuzzy matching and generates recall cards.
 *
 * WORKSPACE UX (LOCKED):
 * - Recall shows decisions, not conversations
 * - No chat history stored or replayed
 * - Fuzzy name matching supported
 *
 * See docs/WORKSPACE_UX_DECISION.md (LOCKED)
 */

import {
  Decision,
  searchDecisionsByName,
  getDecisionsForEntity,
  getLatestDecision,
  formatDecisionSummary,
  getDecisionLabel,
} from './decision-store';
import { Card, CardAction } from './card-state';
import { getExpiryTime } from './ttl-engine';

// =============================================================================
// TYPES
// =============================================================================

export interface RecallQuery {
  entityId?: string;
  entityName?: string;
  decisionType?: string;
  timeRange?: { from: Date; to: Date };
}

export interface RecallResult {
  decision: Decision;
  similarity: number;  // 0-100, 100 = exact match
  matchType: 'exact' | 'fuzzy' | 'id';
}

// =============================================================================
// RECALL ENGINE
// =============================================================================

/**
 * Recall past decisions based on query
 */
export async function recall(query: RecallQuery): Promise<RecallResult[]> {
  const results: RecallResult[] = [];

  // If entity ID is provided, get exact match
  if (query.entityId) {
    const decisions = await getDecisionsForEntity(query.entityId, { limit: 5 });
    for (const decision of decisions) {
      results.push({
        decision,
        similarity: 100,
        matchType: 'id',
      });
    }
    return results;
  }

  // If entity name is provided, search by name (fuzzy)
  if (query.entityName) {
    const decisions = await searchDecisionsByName(query.entityName, { limit: 5 });

    for (const decision of decisions) {
      const similarity = calculateSimilarity(query.entityName, decision.entityName);
      results.push({
        decision,
        similarity,
        matchType: similarity === 100 ? 'exact' : 'fuzzy',
      });
    }

    // Sort by similarity (highest first)
    results.sort((a, b) => b.similarity - a.similarity);
    return results;
  }

  return results;
}

/**
 * Calculate similarity between two strings (0-100)
 */
function calculateSimilarity(query: string, target: string): number {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();

  // Exact match
  if (q === t) return 100;

  // Contains match
  if (t.includes(q)) {
    return 80 + (q.length / t.length) * 20;
  }

  // Word match
  const queryWords = q.split(/\s+/);
  const targetWords = t.split(/\s+/);
  let matchedWords = 0;

  for (const qWord of queryWords) {
    if (targetWords.some(tWord => tWord.includes(qWord) || qWord.includes(tWord))) {
      matchedWords++;
    }
  }

  if (matchedWords > 0) {
    return 50 + (matchedWords / queryWords.length) * 30;
  }

  // Partial character match (Levenshtein-ish)
  let matches = 0;
  for (let i = 0; i < Math.min(q.length, t.length); i++) {
    if (q[i] === t[i]) matches++;
  }

  return Math.round((matches / Math.max(q.length, t.length)) * 50);
}

// =============================================================================
// RECALL CARD GENERATION
// =============================================================================

/**
 * Recall card actions
 */
export const RECALL_ACTIONS: CardAction[] = [
  {
    id: 're-evaluate',
    label: 'Re-evaluate',
    type: 'primary',
    handler: 'recall.reEvaluate',
  },
  {
    id: 'view-reasoning',
    label: 'View Reasoning',
    type: 'secondary',
    handler: 'recall.viewReasoning',
  },
];

/**
 * Generate recall card for a decision
 */
export function createRecallCard(
  result: RecallResult
): Omit<Card, 'id' | 'createdAt' | 'status'> {
  const { decision, similarity, matchType } = result;

  return {
    type: 'recall',
    priority: 400, // Below decisions, above system
    title: decision.entityName,
    summary: formatDecisionSummary(decision),
    expandedContent: {
      decision: decision.decision,
      decisionLabel: getDecisionLabel(decision.decision),
      reason: decision.reason,
      confidence: decision.confidence,
      date: decision.createdAt.toISOString(),
      matchType,
      similarity,
      metadata: decision.metadata,
    },
    expiresAt: getExpiryTime('recall'),
    sourceType: 'recall',
    sourceId: decision.id,
    entityId: decision.entityId,
    entityName: decision.entityName,
    entityType: decision.entityType,
    actions: RECALL_ACTIONS,
    tags: [
      'recall',
      `decision-${decision.decision}`,
      matchType === 'fuzzy' ? 'fuzzy-match' : 'exact-match',
    ],
  };
}

/**
 * Generate recall cards for multiple results
 */
export function createRecallCards(
  results: RecallResult[]
): Omit<Card, 'id' | 'createdAt' | 'status'>[] {
  return results.map(createRecallCard);
}

/**
 * Generate "not found" card when no decisions exist
 */
export function createNoRecallCard(
  entityName: string
): Omit<Card, 'id' | 'createdAt' | 'status'> {
  return {
    type: 'system',
    priority: 100,
    title: `No history for "${entityName}"`,
    summary: `No previous decisions found for this entity. Would you like to evaluate now?`,
    expiresAt: getExpiryTime('system'),
    sourceType: 'system',
    actions: [
      {
        id: 'evaluate-now',
        label: 'Evaluate Now',
        type: 'primary',
        handler: 'recall.evaluateNew',
      },
      {
        id: 'dismiss',
        label: 'Dismiss',
        type: 'dismiss',
        handler: 'system.dismiss',
      },
    ],
    tags: ['recall', 'not-found'],
  };
}

// =============================================================================
// RECALL FROM COMMAND RESOLVER
// =============================================================================

/**
 * Handle recall query and return appropriate cards
 * Called by command-resolver when intent is 'recall'
 */
export async function handleRecallQuery(
  entityName: string
): Promise<Omit<Card, 'id' | 'createdAt' | 'status'>[]> {
  console.log('[RecallEngine] Recalling decisions for:', entityName);

  const results = await recall({ entityName });

  if (results.length === 0) {
    console.log('[RecallEngine] No decisions found');
    return [createNoRecallCard(entityName)];
  }

  console.log('[RecallEngine] Found', results.length, 'decisions');

  // Return cards for top matches
  const topResults = results.slice(0, 3);
  return createRecallCards(topResults);
}

// =============================================================================
// EXPORTS
// =============================================================================

export const recallEngine = {
  recall,
  handleRecallQuery,
  createRecallCard,
  createRecallCards,
  createNoRecallCard,
  RECALL_ACTIONS,
};

export default recallEngine;
