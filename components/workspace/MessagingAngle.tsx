/**
 * Messaging Angle Component
 * Sprint S273: Action Output Panel
 * Feature F1: Messaging Angle
 *
 * Displays recommended messaging angles for outreach:
 * - Hook suggestions
 * - Value propositions
 * - Talking points
 *
 * Architecture: Derived from signals + context. Read-only.
 */

'use client';

import React from 'react';
import {
  MessageSquare,
  Lightbulb,
  Target,
  ChevronRight,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface MessagingAngleData {
  id: string;
  type: 'hook' | 'value-prop' | 'talking-point' | 'opener';
  title: string;
  content: string;
  relevance: number; // 0-100
  basedOn: string; // What signal/data this is based on
}

interface MessagingAngleProps {
  angles: MessagingAngleData[];
  isLoading?: boolean;
  companyName?: string;
  onCopy?: (angle: MessagingAngleData) => void;
}

// =============================================================================
// Type Configuration
// =============================================================================

const ANGLE_TYPE_CONFIG: Record<string, { icon: typeof Lightbulb; color: string; label: string }> = {
  hook: { icon: Target, color: 'text-violet-600', label: 'Hook' },
  'value-prop': { icon: Sparkles, color: 'text-emerald-600', label: 'Value Prop' },
  'talking-point': { icon: MessageSquare, color: 'text-blue-600', label: 'Talking Point' },
  opener: { icon: Lightbulb, color: 'text-amber-600', label: 'Opener' },
};

// =============================================================================
// Component
// =============================================================================

export function MessagingAngle({
  angles,
  isLoading = false,
  companyName,
  onCopy,
}: MessagingAngleProps) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = async (angle: MessagingAngleData) => {
    try {
      await navigator.clipboard.writeText(angle.content);
      setCopiedId(angle.id);
      setTimeout(() => setCopiedId(null), 2000);
      onCopy?.(angle);
    } catch {
      // Clipboard API not available
    }
  };

  if (isLoading) {
    return <AnglesSkeleton />;
  }

  if (angles.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-neutral-100 mx-auto mb-3 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-neutral-400" />
          </div>
          <h4 className="font-medium text-neutral-900 mb-1">No Messaging Angles</h4>
          <p className="text-sm text-neutral-500">
            Insufficient data to suggest messaging angles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-r from-violet-50 to-white">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-violet-600" />
          <h3 className="font-semibold text-neutral-900">Messaging Angles</h3>
          {companyName && (
            <span className="text-xs text-neutral-500">for {companyName}</span>
          )}
        </div>
        <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
          {angles.length} suggestions
        </span>
      </div>

      {/* Angles List */}
      <div className="divide-y divide-neutral-100">
        {angles.map((angle) => (
          <AngleRow
            key={angle.id}
            angle={angle}
            isCopied={copiedId === angle.id}
            onCopy={() => handleCopy(angle)}
          />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Angle Row
// =============================================================================

function AngleRow({
  angle,
  isCopied,
  onCopy,
}: {
  angle: MessagingAngleData;
  isCopied: boolean;
  onCopy: () => void;
}) {
  const config = ANGLE_TYPE_CONFIG[angle.type] || ANGLE_TYPE_CONFIG.hook;
  const Icon = config.icon;

  return (
    <div className="px-4 py-3 hover:bg-neutral-50 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${config.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
            <span className="text-xs text-neutral-400">•</span>
            <span className="text-xs text-neutral-500">
              {angle.relevance}% relevant
            </span>
          </div>
          <h4 className="text-sm font-medium text-neutral-900 mb-1">{angle.title}</h4>
          <p className="text-sm text-neutral-600 leading-relaxed">{angle.content}</p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-[10px] text-neutral-400">
              <ChevronRight className="w-3 h-3" />
              <span>Based on: {angle.basedOn}</span>
            </div>
            <button
              onClick={onCopy}
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-violet-600 transition-colors"
            >
              {isCopied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Skeleton
// =============================================================================

function AnglesSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 animate-pulse">
      <div className="px-4 py-3 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div className="w-32 h-5 bg-neutral-200 rounded" />
          <div className="w-20 h-4 bg-neutral-200 rounded" />
        </div>
      </div>
      <div className="divide-y divide-neutral-100">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 bg-neutral-200 rounded" />
              <div className="flex-1">
                <div className="w-24 h-3 bg-neutral-200 rounded mb-2" />
                <div className="w-40 h-4 bg-neutral-200 rounded mb-2" />
                <div className="w-full h-10 bg-neutral-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MessagingAngle;
