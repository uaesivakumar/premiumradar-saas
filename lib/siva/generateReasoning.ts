/**
 * SIVA Reasoning Generator
 * Sprint S278: Workspace Intelligence Orchestration
 * Feature F3: SIVA Reasoning Generator (Read-Only)
 *
 * ARCHITECTURE:
 * - SIVA EXPLAINS. SIVA does NOT DECIDE.
 * - Consumes NBA reasoning inputs
 * - Produces human-readable explanation
 * - Has ZERO effect on NBA output
 *
 * PROOF OF SEPARATION:
 * - This function receives ReasoningInput[] from NBA
 * - It cannot access or modify the action
 * - Removing this function does not change NBA decision
 */

import type { SIVAReasoningData, ReasoningStep } from '@/components/workspace/SIVAReasoningOverlay';
import type { ReasoningInput } from '@/lib/nba/computeNextBestAction';
import type { NextBestActionData } from '@/components/workspace/NextBestAction';

// =============================================================================
// Types
// =============================================================================

export interface GenerateReasoningInput {
  reasoningInputs: ReasoningInput[];
  action: NextBestActionData | null;
}

// =============================================================================
// SIVA Reasoning Generator (Read-Only)
// =============================================================================

export function generateReasoning(input: GenerateReasoningInput): SIVAReasoningData | null {
  const { reasoningInputs, action } = input;

  // GATE: No action = no reasoning to generate
  if (!action) {
    return null;
  }

  // GATE: No inputs = cannot explain
  if (reasoningInputs.length === 0) {
    return null;
  }

  // Sort by weight (highest first)
  const sortedInputs = [...reasoningInputs].sort((a, b) => b.weight - a.weight);

  // =============================================================================
  // Generate Reasoning Steps
  // =============================================================================

  const steps: ReasoningStep[] = sortedInputs.map((input) => ({
    id: input.id,
    type: input.type,
    title: input.factor,
    description: input.description,
    impact: input.impact,
    weight: input.weight,
  }));

  // =============================================================================
  // Generate Summary (from top 3 factors)
  // =============================================================================

  const topFactors = sortedInputs.slice(0, 3);
  const positiveFactors = topFactors.filter((f) => f.impact === 'positive');
  const negativeFactors = topFactors.filter((f) => f.impact === 'negative');

  let summary: string;

  if (positiveFactors.length > negativeFactors.length) {
    const mainFactor = positiveFactors[0];
    summary = `Recommended "${action.title}" based primarily on ${mainFactor.factor.toLowerCase()}. `;
    if (positiveFactors.length > 1) {
      summary += `Additional supporting factors include ${positiveFactors[1].factor.toLowerCase()}.`;
    }
  } else if (negativeFactors.length > 0) {
    const mainBlocker = negativeFactors[0];
    summary = `"${action.title}" is a conservative recommendation due to ${mainBlocker.factor.toLowerCase()}. `;
    summary += `Monitor for improved conditions before escalating approach.`;
  } else {
    summary = `"${action.title}" recommended based on balanced analysis of ${sortedInputs.length} factors.`;
  }

  // =============================================================================
  // Generate Confidence Explanation
  // =============================================================================

  let confidenceExplanation: string;

  if (action.confidence >= 80) {
    confidenceExplanation = `High confidence (${action.confidence}%) based on strong signals and minimal blockers. This opportunity shows clear readiness for engagement.`;
  } else if (action.confidence >= 60) {
    confidenceExplanation = `Good confidence (${action.confidence}%) with solid fundamentals. Some factors require monitoring but overall trajectory is positive.`;
  } else if (action.confidence >= 40) {
    confidenceExplanation = `Moderate confidence (${action.confidence}%). Mixed signals present. Recommended action is appropriate for current intelligence level.`;
  } else {
    confidenceExplanation = `Lower confidence (${action.confidence}%) due to limited positive signals or significant blockers. Conservative approach advised.`;
  }

  // =============================================================================
  // Generate Alternative Actions Considered
  // =============================================================================

  const alternativeActions: string[] = [];

  // Based on action type, show what else was considered
  switch (action.type) {
    case 'call':
      alternativeActions.push('Email outreach - ruled out due to high opportunity score');
      alternativeActions.push('Research phase - not needed, sufficient intelligence available');
      break;
    case 'email':
      alternativeActions.push('Direct call - ruled out due to moderate blocker presence');
      alternativeActions.push('Monitor only - ruled out due to good opportunity score');
      break;
    case 'research':
      alternativeActions.push('Direct outreach - ruled out pending more intelligence');
      alternativeActions.push('Monitor only - ruled out due to active hiring signals');
      break;
    case 'follow-up':
      alternativeActions.push('Direct outreach - ruled out due to blockers or low score');
      alternativeActions.push('Research - may be warranted if new signals emerge');
      break;
  }

  // =============================================================================
  // Generate Warnings (if applicable)
  // =============================================================================

  const warnings: string[] = [];

  // Check for blockers
  const blockerInputs = reasoningInputs.filter((r) => r.type === 'blocker');
  if (blockerInputs.length > 0) {
    warnings.push(`${blockerInputs.length} blocker(s) identified - review before outreach`);
  }

  // Check for low confidence
  if (action.confidence < 50) {
    warnings.push('Confidence below 50% - consider gathering additional intelligence');
  }

  // Check for stale timing (if no timing suggestion)
  if (!action.timing) {
    warnings.push('No specific timing recommendation - use standard cadence');
  }

  // =============================================================================
  // Build Output
  // =============================================================================

  return {
    summary,
    confidenceExplanation,
    steps,
    alternativeActions,
    warnings: warnings.length > 0 ? warnings : undefined,
    generatedAt: new Date().toISOString(),
  };
}

// =============================================================================
// Export
// =============================================================================

export default generateReasoning;
