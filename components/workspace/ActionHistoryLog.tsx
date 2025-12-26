/**
 * Action History Log Component
 * Sprint S273: Action Output Panel
 * Feature F5: Action History Log
 *
 * Displays past actions taken on an opportunity:
 * - Action timeline
 * - Outcome tracking
 * - Feedback loop
 *
 * Architecture: Read-only, derived data only
 */

'use client';

import React from 'react';
import {
  History,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Users,
  FileText,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export type ActionOutcome = 'completed' | 'no-response' | 'declined' | 'rescheduled' | 'pending';

export interface HistoricalAction {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'message' | 'connect' | 'research' | 'follow-up';
  title: string;
  description?: string;
  outcome: ActionOutcome;
  performedAt: string;
  performedBy?: string;
  contactName?: string;
  notes?: string;
  followUpScheduled?: string;
}

interface ActionHistoryLogProps {
  actions: HistoricalAction[];
  isLoading?: boolean;
  maxDisplay?: number;
  showExpandAll?: boolean;
}

// =============================================================================
// Configuration
// =============================================================================

const ACTION_TYPE_ICONS: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  message: MessageSquare,
  connect: Users,
  research: FileText,
  'follow-up': Send,
};

const OUTCOME_CONFIG: Record<ActionOutcome, { icon: typeof CheckCircle2; color: string; label: string }> = {
  completed: { icon: CheckCircle2, color: 'text-emerald-600', label: 'Completed' },
  'no-response': { icon: Clock, color: 'text-amber-600', label: 'No Response' },
  declined: { icon: XCircle, color: 'text-red-600', label: 'Declined' },
  rescheduled: { icon: Calendar, color: 'text-blue-600', label: 'Rescheduled' },
  pending: { icon: Clock, color: 'text-neutral-500', label: 'Pending' },
};

// =============================================================================
// Component
// =============================================================================

export function ActionHistoryLog({
  actions,
  isLoading = false,
  maxDisplay = 5,
  showExpandAll = true,
}: ActionHistoryLogProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (isLoading) {
    return <HistorySkeleton count={3} />;
  }

  if (actions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-neutral-100 mx-auto mb-3 flex items-center justify-center">
            <History className="w-6 h-6 text-neutral-400" />
          </div>
          <h4 className="font-medium text-neutral-900 mb-1">No Action History</h4>
          <p className="text-sm text-neutral-500">
            No actions have been taken on this opportunity yet.
          </p>
        </div>
      </div>
    );
  }

  // Sort by date (newest first)
  const sortedActions = [...actions].sort(
    (a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
  );

  const displayedActions = isExpanded ? sortedActions : sortedActions.slice(0, maxDisplay);
  const hasMore = actions.length > maxDisplay;

  // Calculate stats
  const completedCount = actions.filter((a) => a.outcome === 'completed').length;
  const responseRate = Math.round((completedCount / actions.length) * 100);

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-neutral-600" />
          <h3 className="font-semibold text-neutral-900">Action History</h3>
          <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
            {actions.length}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <span>{completedCount} completed</span>
          <span>•</span>
          <span>{responseRate}% response rate</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-7 top-0 bottom-0 w-px bg-neutral-200" />

        <div className="divide-y divide-neutral-100">
          {displayedActions.map((action, index) => (
            <ActionRow key={action.id} action={action} isLast={index === displayedActions.length - 1} />
          ))}
        </div>
      </div>

      {/* Expand/Collapse */}
      {showExpandAll && hasMore && (
        <div className="px-4 py-2 bg-neutral-50 border-t border-neutral-100">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-medium w-full justify-center"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Show all {actions.length} actions
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Action Row
// =============================================================================

function ActionRow({ action, isLast }: { action: HistoricalAction; isLast: boolean }) {
  const TypeIcon = ACTION_TYPE_ICONS[action.type] || Send;
  const outcomeConfig = OUTCOME_CONFIG[action.outcome];
  const OutcomeIcon = outcomeConfig.icon;

  return (
    <div className="px-4 py-3 relative">
      <div className="flex items-start gap-3">
        {/* Timeline dot */}
        <div className="relative z-10 w-6 h-6 rounded-full bg-white border-2 border-neutral-200 flex items-center justify-center">
          <TypeIcon className="w-3 h-3 text-neutral-600" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <h4 className="text-sm font-medium text-neutral-900 truncate">{action.title}</h4>
            <div className={`flex items-center gap-1 ${outcomeConfig.color}`}>
              <OutcomeIcon className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{outcomeConfig.label}</span>
            </div>
          </div>

          {action.description && (
            <p className="text-xs text-neutral-600 mb-1">{action.description}</p>
          )}

          <div className="flex items-center gap-3 text-[10px] text-neutral-500">
            <span>{formatDateTime(action.performedAt)}</span>
            {action.contactName && (
              <>
                <span>•</span>
                <span>Contact: {action.contactName}</span>
              </>
            )}
            {action.performedBy && (
              <>
                <span>•</span>
                <span>By: {action.performedBy}</span>
              </>
            )}
          </div>

          {action.notes && (
            <div className="mt-2 p-2 bg-neutral-50 rounded text-xs text-neutral-600">
              {action.notes}
            </div>
          )}

          {action.followUpScheduled && (
            <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
              <Calendar className="w-3 h-3" />
              <span>Follow-up: {formatDateTime(action.followUpScheduled)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Skeleton
// =============================================================================

function HistorySkeleton({ count }: { count: number }) {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 animate-pulse">
      <div className="px-4 py-3 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div className="w-28 h-5 bg-neutral-200 rounded" />
          <div className="w-32 h-4 bg-neutral-200 rounded" />
        </div>
      </div>
      <div className="divide-y divide-neutral-100">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-neutral-200 rounded-full" />
              <div className="flex-1">
                <div className="w-48 h-4 bg-neutral-200 rounded mb-2" />
                <div className="w-full h-3 bg-neutral-200 rounded mb-1" />
                <div className="w-32 h-2 bg-neutral-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Utilities
// =============================================================================

function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default ActionHistoryLog;
