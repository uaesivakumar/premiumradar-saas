/**
 * Blockers and Boosters Hook
 * Sprint S278: Workspace Intelligence Orchestration
 * Feature F4: Data Hooks
 *
 * ARCHITECTURE:
 * - Derives blockers/boosters from signal patterns
 * - NO mocked data - only pattern-based derivation
 * - Explicitly flags derivation source
 *
 * BLOCKER PATTERNS:
 * - Low priority signals only → "Limited Engagement"
 * - Old signals → "Stale Intelligence"
 * - Single signal type → "Narrow Signal Base"
 *
 * BOOSTER PATTERNS:
 * - Hiring signals → "Active Hiring"
 * - Funding signals → "Recent Funding"
 * - Multiple signal types → "Strong Signal Diversity"
 * - High priority signals → "Strong Interest Indicators"
 */

import { useMemo } from 'react';
import type { RuntimeSignal } from '@/components/workspace/RuntimeSignalCard';
import type { Blocker } from '@/components/workspace/OpportunityBlockers';
import type { Booster } from '@/components/workspace/OpportunityBoosters';

// =============================================================================
// Types
// =============================================================================

export interface DerivedBlocker extends Blocker {
  derivedFrom: string;
}

export interface DerivedBooster extends Booster {
  derivedFrom: string;
}

interface UseBlockersAndBoostersResult {
  blockers: DerivedBlocker[];
  boosters: DerivedBooster[];
  isLoading: boolean;
}

// =============================================================================
// Pattern Detection Constants
// =============================================================================

const HIRING_SIGNAL_TYPES = ['hiring-expansion', 'headcount-jump', 'leadership-hiring'];
const FUNDING_SIGNAL_TYPES = ['funding-round'];
const EXPANSION_SIGNAL_TYPES = ['office-opening', 'market-entry', 'subsidiary-creation'];
const PROJECT_SIGNAL_TYPES = ['project-award'];

// =============================================================================
// Blocker Detection (Deterministic)
// =============================================================================

function detectBlockers(signals: RuntimeSignal[]): DerivedBlocker[] {
  const blockers: DerivedBlocker[] = [];
  const now = Date.now();

  // Log detection for transparency
  console.log('[useBlockersAndBoosters] Detecting blockers from', signals.length, 'signals');

  // Check for stale signals (all signals > 7 days old)
  const signalAges = signals.map((s) => now - new Date(s.timestamp).getTime());
  const allStale = signalAges.every((age) => age > 7 * 24 * 60 * 60 * 1000);

  if (allStale && signals.length > 0) {
    blockers.push({
      id: 'blocker-stale-signals',
      type: 'timing-stale',
      severity: 'medium',
      title: 'Stale Intelligence',
      description: 'All signals are more than 7 days old. Fresh intelligence needed before outreach.',
      impact: -15,
      source: 'Signal Analysis',
      detectedAt: new Date().toISOString(),
      derivedFrom: 'signal-age-analysis',
    });
  }

  // Check for low engagement (all low priority)
  const allLowPriority = signals.every((s) => s.priority === 'low');
  if (allLowPriority && signals.length > 0) {
    blockers.push({
      id: 'blocker-low-engagement',
      type: 'engagement-weak',
      severity: 'high',
      title: 'Limited Engagement Signals',
      description: 'All detected signals are low priority. May indicate minimal activity.',
      impact: -20,
      source: 'Signal Analysis',
      detectedAt: new Date().toISOString(),
      derivedFrom: 'signal-priority-analysis',
    });
  }

  // Check for narrow signal base (only 1 type)
  const uniqueTypes = new Set(signals.map((s) => s.type));
  if (uniqueTypes.size === 1 && signals.length >= 2) {
    blockers.push({
      id: 'blocker-narrow-base',
      type: 'intelligence-narrow',
      severity: 'low',
      title: 'Narrow Signal Base',
      description: 'Only one type of signal detected. Consider gathering broader intelligence.',
      impact: -10,
      source: 'Signal Analysis',
      detectedAt: new Date().toISOString(),
      derivedFrom: 'signal-diversity-analysis',
    });
  }

  // Check for low confidence signals
  const lowConfidenceSignals = signals.filter((s) => s.confidence < 0.5);
  if (lowConfidenceSignals.length > signals.length / 2) {
    blockers.push({
      id: 'blocker-low-confidence',
      type: 'confidence-low',
      severity: 'medium',
      title: 'Low Confidence Signals',
      description: 'Majority of signals have low confidence scores. Verify before action.',
      impact: -12,
      source: 'Signal Analysis',
      detectedAt: new Date().toISOString(),
      derivedFrom: 'signal-confidence-analysis',
    });
  }

  return blockers;
}

// =============================================================================
// Booster Detection (Deterministic)
// =============================================================================

function detectBoosters(signals: RuntimeSignal[]): DerivedBooster[] {
  const boosters: DerivedBooster[] = [];
  const now = Date.now();

  // Log detection for transparency
  console.log('[useBlockersAndBoosters] Detecting boosters from', signals.length, 'signals');

  // Check for hiring signals
  const hiringSignals = signals.filter((s) => HIRING_SIGNAL_TYPES.includes(s.type));
  if (hiringSignals.length > 0) {
    boosters.push({
      id: 'booster-hiring',
      type: 'hiring-surge',
      strength: hiringSignals.length >= 2 ? 'strong' : 'moderate',
      title: 'Active Hiring Detected',
      description: `${hiringSignals.length} hiring-related signal(s) indicate growth. Prime timing for payroll services.`,
      impact: hiringSignals.length >= 2 ? 20 : 12,
      source: 'Signal Analysis',
      detectedAt: new Date().toISOString(),
      derivedFrom: 'hiring-signal-detection',
    });
  }

  // Check for funding signals
  const fundingSignals = signals.filter((s) => FUNDING_SIGNAL_TYPES.includes(s.type));
  if (fundingSignals.length > 0) {
    boosters.push({
      id: 'booster-funding',
      type: 'funding-recent',
      strength: 'strong',
      title: 'Recent Funding Activity',
      description: 'Funding signal detected. Company has capital for new services.',
      impact: 25,
      source: 'Signal Analysis',
      detectedAt: new Date().toISOString(),
      derivedFrom: 'funding-signal-detection',
    });
  }

  // Check for expansion signals
  const expansionSignals = signals.filter((s) => EXPANSION_SIGNAL_TYPES.includes(s.type));
  if (expansionSignals.length > 0) {
    boosters.push({
      id: 'booster-expansion',
      type: 'expansion-announced',
      strength: expansionSignals.length >= 2 ? 'strong' : 'moderate',
      title: 'Expansion Activity',
      description: `${expansionSignals.length} expansion signal(s) indicate growth trajectory.`,
      impact: expansionSignals.length >= 2 ? 18 : 10,
      source: 'Signal Analysis',
      detectedAt: new Date().toISOString(),
      derivedFrom: 'expansion-signal-detection',
    });
  }

  // Check for high priority signals
  const highPrioritySignals = signals.filter(
    (s) => s.priority === 'critical' || s.priority === 'high'
  );
  if (highPrioritySignals.length >= 2) {
    boosters.push({
      id: 'booster-high-priority',
      type: 'strong-indicators',
      strength: highPrioritySignals.length >= 3 ? 'strong' : 'moderate',
      title: 'Strong Interest Indicators',
      description: `${highPrioritySignals.length} high-priority signals indicate strong opportunity.`,
      impact: highPrioritySignals.length >= 3 ? 15 : 8,
      source: 'Signal Analysis',
      detectedAt: new Date().toISOString(),
      derivedFrom: 'priority-signal-analysis',
    });
  }

  // Check for signal diversity (4+ types)
  const uniqueTypes = new Set(signals.map((s) => s.type));
  if (uniqueTypes.size >= 4) {
    boosters.push({
      id: 'booster-diversity',
      type: 'signal-diversity',
      strength: 'strong',
      title: 'Strong Signal Diversity',
      description: `${uniqueTypes.size} different signal types detected. Comprehensive intelligence available.`,
      impact: 15,
      source: 'Signal Analysis',
      detectedAt: new Date().toISOString(),
      derivedFrom: 'signal-diversity-analysis',
    });
  }

  // Check for fresh signals (within 24 hours)
  const freshSignals = signals.filter(
    (s) => now - new Date(s.timestamp).getTime() < 24 * 60 * 60 * 1000
  );
  if (freshSignals.length >= 2) {
    boosters.push({
      id: 'booster-timing',
      type: 'timing-optimal',
      strength: freshSignals.length >= 3 ? 'strong' : 'moderate',
      title: 'Optimal Timing Window',
      description: `${freshSignals.length} fresh signals in last 24 hours. Active opportunity window.`,
      impact: freshSignals.length >= 3 ? 12 : 7,
      source: 'Signal Analysis',
      detectedAt: new Date().toISOString(),
      derivedFrom: 'timing-analysis',
    });
  }

  return boosters;
}

// =============================================================================
// Hook
// =============================================================================

export function useBlockersAndBoosters(
  signals: RuntimeSignal[],
  companyId: string | null
): UseBlockersAndBoostersResult {
  // GATE: No companyId = no detection
  if (!companyId) {
    return {
      blockers: [],
      boosters: [],
      isLoading: false,
    };
  }

  // Derive blockers from signal patterns
  const blockers = useMemo(() => {
    return detectBlockers(signals);
  }, [signals]);

  // Derive boosters from signal patterns
  const boosters = useMemo(() => {
    return detectBoosters(signals);
  }, [signals]);

  return {
    blockers,
    boosters,
    isLoading: false,
  };
}

// =============================================================================
// Export
// =============================================================================

export default useBlockersAndBoosters;
