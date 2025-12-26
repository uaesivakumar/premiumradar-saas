/**
 * Workspace Components Index
 * Sprint S271-S273: Runtime Intelligence Stream
 *
 * Exports all workspace-level intelligence components.
 */

// Existing Workspace Management Components
export { WorkspaceSelector } from './WorkspaceSelector';
export { TeamManager } from './TeamManager';
export { InviteModal } from './InviteModal';
export { PermissionsTable } from './PermissionsTable';

// S271: Runtime Intelligence Feed
export { RuntimeSignalCard, RuntimeSignalCardSkeleton } from './RuntimeSignalCard';
export type { RuntimeSignal } from './RuntimeSignalCard';

export { RuntimeSignalFeed } from './RuntimeSignalFeed';

// S272: Opportunity Strength Scoring
export { OpportunityScoreCard } from './OpportunityScoreCard';
export type { OpportunityScore } from './OpportunityScoreCard';

export { OpportunityBlockers } from './OpportunityBlockers';
export type { Blocker } from './OpportunityBlockers';

export { OpportunityBoosters } from './OpportunityBoosters';
export type { Booster } from './OpportunityBoosters';

export { ScoreHistoryTrend } from './ScoreHistoryTrend';
export type { ScoreDataPoint } from './ScoreHistoryTrend';

// S273: Action Output Panel
export { NextBestAction } from './NextBestAction';
export type { NextBestActionData, ActionType } from './NextBestAction';

export { SIVAReasoningOverlay } from './SIVAReasoningOverlay';
export type { SIVAReasoningData, ReasoningStep } from './SIVAReasoningOverlay';

export { MessagingAngle } from './MessagingAngle';
export type { MessagingAngleData } from './MessagingAngle';

export { ActionHistoryLog } from './ActionHistoryLog';
export type { HistoricalAction, ActionOutcome } from './ActionHistoryLog';

export { ContactRecommendation } from './ContactRecommendation';
export type { RecommendedContact } from './ContactRecommendation';
