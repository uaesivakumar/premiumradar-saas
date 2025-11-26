/**
 * Signal Reasoner - S44
 *
 * 5-stage reasoning chain: gather → filter → weight → combine → justify
 * Transforms raw evidence into actionable conclusions.
 */

import type {
  Evidence,
  EvidenceCollection,
  ReasoningChain,
  ReasoningStep,
  ReasoningStage,
} from './types';

// =============================================================================
// Reasoning Chain Builder
// =============================================================================

/**
 * Build a reasoning chain from evidence collection
 */
export function buildReasoningChain(
  collection: EvidenceCollection,
  context?: { focus?: string; threshold?: number }
): ReasoningChain {
  const chainId = `rc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const steps: ReasoningStep[] = [];
  const startTime = Date.now();

  // Stage 1: Gather
  const gatherStep = executeGatherStage(collection, chainId, 1);
  steps.push(gatherStep);

  // Stage 2: Filter
  const filterStep = executeFilterStage(
    gatherStep.evidence,
    chainId,
    2,
    context?.threshold || 0.5
  );
  steps.push(filterStep);

  // Stage 3: Weight
  const weightStep = executeWeightStage(
    filterStep.evidence,
    chainId,
    3,
    context?.focus
  );
  steps.push(weightStep);

  // Stage 4: Combine
  const combineStep = executeCombineStage(weightStep.evidence, chainId, 4);
  steps.push(combineStep);

  // Stage 5: Justify
  const justifyStep = executeJustifyStage(
    combineStep.evidence,
    collection.target,
    chainId,
    5
  );
  steps.push(justifyStep);

  // Calculate overall confidence
  const confidence = calculateChainConfidence(steps);

  return {
    id: chainId,
    target: collection.target,
    steps,
    conclusion: justifyStep.output,
    confidence,
    totalDuration: Date.now() - startTime,
    createdAt: new Date(),
  };
}

// =============================================================================
// Stage Implementations
// =============================================================================

/**
 * Stage 1: Gather - Collect all evidence
 */
function executeGatherStage(
  collection: EvidenceCollection,
  chainId: string,
  stepNumber: number
): ReasoningStep {
  const startTime = Date.now();

  return {
    id: `${chainId}-gather`,
    stage: 'gather',
    stepNumber,
    name: 'Gather Evidence',
    description: `Collected ${collection.evidence.length} pieces of evidence from ${collection.sources.length} sources`,
    inputs: [`Target: ${collection.target}`, `Sources: ${collection.sources.join(', ')}`],
    output: `Gathered ${collection.evidence.length} evidence items`,
    evidence: collection.evidence,
    duration: Date.now() - startTime,
    status: 'complete',
  };
}

/**
 * Stage 2: Filter - Remove low-quality evidence
 */
function executeFilterStage(
  evidence: Evidence[],
  chainId: string,
  stepNumber: number,
  threshold: number
): ReasoningStep {
  const startTime = Date.now();

  // Filter by confidence threshold
  const filtered = evidence.filter(e => e.confidence >= threshold);

  // Also filter out stale evidence (older than 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const fresh = filtered.filter(e => {
    const timestamp = e.timestamp instanceof Date ? e.timestamp : new Date(e.timestamp);
    return timestamp >= ninetyDaysAgo;
  });

  const removed = evidence.length - fresh.length;

  return {
    id: `${chainId}-filter`,
    stage: 'filter',
    stepNumber,
    name: 'Filter Evidence',
    description: `Filtered to ${fresh.length} high-quality items (removed ${removed} low-confidence or stale)`,
    inputs: [
      `Input: ${evidence.length} items`,
      `Confidence threshold: ${threshold}`,
      `Freshness: 90 days`,
    ],
    output: `${fresh.length} quality evidence items retained`,
    evidence: fresh,
    duration: Date.now() - startTime,
    status: 'complete',
  };
}

/**
 * Stage 3: Weight - Assign importance weights based on context
 */
function executeWeightStage(
  evidence: Evidence[],
  chainId: string,
  stepNumber: number,
  focus?: string
): ReasoningStep {
  const startTime = Date.now();

  // Apply contextual weighting
  const weighted = evidence.map(e => {
    let adjustedRelevance = e.relevance;

    // Boost relevance for focus-related evidence
    if (focus) {
      const focusLower = focus.toLowerCase();
      if (
        e.title.toLowerCase().includes(focusLower) ||
        e.content.toLowerCase().includes(focusLower)
      ) {
        adjustedRelevance = Math.min(1, adjustedRelevance * 1.3);
      }
    }

    // Type-based weighting
    const typeWeights: Record<string, number> = {
      signal: 1.2,
      financial: 1.15,
      leadership: 1.1,
      technology: 1.1,
      news: 1.0,
      profile: 0.9,
      social: 0.85,
      comparison: 1.0,
      trend: 1.05,
      metric: 1.1,
    };

    const typeWeight = typeWeights[e.type] || 1.0;
    adjustedRelevance = Math.min(1, adjustedRelevance * typeWeight);

    return {
      ...e,
      relevance: adjustedRelevance,
      metadata: {
        ...e.metadata,
        originalRelevance: e.relevance,
        weightedRelevance: adjustedRelevance,
      },
    };
  });

  // Sort by weighted relevance
  weighted.sort((a, b) => b.relevance - a.relevance);

  return {
    id: `${chainId}-weight`,
    stage: 'weight',
    stepNumber,
    name: 'Weight Evidence',
    description: `Applied contextual weights${focus ? ` (focus: ${focus})` : ''} and type-based scoring`,
    inputs: [
      `Input: ${evidence.length} items`,
      focus ? `Focus: ${focus}` : 'No focus specified',
    ],
    output: `Weighted and ranked ${weighted.length} evidence items`,
    evidence: weighted,
    duration: Date.now() - startTime,
    status: 'complete',
  };
}

/**
 * Stage 4: Combine - Synthesize into conclusions
 */
function executeCombineStage(
  evidence: Evidence[],
  chainId: string,
  stepNumber: number
): ReasoningStep {
  const startTime = Date.now();

  // Group evidence by type
  const byType = new Map<string, Evidence[]>();
  for (const e of evidence) {
    const existing = byType.get(e.type) || [];
    existing.push(e);
    byType.set(e.type, existing);
  }

  // Calculate combined scores
  const typeScores: Record<string, number> = {};
  for (const [type, items] of byType) {
    const avgConfidence = items.reduce((sum, e) => sum + e.confidence, 0) / items.length;
    const avgRelevance = items.reduce((sum, e) => sum + e.relevance, 0) / items.length;
    typeScores[type] = (avgConfidence + avgRelevance) / 2;
  }

  // Identify dominant signals
  const sortedTypes = Object.entries(typeScores).sort((a, b) => b[1] - a[1]);
  const dominantSignals = sortedTypes.slice(0, 3).map(([type]) => type);

  // Create synthesis summary
  const synthesis = dominantSignals
    .map(type => {
      const items = byType.get(type) || [];
      return `${type}: ${items.length} signals (score: ${typeScores[type].toFixed(2)})`;
    })
    .join('; ');

  return {
    id: `${chainId}-combine`,
    stage: 'combine',
    stepNumber,
    name: 'Combine Evidence',
    description: `Synthesized ${byType.size} evidence types into combined signals`,
    inputs: [`Input: ${evidence.length} weighted items`],
    output: `Dominant signals: ${synthesis}`,
    evidence,
    duration: Date.now() - startTime,
    status: 'complete',
  };
}

/**
 * Stage 5: Justify - Generate human-readable justification
 */
function executeJustifyStage(
  evidence: Evidence[],
  target: string,
  chainId: string,
  stepNumber: number
): ReasoningStep {
  const startTime = Date.now();

  // Get top evidence items
  const topEvidence = evidence.slice(0, 5);

  // Generate justification
  const justificationParts: string[] = [];

  // Opening statement
  justificationParts.push(`Based on ${evidence.length} pieces of evidence for ${target}:`);

  // Key findings
  for (const e of topEvidence) {
    justificationParts.push(`• ${e.title}: ${e.content} (confidence: ${(e.confidence * 100).toFixed(0)}%)`);
  }

  // Overall assessment
  const avgConfidence = evidence.reduce((sum, e) => sum + e.confidence, 0) / evidence.length;
  const confidenceLevel =
    avgConfidence >= 0.8 ? 'high' : avgConfidence >= 0.6 ? 'moderate' : 'limited';

  justificationParts.push(
    `\nOverall confidence: ${confidenceLevel} (${(avgConfidence * 100).toFixed(0)}%)`
  );

  const justification = justificationParts.join('\n');

  return {
    id: `${chainId}-justify`,
    stage: 'justify',
    stepNumber,
    name: 'Generate Justification',
    description: 'Generated human-readable justification from synthesized evidence',
    inputs: [`Top ${topEvidence.length} evidence items`],
    output: justification,
    evidence: topEvidence,
    duration: Date.now() - startTime,
    status: 'complete',
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Calculate overall chain confidence
 */
function calculateChainConfidence(steps: ReasoningStep[]): number {
  // Use the final stage's evidence confidence
  const finalStep = steps[steps.length - 1];
  if (!finalStep.evidence.length) return 0.5;

  const avgConfidence =
    finalStep.evidence.reduce((sum, e) => sum + e.confidence, 0) / finalStep.evidence.length;

  // Apply penalty for fewer evidence items
  const countFactor = Math.min(1, finalStep.evidence.length / 3);

  return avgConfidence * 0.7 + countFactor * 0.3;
}

/**
 * Get reasoning stage by name
 */
export function getStageByName(
  chain: ReasoningChain,
  stage: ReasoningStage
): ReasoningStep | undefined {
  return chain.steps.find(s => s.stage === stage);
}

/**
 * Get reasoning chain summary
 */
export function getChainSummary(chain: ReasoningChain): {
  target: string;
  conclusion: string;
  confidence: number;
  stepCount: number;
  evidenceCount: number;
  duration: number;
} {
  const finalStep = chain.steps[chain.steps.length - 1];

  return {
    target: chain.target,
    conclusion: chain.conclusion,
    confidence: chain.confidence,
    stepCount: chain.steps.length,
    evidenceCount: finalStep?.evidence.length || 0,
    duration: chain.totalDuration,
  };
}

/**
 * Stream reasoning chain execution (for UI updates)
 */
export async function* streamReasoningChain(
  collection: EvidenceCollection,
  context?: { focus?: string; threshold?: number }
): AsyncGenerator<ReasoningStep, ReasoningChain, unknown> {
  const chainId = `rc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const steps: ReasoningStep[] = [];
  const startTime = Date.now();

  // Stage 1: Gather
  const gatherStep = executeGatherStage(collection, chainId, 1);
  steps.push(gatherStep);
  yield gatherStep;

  // Stage 2: Filter
  const filterStep = executeFilterStage(
    gatherStep.evidence,
    chainId,
    2,
    context?.threshold || 0.5
  );
  steps.push(filterStep);
  yield filterStep;

  // Stage 3: Weight
  const weightStep = executeWeightStage(
    filterStep.evidence,
    chainId,
    3,
    context?.focus
  );
  steps.push(weightStep);
  yield weightStep;

  // Stage 4: Combine
  const combineStep = executeCombineStage(weightStep.evidence, chainId, 4);
  steps.push(combineStep);
  yield combineStep;

  // Stage 5: Justify
  const justifyStep = executeJustifyStage(
    combineStep.evidence,
    collection.target,
    chainId,
    5
  );
  steps.push(justifyStep);
  yield justifyStep;

  // Return complete chain
  return {
    id: chainId,
    target: collection.target,
    steps,
    conclusion: justifyStep.output,
    confidence: calculateChainConfidence(steps),
    totalDuration: Date.now() - startTime,
    createdAt: new Date(),
  };
}
