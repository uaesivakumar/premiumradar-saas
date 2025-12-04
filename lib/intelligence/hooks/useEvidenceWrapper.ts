/**
 * Evidence Wrapper Hook - S44
 *
 * Wraps output object creation with evidence collection and reasoning.
 *
 * Pattern:
 *   1. Output object is created by existing agent
 *   2. Apply Sales Context filter (Vertical/Sub-Vertical/Region)
 *   3. EvidenceCollector gathers supporting evidence
 *   4. SignalReasoner creates reasoning chain
 *   5. ScoreJustifier explains scores
 *   6. THEN enriches the output object (does NOT replace)
 *
 * CRITICAL: This hook ENRICHES output objects, it does NOT replace creation.
 *
 * IMPORTANT: Evidence is filtered by Sales Context.
 * Only signals relevant to the salesperson's vertical/sub-vertical/region are shown.
 */

'use client';

import { useCallback } from 'react';
import { OutputObject } from '@/lib/stores/siva-store';
import { useEvidenceStore, selectEvidenceSummary, selectJustificationDisplay } from '@/lib/stores/evidence-store';
import { useSalesContextStore } from '@/lib/stores/sales-context-store';
import { getAllowedSignalTypes } from '../context/SalesContextProvider';
import type {
  LiveObject,
  EvidencePack,
  EvidenceWrapperResult,
} from '../types';

/**
 * Evidence Wrapper Hook
 *
 * Usage:
 *   const { enrichOutput, collectEvidence, currentEvidence } = useEvidenceWrapper();
 *   const enrichedObject = await enrichOutput(outputObject);
 */
export function useEvidenceWrapper(): EvidenceWrapperResult {
  // Sales Context for filtering
  const salesContext = useSalesContextStore((state) => state.context);

  const {
    currentEvidence,
    currentReasoning,
    currentJustification,
    isCollecting,
    isReasoning,
    error,
    collectForTarget,
    buildReasoning,
    generateJustification,
    storeRankingPack,
    storeOutreachPack,
    storeDiscoveryPack,
  } = useEvidenceStore();

  // Get relevant signal types for current context (from OS config or defaults)
  const relevantSignalTypes = getAllowedSignalTypes(salesContext);

  /**
   * Enrich an output object with evidence and reasoning
   */
  const enrichOutput = useCallback(
    async (object: OutputObject): Promise<LiveObject> => {
      // Step 1: Extract target from object
      const target = (object.data?.companyName as string) || object.title || 'Unknown';

      // Step 2: Log sales context (evidence is contextual)
      const regionsStr = salesContext.regions.length > 0 ? salesContext.regions.join('+') : 'no-regions';
      console.log(`[Evidence] Collecting for ${target} in context: ${salesContext.vertical}/${salesContext.subVertical}/${regionsStr}`);

      // Step 3: Collect evidence for target with context-relevant signals
      // The relevant signal types are derived from the salesperson's sub-vertical
      const collection = await collectForTarget(target, 'company', relevantSignalTypes);

      // Step 4: Build reasoning chain
      const reasoning = buildReasoning(collection);

      // Step 5: Generate Q/T/L/E justification if we have score data
      const existingScores = object.data?.scores as { Q?: number; T?: number; L?: number; E?: number } | undefined;
      const justification = generateJustification(target, existingScores);

      // Step 6: Create evidence pack based on object type
      const pack: EvidencePack = {
        type: (object.type as 'ranking' | 'outreach' | 'discovery') || 'discovery',
        target,
        evidence: collection.evidence,
        reasoning: {
          steps: reasoning.steps.map(s => ({
            stage: s.stage,
            output: s.output,
            evidence: s.evidence,
          })),
          conclusion: reasoning.conclusion,
          confidence: reasoning.confidence,
          duration: reasoning.totalDuration,
        },
        confidence: reasoning.confidence,
        generatedAt: new Date(),
      };

      // Step 7: Return enriched object (extends, does not replace)
      const liveObject: LiveObject = {
        ...object,
        isLive: false,
        lastUpdate: new Date(),
        linkedObjects: [],
        threads: [],
        inspectorData: {
          metadata: {
            ...object.data,
            // Include sales context in metadata for transparency
            salesContext: {
              vertical: salesContext.vertical,
              subVertical: salesContext.subVertical,
              regions: salesContext.regions,
            },
          },
          signals: collection.evidence,
          reasoning: pack.reasoning,
          history: [
            {
              action: 'created',
              timestamp: object.timestamp,
              details: 'Object created by agent',
            },
            {
              action: 'enriched',
              timestamp: new Date(),
              details: `Evidence collected: ${collection.evidence.length} items (${salesContext.subVertical} context), confidence: ${(reasoning.confidence * 100).toFixed(0)}%`,
            },
          ],
        },
      };

      return liveObject;
    },
    [collectForTarget, buildReasoning, generateJustification, salesContext, relevantSignalTypes]
  );

  /**
   * Collect evidence for a specific target
   */
  const collectEvidenceForTarget = useCallback(
    async (target: string, signals: string[] = []): Promise<EvidencePack> => {
      // Use provided signals or default to context-relevant signal types
      const signalsToUse = signals.length > 0 ? signals : relevantSignalTypes;

      console.log(`[Evidence] Collecting for ${target} with signals: ${signalsToUse.join(', ')}`);

      // Collect evidence
      const collection = await collectForTarget(target, 'company', signalsToUse);

      // Build reasoning
      const reasoning = buildReasoning(collection);

      // Create pack
      const pack: EvidencePack = {
        type: 'discovery',
        target,
        evidence: collection.evidence,
        reasoning: {
          steps: reasoning.steps.map(s => ({
            stage: s.stage,
            output: s.output,
            evidence: s.evidence,
          })),
          conclusion: reasoning.conclusion,
          confidence: reasoning.confidence,
          duration: reasoning.totalDuration,
        },
        confidence: reasoning.confidence,
        generatedAt: new Date(),
      };

      // Store in discovery packs
      storeDiscoveryPack({
        id: `dp-${Date.now()}`,
        query: target,
        companies: [target],
        reasoning,
        matchCriteria: signals,
        signalsDetected: collection.evidence
          .filter(e => e.type === 'signal')
          .map(e => e.title),
        marketContext: `Evidence collected for ${target}`,
        generatedAt: new Date(),
      });

      return pack;
    },
    [collectForTarget, buildReasoning, storeDiscoveryPack, relevantSignalTypes]
  );

  /**
   * Build current evidence pack from store state
   */
  const currentEvidencePack: EvidencePack | null = currentEvidence
    ? {
        type: 'discovery',
        target: currentEvidence.target,
        evidence: currentEvidence.evidence,
        reasoning: currentReasoning
          ? {
              steps: currentReasoning.steps.map(s => ({
                stage: s.stage,
                output: s.output,
                evidence: s.evidence,
              })),
              conclusion: currentReasoning.conclusion,
              confidence: currentReasoning.confidence,
              duration: currentReasoning.totalDuration,
            }
          : {
              steps: [],
              conclusion: 'Reasoning not yet built',
              confidence: 0.5,
              duration: 0,
            },
        confidence: currentEvidence.averageConfidence,
        generatedAt: currentEvidence.collectedAt,
      }
    : null;

  return {
    enrichOutput,
    collectEvidence: collectEvidenceForTarget,
    currentEvidence: currentEvidencePack,
  };
}
