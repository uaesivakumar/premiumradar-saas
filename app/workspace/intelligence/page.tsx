/**
 * Workspace Intelligence Page
 * Sprint S278: Workspace Intelligence Orchestration
 * Feature F1: Intelligence Page Shell
 * Feature F5: Page Integration
 *
 * SINGLE ENTRY POINT for Runtime Intelligence
 *
 * ARCHITECTURE:
 * - One page only: /workspace/intelligence
 * - Hard gates on company selection (no silent null flows)
 * - NBA decides (deterministic)
 * - SIVA explains (read-only)
 * - All data is derived or from real APIs
 *
 * USER FLOW:
 * 1. User sees signal feed
 * 2. User clicks a signal → company selected
 * 3. Intelligence loads for that company
 * 4. User sees score, blockers, boosters, NBA
 * 5. User can click "View SIVA Reasoning" → modal opens
 */

'use client';

import React, { useState, useCallback } from 'react';
import { ArrowLeft, RefreshCw, Loader2, AlertCircle, Target } from 'lucide-react';
import Link from 'next/link';

// S271-S273 Components (now being wired)
import {
  RuntimeSignalFeed,
  OpportunityScoreCard,
  OpportunityBlockers,
  OpportunityBoosters,
  NextBestAction,
  SIVAReasoningOverlay,
} from '@/components/workspace';

// S278 Orchestrator Hook
import { useWorkspaceIntelligence } from '@/lib/workspace';

// =============================================================================
// Types
// =============================================================================

interface SelectedCompany {
  id: string;
  name: string;
}

// =============================================================================
// Page Component
// =============================================================================

export default function WorkspaceIntelligencePage() {
  // Selected company state
  const [selectedCompany, setSelectedCompany] = useState<SelectedCompany | null>(null);

  // SIVA modal state
  const [showReasoning, setShowReasoning] = useState(false);

  // Intelligence data (orchestrated)
  const intelligence = useWorkspaceIntelligence(
    {
      vertical: 'banking',
      subVertical: 'employee-banking',
      regions: ['UAE'],
    },
    selectedCompany?.id ?? null,
    selectedCompany?.name ?? null
  );

  // Handle signal selection - select company
  const handleSignalSelect = useCallback((signal: { companyName: string }) => {
    console.log('[IntelligencePage] Signal selected:', signal.companyName);
    setSelectedCompany({
      id: signal.companyName.toLowerCase().replace(/\s+/g, '-'),
      name: signal.companyName,
    });
  }, []);

  // Handle clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedCompany(null);
    setShowReasoning(false);
  }, []);

  // Handle view reasoning
  const handleViewReasoning = useCallback(() => {
    if (intelligence.nba) {
      setShowReasoning(true);
    }
  }, [intelligence.nba]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    intelligence.refresh();
  }, [intelligence]);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-neutral-900">
                Workspace Intelligence
              </h1>
              <p className="text-sm text-neutral-500">
                Real-time signals, scoring, and next best actions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {intelligence.isLoading && (
              <span className="flex items-center gap-2 text-sm text-neutral-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </span>
            )}
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Error State */}
      {intelligence.isError && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Error loading intelligence</span>
          </div>
          <p className="mt-1 text-sm text-red-600">
            {intelligence.error?.message || 'Unknown error occurred'}
          </p>
        </div>
      )}

      {/* Main Content */}
      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Signal Feed */}
          <div className="lg:col-span-2">
            <RuntimeSignalFeed
              vertical="banking"
              subVertical="employee-banking"
              regions={['UAE']}
              onSignalSelect={handleSignalSelect}
            />
          </div>

          {/* Right Column: Intelligence Panel */}
          <div className="space-y-4">
            {/* HARD GATE: No company selected */}
            {!selectedCompany ? (
              <EmptyIntelligenceState />
            ) : (
              <>
                {/* Selected Company Header */}
                <div className="bg-white rounded-lg border border-neutral-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-neutral-900">
                        {selectedCompany.name}
                      </h2>
                      <p className="text-sm text-neutral-500">
                        {intelligence.signals.length} signals detected
                      </p>
                    </div>
                    <button
                      onClick={handleClearSelection}
                      className="text-xs text-neutral-500 hover:text-neutral-700"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Opportunity Score */}
                <OpportunityScoreCard
                  score={intelligence.score}
                  isLoading={intelligence.isLoading}
                />

                {/* Blockers */}
                <OpportunityBlockers
                  blockers={intelligence.blockers}
                  isLoading={intelligence.isLoading}
                />

                {/* Boosters */}
                <OpportunityBoosters
                  boosters={intelligence.boosters}
                  isLoading={intelligence.isLoading}
                />

                {/* Next Best Action */}
                <NextBestAction
                  action={intelligence.nba}
                  isLoading={intelligence.isLoading}
                  onViewReasoning={handleViewReasoning}
                />
              </>
            )}
          </div>
        </div>
      </main>

      {/* SIVA Reasoning Overlay */}
      <SIVAReasoningOverlay
        reasoning={intelligence.reasoning}
        isOpen={showReasoning}
        onClose={() => setShowReasoning(false)}
        actionTitle={intelligence.nba?.title}
      />
    </div>
  );
}

// =============================================================================
// Empty State Component
// =============================================================================

function EmptyIntelligenceState() {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-8">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-violet-100 mx-auto mb-4 flex items-center justify-center">
          <Target className="w-8 h-8 text-violet-600" />
        </div>
        <h3 className="font-semibold text-neutral-900 mb-2">
          Select a Signal to Load Intelligence
        </h3>
        <p className="text-sm text-neutral-500 max-w-xs mx-auto">
          Click on any signal in the feed to see opportunity scoring,
          blockers, boosters, and recommended next best action.
        </p>
      </div>
    </div>
  );
}
