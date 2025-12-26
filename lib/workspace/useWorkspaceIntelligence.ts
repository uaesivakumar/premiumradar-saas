/**
 * Workspace Intelligence Orchestrator Hook
 * Sprint S278: Workspace Intelligence Orchestration
 * Feature F4: Data Hooks (Orchestration Layer)
 *
 * ARCHITECTURE:
 * - Orchestrates all data hooks
 * - Calls NBA engine (deterministic)
 * - Calls SIVA generator (read-only)
 * - Hard gates on companyId
 *
 * DATA FLOW:
 * 1. useRuntimeSignals → signals
 * 2. useOpportunityScore(signals) → score
 * 3. useBlockersAndBoosters(signals) → blockers, boosters
 * 4. computeNextBestAction({signals, score, blockers, boosters}) → NBA decision
 * 5. generateReasoning(NBA.reasoningInputs) → SIVA explanation
 *
 * CRITICAL: NBA and SIVA only run when companyId is present.
 */

import { useMemo } from 'react';
import { useRuntimeSignals } from './useRuntimeSignals';
import { useOpportunityScore, type DerivedScore } from './useOpportunityScore';
import { useBlockersAndBoosters, type DerivedBlocker, type DerivedBooster } from './useBlockersAndBoosters';
import { computeNextBestAction } from '@/lib/nba';
import { generateReasoning } from '@/lib/siva';
import type { RuntimeSignal } from '@/components/workspace/RuntimeSignalCard';
import type { NextBestActionData } from '@/components/workspace/NextBestAction';
import type { SIVAReasoningData } from '@/components/workspace/SIVAReasoningOverlay';

// =============================================================================
// Types
// =============================================================================

export interface WorkspaceIntelligenceConfig {
  vertical: string;
  subVertical: string;
  regions: string[];
}

export interface WorkspaceIntelligenceResult {
  // Raw signals
  signals: RuntimeSignal[];
  allSignals: RuntimeSignal[];

  // Derived data
  score: DerivedScore | null;
  blockers: DerivedBlocker[];
  boosters: DerivedBooster[];

  // NBA output
  nba: NextBestActionData | null;

  // SIVA output (read-only explanation)
  reasoning: SIVAReasoningData | null;

  // State
  isLoading: boolean;
  isError: boolean;
  error: Error | null;

  // Actions
  refresh: () => void;
}

// =============================================================================
// Hook
// =============================================================================

export function useWorkspaceIntelligence(
  config: WorkspaceIntelligenceConfig,
  selectedCompanyId: string | null,
  selectedCompanyName: string | null
): WorkspaceIntelligenceResult {
  // =============================================================================
  // Step 1: Fetch all signals
  // =============================================================================

  const {
    signals: allSignals,
    isLoading: signalsLoading,
    isError: signalsError,
    error: signalsErrorObj,
    refresh,
  } = useRuntimeSignals({
    vertical: config.vertical,
    subVertical: config.subVertical,
    regions: config.regions,
    enabled: true,
  });

  // =============================================================================
  // Step 2: Filter signals for selected company
  // =============================================================================

  const companySignals = useMemo(() => {
    if (!selectedCompanyId || !selectedCompanyName) {
      return [];
    }
    // Filter signals by company name
    return allSignals.filter(
      (s) => s.companyName.toLowerCase() === selectedCompanyName.toLowerCase()
    );
  }, [allSignals, selectedCompanyId, selectedCompanyName]);

  // =============================================================================
  // HARD GATE: No companyId = no further computation
  // =============================================================================

  if (!selectedCompanyId || !selectedCompanyName) {
    console.log('[useWorkspaceIntelligence] No company selected - returning empty state');
    return {
      signals: [],
      allSignals,
      score: null,
      blockers: [],
      boosters: [],
      nba: null,
      reasoning: null,
      isLoading: signalsLoading,
      isError: signalsError,
      error: signalsErrorObj,
      refresh,
    };
  }

  // =============================================================================
  // Step 3: Derive opportunity score
  // =============================================================================

  const { score } = useOpportunityScore(companySignals, selectedCompanyId);

  // =============================================================================
  // Step 4: Derive blockers and boosters
  // =============================================================================

  const { blockers, boosters } = useBlockersAndBoosters(companySignals, selectedCompanyId);

  // =============================================================================
  // Step 5: Compute NBA (Deterministic)
  // =============================================================================

  const nbaResult = useMemo(() => {
    console.log('[useWorkspaceIntelligence] Computing NBA for', selectedCompanyName);
    console.log('[useWorkspaceIntelligence] Inputs:', {
      signalCount: companySignals.length,
      score: score?.total,
      blockerCount: blockers.length,
      boosterCount: boosters.length,
    });

    return computeNextBestAction({
      signals: companySignals,
      score,
      blockers,
      boosters,
      companyId: selectedCompanyId,
      companyName: selectedCompanyName,
    });
  }, [companySignals, score, blockers, boosters, selectedCompanyId, selectedCompanyName]);

  // =============================================================================
  // Step 6: Generate SIVA Reasoning (Read-Only)
  // =============================================================================

  const reasoning = useMemo(() => {
    if (!nbaResult.action) {
      return null;
    }

    console.log('[useWorkspaceIntelligence] Generating SIVA reasoning');
    console.log('[useWorkspaceIntelligence] SIVA receives', nbaResult.reasoningInputs.length, 'inputs');

    return generateReasoning({
      reasoningInputs: nbaResult.reasoningInputs,
      action: nbaResult.action,
    });
  }, [nbaResult]);

  // =============================================================================
  // Return
  // =============================================================================

  return {
    signals: companySignals,
    allSignals,
    score,
    blockers,
    boosters,
    nba: nbaResult.action,
    reasoning,
    isLoading: signalsLoading,
    isError: signalsError,
    error: signalsErrorObj,
    refresh,
  };
}

// =============================================================================
// Export
// =============================================================================

export default useWorkspaceIntelligence;
