'use client';

/**
 * FocusedLeadReview - S396: Post-CTA Transition
 *
 * When user clicks "Start with saved leads", this component takes over.
 * No navigation. The canvas morphs into a single lead card.
 *
 * FLOW:
 * 1. Show company card with Enrich button
 * 2. User clicks Enrich → trigger enrichment pipeline
 * 3. Show enriched contacts (ranked by QTLE)
 *
 * RULES (LOCKED):
 * - ONE lead at a time
 * - No list view, no table
 * - Background stays dark, calm, continuous
 * - After action, auto-advance to next
 */

import React, { useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Card } from '@/lib/workspace/card-state';
import { EnrichedContactsView } from './EnrichedContactsView';

interface FocusedLeadReviewProps {
  lead: Card;
  position: { current: number; total: number };
  onAction: (leadId: string, actionId: string) => void;
  onExit: () => void;
}

export function FocusedLeadReview({
  lead,
  position,
  onAction,
  onExit,
}: FocusedLeadReviewProps) {
  // Enrichment state
  const [enrichmentState, setEnrichmentState] = useState<'idle' | 'enriching' | 'complete'>('idle');
  const [enrichmentSessionId, setEnrichmentSessionId] = useState<string | null>(null);
  const [enrichmentError, setEnrichmentError] = useState<string | null>(null);

  // Check for existing enrichment on mount
  useEffect(() => {
    const expanded = lead.expandedContent as { enrichmentSessionId?: string } | undefined;
    if (expanded?.enrichmentSessionId) {
      setEnrichmentSessionId(expanded.enrichmentSessionId);
      setEnrichmentState('complete');
    }
  }, [lead.expandedContent]);

  const handleAction = useCallback(async (actionId: string) => {
    if (actionId === 'enrich') {
      // Start enrichment
      setEnrichmentState('enriching');
      setEnrichmentError(null);

      try {
        const response = await fetch('/api/enrichment/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            entityId: lead.entityId || lead.id,
            entityName: lead.title,
            subVertical: 'employee-banking',
            region: 'UAE',
            maxContacts: 10,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Enrichment failed');
        }

        setEnrichmentSessionId(result.sessionId);
        setEnrichmentState('complete');

        // Also trigger the standard action flow (updates card status)
        onAction(lead.id, actionId);
      } catch (error) {
        console.error('[FocusedLeadReview] Enrichment error:', error);
        setEnrichmentError(error instanceof Error ? error.message : 'Enrichment failed');
        setEnrichmentState('idle');
      }
    } else {
      // Other actions (save, skip)
      onAction(lead.id, actionId);
    }
  }, [lead.id, lead.entityId, lead.title, onAction]);

  const handleBackFromContacts = useCallback(() => {
    setEnrichmentState('idle');
    setEnrichmentSessionId(null);
  }, []);

  // Extract key info from lead
  const companyName = lead.title || 'Unknown Company';
  const reasons = lead.reasoning || [];
  const summary = lead.summary || '';
  const tags = lead.tags || [];

  // Show enriched contacts view
  if (enrichmentState === 'complete' && enrichmentSessionId) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col"
      >
        <EnrichedContactsView
          sessionId={enrichmentSessionId}
          companyName={companyName}
          onBack={handleBackFromContacts}
        />

        {/* Progress indicator */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="text-xs text-gray-600">
            {position.current} of {position.total} saved leads
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col"
    >
      {/* Status line - subtle, top-left aligned */}
      <div className="flex items-center justify-between mb-8">
        <p className="text-xs text-gray-500">
          Reviewing highest-priority saved lead
        </p>
        <button
          onClick={onExit}
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          Exit review
        </button>
      </div>

      {/* Lead card - single, focused */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 border border-white/10 rounded-xl p-6"
      >
        {/* Company name - prominent */}
        <h2 className="text-2xl font-medium text-white mb-4">
          {companyName}
        </h2>

        {/* Summary - what this lead is about */}
        {summary && (
          <p className="text-sm text-gray-400 mb-4">
            {summary}
          </p>
        )}

        {/* Why this lead matters now - 1-2 bullets max */}
        {reasons.length > 0 && (
          <div className="mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              Why now
            </p>
            <ul className="space-y-1">
              {reasons.slice(0, 2).map((reason, i) => (
                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                  <span className="text-gray-500 mt-1">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tags if available */}
        {tags.length > 0 && (
          <div className="mb-6 flex items-center gap-2 flex-wrap">
            {tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="px-2 py-0.5 bg-white/10 rounded text-xs text-gray-400">
                {tag.replace(/-/g, ' ')}
              </span>
            ))}
          </div>
        )}

        {/* Enrichment error */}
        {enrichmentError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{enrichmentError}</p>
          </div>
        )}

        {/* Primary actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-white/5">
          <button
            onClick={() => handleAction('enrich')}
            disabled={enrichmentState === 'enriching'}
            className="px-4 py-2 bg-white text-slate-950 font-medium rounded-lg
                       hover:bg-gray-100 transition-colors text-sm
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2"
          >
            {enrichmentState === 'enriching' ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                Finding contacts...
              </>
            ) : (
              'Enrich'
            )}
          </button>
          <button
            onClick={() => handleAction('save')}
            disabled={enrichmentState === 'enriching'}
            className="px-4 py-2 bg-white/10 text-white rounded-lg
                       hover:bg-white/15 transition-colors text-sm
                       disabled:opacity-50"
          >
            Save for later
          </button>
          <button
            onClick={() => handleAction('skip')}
            disabled={enrichmentState === 'enriching'}
            className="px-4 py-2 text-gray-500 hover:text-gray-300
                       transition-colors text-sm disabled:opacity-50"
          >
            Skip
          </button>
        </div>
      </motion.div>

      {/* Progress indicator - subtle */}
      <div className="mt-6 flex items-center justify-center gap-2">
        <span className="text-xs text-gray-600">
          {position.current} of {position.total} saved leads
        </span>
      </div>
    </motion.div>
  );
}

export default FocusedLeadReview;
