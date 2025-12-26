/**
 * Next Best Action Engine
 * Sprint S278: Workspace Intelligence Orchestration
 * Feature F2: NBA Engine (Deterministic)
 *
 * ARCHITECTURE:
 * - Pure deterministic function
 * - Same input → same output ALWAYS
 * - No ML, no LLMs, no probabilistic logic
 * - NBA DECIDES. SIVA explains.
 *
 * DECISION RULES:
 * | Condition                              | Action    | Priority |
 * |----------------------------------------|-----------|----------|
 * | Score ≥ 80, 0 critical/high blockers   | call      | urgent   |
 * | Score ≥ 60, ≤ 1 critical/high blocker  | email     | high     |
 * | Score ≥ 40, hiring signal present      | research  | medium   |
 * | Score < 40 OR ≥ 2 critical blockers    | follow-up | low      |
 * | No signals                             | null      | -        |
 */

import type { RuntimeSignal } from '@/components/workspace/RuntimeSignalCard';
import type { OpportunityScore } from '@/components/workspace/OpportunityScoreCard';
import type { Blocker } from '@/components/workspace/OpportunityBlockers';
import type { Booster } from '@/components/workspace/OpportunityBoosters';
import type { NextBestActionData, ActionType } from '@/components/workspace/NextBestAction';

// =============================================================================
// Types
// =============================================================================

export interface NBAInput {
  signals: RuntimeSignal[];
  score: OpportunityScore | null;
  blockers: Blocker[];
  boosters: Booster[];
  companyId: string;
  companyName: string;
}

export interface ReasoningInput {
  id: string;
  type: 'signal' | 'blocker' | 'booster' | 'score' | 'timing';
  factor: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number; // 0-100
}

export interface NBAOutput {
  action: NextBestActionData | null;
  reasoningInputs: ReasoningInput[];
}

// =============================================================================
// Constants
// =============================================================================

const HIRING_SIGNAL_TYPES = [
  'hiring-expansion',
  'headcount-jump',
  'leadership-hiring',
];

const PRIORITY_ORDER: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

// =============================================================================
// NBA Engine (Pure Deterministic Function)
// =============================================================================

export function computeNextBestAction(input: NBAInput): NBAOutput {
  const { signals, score, blockers, boosters, companyId, companyName } = input;

  // GATE: No signals = no action
  if (signals.length === 0) {
    return {
      action: null,
      reasoningInputs: [{
        id: 'no-signals',
        type: 'signal',
        factor: 'No Signals',
        description: 'No intelligence signals detected for this company',
        impact: 'neutral',
        weight: 100,
      }],
    };
  }

  // GATE: No score = cannot compute NBA
  if (!score) {
    return {
      action: null,
      reasoningInputs: [{
        id: 'no-score',
        type: 'score',
        factor: 'No Score Available',
        description: 'Opportunity score not yet computed',
        impact: 'neutral',
        weight: 100,
      }],
    };
  }

  // Collect reasoning inputs
  const reasoningInputs: ReasoningInput[] = [];

  // Add score to reasoning
  reasoningInputs.push({
    id: 'total-score',
    type: 'score',
    factor: `Opportunity Score: ${score.total}`,
    description: `QTLE composite score based on Quality (${score.quality}), Timing (${score.timing}), Likelihood (${score.likelihood}), Engagement (${score.engagement})`,
    impact: score.total >= 60 ? 'positive' : score.total >= 40 ? 'neutral' : 'negative',
    weight: 40,
  });

  // Count critical/high blockers
  const severeBlockers = blockers.filter(
    (b) => b.severity === 'critical' || b.severity === 'high'
  );

  // Add blockers to reasoning
  for (const blocker of blockers.slice(0, 3)) {
    reasoningInputs.push({
      id: `blocker-${blocker.id}`,
      type: 'blocker',
      factor: blocker.title,
      description: blocker.description,
      impact: 'negative',
      weight: blocker.severity === 'critical' ? 30 : blocker.severity === 'high' ? 20 : 10,
    });
  }

  // Add boosters to reasoning
  for (const booster of boosters.slice(0, 3)) {
    reasoningInputs.push({
      id: `booster-${booster.id}`,
      type: 'booster',
      factor: booster.title,
      description: booster.description,
      impact: 'positive',
      weight: booster.strength === 'strong' ? 25 : booster.strength === 'moderate' ? 15 : 8,
    });
  }

  // Check for hiring signals
  const hasHiringSignal = signals.some((s) => HIRING_SIGNAL_TYPES.includes(s.type));
  if (hasHiringSignal) {
    const hiringSignal = signals.find((s) => HIRING_SIGNAL_TYPES.includes(s.type))!;
    reasoningInputs.push({
      id: `signal-${hiringSignal.id}`,
      type: 'signal',
      factor: 'Hiring Activity Detected',
      description: hiringSignal.title,
      impact: 'positive',
      weight: 20,
    });
  }

  // Add top signal to reasoning
  const topSignal = [...signals].sort(
    (a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]
  )[0];
  if (topSignal && !HIRING_SIGNAL_TYPES.includes(topSignal.type)) {
    reasoningInputs.push({
      id: `signal-${topSignal.id}`,
      type: 'signal',
      factor: `${topSignal.type} Signal`,
      description: topSignal.title,
      impact: topSignal.priority === 'critical' || topSignal.priority === 'high' ? 'positive' : 'neutral',
      weight: 15,
    });
  }

  // =============================================================================
  // DECISION LOGIC (Deterministic Rules)
  // =============================================================================

  let actionType: ActionType;
  let priority: 'urgent' | 'high' | 'medium' | 'low';
  let title: string;
  let description: string;

  // Rule 1: High score, no severe blockers → CALL (urgent)
  if (score.total >= 80 && severeBlockers.length === 0) {
    actionType = 'call';
    priority = 'urgent';
    title = `Call ${companyName}`;
    description = `Strong opportunity with score ${score.total}. No major blockers. Initiate direct contact.`;
  }
  // Rule 2: Good score, minimal blockers → EMAIL (high)
  else if (score.total >= 60 && severeBlockers.length <= 1) {
    actionType = 'email';
    priority = 'high';
    title = `Email ${companyName}`;
    description = `Good opportunity with score ${score.total}. Send targeted outreach.`;
  }
  // Rule 3: Moderate score with hiring signal → RESEARCH (medium)
  else if (score.total >= 40 && hasHiringSignal) {
    actionType = 'research';
    priority = 'medium';
    title = `Research ${companyName}`;
    description = `Hiring activity detected. Gather more intelligence before outreach.`;
  }
  // Rule 4: Low score OR many blockers → FOLLOW-UP (low)
  else {
    actionType = 'follow-up';
    priority = 'low';
    title = `Monitor ${companyName}`;
    description = severeBlockers.length >= 2
      ? `Multiple blockers present. Add to watchlist for future signals.`
      : `Score below threshold. Monitor for improved signals.`;
  }

  // =============================================================================
  // Confidence Calculation (Deterministic)
  // =============================================================================

  // Base confidence from score
  let confidence = score.total;

  // Blocker penalty: -10 per critical, -5 per high
  const blockerPenalty = blockers.reduce((sum, b) => {
    if (b.severity === 'critical') return sum + 10;
    if (b.severity === 'high') return sum + 5;
    return sum + 2;
  }, 0);
  confidence -= blockerPenalty;

  // Booster bonus: +5 per strong, +3 per moderate
  const boosterBonus = boosters.reduce((sum, b) => {
    if (b.strength === 'strong') return sum + 5;
    if (b.strength === 'moderate') return sum + 3;
    return sum + 1;
  }, 0);
  confidence += boosterBonus;

  // Signal count bonus: +2 per signal (max +10)
  confidence += Math.min(signals.length * 2, 10);

  // Clamp to 0-100
  confidence = Math.max(0, Math.min(100, Math.round(confidence)));

  // =============================================================================
  // Build Action Output
  // =============================================================================

  const action: NextBestActionData = {
    id: `nba-${companyId}-${Date.now()}`,
    type: actionType,
    title,
    description,
    confidence,
    priority,
    inputs: {
      signalCount: signals.length,
      opportunityScore: score.total,
      blockerCount: blockers.length,
      boosterCount: boosters.length,
    },
    generatedAt: new Date().toISOString(),
  };

  // Add timing suggestion for call/email actions
  if (actionType === 'call' || actionType === 'email') {
    action.timing = {
      suggested: 'Within 48 hours',
      reason: 'Fresh signals indicate active opportunity window',
    };
  }

  return { action, reasoningInputs };
}

// =============================================================================
// Export
// =============================================================================

export default computeNextBestAction;
