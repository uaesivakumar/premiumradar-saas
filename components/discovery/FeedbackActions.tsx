'use client';

/**
 * FeedbackActions Component - SAAS_EVENT_ONLY + SAAS_RENDER_ONLY
 *
 * User feedback action buttons for leads.
 *
 * ARCHITECTURE COMPLIANCE:
 * - SaaS ONLY emits events (LIKE, DISLIKE, SAVE, DISMISS)
 * - SaaS NEVER stores feedback or preferences
 * - OS stores feedback, updates preference model, adjusts queue
 * - SaaS renders button states from OS response
 *
 * Architecture: OS decides. SIVA reasons. SaaS renders.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type FeedbackAction = 'LIKE' | 'DISLIKE' | 'SAVE' | 'DISMISS';

interface FeedbackActionsProps {
  companyId: string;
  companyName: string;
  /** Current feedback state from OS (if any) */
  currentFeedback?: FeedbackAction | null;
  /** Whether company is saved (from OS) */
  isSaved?: boolean;
  /** Emit feedback event to OS */
  onFeedback: (companyId: string, action: FeedbackAction, metadata?: Record<string, unknown>) => void;
  /** Compact mode for list view */
  compact?: boolean;
  /** Disable interactions */
  disabled?: boolean;
}

export function FeedbackActions({
  companyId,
  companyName,
  currentFeedback,
  isSaved = false,
  onFeedback,
  compact = false,
  disabled = false,
}: FeedbackActionsProps) {
  const [pendingAction, setPendingAction] = useState<FeedbackAction | null>(null);

  const handleFeedback = async (action: FeedbackAction) => {
    if (disabled || pendingAction) return;

    setPendingAction(action);

    try {
      // SAAS_EVENT_ONLY: Emit event to OS, don't store locally
      await onFeedback(companyId, action, {
        company_name: companyName,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setPendingAction(null);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <CompactButton
          icon="👍"
          active={currentFeedback === 'LIKE'}
          pending={pendingAction === 'LIKE'}
          onClick={() => handleFeedback('LIKE')}
          disabled={disabled}
          title="Like"
        />
        <CompactButton
          icon="👎"
          active={currentFeedback === 'DISLIKE'}
          pending={pendingAction === 'DISLIKE'}
          onClick={() => handleFeedback('DISLIKE')}
          disabled={disabled}
          title="Not interested"
        />
        <CompactButton
          icon={isSaved ? '★' : '☆'}
          active={isSaved}
          pending={pendingAction === 'SAVE'}
          onClick={() => handleFeedback(isSaved ? 'DISMISS' : 'SAVE')}
          disabled={disabled}
          title={isSaved ? 'Remove from saved' : 'Save lead'}
          variant="save"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <FeedbackButton
        icon="👍"
        label="Interested"
        active={currentFeedback === 'LIKE'}
        pending={pendingAction === 'LIKE'}
        onClick={() => handleFeedback('LIKE')}
        disabled={disabled}
        variant="positive"
      />
      <FeedbackButton
        icon="👎"
        label="Not for me"
        active={currentFeedback === 'DISLIKE'}
        pending={pendingAction === 'DISLIKE'}
        onClick={() => handleFeedback('DISLIKE')}
        disabled={disabled}
        variant="negative"
      />
      <FeedbackButton
        icon={isSaved ? '★' : '☆'}
        label={isSaved ? 'Saved' : 'Save'}
        active={isSaved}
        pending={pendingAction === 'SAVE' || pendingAction === 'DISMISS'}
        onClick={() => handleFeedback(isSaved ? 'DISMISS' : 'SAVE')}
        disabled={disabled}
        variant="save"
      />
    </div>
  );
}

interface FeedbackButtonProps {
  icon: string;
  label: string;
  active: boolean;
  pending: boolean;
  onClick: () => void;
  disabled: boolean;
  variant: 'positive' | 'negative' | 'save';
}

function FeedbackButton({
  icon,
  label,
  active,
  pending,
  onClick,
  disabled,
  variant,
}: FeedbackButtonProps) {
  const variantStyles = {
    positive: {
      active: 'bg-green-100 text-green-700 border-green-300',
      hover: 'hover:bg-green-50 hover:border-green-200',
    },
    negative: {
      active: 'bg-red-100 text-red-700 border-red-300',
      hover: 'hover:bg-red-50 hover:border-red-200',
    },
    save: {
      active: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      hover: 'hover:bg-yellow-50 hover:border-yellow-200',
    },
  };

  const style = variantStyles[variant];

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled || pending}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors
        ${active ? style.active : `bg-white border-gray-200 text-gray-600 ${style.hover}`}
        ${disabled || pending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span className="text-base">{pending ? '⏳' : icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </motion.button>
  );
}

interface CompactButtonProps {
  icon: string;
  active: boolean;
  pending: boolean;
  onClick: () => void;
  disabled: boolean;
  title: string;
  variant?: 'positive' | 'negative' | 'save';
}

function CompactButton({
  icon,
  active,
  pending,
  onClick,
  disabled,
  title,
  variant = 'positive',
}: CompactButtonProps) {
  const activeColors = {
    positive: 'bg-green-100 text-green-600',
    negative: 'bg-red-100 text-red-600',
    save: 'bg-yellow-100 text-yellow-600',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.1 }}
      whileTap={{ scale: disabled ? 1 : 0.9 }}
      onClick={onClick}
      disabled={disabled || pending}
      title={title}
      className={`
        p-1.5 rounded-md transition-colors text-sm
        ${active ? activeColors[variant] : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}
        ${disabled || pending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {pending ? '⏳' : icon}
    </motion.button>
  );
}

/**
 * Feedback Summary Component - SAAS_RENDER_ONLY
 * Displays feedback summary from OS
 */
interface FeedbackSummaryProps {
  /** Summary from OS */
  summary: {
    likeCount: number;
    dislikeCount: number;
    saveCount: number;
    totalFeedback: number;
  };
}

export function FeedbackSummary({ summary }: FeedbackSummaryProps) {
  return (
    <div className="flex items-center gap-4 text-sm text-gray-500">
      <span className="flex items-center gap-1">
        <span className="text-green-500">👍</span> {summary.likeCount}
      </span>
      <span className="flex items-center gap-1">
        <span className="text-red-500">👎</span> {summary.dislikeCount}
      </span>
      <span className="flex items-center gap-1">
        <span className="text-yellow-500">★</span> {summary.saveCount}
      </span>
    </div>
  );
}

export default FeedbackActions;
