/**
 * Intent Wrapper Hook - S43
 *
 * Wraps the existing submitQuery function with intent classification.
 *
 * Pattern:
 *   1. User query comes in
 *   2. Apply Sales Context (Vertical/Sub-Vertical/Region)
 *   3. Resolve references from context memory
 *   4. IntentClassifier analyzes query → Intent
 *   5. EntityExtractor extracts entities
 *   6. QueryNormalizer normalizes query
 *   7. ContextMemory stores for follow-ups
 *   8. THEN calls existing submitQuery (unchanged)
 *
 * CRITICAL: This hook WRAPS submitQuery, it does NOT replace it.
 *
 * IMPORTANT: All intelligence is filtered by Sales Context:
 *   Vertical → Sub-Vertical → Region
 */

'use client';

import { useCallback } from 'react';
import { useSIVAStore } from '@/lib/stores/siva-store';
import { useIntentStore } from '@/lib/stores/intent-store';
import { useSalesContextStore } from '@/lib/stores/sales-context-store';
import {
  classifyIntent,
  extractEntities,
  normalizeQuery,
  needsContextResolution,
  getRequiredAgents,
} from '../intent';
import type { IntentClassification, EntityExtractionResult, NormalizedQuery } from '../intent/types';

// =============================================================================
// Types
// =============================================================================

export interface IntentWrapperResult {
  /**
   * Process a query through the intelligence layer, then call submitQuery
   */
  processQuery: (query: string) => Promise<void>;

  /**
   * Current intent classification
   */
  currentIntent: IntentClassification | null;

  /**
   * Current extracted entities
   */
  currentEntities: EntityExtractionResult | null;

  /**
   * Current normalized query
   */
  currentNormalized: NormalizedQuery | null;

  /**
   * Whether classification is in progress
   */
  isProcessing: boolean;

  /**
   * Recent companies from context memory
   */
  recentCompanies: string[];

  /**
   * Recent sectors from context memory
   */
  recentSectors: string[];

  /**
   * Recent regions from context memory
   */
  recentRegions: string[];

  /**
   * Clear context memory
   */
  clearContext: () => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Intent Wrapper Hook
 *
 * Usage:
 *   const { processQuery, currentIntent, recentCompanies } = useIntentWrapper();
 *   await processQuery("Find banking companies in UAE");
 *
 * Follow-up with context:
 *   await processQuery("Score them"); // "them" resolves to found companies
 */
export function useIntentWrapper(): IntentWrapperResult {
  // Existing SIVA store (UNCHANGED - we wrap, not replace)
  const { submitQuery, setActiveAgent } = useSIVAStore();

  // Sales Context (Vertical/Sub-Vertical/Region)
  const salesContext = useSalesContextStore((state) => state.context);

  // New intent store (S43)
  const {
    currentIntent,
    currentEntities,
    currentNormalized,
    contextMemory,
    isClassifying,
    setIsClassifying,
    setClassificationError,
    processClassification,
    resolveQueryReferences,
    addContextResponse,
    clearContextMemory,
  } = useIntentStore();

  /**
   * Main processing function - wraps submitQuery with intelligence
   */
  const processQuery = useCallback(
    async (query: string) => {
      setIsClassifying(true);
      setClassificationError(null);

      try {
        // ─────────────────────────────────────────────────────────────────────
        // Step 1: Resolve references from context memory
        // ─────────────────────────────────────────────────────────────────────
        let resolvedQuery = query;

        if (needsContextResolution(query)) {
          const { resolvedQuery: resolved, hadResolutions } = resolveQueryReferences(query);
          if (hadResolutions) {
            resolvedQuery = resolved;
            console.log(`[Intent] Resolved query: "${query}" → "${resolvedQuery}"`);
          }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Step 2: Classify intent
        // ─────────────────────────────────────────────────────────────────────
        const intent = classifyIntent(resolvedQuery);
        console.log(`[Intent] Classified: ${intent.primary.type} (${(intent.primary.confidence * 100).toFixed(1)}%)`);

        // ─────────────────────────────────────────────────────────────────────
        // Step 3: Extract entities
        // ─────────────────────────────────────────────────────────────────────
        const entities = extractEntities(resolvedQuery);
        console.log(`[Intent] Entities:`, {
          companies: entities.companies,
          sectors: entities.sectors,
          regions: entities.regions,
          signals: entities.signals,
        });

        // ─────────────────────────────────────────────────────────────────────
        // Step 4: Normalize query with Sales Context
        // ─────────────────────────────────────────────────────────────────────
        const normalized = normalizeQuery(resolvedQuery, intent, entities);

        // Inject Sales Context into normalized parameters
        // This ensures all downstream operations respect Vertical/Sub-Vertical/Regions
        const regionsStr = salesContext.regions.length > 0 ? salesContext.regions.join('+') : 'no-regions';
        normalized.parameters = {
          ...normalized.parameters,
          salesContext: {
            vertical: salesContext.vertical,
            subVertical: salesContext.subVertical,
            regions: salesContext.regions,
          },
        };

        console.log(`[Intent] Normalized: "${normalized.normalized}"`);
        console.log(`[Intent] Sales Context: ${salesContext.vertical}/${salesContext.subVertical}/${regionsStr}`);

        // ─────────────────────────────────────────────────────────────────────
        // Step 5: Store in context memory and update state
        // ─────────────────────────────────────────────────────────────────────
        processClassification(intent, entities, normalized);

        // ─────────────────────────────────────────────────────────────────────
        // Step 6: Set active agent based on intent
        // ─────────────────────────────────────────────────────────────────────
        const requiredAgents = getRequiredAgents(intent);
        if (requiredAgents.length > 0) {
          // Set the first agent as active
          // (Multi-agent orchestration will be handled by useRoutingWrapper in S45)
          setActiveAgent(requiredAgents[0]);
        }

        // ─────────────────────────────────────────────────────────────────────
        // Step 7: Call existing submitQuery (UNCHANGED)
        // ─────────────────────────────────────────────────────────────────────
        // The intelligence layer has processed, now pass to execution layer
        await submitQuery(normalized.normalized);

        // ─────────────────────────────────────────────────────────────────────
        // Step 8: Update context with response info
        // ─────────────────────────────────────────────────────────────────────
        addContextResponse(
          requiredAgents,
          [intent.primary.type],
          entities.companies
        );

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setClassificationError(message);
        console.error('[Intent] Classification error:', message);

        // Fallback: still call submitQuery with original query
        await submitQuery(query);
      } finally {
        setIsClassifying(false);
      }
    },
    [
      submitQuery,
      setActiveAgent,
      setIsClassifying,
      setClassificationError,
      processClassification,
      resolveQueryReferences,
      addContextResponse,
    ]
  );

  return {
    processQuery,
    currentIntent,
    currentEntities,
    currentNormalized,
    isProcessing: isClassifying,
    recentCompanies: contextMemory.recentCompanies,
    recentSectors: contextMemory.recentSectors,
    recentRegions: contextMemory.recentRegions,
    clearContext: clearContextMemory,
  };
}
