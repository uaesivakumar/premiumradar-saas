/**
 * Evidence Wrapper Hook - S44
 *
 * Wraps output object creation with evidence collection and reasoning.
 *
 * Pattern:
 *   1. Output object is created by existing agent
 *   2. EvidenceCollector gathers supporting evidence
 *   3. SignalReasoner creates reasoning chain
 *   4. ScoreJustifier explains scores
 *   5. THEN enriches the output object (does NOT replace)
 *
 * CRITICAL: This hook ENRICHES output objects, it does NOT replace creation.
 */

'use client';

import { useCallback } from 'react';
import { OutputObject } from '@/lib/stores/siva-store';
import { useEvidenceStore, selectEvidenceSummary, selectJustificationDisplay } from '@/lib/stores/evidence-store';
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

  /**
   * Enrich an output object with evidence and reasoning
   */
  const enrichOutput = useCallback(
    async (object: OutputObject): Promise<LiveObject> => {
      // Step 1: Extract target from object
      const target = (object.data?.companyName as string) || object.title || 'Unknown';

      // Step 2: Collect evidence for target
      const collection = await collectForTarget(target, 'company', []);

      // Step 3: Build reasoning chain
      const reasoning = buildReasoning(collection);

      // Step 4: Generate Q/T/L/E justification if we have score data
      const existingScores = object.data?.scores as { Q?: number; T?: number; L?: number; E?: number } | undefined;
      const justification = generateJustification(target, existingScores);

      // Step 5: Create evidence pack based on object type
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

      // Step 6: Return enriched object (extends, does not replace)
      const liveObject: LiveObject = {
        ...object,
        isLive: false,
        lastUpdate: new Date(),
        linkedObjects: [],
        threads: [],
        inspectorData: {
          metadata: object.data,
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
              details: `Evidence collected: ${collection.evidence.length} items, confidence: ${(reasoning.confidence * 100).toFixed(0)}%`,
            },
          ],
        },
      };

      return liveObject;
    },
    [collectForTarget, buildReasoning, generateJustification]
  );

  /**
   * Collect evidence for a specific target
   */
  const collectEvidenceForTarget = useCallback(
    async (target: string, signals: string[] = []): Promise<EvidencePack> => {
      // Collect evidence
      const collection = await collectForTarget(target, 'company', signals);

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
    [collectForTarget, buildReasoning, storeDiscoveryPack]
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
