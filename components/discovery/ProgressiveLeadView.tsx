'use client';

/**
 * ProgressiveLeadView Component - SAAS_RENDER_ONLY + SAAS_EVENT_ONLY
 *
 * Progressive lead delivery UI that renders batches from OS.
 *
 * ARCHITECTURE COMPLIANCE:
 * - SaaS ONLY renders leads from OS batch response
 * - SaaS NEVER decides what leads to show or batch size
 * - SaaS emits SHOW_MORE event to OS
 * - OS decides when to deliver next batch
 * - OS enforces feedback-before-next rule
 *
 * Architecture: OS decides. SIVA reasons. SaaS renders.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FeedbackActions, type FeedbackAction } from './FeedbackActions';

interface Lead {
  company_id: string;
  name: string;
  industry?: string;
  location?: string;
  size_bucket?: string;
  score: number;
  signals?: Array<{ type: string; description?: string }>;
  feedback?: FeedbackAction | null;
}

interface BatchResponse {
  leads: Lead[];
  batchNumber: number;
  hasMore: boolean;
  remaining: number;
  requiresFeedback?: boolean;
  stats?: {
    shown: number;
    totalLeads: number;
    likeCount: number;
    dislikeCount: number;
    saveCount: number;
  };
}

interface ProgressiveLeadViewProps {
  /** Current batch from OS */
  batch: BatchResponse;
  /** Session ID */
  sessionId: string;
  /** Loading state */
  isLoading?: boolean;
  /** Error message from OS */
  error?: string | null;
  /** Emit feedback event to OS */
  onFeedback: (companyId: string, action: FeedbackAction, metadata?: Record<string, unknown>) => void;
  /** Request next batch from OS */
  onShowMore: () => void;
  /** View lead details */
  onViewLead: (companyId: string) => void;
}

export function ProgressiveLeadView({
  batch,
  sessionId,
  isLoading = false,
  error,
  onFeedback,
  onShowMore,
  onViewLead,
}: ProgressiveLeadViewProps) {
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  // SAAS_RENDER_ONLY: Render feedback requirement message from OS
  if (batch.requiresFeedback) {
    return (
      <div className="p-6">
        {/* Current leads */}
        <LeadList
          leads={batch.leads}
          expandedLead={expandedLead}
          onExpand={setExpandedLead}
          onFeedback={onFeedback}
          onViewLead={onViewLead}
        />

        {/* Feedback Required Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-center"
        >
          <div className="text-2xl mb-2">👆</div>
          <h3 className="font-medium text-amber-800">Feedback needed</h3>
          <p className="text-sm text-amber-700 mt-1">
            Please provide feedback on the current leads before seeing more
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Progress Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">
            Batch {batch.batchNumber}
          </span>
          {batch.stats && (
            <span className="text-sm text-gray-500">
              {batch.stats.shown} of {batch.stats.totalLeads} leads shown
            </span>
          )}
        </div>

        {/* Progress Bar - SAAS_RENDER_ONLY from OS stats */}
        {batch.stats && (
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${(batch.stats.shown / batch.stats.totalLeads) * 100}%`,
              }}
              className="h-full bg-blue-500 rounded-full"
            />
          </div>
        )}

        {/* Quick Stats - SAAS_RENDER_ONLY from OS */}
        {batch.stats && (
          <div className="flex items-center gap-4 mt-3 text-sm">
            <span className="flex items-center gap-1 text-green-600">
              <span>👍</span> {batch.stats.likeCount}
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <span>👎</span> {batch.stats.dislikeCount}
            </span>
            <span className="flex items-center gap-1 text-yellow-600">
              <span>★</span> {batch.stats.saveCount}
            </span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Lead List */}
      <div className="flex-1 overflow-y-auto p-4">
        <LeadList
          leads={batch.leads}
          expandedLead={expandedLead}
          onExpand={setExpandedLead}
          onFeedback={onFeedback}
          onViewLead={onViewLead}
        />
      </div>

      {/* Show More Button - SAAS_EVENT_ONLY */}
      {batch.hasMore && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onShowMore}
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Loading...
              </span>
            ) : (
              <span>
                Show More ({batch.remaining} remaining)
              </span>
            )}
          </button>
        </div>
      )}

      {/* No More Leads */}
      {!batch.hasMore && batch.leads.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-500">
            All leads shown for this session
          </p>
        </div>
      )}
    </div>
  );
}

interface LeadListProps {
  leads: Lead[];
  expandedLead: string | null;
  onExpand: (id: string | null) => void;
  onFeedback: (companyId: string, action: FeedbackAction, metadata?: Record<string, unknown>) => void;
  onViewLead: (companyId: string) => void;
}

function LeadList({ leads, expandedLead, onExpand, onFeedback, onViewLead }: LeadListProps) {
  return (
    <div className="space-y-3">
      <AnimatePresence>
        {leads.map((lead, index) => (
          <motion.div
            key={lead.company_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.05 }}
          >
            <LeadCard
              lead={lead}
              expanded={expandedLead === lead.company_id}
              onExpand={() =>
                onExpand(expandedLead === lead.company_id ? null : lead.company_id)
              }
              onFeedback={onFeedback}
              onViewLead={onViewLead}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface LeadCardProps {
  lead: Lead;
  expanded: boolean;
  onExpand: () => void;
  onFeedback: (companyId: string, action: FeedbackAction, metadata?: Record<string, unknown>) => void;
  onViewLead: (companyId: string) => void;
}

function LeadCard({ lead, expanded, onExpand, onFeedback, onViewLead }: LeadCardProps) {
  const scoreColor =
    lead.score >= 80
      ? 'bg-green-500'
      : lead.score >= 60
        ? 'bg-blue-500'
        : lead.score >= 40
          ? 'bg-yellow-500'
          : 'bg-gray-500';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Main Content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Score */}
          <div
            className={`w-12 h-12 rounded-lg ${scoreColor} text-white flex items-center justify-center font-bold text-lg flex-shrink-0`}
          >
            {lead.score}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-gray-900 dark:text-white truncate cursor-pointer hover:text-blue-600"
              onClick={() => onViewLead(lead.company_id)}
            >
              {lead.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
              {lead.industry && <span>{lead.industry}</span>}
              {lead.industry && lead.location && <span>•</span>}
              {lead.location && <span>{lead.location}</span>}
              {lead.size_bucket && (
                <>
                  <span>•</span>
                  <span className="capitalize">{lead.size_bucket}</span>
                </>
              )}
            </div>
          </div>

          {/* Expand Button */}
          <button
            onClick={onExpand}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              className="block"
            >
              ▼
            </motion.span>
          </button>
        </div>

        {/* Signals Preview */}
        {lead.signals && lead.signals.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {lead.signals.slice(0, 3).map((signal, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full"
              >
                {signal.type}
              </span>
            ))}
            {lead.signals.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{lead.signals.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Feedback Actions - SAAS_EVENT_ONLY */}
        <div className="mt-4">
          <FeedbackActions
            companyId={lead.company_id}
            companyName={lead.name}
            currentFeedback={lead.feedback}
            isSaved={lead.feedback === 'SAVE'}
            onFeedback={(companyId, action, metadata) =>
              onFeedback(companyId, action, {
                ...metadata,
                industry: lead.industry,
                size_bucket: lead.size_bucket,
                location: lead.location,
              })
            }
          />
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && lead.signals && lead.signals.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
          >
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Signals
              </h4>
              <div className="space-y-2">
                {lead.signals.map((signal, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-sm"
                  >
                    <span className="text-purple-500">•</span>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {signal.type}
                      </span>
                      {signal.description && (
                        <p className="text-gray-500 mt-0.5">
                          {signal.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ProgressiveLeadView;
