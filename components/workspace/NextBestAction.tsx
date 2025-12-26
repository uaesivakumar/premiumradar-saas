/**
 * Next Best Action Component
 * Sprint S273: Action Output Panel
 * Feature F3: Next Best Action Card
 *
 * Displays recommended next action:
 * - NBA decides (deterministic)
 * - Clear action with confidence
 * - Traceable to scoring inputs
 *
 * Architecture: NBA decides, SIVA explains. NBA is deterministic.
 */

'use client';

import React from 'react';
import {
  Target,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Users,
  FileText,
  Send,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export type ActionType =
  | 'call'
  | 'email'
  | 'meeting'
  | 'message'
  | 'connect'
  | 'research'
  | 'follow-up';

export interface NextBestActionData {
  id: string;
  type: ActionType;
  title: string;
  description: string;
  confidence: number; // 0-100
  priority: 'urgent' | 'high' | 'medium' | 'low';
  targetContact?: {
    name: string;
    title: string;
    email?: string;
    phone?: string;
  };
  timing?: {
    suggested: string;
    reason: string;
  };
  inputs: {
    signalCount: number;
    opportunityScore: number;
    blockerCount: number;
    boosterCount: number;
  };
  generatedAt: string;
}

interface NextBestActionProps {
  action: NextBestActionData | null;
  isLoading?: boolean;
  onExecute?: () => void;
  onViewReasoning?: () => void;
}

// =============================================================================
// Action Type Configuration
// =============================================================================

const ACTION_TYPE_CONFIG: Record<ActionType, {
  icon: typeof Phone;
  color: string;
  bg: string;
  label: string;
}> = {
  call: { icon: Phone, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Make a Call' },
  email: { icon: Mail, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Send Email' },
  meeting: { icon: Calendar, color: 'text-violet-600', bg: 'bg-violet-100', label: 'Schedule Meeting' },
  message: { icon: MessageSquare, color: 'text-cyan-600', bg: 'bg-cyan-100', label: 'Send Message' },
  connect: { icon: Users, color: 'text-pink-600', bg: 'bg-pink-100', label: 'Connect' },
  research: { icon: FileText, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Research' },
  'follow-up': { icon: Send, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Follow Up' },
};

const PRIORITY_CONFIG: Record<string, { border: string; badge: string }> = {
  urgent: { border: 'border-red-300', badge: 'bg-red-100 text-red-700' },
  high: { border: 'border-orange-300', badge: 'bg-orange-100 text-orange-700' },
  medium: { border: 'border-yellow-300', badge: 'bg-yellow-100 text-yellow-700' },
  low: { border: 'border-neutral-300', badge: 'bg-neutral-100 text-neutral-600' },
};

// =============================================================================
// Component
// =============================================================================

export function NextBestAction({
  action,
  isLoading = false,
  onExecute,
  onViewReasoning,
}: NextBestActionProps) {
  if (isLoading) {
    return <ActionSkeleton />;
  }

  if (!action) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-neutral-100 mx-auto mb-3 flex items-center justify-center">
            <Target className="w-6 h-6 text-neutral-400" />
          </div>
          <h4 className="font-medium text-neutral-900 mb-1">No Action Recommended</h4>
          <p className="text-sm text-neutral-500">
            Insufficient data to recommend next best action.
          </p>
        </div>
      </div>
    );
  }

  const typeConfig = ACTION_TYPE_CONFIG[action.type];
  const priorityConfig = PRIORITY_CONFIG[action.priority];
  const Icon = typeConfig.icon;

  return (
    <div className={`bg-white rounded-lg border-2 ${priorityConfig.border} overflow-hidden`}>
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-violet-50 to-white border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-violet-600" />
            <h3 className="font-semibold text-neutral-900">Next Best Action</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityConfig.badge}`}>
              {action.priority.toUpperCase()}
            </span>
            <span className="text-xs text-neutral-500">
              {action.confidence}% confidence
            </span>
          </div>
        </div>
      </div>

      {/* Action */}
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`p-3 rounded-xl ${typeConfig.bg}`}>
            <Icon className={`w-6 h-6 ${typeConfig.color}`} />
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-medium ${typeConfig.color}`}>
                {typeConfig.label}
              </span>
            </div>
            <h4 className="font-semibold text-neutral-900 text-lg mb-1">{action.title}</h4>
            <p className="text-sm text-neutral-600">{action.description}</p>

            {/* Target Contact */}
            {action.targetContact && (
              <div className="mt-3 p-2.5 bg-neutral-50 rounded-lg">
                <div className="text-xs text-neutral-500 mb-1">Target Contact</div>
                <div className="font-medium text-neutral-900">{action.targetContact.name}</div>
                <div className="text-sm text-neutral-600">{action.targetContact.title}</div>
                {action.targetContact.email && (
                  <div className="text-xs text-blue-600 mt-1">{action.targetContact.email}</div>
                )}
              </div>
            )}

            {/* Timing */}
            {action.timing && (
              <div className="mt-3 flex items-start gap-2">
                <Calendar className="w-4 h-4 text-neutral-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-neutral-900">{action.timing.suggested}</div>
                  <div className="text-xs text-neutral-500">{action.timing.reason}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inputs Summary */}
      <div className="px-4 py-2 bg-neutral-50 border-t border-neutral-100">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center gap-3">
            <span>Based on: {action.inputs.signalCount} signals</span>
            <span>Score: {action.inputs.opportunityScore}</span>
            <span>{action.inputs.boosterCount} boosters</span>
            <span>{action.inputs.blockerCount} blockers</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-neutral-100">
        <button
          onClick={onViewReasoning}
          className="flex items-center gap-1 text-sm text-violet-600 hover:text-violet-800 font-medium"
        >
          <Sparkles className="w-4 h-4" />
          View SIVA Reasoning
        </button>
        {onExecute && (
          <button
            onClick={onExecute}
            className="flex items-center gap-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Execute Action
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Skeleton
// =============================================================================

function ActionSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 animate-pulse">
      <div className="px-4 py-3 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div className="w-32 h-5 bg-neutral-200 rounded" />
          <div className="w-20 h-4 bg-neutral-200 rounded" />
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-neutral-200 rounded-xl" />
          <div className="flex-1">
            <div className="w-20 h-4 bg-neutral-200 rounded mb-2" />
            <div className="w-48 h-6 bg-neutral-200 rounded mb-2" />
            <div className="w-full h-4 bg-neutral-200 rounded" />
          </div>
        </div>
      </div>
      <div className="px-4 py-3 border-t border-neutral-100">
        <div className="flex items-center justify-between">
          <div className="w-32 h-4 bg-neutral-200 rounded" />
          <div className="w-28 h-9 bg-neutral-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default NextBestAction;
