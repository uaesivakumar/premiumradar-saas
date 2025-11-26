/**
 * Intent Wrapper Hook - S43
 *
 * Wraps the existing submitQuery function with intent classification.
 *
 * Pattern:
 *   1. User query comes in
 *   2. IntentClassifier analyzes query → Intent
 *   3. EntityExtractor extracts entities
 *   4. QueryNormalizer normalizes query
 *   5. ContextMemory stores for follow-ups
 *   6. THEN calls existing submitQuery (unchanged)
 *
 * CRITICAL: This hook WRAPS submitQuery, it does NOT replace it.
 */

'use client';

import { useCallback, useState } from 'react';
import { useSIVAStore } from '@/lib/stores/siva-store';
import type {
  Intent,
  IntentType,
  ExtractedEntity,
  NormalizedQuery,
  ContextMemoryEntry,
  IntentWrapperResult,
} from '../types';

// Placeholder - will be implemented in S43
const classifyIntent = async (query: string): Promise<Intent> => {
  // TODO: S43 - Implement IntentClassifier
  return {
    type: 'meta.unknown' as IntentType,
    confidence: 0.5,
    agents: ['discovery'],
    entities: [],
    normalized: {
      original: query,
      normalized: query,
      parameters: {},
    },
  };
};

// Placeholder - will be implemented in S43
const extractEntities = async (query: string): Promise<ExtractedEntity[]> => {
  // TODO: S43 - Implement EntityExtractor
  return [];
};

// Placeholder - will be implemented in S43
const normalizeQuery = (query: string, intent: Intent): NormalizedQuery => {
  // TODO: S43 - Implement QueryNormalizer
  return {
    original: query,
    normalized: query,
    parameters: {},
  };
};

/**
 * Intent Wrapper Hook
 *
 * Usage:
 *   const { processQuery, currentIntent, contextMemory } = useIntentWrapper();
 *   await processQuery("Find banking companies in UAE");
 */
export function useIntentWrapper(): IntentWrapperResult {
  const { submitQuery } = useSIVAStore();

  const [currentIntent, setCurrentIntent] = useState<Intent | null>(null);
  const [contextMemory, setContextMemory] = useState<ContextMemoryEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const processQuery = useCallback(
    async (query: string) => {
      setIsProcessing(true);

      try {
        // Step 1: Classify intent
        const intent = await classifyIntent(query);
        setCurrentIntent(intent);

        // Step 2: Extract entities
        const entities = await extractEntities(query);
        intent.entities = entities;

        // Step 3: Normalize query
        const normalized = normalizeQuery(query, intent);
        intent.normalized = normalized;

        // Step 4: Store in context memory for follow-ups
        const memoryEntry: ContextMemoryEntry = {
          id: `ctx-${Date.now()}`,
          query,
          intent,
          timestamp: new Date(),
          entities,
          resolved: {},
        };
        setContextMemory((prev) => [...prev.slice(-9), memoryEntry]); // Keep last 10

        // Step 5: Call existing submitQuery (UNCHANGED)
        // The intelligence layer has processed, now pass to execution layer
        await submitQuery(normalized.normalized);
      } finally {
        setIsProcessing(false);
      }
    },
    [submitQuery]
  );

  return {
    processQuery,
    currentIntent,
    contextMemory,
    isProcessing,
  };
}
