'use client';

/**
 * EBJourneyStages - EB Journey Phase 5.1
 *
 * Displays journey stages from VerticalConfig for Employee Banking.
 * Shows the sales journey progression: Discovery → Enrichment → Scoring → Outreach → Engagement
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Database,
  BarChart2,
  Mail,
  Users,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useVerticalConfig, type JourneyStage } from '@/lib/intelligence/hooks/useVerticalConfig';
import { useSalesContext } from '@/lib/intelligence/hooks/useSalesContext';

// =============================================================================
// TYPES
// =============================================================================

interface StageProgress {
  stageId: string;
  completed: number;
  inProgress: number;
  total: number;
}

interface EBJourneyStagesProps {
  /** Current stage counts per stage */
  progress?: StageProgress[];
  /** Active stage ID */
  activeStageId?: string;
  /** Callback when stage is clicked */
  onStageClick?: (stageId: string) => void;
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STAGE_ICONS: Record<string, React.ReactNode> = {
  discovery: <Search className="w-5 h-5" />,
  enrichment: <Database className="w-5 h-5" />,
  scoring: <BarChart2 className="w-5 h-5" />,
  outreach: <Mail className="w-5 h-5" />,
  engagement: <Users className="w-5 h-5" />,
};

const STAGE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  discovery: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  enrichment: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  scoring: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  outreach: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
  engagement: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
};

// Fallback journey stages if VerticalConfig not available
const FALLBACK_STAGES: JourneyStage[] = [
  { id: 'discovery', name: 'Discovery', order: 1, actions: ['signal-detection'], exitCriteria: ['signals-verified'] },
  { id: 'enrichment', name: 'Enrichment', order: 2, actions: ['contact-discovery'], exitCriteria: ['contacts-found'] },
  { id: 'scoring', name: 'Scoring', order: 3, actions: ['qtle-scoring'], exitCriteria: ['score-above-threshold'] },
  { id: 'outreach', name: 'Outreach', order: 4, actions: ['email-personalization'], exitCriteria: ['response-received'] },
  { id: 'engagement', name: 'Engagement', order: 5, actions: ['meeting-prep'], exitCriteria: ['opportunity-created'] },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function EBJourneyStages({
  progress = [],
  activeStageId,
  onStageClick,
  className = '',
}: EBJourneyStagesProps) {
  const { subVerticalName } = useSalesContext();
  const { journeyStages, isLoading, isConfigured } = useVerticalConfig();

  // Use stages from VerticalConfig or fallback
  const stages = useMemo(() => {
    if (journeyStages.length > 0) {
      return journeyStages.sort((a, b) => a.order - b.order);
    }
    return FALLBACK_STAGES;
  }, [journeyStages]);

  // Get progress for a stage
  const getStageProgress = (stageId: string): StageProgress | undefined => {
    return progress.find((p) => p.stageId === stageId);
  };

  // Calculate overall progress percentage
  const overallProgress = useMemo(() => {
    if (progress.length === 0) return 0;
    const totalCompleted = progress.reduce((sum, p) => sum + p.completed, 0);
    const totalItems = progress.reduce((sum, p) => sum + p.total, 0);
    return totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;
  }, [progress]);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-8 ${className}`}>
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading journey stages...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Sales Journey</h3>
          <p className="text-sm text-gray-500">{subVerticalName} pipeline stages</p>
        </div>
        <div className="flex items-center gap-3">
          {!isConfigured && (
            <div className="flex items-center gap-1 text-xs text-amber-600">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Using defaults</span>
            </div>
          )}
          {progress.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-green-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-sm font-medium text-gray-600">{overallProgress}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Journey Timeline */}
      <div className="p-6">
        <div className="relative">
          {/* Connection Line */}
          <div className="absolute top-8 left-8 right-8 h-0.5 bg-gray-200" />
          <div
            className="absolute top-8 left-8 h-0.5 bg-green-500 transition-all duration-500"
            style={{
              width: activeStageId
                ? `${(stages.findIndex((s) => s.id === activeStageId) / Math.max(stages.length - 1, 1)) * 100}%`
                : '0%',
            }}
          />

          {/* Stages */}
          <div className="relative flex justify-between">
            {stages.map((stage, index) => {
              const stageProgress = getStageProgress(stage.id);
              const isActive = activeStageId === stage.id;
              const isPast = activeStageId
                ? stages.findIndex((s) => s.id === activeStageId) > index
                : false;
              const colors = STAGE_COLORS[stage.id] || STAGE_COLORS.discovery;
              const icon = STAGE_ICONS[stage.id] || <Clock className="w-5 h-5" />;

              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => onStageClick?.(stage.id)}
                >
                  {/* Stage Icon */}
                  <div
                    className={`
                      w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all
                      ${isActive ? `${colors.bg} ${colors.border} ${colors.text}` : ''}
                      ${isPast ? 'bg-green-100 border-green-300 text-green-600' : ''}
                      ${!isActive && !isPast ? 'bg-gray-50 border-gray-200 text-gray-400' : ''}
                      ${onStageClick ? 'hover:scale-105' : ''}
                    `}
                  >
                    {isPast ? <CheckCircle2 className="w-6 h-6" /> : icon}
                  </div>

                  {/* Stage Name */}
                  <div className="mt-3 text-center">
                    <div
                      className={`text-sm font-medium ${
                        isActive ? 'text-gray-900' : isPast ? 'text-green-700' : 'text-gray-500'
                      }`}
                    >
                      {stage.name}
                    </div>

                    {/* Progress Count */}
                    {stageProgress && (
                      <div className="text-xs text-gray-400 mt-1">
                        {stageProgress.completed}/{stageProgress.total}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stage Details (if active stage) */}
      {activeStageId && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border-t border-gray-100 px-6 py-4 bg-gray-50"
        >
          {(() => {
            const activeStage = stages.find((s) => s.id === activeStageId);
            if (!activeStage) return null;

            return (
              <div className="grid grid-cols-2 gap-6">
                {/* Actions */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Actions</h4>
                  <ul className="space-y-1">
                    {activeStage.actions.map((action, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        {formatActionName(action)}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Exit Criteria */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Exit Criteria</h4>
                  <ul className="space-y-1">
                    {activeStage.exitCriteria.map((criteria, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        {formatCriteriaName(criteria)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })()}
        </motion.div>
      )}
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatActionName(action: string): string {
  return action
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatCriteriaName(criteria: string): string {
  return criteria
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default EBJourneyStages;
